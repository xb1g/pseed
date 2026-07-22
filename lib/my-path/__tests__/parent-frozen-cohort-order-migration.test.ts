import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";

const migrationsDirectory = new URL("../../../supabase/migrations/", import.meta.url);

test("an unfinished frozen parent-update cohort blocks fresh work until it is due", () => {
  const migrationName = readdirSync(migrationsDirectory).find((name) =>
    name.endsWith("_parent_update_frozen_cohort_order.sql")
  );
  assert.ok(migrationName, "additive frozen-cohort ordering migration must exist");
  assert.ok(
    migrationName > "20260722130003_parent_update_atomic_cohort_claim.sql",
    "the ordering fix must follow the already-applied atomic claim migration"
  );

  const sql = readFileSync(new URL(migrationName, migrationsDirectory), "utf8");
  const start = sql.indexOf(
    "create or replace function public.claim_parent_pathlab_update_cohort"
  );
  const end = sql.indexOf(
    "revoke all on function public.claim_parent_pathlab_update_cohort",
    start
  );
  assert.ok(start >= 0 && end > start, "claim RPC must be replaced additively");

  const body = sql.slice(start, end);
  assert.match(body, /o\.delivery_group_key is not null[\s\S]*not exists/);
  assert.match(body, /unfinished_frozen\.subscription_id = o\.subscription_id/);
  assert.match(body, /unfinished_frozen\.delivery_group_key is not null/);
  assert.match(body, /unfinished_frozen\.status in \('pending', 'leased'\)/);
  assert.match(body, /o\.scheduled_at <= p_now/);
  assert.match(body, /order by \(o\.delivery_group_key is null\) asc/);
  assert.match(sql.slice(end), /grant execute[\s\S]*to service_role/);
});
