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
