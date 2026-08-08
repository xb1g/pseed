-- Portfolio profile (/u/[handle]) — talent fields on public_profiles + public RPC.
-- public_profiles is PII-free by construction; the new columns follow that rule
-- (no email, no discord, no birthdate — only things a user would put on a resume).

ALTER TABLE public.public_profiles
  ADD COLUMN IF NOT EXISTS headline text,
  ADD COLUMN IF NOT EXISTS track text,
  ADD COLUMN IF NOT EXISTS tools text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS portfolio_links text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS seeking text;

ALTER TABLE public.public_profiles
  ADD CONSTRAINT public_profiles_track_check
  CHECK (track IS NULL OR track IN ('dev', 'video', 'strategy', 'design', 'other'));

ALTER TABLE public.public_profiles
  ADD CONSTRAINT public_profiles_seeking_check
  CHECK (seeking IS NULL OR seeking IN ('internship', 'freelance', 'collaboration', 'not-looking'));

ALTER TABLE public.public_profiles
  ADD CONSTRAINT public_profiles_tools_max
  CHECK (array_length(tools, 1) IS NULL OR array_length(tools, 1) <= 20);

ALTER TABLE public.public_profiles
  ADD CONSTRAINT public_profiles_links_max
  CHECK (array_length(portfolio_links, 1) IS NULL OR array_length(portfolio_links, 1) <= 10);

-- The my-path visibility RPC gains 'portfolio' as a valid section so the
-- portfolio page can reuse the same publish flow.
CREATE OR REPLACE FUNCTION set_profile_visibility(
  p_user_id          uuid,
  p_is_public        boolean,
  p_published_sections text[]
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF auth.uid() != p_user_id THEN
    RAISE EXCEPTION 'forbidden';
  END IF;
  IF NOT (p_published_sections <@ ARRAY['class','ikigai','growth','portfolio']::text[]) THEN
    RAISE EXCEPTION 'invalid section';
  END IF;
  INSERT INTO public_profiles (user_id, is_public, published_sections)
    VALUES (p_user_id, p_is_public, p_published_sections)
    ON CONFLICT (user_id)
    DO UPDATE SET
      is_public          = EXCLUDED.is_public,
      published_sections = EXCLUDED.published_sections;
END; $$;

-- Public portfolio read. SECURITY DEFINER because path_enrollments,
-- pseed_participants, and pseed_project_picks are owner-only under RLS.
-- Returns NULL unless the profile exists AND is_public = true, so nothing
-- leaks for private profiles — including whether the handle exists.
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
  -- Handle first, fall back to the legacy profiles.username.
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
    'seeking', pp.seeking
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
