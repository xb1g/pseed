export type TrialLaunchStatus = "active" | "pending" | "paid" | "expired";

export interface TrialLaunchTrial {
  id: string;
  payToken: string;
  status: TrialLaunchStatus;
  paymentDeadline: string;
  paidAt: string | null;
}

export interface TrialLaunchEnrollment {
  id: string;
  currentDay: number;
  status: "active" | "paused" | "quit" | "explored";
}

export interface TrialLaunchRepository {
  findPathLabSeed(seedId: string): Promise<{ id: string; pathId: string } | null>;
  createTrial(userId: string, seedId: string): Promise<TrialLaunchTrial>;
  findTrial(userId: string, seedId: string): Promise<TrialLaunchTrial | null>;
  findEnrollment(userId: string, pathId: string): Promise<TrialLaunchEnrollment | null>;
  createEnrollment(userId: string, pathId: string): Promise<TrialLaunchEnrollment>;
}

export class TrialLaunchError extends Error {
  constructor(
    public readonly code: string,
    public readonly status: number
  ) {
    super(code);
    this.name = "TrialLaunchError";
  }
}

function isUniqueViolation(error: unknown): boolean {
  return Boolean(
    error &&
      typeof error === "object" &&
      "code" in error &&
      (error as { code?: string }).code === "23505"
  );
}

export async function startTrialAndEnrollment(
  input: { userId: string; seedId: string },
  repository: TrialLaunchRepository
): Promise<{
  trialId: string;
  payToken: string;
  payUrl: string;
  status: TrialLaunchStatus;
  paymentDeadline: string;
  enrollmentId: string;
  enrollmentUrl: string;
}> {
  const seed = await repository.findPathLabSeed(input.seedId);
  if (!seed) throw new TrialLaunchError("seed_not_found", 404);

  let trial: TrialLaunchTrial;
  try {
    trial = await repository.createTrial(input.userId, input.seedId);
  } catch (error) {
    if (!isUniqueViolation(error)) throw error;
    const existing = await repository.findTrial(input.userId, input.seedId);
    if (!existing) throw error;
    trial = existing;
  }

  let enrollment = await repository.findEnrollment(input.userId, seed.pathId);
  if (!enrollment) {
    try {
      enrollment = await repository.createEnrollment(input.userId, seed.pathId);
    } catch (error) {
      if (!isUniqueViolation(error)) throw error;
      enrollment = await repository.findEnrollment(input.userId, seed.pathId);
      if (!enrollment) throw error;
    }
  }

  return {
    trialId: trial.id,
    payToken: trial.payToken,
    payUrl: `/pay/${trial.payToken}`,
    status: trial.status,
    paymentDeadline: trial.paymentDeadline,
    enrollmentId: enrollment.id,
    enrollmentUrl: `/seeds/pathlab/${enrollment.id}?day=${enrollment.currentDay}`,
  };
}
