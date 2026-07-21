import type {
  MyPathDashboardEnrollment,
  MyPathDashboardProgress,
  MyPathDashboardTrial,
} from "./dashboard";

interface DashboardQueryResult {
  data: unknown[] | null;
  error: { message: string } | null;
}

interface DashboardFilterBuilder {
  eq(column: string, value: unknown): PromiseLike<DashboardQueryResult>;
  in(column: string, values: unknown[]): PromiseLike<DashboardQueryResult>;
}

export interface MyPathDashboardReadClient {
  from(table: string): unknown;
}

export interface MyPathDashboardReadSource {
  enrollments: MyPathDashboardEnrollment[];
  trials: MyPathDashboardTrial[];
  progress: MyPathDashboardProgress[];
}

const ENROLLMENTS_SELECT = `
  id,
  path_id,
  current_day,
  status,
  enrolled_at,
  completed_at,
  path:paths!inner(
    id,
    seed_id,
    seed:seeds!inner(id, title)
  ),
  path_end_reflections(id, fit_level, would_explore_deeper, created_at),
  path_reports(id, created_at)
`;

const TRIALS_SELECT = `
  id,
  seed_id,
  status,
  pay_token,
  payment_deadline,
  paid_at
`;

const PROGRESS_SELECT = `
  enrollment_id,
  status,
  updated_at,
  completed_at
`;

function record(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function firstRecord(value: unknown): Record<string, unknown> | null {
  if (Array.isArray(value)) return record(value[0]);
  return record(value);
}

function requiredString(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function nullableString(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function mapEnrollment(value: unknown): MyPathDashboardEnrollment | null {
  const row = record(value);
  const path = firstRecord(row?.path);
  const seed = firstRecord(path?.seed);
  const id = requiredString(row?.id);
  const pathId = requiredString(row?.path_id) ?? requiredString(path?.id);
  const seedId = requiredString(path?.seed_id) ?? requiredString(seed?.id);
  const seedTitle = requiredString(seed?.title);
  const status = requiredString(row?.status);
  const enrolledAt = requiredString(row?.enrolled_at);
  if (
    !id ||
    !pathId ||
    !seedId ||
    !seedTitle ||
    !enrolledAt ||
    !status ||
    !["active", "paused", "quit", "explored"].includes(status)
  ) {
    return null;
  }

  const end = firstRecord(row?.path_end_reflections);
  const report = firstRecord(row?.path_reports);
  const endId = requiredString(end?.id);
  const endCreatedAt = requiredString(end?.created_at);
  const reportId = requiredString(report?.id);
  const reportCreatedAt = requiredString(report?.created_at);

  return {
    id,
    pathId,
    seedId,
    seedTitle,
    status: status as MyPathDashboardEnrollment["status"],
    currentDay:
      typeof row?.current_day === "number" && Number.isFinite(row.current_day)
        ? row.current_day
        : Number(row?.current_day) || 1,
    enrolledAt,
    completedAt: nullableString(row?.completed_at),
    endReflection:
      endId && endCreatedAt
        ? {
            id: endId,
            fitLevel:
              typeof end?.fit_level === "number" ? end.fit_level : null,
            wouldExploreDeeper: nullableString(end?.would_explore_deeper),
            createdAt: endCreatedAt,
          }
        : null,
    report:
      reportId && reportCreatedAt
        ? { id: reportId, createdAt: reportCreatedAt }
        : null,
  };
}

function mapTrial(value: unknown): MyPathDashboardTrial | null {
  const row = record(value);
  const id = requiredString(row?.id);
  const seedId = requiredString(row?.seed_id);
  const status = requiredString(row?.status);
  const payToken = requiredString(row?.pay_token);
  const paymentDeadline = requiredString(row?.payment_deadline);
  if (
    !id ||
    !seedId ||
    !payToken ||
    !paymentDeadline ||
    !status ||
    !["active", "pending", "paid", "expired"].includes(status)
  ) {
    return null;
  }
  return {
    id,
    seedId,
    status: status as MyPathDashboardTrial["status"],
    payToken,
    paymentDeadline,
    paidAt: nullableString(row?.paid_at),
  };
}

function mapProgress(value: unknown): MyPathDashboardProgress | null {
  const row = record(value);
  const enrollmentId = requiredString(row?.enrollment_id);
  const status = requiredString(row?.status);
  const updatedAt = requiredString(row?.updated_at);
  if (
    !enrollmentId ||
    !updatedAt ||
    !status ||
    !["not_started", "in_progress", "completed", "skipped"].includes(status)
  ) {
    return null;
  }
  return {
    enrollmentId,
    status: status as MyPathDashboardProgress["status"],
    updatedAt,
    completedAt: nullableString(row?.completed_at),
  };
}

function mapped<T>(values: unknown[] | null, map: (value: unknown) => T | null): T[] {
  return (values ?? []).flatMap((value) => {
    const item = map(value);
    return item ? [item] : [];
  });
}

function logReadError(section: string, error: { message: string } | null): void {
  if (error) {
    console.error(`[My Path dashboard] ${section} read failed:`, error.message);
  }
}

function selectFrom(
  client: MyPathDashboardReadClient,
  table: string,
  columns: string
): DashboardFilterBuilder {
  return (client.from(table) as {
    select(selectedColumns: string): DashboardFilterBuilder;
  }).select(columns);
}

export async function loadMyPathDashboardSource(
  client: MyPathDashboardReadClient,
  userId: string
): Promise<MyPathDashboardReadSource> {
  const [enrollmentResult, trialResult] = await Promise.all([
    selectFrom(client, "path_enrollments", ENROLLMENTS_SELECT).eq(
      "user_id",
      userId
    ),
    selectFrom(client, "trial_accesses", TRIALS_SELECT).eq("user_id", userId),
  ]);

  logReadError("PathLab enrollment", enrollmentResult.error);
  logReadError("trial access", trialResult.error);

  const enrollments = mapped(enrollmentResult.data, mapEnrollment).sort((a, b) =>
    a.id.localeCompare(b.id)
  );
  const trials = mapped(trialResult.data, mapTrial).sort(
    (a, b) => a.seedId.localeCompare(b.seedId) || a.id.localeCompare(b.id)
  );

  let progress: MyPathDashboardProgress[] = [];
  if (enrollments.length > 0) {
    const progressResult = await selectFrom(
      client,
      "path_activity_progress",
      PROGRESS_SELECT
    ).in(
        "enrollment_id",
        enrollments.map((item) => item.id)
      );
    logReadError("activity progress", progressResult.error);
    progress = mapped(progressResult.data, mapProgress).sort(
      (a, b) =>
        a.enrollmentId.localeCompare(b.enrollmentId) ||
        a.updatedAt.localeCompare(b.updatedAt)
    );
  }

  return { enrollments, trials, progress };
}
