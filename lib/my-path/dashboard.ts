import {
  getGoalTimeline,
  getLockedGoal,
  getSavedPossibilities,
  getSelectedPathlabs,
} from "./journey";
import { buildMissionPlan, type MissionGoal } from "./mission-plan";
import { getRegistryItem } from "./registry";
import type { PersistedMyPathState } from "./server-read";

export type MyPathDashboardState = "empty" | "planned" | "active" | "completed";
export type MyPathEnrollmentStatus = "active" | "paused" | "quit" | "explored";
export type MyPathTrialStatus = "active" | "pending" | "paid" | "expired";

export interface MyPathDashboardEnrollment {
  id: string;
  pathId: string;
  seedId: string;
  seedTitle: string;
  status: MyPathEnrollmentStatus;
  currentDay: number;
  enrolledAt: string;
  completedAt: string | null;
  endReflection: {
    id: string;
    fitLevel: number | null;
    wouldExploreDeeper: string | null;
    createdAt: string;
  } | null;
  report: { id: string; createdAt: string } | null;
}

export interface MyPathDashboardTrial {
  id: string;
  seedId: string;
  status: MyPathTrialStatus;
  payToken: string;
  paymentDeadline: string;
  paidAt: string | null;
}

export interface MyPathDashboardProgress {
  enrollmentId: string;
  status: "not_started" | "in_progress" | "completed" | "skipped";
  updatedAt: string;
  completedAt: string | null;
}

export interface MyPathDashboardSource {
  persistedPath: PersistedMyPathState | null;
  persistedPathStatus: "ready" | "error";
  enrollments: MyPathDashboardEnrollment[];
  trials: MyPathDashboardTrial[];
  progress: MyPathDashboardProgress[];
}

export interface MyPathPathlabSummary {
  seedId: string;
  title: string;
  enrollmentId: string | null;
  status: "selected" | MyPathEnrollmentStatus;
  currentDay: number | null;
  completedActivities: number;
  href: string;
  trial: {
    status: MyPathTrialStatus;
    label: string;
    payHref: string;
    paymentDeadline: string;
  } | null;
}

export interface MyPathEvidence {
  id: string;
  kind: "pathlab-report" | "pathlab-fit";
  seedId: string;
  label: string;
  detail: string;
  createdAt: string;
  href: string;
}

export interface MyPathDashboardModel {
  state: MyPathDashboardState;
  nextAction: {
    kind: string;
    title: string;
    detail: string;
    href: string;
  };
  plan: {
    goal: string | null;
    timelineMonths: number;
    headline: string;
  } | null;
  radarDirections: Array<{ slug: string; title: string; href: string }>;
  pathlabs: MyPathPathlabSummary[];
  evidence: MyPathEvidence[];
}

interface BuildOptions {
  now?: string;
}

const TRIAL_LABELS: Record<MyPathTrialStatus, string> = {
  active: "กำลังทดลอง",
  pending: "รอตรวจสอบการชำระเงิน",
  paid: "ชำระแล้ว",
  expired: "หมดเวลาทดลอง",
};

const MISSION_GOALS = new Set<MissionGoal>([
  "university",
  "job",
  "scholarship",
  "exploring",
]);

function effectiveTrialStatus(
  trial: MyPathDashboardTrial,
  now: string
): MyPathTrialStatus {
  if (
    trial.status === "active" &&
    new Date(trial.paymentDeadline).getTime() <= new Date(now).getTime()
  ) {
    return "expired";
  }
  return trial.status;
}

function trialIsAccessible(
  trial: MyPathDashboardTrial | undefined,
  now: string
): boolean {
  if (!trial) return true;
  return effectiveTrialStatus(trial, now) !== "expired";
}

function enrollmentIsComplete(enrollment: MyPathDashboardEnrollment): boolean {
  return enrollment.status === "explored" || enrollment.endReflection !== null;
}

function latestProgressAt(
  enrollmentId: string,
  progress: MyPathDashboardProgress[]
): string {
  return progress
    .filter((item) => item.enrollmentId === enrollmentId)
    .reduce(
      (latest, item) => (item.updatedAt > latest ? item.updatedAt : latest),
      ""
    );
}

