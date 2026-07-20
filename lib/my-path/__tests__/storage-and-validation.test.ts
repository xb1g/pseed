import assert from "node:assert/strict";

import { applyJourneyEvent, createAnonymousDraft } from "../journey";
import {
  loadMyPathDraft,
  MY_PATH_DRAFT_STORAGE_KEY,
  saveMyPathDraft,
  type DraftStorage,
} from "../storage";
import {
  anonymousEventSchema,
  myPathDraftSchema,
  myPathMutationSchema,
} from "../validation";

function memoryStorage(seed: Record<string, string> = {}): DraftStorage & {
  values: Record<string, string>;
} {
  const values = { ...seed };
  return {
    values,
    getItem(key) {
      return values[key] ?? null;
    },
    setItem(key, value) {
      values[key] = value;
    },
    removeItem(key) {
      delete values[key];
    },
  };
}

test("anonymous drafts round-trip with a versioned 30-day expiry", () => {
  const storage = memoryStorage();
  const now = "2026-07-16T08:00:00.000Z";
  const draft = createAnonymousDraft("generic", "draft-storage", now);

  saveMyPathDraft(storage, draft);
  const loaded = loadMyPathDraft(storage, "2026-08-14T08:00:00.000Z");

  assert.deepEqual(loaded, draft);
  assert.equal(JSON.parse(storage.values[MY_PATH_DRAFT_STORAGE_KEY]).version, 1);
});

test("expired or malformed anonymous drafts are discarded", () => {
  const expiredStorage = memoryStorage();
  const draft = createAnonymousDraft(
    "generic",
    "draft-expired",
    "2026-06-01T08:00:00.000Z"
  );
  saveMyPathDraft(expiredStorage, draft);
  assert.equal(loadMyPathDraft(expiredStorage, "2026-07-16T08:00:00.000Z"), null);
  assert.equal(expiredStorage.values[MY_PATH_DRAFT_STORAGE_KEY], undefined);

  const malformedStorage = memoryStorage({
    [MY_PATH_DRAFT_STORAGE_KEY]: "{not-json",
  });
  assert.equal(loadMyPathDraft(malformedStorage), null);
});

test("signed-in mutation payloads accept imports and reject oversized journeys", () => {
  const draft = createAnonymousDraft("generic", "draft-import");
  assert.equal(
    myPathMutationSchema.safeParse({ operation: "import", draft }).success,
    true
  );

  const tooManyEvents = {
    ...draft,
    events: Array.from({ length: 201 }, (_, index) => ({
      id: `event-${index}`,
      type: "career_opened",
      careerSlug: "ux-designer",
      occurredAt: "2026-07-16T08:00:00.000Z",
    })),
  };
  assert.equal(
    myPathMutationSchema.safeParse({ operation: "import", draft: tooManyEvents })
      .success,
    false
  );
});

test("anonymous analytics accepts only reviewed events and bounded metadata", () => {
  assert.equal(
    anonymousEventSchema.safeParse({
      sessionId: "session_12345678",
      eventType: "career_preview_opened",
      careerSlug: "ux-designer",
      metadata: { entry: "generic" },
    }).success,
    true
  );
  assert.equal(
    anonymousEventSchema.safeParse({
      sessionId: "short",
      eventType: "arbitrary_event",
      metadata: { raw: "x".repeat(3000) },
    }).success,
    false
  );
});

test("drafts containing wizard pathlab and goal events pass validation", () => {
  let draft = createAnonymousDraft("generic", "draft-wizard");
  draft = applyJourneyEvent(draft, {
    id: "event-wizard-1",
    type: "entry_viewed",
    occurredAt: "2026-07-16T08:00:00.000Z",
    metadata: { entry: "mission-wizard" },
  });
  draft = applyJourneyEvent(draft, {
    id: "event-wizard-2",
    type: "pathlab_selected",
    occurredAt: "2026-07-16T08:01:00.000Z",
    metadata: { seedId: "seed-ai", title: "AI Engineer PathLab" },
  });
  draft = applyJourneyEvent(draft, {
    id: "event-wizard-3",
    type: "pathlab_deselected",
    occurredAt: "2026-07-16T08:02:00.000Z",
    metadata: { seedId: "seed-ai" },
  });
  draft = applyJourneyEvent(draft, {
    id: "event-wizard-4",
    type: "question_answered",
    questionId: "locked-goal",
    answerId: "university",
    occurredAt: "2026-07-16T08:03:00.000Z",
  });
  draft = applyJourneyEvent(draft, {
    id: "event-wizard-5",
    type: "question_answered",
    questionId: "goal-timeline",
    answerId: "3",
    occurredAt: "2026-07-16T08:04:00.000Z",
  });

  assert.equal(myPathDraftSchema.safeParse(draft).success, true);
});

test("anonymous analytics accepts the wizard event types", () => {
  for (const eventType of [
    "wizard_step_viewed",
    "pathlab_selected",
    "pathlab_deselected",
    "goal_locked",
    "mission_plan_viewed",
  ]) {
    assert.equal(
      anonymousEventSchema.safeParse({
        sessionId: "session_12345678",
        eventType,
        metadata: { entry: "generic", seedId: "seed-ai", step: 2 },
      }).success,
      true,
      `expected ${eventType} to be accepted`
    );
  }
});
