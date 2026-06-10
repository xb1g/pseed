-- Enable RLS on hackathon_team_matching_waitlist.
--
-- DEPENDS ON the route migration in docs/security-lints/client-changes.md (Part 1):
-- the three team-matching routes
--   app/api/hackathon/team/match/{status,join,cancel}/route.ts
-- have been migrated from the anon SSR cookie client to a service-role client.
-- Hackathon participants are NOT Supabase-auth users (auth.uid() is NULL), so
-- no anon/auth-keyed policy can serve them. After Part 1, every accessor of this
-- table uses SUPABASE_SERVICE_ROLE_KEY, which bypasses RLS — so enabling RLS with
-- NO policy is safe and locks out anon access. Both changes ship together.

ALTER TABLE public.hackathon_team_matching_waitlist ENABLE ROW LEVEL SECURITY;
