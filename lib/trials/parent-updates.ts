import { createHash, createHmac, randomUUID } from "node:crypto";
import { z } from "zod";

const VERIFY_WINDOW_MS = 30 * 60 * 1000;
const RESEND_THROTTLE_MS = 60 * 1000;
const PROGRESS_WINDOW_MS = 24 * 60 * 60 * 1000;
const DELIVERY_LEASE_MS = 15 * 60 * 1000;
const RETRY_MINUTES = [5, 10, 20, 40, 80] as const;

export const parentUpdateSubscribeSchema = z.object({
  email: z.string().trim().email().max(254),
  recipientAttested: z.literal(true),
  consented: z.literal(true),
});

export type ParentUpdateSubscribeInput = z.infer<typeof parentUpdateSubscribeSchema>;

export interface ParentUpdateSubscription {
  id: string;
  trialAccessId: string;
  normalizedEmail: string;
  verificationTokenHash: string;
  unsubscribeTokenHash: string;
  verificationVersion: number;
  unsubscribeVersion: number;
  verificationExpiresAt: string;
  verificationRequestedAt: string | null;
  verifiedAt: string | null;
  unsubscribedAt: string | null;
  revokedAt: string | null;
  lastProgressDeliveredAt: string | null;
}

export interface ParentUpdateTrialProjection {
  id: string;
  seedTitle: string;
}

export interface ClaimedParentUpdate {
  id: string;
  subscriptionId: string;
  eventKind:
    | "pathlab_started"
    | "milestone_completed"
    | "pathlab_completed"
    | "payment_status_changed";
  safePayload: Record<string, unknown>;
  attemptCount: number;
  normalizedEmail: string;
  lastProgressDeliveredAt: string | null;
  unsubscribeVersion: number;
  leaseToken: string;
  leasedUntil: string;
}

export type ParentTokenMutationResult =
  | "applied"
  | "already_applied"
  | "expired"
  | "miss";

export interface ParentUpdateRepository {
  resolveTrialByPayToken(token: string): Promise<ParentUpdateTrialProjection | null>;
  findByTrialAccessId(trialAccessId: string): Promise<ParentUpdateSubscription | null>;
  saveSubscription(input: ParentUpdateSubscriptionWrite): Promise<ParentUpdateSubscription>;
  findByVerificationHash(hash: string): Promise<ParentUpdateSubscription | null>;
  findByUnsubscribeHash(hash: string): Promise<ParentUpdateSubscription | null>;
  markVerified(
    id: string,
    expectedHash: string,
    expectedVersion: number,
    verifiedAt: string
  ): Promise<ParentTokenMutationResult>;
  markUnsubscribed(
    id: string,
    expectedHash: string,
    expectedVersion: number,
    unsubscribedAt: string
  ): Promise<ParentTokenMutationResult>;
  renewLease(
    subscriptionId: string,
    leaseToken: string,
    leasedUntil: string
  ): Promise<boolean>;
  markDelivered(
    ids: string[],
    subscriptionId: string,
    leaseToken: string,
    deliveredAt: string,
    isProgress: boolean
  ): Promise<boolean>;
  reschedule(
    ids: string[],
    subscriptionId: string,
    leaseToken: string,
    scheduledAt: string,
    errorCode: string,
    incrementAttempt: boolean
  ): Promise<boolean>;
  markFailed(
    ids: string[],
    subscriptionId: string,
    leaseToken: string,
    errorCode: string
  ): Promise<boolean>;
  releaseLease(subscriptionId: string, leaseToken: string): Promise<boolean>;
}

export type ParentUpdateSubscriptionWrite =
  Partial<ParentUpdateSubscription> &
  Pick<ParentUpdateSubscription, "id" | "trialAccessId"> & {
    consentedAt: string;
    attestedAt: string;
  };

export interface ParentEmailSendResult {
  ok: boolean;
  transient?: boolean;
  code?: string;
}

export type VerificationEmailSender = (input: {
  to: string;
  seedTitle: string;
  verificationUrl: string;
  unsubscribeUrl: string;
}) => Promise<ParentEmailSendResult>;

export type ParentUpdateEmailSender = (input: {
  to: string;
  eventKinds: ClaimedParentUpdate["eventKind"][];
  payloads: Record<string, unknown>[];
  unsubscribeUrl: string;
}) => Promise<ParentEmailSendResult>;

export class ParentUpdateError extends Error {
  constructor(
    public readonly code: string,
    public readonly status: number
  ) {
    super(code);
    this.name = "ParentUpdateError";
  }
}

export function normalizeParentEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function maskEmail(email: string): string {
  const [local, domain] = normalizeParentEmail(email).split("@");
  if (!local || !domain) return "***";
  return `${local[0]}${"*".repeat(Math.max(3, Math.min(5, local.length - 1)))}@${domain}`;
}

export function hashBearerToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/**
 * Produces a server-reproducible opaque bearer token. The subscription id is a
 * random UUID and the keyed digest is indistinguishable from random bytes. This
 * lets every email carry the stable unsubscribe link while the database stores
 * only its SHA-256 hash.
 */
