import {
  ParentUpdateError,
  parentUpdateSubscribeSchema,
  backoffMinutesForAttempt,
  hashBearerToken,
  deriveParentSubscriptionId,
  maskEmail,
  normalizeParentEmail,
  processClaimedParentUpdates,
  subscribeParentUpdates,
  unsubscribeParentUpdates,
  verifyParentUpdates,
  type ParentUpdateRepository,
  type ParentUpdateSubscription,
  type ParentTokenMutationResult,
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
  let activeLeaseToken: string | null = null;
  const delivered: string[][] = [];
  const rescheduled: Array<{
    ids: string[];
    scheduledAt: string;
    errorCode: string;
    incrementAttempt: boolean;
  }> = [];
  const failed: Array<{ ids: string[]; errorCode: string }> = [];
  const repository: ParentUpdateRepository & {
    current(): ParentUpdateSubscription | null;
    delivered: string[][];
    rescheduled: typeof rescheduled;
    failed: typeof failed;
    forceLease(token: string | null): void;
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
    async markVerified(
      id,
      expectedHash,
      expectedVersion,
      verifiedAt
    ): Promise<ParentTokenMutationResult> {
      if (value?.id !== id) return "miss";
      if (
        value.verificationTokenHash !== expectedHash ||
        value.verificationVersion !== expectedVersion
      ) return "miss";
      if (value.verifiedAt) return "already_applied";
      if (new Date(value.verificationExpiresAt).getTime() <= new Date(verifiedAt).getTime()) {
        return "expired";
      }
      value = { ...value, verifiedAt };
      return "applied";
    },
    async markUnsubscribed(
      id,
      expectedHash,
      expectedVersion,
      unsubscribedAt
    ): Promise<ParentTokenMutationResult> {
      if (value?.id !== id) return "miss";
      if (
        value.unsubscribeTokenHash !== expectedHash ||
        value.unsubscribeVersion !== expectedVersion
      ) return "miss";
      if (value.unsubscribedAt) return "already_applied";
      value = { ...value, unsubscribedAt };
      return "applied";
    },
    async renewLease(_subscriptionId, leaseToken) {
      if (activeLeaseToken && activeLeaseToken !== leaseToken) return false;
      activeLeaseToken = leaseToken;
      return true;
    },
    async freezeDeliveryGroup(_ids, _subscriptionId, leaseToken) {
      return activeLeaseToken === leaseToken;
    },
    async markDelivered(ids, _subscriptionId, leaseToken) {
      if (activeLeaseToken !== leaseToken) return false;
      delivered.push(ids);
      return true;
    },
    async reschedule(
      ids,
      _subscriptionId,
      leaseToken,
      scheduledAt,
      errorCode,
      incrementAttempt
    ) {
      if (activeLeaseToken !== leaseToken) return false;
      rescheduled.push({ ids, scheduledAt, errorCode, incrementAttempt });
      return true;
    },
    async markFailed(ids, _subscriptionId, leaseToken, errorCode) {
      if (activeLeaseToken !== leaseToken) return false;
      failed.push({ ids, errorCode });
      return true;
    },
    async releaseLease(_subscriptionId, leaseToken) {
      if (activeLeaseToken !== leaseToken) return false;
      activeLeaseToken = null;
      return true;
    },
    current: () => value,
    delivered,
    rescheduled,
    failed,
    forceLease(token) {
      activeLeaseToken = token;
    },
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

test("derives one stable opaque subscription id for concurrent first contact saves", () => {
  const first = deriveParentSubscriptionId(TRIAL_ID, SECRET);
  expect(first).toBe(deriveParentSubscriptionId(TRIAL_ID, SECRET));
  expect(first).not.toBe(
    deriveParentSubscriptionId("33333333-3333-4333-8333-333333333333", SECRET)
  );
  expect(first).toMatch(
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/
  );
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

test("a rotated verification token cannot verify the replacement contact", async () => {
  const oldToken = (await import("../parent-updates")).deriveBearerToken(
    "verification", SUBSCRIPTION_ID, 1, SECRET
  );
  const repository = memoryRepository(subscription({
    normalizedEmail: "old-parent@example.com",
    verificationTokenHash: hashBearerToken(oldToken),
    verificationVersion: 1,
  }));
  const originalFind = repository.findByVerificationHash.bind(repository);
  repository.findByVerificationHash = async (hash) => {
    const found = await originalFind(hash);
    const stale = found ? { ...found } : null;
    const current = repository.current();
    if (current) {
      current.normalizedEmail = "new-parent@example.com";
      current.verificationTokenHash = "a".repeat(64);
      current.verificationVersion = 2;
      current.verifiedAt = null;
    }
    return stale;
  };

  await expect(verifyParentUpdates(repository, oldToken, NOW))
    .rejects.toMatchObject({ code: "not_found", status: 404 });
  expect(repository.current()).toMatchObject({
    normalizedEmail: "new-parent@example.com",
    verificationVersion: 2,
    verifiedAt: null,
  });
});

test("a rotated unsubscribe token cannot cancel a reactivated contact", async () => {
  const oldToken = (await import("../parent-updates")).deriveBearerToken(
    "unsubscribe", SUBSCRIPTION_ID, 1, SECRET
  );
  const repository = memoryRepository(subscription({
    verifiedAt: NOW.toISOString(),
    unsubscribeTokenHash: hashBearerToken(oldToken),
    unsubscribeVersion: 1,
  }));
  const originalFind = repository.findByUnsubscribeHash.bind(repository);
  repository.findByUnsubscribeHash = async (hash) => {
    const found = await originalFind(hash);
    const stale = found ? { ...found } : null;
    const current = repository.current();
    if (current) {
      current.unsubscribeTokenHash = "b".repeat(64);
      current.unsubscribeVersion = 2;
      current.unsubscribedAt = null;
      current.revokedAt = null;
    }
    return stale;
  };

  await expect(unsubscribeParentUpdates(repository, oldToken, NOW))
    .rejects.toMatchObject({ code: "not_found", status: 404 });
  expect(repository.current()).toMatchObject({
    unsubscribeVersion: 2,
    unsubscribedAt: null,
    revokedAt: null,
  });
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
    leaseToken: "lease-progress",
    leasedUntil: "2026-07-22T10:15:00.000Z",
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
    leaseToken: "lease-progress",
    leasedUntil: "2026-07-22T10:15:00.000Z",
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

test("delivery retries preserve an order-independent idempotency key", async () => {
  const rows: ClaimedParentUpdate[] = ["event-b", "event-a"].map((id) => ({
    id,
    subscriptionId: SUBSCRIPTION_ID,
    eventKind: "milestone_completed",
    safePayload: { seedTitle: "AI Builder", eventId: id },
    attemptCount: 0,
    normalizedEmail: "parent@example.com",
    lastProgressDeliveredAt: null,
    unsubscribeVersion: 1,
    leaseToken: "lease-first-attempt",
    leasedUntil: "2026-07-22T10:15:00.000Z",
  }));
  const send = jest.fn().mockResolvedValue({
    ok: false,
    transient: true,
    code: "provider_unavailable",
  });

  await processClaimedParentUpdates({
    rows,
    repository: memoryRepository(),
    send,
    now: NOW,
    origin: "https://passionseed.org",
    tokenSecret: SECRET,
  });
  await processClaimedParentUpdates({
    rows: rows.toReversed().map((row) => ({
      ...row,
      attemptCount: 1,
      leaseToken: "lease-retry",
    })),
    repository: memoryRepository(),
    send,
    now: new Date("2026-07-22T10:05:00.000Z"),
    origin: "https://passionseed.org",
    tokenSecret: SECRET,
  });

  const keys = send.mock.calls.map(([email]) => email.idempotencyKey);
  expect(keys[0]).toMatch(/^parent-update\/[0-9a-f]{64}$/);
  expect(keys[1]).toBe(keys[0]);
  expect(send.mock.calls[1][0].eventKinds).toEqual(send.mock.calls[0][0].eventKinds);
  expect(send.mock.calls[1][0].payloads).toEqual(send.mock.calls[0][0].payloads);
});

test("a frozen retry cohort does not absorb a newly due progress event", async () => {
  const firstRows: ClaimedParentUpdate[] = ["event-b", "event-a"].map((id) => ({
    id,
    subscriptionId: SUBSCRIPTION_ID,
    eventKind: "milestone_completed",
    safePayload: { eventId: id },
    attemptCount: 0,
    normalizedEmail: "parent@example.com",
    lastProgressDeliveredAt: null,
    unsubscribeVersion: 1,
    leaseToken: "lease-first",
    leasedUntil: "2026-07-22T10:15:00.000Z",
  }));
  const firstSend = jest.fn().mockResolvedValue({
    ok: false,
    transient: true,
    code: "provider_unavailable",
  });
  await processClaimedParentUpdates({
    rows: firstRows,
    repository: memoryRepository(),
    send: firstSend,
    now: NOW,
    origin: "https://passionseed.org",
    tokenSecret: SECRET,
  });
  const frozenKey = firstSend.mock.calls[0][0].idempotencyKey as string;

  const retryRows = [
    ...firstRows.toReversed().map((row) => ({
      ...row,
      attemptCount: 1,
      leaseToken: "lease-retry",
      deliveryGroupKey: frozenKey,
    })),
    {
      ...firstRows[0],
      id: "event-new",
      safePayload: { eventId: "event-new" },
      leaseToken: "lease-retry",
      deliveryGroupKey: null,
    },
  ] as ClaimedParentUpdate[];
  const retrySend = jest.fn().mockResolvedValue({ ok: true });
  await processClaimedParentUpdates({
    rows: retryRows,
    repository: memoryRepository(),
    send: retrySend,
    now: new Date("2026-07-22T10:05:00.000Z"),
    origin: "https://passionseed.org",
    tokenSecret: SECRET,
  });

  expect(retrySend).toHaveBeenCalledTimes(2);
  expect(retrySend.mock.calls[0][0]).toMatchObject({
    idempotencyKey: frozenKey,
    payloads: [{ eventId: "event-a" }, { eventId: "event-b" }],
  });
  expect(retrySend.mock.calls[1][0].idempotencyKey).not.toBe(frozenKey);
  expect(retrySend.mock.calls[1][0].payloads).toEqual([{ eventId: "event-new" }]);
});

test("deadline stop releases unsent work without consuming a retry attempt", async () => {
  const repository = memoryRepository();
  const send = jest.fn();
  const input = {
    rows: [{
      id: "event-deadline",
      subscriptionId: SUBSCRIPTION_ID,
      eventKind: "payment_status_changed" as const,
      safePayload: { status: "paid" },
      attemptCount: 2,
      normalizedEmail: "parent@example.com",
      lastProgressDeliveredAt: null,
      unsubscribeVersion: 1,
      leaseToken: "lease-deadline",
      leasedUntil: "2026-07-22T10:15:00.000Z",
    }],
    repository,
    send,
    now: NOW,
    origin: "https://passionseed.org",
    tokenSecret: SECRET,
    shouldContinue: () => false,
  } as Parameters<typeof processClaimedParentUpdates>[0];

  await processClaimedParentUpdates(input);

  expect(send).not.toHaveBeenCalled();
  expect(repository.rescheduled).toEqual([expect.objectContaining({
    ids: ["event-deadline"],
    errorCode: "delivery_deadline",
    incrementAttempt: false,
  })]);
});

test("distinct delivery groups receive distinct idempotency keys", async () => {
  const send = jest.fn().mockResolvedValue({ ok: true });
  const common = {
    subscriptionId: SUBSCRIPTION_ID,
    attemptCount: 0,
    normalizedEmail: "parent@example.com",
    lastProgressDeliveredAt: null,
    unsubscribeVersion: 1,
    leaseToken: "lease-mixed-groups",
    leasedUntil: "2026-07-22T10:15:00.000Z",
  };

  await processClaimedParentUpdates({
    rows: [
      {
        ...common,
        id: "event-payment-a",
        eventKind: "payment_status_changed",
        safePayload: { status: "pending" },
      },
      {
        ...common,
        id: "event-payment-b",
        eventKind: "payment_status_changed",
        safePayload: { status: "paid" },
      },
    ],
    repository: memoryRepository(),
    send,
    now: NOW,
    origin: "https://passionseed.org",
    tokenSecret: SECRET,
  });

  const keys = send.mock.calls.map(([email]) => email.idempotencyKey);
  expect(keys).toHaveLength(2);
  expect(new Set(keys).size).toBe(2);
});

test("uses non-sensitive terminal codes for permanent provider rejection", async () => {
  const repository = memoryRepository();
  await processClaimedParentUpdates({
    rows: [{
      id: "event-payment", subscriptionId: SUBSCRIPTION_ID,
      eventKind: "payment_status_changed", safePayload: { status: "paid" },
      attemptCount: 0, normalizedEmail: "parent@example.com",
      lastProgressDeliveredAt: null, unsubscribeVersion: 1,
      leaseToken: "lease-payment", leasedUntil: "2026-07-22T10:15:00.000Z",
    }],
    repository,
    send: jest.fn().mockResolvedValue({ ok: false, transient: false, code: "provider_rejected" }),
    now: NOW,
    origin: "https://passionseed.org",
    tokenSecret: SECRET,
  });
  expect(repository.failed).toEqual([{ ids: ["event-payment"], errorCode: "provider_rejected" }]);
});

test("two concurrent workers cannot send progress for the same subscription", async () => {
  const repository = memoryRepository();
  const send = jest.fn().mockResolvedValue({ ok: true });
  const base: ClaimedParentUpdate = {
    id: "event-concurrent",
    subscriptionId: SUBSCRIPTION_ID,
    eventKind: "milestone_completed",
    safePayload: { seedTitle: "AI Builder", currentDay: 3 },
    attemptCount: 0,
    normalizedEmail: "parent@example.com",
    lastProgressDeliveredAt: null,
    unsubscribeVersion: 1,
    leaseToken: "worker-a",
    leasedUntil: "2026-07-22T10:15:00.000Z",
  };

  await Promise.all([
    processClaimedParentUpdates({
      rows: [base], repository, send, now: NOW,
      origin: "https://passionseed.org", tokenSecret: SECRET,
    }),
    processClaimedParentUpdates({
      rows: [{ ...base, leaseToken: "worker-b" }], repository, send, now: NOW,
      origin: "https://passionseed.org", tokenSecret: SECRET,
    }),
  ]);

  expect(send).toHaveBeenCalledTimes(1);
  expect(repository.delivered).toHaveLength(1);
});

test("a worker that loses its lease cannot send or finalize stale rows", async () => {
  const repository = memoryRepository();
  repository.forceLease("new-owner");
  const send = jest.fn().mockResolvedValue({ ok: true });
  await processClaimedParentUpdates({
    rows: [{
      id: "event-stale",
      subscriptionId: SUBSCRIPTION_ID,
      eventKind: "milestone_completed",
      safePayload: { seedTitle: "AI Builder" },
      attemptCount: 0,
      normalizedEmail: "parent@example.com",
      lastProgressDeliveredAt: null,
      unsubscribeVersion: 1,
      leaseToken: "old-owner",
      leasedUntil: "2026-07-22T09:59:00.000Z",
    }],
    repository,
    send,
    now: NOW,
    origin: "https://passionseed.org",
    tokenSecret: SECRET,
  });
  expect(send).not.toHaveBeenCalled();
  expect(repository.delivered).toHaveLength(0);
});

test.each(["unsubscribed", "revoked"] as const)(
  "%s consent after lease acquisition prevents the transport call",
  async (state) => {
    const repository = memoryRepository(
      subscription({ verifiedAt: NOW.toISOString() })
    );
    const originalRenew = repository.renewLease.bind(repository);
    let renewals = 0;
    repository.renewLease = async (...args) => {
      renewals += 1;
      if (renewals === 1) {
        const acquired = await originalRenew(...args);
        const current = repository.current();
        if (current) {
          if (state === "unsubscribed") current.unsubscribedAt = NOW.toISOString();
          else current.revokedAt = NOW.toISOString();
        }
        return acquired;
      }
      const current = repository.current();
      if (current?.unsubscribedAt || current?.revokedAt) return false;
      return originalRenew(...args);
    };
    const send = jest.fn().mockResolvedValue({ ok: true });

    await processClaimedParentUpdates({
      rows: [{
        id: `event-${state}`,
        subscriptionId: SUBSCRIPTION_ID,
        eventKind: "milestone_completed",
        safePayload: { seedTitle: "AI Builder" },
        attemptCount: 0,
        normalizedEmail: "parent@example.com",
        lastProgressDeliveredAt: null,
        unsubscribeVersion: 1,
        leaseToken: `lease-${state}`,
        leasedUntil: "2026-07-22T10:15:00.000Z",
      }],
      repository,
      send,
      now: NOW,
      origin: "https://passionseed.org",
      tokenSecret: SECRET,
    });

    expect(renewals).toBe(2);
    expect(send).not.toHaveBeenCalled();
    expect(repository.delivered).toHaveLength(0);
  }
);

test("ParentUpdateError never needs private trial data", () => {
  expect(new ParentUpdateError("not_found", 404).message).toBe("not_found");
});
