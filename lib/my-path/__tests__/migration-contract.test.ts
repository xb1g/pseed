import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";

const migration = readFileSync(
  new URL(
    "../../../supabase/migrations/20260716090319_create_my_path_journey.sql",
    import.meta.url
  ),
  "utf8"
);

test("My Path migration creates all journey tables and enables RLS", () => {
  for (const table of [
    "my_paths",
    "my_path_possibilities",
    "my_path_questions",
    "my_path_steps",
    "my_path_events",
  ]) {
    assert.match(migration, new RegExp(`create table public\\.${table}`));
    assert.match(
      migration,
      new RegExp(`alter table public\\.${table} enable row level security`)
    );
    assert.match(
      migration,
      new RegExp(`\\(select auth\\.uid\\(\\)\\) = user_id`)
    );
  }
});

test("the database enforces three saved paths and immutable event history", () => {
  assert.match(migration, /enforce_my_path_saved_limit/);
  assert.match(migration, /active saved path limit is three/);
  assert.match(migration, /revoke update, delete on table public\.my_path_events/);
  assert.match(migration, /on conflict \(my_path_id, client_event_id\) do nothing/);
  assert.match(migration, /set status = 'completed'/);
  assert.match(migration, /else 'not_useful'/);
});

test("draft sync is atomic, idempotent, and restricted to authenticated users", () => {
  assert.match(migration, /function public\.sync_my_path_journey/);
  assert.match(migration, /security invoker/);
  assert.match(migration, /last_import_key/);
  assert.match(migration, /grant execute on function public\.sync_my_path_journey/);
  assert.match(migration, /to authenticated/);
  assert.match(migration, /revoke all on function public\.sync_my_path_journey/);
});

test("anonymous analytics is validated and rate-limited behind a private definer", () => {
  assert.match(migration, /function private\.record_anonymous_my_path_event/);
  assert.match(migration, /security definer/);
  assert.match(migration, /anonymous My Path rate limit exceeded/);
  assert.match(migration, /jsonb_typeof\(p_metadata\) <> 'object'/);
  assert.match(migration, /function public\.record_anonymous_my_path_event/);
});

test("Radar events use a narrow authenticated idempotent mutation", () => {
  const migrationsDirectory = new URL("../../../supabase/migrations/", import.meta.url);
  const radarMigrationName = readdirSync(migrationsDirectory).find((name) =>
    name.endsWith("_sync_radar_intent_into_my_path.sql")
  );
  assert.ok(radarMigrationName, "Radar My Path migration must be created via the Supabase CLI");
  const radarMigration = readFileSync(
    new URL(radarMigrationName, migrationsDirectory),
    "utf8"
  );

  assert.match(radarMigration, /function private\.apply_my_path_radar_event/);
  assert.match(radarMigration, /security definer\s+set search_path = ''/);
  assert.match(radarMigration, /v_user_id uuid := auth\.uid\(\)/);
  assert.match(radarMigration, /on conflict \(my_path_id, client_event_id\) do nothing/);
  assert.match(radarMigration, /function public\.apply_my_path_radar_event/);
  assert.match(radarMigration, /revoke all on function public\.apply_my_path_radar_event/);
  assert.match(radarMigration, /grant execute on function public\.apply_my_path_radar_event[\s\S]*to authenticated/);
  assert.doesNotMatch(radarMigration, /grant execute on function public\.apply_my_path_radar_event[\s\S]*to anon/);
});

