import assert from "node:assert/strict";

import {
  applyJourneyEvent,
  createAnonymousDraft,
  getGoalTimeline,
  getLockedGoal,
  getSelectedPathlabs,
  GOAL_TIMELINE_QUESTION_ID,
  LOCKED_GOAL_QUESTION_ID,
} from "../journey";

test("pathlab selection replays select and deselect events with the last event winning", () => {
  let draft = createAnonymousDraft("generic", "draft-pathlab");
  draft = applyJourneyEvent(draft, {
    id: "event-pathlab-1",
    type: "pathlab_selected",
    occurredAt: "2026-07-16T08:00:00.000Z",
    metadata: { seedId: "seed-ai", title: "AI Engineer PathLab" },
  });
  draft = applyJourneyEvent(draft, {
    id: "event-pathlab-2",
    type: "pathlab_selected",
    occurredAt: "2026-07-16T08:01:00.000Z",
    metadata: { seedId: "seed-data" },
  });
  assert.deepEqual(getSelectedPathlabs(draft), ["seed-ai", "seed-data"]);

  draft = applyJourneyEvent(draft, {
    id: "event-pathlab-3",
    type: "pathlab_deselected",
    occurredAt: "2026-07-16T08:02:00.000Z",
    metadata: { seedId: "seed-ai" },
  });
  assert.deepEqual(getSelectedPathlabs(draft), ["seed-data"]);

  draft = applyJourneyEvent(draft, {
    id: "event-pathlab-4",
    type: "pathlab_selected",
    occurredAt: "2026-07-16T08:03:00.000Z",
    metadata: { seedId: "seed-ai" },
  });
  assert.deepEqual(getSelectedPathlabs(draft), ["seed-ai", "seed-data"]);
});

test("pathlab events without a metadata seedId are ignored", () => {
  let draft = createAnonymousDraft("generic", "draft-pathlab-missing");
  draft = applyJourneyEvent(draft, {
    id: "event-pathlab-5",
    type: "pathlab_selected",
    occurredAt: "2026-07-16T08:04:00.000Z",
  });
  draft = applyJourneyEvent(draft, {
    id: "event-pathlab-6",
    type: "pathlab_selected",
    occurredAt: "2026-07-16T08:05:00.000Z",
    metadata: { title: "AI Engineer PathLab" },
  });
  draft = applyJourneyEvent(draft, {
    id: "event-pathlab-7",
    type: "pathlab_selected",
    occurredAt: "2026-07-16T08:06:00.000Z",
    metadata: { seedId: 42 },
  });

  assert.deepEqual(getSelectedPathlabs(draft), []);
});

test("locked goal and timeline arrive as ordinary question answers", () => {
  let draft = createAnonymousDraft("generic", "draft-goal");
  assert.equal(getLockedGoal(draft), null);
  assert.equal(getGoalTimeline(draft), null);

  draft = applyJourneyEvent(draft, {
    id: "event-goal-1",
    type: "question_answered",
    questionId: LOCKED_GOAL_QUESTION_ID,
    answerId: "scholarship",
    occurredAt: "2026-07-16T08:07:00.000Z",
  });
  draft = applyJourneyEvent(draft, {
    id: "event-goal-2",
    type: "question_answered",
    questionId: GOAL_TIMELINE_QUESTION_ID,
    answerId: "3",
    occurredAt: "2026-07-16T08:08:00.000Z",
  });

  assert.equal(getLockedGoal(draft), "scholarship");
  assert.equal(getGoalTimeline(draft), "3");
});
