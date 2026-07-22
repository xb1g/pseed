import assert from "node:assert/strict";

import {
  durableDraftId,
  hydratePersistedMyPath,
  loadPersistedMyPathResult,
} from "../server-read";

test("a persisted My Path restores possibilities, questions, history, and Radar evidence", () => {
  const state = hydratePersistedMyPath({
    path: {
      entry_key: "tech-beyond-software",
      direction_hypothesis: "ได้สร้างของจริง + มีพื้นที่ให้คิดเอง",
      last_import_key: "draft-persisted",
      created_at: "2026-07-10T00:00:00.000Z",
      updated_at: "2026-07-16T00:00:00.000Z",
    },
    possibilities: [
      {
        radar_slug: "ux-designer",
        state: "saved",
        opened_count: 2,
        meaningful_open: true,
        radar_opened: true,
        compared: false,
        saved_at: "2026-07-12T00:00:00.000Z",
        removal_reason: null,
        last_interaction_at: "2026-07-16T00:00:00.000Z",
      },
    ],
    questions: [
      {
        client_question_id: "question-1",
        question_text: "ฉันชอบงานแบบไหนในแต่ละวัน?",
        career_slugs: ["ux-designer"],
        status: "open",
      },
    ],
    events: [
      {
        client_event_id: "event-1",
        event_type: "career_saved",
        career_slug: "ux-designer",
        payload: {},
        occurred_at: "2026-07-12T00:00:00.000Z",
      },
    ],
    reflections: [
      {
        id: "reflection-1",
        field_slug: "ux-designer",
        chapter_key: "dayInLife",
        response_text: "อยากลองคุยกับผู้ใช้จริง",
        tags: ["curious"],
        want_to_try: 5,
        created_at: "2026-07-15T00:00:00.000Z",
      },
    ],
  });

  assert.equal(state?.draft.possibilities["ux-designer"].state, "saved");
  assert.equal(state?.draft.savedQuestions[0].status, "open");
  assert.equal(state?.draft.events[0].type, "career_saved");
  assert.equal(state?.evidence[0].detail, "อยากลองคุยกับผู้ใช้จริง");
  assert.equal(state?.hasPersistedPath, true);
});

test("an account without a My Path hydrates to null", () => {
  assert.equal(hydratePersistedMyPath(null), null);
  assert.equal(hydratePersistedMyPath({ path: null }), null);
});

test("hydrated draft ids stay within the sync safeId alphabet", () => {
  assert.equal(durableDraftId("draft-persisted", "2026-07-10T00:00:00.000Z"), "draft-persisted");
  assert.equal(
    durableDraftId(null, "2026-07-10T00:00:00.123456+00:00"),
    "persisted-2026-07-10T00:00:00.123456-00:00"
  );
  assert.match(
    durableDraftId(null, "2026-07-10T00:00:00.123456+00:00"),
    /^[A-Za-z0-9._:-]{6,128}$/
  );

  const state = hydratePersistedMyPath({
    path: {
      entry_key: "generic",
      direction_hypothesis: null,
      last_import_key: null,
      created_at: "2026-07-10T00:00:00.123456+00:00",
      updated_at: "2026-07-16T00:00:00.000Z",
    },
  });
  assert.match(state!.draft.draftId, /^[A-Za-z0-9._:-]{6,128}$/);
  assert.equal(state!.draft.draftId.includes("+"), false);
});

test("hydrated events restore metadata from the event payload", () => {
  const state = hydratePersistedMyPath({
    path: {
      entry_key: "generic",
      direction_hypothesis: null,
      last_import_key: null,
      created_at: "2026-07-10T00:00:00.000Z",
      updated_at: "2026-07-16T00:00:00.000Z",
    },
    events: [
      {
        client_event_id: "event-metadata-1",
        event_type: "pathlab_selected",
        career_slug: null,
        payload: { metadata: { seedId: "seed-ai", title: "AI Engineer PathLab" } },
        occurred_at: "2026-07-12T00:00:00.000Z",
      },
      {
        client_event_id: "event-metadata-2",
        event_type: "pathlab_deselected",
        career_slug: null,
        payload: null,
        occurred_at: "2026-07-13T00:00:00.000Z",
      },
    ],
  });

  const [selected, deselected] = state?.draft.events ?? [];
  assert.deepEqual(selected.metadata, {
    seedId: "seed-ai",
    title: "AI Engineer PathLab",
  });
  assert.equal(deselected.metadata, undefined);
});

test("the persisted reader distinguishes a failed read from an account with no plan", async () => {
  const errorSpy = jest.spyOn(console, "error").mockImplementation(() => undefined);
  const failed = await loadPersistedMyPathResult({
    rpc: async () => ({ data: null, error: { message: "database unavailable" } }),
  });
  const empty = await loadPersistedMyPathResult({
    rpc: async () => ({ data: { path: null }, error: null }),
  });

  assert.deepEqual(failed, { status: "error", state: null });
  assert.deepEqual(empty, { status: "ready", state: null });
  assert.equal(errorSpy.mock.calls.length, 1);
  errorSpy.mockRestore();
});