export function deriveBearerToken(
  purpose: "verification" | "unsubscribe",
  subscriptionId: string,
  version: number,
  secret: string
): string {
  return createHmac("sha256", secret)
    .update(`${purpose}:${subscriptionId}:${version}`)
    .digest("hex");
}

function tokenUrl(origin: string, kind: "verify" | "unsubscribe", token: string): string {
  const cleanOrigin = origin.replace(/\/$/, "");
  return `${cleanOrigin}/api/trials/parent-updates/${kind}/${token}`;
}

export async function subscribeParentUpdates(input: {
  payToken: string;
  input: ParentUpdateSubscribeInput;
  repository: ParentUpdateRepository;
  sendVerification: VerificationEmailSender;
  now: Date;
  tokenSecret: string;
  origin: string;
}): Promise<{ status: "verification_sent" | "already_verified"; maskedEmail: string }> {
  const parsed = parentUpdateSubscribeSchema.safeParse(input.input);
  if (!parsed.success) throw new ParentUpdateError("invalid_request", 400);

  const trial = await input.repository.resolveTrialByPayToken(input.payToken);
  if (!trial) throw new ParentUpdateError("not_found", 404);

  const normalizedEmail = normalizeParentEmail(parsed.data.email);
  const existing = await input.repository.findByTrialAccessId(trial.id);
  if (
    existing?.normalizedEmail === normalizedEmail &&
    existing.verifiedAt &&
    !existing.unsubscribedAt &&
    !existing.revokedAt
  ) {
    return { status: "already_verified", maskedEmail: maskEmail(normalizedEmail) };
  }

  if (
    existing?.verificationRequestedAt &&
    input.now.getTime() - new Date(existing.verificationRequestedAt).getTime() < RESEND_THROTTLE_MS
  ) {
    throw new ParentUpdateError("rate_limited", 429);
  }

  const id = existing?.id ?? randomUUID();
  const verificationVersion = (existing?.verificationVersion ?? 0) + 1;
  const contactChanged = Boolean(existing && existing.normalizedEmail !== normalizedEmail);
  const reactivating = Boolean(existing?.unsubscribedAt || existing?.revokedAt);
  const unsubscribeVersion = existing
    ? existing.unsubscribeVersion + (contactChanged || reactivating ? 1 : 0)
    : 1;
  const verificationToken = deriveBearerToken(
    "verification",
    id,
    verificationVersion,
    input.tokenSecret
  );
  const unsubscribeToken = deriveBearerToken(
    "unsubscribe",
    id,
    unsubscribeVersion,
    input.tokenSecret
  );
  const verificationExpiresAt = new Date(
    input.now.getTime() + VERIFY_WINDOW_MS
  ).toISOString();

  await input.repository.saveSubscription({
    id,
    trialAccessId: trial.id,
    normalizedEmail,
    verificationVersion,
    unsubscribeVersion,
    verificationTokenHash: hashBearerToken(verificationToken),
    unsubscribeTokenHash: hashBearerToken(unsubscribeToken),
    verificationExpiresAt,
    verificationRequestedAt: input.now.toISOString(),
    verifiedAt: null,
    unsubscribedAt: null,
    revokedAt: null,
    consentedAt: input.now.toISOString(),
    attestedAt: input.now.toISOString(),
  });

  const delivery = await input.sendVerification({
    to: normalizedEmail,
    seedTitle: trial.seedTitle,
    verificationUrl: tokenUrl(input.origin, "verify", verificationToken),
    unsubscribeUrl: tokenUrl(input.origin, "unsubscribe", unsubscribeToken),
  });
  if (!delivery.ok) {
    throw new ParentUpdateError(
      delivery.code === "email_unavailable" ? "email_unavailable" : "verification_delivery_failed",
      503
    );
  }

  return { status: "verification_sent", maskedEmail: maskEmail(normalizedEmail) };
}

export async function verifyParentUpdates(
  repository: ParentUpdateRepository,
  token: string,
  now: Date
): Promise<{ status: "verified" }> {
  const expectedHash = hashBearerToken(token);
  const row = await repository.findByVerificationHash(expectedHash);
  if (!row) throw new ParentUpdateError("not_found", 404);
  const result = await repository.markVerified(
    row.id,
    expectedHash,
    row.verificationVersion,
    now.toISOString()
  );
  if (result === "expired") {
    throw new ParentUpdateError("verification_expired", 410);
  }
  if (result === "miss") throw new ParentUpdateError("not_found", 404);
  return { status: "verified" };
}

export async function unsubscribeParentUpdates(
  repository: ParentUpdateRepository,
  token: string,
  now: Date
): Promise<{ status: "unsubscribed" }> {
  const expectedHash = hashBearerToken(token);
  const row = await repository.findByUnsubscribeHash(expectedHash);
  if (!row) throw new ParentUpdateError("not_found", 404);
  const result = await repository.markUnsubscribed(
    row.id,
    expectedHash,
    row.unsubscribeVersion,
    now.toISOString()
  );
  if (result === "miss") throw new ParentUpdateError("not_found", 404);
  return { status: "unsubscribed" };
}

