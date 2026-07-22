import assert from "node:assert/strict";

import { createAnonymousDraft, applyJourneyEvent } from "../journey";
import {
  persistMyPathMutation,
  recordAuthenticatedRadarMyPathEvent,
  recordAnonymousMyPathEvent,
  type MyPathRpcClient,
} from "../server-mutation";

function client({
  userId = "user-1",
  rpcError = null,
}: {
  userId?: string | null;
  rpcError?: { code?: string; message: string } | null;
} = {}) {
  const calls: Array<{ name: string; args: Record<string, unknown> }> = [];
  const value: MyPathRpcClient = {
    auth: {
      async getUser() {
        return { data: { user: userId ? { id: userId } : null }, error: null };
      },
    },
    async rpc(name, args) {
      calls.push({ name, args });
      return {
        data: rpcError ? null : { pathId: "path-1", imported: true },
        error: rpcError,
      };
    },
  };
  return { value, calls };
}

test("signed-in My Path mutations require an authenticated user", async () => {
  const draft = createAnonymousDraft("generic", "draft-server");
  const fake = client({ userId: null });

  const result = await persistMyPathMutation(fake.value, {
    operation: "import",
    draft,
  });

  assert.equal(result.status, 401);
  assert.equal(fake.calls.length, 0);
});

test("the server recalculates direction and next step before the atomic RPC", async () => {
  let draft = createAnonymousDraft("generic", "draft-server-2");
  draft = applyJourneyEvent(draft, {
    id: "server-event-1",
    type: "career_saved",
    careerSlug: "ux-designer",
    occurredAt: "2026-07-16T08:00:00.000Z",
  });
  const fake = client();

  const result = await persistMyPathMutation(fake.value, {
    operation: "import",
    draft,
  });

  assert.equal(result.status, 200);
  assert.equal(fake.calls[0].name, "sync_my_path_journey");
  assert.deepEqual(fake.calls[0].args.p_draft, draft);
  assert.match(
    String((fake.calls[0].args.p_direction as { statement: string }).statement),
    /สร้าง|คิด|เติบโต/
  );
  assert.equal(
    (fake.calls[0].args.p_next_step as { kind: string }).kind,
    "understand-career"
  );
});

test("full draft sync caps year-9999 possibility freshness at server receipt time", async () => {
  let draft = createAnonymousDraft("generic", "draft-future-sync");
  draft = applyJourneyEvent(draft, {
    id: "future-sync-event",
    type: "career_saved",
    careerSlug: "ux-designer",
    occurredAt: "2026-07-20T10:30:00.000Z",
  });
  draft = {
    ...draft,
    possibilities: {
      ...draft.possibilities,
      "ux-designer": {
        ...draft.possibilities["ux-designer"],
        updatedAt: "9999-12-31T23:59:59.999Z",
      },
    },
  };
  const fake = client();

  await persistMyPathMutation(
    fake.value,
    { operation: "sync", draft },
    { now: () => "2026-07-22T10:30:00.000Z" }
  );

  const syncedDraft = fake.calls[0].args.p_draft as typeof draft;
  assert.equal(
    syncedDraft.possibilities["ux-designer"].updatedAt,
    "2026-07-22T10:30:00.000Z"
  );
  assert.equal(
    draft.possibilities["ux-designer"].updatedAt,
    "9999-12-31T23:59:59.999Z",
    "normalization must not mutate the browser draft"
  );
});

test("full draft sync preserves legitimate offline possibility freshness", async () => {
  let draft = createAnonymousDraft("generic", "draft-offline-sync");
  draft = applyJourneyEvent(draft, {
    id: "offline-sync-event",
    type: "career_saved",
    careerSlug: "ux-designer",
    occurredAt: "2026-07-20T10:30:00.000Z",
  });
  const fake = client();

  await persistMyPathMutation(
    fake.value,
    { operation: "sync", draft },
    { now: () => "2026-07-22T10:30:00.000Z" }
  );

  const syncedDraft = fake.calls[0].args.p_draft as typeof draft;
  assert.equal(
    syncedDraft.possibilities["ux-designer"].updatedAt,
    "2026-07-20T10:30:00.000Z"
  );
});

test("the server exposes the active-path limit as a conflict", async () => {
  const fake = client({
    rpcError: { code: "23514", message: "active saved path limit is three" },
  });
  const result = await persistMyPathMutation(fake.value, {
    operation: "sync",
    draft: createAnonymousDraft("generic", "draft-server-3"),
  });

  assert.equal(result.status, 409);
  assert.equal(result.body.error, "active_path_limit");
});

test("a missing sync RPC is surfaced as unavailable instead of a generic 500", async () => {
  const errorSpy = jest.spyOn(console, "error").mockImplementation(() => undefined);
  const fake = client({
    rpcError: {
      code: "PGRST202",
      message: "Could not find the function public.sync_my_path_journey",
    },
  });
  const result = await persistMyPathMutation(fake.value, {
    operation: "import",
    draft: createAnonymousDraft("generic", "draft-missing-rpc"),
  });

  assert.equal(result.status, 503);
  assert.equal(result.body.error, "my_path_unavailable");
  errorSpy.mockRestore();
});

