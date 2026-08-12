-- Full account data purge for delete-account flow.
-- Makes attribution FKs that blocked auth.users deletion nullable/SET NULL,
-- then provides purge_user_account_data() to wipe personal rows before
-- auth.admin.deleteUser().

-- ---------------------------------------------------------------------------
-- 1) Soften attribution FKs that previously NO ACTION / RESTRICT blocked wipe
-- ---------------------------------------------------------------------------

-- paths.created_by was NOT NULL + NO ACTION
ALTER TABLE public.paths
  ALTER COLUMN created_by DROP NOT NULL;

ALTER TABLE public.paths
  DROP CONSTRAINT IF EXISTS paths_created_by_fkey;

ALTER TABLE public.paths
  ADD CONSTRAINT paths_created_by_fkey
  FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;

-- path_reports.generated_by was NOT NULL + NO ACTION
ALTER TABLE public.path_reports
  ALTER COLUMN generated_by DROP NOT NULL;

ALTER TABLE public.path_reports
  DROP CONSTRAINT IF EXISTS path_reports_generated_by_fkey;

ALTER TABLE public.path_reports
  ADD CONSTRAINT path_reports_generated_by_fkey
  FOREIGN KEY (generated_by) REFERENCES auth.users(id) ON DELETE SET NULL;

-- path_enrollments: personal ownership → CASCADE
ALTER TABLE public.path_enrollments
  DROP CONSTRAINT IF EXISTS path_enrollments_user_id_fkey;

ALTER TABLE public.path_enrollments
  ADD CONSTRAINT path_enrollments_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- scored_by attribution
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'path_assessment_submissions'
      AND column_name = 'scored_by'
  ) THEN
    ALTER TABLE public.path_assessment_submissions
      DROP CONSTRAINT IF EXISTS path_assessment_submissions_scored_by_fkey;
    ALTER TABLE public.path_assessment_submissions
      ADD CONSTRAINT path_assessment_submissions_scored_by_fkey
      FOREIGN KEY (scored_by) REFERENCES auth.users(id) ON DELETE SET NULL;
  END IF;
END $$;

-- learning_maps.creator_id → SET NULL (already nullable)
ALTER TABLE public.learning_maps
  DROP CONSTRAINT IF EXISTS learning_maps_creator_id_fkey;

ALTER TABLE public.learning_maps
  ADD CONSTRAINT learning_maps_creator_id_fkey
  FOREIGN KEY (creator_id) REFERENCES public.profiles(id) ON DELETE SET NULL;

-- seeds.created_by → SET NULL
ALTER TABLE public.seeds
  DROP CONSTRAINT IF EXISTS seeds_created_by_fkey;

ALTER TABLE public.seeds
  ADD CONSTRAINT seeds_created_by_fkey
  FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;

-- seed room membership / host: wipe rooms in purge; members CASCADE
ALTER TABLE public.seed_room_members
  DROP CONSTRAINT IF EXISTS seed_room_members_user_id_fkey;

ALTER TABLE public.seed_room_members
  ADD CONSTRAINT seed_room_members_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- node_leaderboard
DO $$
BEGIN
  IF to_regclass('public.node_leaderboard') IS NOT NULL THEN
    ALTER TABLE public.node_leaderboard
      DROP CONSTRAINT IF EXISTS node_leaderboard_user_id_fkey;
    ALTER TABLE public.node_leaderboard
      ADD CONSTRAINT node_leaderboard_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
  END IF;
END $$;

-- build_todos
DO $$
BEGIN
  IF to_regclass('public.build_todos') IS NOT NULL THEN
    ALTER TABLE public.build_todos
      DROP CONSTRAINT IF EXISTS build_todos_user_id_fkey;
    ALTER TABLE public.build_todos
      ADD CONSTRAINT build_todos_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- score_events
DO $$
BEGIN
  IF to_regclass('public.score_events') IS NOT NULL THEN
    ALTER TABLE public.score_events
      DROP CONSTRAINT IF EXISTS score_events_user_id_fkey;
    ALTER TABLE public.score_events
      ADD CONSTRAINT score_events_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- radar_drafts.updated_by was NOT NULL RESTRICT
