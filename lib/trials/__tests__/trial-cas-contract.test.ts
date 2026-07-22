import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";

function source(path: string): string {
  return readFileSync(new URL(`../../../${path}`, import.meta.url), "utf8");
}

function migration(suffix: string): string {
  const directory = new URL("../../../supabase/migrations/", import.meta.url);
  const name = readdirSync(directory).find((candidate) =>
    candidate.endsWith(`_${suffix}.sql`)
  );
  assert.ok(name, `${suffix} migration must be created with the Supabase CLI`);
  return readFileSync(new URL(name, directory), "utf8");
}

test("trial launch is one authenticated transaction with locked status decisions", () => {
  const route = source("app/api/trials/route.ts");
  const sql = migration("make_trial_launch_and_slip_status_cas");

  assert.match(route, /\.rpc\(\s*"start_pathlab_trial"/);
  assert.doesNotMatch(route, /\.from\(\s*"path_enrollments"\s*\)\.insert/);
  assert.match(sql, /create or replace function public\.start_pathlab_trial/);
  assert.match(sql, /security invoker/);
  assert.match(sql, /from public\.trial_accesses[\s\S]*for update/);
  assert.match(sql, /v_trial\.status = 'expired'/);
  assert.match(sql, /update public\.path_enrollments[\s\S]*status in \('paused', 'quit'\)/);
  assert.match(sql, /grant execute on function public\.start_pathlab_trial\(uuid\) to authenticated/);
  assert.doesNotMatch(sql, /grant execute on function public\.start_pathlab_trial\(uuid\) to anon/);
});

test("slip transition is compare-and-swap guarded and checks the changed row", () => {
  const route = source("app/api/trials/[token]/slip/route.ts");
  const sql = migration("make_trial_launch_and_slip_status_cas");

  assert.match(route, /\.rpc\(\s*"submit_trial_payment_slip"/);
  assert.match(route, /if \(!transitioned\)/);
  assert.match(sql, /create or replace function public\.submit_trial_payment_slip/);
  assert.match(sql, /status in \('active', 'pending', 'expired'\)/);
  assert.match(sql, /paid_at is null/);
  assert.match(sql, /returning t\.status/);
  assert.match(sql, /grant execute on function public\.submit_trial_payment_slip\(uuid, text\)\s+to service_role/);
  assert.doesNotMatch(sql, /grant execute on function public\.submit_trial_payment_slip\(uuid, text\) to anon/);
});