test("an invalid or unpublished Radar career is a client error", async () => {
  const fake = client({
    rpcError: {
      code: "22023",
      message: "draft contains an invalid or unpublished Radar career",
    },
  });
  const result = await persistMyPathMutation(fake.value, {
    operation: "import",
    draft: createAnonymousDraft("generic", "draft-bad-career"),
  });

  assert.equal(result.status, 400);
  assert.equal(result.body.error, "invalid_draft");
});

test("anonymous events use the validated rate-limited RPC contract", async () => {
  const fake = client();
  const result = await recordAnonymousMyPathEvent(fake.value, {
    sessionId: "session_12345678",
    eventType: "career_preview_opened",
    careerSlug: "ux-designer",
    metadata: { entry: "generic" },
  });

  assert.equal(result.status, 202);
  assert.equal(fake.calls[0].name, "record_anonymous_my_path_event");
  assert.deepEqual(fake.calls[0].args, {
    p_session_id: "session_12345678",
    p_event_type: "career_preview_opened",
    p_career_slug: "ux-designer",
    p_metadata: { entry: "generic" },
  });
});

test("Radar My Path events require a durable authenticated user", async () => {
  const signedOut = client({ userId: null });
  const signedOutResult = await recordAuthenticatedRadarMyPathEvent(
    signedOut.value,
    {
      clientEventId: "radar-event-auth",
      careerSlug: "ux-designer",
      intent: "opened",
      occurredAt: "2026-07-22T08:00:00.000Z",
    }
  );

  assert.equal(signedOutResult.status, 401);
  assert.equal(signedOut.calls.length, 0);

  const anonymous = client();
  anonymous.value.auth.getUser = async () => ({
    data: {
      user: {
        id: "anonymous-user",
        is_anonymous: true,
        app_metadata: { provider: "anonymous" },
        identities: [],
      },
    },
    error: null,
  });
  const anonymousResult = await recordAuthenticatedRadarMyPathEvent(
    anonymous.value,
    {
      clientEventId: "radar-event-anon",
      careerSlug: "ux-designer",
      intent: "opened",
      occurredAt: "2026-07-22T08:00:00.000Z",
    }
  );

  assert.equal(anonymousResult.status, 401);
  assert.equal(anonymous.calls.length, 0);
});

test("unknown Radar slugs never enter the canonical My Path", async () => {
  const fake = client();
  const result = await recordAuthenticatedRadarMyPathEvent(fake.value, {
    clientEventId: "radar-event-unknown",
    careerSlug: "start-option-1",
    intent: "interested",
    occurredAt: "2026-07-22T08:00:00.000Z",
  });

  assert.equal(result.status, 400);
  assert.equal(result.body.error, "unknown_career");
  assert.equal(fake.calls.length, 0);
});

test("authenticated Radar events use the narrow idempotent RPC contract", async () => {
  const fake = client();
  const input = {
    clientEventId: "radar-event-duplicate",
    careerSlug: "ux-designer",
    intent: "saved" as const,
    occurredAt: "2026-07-22T08:00:00.000Z",
  };

  const first = await recordAuthenticatedRadarMyPathEvent(fake.value, input);
  const duplicate = await recordAuthenticatedRadarMyPathEvent(fake.value, input);

  assert.equal(first.status, 202);
  assert.equal(duplicate.status, 202);
  assert.equal(fake.calls.length, 2);
  assert.deepEqual(fake.calls[0], fake.calls[1]);
  assert.deepEqual(fake.calls[0], {
    name: "apply_my_path_radar_event",
    args: {
      p_client_event_id: "radar-event-duplicate",
      p_event_type: "career_saved",
      p_career_slug: "ux-designer",
      p_occurred_at: "2026-07-22T08:00:00.000Z",
    },
  });
});

test("Radar freshness caps a year-9999 client timestamp at server receipt time", async () => {
  const fake = client();

  await recordAuthenticatedRadarMyPathEvent(
    fake.value,
    {
      clientEventId: "radar-event-future",
      careerSlug: "ux-designer",
      intent: "saved",
      occurredAt: "9999-12-31T23:59:59.999Z",
    },
    { now: () => "2026-07-22T09:30:00.000Z" }
  );

  assert.equal(
    fake.calls[0].args.p_occurred_at,
    "2026-07-22T09:30:00.000Z"
  );
});

test("Radar freshness preserves legitimate delayed offline timestamps", async () => {
  const fake = client();

  await recordAuthenticatedRadarMyPathEvent(
    fake.value,
    {
      clientEventId: "radar-event-offline",
      careerSlug: "ux-designer",
      intent: "opened",
      occurredAt: "2026-07-20T09:30:00.000Z",
    },
    { now: () => "2026-07-22T09:30:00.000Z" }
  );

  assert.equal(
    fake.calls[0].args.p_occurred_at,
    "2026-07-20T09:30:00.000Z"
  );
});
