import { randomUUID } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  ClaimedParentUpdate,
  ParentUpdateRepository,
  ParentUpdateSubscription,
  ParentUpdateSubscriptionWrite,
} from "./parent-updates";
import { resolveTrialAccessByToken } from "./trial-token-server";

interface SubscriptionRow {
  id: string;
  trial_access_id: string;
  normalized_email: string;
  verification_token_hash: string;
  unsubscribe_token_hash: string;
  verification_version: number;
  unsubscribe_version: number;
  verification_expires_at: string;
  verification_requested_at: string | null;
  verified_at: string | null;
  unsubscribed_at: string | null;
  revoked_at: string | null;
  last_progress_delivered_at: string | null;
}

function mapSubscription(row: SubscriptionRow): ParentUpdateSubscription {
  return {
    id: row.id,
    trialAccessId: row.trial_access_id,
    normalizedEmail: row.normalized_email,
    verificationTokenHash: row.verification_token_hash,
    unsubscribeTokenHash: row.unsubscribe_token_hash,
    verificationVersion: row.verification_version,
    unsubscribeVersion: row.unsubscribe_version,
    verificationExpiresAt: row.verification_expires_at,
    verificationRequestedAt: row.verification_requested_at,
    verifiedAt: row.verified_at,
    unsubscribedAt: row.unsubscribed_at,
    revokedAt: row.revoked_at,
    lastProgressDeliveredAt: row.last_progress_delivered_at,
  };
}

function dbSubscription(input: ParentUpdateSubscriptionWrite) {
  return {
    id: input.id,
    trial_access_id: input.trialAccessId,
    normalized_email: input.normalizedEmail,
    consented_at: input.consentedAt,
    attested_at: input.attestedAt,
    verification_token_hash: input.verificationTokenHash,
    verification_version: input.verificationVersion,
    verification_expires_at: input.verificationExpiresAt,
    verification_requested_at: input.verificationRequestedAt,
    verified_at: input.verifiedAt,
    unsubscribe_token_hash: input.unsubscribeTokenHash,
    unsubscribe_version: input.unsubscribeVersion,
    unsubscribed_at: input.unsubscribedAt,
    revoked_at: input.revokedAt,
  };
}

const SUBSCRIPTION_COLUMNS = `
  id, trial_access_id, normalized_email,
  verification_token_hash, verification_version,
  verification_expires_at, verification_requested_at, verified_at,
  unsubscribe_token_hash, unsubscribe_version, unsubscribed_at, revoked_at,
  last_progress_delivered_at
`;

async function mutateLease(
  serviceClient: SupabaseClient,
  input: {
    subscriptionId: string;
    leaseToken: string;
    ids: string[];
    action: "delivered" | "rescheduled" | "failed";
    at: string;
    errorCode: string | null;
    scheduledAt: string | null;
    incrementAttempt: boolean;
    isProgress: boolean;
  }
): Promise<boolean> {
  const { data, error } = await serviceClient.rpc(
    "mutate_parent_pathlab_update_lease",
    {
      p_subscription_id: input.subscriptionId,
      p_lease_token: input.leaseToken,
      p_ids: input.ids,
      p_action: input.action,
      p_at: input.at,
      p_error_code: input.errorCode,
      p_scheduled_at: input.scheduledAt,
      p_increment_attempt: input.incrementAttempt,
      p_is_progress: input.isProgress,
    }
  );
  if (error) throw error;
  return data === true;
}

export async function cancelParentUpdateDeliveries(
  serviceClient: SupabaseClient,
  subscriptionId: string,
  errorCode: "subscription_unsubscribed" | "subscription_revoked" | "subscription_inactive",
  at = new Date().toISOString()
): Promise<void> {
  const action = {
    subscription_unsubscribed: "unsubscribe",
    subscription_revoked: "revoke",
    subscription_inactive: "inactive_cleanup",
  }[errorCode];
  const { error } = await serviceClient.rpc(
    "deactivate_parent_pathlab_subscription",
    {
      p_subscription_id: subscriptionId,
      p_at: at,
      p_action: action,
    }
  );
  if (error) throw error;
}

