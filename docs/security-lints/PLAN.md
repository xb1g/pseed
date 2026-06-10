# Security Lint Remediation — Master Plan

Fixes 23 Supabase security linter findings (3 root causes). Each agent owns its
own **new** timestamped migration file → no merge conflicts → safe parallel work.

## Hard rules for every agent
- **Do NOT run `supabase db push --local` or any DB push.** Only WRITE files.
  The orchestrator runs the single push + tests after all agents finish.
- Service role **bypasses RLS**. A table accessed only via `SUPABASE_SERVICE_ROLE_KEY`
  / `HACKATHON_SUPABASE_SERVICE_ROLE_KEY` clients can have RLS enabled with **no policy**
  and nothing breaks.
- A table accessed via `@/utils/supabase/server` (cookie client) hits DB as **anon**
  (hackathon participants are NOT Supabase-auth users — `auth.uid()` is NULL). Those
  break under RLS unless a policy allows them OR the route is migrated to service role.
- Match the repo's existing migration style. `security_invoker` precedent lives in
  `supabase/migrations/20260331120000_security_hardening_sweep.sql`.
- Idempotent SQL: use `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` (safe to re-run),
  `DROP POLICY IF EXISTS` before `CREATE POLICY`, `CREATE OR REPLACE VIEW`.

## Migration timestamp assignments (do not collide)
- Agent A (views):            `20260609000001_security_invoker_views.sql`
- Agent B (enable-only RLS):   `20260609000002_enable_rls_service_tables.sql`
- Agent C (waitlist + routes): `20260609000003_enable_rls_waitlist.sql`

## Agent A — SECURITY DEFINER → security_invoker (7 views)
Recreate each view `WITH (security_invoker = on)`. **Pull the current definition
from the live local DB** (`select pg_get_viewdef('public.<view>'::regclass, true);`
via psql, or `supabase db dump`) — do NOT hand-write column lists.
Views:
- analytics_seed_velocity_user_metrics
- analytics_seed_velocity_engagement_by_seed_count
- analytics_seed_velocity_dashboard
- analytics_retention_summary
- phase3_leaderboard_cycles
- phase3_funnel
- phase3_team_score_breakdown

Note: invoker now needs SELECT on underlying tables. These views are admin/analytics
facing (authenticated). Confirm grants are intact.

## Agent B — Enable-only RLS, no policies (service-role-only + token tables)
One migration, `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` for each.
Verified service-role-only:
- hackathon_activity_comments
- hackathon_activity_comment_replies
- hackathon_feature_flags
- hackathon_matching_events
- hackathon_matching_runs
- hackathon_matching_rankings
- hackathon_matching_met_connections
- hackathon_pre_questionnaires
- hackathon_participant_push_tokens   (push-subscribe + push-sender + push-notify all service role)
- hackathon_team_members              (RLS only — anon-read policy already exists from migration 20260403000001; do NOT add a policy)

Token tables — enable RLS **and** `REVOKE SELECT ON public.<t> FROM anon;` (kills the
sensitive-column lints too):
- hackathon_register_links
- hackathon_team_invites
- mentor_line_connect_codes

**Before finalizing**: for each table run
`grep -rl "from('<table>')" app lib` and confirm every accessor uses a SERVICE_ROLE
client. If any uses `@/utils/supabase/server`, STOP and flag to orchestrator.

## Agent C — Waitlist RLS + route migration (the only client-code change)
1. Implement the client change in `docs/security-lints/client-changes.md` (migrate the
   3 match routes to service-role).
2. Write migration `20260609000003_enable_rls_waitlist.sql`:
   `ALTER TABLE public.hackathon_team_matching_waitlist ENABLE ROW LEVEL SECURITY;`
   (no policy — after step 1 every accessor is service role).
3. Order matters: the route change makes the RLS-enable safe. Both ship together.

## Agent D — Tests (orchestrator runs after A/B/C land + db push)
See `docs/security-lints/TESTS.md`.
