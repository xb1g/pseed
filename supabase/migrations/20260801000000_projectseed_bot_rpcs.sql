-- ProjectSeed — the functions the Discord bot calls.
--
-- All of these are service_role only. The read-side equivalents used by the web
-- app (`pseed_participant_stats`, `pseed_cohort_heatmap`) guard on
-- `pseed_is_participant()`, which returns false for the bot because a machine
-- has no auth.uid() — so the bot needs its own entry points rather than a
-- loosened guard on the ones a browser can reach.
--
-- Voice join/leave are functions rather than plain inserts so that opening and
-- closing a session is atomic against the partial unique index on open rows.
-- Two gateway events arriving out of order is normal, not exceptional.
--
-- Prod-first apply: additive and idempotent.

-- ---------------------------------------------------------------------------
-- Voice presence
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.pseed_voice_join(
  p_cohort_id uuid,
  p_discord_user_id text,
  p_channel_id text,
  p_at timestamptz DEFAULT now()
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_participant_id uuid;
  v_id uuid;
BEGIN
  SELECT id INTO v_participant_id
  FROM public.pseed_participants
  WHERE cohort_id = p_cohort_id
    AND discord_user_id = p_discord_user_id
    AND status = 'active';

  -- Close anything still open for this user first. A dropped leave event would
  -- otherwise hold the unique index and make this insert fail forever.
  UPDATE public.pseed_voice_sessions
  SET left_at = p_at
  WHERE discord_user_id = p_discord_user_id
    AND left_at IS NULL;

  INSERT INTO public.pseed_voice_sessions (
    cohort_id, participant_id, discord_user_id, discord_channel_id, joined_at
  )
  VALUES (
    p_cohort_id, v_participant_id, p_discord_user_id, p_channel_id, p_at
  )
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.pseed_voice_leave(
  p_discord_user_id text,
  p_at timestamptz DEFAULT now()
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count integer;
BEGIN
  UPDATE public.pseed_voice_sessions
  SET left_at = p_at
  WHERE discord_user_id = p_discord_user_id
    AND left_at IS NULL;

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

/**
 * Closes every open session in a cohort. The bot calls this on startup before
 * re-opening sessions for whoever is actually in voice right now: while the
 * process was down no leave events arrived, and an open row from yesterday
 * would otherwise bank hours nobody was present for.
 */
CREATE OR REPLACE FUNCTION public.pseed_voice_close_all(
  p_cohort_id uuid,
  p_at timestamptz DEFAULT now()
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count integer;
BEGIN
  UPDATE public.pseed_voice_sessions
  SET left_at = LEAST(p_at, joined_at + interval '4 hours')
  WHERE cohort_id = p_cohort_id
    AND left_at IS NULL;

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

-- ---------------------------------------------------------------------------
-- Reminder bookkeeping
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.pseed_log_reminder(
  p_participant_id uuid,
  p_slot_start_at timestamptz,
  p_channel text
)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  INSERT INTO public.pseed_reminder_log (participant_id, slot_start_at, channel)
  VALUES (p_participant_id, p_slot_start_at, p_channel)
  ON CONFLICT (participant_id, slot_start_at, channel) DO NOTHING;
$$;

-- ---------------------------------------------------------------------------
-- Stats by Discord user — what `/stats` answers.
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.pseed_stats_for_discord_user(
  p_cohort_id uuid,
  p_discord_user_id text
)
RETURNS TABLE (
  participant_id uuid,
  display_name text,
  project_title text,
  tags text[],
  planned_slots integer,
  recorded_seconds bigint,
  session_count integer,
  kept_slot_count integer,
  last_seen_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH me AS (
    SELECT p.*
    FROM public.pseed_participants p
    WHERE p.cohort_id = p_cohort_id
      AND p.discord_user_id = p_discord_user_id
      AND p.status = 'active'
  ),
  sessions AS (
    SELECT s.* FROM public.pseed_voice_sessions s
    JOIN me ON me.id = s.participant_id
  )
  SELECT
    me.id,
    COALESCE(NULLIF(btrim(me.display_name), ''), me.discord_username),
    COALESCE(NULLIF(btrim(pick.custom_title), ''), opt.title),
    COALESCE(pick.tags, '{}'),
    (SELECT COUNT(*)::integer FROM public.pseed_availability a WHERE a.participant_id = me.id),
    (SELECT COALESCE(SUM(s.duration_seconds), 0)::bigint FROM sessions s),
    (SELECT COUNT(*)::integer FROM sessions s),
    -- Same weekday arithmetic as pseed_participant_stats: ISODOW is 1..7 from
    -- Monday, and day_of_week is 0..6 from Monday.
    (
      SELECT COUNT(DISTINCT a.id)::integer
      FROM sessions s
      JOIN public.pseed_availability a
        ON a.participant_id = me.id
       AND a.day_of_week = ((EXTRACT(ISODOW FROM (s.joined_at AT TIME ZONE 'Asia/Bangkok'))::int + 6) % 7)
       AND a.hour_of_day = EXTRACT(HOUR FROM (s.joined_at AT TIME ZONE 'Asia/Bangkok'))::int
    ),
    (SELECT MAX(s.joined_at) FROM sessions s)
  FROM me
  LEFT JOIN public.pseed_project_picks pick ON pick.participant_id = me.id
  LEFT JOIN public.pseed_project_options opt ON opt.id = pick.project_option_id;
$$;

-- ---------------------------------------------------------------------------
-- Grants — service_role only, on every function in this file.
-- ---------------------------------------------------------------------------

DO $$
DECLARE
  fn text;
BEGIN
  FOREACH fn IN ARRAY ARRAY[
    'public.pseed_voice_join(uuid, text, text, timestamptz)',
    'public.pseed_voice_leave(text, timestamptz)',
    'public.pseed_voice_close_all(uuid, timestamptz)',
    'public.pseed_log_reminder(uuid, timestamptz, text)',
    'public.pseed_stats_for_discord_user(uuid, text)'
  ]
  LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC', fn);
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM authenticated', fn);
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM anon', fn);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO service_role', fn);
  END LOOP;
END;
$$;
