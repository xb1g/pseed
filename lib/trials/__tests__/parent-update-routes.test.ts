import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

function source(path: string): string {
  return readFileSync(new URL(`../../../${path}`, import.meta.url), "utf8");
}

test("public subscribe route validates consent and resolves the pay bearer token server-side", () => {
  const route = source("app/api/trials/[token]/parent-updates/route.ts");
  const server = source("lib/trials/parent-updates-server.ts");
  assert.match(route, /parentUpdateSubscribeSchema\.safeParse/);
  assert.match(route, /subscribeParentUpdates/);
  assert.match(route, /createServiceRoleClient/);
  assert.match(server, /get_trial_by_token/);
});

test("student owner route exposes only masked verified contact and supports revoke", () => {
  const route = source("app/api/trials/[token]/parent-updates/route.ts");
  assert.match(route, /export async function GET/);
  assert.match(route, /export async function DELETE/);
  assert.match(route, /requireUser/);
  assert.match(route, /maskedEmail/);
  assert.match(route, /revoked_at/);
});

test("verification and unsubscribe routes are token-only and replay-safe", () => {
  const verify = source("app/api/trials/parent-updates/verify/[verificationToken]/route.ts");
  const unsubscribe = source("app/api/trials/parent-updates/unsubscribe/[unsubscribeToken]/route.ts");
  assert.match(verify, /verifyParentUpdates/);
  assert.match(unsubscribe, /unsubscribeParentUpdates/);
  assert.doesNotMatch(verify + unsubscribe, /studentName|userEmail|reflection|answer|chat|notes/);
});

test("cron requires a bearer secret and is registered in Vercel", () => {
  const route = source("app/api/cron/parent-pathlab-updates/route.ts");
  const vercel = source("vercel.json");
  const publicRoutes = source("utils/supabase/public-routes.ts");
  assert.match(route, /CRON_SECRET/);
  assert.match(route, /authorization/);
  assert.match(route, /Bearer/);
  assert.match(route, /claimDueParentUpdates/);
  assert.match(vercel, /\/api\/cron\/parent-pathlab-updates/);
  assert.match(publicRoutes, /\/api\/cron\/parent-pathlab-updates/);
});
