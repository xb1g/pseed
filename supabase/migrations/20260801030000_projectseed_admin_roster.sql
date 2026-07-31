-- ProjectSeed — admin roster, and DM reminders on by default.
--
-- Prod-first apply: additive and idempotent.

-- ---------------------------------------------------------------------------
-- DM reminders default to on.
--
-- Safeguarding §3 permits bot DMs under three constraints and does not require
-- consent, so this is inside policy — but it moves a cost: students now receive
-- a ProjectSeed DM without having asked for one, which makes the "any account
-- that chats with you privately is not us" rule something onboarding has to
-- teach rather than something the opt-in taught by itself. The DM body carries
-- that line for exactly this reason.
--
-- Participants without a linked Discord account are unaffected: pseed_due_reminders
-- requires a snowflake before wants_dm can be true.
-- ---------------------------------------------------------------------------

ALTER TABLE public.pseed_participants
  ALTER COLUMN notify_dm SET DEFAULT true;

UPDATE public.pseed_participants
SET notify_dm = true
WHERE notify_dm = false;

-- ---------------------------------------------------------------------------
-- Who counts as staff.
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.pseed_is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles r
    WHERE r.user_id = auth.uid()
      AND r.role IN ('admin', 'passion-seed-team')
  );
$$;

REVOKE ALL ON FUNCTION public.pseed_is_admin() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.pseed_is_admin() FROM anon;
GRANT EXECUTE ON FUNCTION public.pseed_is_admin() TO authenticated;

-- ---------------------------------------------------------------------------
-- The roster.
--
-- One row per participant, joining everything the delivery view needs: whether
-- they linked Discord, what they are building, how many hours they declared,
-- and how many they actually showed up for. That last pair is the whole point —
-- it is the first measurement of mentor-hours-per-student the programme has
-- ever had (strategy doc, open risk 1) and the input to PS-207.
--
-- SECURITY DEFINER with the admin check inside, rather than an RLS policy,
-- because it reads across participants and aggregates voice sessions. A
-- non-admin gets zero rows, not an error — the page never renders for them.
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.pseed_cohort_roster_admin(p_cohort_id uuid)
RETURNS TABLE (
  participant_id uuid,
  display_name text,
  role text,
  joined_at timestamptz,
  discord_username text,
  discord_user_id text,
  project_title text,
  tags text[],
  brief_status text,
  planned_slots integer,
  shared_slots integer,
  recorded_seconds bigint,
  session_count integer,
  kept_slot_count integer,
  last_seen_at timestamptz,
  notify_channel boolean,
  notify_dm boolean
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH slot_totals AS (
    SELECT a.day_of_week, a.hour_of_day, COUNT(*)::integer AS people
    FROM public.pseed_availability a
    JOIN public.pseed_participants p ON p.id = a.participant_id AND p.status = 'active'
    WHERE a.cohort_id = p_cohort_id
    GROUP BY a.day_of_week, a.hour_of_day
  )
  SELECT
    p.id,
    COALESCE(NULLIF(btrim(p.display_name), ''), p.discord_username),
    p.role,
    p.created_at,
    p.discord_username,
    p.discord_user_id,
    COALESCE(NULLIF(btrim(pick.custom_title), ''), opt.title),
    COALESCE(pick.tags, '{}'),
    pick.status,
    (SELECT COUNT(*)::integer FROM public.pseed_availability a WHERE a.participant_id = p.id),
    -- Declared hours that at least two people shipped up for. A participant
    -- whose every hour is solo is the failure this view exists to surface.
    (
      SELECT COUNT(*)::integer
      FROM public.pseed_availability a
      JOIN slot_totals t
        ON t.day_of_week = a.day_of_week AND t.hour_of_day = a.hour_of_day
      WHERE a.participant_id = p.id AND t.people >= 2
    ),
    (SELECT COALESCE(SUM(s.duration_seconds), 0)::bigint FROM public.pseed_voice_sessions s WHERE s.participant_id = p.id),
    (SELECT COUNT(*)::integer FROM public.pseed_voice_sessions s WHERE s.participant_id = p.id),
    (
      SELECT COUNT(DISTINCT a.id)::integer
      FROM public.pseed_voice_sessions s
      JOIN public.pseed_availability a
        ON a.participant_id = p.id
       AND a.day_of_week = ((EXTRACT(ISODOW FROM (s.joined_at AT TIME ZONE 'Asia/Bangkok'))::int + 6) % 7)
       AND a.hour_of_day = EXTRACT(HOUR FROM (s.joined_at AT TIME ZONE 'Asia/Bangkok'))::int
      WHERE s.participant_id = p.id
    ),
    (SELECT MAX(s.joined_at) FROM public.pseed_voice_sessions s WHERE s.participant_id = p.id),
    p.notify_channel,
    p.notify_dm
  FROM public.pseed_participants p
  LEFT JOIN public.pseed_project_picks pick ON pick.participant_id = p.id
  LEFT JOIN public.pseed_project_options opt ON opt.id = pick.project_option_id
  WHERE p.cohort_id = p_cohort_id
    AND p.status = 'active'
    AND public.pseed_is_admin()
  ORDER BY p.created_at ASC;
$$;

REVOKE ALL ON FUNCTION public.pseed_cohort_roster_admin(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.pseed_cohort_roster_admin(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.pseed_cohort_roster_admin(uuid) TO authenticated;
