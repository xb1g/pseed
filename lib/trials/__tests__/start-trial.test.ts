import { startTrialAndEnrollment, type TrialLaunchRepository } from "../start-trial";

const USER_ID = "11111111-1111-4111-8111-111111111111";
const SEED_ID = "22222222-2222-4222-8222-222222222222";
const PATH_ID = "33333333-3333-4333-8333-333333333333";
const TRIAL_ID = "44444444-4444-4444-8444-444444444444";
const ENROLLMENT_ID = "55555555-5555-4555-8555-555555555555";

function repository(overrides: Partial<TrialLaunchRepository> = {}): TrialLaunchRepository {
  return {
    async findPathLabSeed() {
      return { id: SEED_ID, pathId: PATH_ID };
    },
    async createTrial() {
      return {
        id: TRIAL_ID,
        payToken: "a".repeat(32),
        status: "active",
        paymentDeadline: "2026-07-23T10:00:00.000Z",
        paidAt: null,
      };
    },
    async findTrial() { return null; },
    async findEnrollment() { return null; },
    async createEnrollment() {
      return { id: ENROLLMENT_ID, currentDay: 1, status: "active" };
    },
    ...overrides,
  };
}

test("does not report launch success until both trial and enrollment exist", async () => {
  await expect(startTrialAndEnrollment({ userId: USER_ID, seedId: SEED_ID }, repository({
    async createEnrollment() { throw new Error("database unavailable"); },
  }))).rejects.toThrow("database unavailable");
});

test("returns enrollment identity and URL only after both records exist", async () => {
  const result = await startTrialAndEnrollment(
    { userId: USER_ID, seedId: SEED_ID },
    repository()
  );
  expect(result).toMatchObject({
    trialId: TRIAL_ID,
    enrollmentId: ENROLLMENT_ID,
    enrollmentUrl: `/seeds/pathlab/${ENROLLMENT_ID}?day=1`,
    payUrl: `/pay/${"a".repeat(32)}`,
  });
});

test("reuses a partially-created trial and retries only the missing enrollment", async () => {
  const existingTrial = {
    id: TRIAL_ID,
    payToken: "b".repeat(32),
    status: "active" as const,
    paymentDeadline: "2026-07-23T10:00:00.000Z",
    paidAt: null,
  };
  const createTrial = jest.fn().mockRejectedValue(Object.assign(new Error("duplicate"), { code: "23505" }));
  const createEnrollment = jest.fn().mockResolvedValue({
    id: ENROLLMENT_ID, currentDay: 2, status: "active",
  });
  const result = await startTrialAndEnrollment(
    { userId: USER_ID, seedId: SEED_ID },
    repository({
      createTrial,
      async findTrial() { return existingTrial; },
      createEnrollment,
    })
  );
  expect(createTrial).toHaveBeenCalledTimes(1);
  expect(createEnrollment).toHaveBeenCalledTimes(1);
  expect(result.trialId).toBe(TRIAL_ID);
  expect(result.enrollmentUrl).toContain("?day=2");
});

test("reuses an existing enrollment without creating a duplicate", async () => {
  const createEnrollment = jest.fn();
  const result = await startTrialAndEnrollment(
    { userId: USER_ID, seedId: SEED_ID },
    repository({
      async findEnrollment() {
        return { id: ENROLLMENT_ID, currentDay: 3, status: "paused" };
      },
      createEnrollment,
    })
  );
  expect(createEnrollment).not.toHaveBeenCalled();
  expect(result.enrollmentId).toBe(ENROLLMENT_ID);
  expect(result.enrollmentUrl).toContain("?day=3");
});

test("rejects non-PathLab seeds before creating a trial", async () => {
  const createTrial = jest.fn();
  await expect(startTrialAndEnrollment(
    { userId: USER_ID, seedId: SEED_ID },
    repository({ async findPathLabSeed() { return null; }, createTrial })
  )).rejects.toMatchObject({ code: "seed_not_found", status: 404 });
  expect(createTrial).not.toHaveBeenCalled();
});
