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