export async function revokeParentUpdatesForTrial(
  serviceClient: SupabaseClient,
  trialAccessId: string,
  revokedAt: string
): Promise<void> {
  const { data, error } = await serviceClient
    .from("parent_pathlab_subscriptions")
    .select("id")
    .eq("trial_access_id", trialAccessId)
    .maybeSingle();
  if (error) throw error;
  if (data?.id) {
    await cancelParentUpdateDeliveries(
      serviceClient,
      data.id,
      "subscription_revoked",
      revokedAt
    );
  }
}

export function createParentUpdateRepository(
  serviceClient: SupabaseClient
): ParentUpdateRepository {
  return {
    async resolveTrialByPayToken(token) {
      const trial = await resolveTrialAccessByToken(serviceClient, token);
      return trial
        ? { id: trial.id, seedTitle: trial.seedTitle }
        : null;
    },
    async findByTrialAccessId(trialAccessId) {
      const { data, error } = await serviceClient
        .from("parent_pathlab_subscriptions")
        .select(SUBSCRIPTION_COLUMNS)
        .eq("trial_access_id", trialAccessId)
        .maybeSingle();
      if (error) throw error;
      return data ? mapSubscription(data as SubscriptionRow) : null;
    },
    async saveSubscription(input) {
      const { data, error } = await serviceClient
        .from("parent_pathlab_subscriptions")
        .upsert(dbSubscription(input), { onConflict: "trial_access_id" })
        .select(SUBSCRIPTION_COLUMNS)
        .single();
      if (error) throw error;
      return mapSubscription(data as SubscriptionRow);
    },
    async findByVerificationHash(hash) {
      const { data, error } = await serviceClient
        .from("parent_pathlab_subscriptions")
        .select(SUBSCRIPTION_COLUMNS)
        .eq("verification_token_hash", hash)
        .maybeSingle();
      if (error) throw error;
      return data ? mapSubscription(data as SubscriptionRow) : null;
    },
    async findByUnsubscribeHash(hash) {
      const { data, error } = await serviceClient
        .from("parent_pathlab_subscriptions")
        .select(SUBSCRIPTION_COLUMNS)
        .eq("unsubscribe_token_hash", hash)
        .maybeSingle();
      if (error) throw error;
      return data ? mapSubscription(data as SubscriptionRow) : null;
    },
    async markVerified(id, verifiedAt) {
      const { data, error } = await serviceClient
        .from("parent_pathlab_subscriptions")
        .update({ verified_at: verifiedAt, unsubscribed_at: null, revoked_at: null })
        .eq("id", id)
        .select(SUBSCRIPTION_COLUMNS)
        .single();
      if (error) throw error;
      return mapSubscription(data as SubscriptionRow);
    },
    async markUnsubscribed(id, unsubscribedAt) {
      await cancelParentUpdateDeliveries(
        serviceClient,
        id,
        "subscription_unsubscribed",
        unsubscribedAt
      );
      const { data, error } = await serviceClient
        .from("parent_pathlab_subscriptions")
        .select(SUBSCRIPTION_COLUMNS)
        .eq("id", id)
        .single();
      if (error) throw error;
      return mapSubscription(data as SubscriptionRow);
    },
    async renewLease(subscriptionId, leaseToken, leasedUntil) {
      const { data, error } = await serviceClient
        .from("parent_pathlab_subscriptions")
        .update({ delivery_leased_until: leasedUntil })
        .eq("id", subscriptionId)
        .eq("delivery_lease_token", leaseToken)
        .gt("delivery_leased_until", new Date().toISOString())
        .not("verified_at", "is", null)
        .is("unsubscribed_at", null)
        .is("revoked_at", null)
        .select("id")
        .maybeSingle();
      if (error) throw error;
      if (!data) return false;
      const { data: renewedRows, error: rowError } = await serviceClient
        .from("parent_pathlab_update_outbox")
        .update({ leased_until: leasedUntil })
        .eq("subscription_id", subscriptionId)
        .eq("status", "leased")
        .eq("lease_token", leaseToken)
        .gt("leased_until", new Date().toISOString())
        .select("id");
      if (rowError) throw rowError;
      if (!renewedRows?.length) {
        await serviceClient
          .from("parent_pathlab_subscriptions")
          .update({ delivery_lease_token: null, delivery_leased_until: null })
          .eq("id", subscriptionId)
          .eq("delivery_lease_token", leaseToken);
        return false;
      }
      return true;
    },
    async markDelivered(ids, subscriptionId, leaseToken, deliveredAt, isProgress) {
      return mutateLease(serviceClient, {
        subscriptionId,
        leaseToken,
        ids,
        action: "delivered",
        at: deliveredAt,
        errorCode: null,
        scheduledAt: null,
        incrementAttempt: false,
        isProgress,
      });
    },
    async reschedule(
      ids,
      subscriptionId,
      leaseToken,
      scheduledAt,
      errorCode,
      incrementAttempt
    ) {
      return mutateLease(serviceClient, {
        subscriptionId,
        leaseToken,
        ids,
        action: "rescheduled",
        at: new Date().toISOString(),
        errorCode,
        scheduledAt,
        incrementAttempt,
        isProgress: false,
      });
    },
    async markFailed(ids, subscriptionId, leaseToken, errorCode) {
      return mutateLease(serviceClient, {
        subscriptionId,
        leaseToken,
        ids,
        action: "failed",
        at: new Date().toISOString(),
        errorCode,
        scheduledAt: null,
        incrementAttempt: false,
        isProgress: false,
      });
    },
    async releaseLease(subscriptionId, leaseToken) {
      const { data, error } = await serviceClient
        .from("parent_pathlab_update_outbox")
        .select("id")
        .eq("subscription_id", subscriptionId)
        .eq("status", "leased")
        .eq("lease_token", leaseToken)
        .limit(1);
      if (error) throw error;
      if ((data ?? []).length > 0) return true;
      const { data: released, error: releaseError } = await serviceClient
        .from("parent_pathlab_subscriptions")
        .update({ delivery_lease_token: null, delivery_leased_until: null })
        .eq("id", subscriptionId)
        .eq("delivery_lease_token", leaseToken)
        .select("id")
        .maybeSingle();
      if (releaseError) throw releaseError;
      return Boolean(released);
    },
  };
}

