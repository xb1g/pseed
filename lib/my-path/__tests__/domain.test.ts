import assert from "node:assert/strict";

import {
  applyJourneyEvent,
  createAnonymousDraft,
  getContextualQuestion,
} from "../journey";
import { resolvePlanEntry } from "../entries";
import {
  buildDirectionHypothesis,
  buildRecommendationLanes,
  selectNextStep,
} from "../recommendations";
import { planningRegistry } from "../registry";

test("unknown Reel entries use the generic fallback", () => {
  const entry = resolvePlanEntry("not-a-real-entry");

  assert.equal(entry.key, "generic");
  assert.equal(entry.title, "What kind of future are you trying to build?");
  assert.ok(entry.initialSlugs.length >= 3);
});

test("the polished tech Reel entry starts with reviewed Radar careers", () => {
  const entry = resolvePlanEntry("tech-beyond-software");

  assert.equal(entry.key, "tech-beyond-software");
  assert.deepEqual(entry.initialSlugs.slice(0, 4), [
    "ai-engineer",
    "data-scientist",
    "software-engineer",
    "cybersecurity",
  ]);
});

test("students can explore without answering a micro-question", () => {
  const draft = createAnonymousDraft("tech-beyond-software", "draft-1");
  const explored = applyJourneyEvent(draft, {
    id: "event-1",
    type: "career_opened",
    careerSlug: "ux-designer",
    occurredAt: "2026-07-16T08:00:00.000Z",
  });

  assert.equal(explored.possibilities["ux-designer"].state, "explored");
  assert.deepEqual(explored.answers, {});
  assert.equal(explored.events.length, 1);
});

test("micro-questions are optional and triggered by the student's context", () => {
  const draft = createAnonymousDraft("generic", "draft-2");
  assert.equal(getContextualQuestion(draft), null);

  const opened = applyJourneyEvent(draft, {
    id: "event-2",
    type: "career_opened",
    careerSlug: "product-manager",
    occurredAt: "2026-07-16T08:01:00.000Z",
  });
  assert.equal(getContextualQuestion(opened)?.id, "career-attraction");

  const savedOne = applyJourneyEvent(opened, {
    id: "event-3",
    type: "career_saved",
    careerSlug: "product-manager",
    occurredAt: "2026-07-16T08:02:00.000Z",
  });
  const savedTwo = applyJourneyEvent(savedOne, {
    id: "event-4",
    type: "career_saved",
    careerSlug: "ux-designer",
    occurredAt: "2026-07-16T08:03:00.000Z",
  });
  assert.equal(getContextualQuestion(savedTwo)?.id, "pair-priority");
});

test("direction hypotheses change predictably when explicit facet signals arrive", () => {
  let draft = createAnonymousDraft("tech-beyond-software", "draft-3");
  draft = applyJourneyEvent(draft, {
    id: "event-5",
    type: "career_saved",
    careerSlug: "ux-designer",
    occurredAt: "2026-07-16T08:04:00.000Z",
  });
  const before = buildDirectionHypothesis(draft, planningRegistry);

  draft = applyJourneyEvent(draft, {
    id: "event-6",
    type: "question_answered",
    questionId: "pair-priority",
    answerId: "stability",
    occurredAt: "2026-07-16T08:05:00.000Z",
  });
  const after = buildDirectionHypothesis(draft, planningRegistry);

  assert.ok(before.facets.includes("creativity"));
  assert.equal(after.facets[0], "stability");
  assert.notEqual(after.statement, before.statement);
  assert.match(after.disclaimer, /สมมติฐาน/);
});

test("rejecting a direction produces a broader alternative instead of an error", () => {
  let draft = createAnonymousDraft("tech-beyond-software", "draft-reject");
  draft = applyJourneyEvent(draft, {
    id: "event-reject-1",
    type: "career_saved",
    careerSlug: "ai-engineer",
    occurredAt: "2026-07-16T08:05:00.000Z",
  });
  const first = buildDirectionHypothesis(draft, planningRegistry);
  draft = applyJourneyEvent(draft, {
    id: "event-reject-2",
    type: "direction_rejected",
    reason: first.statement,
    occurredAt: "2026-07-16T08:06:00.000Z",
  });
  const broader = buildDirectionHypothesis(draft, planningRegistry);

  assert.notEqual(broader.statement, first.statement);
  assert.match(broader.statement, /ยังเปิดกว้าง/);
});

test("recommendation lanes are distinct, explainable, and contain no fit score", () => {
  let draft = createAnonymousDraft("tech-beyond-software", "draft-4");
  draft = applyJourneyEvent(draft, {
    id: "event-7",
    type: "career_saved",
    careerSlug: "ux-designer",
    occurredAt: "2026-07-16T08:06:00.000Z",
  });

  const lanes = buildRecommendationLanes(
    draft,
    planningRegistry,
    Object.keys(planningRegistry)
  );
  const slugs = lanes.map((lane) => lane.recommendation.slug);

  assert.equal(new Set(slugs).size, 3);
  assert.deepEqual(
    lanes.map((lane) => lane.id),
    ["strong-signal", "worth-comparing", "unexpected"]
  );
  for (const lane of lanes) {
    assert.ok(lane.recommendation.reason.startsWith("แนะนำเพราะ"));
    assert.equal("score" in lane.recommendation, false);
  }
});

