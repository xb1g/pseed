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

test("parent email links use configured canonical origin and never the request host", () => {
  const subscribeRoute = source("app/api/trials/[token]/parent-updates/route.ts");
  const cronRoute = source("app/api/cron/parent-pathlab-updates/route.ts");
  const domain = source("lib/trials/parent-updates.ts");

  assert.match(subscribeRoute, /configuredParentAppOrigin/);
  assert.match(cronRoute, /configuredParentAppOrigin/);
  assert.doesNotMatch(subscribeRoute, /request\.nextUrl\.origin/);
  assert.doesNotMatch(cronRoute, /request\.nextUrl\.origin/);
  assert.match(domain, /\/parent-updates\/\$\{kind\}/);
});

test("email token GET routes only show confirmation and explicit POST mutates", () => {
  for (const [path, mutation] of [
    [
      "app/api/trials/parent-updates/verify/[verificationToken]/route.ts",
      "verifyParentUpdates",
    ],
    [
      "app/api/trials/parent-updates/unsubscribe/[unsubscribeToken]/route.ts",
      "unsubscribeParentUpdates",
    ],
  ] as const) {
    const route = source(path);
    const getSection = route.slice(
      route.indexOf("export async function GET"),
      route.indexOf("export async function POST")
    );
    const postSection = route.slice(route.indexOf("export async function POST"));
    assert.doesNotMatch(getSection, new RegExp(`${mutation}\\(`));
    assert.match(getSection, /parent-updates/);
    assert.match(postSection, new RegExp(`${mutation}\\(`));
  }
});

test("cron has enough runtime and claims only a modest deadline-aware batch", () => {
  const cronRoute = source("app/api/cron/parent-pathlab-updates/route.ts");
  const server = source("lib/trials/parent-updates-server.ts");
  const vercel = source("vercel.json");

  assert.match(cronRoute, /export const maxDuration = 60/);
  assert.match(cronRoute, /PARENT_UPDATE_CLAIM_LIMIT = 5/);
  assert.match(cronRoute, /PARENT_UPDATE_DELIVERY_BUDGET_MS = 45_000/);
  assert.match(
    cronRoute,
    /claimDueParentUpdates\(\s*serviceClient,\s*now,\s*PARENT_UPDATE_CLAIM_LIMIT\s*\)/
  );
  assert.match(cronRoute, /deliveryDeadline/);
  assert.match(cronRoute, /shouldContinue/);
  assert.match(server, /remainingCapacity/);
  assert.match(server, /claim_parent_pathlab_update_cohort/);
  assert.match(server, /p_limit: remainingCapacity/);
  assert.match(server, /rows\.length > remainingCapacity/);
  assert.match(server, /delivery_group_key/);
  assert.match(vercel, /parent-pathlab-updates\/route\.ts[\s\S]*"maxDuration": 60/);
});

test("cron preserves delivery idempotency keys when calling the email transport", () => {
  const route = source("app/api/cron/parent-pathlab-updates/route.ts");
  assert.match(route, /idempotencyKey:\s*email\.idempotencyKey/);
});

test("outbox finalization is lease-token CAS guarded", () => {
  const server = source("lib/trials/parent-updates-server.ts");
  assert.match(server, /delivery_lease_token/);
  assert.match(server, /mutate_parent_pathlab_update_lease/);
  assert.match(server, /p_lease_token/);
  assert.match(server, /releaseLease/);
});

test("contact replacement uses the atomic recipient-generation RPC", () => {
  const server = source("lib/trials/parent-updates-server.ts");
  const save = server.slice(
    server.indexOf("async saveSubscription"),
    server.indexOf("async findByVerificationHash")
  );

  assert.match(save, /replace_parent_pathlab_subscription_contact/);
  assert.doesNotMatch(save, /\.upsert\(/);
});

test("delivery leases can only be acquired and renewed with active consent", () => {
  const server = source("lib/trials/parent-updates-server.ts");
  const acquisition = source(
    "supabase/migrations/20260722130003_parent_update_atomic_cohort_claim.sql"
  );
  const renewal = server.slice(
    server.indexOf("async renewLease"),
    server.indexOf("async markDelivered")
  );

  assert.match(acquisition, /s\.verified_at is not null/);
  assert.match(acquisition, /s\.unsubscribed_at is null/);
  assert.match(acquisition, /s\.revoked_at is null/);
  assert.match(acquisition, /for update of s skip locked/);
  assert.match(renewal, /not\("verified_at", "is", null\)/);
  assert.match(renewal, /is\("unsubscribed_at", null\)/);
  assert.match(renewal, /is\("revoked_at", null\)/);
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