interface DeliverySubscriptionRow {
  normalized_email: string;
  verified_at: string | null;
  unsubscribed_at: string | null;
  revoked_at: string | null;
  last_progress_delivered_at: string | null;
  unsubscribe_version: number;
  delivery_lease_token: string | null;
  delivery_leased_until: string | null;
}

interface OutboxClaimRow {
  id: string;
  subscription_id: string;
  event_kind: ClaimedParentUpdate["eventKind"];
  safe_payload: Record<string, unknown>;
  attempt_count: number;
  subscription: DeliverySubscriptionRow | DeliverySubscriptionRow[];
}

function embeddedSubscription(
  value: OutboxClaimRow["subscription"]
): DeliverySubscriptionRow | null {
  return (Array.isArray(value) ? value[0] : value) ?? null;
}

export async function claimDueParentUpdates(
  serviceClient: SupabaseClient,
  now: Date,
  limit = 100
): Promise<ClaimedParentUpdate[]> {
  const nowIso = now.toISOString();
  const { data: candidates, error } = await serviceClient
    .from("parent_pathlab_update_outbox")
    .select(`
      id, subscription_id, event_kind, safe_payload, attempt_count,
      subscription:parent_pathlab_subscriptions!inner(
        normalized_email, verified_at, unsubscribed_at, revoked_at,
        last_progress_delivered_at, unsubscribe_version,
        delivery_lease_token, delivery_leased_until
      )
    `)
    .lte("scheduled_at", nowIso)
    .or(`status.eq.pending,and(status.eq.leased,leased_until.lt.${nowIso})`)
    .order("scheduled_at", { ascending: true })
    .limit(Math.max(limit * 10, limit));
  if (error) throw error;

  const claimed: ClaimedParentUpdate[] = [];
  const seenSubscriptions = new Set<string>();
  let acquiredCount = 0;
  for (const raw of candidates ?? []) {
    const candidate = raw as unknown as OutboxClaimRow;
    if (seenSubscriptions.has(candidate.subscription_id)) continue;
    seenSubscriptions.add(candidate.subscription_id);
    const subscription = embeddedSubscription(candidate.subscription);
    if (
      !subscription?.verified_at ||
      subscription.unsubscribed_at ||
      subscription.revoked_at
    ) {
      await cancelParentUpdateDeliveries(
        serviceClient,
        candidate.subscription_id,
        "subscription_inactive"
      );
      continue;
    }

    const leaseToken = randomUUID();
    const leasedUntil = new Date(now.getTime() + 15 * 60_000).toISOString();
    const { data: acquired, error: acquireError } = await serviceClient
      .from("parent_pathlab_subscriptions")
      .update({
        delivery_lease_token: leaseToken,
        delivery_leased_until: leasedUntil,
      })
      .eq("id", candidate.subscription_id)
      .or(`delivery_leased_until.is.null,delivery_leased_until.lt.${nowIso}`)
      .not("verified_at", "is", null)
      .is("unsubscribed_at", null)
      .is("revoked_at", null)
      .select(`
        normalized_email, verified_at, unsubscribed_at, revoked_at,
        last_progress_delivered_at, unsubscribe_version,
        delivery_lease_token, delivery_leased_until
      `)
      .maybeSingle();
    if (acquireError) throw acquireError;
    if (!acquired) continue;

    const { data: activeOwnership, error: ownershipError } = await serviceClient
      .from("parent_pathlab_subscriptions")
      .select(`
        normalized_email, verified_at, unsubscribed_at, revoked_at,
        last_progress_delivered_at, unsubscribe_version,
        delivery_lease_token, delivery_leased_until
      `)
      .eq("id", candidate.subscription_id)
      .eq("delivery_lease_token", leaseToken)
      .not("verified_at", "is", null)
      .is("unsubscribed_at", null)
      .is("revoked_at", null)
      .maybeSingle();
    if (ownershipError) throw ownershipError;
    if (!activeOwnership) continue;

    const { data: rows, error: claimError } = await serviceClient
      .from("parent_pathlab_update_outbox")
      .update({ status: "leased", lease_token: leaseToken, leased_until: leasedUntil })
      .eq("subscription_id", candidate.subscription_id)
      .lte("scheduled_at", nowIso)
      .or(`status.eq.pending,and(status.eq.leased,leased_until.lt.${nowIso})`)
      .select("id, subscription_id, event_kind, safe_payload, attempt_count");
    if (claimError) throw claimError;
    if (!rows?.length) {
      await serviceClient
        .from("parent_pathlab_subscriptions")
        .update({ delivery_lease_token: null, delivery_leased_until: null })
        .eq("id", candidate.subscription_id)
        .eq("delivery_lease_token", leaseToken);
      continue;
    }

    const owned = activeOwnership as DeliverySubscriptionRow;
    acquiredCount += 1;
    for (const row of rows) {
      claimed.push({
        id: row.id,
        subscriptionId: row.subscription_id,
        eventKind: row.event_kind as ClaimedParentUpdate["eventKind"],
        safePayload: row.safe_payload as Record<string, unknown>,
        attemptCount: row.attempt_count,
        normalizedEmail: owned.normalized_email,
        lastProgressDeliveredAt: owned.last_progress_delivered_at,
        unsubscribeVersion: owned.unsubscribe_version,
        leaseToken,
        leasedUntil,
      });
    }
    if (acquiredCount >= limit) break;
  }
  return claimed;
}

export function parentUpdateTokenSecret(): string {
  const secret =
    process.env.PARENT_UPDATE_TOKEN_SECRET ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!secret) throw new Error("Parent update token secret is not configured");
  return secret;
}
