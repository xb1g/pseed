import assert from "node:assert/strict";

import {
  buildMyPathDashboard,
  type MyPathDashboardSource,
} from "../dashboard";
import type { PersistedMyPathState } from "../server-read";
import type { JourneyEvent, MyPathDraft, PossibilitySignal } from "../types";

const NOW = "2026-07-22T00:00:00.000Z";

function planState(input?: {
  selectedSeedIds?: string[];
  saved?: Array<{ slug: string; savedAt: string }>;
  evidence?: PersistedMyPathState["evidence"];
}): PersistedMyPathState {
  const events: JourneyEvent[] = (input?.selectedSeedIds ?? []).map(
    (seedId, index) => ({
      id: `selected-${seedId}`,
      type: "pathlab_selected",
      occurredAt: `2026-07-${10 + index}T00:00:00.000Z`,
      metadata: { seedId, title: `PathLab ${seedId}` },
    })
  );
  const possibilities = Object.fromEntries(
    (input?.saved ?? []).map(({ slug, savedAt }) => [
      slug,
      {
        slug,
        state: "saved",
        openedCount: 1,
        meaningfulOpen: true,
        radarOpened: true,
        compared: false,
        savedAt,
        updatedAt: savedAt,
      } satisfies PossibilitySignal,
    ])
  );
  const draft: MyPathDraft = {
    version: 1,
    draftId: "persisted-plan",
    entryKey: "generic",
    createdAt: "2026-07-01T00:00:00.000Z",
    updatedAt: "2026-07-20T00:00:00.000Z",
    expiresAt: "2026-08-20T00:00:00.000Z",
    rejectedDirections: [],
    possibilities,
    answers: { "locked-goal": "university", "goal-timeline": "3" },
    skippedQuestions: [],
    savedQuestions: [],
    events,
  };
  return {
    draft,
    evidence: input?.evidence ?? [],
    hasPersistedPath: true,
  };
}

function source(
  overrides: Partial<MyPathDashboardSource> = {}
): MyPathDashboardSource {
  return {
    persistedPath: planState(),
    persistedPathStatus: "ready",
    enrollments: [],
    trials: [],
    progress: [],
    ...overrides,
  };
}

function enrollment(
  overrides: Partial<MyPathDashboardSource["enrollments"][number]> = {}
): MyPathDashboardSource["enrollments"][number] {
  return {
    id: "enrollment-a",
    pathId: "path-a",
    seedId: "seed-a",
    seedTitle: "AI Builder",
    status: "active",
    currentDay: 2,
    enrolledAt: "2026-07-10T00:00:00.000Z",
    completedAt: null,
    endReflection: null,
    report: null,
    ...overrides,
  };
}

test("an account without a persisted plan starts by creating My Path", () => {
  const model = buildMyPathDashboard(
    source({ persistedPath: null }),
    { now: NOW }
  );

  assert.equal(model.state, "empty");
  assert.equal(model.nextAction.kind, "create-plan");
  assert.equal(model.nextAction.href, "/plan");
  assert.equal(model.plan, null);
});

test("a failed persisted-plan read offers a retry instead of pretending the plan is empty", () => {
  const model = buildMyPathDashboard(
    source({ persistedPath: null, persistedPathStatus: "error" }),
    { now: NOW }
  );

  assert.equal(model.nextAction.kind, "retry-my-path");
  assert.equal(model.nextAction.href, "/me");
});

test("a failed plan section still preserves independently loaded PathLab progress", () => {
  const model = buildMyPathDashboard(
    source({
      persistedPath: null,
      persistedPathStatus: "error",
      enrollments: [enrollment()],
    }),
    { now: NOW }
  );

  assert.equal(model.nextAction.kind, "retry-my-path");
  assert.equal(model.pathlabs[0].enrollmentId, "enrollment-a");
});

test("a saved plan without a selected PathLab asks the student to choose one", () => {
  const model = buildMyPathDashboard(source(), { now: NOW });

  assert.equal(model.state, "planned");
  assert.equal(model.nextAction.kind, "choose-pathlab");
  assert.equal(model.nextAction.href, "/plan?resume=1");
  assert.equal(model.plan?.goal, "university");
  assert.equal(model.plan?.timelineMonths, 3);
});

test("a selected PathLab without an enrollment can start its first day", () => {
  const model = buildMyPathDashboard(
    source({ persistedPath: planState({ selectedSeedIds: ["seed-a"] }) }),
    { now: NOW }
  );

  assert.equal(model.nextAction.kind, "start-pathlab");
  assert.equal(model.nextAction.href, "/seeds/seed-a");
});