DO $$
BEGIN
  IF to_regclass('public.radar_drafts') IS NOT NULL THEN
    ALTER TABLE public.radar_drafts
      ALTER COLUMN updated_by DROP NOT NULL;
    ALTER TABLE public.radar_drafts
      DROP CONSTRAINT IF EXISTS radar_drafts_updated_by_fkey;
    ALTER TABLE public.radar_drafts
      ADD CONSTRAINT radar_drafts_updated_by_fkey
      FOREIGN KEY (updated_by) REFERENCES auth.users(id) ON DELETE SET NULL;
  END IF;
END $$;

-- profiles → cascade when auth user deleted (belt after explicit purge)
ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_id_fkey;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_id_fkey
  FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- ---------------------------------------------------------------------------
-- 2) purge_user_account_data — wipe personal + blocking rows
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.purge_user_account_data(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_deleted int := 0;
  v_table text;
  v_sql text;
BEGIN
  IF p_user_id IS NULL THEN
    RAISE EXCEPTION 'p_user_id required';
  END IF;

  -- Only service_role (auth.uid() null) or the user themselves.
  IF auth.uid() IS NOT NULL AND auth.uid() IS DISTINCT FROM p_user_id THEN
    RAISE EXCEPTION 'not authorized to purge this account';
  END IF;

  -- --- Attribution: null out (shared content stays) -------------------------
  UPDATE public.learning_maps SET creator_id = NULL WHERE creator_id = p_user_id;
  UPDATE public.seeds SET created_by = NULL WHERE created_by = p_user_id;
  UPDATE public.paths SET created_by = NULL WHERE created_by = p_user_id;
  UPDATE public.path_reports SET generated_by = NULL WHERE generated_by = p_user_id;

  IF to_regclass('public.path_assessment_submissions') IS NOT NULL THEN
    EXECUTE 'UPDATE public.path_assessment_submissions SET scored_by = NULL WHERE scored_by = $1'
      USING p_user_id;
  END IF;

  IF to_regclass('public.radar_drafts') IS NOT NULL THEN
    EXECUTE 'UPDATE public.radar_drafts SET updated_by = NULL WHERE updated_by = $1'
      USING p_user_id;
  END IF;

  IF to_regclass('public.submission_grades') IS NOT NULL THEN
    EXECUTE 'UPDATE public.submission_grades SET graded_by = NULL WHERE graded_by = $1'
      USING p_user_id;
  END IF;

  IF to_regclass('public.map_nodes') IS NOT NULL THEN
    BEGIN
      EXECUTE 'UPDATE public.map_nodes SET last_modified_by = NULL WHERE last_modified_by = $1'
        USING p_user_id;
    EXCEPTION WHEN undefined_column THEN NULL;
    END;
  END IF;

  IF to_regclass('public.learning_maps') IS NOT NULL THEN
    BEGIN
      EXECUTE 'UPDATE public.learning_maps SET last_modified_by = NULL WHERE last_modified_by = $1'
        USING p_user_id;
    EXCEPTION WHEN undefined_column THEN NULL;
    END;
  END IF;

  -- Expert profile is PII — hard delete (not just SET NULL user_id)
  IF to_regclass('public.expert_profiles') IS NOT NULL THEN
    DELETE FROM public.expert_profiles WHERE user_id = p_user_id;
    GET DIAGNOSTICS v_deleted = ROW_COUNT;
  END IF;

  -- --- Hosted seed rooms (host_id NOT NULL) ---------------------------------
  IF to_regclass('public.seed_rooms') IS NOT NULL THEN
    DELETE FROM public.seed_rooms WHERE host_id = p_user_id;
  END IF;
  IF to_regclass('public.seed_room_members') IS NOT NULL THEN
    DELETE FROM public.seed_room_members WHERE user_id = p_user_id;
  END IF;

  -- --- PathLab personal tree (progress cascades from enrollments) ----------
  DELETE FROM public.path_enrollments WHERE user_id = p_user_id;

  -- --- Tables keyed by user_id / profile id (best-effort) ------------------
  FOREACH v_table IN ARRAY ARRAY[
    'build_todos',
    'score_events',
    'node_leaderboard',
    'user_roles',
    'classroom_memberships',
    'team_memberships',
    'chat_messages',
    'student_node_progress',
    'user_map_enrollments',
    'user_settings',
    'public_profiles',
    'user_events',
    'ai_chat_usage',
    'support_messages',
    'north_stars',
    'radar_reflections',
    'career_comparisons',
    'saved_programs',
    'admission_plans',
    'seed_recommendation_snapshots',
    'profile_guardian_consents',
    'lobby_members',
    'assessment_group_members',
    'map_editors',
    'pre_questionnaires',
    'direction_finder_jobs',
    'song_of_the_day'
  ]
  LOOP
    IF to_regclass(format('public.%I', v_table)) IS NULL THEN
      CONTINUE;
    END IF;

    -- Prefer user_id column; fall back to id for profiles-shaped tables
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = v_table AND column_name = 'user_id'
    ) THEN
      v_sql := format('DELETE FROM public.%I WHERE user_id = $1', v_table);
      EXECUTE v_sql USING p_user_id;
    END IF;
  END LOOP;

  -- Journey / my_path (CASCADE children usually hang off parent)
  IF to_regclass('public.my_paths') IS NOT NULL THEN
    DELETE FROM public.my_paths WHERE user_id = p_user_id;
  END IF;

  IF to_regclass('public.student_journeys') IS NOT NULL THEN
    DELETE FROM public.student_journeys WHERE student_id = p_user_id;
  END IF;

  IF to_regclass('public.reflections') IS NOT NULL THEN
    BEGIN
      DELETE FROM public.reflections WHERE user_id = p_user_id;
    EXCEPTION WHEN undefined_column THEN NULL;
    END;
  END IF;

  -- Assignment groups created by user (blocks profile delete)
  IF to_regclass('public.assignment_groups') IS NOT NULL THEN
    DELETE FROM public.assignment_groups WHERE created_by = p_user_id;
  END IF;

  IF to_regclass('public.assessment_groups') IS NOT NULL THEN
    BEGIN
      DELETE FROM public.assessment_groups WHERE created_by = p_user_id;
    EXCEPTION WHEN undefined_column THEN NULL;
    END;
  END IF;

  -- Lobby creator attribution already SET NULL on profile delete; members wiped above
  IF to_regclass('public.map_lobbies') IS NOT NULL THEN
    BEGIN
      UPDATE public.map_lobbies SET created_by = NULL WHERE created_by = p_user_id;
    EXCEPTION WHEN undefined_column THEN NULL;
    END;
  END IF;

  -- Activity / page templates owned by user
  IF to_regclass('public.activity_templates') IS NOT NULL THEN
    DELETE FROM public.activity_templates WHERE created_by = p_user_id;
  END IF;
  IF to_regclass('public.page_templates') IS NOT NULL THEN
    DELETE FROM public.page_templates WHERE created_by = p_user_id;
  END IF;

  -- ps_* admin leftovers that NO ACTION-block
  IF to_regclass('public.ps_requests') IS NOT NULL THEN
    DELETE FROM public.ps_requests WHERE created_by = p_user_id;
  END IF;

  IF to_regclass('public.mentor_bookings') IS NOT NULL THEN
    UPDATE public.mentor_bookings SET student_id = NULL WHERE student_id = p_user_id;
  END IF;

  -- Profile last (dependents should be gone)
  DELETE FROM public.profiles WHERE id = p_user_id;

  IF EXISTS (SELECT 1 FROM public.profiles WHERE id = p_user_id) THEN
    RAISE EXCEPTION 'profile row still present after purge for %', p_user_id;
  END IF;

  RETURN jsonb_build_object(
    'ok', true,
    'user_id', p_user_id
  );
END;
$$;

REVOKE ALL ON FUNCTION public.purge_user_account_data(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.purge_user_account_data(uuid) TO service_role;

COMMENT ON FUNCTION public.purge_user_account_data(uuid) IS
  'Wipes personal + blocking rows for account deletion. Call before auth.admin.deleteUser.';
