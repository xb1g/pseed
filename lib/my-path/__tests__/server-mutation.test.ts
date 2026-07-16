import assert from "node:assert/strict";
import test from "node:test";

import { createAnonymousDraft, applyJourneyEvent } from "../journey";
import {
  persistMyPathMutation,
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
