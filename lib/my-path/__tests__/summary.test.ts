import { applyJourneyEvent, createAnonymousDraft } from "../journey";
import { buildMyPathSummary } from "../summary";
import type { MyPathDraft } from "../types";

function draftWith(
  events: Array<Parameters<typeof applyJourneyEvent>[1]>
): MyPathDraft {
  return events.reduce(
    (draft, event) => applyJourneyEvent(draft, event),
    createAnonymousDraft(null, "draft-1", "2026-07-01T00:00:00.000Z")
  );
}

test("returns null when nothing has been planned yet", () => {
  expect(buildMyPathSummary(null)).toBeNull();
  expect(
    buildMyPathSummary(
      createAnonymousDraft(null, "draft-1", "2026-07-01T00:00:00.000Z")
    )
  ).toBeNull();
});

test("summarises a locked plan for the My Path card", () => {
  const draft = draftWith([
    {
      id: "e1",
      type: "career_saved",
      careerSlug: "ai-engineer",
      occurredAt: "2026-07-02T00:00:00.000Z",
    },
    {
      id: "e2",
      type: "question_answered",
      questionId: "locked-goal",
      answerId: "university",
      occurredAt: "2026-07-02T00:01:00.000Z",
    },
    {
      id: "e3",
      type: "question_answered",
      questionId: "goal-timeline",
      answerId: "3",
      occurredAt: "2026-07-02T00:02:00.000Z",
    },
  ]);

  const summary = buildMyPathSummary(draft);

  expect(summary).not.toBeNull();
  expect(summary!.goalLabel).toBe("เข้ามหาวิทยาลัย");
  expect(summary!.careerTitles).toEqual(["AI Engineer"]);
  expect(summary!.plan.timelineMonths).toBe(3);
  expect(summary!.plan.outcomes.length).toBeGreaterThan(0);
  expect(summary!.updatedAt).toBe("2026-07-02T00:02:00.000Z");
});
