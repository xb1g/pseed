-- Security hardening: close anon/authenticated USING(true) exposure on the
-- hackathon + assessment + PathLab tables and storage buckets.
--
-- Why this is safe to apply to production:
--   * All legitimate data access in the app goes through the service-role
--     client (utils/supabase/admin.ts createAdminClient / lib/hackathon/*.ts
--     getClient with SUPABASE_SERVICE_ROLE_KEY), which BYPASSES RLS. Dropping
--     these anon/authenticated policies therefore does not break any server
--     code path; it only closes the direct PostgREST/Storage path that the
--     public anon key would otherwise expose.
--   * Client components call /api/* routes (service-role), never these tables
--     directly with the browser anon key.
--   * Every statement is idempotent (DROP POLICY IF EXISTS / REVOKE is safe to
--     re-run), per the prod-first migration convention.
--
-- Refs: GHSA-69fh-c977-73rf GHSA-c25x-6cgc-q625 GHSA-j3cq-q59p-p8rr
--       GHSA-r862-7vmg-wx68

-- ============================================================================
-- 1. hackathon_participants  (email, password_hash, phone, line_id)
--    anon could SELECT + UPDATE every row -> mass account takeover.
-- ============================================================================
DROP POLICY IF EXISTS "anon_read_hackathon_participants"      ON public.hackathon_participants;
DROP POLICY IF EXISTS "hackathon_participants_anon_select"    ON public.hackathon_participants;
DROP POLICY IF EXISTS "hackathon_participants_anon_update"    ON public.hackathon_participants;
DROP POLICY IF EXISTS "hackathon_participants_authenticated_select" ON public.hackathon_participants;
DROP POLICY IF EXISTS "hackathon_participants_authenticated_update" ON public.hackathon_participants;
REVOKE ALL ON TABLE public.hackathon_participants FROM anon, authenticated;

-- ============================================================================
-- 2. hackathon_teams — same migration added anon/authenticated select+update.
-- ============================================================================
DROP POLICY IF EXISTS "hackathon_teams_anon_select"           ON public.hackathon_teams;
DROP POLICY IF EXISTS "hackathon_teams_anon_update"           ON public.hackathon_teams;
DROP POLICY IF EXISTS "hackathon_teams_authenticated_select"  ON public.hackathon_teams;
DROP POLICY IF EXISTS "hackathon_teams_authenticated_update"  ON public.hackathon_teams;
REVOKE ALL ON TABLE public.hackathon_teams FROM anon;

-- ============================================================================
-- 3. assessment_submissions / student_node_progress / submission_grades
--    anon read all submissions; any authenticated user could update any row.
--    Owner-scoped policies (users_can_* / members_can_view_submissions) already
--    exist and are kept; only the USING(true) ones are dropped.
-- ============================================================================
DROP POLICY IF EXISTS "anon_users_can_create_submissions"        ON public.assessment_submissions;
DROP POLICY IF EXISTS "anon_users_can_view_submissions"          ON public.assessment_submissions;
DROP POLICY IF EXISTS "authenticated_users_can_create_submissions" ON public.assessment_submissions;
DROP POLICY IF EXISTS "authenticated_users_can_view_submissions"   ON public.assessment_submissions;
DROP POLICY IF EXISTS "authenticated_users_can_update_submissions" ON public.assessment_submissions;
REVOKE ALL ON TABLE public.assessment_submissions FROM anon;

DROP POLICY IF EXISTS "anon_users_can_manage_progress" ON public.student_node_progress;
REVOKE ALL ON TABLE public.student_node_progress FROM anon;

DROP POLICY IF EXISTS "anon_users_can_view_grades" ON public.submission_grades;
REVOKE ALL ON TABLE public.submission_grades FROM anon;

-- ============================================================================
-- 4. hackathon_phase_activity_submissions  (text_answer, image_url, file_urls)
-- ============================================================================
DROP POLICY IF EXISTS "allow_all_hackathon_submissions" ON public.hackathon_phase_activity_submissions;
REVOKE ALL ON TABLE public.hackathon_phase_activity_submissions FROM anon, authenticated;

-- ============================================================================
-- 5. hackathon_team_scores + score events — anon could forge point totals.
--    (Leaderboard reads, if needed publicly, should go through a safe view.)
-- ============================================================================
DROP POLICY IF EXISTS "allow_all_hackathon_team_scores"   ON public.hackathon_team_scores;
DROP POLICY IF EXISTS "allow_all_hackathon_score_events"  ON public.hackathon_team_score_events;
DROP POLICY IF EXISTS "allow_all_phase3_score_events"     ON public.hackathon_phase3_score_events;
REVOKE ALL ON TABLE public.hackathon_team_scores        FROM anon, authenticated;
REVOKE ALL ON TABLE public.hackathon_team_score_events  FROM anon, authenticated;
REVOKE ALL ON TABLE public.hackathon_phase3_score_events FROM anon, authenticated;

-- ============================================================================
-- 6. hackathon_phase3_* — 9 tables with USING(true) for anon + authenticated.
-- ============================================================================
DROP POLICY IF EXISTS "hackathon_phase3_cycles_select"            ON public.hackathon_phase3_cycles;
DROP POLICY IF EXISTS "hackathon_phase3_cycles_insert"            ON public.hackathon_phase3_cycles;
DROP POLICY IF EXISTS "hackathon_phase3_cycles_update"            ON public.hackathon_phase3_cycles;
DROP POLICY IF EXISTS "hackathon_phase3_cycle_steps_select"       ON public.hackathon_phase3_cycle_steps;
DROP POLICY IF EXISTS "hackathon_phase3_cycle_steps_insert"       ON public.hackathon_phase3_cycle_steps;
DROP POLICY IF EXISTS "hackathon_phase3_cycle_steps_update"       ON public.hackathon_phase3_cycle_steps;
DROP POLICY IF EXISTS "hackathon_phase3_test_sessions_select"     ON public.hackathon_phase3_test_sessions;
DROP POLICY IF EXISTS "hackathon_phase3_test_sessions_insert"     ON public.hackathon_phase3_test_sessions;
DROP POLICY IF EXISTS "hackathon_phase3_test_sessions_update"     ON public.hackathon_phase3_test_sessions;
DROP POLICY IF EXISTS "hackathon_phase3_daily_checkins_select"    ON public.hackathon_phase3_daily_checkins;
DROP POLICY IF EXISTS "hackathon_phase3_daily_checkins_insert"    ON public.hackathon_phase3_daily_checkins;
DROP POLICY IF EXISTS "hackathon_phase3_daily_checkins_update"    ON public.hackathon_phase3_daily_checkins;
DROP POLICY IF EXISTS "hackathon_phase3_midphase_synthesis_select"  ON public.hackathon_phase3_midphase_synthesis;
DROP POLICY IF EXISTS "hackathon_phase3_midphase_synthesis_insert"  ON public.hackathon_phase3_midphase_synthesis;
DROP POLICY IF EXISTS "hackathon_phase3_midphase_synthesis_update"  ON public.hackathon_phase3_midphase_synthesis;
DROP POLICY IF EXISTS "hackathon_phase3_ritual_posts_select"      ON public.hackathon_phase3_ritual_posts;
DROP POLICY IF EXISTS "hackathon_phase3_ritual_posts_insert"      ON public.hackathon_phase3_ritual_posts;
DROP POLICY IF EXISTS "hackathon_phase3_ritual_posts_update"      ON public.hackathon_phase3_ritual_posts;
DROP POLICY IF EXISTS "hackathon_phase3_module_progress_select"   ON public.hackathon_phase3_module_progress;
DROP POLICY IF EXISTS "hackathon_phase3_module_progress_insert"   ON public.hackathon_phase3_module_progress;
DROP POLICY IF EXISTS "hackathon_phase3_module_progress_update"   ON public.hackathon_phase3_module_progress;
DROP POLICY IF EXISTS "hackathon_phase3_video_submissions_select" ON public.hackathon_phase3_video_submissions;
DROP POLICY IF EXISTS "hackathon_phase3_video_submissions_insert" ON public.hackathon_phase3_video_submissions;
DROP POLICY IF EXISTS "hackathon_phase3_video_submissions_update" ON public.hackathon_phase3_video_submissions;
DROP POLICY IF EXISTS "hackathon_phase3_mentor_digests_select"    ON public.hackathon_phase3_mentor_digests;

REVOKE ALL ON TABLE public.hackathon_phase3_cycles              FROM anon, authenticated;
REVOKE ALL ON TABLE public.hackathon_phase3_cycle_steps         FROM anon, authenticated;
REVOKE ALL ON TABLE public.hackathon_phase3_test_sessions       FROM anon, authenticated;
REVOKE ALL ON TABLE public.hackathon_phase3_daily_checkins      FROM anon, authenticated;
REVOKE ALL ON TABLE public.hackathon_phase3_midphase_synthesis  FROM anon, authenticated;
REVOKE ALL ON TABLE public.hackathon_phase3_ritual_posts        FROM anon, authenticated;
REVOKE ALL ON TABLE public.hackathon_phase3_module_progress     FROM anon, authenticated;
REVOKE ALL ON TABLE public.hackathon_phase3_video_submissions   FROM anon, authenticated;
REVOKE ALL ON TABLE public.hackathon_phase3_mentor_digests      FROM anon, authenticated;

-- ============================================================================
-- 7. Storage buckets.
--    hackathon_submissions: public + anon full DML. App uploads go to
--    Backblaze B2, not this bucket, so tightening cannot break the app.
--    hackathon-team-avatars: public + anon full DML (defacement / SVG XSS).
--    Both become private; file access should go through signed URLs issued by
--    a service-role route.
-- ============================================================================
UPDATE storage.buckets SET public = false WHERE id = 'hackathon_submissions';
UPDATE storage.buckets SET public = false WHERE id = 'hackathon-team-avatars';

DROP POLICY IF EXISTS "hackathon_submissions_insert" ON storage.objects;
DROP POLICY IF EXISTS "hackathon_submissions_select" ON storage.objects;
DROP POLICY IF EXISTS "hackathon_submissions_update" ON storage.objects;
DROP POLICY IF EXISTS "hackathon_submissions_delete" ON storage.objects;

DROP POLICY IF EXISTS "hackathon_team_avatars_anon_insert"          ON storage.objects;
DROP POLICY IF EXISTS "hackathon_team_avatars_anon_update"          ON storage.objects;
DROP POLICY IF EXISTS "hackathon_team_avatars_anon_delete"          ON storage.objects;
DROP POLICY IF EXISTS "hackathon_team_avatars_authenticated_insert" ON storage.objects;
DROP POLICY IF EXISTS "hackathon_team_avatars_authenticated_update" ON storage.objects;
DROP POLICY IF EXISTS "hackathon_team_avatars_authenticated_delete" ON storage.objects;

-- ============================================================================
-- 8. SECURITY DEFINER helper functions: pin search_path so a writable schema
--    earlier on the path cannot shadow public.user_roles / auth.uid() and
--    escalate callers inside every dependent RLS policy. Signatures match the
--    current definitions (is_admin(user_uuid), is_classroom_instructor(uuid),
--    is_admin_or_instructor(user_uuid)).
-- ============================================================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
             WHERE n.nspname='public' AND p.proname='is_admin' AND p.pronargs=1) THEN
    EXECUTE 'ALTER FUNCTION public.is_admin(uuid) SET search_path = public';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
             WHERE n.nspname='public' AND p.proname='is_classroom_instructor' AND p.pronargs=1) THEN
    EXECUTE 'ALTER FUNCTION public.is_classroom_instructor(uuid) SET search_path = public';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
             WHERE n.nspname='public' AND p.proname='is_admin_or_instructor' AND p.pronargs=1) THEN
    EXECUTE 'ALTER FUNCTION public.is_admin_or_instructor(uuid) SET search_path = public';
  END IF;
END $$;
