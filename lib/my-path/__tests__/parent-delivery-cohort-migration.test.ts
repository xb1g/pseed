import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";

const migrationsDirectory = new URL("../../../supabase/migrations/", import.meta.url);

test("parent delivery retries persist a lease-guarded immutable cohort key", () => {
  const migrationName = readdirSync(migrationsDirectory).find((name) =>
    name.endsWith("_parent_update_delivery_cohorts.sql")
  );
  assert.ok(migrationName, "additive delivery cohort migration must exist");
  const sql = readFileSync(new URL(migrationName, migrationsDirectory), "utf8");

  assert.match(sql, /add column if not exists delivery_group_key text/);
  const start = sql.indexOf(
    "create or replace function public.freeze_parent_pathlab_delivery_group"
  );
  const end = sql.indexOf(
    "revoke all on function public.freeze_parent_pathlab_delivery_group",
    start
  );
  assert.ok(start >= 0 && end > start);
  const body = sql.slice(start, end);
  assert.match(body, /p_lease_token/);
  assert.match(body, /p_ids/);
  assert.match(body, /for update/);
  assert.match(body, /delivery_group_key is null/);
  assert.match(body, /delivery_group_key = p_delivery_group_key/);
  assert.match(sql.slice(end), /grant execute[\s\S]*to service_role/);
});

test("parent delivery claims atomically prioritize and lease a complete frozen cohort", () => {
  const migrationName = readdirSync(migrationsDirectory).find((name) =>
    name.endsWith("_parent_update_atomic_cohort_claim.sql")
  );
  assert.ok(migrationName, "additive atomic cohort claim migration must exist");
  const sql = readFileSync(new URL(migrationName, migrationsDirectory), "utf8");

  const start = sql.indexOf(
    "create or replace function public.claim_parent_pathlab_update_cohort"
  );
  const end = sql.indexOf(
    "revoke all on function public.claim_parent_pathlab_update_cohort",
    start
  );
  assert.ok(start >= 0 && end > start);
  const body = sql.slice(start, end);

  assert.match(body, /for update(?: of s)? skip locked/);
  assert.match(body, /p_limit > 5/);
  assert.match(body, /p_limit is null/);
  assert.match(body, /p_leased_until is null/);
  assert.doesNotMatch(body, /subscription_inactive/);
  assert.match(body, /delivery_group_key is not null/);
  assert.match(body, /order by[\s\S]*delivery_group_key is null/);
  assert.match(body, /cardinality\(v_ids\) > p_limit/);
  assert.match(body, /delivery_group_key = v_delivery_group_key/);
  assert.match(body, /update public\.parent_pathlab_update_outbox/);
  assert.match(body, /status = 'leased'/);
  assert.match(body, /return query/);
  assert.match(sql.slice(end), /grant execute[\s\S]*to service_role/);
});
