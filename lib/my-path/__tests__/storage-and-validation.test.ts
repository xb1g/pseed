import assert from "node:assert/strict";
import test from "node:test";

import { createAnonymousDraft } from "../journey";
import {
  loadMyPathDraft,
  MY_PATH_DRAFT_STORAGE_KEY,
  saveMyPathDraft,
  type DraftStorage,
} from "../storage";
import {
  anonymousEventSchema,
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