test("a stale plan sync cannot regress a newer Radar possibility state", () => {
  const migrationsDirectory = new URL("../../../supabase/migrations/", import.meta.url);
  const freshnessMigrationName = readdirSync(migrationsDirectory).find((name) =>
    name.endsWith("_prevent_stale_radar_state_regressions.sql")
  );
  assert.ok(
    freshnessMigrationName,
    "Radar freshness migration must be created via the Supabase CLI"
  );
  const freshnessMigration = readFileSync(
    new URL(freshnessMigrationName, migrationsDirectory),
    "utf8"
  );

  assert.match(
    freshnessMigration,
    /create or replace function private\.sync_my_path_journey/
  );
  assert.match(
    freshnessMigration,
    /excluded\.last_interaction_at > public\.my_path_possibilities\.last_interaction_at[\s\S]*then excluded\.state[\s\S]*else public\.my_path_possibilities\.state/
  );
  assert.match(
    freshnessMigration,
    /last_interaction_at = greatest\([\s\S]*public\.my_path_possibilities\.last_interaction_at[\s\S]*excluded\.last_interaction_at/
  );
  assert.match(
    freshnessMigration,
    /update public\.my_paths[\s\S]*direction_hypothesis =/
  );
  assert.match(
    freshnessMigration,
    /insert into public\.my_path_events/
  );
  assert.match(
    freshnessMigration,
    /insert into public\.my_path_steps/
  );
});

test("stale saved candidates merge before the saved-limit insert trigger", () => {
  const migrationsDirectory = new URL("../../../supabase/migrations/", import.meta.url);
  const safeMergeMigrationName = readdirSync(migrationsDirectory).find((name) =>
    name.endsWith("_make_stale_plan_sync_saved_limit_safe.sql")
  );
  assert.ok(
    safeMergeMigrationName,
    "saved-limit-safe sync migration must be created via the Supabase CLI"
  );
  const safeMergeMigration = readFileSync(
    new URL(safeMergeMigrationName, migrationsDirectory),
    "utf8"
  );

  assert.match(
    safeMergeMigration,
    /update public\.my_path_possibilities[\s\S]*where my_path_id = v_path_id[\s\S]*radar_slug = v_slug/
  );
  assert.match(
    safeMergeMigration,
    /if not found then[\s\S]*insert into public\.my_path_possibilities/
  );
  assert.match(
    safeMergeMigration,
    /v_possibility_updated_at >\s*public\.my_path_possibilities\.last_interaction_at[\s\S]*then v_state[\s\S]*else public\.my_path_possibilities\.state/
  );
});

test("PathLab report evidence uses an owner-only body-free projection", () => {
  const migrationsDirectory = new URL("../../../supabase/migrations/", import.meta.url);
  const reportProjectionMigrationName = readdirSync(migrationsDirectory).find((name) =>
    name.endsWith("_my_path_report_evidence_projection.sql")
  );
  assert.ok(
    reportProjectionMigrationName,
    "report evidence migration must be created via the Supabase CLI"
  );
  const reportProjectionMigration = readFileSync(
    new URL(reportProjectionMigrationName, migrationsDirectory),
    "utf8"
  );

  assert.match(
    reportProjectionMigration,
    /function private\.get_my_path_report_evidence\(\)/
  );
  assert.match(
    reportProjectionMigration,
    /security definer\s+set search_path = ''/
  );
  assert.match(
    reportProjectionMigration,
    /join public\.path_enrollments[\s\S]*pe\.user_id = v_user_id/
  );
  assert.match(
    reportProjectionMigration,
    /returns table\s*\(\s*id uuid,\s*enrollment_id uuid,\s*created_at timestamptz\s*\)/
  );
  assert.doesNotMatch(
    reportProjectionMigration,
    /returns table[\s\S]*report_data|returns table[\s\S]*report_text|returns table[\s\S]*share_token/
  );
  assert.match(
    reportProjectionMigration,
    /function public\.get_my_path_report_evidence\(\)[\s\S]*security invoker/
  );
  assert.match(
    reportProjectionMigration,
    /revoke all on function public\.get_my_path_report_evidence\(\)\s+from public/
  );
  assert.match(
    reportProjectionMigration,
    /grant execute on function public\.get_my_path_report_evidence\(\)\s+to authenticated/
  );
  assert.doesNotMatch(
    reportProjectionMigration,
    /grant execute on function public\.get_my_path_report_evidence\(\)\s+to\s+anon/
  );
  assert.doesNotMatch(
    reportProjectionMigration,
    /grant select[\s\S]*on (table )?public\.path_reports/
  );
  assert.doesNotMatch(
    reportProjectionMigration,
    /create policy[\s\S]*on public\.path_reports/
  );
});

test("parent PathLab updates are consented, private, and delivered through a safe outbox", () => {
  const migrationsDirectory = new URL("../../../supabase/migrations/", import.meta.url);
  const migrationName = readdirSync(migrationsDirectory).find((name) =>
    name.endsWith("_parent_pathlab_updates.sql")
  );
  assert.ok(migrationName, "parent updates migration must be created through the Supabase CLI");
  const parentMigration = readFileSync(
    new URL(migrationName, migrationsDirectory),
    "utf8"
  );

  for (const table of [
    "parent_pathlab_subscriptions",
    "parent_pathlab_update_outbox",
  ]) {
    assert.match(
      parentMigration,
      new RegExp(`create table if not exists public\\.${table}`)
    );
    assert.match(
      parentMigration,
      new RegExp(`alter table public\\.${table} enable row level security`)
    );
    assert.match(
      parentMigration,
      new RegExp(`revoke all on table public\\.${table} from anon, authenticated`)
    );
    assert.doesNotMatch(
      parentMigration,
      new RegExp(`grant (select|insert|update|delete|all)[\\s\\S]*public\\.${table}[\\s\\S]*to (anon|authenticated)`)
    );
  }

  assert.match(parentMigration, /trial_access_id uuid not null unique/);
  assert.match(parentMigration, /normalized_email text not null/);
  assert.match(parentMigration, /consented_at timestamptz not null/);
  assert.match(parentMigration, /attested_at timestamptz not null/);
  assert.match(parentMigration, /verification_token_hash text not null/);
  assert.match(parentMigration, /unsubscribe_token_hash text not null/);
  assert.match(parentMigration, /verification_expires_at timestamptz not null/);
  assert.match(parentMigration, /verified_at timestamptz/);
  assert.match(parentMigration, /unsubscribed_at timestamptz/);
  assert.match(parentMigration, /last_progress_delivered_at timestamptz/);

  assert.match(parentMigration, /idempotency_key text not null unique/);
  assert.match(parentMigration, /safe_payload jsonb not null/);
  assert.match(parentMigration, /attempt_count integer not null default 0/);
  assert.match(parentMigration, /scheduled_at timestamptz not null/);
  assert.match(parentMigration, /delivered_at timestamptz/);
  assert.match(parentMigration, /leased_until timestamptz/);
  assert.match(parentMigration, /delivery_lease_token uuid/);
  assert.match(parentMigration, /delivery_leased_until timestamptz/);
  assert.match(parentMigration, /where status in \('pending', 'leased'\)/);
  assert.match(parentMigration, /verification_token_hash/);
  assert.match(parentMigration, /unsubscribe_token_hash/);

  for (const fn of [
    "queue_parent_pathlab_update",
    "emit_parent_pathlab_started",
    "emit_parent_milestone_completed",
    "emit_parent_pathlab_completed",
    "emit_parent_payment_status_changed",
    "emit_parent_verified_current_state",
  ]) {
    assert.match(
      parentMigration,
      new RegExp(`function private\\.${fn}[\\s\\S]*security definer\\s+set search_path = ''`)
    );
  }

  assert.match(parentMigration, /pathlab_started/);
  assert.match(parentMigration, /milestone_completed/);
  assert.match(parentMigration, /pathlab_completed/);
  assert.match(parentMigration, /payment_status_changed/);
  assert.match(parentMigration, /parent_verified_started_outbox/);
  assert.match(
    parentMigration,
    /function public\.mutate_parent_pathlab_update_lease[\s\S]*security invoker[\s\S]*p_lease_token[\s\S]*for update[\s\S]*lease_token = p_lease_token/
  );
  const leaseMutation = parentMigration.slice(
    parentMigration.indexOf(
      "create or replace function public.mutate_parent_pathlab_update_lease"
    ),
    parentMigration.indexOf(
      "revoke all on function public.mutate_parent_pathlab_update_lease"
    )
  );
  assert.match(leaseMutation, /verified_at is not null/);
  assert.match(leaseMutation, /unsubscribed_at is null/);
  assert.match(leaseMutation, /revoked_at is null/);
  assert.match(
    parentMigration,
    /grant execute on function public\.mutate_parent_pathlab_update_lease[\s\S]*to service_role/
  );
  assert.match(
    parentMigration,
    /function public\.deactivate_parent_pathlab_subscription[\s\S]*for update[\s\S]*status = 'failed'[\s\S]*grant execute[\s\S]*to service_role/
  );
  assert.match(parentMigration, /subscription_id \|\| ':' \|\| p_event_kind/);
  assert.match(parentMigration, /new\.status = 'completed'/);
  assert.match(parentMigration, /old\.status is distinct from 'completed'/);
  assert.match(parentMigration, /new\.status = 'explored'/);
  assert.match(parentMigration, /old\.status is distinct from 'explored'/);

  // The public parent projection is intentionally body-free and identity-free.
  assert.match(parentMigration, /'seedDescription', s\.description/);
  assert.match(parentMigration, /'totalDays', p\.total_days/);
  assert.match(parentMigration, /'radarDirectionTitle'/);
  assert.match(parentMigration, /'outcomes', p\.parent_outcomes/);
  const projection = parentMigration.slice(
    parentMigration.indexOf("create or replace function public.get_trial_by_token")
  );
  assert.match(
    parentMigration,
    /function private\.get_trial_by_token\(p_token text\)[\s\S]*security definer\s+set search_path = ''/
  );
  assert.match(
    parentMigration,
    /function public\.get_trial_by_token\(p_token text\)[\s\S]*security invoker\s+set search_path = ''/
  );
  assert.doesNotMatch(
    projection,
    /'userEmail'|'studentName'|'reflectionText'|'answerText'|'chat'|'notes'/
  );
  const privateProjectionStart = parentMigration.indexOf(
    "create or replace function private.get_trial_by_token"
  );
  const privateProjectionEnd = parentMigration.indexOf(
    "create or replace function public.get_trial_by_token"
  );
  const privateProjection = parentMigration.slice(
    privateProjectionStart,
    privateProjectionEnd
  );
  for (const forbiddenKey of ["id", "startedAt", "paidAt", "seedId"]) {
    assert.doesNotMatch(
      privateProjection,
      new RegExp(`'${forbiddenKey}'`),
      `${forbiddenKey} must not be exposed by the public pay-token projection`
    );
  }
});

test("parent update migration safely converges when retried after a partial apply", () => {
  const migrationsDirectory = new URL("../../../supabase/migrations/", import.meta.url);
  const migrationName = readdirSync(migrationsDirectory).find((name) =>
    name.endsWith("_parent_pathlab_updates.sql")
  );
  assert.ok(migrationName);
  const sql = readFileSync(new URL(migrationName, migrationsDirectory), "utf8");

  assert.match(sql, /create table if not exists public\.parent_pathlab_subscriptions/);
  assert.match(sql, /create table if not exists public\.parent_pathlab_update_outbox/);
  for (const indexName of [
    "parent_pathlab_subscriptions_verification_hash_idx",
    "parent_pathlab_subscriptions_unsubscribe_hash_idx",
    "parent_pathlab_update_outbox_due_idx",
    "parent_pathlab_update_outbox_subscription_idx",
  ]) {
    assert.match(sql, new RegExp(`create (unique )?index if not exists ${indexName}`));
  }

  const triggerNames = [...sql.matchAll(/create trigger ([a-z0-9_]+)/g)].map(
    (match) => match[1]
  );
  assert.ok(triggerNames.length >= 7);
  for (const triggerName of triggerNames) {
    assert.match(
      sql,
      new RegExp(`drop trigger if exists ${triggerName}\\s+on public\\.[a-z0-9_]+;[\\s\\S]*create trigger ${triggerName}`)
    );
  }
});

test("parent update token mutations are transactional hash and version CAS operations", () => {
  const migrationsDirectory = new URL("../../../supabase/migrations/", import.meta.url);
  const migrationName = readdirSync(migrationsDirectory).find((name) =>
    name.endsWith("_parent_update_token_cas.sql")
  );
  assert.ok(migrationName, "additive parent token CAS migration must exist");
  const sql = readFileSync(new URL(migrationName, migrationsDirectory), "utf8");

  for (const functionName of [
    "verify_parent_pathlab_subscription_token",
    "unsubscribe_parent_pathlab_subscription_token",
  ]) {
    const start = sql.indexOf(`create or replace function public.${functionName}`);
    assert.ok(start >= 0, `${functionName} must be defined`);
    const end = sql.indexOf(`revoke all on function public.${functionName}`, start);
    const body = sql.slice(start, end);
    assert.match(body, /for update/);
    assert.match(body, /p_expected_hash/);
    assert.match(body, /p_expected_version/);
    assert.match(body, /verification_token_hash|unsubscribe_token_hash/);
    assert.match(body, /verification_version|unsubscribe_version/);
    assert.match(sql.slice(end), new RegExp(
      `grant execute on function public\\.${functionName}[\\s\\S]*to service_role`
    ));
  }
  assert.match(sql, /verification_expires_at > p_at/);
  assert.match(sql, /status = 'failed'/);
  assert.match(sql, /lease_token = null/);
});