function sortEligibleEnrollments(
  enrollments: MyPathDashboardEnrollment[],
  progress: MyPathDashboardProgress[]
): MyPathDashboardEnrollment[] {
  return [...enrollments].sort((left, right) => {
    const progressOrder = latestProgressAt(right.id, progress).localeCompare(
      latestProgressAt(left.id, progress)
    );
    if (progressOrder) return progressOrder;
    const enrollmentOrder = right.enrolledAt.localeCompare(left.enrolledAt);
    if (enrollmentOrder) return enrollmentOrder;
    return left.id.localeCompare(right.id);
  });
}

function selectedPathlabTitle(
  state: PersistedMyPathState,
  seedId: string
): string | null {
  const selected = [...state.draft.events]
    .reverse()
    .find(
      (event) =>
        event.type === "pathlab_selected" && event.metadata?.seedId === seedId
    );
  return typeof selected?.metadata?.title === "string"
    ? selected.metadata.title
    : null;
}

function buildPlan(state: PersistedMyPathState) {
  const goalValue = getLockedGoal(state.draft);
  const goal = MISSION_GOALS.has(goalValue as MissionGoal)
    ? (goalValue as MissionGoal)
    : null;
  const timelineMonths = Number(getGoalTimeline(state.draft)) || 4;
  const selectedSeedIds = getSelectedPathlabs(state.draft);
  const plan = buildMissionPlan({
    goal,
    timelineMonths,
    careerTitles: getSavedPossibilities(state.draft).map(
      (item) => getRegistryItem(item.slug)?.titleTh ?? item.slug
    ),
    pathlabTitles: selectedSeedIds.map(
      (seedId) => selectedPathlabTitle(state, seedId) ?? seedId
    ),
  });
  return {
    goal: goalValue,
    timelineMonths: plan.timelineMonths,
    headline: plan.headline,
  };
}

function buildRadarDirections(state: PersistedMyPathState) {
  return getSavedPossibilities(state.draft)
    .slice(0, 3)
    .map((item) => ({
      slug: item.slug,
      title: getRegistryItem(item.slug)?.titleTh ?? item.slug,
      href: `/radar/${item.slug}`,
    }));
}

function buildPathlabSummaries(
  source: MyPathDashboardSource,
  now: string
): MyPathPathlabSummary[] {
  const selectedIds = source.persistedPath
    ? getSelectedPathlabs(source.persistedPath.draft)
    : [];
  const enrollmentBySeed = new Map(
    source.enrollments.map((item) => [item.seedId, item])
  );
  const trialBySeed = new Map(source.trials.map((item) => [item.seedId, item]));
  const orderedSeedIds = [
    ...selectedIds,
    ...source.enrollments
      .map((item) => item.seedId)
      .filter((seedId) => !selectedIds.includes(seedId)),
  ];

  return orderedSeedIds.map((seedId) => {
    const enrollment = enrollmentBySeed.get(seedId);
    const trial = trialBySeed.get(seedId);
    const trialStatus = trial ? effectiveTrialStatus(trial, now) : null;
    const title =
      enrollment?.seedTitle ??
      (source.persistedPath
        ? selectedPathlabTitle(source.persistedPath, seedId)
        : null) ??
      "PathLab";
    return {
      seedId,
      title,
      enrollmentId: enrollment?.id ?? null,
      status: enrollment?.status ?? "selected",
      currentDay: enrollment?.currentDay ?? null,
      completedActivities: source.progress.filter(
        (item) => item.enrollmentId === enrollment?.id && item.status === "completed"
      ).length,
      href: enrollment
        ? `/seeds/pathlab/${enrollment.id}?day=${enrollment.currentDay}`
        : `/seeds/${seedId}`,
      trial:
        trial && trialStatus
          ? {
              status: trialStatus,
              label: TRIAL_LABELS[trialStatus],
              payHref: `/pay/${trial.payToken}`,
              paymentDeadline: trial.paymentDeadline,
            }
          : null,
    };
  });
}