export function backoffMinutesForAttempt(attempt: number): number {
  const index = Math.max(0, Math.min(RETRY_MINUTES.length - 1, attempt - 1));
  return RETRY_MINUTES[index];
}

function safeDeliveryCode(code: string | undefined): string {
  return ["email_unavailable", "provider_unavailable", "provider_rejected"].includes(code ?? "")
    ? code!
    : "delivery_failed";
}

function isProgress(kind: ClaimedParentUpdate["eventKind"]): boolean {
  return kind !== "payment_status_changed";
}

function groupClaimedRows(rows: ClaimedParentUpdate[]): ClaimedParentUpdate[][] {
  const groups = new Map<string, ClaimedParentUpdate[]>();
  for (const row of rows) {
    const key = isProgress(row.eventKind)
      ? `progress:${row.subscriptionId}`
      : `transactional:${row.id}`;
    const group = groups.get(key) ?? [];
    group.push(row);
    groups.set(key, group);
  }
  return [...groups.values()];
}

function groupByLease(rows: ClaimedParentUpdate[]): ClaimedParentUpdate[][] {
  const groups = new Map<string, ClaimedParentUpdate[]>();
  for (const row of rows) {
    const key = `${row.subscriptionId}:${row.leaseToken}`;
    const group = groups.get(key) ?? [];
    group.push(row);
    groups.set(key, group);
  }
  return [...groups.values()];
}

async function processDeliveryGroup(input: {
  group: ClaimedParentUpdate[];
  repository: ParentUpdateRepository;
  send: ParentUpdateEmailSender;
  now: Date;
  origin: string;
  tokenSecret: string;
}): Promise<void> {
  const first = input.group[0];
  const ids = input.group.map((row) => row.id);
  const progress = isProgress(first.eventKind);
  if (progress && first.lastProgressDeliveredAt) {
    const nextAllowed =
      new Date(first.lastProgressDeliveredAt).getTime() + PROGRESS_WINDOW_MS;
    if (nextAllowed > input.now.getTime()) {
      await input.repository.reschedule(
        ids,
        first.subscriptionId,
        first.leaseToken,
        new Date(nextAllowed).toISOString(),
        "progress_frequency_limit",
        false
      );
      return;
    }
  }

  const renewed = await input.repository.renewLease(
    first.subscriptionId,
    first.leaseToken,
    new Date(input.now.getTime() + DELIVERY_LEASE_MS).toISOString()
  );
  if (!renewed) return;

  const unsubscribeToken = deriveBearerToken(
    "unsubscribe",
    first.subscriptionId,
    first.unsubscribeVersion,
    input.tokenSecret
  );
  const result = await input.send({
    to: first.normalizedEmail,
    eventKinds: input.group.map((row) => row.eventKind),
    payloads: input.group.map((row) => row.safePayload),
    unsubscribeUrl: tokenUrl(input.origin, "unsubscribe", unsubscribeToken),
  });
  if (result.ok) {
    await input.repository.markDelivered(
      ids,
      first.subscriptionId,
      first.leaseToken,
      input.now.toISOString(),
      progress
    );
    return;
  }

  if (!result.transient) {
    await input.repository.markFailed(
      ids,
      first.subscriptionId,
      first.leaseToken,
      safeDeliveryCode(result.code)
    );
    return;
  }

  const nextAttempt = Math.max(...input.group.map((row) => row.attemptCount)) + 1;
  if (nextAttempt > 5) {
    await input.repository.markFailed(
      ids,
      first.subscriptionId,
      first.leaseToken,
      "delivery_exhausted"
    );
    return;
  }
  const delay = backoffMinutesForAttempt(nextAttempt);
  await input.repository.reschedule(
    ids,
    first.subscriptionId,
    first.leaseToken,
    new Date(input.now.getTime() + delay * 60_000).toISOString(),
    safeDeliveryCode(result.code),
    true
  );
}

export async function processClaimedParentUpdates(input: {
  rows: ClaimedParentUpdate[];
  repository: ParentUpdateRepository;
  send: ParentUpdateEmailSender;
  now: Date;
  origin: string;
  tokenSecret: string;
}): Promise<void> {
  for (const leaseRows of groupByLease(input.rows)) {
    const first = leaseRows[0];
    const renewed = await input.repository.renewLease(
      first.subscriptionId,
      first.leaseToken,
      new Date(input.now.getTime() + DELIVERY_LEASE_MS).toISOString()
    );
    if (!renewed) continue;
    try {
      for (const group of groupClaimedRows(leaseRows)) {
        await processDeliveryGroup({ ...input, group });
      }
    } finally {
      await input.repository.releaseLease(first.subscriptionId, first.leaseToken);
    }
  }
}
