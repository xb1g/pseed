import { randomUUID } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  ClaimedParentUpdate,
  ParentUpdateRepository,
  ParentUpdateSubscription,
  ParentUpdateSubscriptionWrite,
} from "./parent-updates";

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

export function createParentUpdateRepository(
  publicClient: SupabaseClient,
  serviceClient: SupabaseClient
): ParentUpdateRepository {
  return {
    async resolveTrialByPayToken(token) {
      const { data, error } = await publicClient.rpc("get_trial_by_token", {
        p_token: token,
      });
      if (error) throw error;
      const trial = data as { id?: unknown; seedTitle?: unknown } | null;
      return trial && typeof trial.id === "string" && typeof trial.seedTitle === "string"
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
      const { data, error } = await serviceClient
        .from("parent_pathlab_subscriptions")
        .update({ unsubscribed_at: unsubscribedAt })
        .eq("id", id)
        .select(SUBSCRIPTION_COLUMNS)
        .single();
      if (error) throw error;
      return mapSubscription(data as SubscriptionRow);
    },
    async markDelivered(ids, deliveredAt, isProgress) {
      const { data: rows, error: readError } = await serviceClient
        .from("parent_pathlab_update_outbox")
        .select("subscription_id")
        .in("id", ids);
      if (readError) throw readError;
      const { error } = await serviceClient
        .from("parent_pathlab_update_outbox")
        .update({
          status: "delivered",
          delivered_at: deliveredAt,
          leased_until: null,
          lease_token: null,
          last_error_code: null,
        })
        .in("id", ids);
      if (error) throw error;
      const subscriptionIds = [
        ...new Set((rows ?? []).map((row) => row.subscription_id as string)),
      ];
      if (subscriptionIds.length) {
        const timestampColumn = isProgress
          ? "last_progress_delivered_at"
          : "last_transactional_delivered_at";
        const { error: subscriptionError } = await serviceClient
          .from("parent_pathlab_subscriptions")
          .update({ [timestampColumn]: deliveredAt })
          .in("id", subscriptionIds);
        if (subscriptionError) throw subscriptionError;
      }
    },
    async reschedule(ids, scheduledAt, errorCode) {
      const { data: rows, error: readError } = await serviceClient
        .from("parent_pathlab_update_outbox")
        .select("id, attempt_count")
        .in("id", ids);
      if (readError) throw readError;
      for (const row of rows ?? []) {
        const { error } = await serviceClient
          .from("parent_pathlab_update_outbox")
          .update({
            status: "pending",
            attempt_count: Number(row.attempt_count) + 1,
            scheduled_at: scheduledAt,
            leased_until: null,
            lease_token: null,
            last_error_code: errorCode,
          })
          .eq("id", row.id);
        if (error) throw error;
      }
    },
    async markFailed(ids, errorCode) {
      const { error } = await serviceClient
        .from("parent_pathlab_update_outbox")
        .update({
          status: "failed",
          leased_until: null,
          lease_token: null,
          last_error_code: errorCode,
        })
        .in("id", ids);
      if (error) throw error;
    },
  };
}

interface OutboxClaimRow {
  id: string;
  subscription_id: string;
  event_kind: ClaimedParentUpdate["eventKind"];
  safe_payload: Record<string, unknown>;
  attempt_count: number;
  subscription:
    | {
        normalized_email: string;
        verified_at: string | null;
        unsubscribed_at: string | null;
        revoked_at: string | null;
        last_progress_delivered_at: string | null;
        unsubscribe_version: number;
      }
    | Array<{
        normalized_email: string;
        verified_at: string | null;
        unsubscribed_at: string | null;
        revoked_at: string | null;
        last_progress_delivered_at: string | null;
        unsubscribe_version: number;
      }>;
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
        last_progress_delivered_at, unsubscribe_version
      )
    `)
    .lte("scheduled_at", nowIso)
    .or(`status.eq.pending,and(status.eq.leased,leased_until.lt.${nowIso})`)
    .order("scheduled_at", { ascending: true })
    .limit(limit);
  if (error) throw error;

  const claimed: ClaimedParentUpdate[] = [];
  for (const raw of candidates ?? []) {
    const candidate = raw as unknown as OutboxClaimRow;
    const subscription = Array.isArray(candidate.subscription)
      ? candidate.subscription[0]
      : candidate.subscription;
    if (
      !subscription?.verified_at ||
      subscription.unsubscribed_at ||
      subscription.revoked_at
    ) {
      await serviceClient
        .from("parent_pathlab_update_outbox")
        .update({ status: "failed", last_error_code: "subscription_inactive" })
        .eq("id", candidate.id);
      continue;
    }

    const leaseToken = randomUUID();
    const leasedUntil = new Date(now.getTime() + 5 * 60_000).toISOString();
    const { data: lease, error: leaseError } = await serviceClient
      .from("parent_pathlab_update_outbox")
      .update({ status: "leased", lease_token: leaseToken, leased_until: leasedUntil })
      .eq("id", candidate.id)
      .or(`status.eq.pending,and(status.eq.leased,leased_until.lt.${nowIso})`)
      .select("id")
      .maybeSingle();
    if (leaseError) throw leaseError;
    if (!lease) continue;

    claimed.push({
      id: candidate.id,
      subscriptionId: candidate.subscription_id,
      eventKind: candidate.event_kind,
      safePayload: candidate.safe_payload,
      attemptCount: candidate.attempt_count,
      normalizedEmail: subscription.normalized_email,
      lastProgressDeliveredAt: subscription.last_progress_delivered_at,
      unsubscribeVersion: subscription.unsubscribe_version,
    });
  }
  return claimed;
}

export function parentUpdateTokenSecret(): string {
  const secret =
    process.env.PARENT_UPDATE_TOKEN_SECRET ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!secret) throw new Error("Parent update token secret is not configured");
  return secret;
}
