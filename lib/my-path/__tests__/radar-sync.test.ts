import assert from "node:assert/strict";

import {
  RADAR_MY_PATH_QUEUE_KEY,
  createRadarMyPathEvent,
  enqueueRadarMyPathEvent,
  flushRadarMyPathEvents,
  isAuthenticatedRadarUser,
  mapRadarFieldIntent,
  type RadarMyPathEvent,
  type RadarQueueStorage,
} from "../radar-sync";

function memoryStorage(): RadarQueueStorage {
  const values = new Map<string, string>();
  return {
    getItem(key) {
      return values.get(key) ?? null;
    },
    setItem(key, value) {
      values.set(key, value);
    },
  };
}

function queued(storage: RadarQueueStorage): RadarMyPathEvent[] {
  return JSON.parse(storage.getItem(RADAR_MY_PATH_QUEUE_KEY) ?? "[]");
}

test.each([
  ["opened", "radar_profile_opened"],
  ["interested", "career_saved"],
  ["saved", "career_saved"],
  ["not_interested", "career_removed"],
  ["dismissed", "career_removed"],
] as const)("maps Radar %s intent to %s", (intent, eventType) => {
  assert.equal(mapRadarFieldIntent(intent), eventType);
});

test("only known planning-registry field slugs become My Path events", () => {
  assert.equal(
    createRadarMyPathEvent(
      { careerSlug: "start-option-1", intent: "interested" },
      { createId: () => "event-unknown", now: () => "2026-07-22T08:00:00.000Z" }
    ),
    null
  );

  assert.deepEqual(
    createRadarMyPathEvent(
      { careerSlug: "ux-designer", intent: "interested" },
      { createId: () => "event-known", now: () => "2026-07-22T08:00:00.000Z" }
    ),
    {
      clientEventId: "event-known",
      careerSlug: "ux-designer",
      intent: "interested",
      occurredAt: "2026-07-22T08:00:00.000Z",
    }
  );
});

test("a queued event keeps its client ID across a failed flush and retry", async () => {
  const storage = memoryStorage();
  const event = createRadarMyPathEvent(
    { careerSlug: "ux-designer", intent: "opened" },
    { createId: () => "stable-radar-event", now: () => "2026-07-22T08:00:00.000Z" }
  );
  assert.ok(event);
  enqueueRadarMyPathEvent(storage, event);

  await flushRadarMyPathEvents({
    storage,
    isAuthenticated: async () => true,
    postEvent: async () => {
      throw new Error("offline");
    },
  });
  assert.equal(queued(storage)[0].clientEventId, "stable-radar-event");

  const posted: RadarMyPathEvent[] = [];
  await flushRadarMyPathEvents({
    storage,
    isAuthenticated: async () => true,
    postEvent: async (pending) => {
      posted.push(pending);
      return true;
    },
  });

  assert.equal(posted[0].clientEventId, "stable-radar-event");
  assert.deepEqual(queued(storage), []);
});

test("a network failure preserves the complete queue", async () => {
  const storage = memoryStorage();
  const events = [
    createRadarMyPathEvent(
      { careerSlug: "ux-designer", intent: "opened" },
      { createId: () => "radar-event-one", now: () => "2026-07-22T08:00:00.000Z" }
    ),
    createRadarMyPathEvent(
      { careerSlug: "ai-engineer", intent: "saved" },
      { createId: () => "radar-event-two", now: () => "2026-07-22T08:01:00.000Z" }
    ),
  ];
  events.forEach((event) => {
    assert.ok(event);
    enqueueRadarMyPathEvent(storage, event);
  });

  await flushRadarMyPathEvents({
    storage,
    isAuthenticated: async () => true,
    postEvent: async () => {
      throw new TypeError("Failed to fetch");
    },
  });

  assert.deepEqual(queued(storage), events);
});

test("flush posts sequentially and removes an event only after acceptance", async () => {
  const storage = memoryStorage();
  const first = createRadarMyPathEvent(
    { careerSlug: "ux-designer", intent: "opened" },
    { createId: () => "radar-first", now: () => "2026-07-22T08:00:00.000Z" }
  );
  const second = createRadarMyPathEvent(
    { careerSlug: "ai-engineer", intent: "interested" },
    { createId: () => "radar-second", now: () => "2026-07-22T08:01:00.000Z" }
  );
  assert.ok(first);
  assert.ok(second);
  enqueueRadarMyPathEvent(storage, first);
  enqueueRadarMyPathEvent(storage, second);

  const posted: string[] = [];
  await flushRadarMyPathEvents({
    storage,
    isAuthenticated: async () => true,
    postEvent: async (event) => {
      posted.push(event.clientEventId);
      return event.clientEventId === "radar-first";
    },
  });

  assert.deepEqual(posted, ["radar-first", "radar-second"]);
  assert.deepEqual(queued(storage), [second]);
});

test("anonymous Supabase users do not flush queued My Path events", async () => {
  const storage = memoryStorage();
  const event = createRadarMyPathEvent(
    { careerSlug: "ux-designer", intent: "opened" },
    { createId: () => "radar-anonymous", now: () => "2026-07-22T08:00:00.000Z" }
  );
  assert.ok(event);
  enqueueRadarMyPathEvent(storage, event);

  let posts = 0;
  await flushRadarMyPathEvents({
    storage,
    isAuthenticated: async () =>
      isAuthenticatedRadarUser({
        id: "anonymous-user",
        is_anonymous: true,
        app_metadata: { provider: "anonymous" },
        identities: [],
      }),
    postEvent: async () => {
      posts += 1;
      return true;
    },
  });

  assert.equal(posts, 0);
  assert.deepEqual(queued(storage), [event]);
});
