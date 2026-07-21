import {
  ParentUpdateError,
  parentUpdateSubscribeSchema,
  backoffMinutesForAttempt,
  hashBearerToken,
  maskEmail,
  normalizeParentEmail,
  processClaimedParentUpdates,
  subscribeParentUpdates,
  unsubscribeParentUpdates,
  verifyParentUpdates,
  type ParentUpdateRepository,
  type ParentUpdateSubscription,
  type ClaimedParentUpdate,
} from "../parent-updates";

const NOW = new Date("2026-07-22T10:00:00.000Z");
const TRIAL_ID = "11111111-1111-4111-8111-111111111111";
const SUBSCRIPTION_ID = "22222222-2222-4222-8222-222222222222";
const SECRET = "test-secret-that-is-long-and-not-a-production-key";

function subscription(overrides: Partial<ParentUpdateSubscription> = {}): ParentUpdateSubscription {
  return {
    id: SUBSCRIPTION_ID,
    trialAccessId: TRIAL_ID,
    normalizedEmail: "parent@example.com",
    verificationTokenHash: "0".repeat(64),
    unsubscribeTokenHash: "1".repeat(64),
    verificationVersion: 1,
    unsubscribeVersion: 1,
    verificationExpiresAt: "2026-07-22T10:30:00.000Z",
    verificationRequestedAt: null,
    verifiedAt: null,
    unsubscribedAt: null,
    revokedAt: null,
    lastProgressDeliveredAt: null,
    ...overrides,
  };
}

function memoryRepository(existing: ParentUpdateSubscription | null = null) {
  let value = existing;
  const delivered: string[][] = [];
  const rescheduled: Array<{ ids: string[]; scheduledAt: string; errorCode: string }> = [];
  const failed: Array<{ ids: string[]; errorCode: string }> = [];
  const repository: ParentUpdateRepository & {
    current(): ParentUpdateSubscription | null;
    delivered: string[][];
    rescheduled: typeof rescheduled;
    failed: typeof failed;
  } = {
    async resolveTrialByPayToken(token) {
      return token === "a".repeat(32)
        ? { id: TRIAL_ID, seedTitle: "AI Builder PathLab" }
        : null;
    },
    async findByTrialAccessId() {
      return value;
    },
    async saveSubscription(input) {
      value = subscription({ ...value, ...input });
      return value;
    },
    async findByVerificationHash(hash) {
      return value?.verificationTokenHash === hash ? value : null;
    },
    async findByUnsubscribeHash(hash) {
      return value?.unsubscribeTokenHash === hash ? value : null;
    },
    async markVerified(id, verifiedAt) {
      if (value?.id === id) value = { ...value, verifiedAt };
      return value!;
    },
    async markUnsubscribed(id, unsubscribedAt) {
      if (value?.id === id) value = { ...value, unsubscribedAt };
      return value!;
    },
    async markDelivered(ids) {
      delivered.push(ids);
    },
    async reschedule(ids, scheduledAt, errorCode) {
      rescheduled.push({ ids, scheduledAt, errorCode });
    },
    async markFailed(ids, errorCode) {
      failed.push({ ids, errorCode });
    },
    current: () => value,
    delivered,
    rescheduled,
    failed,
  };
  return repository;
}

test("normalizes parent email without weakening validation", () => {
  expect(normalizeParentEmail("  Parent.Name+Updates@Example.COM ")).toBe(
    "parent.name+updates@example.com"
  );
  expect(parentUpdateSubscribeSchema.safeParse({
    email: "not-an-email",
    recipientAttested: true,
    consented: true,
  }).success).toBe(false);
});

test("requires consent and parent or guardian attestation", () => {
  expect(parentUpdateSubscribeSchema.safeParse({
    email: "parent@example.com",
    recipientAttested: false,
    consented: true,
  }).success).toBe(false);
  expect(parentUpdateSubscribeSchema.safeParse({
    email: "parent@example.com",
    recipientAttested: true,
    consented: false,
  }).success).toBe(false);
});

test("hashes bearer tokens and masks verified addresses", () => {
  expect(hashBearerToken("secret-token")).toMatch(/^[0-9a-f]{64}$/);
  expect(hashBearerToken("secret-token")).not.toBe("secret-token");
  expect(maskEmail("parent@example.com")).toBe("p*****@example.com");
});