test("an accessible active enrollment resumes at its current day", () => {
  const model = buildMyPathDashboard(
    source({
      persistedPath: planState({ selectedSeedIds: ["seed-a"] }),
      enrollments: [enrollment()],
      trials: [
        {
          id: "trial-a",
          seedId: "seed-a",
          status: "active",
          payToken: "token-a",
          paymentDeadline: "2026-07-23T00:00:00.000Z",
          paidAt: null,
        },
      ],
    }),
    { now: NOW }
  );

  assert.equal(model.state, "active");
  assert.equal(model.nextAction.kind, "resume-pathlab");
  assert.equal(
    model.nextAction.href,
    "/seeds/pathlab/enrollment-a?day=2"
  );
  assert.equal(model.pathlabs[0].trial?.status, "active");
});

test("an accessible paused enrollment keeps the saved experiment resumable", () => {
  const model = buildMyPathDashboard(
    source({
      persistedPath: planState({ selectedSeedIds: ["seed-a"] }),
      enrollments: [enrollment({ status: "paused", currentDay: 3 })],
    }),
    { now: NOW }
  );

  assert.equal(model.state, "active");
  assert.equal(model.nextAction.kind, "resume-paused-pathlab");
  assert.equal(
    model.nextAction.href,
    "/seeds/pathlab/enrollment-a?day=3"
  );
});

test("a quit enrollment uses the negative signal to choose a different experiment", () => {
  const model = buildMyPathDashboard(
    source({
      persistedPath: planState({ selectedSeedIds: ["seed-a"] }),
      enrollments: [enrollment({ status: "quit" })],
    }),
    { now: NOW }
  );

  assert.equal(model.state, "planned");
  assert.equal(model.nextAction.kind, "choose-different-pathlab");
  assert.equal(model.nextAction.href, "/plan?resume=1");
});

test("a completed enrollment produces safe evidence and starts the next selected experiment", () => {
  const model = buildMyPathDashboard(
    source({
      persistedPath: planState({ selectedSeedIds: ["seed-a", "seed-b"] }),
      enrollments: [
        enrollment({
          status: "explored",
          completedAt: "2026-07-21T00:00:00.000Z",
          report: {
            id: "report-a",
            createdAt: "2026-07-21T00:00:00.000Z",
          },
        }),
      ],
      progress: [
        {
          enrollmentId: "enrollment-a",
          status: "completed",
          updatedAt: "2026-07-20T00:00:00.000Z",
          completedAt: "2026-07-20T00:00:00.000Z",
        },
      ],
    }),
    { now: NOW }
  );

  assert.equal(model.state, "completed");
  assert.equal(model.nextAction.kind, "start-next-pathlab");
  assert.equal(model.nextAction.href, "/seeds/seed-b");
  assert.deepEqual(
    model.evidence.map((item) => item.id),
    ["pathlab-report-report-a", "pathlab-fit-enrollment-a"]
  );
  assert.equal(model.evidence.some((item) => item.detail.includes("reflection")), false);
});

test("a completed enrollment with no next experiment recommends reviewing evidence", () => {
  const model = buildMyPathDashboard(
    source({
      persistedPath: planState({ selectedSeedIds: ["seed-a"] }),
      enrollments: [enrollment({ status: "explored" })],
    }),
    { now: NOW }
  );

  assert.equal(model.state, "completed");
  assert.equal(model.nextAction.kind, "review-evidence");
  assert.equal(model.nextAction.href, "/plan?resume=1");
});

test("eligible enrollments sort by recent progress, then enrollment time, then stable ID", () => {
  const enrollments = [
    enrollment({
      id: "enrollment-z",
      seedId: "seed-z",
      enrolledAt: "2026-07-20T00:00:00.000Z",
    }),
    enrollment({
      id: "enrollment-b",
      seedId: "seed-b",
      enrolledAt: "2026-07-21T00:00:00.000Z",
    }),
    enrollment({
      id: "enrollment-a",
      seedId: "seed-a",
      enrolledAt: "2026-07-21T00:00:00.000Z",
    }),
  ];
  const model = buildMyPathDashboard(
    source({
      persistedPath: planState({
        selectedSeedIds: ["seed-z", "seed-b", "seed-a"],
      }),
      enrollments,
      progress: [
        {
          enrollmentId: "enrollment-z",
          status: "in_progress",
          updatedAt: "2026-07-19T00:00:00.000Z",
          completedAt: null,
        },
      ],
    }),
    { now: NOW }
  );

  assert.equal(model.nextAction.href, "/seeds/pathlab/enrollment-z?day=2");

  const noProgress = buildMyPathDashboard(
    source({
      persistedPath: planState({ selectedSeedIds: ["seed-b", "seed-a"] }),
      enrollments: enrollments.slice(1),
    }),
    { now: NOW }
  );
  assert.equal(
    noProgress.nextAction.href,
    "/seeds/pathlab/enrollment-a?day=2"
  );
});

