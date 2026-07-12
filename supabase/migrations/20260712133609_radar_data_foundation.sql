-- Career Radar Phase 2: normalized skills, related careers, start options,
-- and a constrained interest signal for each recommendation.

CREATE SCHEMA IF NOT EXISTS private;

DROP POLICY IF EXISTS "read cards of published fields" ON public.radar_cards;
CREATE POLICY "read visible cards of published fields"
  ON public.radar_cards FOR SELECT TO anon, authenticated
  USING (
    is_hidden = false
    AND EXISTS (
      SELECT 1
      FROM public.radar_fields AS field
      WHERE field.id = radar_cards.field_id
        AND field.is_published = true
    )
  );

CREATE TABLE public.radar_skills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  namespace text NOT NULL DEFAULT 'career'
    CHECK (namespace ~ '^[a-z][a-z0-9_-]{0,31}$'),
  slug text NOT NULL CHECK (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  name_th text NOT NULL CHECK (char_length(name_th) BETWEEN 1 AND 120),
  name_en text NOT NULL CHECK (char_length(name_en) BETWEEN 1 AND 120),
  description_th text,
  description_en text,
  is_published boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (namespace, slug)
);

CREATE INDEX radar_skills_published_idx
  ON public.radar_skills (namespace, slug)
  WHERE is_published = true;

CREATE TABLE public.radar_field_skills (
  field_id uuid NOT NULL REFERENCES public.radar_fields(id) ON DELETE CASCADE,
  skill_id uuid NOT NULL REFERENCES public.radar_skills(id) ON DELETE CASCADE,
  sort_order integer NOT NULL DEFAULT 0 CHECK (sort_order >= 0),
  is_primary boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (field_id, skill_id)
);

CREATE INDEX radar_field_skills_skill_idx
  ON public.radar_field_skills (skill_id, sort_order);

CREATE TABLE public.radar_skill_jobs (
  skill_id uuid NOT NULL REFERENCES public.radar_skills(id) ON DELETE CASCADE,
  field_id uuid NOT NULL REFERENCES public.radar_fields(id) ON DELETE CASCADE,
  sort_order integer NOT NULL DEFAULT 0 CHECK (sort_order >= 0),
  relevance_note_th text,
  relevance_note_en text,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (skill_id, field_id)
);

CREATE INDEX radar_skill_jobs_field_idx
  ON public.radar_skill_jobs (field_id, sort_order);

CREATE TABLE public.radar_skill_start_options (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  skill_id uuid NOT NULL REFERENCES public.radar_skills(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (
    kind IN ('youtube', 'resource', 'course', 'pathlab', 'project', 'community')
  ),
  title_th text NOT NULL CHECK (char_length(title_th) BETWEEN 1 AND 140),
  title_en text CHECK (title_en IS NULL OR char_length(title_en) BETWEEN 1 AND 140),
  summary_th text CHECK (summary_th IS NULL OR char_length(summary_th) <= 280),
  summary_en text CHECK (summary_en IS NULL OR char_length(summary_en) <= 280),
  provider text CHECK (provider IS NULL OR char_length(provider) <= 80),
  destination_url text,
  destination_ref text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  sort_order integer NOT NULL DEFAULT 0 CHECK (sort_order >= 0),
  is_published boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT radar_skill_start_options_destination_check CHECK (
    num_nonnulls(destination_url, destination_ref) = 1
  ),
  CONSTRAINT radar_skill_start_options_url_check CHECK (
    destination_url IS NULL OR (
      destination_url ~ '^https://'
      AND char_length(destination_url) <= 2048
    )
  ),
  CONSTRAINT radar_skill_start_options_ref_check CHECK (
    destination_ref IS NULL OR char_length(destination_ref) BETWEEN 1 AND 160
  ),
  CONSTRAINT radar_skill_start_options_metadata_check CHECK (
    jsonb_typeof(metadata) = 'object'
    AND pg_column_size(metadata) <= 2048
  )
);

CREATE INDEX radar_skill_start_options_published_idx
  ON public.radar_skill_start_options (skill_id, sort_order)
  WHERE is_published = true;

CREATE TABLE public.radar_interest_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  start_option_id uuid NOT NULL
    REFERENCES public.radar_skill_start_options(id) ON DELETE RESTRICT,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id text NOT NULL CHECK (
    char_length(session_id) BETWEEN 8 AND 128
    AND session_id ~ '^[A-Za-z0-9._:-]+$'
  ),
  event_type text NOT NULL CHECK (
    event_type IN ('interested', 'opened', 'saved', 'dismissed')
  ),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (
    jsonb_typeof(metadata) = 'object'
    AND pg_column_size(metadata) <= 1024
  ),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX radar_interest_events_option_created_idx
  ON public.radar_interest_events (start_option_id, created_at DESC);
CREATE INDEX radar_interest_events_user_created_idx
  ON public.radar_interest_events (user_id, created_at DESC)
  WHERE user_id IS NOT NULL;
CREATE INDEX radar_interest_events_session_created_idx
  ON public.radar_interest_events (session_id, created_at DESC);

ALTER TABLE public.radar_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.radar_field_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.radar_skill_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.radar_skill_start_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.radar_interest_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "read published radar skills"
  ON public.radar_skills FOR SELECT TO anon, authenticated
  USING (is_published = true);

CREATE POLICY "read skills of published radar fields"
  ON public.radar_field_skills FOR SELECT TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.radar_fields AS field
      WHERE field.id = radar_field_skills.field_id
        AND field.is_published = true
    )
    AND EXISTS (
      SELECT 1
      FROM public.radar_skills AS skill
      WHERE skill.id = radar_field_skills.skill_id
        AND skill.is_published = true
    )
  );

