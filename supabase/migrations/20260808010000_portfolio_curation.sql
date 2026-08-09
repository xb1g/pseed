-- Portfolio curation: hero piece, per-project impact lines, display order.
-- hero_project / portfolio_order use composite keys "source:id"
-- (e.g. 'pathlab:<enrollment_id>', 'projectseed:<participant_id>').

ALTER TABLE public.public_profiles
  ADD COLUMN IF NOT EXISTS hero_project text,
  ADD COLUMN IF NOT EXISTS portfolio_notes jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS portfolio_order text[] NOT NULL DEFAULT '{}';

DO $$ BEGIN
  ALTER TABLE public.public_profiles
    ADD CONSTRAINT public_profiles_hero_project_format
    CHECK (hero_project IS NULL OR hero_project ~ '^(pathlab|projectseed):[0-9a-fA-F-]{36}$');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.public_profiles
    ADD CONSTRAINT public_profiles_notes_size
    CHECK (octet_length(portfolio_notes::text) <= 8192);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Public read must expose the curation too, so rebuild the RPC with the
-- extra fields in the profile payload.
CREATE OR REPLACE FUNCTION public.get_public_portfolio(p_handle text)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_profile jsonb;
  v_pathlab jsonb;
  v_projectseed jsonb;
BEGIN
  SELECT pp.user_id INTO v_user_id
  FROM public_profiles pp
  WHERE pp.handle = p_handle AND pp.is_public;

  IF v_user_id IS NULL THEN
    SELECT p.id INTO v_user_id
    FROM profiles p
    JOIN public_profiles pp ON pp.user_id = p.id
    WHERE p.username = p_handle AND pp.is_public;
  END IF;

  IF v_user_id IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT jsonb_build_object(
    'user_id', p.id,
    'username', p.username,
    'full_name', p.full_name,
    'avatar_url', p.avatar_url,
    'member_since', p.created_at,
    'handle', pp.handle,
    'headline', pp.headline,
    'track', pp.track,
    'tools', pp.tools,
    'portfolio_links', pp.portfolio_links,
    'seeking', pp.seeking,
    'hero_project', pp.hero_project,
    'portfolio_notes', pp.portfolio_notes,
    'portfolio_order', pp.portfolio_order
  ) INTO v_profile
  FROM profiles p
  JOIN public_profiles pp ON pp.user_id = p.id
  WHERE p.id = v_user_id;

  SELECT COALESCE(jsonb_agg(journey ORDER BY journey->>'enrolled_at' DESC), '[]'::jsonb)
  INTO v_pathlab
  FROM (
    SELECT jsonb_build_object(
      'enrollment_id', e.id,
      'seed_title', s.title,
      'status', e.status,
      'current_day', e.current_day,
      'total_days', pa.total_days,
      'enrolled_at', e.enrolled_at,
      'completed_at', e.completed_at,
      'report_share_token', r.share_token
    ) AS journey
    FROM path_enrollments e
    JOIN paths pa ON pa.id = e.path_id
    JOIN seeds s ON s.id = pa.seed_id
    LEFT JOIN path_reports r ON r.enrollment_id = e.id
    WHERE e.user_id = v_user_id
  ) t;

  SELECT COALESCE(jsonb_agg(build ORDER BY build->>'submitted_at' DESC NULLS LAST), '[]'::jsonb)
  INTO v_projectseed
  FROM (
    SELECT jsonb_build_object(
      'participant_id', pt.id,
      'cohort_name', c.name,
      'title', COALESCE(pk.custom_title, po.title),
      'summary', po.summary,
      'what_build', pk.what_build,
      'tags', COALESCE(pk.tags, '{}'::text[]),
      'status', pk.status,
      'submitted_at', pk.submitted_at
    ) AS build
    FROM pseed_participants pt
    JOIN pseed_cohorts c ON c.id = pt.cohort_id
    JOIN pseed_project_picks pk ON pk.participant_id = pt.id
    LEFT JOIN pseed_project_options po ON po.id = pk.project_option_id
    WHERE pt.user_id = v_user_id
  ) t;

  RETURN jsonb_build_object(
    'profile', v_profile,
    'pathlab', v_pathlab,
    'projectseed', v_projectseed
  );
END;
$$;

REVOKE ALL ON FUNCTION public.get_public_portfolio(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_portfolio(text) TO anon, authenticated;
