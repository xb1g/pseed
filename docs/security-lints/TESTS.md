# Test Spec — Security Lint Remediation

Add `lib/supabase/__tests__/rls-security-lints.test.ts` (Jest, existing harness).
Use a **service-role** client for catalog checks and an **anon** client
(`NEXT_PUBLIC_SUPABASE_ANON_KEY`) for the deny/allow checks. Skip gracefully if env
vars are missing (mirror other tests in that folder).

## Assertions

### 1. RLS enabled on all 14 tables
Query catalog: `SELECT relrowsecurity FROM pg_class WHERE oid = 'public.<t>'::regclass`
expect `true` for:
hackathon_activity_comments, hackathon_activity_comment_replies, hackathon_feature_flags,
hackathon_matching_events, hackathon_matching_runs, hackathon_matching_rankings,
hackathon_matching_met_connections, hackathon_pre_questionnaires,
hackathon_participant_push_tokens, hackathon_team_members,
hackathon_register_links, hackathon_team_invites, mentor_line_connect_codes,
hackathon_team_matching_waitlist.
(Use an RPC or `supabase.rpc`/raw SQL helper; if no SQL helper exists, add a tiny
`select ... ` through a Postgres function or query `information_schema`/`pg_tables`
via the service client.)

### 2. Views use security_invoker (7)
`SELECT reloptions FROM pg_class WHERE oid='public.<view>'::regclass` contains
`security_invoker=true` for all 7 Agent-A views.

### 3. Token tables NOT anon-readable
With the **anon** client, `SELECT` on each token table returns an error OR 0 rows
(RLS + revoked grant): hackathon_register_links, hackathon_team_invites,
mentor_line_connect_codes. Assert no row data leaks.

### 4. No regression — anon can still read home-screen data
With the **anon** client, `SELECT` on `hackathon_team_members` still succeeds (the
`anon_read_hackathon_team_members` policy must survive). This guards the hackathon home
screen.

### 5. Lint clean (orchestrator, not in jest)
Re-run the linter that produced the original report; expect 0 of the 23 findings.

## Notes
- Local Supabase must be running and migrations pushed before these run.
- Keep tests deterministic — no reliance on seeded row counts beyond presence/absence.
