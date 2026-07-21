import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";

const migrationsDirectory = new URL("../../../supabase/migrations/", import.meta.url);

test("completed milestone inserts and update transitions share the idempotent outbox path", () => {
  const migrationName = readdirSync(migrationsDirectory).find((name) =>
    name.endsWith("_parent_milestone_insert_outbox.sql")
  );
  assert.ok(migrationName, "additive milestone insert outbox migration must exist");

  const migration = readFileSync(
    new URL(migrationName, migrationsDirectory),
    "utf8"
  ).toLowerCase();
  const functionStart = migration.indexOf(
    "create or replace function private.emit_parent_milestone_completed"
  );
  const functionEnd = migration.indexOf(
    "drop trigger if exists parent_milestone_completed_outbox",
    functionStart
  );
  assert.ok(functionStart >= 0, "milestone emitter must be replaced");
  assert.ok(functionEnd > functionStart, "milestone emitter must precede its trigger");

  const emitter = migration.slice(functionStart, functionEnd);
  assert.match(
    emitter,
    /if new\.status <> 'completed' then\s+return new;\s+end if;/
  );
  assert.match(
    emitter,
    /if tg_op = 'update' then\s+if old\.status is not distinct from 'completed' then\s+return new;\s+end if;\s+end if;/
  );
  assert.match(
    emitter,
    /perform private\.queue_parent_pathlab_update\([\s\S]*v_subscription_id,\s*'milestone_completed',\s*'path_activity_progress',\s*new\.id,\s*'completed'/
  );
  assert.equal(
    emitter.match(/queue_parent_pathlab_update/g)?.length,
    1,
    "both operations must use the existing idempotent queue function"
  );

  assert.match(
    migration,
    /create trigger parent_milestone_completed_outbox\s+after insert or update of status on public\.path_activity_progress/
  );

  const originalMigration = readFileSync(
    new URL("20260721210421_parent_pathlab_updates.sql", migrationsDirectory),
    "utf8"
  ).toLowerCase();
  assert.match(originalMigration, /idempotency_key text not null unique/);
  assert.match(originalMigration, /on conflict \(idempotency_key\) do nothing/);
});
