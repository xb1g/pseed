-- ProjectSeed — recorded voice hours.
--
-- Declared availability answers "when do you intend to be here". It is the only
-- number the hub can show today, and it is the weaker one: a week of declared
-- hours nobody attends looks identical to a week that worked.
--
-- This table is where the Discord bot (PS-213) writes what actually happened,
-- so "hours" on a participant's profile can mean attended rather than promised.
-- Nothing writes to it yet; the stats RPC returns zeroes until the bot ships,
-- which is deliberate — the profile shows a real zero, not a fabricated number.
--
-- Prod-first apply: additive and idempotent.

CREATE TABLE IF NOT EXISTS public.pseed_voice_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cohort_id uuid NOT NULL REFERENCES public.pseed_cohorts(id) ON DELETE CASCADE,
  -- Nullable: the bot sees a Discord user before it can always resolve them to
  -- a participant. An unmatched session is still worth keeping — it is how we
  -- find people in the room who never linked their account.
  participant_id uuid REFERENCES public.pseed_participants(id) ON DELETE SET NULL,
  discord_user_id text NOT NULL,
  discord_channel_id text,
  joined_at timestamptz NOT NULL,
  -- Null while the session is open. The bot closes it on the leave event.
  left_at timestamptz,
  -- Generated rather than computed at read time so a half-hour of SUM() over a
  -- year of sessions stays one index scan.
  duration_seconds integer GENERATED ALWAYS AS (
    CASE
      WHEN left_at IS NULL THEN NULL
      ELSE GREATEST(0, EXTRACT(EPOCH FROM (left_at - joined_at))::integer)
    END
  ) STORED,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS pseed_voice_sessions_participant_idx
  ON public.pseed_voice_sessions (participant_id, joined_at DESC);

CREATE INDEX IF NOT EXISTS pseed_voice_sessions_discord_idx
  ON public.pseed_voice_sessions (cohort_id, discord_user_id, joined_at DESC);

-- One open session per person per channel. Without this, a dropped leave event
-- leaves an orphan row open forever and every later join double-counts.
CREATE UNIQUE INDEX IF NOT EXISTS pseed_voice_sessions_open_idx
  ON public.pseed_voice_sessions (discord_user_id, COALESCE(discord_channel_id, ''))
  WHERE left_at IS NULL;

ALTER TABLE public.pseed_voice_sessions ENABLE ROW LEVEL SECURITY;

-- Cohort-mates can see each other's sessions: the point is a shared room where
-- showing up is visible. Writes belong to the bot, which uses the service role
-- and bypasses RLS — no client-side insert policy exists on purpose.
DROP POLICY IF EXISTS pseed_voice_sessions_read ON public.pseed_voice_sessions;
CREATE POLICY pseed_voice_sessions_read ON public.pseed_voice_sessions
  FOR SELECT TO authenticated
  USING (public.pseed_is_participant(cohort_id));

-- ---------------------------------------------------------------------------
-- Per-participant stats — the numbers on the profile.
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.pseed_participant_stats(p_participant_id uuid)
RETURNS TABLE (
  recorded_seconds bigint,
  session_count integer,
  last_seen_at timestamptz,
  kept_slot_count integer
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH me AS (
    SELECT p.id, p.cohort_id
    FROM public.pseed_participants p
    WHERE p.id = p_participant_id
      AND public.pseed_is_participant(p.cohort_id)
  ),
  sessions AS (
    SELECT s.*
    FROM public.pseed_voice_sessions s
    JOIN me ON me.id = s.participant_id
  )
  SELECT
    COALESCE(SUM(s.duration_seconds), 0)::bigint AS recorded_seconds,
    COUNT(s.id)::integer AS session_count,
    MAX(s.joined_at) AS last_seen_at,
    -- Sessions that started inside an hour the participant had declared. This
    -- is the honest measure of a schedule: promises kept, not promises made.
    COUNT(DISTINCT a.id)::integer AS kept_slot_count
  FROM sessions s
  LEFT JOIN public.pseed_availability a
    ON a.participant_id = p_participant_id
   AND a.day_of_week = ((EXTRACT(ISODOW FROM (s.joined_at AT TIME ZONE 'Asia/Bangkok'))::int + 6) % 7)
   AND a.hour_of_day = EXTRACT(HOUR FROM (s.joined_at AT TIME ZONE 'Asia/Bangkok'))::int;
$$;

REVOKE ALL ON FUNCTION public.pseed_participant_stats(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.pseed_participant_stats(uuid) TO authenticated;
