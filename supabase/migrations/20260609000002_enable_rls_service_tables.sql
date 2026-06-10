-- Enable RLS on service-role-only tables (Agent B of the security-lint remediation).
--
-- These tables are accessed exclusively via clients built with
-- SUPABASE_SERVICE_ROLE_KEY / HACKATHON_SUPABASE_SERVICE_ROLE_KEY. The service role
-- BYPASSES RLS, so enabling RLS with NO policy is safe — no accessor breaks, while
-- the anon/authenticated roles are denied all access by default.
--
-- Verified accessors (every one uses a service-role client):
--   hackathon_activity_comments         -> app/api/admin/hackathon/teams/submissions/route.ts
--   hackathon_activity_comment_replies  -> app/api/admin/hackathon/teams/submissions/route.ts
--   hackathon_feature_flags             -> lib/hackathon/invites.ts
--   hackathon_matching_events           -> lib/hackathon/{matching-service,db}.ts
--   hackathon_matching_runs             -> lib/hackathon/{matching-service,db}.ts
--   hackathon_matching_rankings         -> lib/hackathon/{matching-service,db}.ts, app/api/admin/hackathon/matching/event/route.ts (service var)
--   hackathon_matching_met_connections  -> lib/hackathon/{matching-service,db}.ts, app/api/admin/hackathon/matching/event/route.ts (service var)
--   hackathon_pre_questionnaires        -> lib/hackathon/{matching-service,db}.ts + 3 routes (all service-role clients)
--   hackathon_participant_push_tokens   -> push-subscribe / push-sender / push-notify (all service-role clients)
--   hackathon_team_members              -> service-role clients; an anon-read policy already exists (migration 20260403000001)
--   hackathon_register_links            -> lib/hackathon/register-links.ts
--   hackathon_team_invites              -> app/api/hackathon/register/invite/[token]/route.ts, lib/hackathon/invites.ts
--   mentor_line_connect_codes           -> lib/hackathon/mentor-db.ts
--
-- All statements are idempotent: ENABLE ROW LEVEL SECURITY and REVOKE are safe to re-run.

BEGIN;

-- =====================================================
-- Service-role-only tables — enable RLS, no policy needed.
-- Lint fixed: rls_disabled_in_public (one per table)
-- =====================================================

ALTER TABLE public.hackathon_activity_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hackathon_activity_comment_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hackathon_feature_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hackathon_matching_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hackathon_matching_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hackathon_matching_rankings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hackathon_matching_met_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hackathon_pre_questionnaires ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hackathon_participant_push_tokens ENABLE ROW LEVEL SECURITY;

-- hackathon_team_members: enable RLS only. An intentional anon-read policy
-- ("anon_read_hackathon_team_members") already exists from migration
-- 20260403000001 — do NOT add, drop, or revoke anything here.
-- Lint fixed: rls_disabled_in_public
ALTER TABLE public.hackathon_team_members ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- Token tables — enable RLS AND revoke anon SELECT.
-- These hold single-use tokens / connect codes; anon must not read them.
-- Lints fixed: rls_disabled_in_public + sensitive_columns (anon-readable token columns)
-- =====================================================

ALTER TABLE public.hackathon_register_links ENABLE ROW LEVEL SECURITY;
REVOKE SELECT ON public.hackathon_register_links FROM anon;

ALTER TABLE public.hackathon_team_invites ENABLE ROW LEVEL SECURITY;
REVOKE SELECT ON public.hackathon_team_invites FROM anon;

ALTER TABLE public.mentor_line_connect_codes ENABLE ROW LEVEL SECURITY;
REVOKE SELECT ON public.mentor_line_connect_codes FROM anon;

COMMIT;
