import { startTrialAndEnrollment, type TrialLaunchRepository } from "../start-trial";

const SEED_ID = "22222222-2222-4222-8222-222222222222";
const TRIAL_ID = "44444444-4444-4444-8444-444444444444";
const ENROLLMENT_ID = "55555555-5555-4555-8555-555555555555";

function repository(overrides: Partial<TrialLaunchRepository> = {}): TrialLaunchRepository {
  return {
    async launch() {
      return {
        trial: {
          id: TRIAL_ID,
          payToken: "a".repeat(32),
          status: "active",
          paymentDeadline: "2026-07-23T10:00:00.000Z",
          paidAt: null,
        },
        enrollment: {
          id: ENROLLMENT_ID,
          currentDay: 1,
          status: "active",
        },
      };
    },
    ...overrides,
  };
}

test("returns enrollment identity only after the atomic launch confirms both records", async () => {
  const result = await startTrialAndEnrollment(
    { seedId: SEED_ID },
    repository()
  );

  expect(result).toMatchObject({
    trialId: TRIAL_ID,
    enrollmentId: ENROLLMENT_ID,
    enrollmentUrl: `/seeds/pathlab/${ENROLLMENT_ID}?day=1`,
    payUrl: `/pay/${"a".repeat(32)}`,
  });
});

test("does not report accessible launch when the atomic result lacks enrollment", async () => {
  await expect(
    startTrialAndEnrollment(
      { seedId: SEED_ID },
      repository({
        async launch() {
          return {
            trial: {
              id: TRIAL_ID,
              payToken: "a".repeat(32),
              status: "active",
              paymentDeadline: "2026-07-23T10:00:00.000Z",
              paidAt: null,
            },
            enrollment: null,
          };
        },
      })
    )
  ).rejects.toMatchObject({ code: "launch_incomplete", status: 409 });
});

test("returns expired recovery without an enrollment URL", async () => {
  const result = await startTrialAndEnrollment(
    { seedId: SEED_ID },
    repository({
      async launch() {
        return {
          trial: {
            id: TRIAL_ID,
            payToken: "c".repeat(32),
            status: "expired",
            paymentDeadline: "2026-07-21T10:00:00.000Z",
            paidAt: null,
          },
          enrollment: null,
        };
      },
    })
  );

  expect(result).toMatchObject({
    status: "expired",
    enrollmentId: null,
    enrollmentUrl: null,
  });
});

test("rejects non-PathLab seeds returned as no atomic launch", async () => {
  const launch = jest.fn().mockResolvedValue(null);

  await expect(
    startTrialAndEnrollment({ seedId: SEED_ID }, repository({ launch }))
  ).rejects.toMatchObject({ code: "seed_not_found", status: 404 });
  expect(launch).toHaveBeenCalledWith(SEED_ID);
});
