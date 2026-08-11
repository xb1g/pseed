/**
 * @jest-environment node
 *
 * RLS Security Lint Remediation — Automated Verification
 * =====================================================
 *
 * Codifies the manual verification of the security-lint remediation described in
 * `docs/security-lints/TESTS.md`. The migrations are already applied to the
 * running local Supabase; this suite is the regression guard for CI / future devs.
 *
 * What it checks (against the live local Postgres catalog):
 *   1. RLS is ENABLED (pg_class.relrowsecurity = true) on all 14 hardened tables.
 *   2. All 7 Agent-A views carry `security_invoker` in reloptions.
 *   3. The 3 token tables DENY an anon-role SELECT (grant revoked → permission denied).
 *   4. Regression guard: anon SELECT on hackathon_team_members does NOT error.
 *   5. Regression guard: anon SELECT on hackathon_team_matching_waitlist returns
 *      0 rows WITHOUT a permission error (RLS filters; grant intact).
 *
 * Catalog introspection (relrowsecurity, reloptions, grants) and the anon
 * permission-denied behavior require raw SQL, so this suite uses the `pg`
 * package (already a project dependency) and exercises the anon path via
 * `SET LOCAL ROLE anon` inside a rolled-back transaction.
 *
 * The whole suite SKIPS gracefully if the local DB is unreachable — it never
 * hangs or hard-fails in an environment without a local Supabase.
 */

import { Client } from "pg";

// Well-known local Supabase Postgres default (not a secret). Override with
// SUPABASE_DB_URL for non-default setups.
const DB_URL =
  process.env.SUPABASE_DB_URL ??
  "postgresql://postgres:postgres@127.0.0.1:54322/postgres";

// All 14 tables hardened by the RLS-enable migrations.
const RLS_TABLES = [
  "hackathon_activity_comments",
  "hackathon_activity_comment_replies",
  "hackathon_feature_flags",
  "hackathon_matching_events",
  "hackathon_matching_runs",
  "hackathon_matching_rankings",
  "hackathon_matching_met_connections",
  "hackathon_pre_questionnaires",
  "hackathon_participant_push_tokens",
  "hackathon_team_members",
  "hackathon_register_links",
  "hackathon_team_invites",
  "mentor_line_connect_codes",
  "hackathon_team_matching_waitlist",
] as const;

// The 7 Agent-A views recreated WITH (security_invoker = on).
const SECURITY_INVOKER_VIEWS = [
  "analytics_seed_velocity_user_metrics",
  "analytics_seed_velocity_engagement_by_seed_count",
  "analytics_seed_velocity_dashboard",
  "analytics_retention_summary",
  "phase3_leaderboard_cycles",
  "phase3_funnel",
  "phase3_team_score_breakdown",
] as const;

// Token tables: an anon SELECT must be denied at the grant level.
const TOKEN_TABLES = [
  "hackathon_register_links",
  "hackathon_team_invites",
  "mentor_line_connect_codes",
] as const;

/** Quick reachability probe so we can skip (not hang) without a local DB. */
async function dbReachable(): Promise<boolean> {
  const client = new Client({
    connectionString: DB_URL,
    // Fail fast instead of hanging in CI without a DB.
    connectionTimeoutMillis: 3000,
    statement_timeout: 5000,
  });
  try {
    await client.connect();
    await client.query("SELECT 1");
    await client.end();
    return true;
  } catch {
    try {
      await client.end();
    } catch {
      /* already closed / never connected */
    }
    return false;
  }
}

let dbAvailable = false;

beforeAll(async () => {
  dbAvailable = await dbReachable();
  if (!dbAvailable) {
     
    console.warn(
      `[rls-security-lints] Local Postgres not reachable at ${DB_URL} — skipping integration suite.`
    );
  }
});

/**
 * Run a callback with a fresh service-role connection. The catalog queries below
 * read pg_class, which requires no special privileges, so the default
 * `postgres` superuser connection is used for catalog reads and for the
 * `SET LOCAL ROLE anon` permission probes.
 */
async function withClient<T>(fn: (c: Client) => Promise<T>): Promise<T> {
  const client = new Client({ connectionString: DB_URL });
  await client.connect();
  try {
    return await fn(client);
  } finally {
    await client.end();
  }
}