test("removed paths remain in immutable history instead of disappearing", () => {
  let draft = createAnonymousDraft("generic", "draft-5");
  draft = applyJourneyEvent(draft, {
    id: "event-8",
    type: "career_saved",
    careerSlug: "graphic-designer",
    occurredAt: "2026-07-16T08:07:00.000Z",
  });
  draft = applyJourneyEvent(draft, {
    id: "event-9",
    type: "career_removed",
    careerSlug: "graphic-designer",
    reason: "client-interaction",
    occurredAt: "2026-07-16T08:08:00.000Z",
  });

  assert.equal(draft.possibilities["graphic-designer"].state, "removed");
  assert.equal(draft.events.at(-1)?.type, "career_removed");
  assert.equal(draft.events.at(-1)?.reason, "client-interaction");
});

test("next-step selection advances after the current step is completed", () => {
  let draft = createAnonymousDraft("generic", "draft-6");
  draft = applyJourneyEvent(draft, {
    id: "event-10",
    type: "career_saved",
    careerSlug: "ux-designer",
    occurredAt: "2026-07-16T08:09:00.000Z",
  });
  const first = selectNextStep(draft, planningRegistry);
  assert.equal(first.kind, "understand-career");

  draft = applyJourneyEvent(draft, {
    id: "event-11",
    type: "step_completed",
    stepId: first.id,
    careerSlug: "ux-designer",
    occurredAt: "2026-07-16T08:10:00.000Z",
  });
  const second = selectNextStep(draft, planningRegistry);

  assert.notEqual(second.id, first.id);
  assert.equal(second.kind, "radar-reflection");
});

test("replacing an unhelpful step advances instead of recommending it again", () => {
  let draft = createAnonymousDraft("generic", "draft-replace");
  draft = applyJourneyEvent(draft, {
    id: "event-replace-1",
    type: "career_saved",
    careerSlug: "ux-designer",
    occurredAt: "2026-07-16T08:09:00.000Z",
  });
  const first = selectNextStep(draft, planningRegistry);

  draft = applyJourneyEvent(draft, {
    id: "event-replace-2",
    type: "step_not_useful",
    stepId: first.id,
    reason: "replace",
    occurredAt: "2026-07-16T08:10:00.000Z",
  });

  assert.notEqual(selectNextStep(draft, planningRegistry).id, first.id);
});

test("saving a comparison question adds it to the open-question evidence", () => {
  let draft = createAnonymousDraft("generic", "draft-question");
  draft = applyJourneyEvent(draft, {
    id: "question-event",
    type: "question_saved",
    comparisonSlugs: ["ux-designer", "ai-engineer"],
    reason: "ฉันชอบสร้างคำตอบเองหรือค้นหาความต้องการของคนอื่น?",
    occurredAt: "2026-07-16T08:11:00.000Z",
  });

  assert.deepEqual(draft.savedQuestions, [
    {
      id: "question-event",
      text: "ฉันชอบสร้างคำตอบเองหรือค้นหาความต้องการของคนอื่น?",
      careerSlugs: ["ux-designer", "ai-engineer"],
      status: "open",
    },
  ]);
});

test("PathLab destinations are offered only when the registry has a real link", () => {
  let aiDraft = createAnonymousDraft("tech-beyond-software", "draft-7");
  aiDraft = applyJourneyEvent(aiDraft, {
    id: "event-12",
    type: "career_saved",
    careerSlug: "ai-engineer",
    occurredAt: "2026-07-16T08:11:00.000Z",
  });
  aiDraft = applyJourneyEvent(aiDraft, {
    id: "event-13",
    type: "career_meaningful_open",
    careerSlug: "ai-engineer",
    occurredAt: "2026-07-16T08:12:00.000Z",
  });
  const aiStep = selectNextStep(aiDraft, planningRegistry);
  assert.equal(aiStep.pathLabHref, "/seeds/pathlab/ai-engineer");

  aiDraft = applyJourneyEvent(aiDraft, {
    id: "event-13b",
    type: "question_answered",
    questionId: "action-readiness",
    answerId: "pathlab",
    occurredAt: "2026-07-16T08:12:30.000Z",
  });
  aiDraft = applyJourneyEvent(aiDraft, {
    id: "event-13c",
    type: "step_completed",
    stepId: aiStep.id,
    occurredAt: "2026-07-16T08:12:40.000Z",
  });
  const pathLabStep = selectNextStep(aiDraft, planningRegistry);
  assert.equal(pathLabStep.kind, "pathlab");
  assert.equal(pathLabStep.href, "/seeds/pathlab/ai-engineer");

  let designDraft = createAnonymousDraft("generic", "draft-8");
  designDraft = applyJourneyEvent(designDraft, {
    id: "event-14",
    type: "career_saved",
    careerSlug: "ux-designer",
    occurredAt: "2026-07-16T08:13:00.000Z",
  });
  designDraft = applyJourneyEvent(designDraft, {
    id: "event-15",
    type: "career_meaningful_open",
    careerSlug: "ux-designer",
    occurredAt: "2026-07-16T08:14:00.000Z",
  });
  const designStep = selectNextStep(designDraft, planningRegistry);
  assert.equal(designStep.pathLabHref, undefined);
});