test("creates one subscription per trial and sends a 30-minute verification", async () => {
  const repository = memoryRepository();
  const sendVerification = jest.fn().mockResolvedValue({ ok: true as const });

  const result = await subscribeParentUpdates({
    payToken: "a".repeat(32),
    input: { email: " Parent@Example.com ", recipientAttested: true, consented: true },
    repository,
    sendVerification,
    now: NOW,
    tokenSecret: SECRET,
    origin: "https://passionseed.org",
  });

  expect(result).toEqual({ status: "verification_sent", maskedEmail: "p*****@example.com" });
  expect(repository.current()?.normalizedEmail).toBe("parent@example.com");
  expect(repository.current()?.verificationExpiresAt).toBe("2026-07-22T10:30:00.000Z");
  expect(repository.current()?.verificationTokenHash).toMatch(/^[0-9a-f]{64}$/);
  expect(repository.current()?.unsubscribeTokenHash).toMatch(/^[0-9a-f]{64}$/);
  expect(sendVerification).toHaveBeenCalledTimes(1);
});

test("rejects an unknown public pay token without revealing trial data", async () => {
  await expect(subscribeParentUpdates({
    payToken: "b".repeat(32),
    input: { email: "parent@example.com", recipientAttested: true, consented: true },
    repository: memoryRepository(),
    sendVerification: jest.fn(),
    now: NOW,
    tokenSecret: SECRET,
    origin: "https://passionseed.org",
  })).rejects.toMatchObject({ code: "not_found", status: 404 });
});

test("resubscribe rotates verification while preserving one contact row", async () => {
  const repository = memoryRepository(subscription({
    verificationVersion: 2,
    unsubscribeVersion: 3,
    verificationRequestedAt: "2026-07-22T09:00:00.000Z",
    unsubscribedAt: "2026-07-22T09:01:00.000Z",
  }));

  await subscribeParentUpdates({
    payToken: "a".repeat(32),
    input: { email: "new-parent@example.com", recipientAttested: true, consented: true },
    repository,
    sendVerification: jest.fn().mockResolvedValue({ ok: true }),
    now: NOW,
    tokenSecret: SECRET,
    origin: "https://passionseed.org",
  });

  expect(repository.current()?.id).toBe(SUBSCRIPTION_ID);
  expect(repository.current()?.verificationVersion).toBe(3);
  expect(repository.current()?.unsubscribeVersion).toBe(4);
  expect(repository.current()?.unsubscribedAt).toBeNull();
});

test("throttles verification resend attempts", async () => {
  const repository = memoryRepository(subscription({
    verificationRequestedAt: "2026-07-22T09:59:30.000Z",
  }));
  await expect(subscribeParentUpdates({
    payToken: "a".repeat(32),
    input: { email: "parent@example.com", recipientAttested: true, consented: true },
    repository,
    sendVerification: jest.fn(),
    now: NOW,
    tokenSecret: SECRET,
    origin: "https://passionseed.org",
  })).rejects.toMatchObject({ code: "rate_limited", status: 429 });
});

test("verification is idempotent after success and rejects expired tokens", async () => {
  const activeRepository = memoryRepository();
  await subscribeParentUpdates({
    payToken: "a".repeat(32),
    input: { email: "parent@example.com", recipientAttested: true, consented: true },
    repository: activeRepository,
    sendVerification: jest.fn().mockResolvedValue({ ok: true }),
    now: NOW,
    tokenSecret: SECRET,
    origin: "https://passionseed.org",
  });
  const active = activeRepository.current()!;
  const token = (await import("../parent-updates")).deriveBearerToken(
    "verification",
    active.id,
    active.verificationVersion,
    SECRET
  );
  expect(await verifyParentUpdates(activeRepository, token, NOW)).toEqual({ status: "verified" });
  expect(await verifyParentUpdates(activeRepository, token, NOW)).toEqual({ status: "verified" });

  const expiredRepository = memoryRepository(subscription({
    verificationExpiresAt: "2026-07-22T09:59:59.000Z",
  }));
  const expiredToken = (await import("../parent-updates")).deriveBearerToken(
    "verification", SUBSCRIPTION_ID, 1, SECRET
  );
  expiredRepository.current()!.verificationTokenHash = hashBearerToken(expiredToken);
  await expect(verifyParentUpdates(expiredRepository, expiredToken, NOW))
    .rejects.toMatchObject({ code: "verification_expired", status: 410 });
});