test("trial summaries expose active, pending, paid, and lazy-expired labels", () => {
  const statuses = ["active", "pending", "paid", "active"] as const;
  const trials = statuses.map((status, index) => ({
    id: `trial-${index}`,
    seedId: `seed-${index}`,
    status,
    payToken: `token-${index}`,
    paymentDeadline:
      index === 3
        ? "2026-07-21T00:00:00.000Z"
        : "2026-07-23T00:00:00.000Z",
    paidAt: status === "paid" ? "2026-07-20T00:00:00.000Z" : null,
  }));
  const model = buildMyPathDashboard(
    source({
      persistedPath: planState({
        selectedSeedIds: ["seed-0", "seed-1", "seed-2", "seed-3"],
      }),
      enrollments: statuses.map((_, index) =>
        enrollment({
          id: `enrollment-${index}`,
          seedId: `seed-${index}`,
          status: "explored",
        })
      ),
      trials,
    }),
    { now: NOW }
  );

  assert.deepEqual(
    model.pathlabs.map((item) => [item.trial?.status, item.trial?.label]),
    [
      ["active", "กำลังทดลอง"],
      ["pending", "รอตรวจสอบการชำระเงิน"],
      ["paid", "ชำระแล้ว"],
      ["expired", "หมดเวลาทดลอง"],
    ]
  );
});

test("the Radar shortlist keeps saved order and is limited to three", () => {
  const model = buildMyPathDashboard(
    source({
      persistedPath: planState({
        saved: [
          { slug: "software-engineer", savedAt: "2026-07-13T00:00:00.000Z" },
          { slug: "ux-designer", savedAt: "2026-07-10T00:00:00.000Z" },
          { slug: "ai-engineer", savedAt: "2026-07-11T00:00:00.000Z" },
          { slug: "data-scientist", savedAt: "2026-07-12T00:00:00.000Z" },
        ],
      }),
    }),
    { now: NOW }
  );

  assert.deepEqual(
    model.radarDirections.map((item) => item.slug),
    ["ux-designer", "ai-engineer", "data-scientist"]
  );
  assert.equal(model.radarDirections[0].href, "/radar/ux-designer");
});

test("accessible and terminal experiments outrank an unrelated expired trial", () => {
  const expiredTrial = {
    id: "trial-expired",
    seedId: "seed-expired",
    status: "expired" as const,
    payToken: "pay-expired",
    paymentDeadline: "2026-07-21T00:00:00.000Z",
    paidAt: null,
  };
  const active = buildMyPathDashboard(
    source({
      persistedPath: planState({
        selectedSeedIds: ["seed-expired", "seed-live"],
      }),
      enrollments: [
        enrollment({ id: "expired", seedId: "seed-expired" }),
        enrollment({ id: "live", seedId: "seed-live" }),
      ],
      trials: [expiredTrial],
    }),
    { now: NOW }
  );
  assert.equal(active.nextAction.href, "/seeds/pathlab/live?day=2");

  const terminal = buildMyPathDashboard(
    source({
      persistedPath: planState({ selectedSeedIds: ["seed-live"] }),
      enrollments: [
        enrollment({ id: "done", seedId: "seed-live", status: "explored" }),
        enrollment({ id: "expired", seedId: "seed-expired" }),
      ],
      trials: [expiredTrial],
    }),
    { now: NOW }
  );
  assert.equal(terminal.nextAction.kind, "review-evidence");
});

test("an accessible active experiment keeps the dashboard active after another experiment completes", () => {
  const model = buildMyPathDashboard(
    source({
      persistedPath: planState({ selectedSeedIds: ["seed-done", "seed-live"] }),
      enrollments: [
        enrollment({ id: "done", seedId: "seed-done", status: "explored" }),
        enrollment({ id: "live", seedId: "seed-live", status: "active" }),
      ],
    }),
    { now: NOW }
  );

  assert.equal(model.nextAction.kind, "resume-pathlab");
  assert.equal(model.state, "active");
});

test("expiry recovery appears only when it blocks the otherwise-next incomplete experiment", () => {
  const model = buildMyPathDashboard(
    source({
      persistedPath: planState({ selectedSeedIds: ["seed-a"] }),
      enrollments: [enrollment()],
      trials: [
        {
          id: "trial-a",
          seedId: "seed-a",
          status: "active",
          payToken: "pay-a",
          paymentDeadline: "2026-07-21T00:00:00.000Z",
          paidAt: null,
        },
      ],
    }),
    { now: NOW }
  );

  assert.equal(model.state, "planned");
  assert.equal(model.nextAction.kind, "restore-pathlab-access");
  assert.equal(model.nextAction.href, "/pay/pay-a");
});
