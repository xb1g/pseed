-- Add explicit negative intent signal to Career Radar interest events.

ALTER TABLE public.radar_interest_events
  DROP CONSTRAINT IF EXISTS radar_interest_events_event_type_check;

ALTER TABLE public.radar_interest_events
  ADD CONSTRAINT radar_interest_events_event_type_check
    CHECK (
      event_type IN ('interested', 'opened', 'saved', 'dismissed', 'not_interested')
    );

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
    'interested', 'opened', 'saved', 'dismissed', 'not_interested'
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