CREATE POLICY "read jobs of published radar skills"
  ON public.radar_skill_jobs FOR SELECT TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.radar_skills AS skill
      WHERE skill.id = radar_skill_jobs.skill_id
        AND skill.is_published = true
    )
    AND EXISTS (
      SELECT 1
      FROM public.radar_fields AS field
      WHERE field.id = radar_skill_jobs.field_id
        AND field.is_published = true
    )
  );

CREATE POLICY "read published radar start options"
  ON public.radar_skill_start_options FOR SELECT TO anon, authenticated
  USING (
    is_published = true
    AND EXISTS (
      SELECT 1
      FROM public.radar_skills AS skill
      WHERE skill.id = radar_skill_start_options.skill_id
        AND skill.is_published = true
    )
  );

CREATE POLICY "admins read radar interest events"
  ON public.radar_interest_events FOR SELECT TO authenticated
  USING (public.is_admin((SELECT auth.uid())));

REVOKE ALL ON TABLE public.radar_skills FROM anon, authenticated;
REVOKE ALL ON TABLE public.radar_field_skills FROM anon, authenticated;
REVOKE ALL ON TABLE public.radar_skill_jobs FROM anon, authenticated;
REVOKE ALL ON TABLE public.radar_skill_start_options FROM anon, authenticated;
REVOKE ALL ON TABLE public.radar_interest_events FROM anon, authenticated;

GRANT SELECT ON TABLE public.radar_skills TO anon, authenticated;
GRANT SELECT ON TABLE public.radar_field_skills TO anon, authenticated;
GRANT SELECT ON TABLE public.radar_skill_jobs TO anon, authenticated;
GRANT SELECT ON TABLE public.radar_skill_start_options TO anon, authenticated;
GRANT SELECT ON TABLE public.radar_interest_events TO authenticated;

CREATE OR REPLACE FUNCTION private.record_radar_interest(
  p_start_option_id uuid,
  p_event_type text,
  p_session_id text,
  p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_event_id uuid;
  v_user_id uuid := auth.uid();
BEGIN
  IF p_event_type IS NULL OR p_event_type NOT IN (
    'interested', 'opened', 'saved', 'dismissed'
  ) THEN
    RAISE EXCEPTION 'invalid radar interest event type'
      USING ERRCODE = '22023';
  END IF;

  IF p_session_id IS NULL
     OR char_length(p_session_id) NOT BETWEEN 8 AND 128
     OR p_session_id !~ '^[A-Za-z0-9._:-]+$' THEN
    RAISE EXCEPTION 'invalid radar session id'
      USING ERRCODE = '22023';
  END IF;

  IF p_metadata IS NULL
     OR jsonb_typeof(p_metadata) <> 'object'
     OR pg_column_size(p_metadata) > 1024 THEN
    RAISE EXCEPTION 'invalid radar interest metadata'
      USING ERRCODE = '22023';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.radar_skill_start_options AS start_option
    JOIN public.radar_skills AS skill ON skill.id = start_option.skill_id
    WHERE start_option.id = p_start_option_id
      AND start_option.is_published = true
      AND skill.is_published = true
  ) THEN
    RAISE EXCEPTION 'radar start option not found'
      USING ERRCODE = 'P0002';
  END IF;

  IF (
    SELECT count(*)
    FROM public.radar_interest_events AS event
    WHERE event.session_id = p_session_id
      AND event.created_at >= now() - interval '1 minute'
  ) >= 30 THEN
    RAISE EXCEPTION 'radar interest rate limit exceeded'
      USING ERRCODE = 'P0001';
  END IF;

  INSERT INTO public.radar_interest_events (
    start_option_id,
    user_id,
    session_id,
    event_type,
    metadata
  )
  VALUES (
    p_start_option_id,
    v_user_id,
    p_session_id,
    p_event_type,
    p_metadata
  )
  RETURNING id INTO v_event_id;

  RETURN v_event_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.record_radar_interest(
  p_start_option_id uuid,
  p_event_type text,
  p_session_id text,
  p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT private.record_radar_interest(
    p_start_option_id,
    p_event_type,
    p_session_id,
    p_metadata
  );
$$;

REVOKE ALL ON FUNCTION private.record_radar_interest(uuid, text, text, jsonb)
  FROM PUBLIC;
REVOKE ALL ON FUNCTION public.record_radar_interest(uuid, text, text, jsonb)
  FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.record_radar_interest(uuid, text, text, jsonb)
  TO anon, authenticated;

CREATE TRIGGER radar_skills_updated_at
  BEFORE UPDATE ON public.radar_skills
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER radar_skill_start_options_updated_at
  BEFORE UPDATE ON public.radar_skill_start_options
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

COMMENT ON TABLE public.radar_skills IS
  'Namespaced normalized skills used across Career Radar fields.';
COMMENT ON TABLE public.radar_skill_start_options IS
  'Scannable, published recommendations for trying one Radar skill.';
COMMENT ON TABLE public.radar_interest_events IS
  'Immutable per-option Career Radar interest signals, writable only through record_radar_interest.';