test("unsubscribe is replay safe", async () => {
  const token = (await import("../parent-updates")).deriveBearerToken(
    "unsubscribe", SUBSCRIPTION_ID, 1, SECRET
  );
  const repository = memoryRepository(subscription({
    verifiedAt: NOW.toISOString(),
    unsubscribeTokenHash: hashBearerToken(token),
  }));
  expect(await unsubscribeParentUpdates(repository, token, NOW)).toEqual({ status: "unsubscribed" });
  expect(await unsubscribeParentUpdates(repository, token, NOW)).toEqual({ status: "unsubscribed" });
});

test("uses the specified retry schedule and fails safely after five attempts", () => {
  expect([1, 2, 3, 4, 5].map(backoffMinutesForAttempt)).toEqual([5, 10, 20, 40, 80]);
});

test("aggregates progress rows and enforces the 24-hour progress limit", async () => {
  const repository = memoryRepository();
  const rows: ClaimedParentUpdate[] = [1, 2].map((day) => ({
    id: `event-${day}`,
    subscriptionId: SUBSCRIPTION_ID,
    eventKind: "milestone_completed",
    safePayload: { seedTitle: "AI Builder", currentDay: day },
    attemptCount: 0,
    normalizedEmail: "parent@example.com",
    lastProgressDeliveredAt: "2026-07-22T00:00:00.000Z",
    unsubscribeVersion: 1,
  }));
  const send = jest.fn();
  await processClaimedParentUpdates({
    rows,
    repository,
    send,
    now: NOW,
    origin: "https://passionseed.org",
    tokenSecret: SECRET,
  });
  expect(send).not.toHaveBeenCalled();
  expect(repository.rescheduled[0]).toMatchObject({
    ids: ["event-1", "event-2"],
    scheduledAt: "2026-07-23T00:00:00.000Z",
    errorCode: "progress_frequency_limit",
  });
});

test("leases are processed as one progress email and transient failures back off", async () => {
  const repository = memoryRepository();
  const rows: ClaimedParentUpdate[] = [1, 2].map((day) => ({
    id: `event-${day}`,
    subscriptionId: SUBSCRIPTION_ID,
    eventKind: "milestone_completed",
    safePayload: { seedTitle: "AI Builder", currentDay: day },
    attemptCount: 0,
    normalizedEmail: "parent@example.com",
    lastProgressDeliveredAt: null,
    unsubscribeVersion: 1,
  }));
  const send = jest.fn().mockResolvedValue({ ok: false, transient: true, code: "provider_unavailable" });
  await processClaimedParentUpdates({
    rows, repository, send, now: NOW,
    origin: "https://passionseed.org", tokenSecret: SECRET,
  });
  expect(send).toHaveBeenCalledTimes(1);
  expect(repository.rescheduled[0]).toMatchObject({
    ids: ["event-1", "event-2"],
    scheduledAt: "2026-07-22T10:05:00.000Z",
    errorCode: "provider_unavailable",
  });

  const eightyMinuteRepository = memoryRepository();
  await processClaimedParentUpdates({
    rows: [{ ...rows[0], attemptCount: 4 }],
    repository: eightyMinuteRepository,
    send,
    now: NOW,
    origin: "https://passionseed.org",
    tokenSecret: SECRET,
  });
  expect(eightyMinuteRepository.rescheduled[0]).toMatchObject({
    ids: ["event-1"],
    scheduledAt: "2026-07-22T11:20:00.000Z",
  });

  const terminalRepository = memoryRepository();
  await processClaimedParentUpdates({
    rows: [{ ...rows[0], attemptCount: 5 }],
    repository: terminalRepository,
    send,
    now: NOW,
    origin: "https://passionseed.org",
    tokenSecret: SECRET,
  });
  expect(terminalRepository.failed[0]).toEqual({ ids: ["event-1"], errorCode: "delivery_exhausted" });
});

test("uses non-sensitive terminal codes for permanent provider rejection", async () => {
  const repository = memoryRepository();
  await processClaimedParentUpdates({
    rows: [{
      id: "event-payment", subscriptionId: SUBSCRIPTION_ID,
      eventKind: "payment_status_changed", safePayload: { status: "paid" },
      attemptCount: 0, normalizedEmail: "parent@example.com",
      lastProgressDeliveredAt: null, unsubscribeVersion: 1,
    }],
    repository,
    send: jest.fn().mockResolvedValue({ ok: false, transient: false, code: "provider_rejected" }),
    now: NOW,
    origin: "https://passionseed.org",
    tokenSecret: SECRET,
  });
  expect(repository.failed).toEqual([{ ids: ["event-payment"], errorCode: "provider_rejected" }]);
});

test("ParentUpdateError never needs private trial data", () => {
  expect(new ParentUpdateError("not_found", 404).message).toBe("not_found");
});
