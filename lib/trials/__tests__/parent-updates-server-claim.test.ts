import type { SupabaseClient } from "@supabase/supabase-js";
import { claimDueParentUpdates } from "../parent-updates-server";

const NOW = new Date("2026-07-22T10:00:00.000Z");
const SUBSCRIPTION_ID = "22222222-2222-4222-8222-222222222222";
const FROZEN_KEY = `parent-update/${"a".repeat(64)}`;

function claimedRow(
  id: string,
  deliveryGroupKey: string | null,
  subscriptionId = SUBSCRIPTION_ID
) {
  return {
    id,
    subscription_id: subscriptionId,
    event_kind: "milestone_completed",
    safe_payload: { eventId: id },
    attempt_count: deliveryGroupKey ? 1 : 0,
    delivery_group_key: deliveryGroupKey,
    normalized_email: "parent@example.com",
    last_progress_delivered_at: null,
    unsubscribe_version: 1,
  };
}

test("claims a frozen retry whole even when newer work and more than 50 rows precede it", async () => {
  const frozenRows = Array.from({ length: 5 }, (_, index) =>
    claimedRow(`frozen-${index}`, FROZEN_KEY)
  );
  const newerRows = Array.from({ length: 51 }, (_, index) =>
    claimedRow(`newer-${index}`, null)
  );
  const databasePage = [...newerRows, ...frozenRows];
  const rpc = jest.fn(async (_name: string, args: Record<string, unknown>) => {
    expect(databasePage).toHaveLength(56);
    expect(args.p_limit).toBe(5);
    return { data: frozenRows, error: null };
  });
  const serviceClient = { rpc } as unknown as SupabaseClient;

  const claimed = await claimDueParentUpdates(serviceClient, NOW, 5);

  expect(claimed.map((row) => row.id)).toEqual(
    frozenRows.map((row) => row.id)
  );
  expect(new Set(claimed.map((row) => row.deliveryGroupKey))).toEqual(
    new Set([FROZEN_KEY])
  );
  expect(rpc).toHaveBeenCalledTimes(1);
  expect(rpc).toHaveBeenCalledWith(
    "claim_parent_pathlab_update_cohort",
    expect.objectContaining({
      p_now: NOW.toISOString(),
      p_limit: 5,
    })
  );
});

test("claims the frozen retry before an interleaved new event, then uses remaining capacity", async () => {
  const frozenRows = Array.from({ length: 3 }, (_, index) =>
    claimedRow(`retry-${index}`, FROZEN_KEY)
  );
  const newRow = claimedRow(
    "new-event",
    null,
    "33333333-3333-4333-8333-333333333333"
  );
  const batches = [frozenRows, [newRow]];
  const rpc = jest.fn(async (_name: string, args: Record<string, unknown>) => ({
    data: batches.shift() ?? [],
    error: null,
    requestedLimit: args.p_limit,
  }));
  const serviceClient = { rpc } as unknown as SupabaseClient;

  const claimed = await claimDueParentUpdates(serviceClient, NOW, 4);

  expect(claimed.map((row) => row.id)).toEqual([
    "retry-0",
    "retry-1",
    "retry-2",
    "new-event",
  ]);
  expect(rpc).toHaveBeenNthCalledWith(
    1,
    "claim_parent_pathlab_update_cohort",
    expect.objectContaining({ p_limit: 4 })
  );
  expect(rpc).toHaveBeenNthCalledWith(
    2,
    "claim_parent_pathlab_update_cohort",
    expect.objectContaining({ p_limit: 1 })
  );
});

test("hard-caps direct claim callers at five rows", async () => {
  const rows = Array.from({ length: 5 }, (_, index) =>
    claimedRow(`bounded-${index}`, null)
  );
  const rpc = jest.fn(async () => ({ data: rows, error: null }));

  const claimed = await claimDueParentUpdates(
    { rpc } as unknown as SupabaseClient,
    NOW,
    100
  );

  expect(claimed).toHaveLength(5);
  expect(rpc).toHaveBeenCalledWith(
    "claim_parent_pathlab_update_cohort",
    expect.objectContaining({ p_limit: 5 })
  );
});