function buildEvidence(source: MyPathDashboardSource): MyPathEvidence[] {
  return source.enrollments
    .filter(enrollmentIsComplete)
    .flatMap((enrollment) => {
      const completedActivities = source.progress.filter(
        (item) => item.enrollmentId === enrollment.id && item.status === "completed"
      ).length;
      const createdAt =
        enrollment.completedAt ??
        enrollment.endReflection?.createdAt ??
        enrollment.enrolledAt;
      const evidence: MyPathEvidence[] = [];
      if (enrollment.report) {
        evidence.push({
          id: `pathlab-report-${enrollment.report.id}`,
          kind: "pathlab-report",
          seedId: enrollment.seedId,
          label: `รายงาน PathLab · ${enrollment.seedTitle}`,
          detail: "ชิ้นงานและรายงานจากการทดลองทำงานจริง",
          createdAt: enrollment.report.createdAt,
          href: `/seeds/pathlab/${enrollment.id}`,
        });
      }
      evidence.push({
        id: `pathlab-fit-${enrollment.id}`,
        kind: "pathlab-fit",
        seedId: enrollment.seedId,
        label: `สัญญาณความเหมาะสม · ${enrollment.seedTitle}`,
        detail:
          completedActivities > 0
            ? `ทดลองจบพร้อมกิจกรรมที่ทำสำเร็จ ${completedActivities} กิจกรรม`
            : "ทดลอง PathLab จบแล้ว พร้อมใช้ผลลัพธ์ตัดสินใจก้าวต่อไป",
        createdAt,
        href: `/seeds/pathlab/${enrollment.id}`,
      });
      return evidence;
    });
}

function action(
  kind: string,
  title: string,
  detail: string,
  href: string
): MyPathDashboardModel["nextAction"] {
  return { kind, title, detail, href };
}

