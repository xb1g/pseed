import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";

const migrationsDirectory = new URL("../../../supabase/migrations/", import.meta.url);

test("contact generation replacement atomically retires old delivery work", () => {
  const migrationName = readdirSync(migrationsDirectory).find((name) =>
    name.endsWith("_parent_update_contact_generation.sql")
  );
  assert.ok(migrationName, "additive contact generation migration must exist");
  const sql = readFileSync(new URL(migrationName, migrationsDirectory), "utf8");
  const start = sql.indexOf(
    "create or replace function public.replace_parent_pathlab_subscription_contact"
  );
  const end = sql.indexOf(
    "revoke all on function public.replace_parent_pathlab_subscription_contact",
    start
  );
  assert.ok(start >= 0 && end > start);
  const body = sql.slice(start, end);

  assert.match(body, /from public\.trial_accesses[\s\S]*for update/);
  assert.match(body, /for update/);
  assert.match(body, /normalized_email is distinct from p_normalized_email/);
  assert.match(body, /p_id <> v_existing\.id/);
  assert.match(body, /p_verification_version <= v_existing\.verification_version/);
  assert.match(body, /p_unsubscribe_version < v_existing\.unsubscribe_version/);
  assert.match(body, /p_unsubscribe_version > v_existing\.unsubscribe_version/);
  assert.match(body, /status in \('pending', 'leased'\)/);
  assert.match(body, /status = 'failed'/);
  assert.match(body, /last_error_code = 'contact_replaced'/);
  assert.match(body, /delivery_lease_token = case[\s\S]*then null/);
  assert.match(body, /delivery_leased_until = case[\s\S]*then null/);
  assert.match(sql.slice(end), /grant execute[\s\S]*to service_role/);

  const queueStart = sql.indexOf(
    "create or replace function private.queue_parent_pathlab_update"
  );
  assert.ok(queueStart > end, "queue writer must be replaced additively");
  const queueBody = sql.slice(queueStart);
  assert.match(queueBody, /unsubscribe_version/);
  assert.match(queueBody, /for update/);
  assert.match(queueBody, /p_subscription_id \|\| ':g' \|\| v_generation/);
});