/**
 * Execute a SELECT as the `anon` role inside a transaction that is always rolled
 * back, so nothing leaks across tests. Returns either the row count or the
 * thrown Postgres error.
 */
async function anonSelect(
  client: Client,
  table: string
): Promise<{ ok: true; rowCount: number } | { ok: false; code?: string }> {
  await client.query("BEGIN");
  try {
    await client.query("SET LOCAL ROLE anon");
    const res = await client.query(`SELECT * FROM public.${table} LIMIT 1`);
    return { ok: true, rowCount: res.rowCount ?? 0 };
  } catch (err: unknown) {
    const code = (err as { code?: string })?.code;
    return { ok: false, code };
  } finally {
    // Always discard — keeps the suite side-effect free and resets the role.
    await client.query("ROLLBACK");
  }
}

describe("RLS security-lint remediation (local Postgres catalog)", () => {
  // Guard every test: if the DB isn't up, assert-skip with a passing no-op so
  // the suite is green in env without a local Supabase rather than failing.
  const itDb = (name: string, fn: () => Promise<void>) =>
    it(name, async () => {
      if (!dbAvailable) {
         
        console.warn(`[skip:no-db] ${name}`);
        return;
      }
      await fn();
    });

  // 1. RLS enabled on all 14 tables.
  itDb("enables RLS on all 14 hardened tables", async () => {
    await withClient(async (c) => {
      for (const table of RLS_TABLES) {
        const res = await c.query<{ relrowsecurity: boolean }>(
          "SELECT relrowsecurity FROM pg_class WHERE oid = $1::regclass",
          [`public.${table}`]
        );
        expect(res.rows.length).toBe(1);
        expect(res.rows[0].relrowsecurity).toBe(true);
      }
    });
  });

  // 2. All 7 Agent-A views use security_invoker.
  itDb("recreates all 7 Agent-A views WITH security_invoker", async () => {
    await withClient(async (c) => {
      for (const view of SECURITY_INVOKER_VIEWS) {
        const res = await c.query<{ reloptions: string[] | null }>(
          "SELECT reloptions FROM pg_class WHERE oid = $1::regclass AND relkind = 'v'",
          [`public.${view}`]
        );
        expect(res.rows.length).toBe(1);
        const reloptions = res.rows[0].reloptions ?? [];
        // Postgres normalizes the boolean (security_invoker=on | =true); assert
        // the option is present and set to a truthy value rather than an exact string.
        const invokerOpt = reloptions.find((o) =>
          o.startsWith("security_invoker=")
        );
        expect(invokerOpt).toBeDefined();
        const value = invokerOpt!.split("=")[1];
        expect(["on", "true"]).toContain(value);
      }
    });
  });

  // 3. Token tables deny an anon SELECT (grant revoked → permission denied).
  itDb("denies anon SELECT on all token tables (no data leak)", async () => {
    await withClient(async (c) => {
      for (const table of TOKEN_TABLES) {
        const result = await anonSelect(c, table);
        // Must throw — and specifically a privilege error (42501), proving the
        // grant was revoked rather than merely filtered by RLS.
        expect(result.ok).toBe(false);
        if (!result.ok) {
          expect(result.code).toBe("42501");
        }
      }
    });
  });

  // 4. Regression guard: anon SELECT on hackathon_team_members does NOT error.
  itDb(
    "allows anon SELECT on hackathon_team_members (policy intact)",
    async () => {
      await withClient(async (c) => {
        const result = await anonSelect(c, "hackathon_team_members");
        expect(result.ok).toBe(true);
        if (result.ok) {
          expect(result.rowCount).toBeGreaterThanOrEqual(0);
        }
      });
    }
  );

  // 5. Regression guard: anon SELECT on the matching waitlist returns 0 rows
  //    WITHOUT a permission error (RLS filters; grant intact).
  itDb(
    "allows anon SELECT on hackathon_team_matching_waitlist without permission error",
    async () => {
      await withClient(async (c) => {
        const result = await anonSelect(c, "hackathon_team_matching_waitlist");
        expect(result.ok).toBe(true);
        if (result.ok) {
          // RLS hides all rows from anon; assert no leak (0 rows) and, crucially,
          // that the query did NOT error (grant survived).
          expect(result.rowCount).toBe(0);
        }
      });
    }
  );
});