export function buildMyPathDashboard(
  source: MyPathDashboardSource,
  options: BuildOptions = {}
): MyPathDashboardModel {
  const now = options.now ?? new Date().toISOString();
  if (source.persistedPathStatus === "error") {
    return {
      state: "empty",
      nextAction: action(
        "retry-my-path",
        "ลองเปิด My Path อีกครั้ง",
        "ข้อมูลแผนยังโหลดไม่สำเร็จ แต่เส้นทางของคุณยังอยู่",
        "/me"
      ),
      plan: null,
      radarDirections: [],
      pathlabs: buildPathlabSummaries(source, now),
      evidence: buildEvidence(source),
    };
  }
  if (!source.persistedPath) {
    return {
      state: "empty",
      nextAction: action(
        "create-plan",
        "สร้าง My Path ของฉัน",
        "เริ่มจากเป้าหมายและสิ่งที่อยากลองในช่วง 2–4 เดือนข้างหน้า",
        "/plan"
      ),
      plan: null,
      radarDirections: [],
      pathlabs: [],
      evidence: [],
    };
  }

  const selectedIds = getSelectedPathlabs(source.persistedPath.draft);
  const trialsBySeed = new Map(source.trials.map((item) => [item.seedId, item]));
  const completed = source.enrollments.filter(enrollmentIsComplete);
  const active = sortEligibleEnrollments(
    source.enrollments.filter(
      (item) =>
        item.status === "active" &&
        !enrollmentIsComplete(item) &&
        trialIsAccessible(trialsBySeed.get(item.seedId), now)
    ),
    source.progress
  )[0];
  const paused = sortEligibleEnrollments(
    source.enrollments.filter(
      (item) =>
        item.status === "paused" &&
        !enrollmentIsComplete(item) &&
        trialIsAccessible(trialsBySeed.get(item.seedId), now)
    ),
    source.progress
  )[0];
  const quit = sortEligibleEnrollments(
    source.enrollments.filter(
      (item) => item.status === "quit" && !enrollmentIsComplete(item)
    ),
    source.progress
  )[0];
  const enrollmentBySeed = new Map(
    source.enrollments.map((item) => [item.seedId, item])
  );
  const incompleteSelectedId = selectedIds.find((seedId) => {
    const enrollment = enrollmentBySeed.get(seedId);
    return !enrollment || !enrollmentIsComplete(enrollment);
  });
  const blockingExpiredTrial = incompleteSelectedId
    ? trialsBySeed.get(incompleteSelectedId)
    : undefined;
  const blockedByExpiry =
    blockingExpiredTrial &&
    effectiveTrialStatus(blockingExpiredTrial, now) === "expired";

  let state: MyPathDashboardState = active || paused
    ? "active"
    : completed.length
      ? "completed"
      : "planned";
  let nextAction: MyPathDashboardModel["nextAction"];

  if (active) {
    nextAction = action(
      "resume-pathlab",
      `ทำ ${active.seedTitle} ต่อวันนี้`,
      `กลับไปทำวันที่ ${active.currentDay} จากจุดที่ค้างไว้`,
      `/seeds/pathlab/${active.id}?day=${active.currentDay}`
    );
  } else if (paused) {
    nextAction = action(
      "resume-paused-pathlab",
      `กลับไปตัดสินใจเรื่อง ${paused.seedTitle}`,
      "การทดลองที่พักไว้ยังอยู่ คุณเลือกทำต่อหรือเปลี่ยนทิศได้",
      `/seeds/pathlab/${paused.id}?day=${paused.currentDay}`
    );
  } else if (quit) {
    state = "planned";
    nextAction = action(
      "choose-different-pathlab",
      "ใช้สิ่งที่ไม่ใช่ เลือกการทดลองถัดไป",
      `${quit.seedTitle} ให้สัญญาณแล้วว่าควรลองทางอื่น`,
      "/plan?resume=1"
    );
  } else if (completed.length) {
    state = "completed";
    if (incompleteSelectedId && blockedByExpiry && blockingExpiredTrial) {
      nextAction = action(
        "restore-pathlab-access",
        "ให้ผู้ปกครองช่วยเปิดการทดลองต่อ",
        "แผนและผลงานยังอยู่ ชำระเพื่อกลับไปทำ PathLab ที่เลือกไว้ต่อ",
        `/pay/${blockingExpiredTrial.payToken}`
      );
    } else if (incompleteSelectedId) {
      nextAction = action(
        "start-next-pathlab",
        "เริ่มการทดลองถัดไป",
        "ใช้หลักฐานจาก PathLab ที่จบแล้ว ทดสอบอีกเส้นทางที่เลือกไว้",
        `/seeds/${incompleteSelectedId}`
      );
    } else {
      nextAction = action(
        "review-evidence",
        "ทบทวนหลักฐาน แล้วปรับแผนรอบถัดไป",
        "ดูสิ่งที่ทำได้จริงและสัญญาณความเหมาะสมก่อนเลือกก้าวต่อไป",
        "/plan?resume=1"
      );
    }
  } else if (incompleteSelectedId && blockedByExpiry && blockingExpiredTrial) {
    nextAction = action(
      "restore-pathlab-access",
      "ให้ผู้ปกครองช่วยเปิดการทดลองต่อ",
      "แผนยังอยู่ ชำระเพื่อกลับไปทำ PathLab ที่เลือกไว้ต่อ",
      `/pay/${blockingExpiredTrial.payToken}`
    );
  } else if (incompleteSelectedId) {
    nextAction = action(
      "start-pathlab",
      "เริ่มวันแรกก่อนได้ — ยังไม่ต้องจ่ายตอนนี้",
      "ทดลองทำงานจริงใน PathLab ที่เลือกไว้",
      `/seeds/${incompleteSelectedId}`
    );
  } else {
    nextAction = action(
      "choose-pathlab",
      "เลือก PathLab ที่จะทดลองจริง",
      "เปลี่ยนความสนใจจาก Radar ให้เป็นหลักฐานจากการลงมือทำ",
      "/plan?resume=1"
    );
  }

  return {
    state,
    nextAction,
    plan: buildPlan(source.persistedPath),
    radarDirections: buildRadarDirections(source.persistedPath),
    pathlabs: buildPathlabSummaries(source, now),
    evidence: buildEvidence(source),
  };
}
