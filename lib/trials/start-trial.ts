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

export interface AtomicTrialLaunch {
  trial: TrialLaunchTrial;
  enrollment: TrialLaunchEnrollment | null;
}

export interface TrialLaunchRepository {
  launch(seedId: string): Promise<AtomicTrialLaunch | null>;
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

export async function startTrialAndEnrollment(
  input: { seedId: string },
  repository: TrialLaunchRepository
): Promise<{
  trialId: string;
  payToken: string;
  payUrl: string;
  status: TrialLaunchStatus;
  paymentDeadline: string;
  enrollmentId: string | null;
  enrollmentUrl: string | null;
}> {
  const launch = await repository.launch(input.seedId);
  if (!launch) throw new TrialLaunchError("seed_not_found", 404);

  const { trial, enrollment } = launch;
  if (trial.status !== "expired" && !enrollment) {
    throw new TrialLaunchError("launch_incomplete", 409);
  }

  return {
    trialId: trial.id,
    payToken: trial.payToken,
    payUrl: `/pay/${trial.payToken}`,
    status: trial.status,
    paymentDeadline: trial.paymentDeadline,
    enrollmentId: enrollment?.id ?? null,
    enrollmentUrl: enrollment
      ? `/seeds/pathlab/${enrollment.id}?day=${enrollment.currentDay}`
      : null,
  };
}
