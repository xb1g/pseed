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
  assert.match(server, /resolveTrialAccessByToken/);
  assert.doesNotMatch(server, /\.rpc\("get_trial_by_token"/);
});

test("slip upload resolves internal trial identity only through the service client", () => {
  const slip = source("app/api/trials/[token]/slip/route.ts");
  assert.match(slip, /resolveTrialAccessByToken/);
  assert.doesNotMatch(slip, /\.rpc\(\s*"get_trial_by_token"/);
});

test("public trial response stays within the parent token whitelist", () => {
  const route = source("app/api/trials/[token]/route.ts");
  const payPage = source("app/pay/[token]/page.tsx");
  assert.doesNotMatch(route, /paidAt: trial\.paidAt/);
  assert.doesNotMatch(payPage, /row\?\.paidAt/);
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

test("outbox finalization is lease-token CAS guarded", () => {
  const server = source("lib/trials/parent-updates-server.ts");
  assert.match(server, /delivery_lease_token/);
  assert.match(server, /mutate_parent_pathlab_update_lease/);
  assert.match(server, /p_lease_token/);
  assert.match(server, /releaseLease/);
});

test("delivery leases can only be acquired and renewed with active consent", () => {
  const server = source("lib/trials/parent-updates-server.ts");
  const acquisition = server.slice(
    server.indexOf("delivery_lease_token: leaseToken"),
    server.indexOf("const { data: rows")
  );
  const renewal = server.slice(
    server.indexOf("async renewLease"),
    server.indexOf("async markDelivered")
  );

  for (const section of [acquisition, renewal]) {
    assert.match(section, /not\("verified_at", "is", null\)/);
    assert.match(section, /is\("unsubscribed_at", null\)/);
    assert.match(section, /is\("revoked_at", null\)/);
  }
  assert.match(acquisition, /activeOwnership/);
});

test("unsubscribe and owner revoke cancel queued and leased delivery work", () => {
  const server = source("lib/trials/parent-updates-server.ts");
  const ownerRoute = source("app/api/trials/[token]/parent-updates/route.ts");

  assert.match(server, /cancelParentUpdateDeliveries/);
  assert.match(server, /deactivate_parent_pathlab_subscription/);
  assert.match(server, /delivery_lease_token: null/);
  assert.match(ownerRoute, /revokeParentUpdatesForTrial/);
});

test("verification and unsubscribe mutations compare the current token hash and version", () => {
  const server = source("lib/trials/parent-updates-server.ts");

  assert.match(server, /verify_parent_pathlab_subscription_token/);
  assert.match(server, /unsubscribe_parent_pathlab_subscription_token/);
  assert.match(server, /p_expected_hash/);
  assert.match(server, /p_expected_version/);
  assert.doesNotMatch(server, /update\(\{ verified_at: verifiedAt/);
});
