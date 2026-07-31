-- ProjectSeed — slot reminders.
--
-- The safeguarding policy (§3, "Direct messages — never") already settles the
-- hard question: the bot may DM, but only broadcast-style, never
-- conversationally, and anything that matters is also posted in the channel.
-- This migration encodes the consent and de-duplication that rule implies, so
-- the bot (PS-213) has a contract to call rather than a judgement to make.
--
-- Channel ping is the default and DM is opt-in, in that order deliberately: a
-- ProjectSeed-branded private message that feels routine is exactly what makes
-- an impersonation attempt plausible later.
--
-- Prod-first apply: additive and idempotent.

-- ---------------------------------------------------------------------------
-- Per-participant notification preferences
-- ---------------------------------------------------------------------------

ALTER TABLE public.pseed_participants
  ADD COLUMN IF NOT EXISTS notify_channel boolean NOT NULL DEFAULT true;

ALTER TABLE public.pseed_participants
  ADD COLUMN IF NOT EXISTS notify_dm boolean NOT NULL DEFAULT false;

ALTER TABLE public.pseed_participants
  ADD COLUMN IF NOT EXISTS notify_lead_minutes smallint NOT NULL DEFAULT 10;

-- Do not ping me into an empty room. Defaults to 2 because two people is a
-- working session and one person is not — the same threshold the grid uses.
ALTER TABLE public.pseed_participants
  ADD COLUMN IF NOT EXISTS notify_min_people smallint NOT NULL DEFAULT 2;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'pseed_participants_notify_lead_range'
  ) THEN
    ALTER TABLE public.pseed_participants
      ADD CONSTRAINT pseed_participants_notify_lead_range
      CHECK (notify_lead_minutes BETWEEN 0 AND 120);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'pseed_participants_notify_min_people_range'
  ) THEN
    ALTER TABLE public.pseed_participants
      ADD CONSTRAINT pseed_participants_notify_min_people_range
      CHECK (notify_min_people BETWEEN 1 AND 20);
  END IF;
END;
$$;

-- ---------------------------------------------------------------------------
-- Send log — the thing that stops a polling bot from sending twice.
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.pseed_reminder_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id uuid NOT NULL REFERENCES public.pseed_participants(id) ON DELETE CASCADE,
  -- The absolute instant the slot begins, not the weekly slot, so next week's
  -- Tuesday 19:00 is a different row from this week's.
  slot_start_at timestamptz NOT NULL,
  channel text NOT NULL CHECK (channel IN ('dm', 'channel')),
  sent_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (participant_id, slot_start_at, channel)
);

CREATE INDEX IF NOT EXISTS pseed_reminder_log_sent_idx
  ON public.pseed_reminder_log (sent_at DESC);

ALTER TABLE public.pseed_reminder_log ENABLE ROW LEVEL SECURITY;

-- A participant may see what they were sent. Writes belong to the bot, which
-- uses the service role and bypasses RLS — no insert policy exists on purpose.
DROP POLICY IF EXISTS pseed_reminder_log_read_own ON public.pseed_reminder_log;
CREATE POLICY pseed_reminder_log_read_own ON public.pseed_reminder_log
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.pseed_participants p
      WHERE p.id = participant_id AND p.user_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- What to send right now.
--
-- Bot-only: granted to service_role and nothing else. It deliberately carries
-- no `pseed_is_participant` guard, because the caller is a machine with no
-- auth.uid() — which is also why it must never be reachable by a client.
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.pseed_due_reminders(
  p_cohort_id uuid,
  p_now timestamptz DEFAULT now()
)
RETURNS TABLE (
  participant_id uuid,
  discord_user_id text,
  display_name text,
  slot_start_at timestamptz,
  day_of_week smallint,
  hour_of_day smallint,
  participant_count integer,
  wants_dm boolean,
  wants_channel boolean
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH now_local AS (
    SELECT (p_now AT TIME ZONE 'Asia/Bangkok') AS ts
  ),
  -- Today and tomorrow in Bangkok. A lead time capped at 120 minutes cannot
  -- reach further than that, and two candidate days keeps the cross join
  -- trivial while still working across midnight.
  candidates AS (
    SELECT
      a.participant_id,
      a.day_of_week,
      a.hour_of_day,
      (
        date_trunc('day', n.ts)
        + make_interval(days => d.offset_days)
        + make_interval(hours => a.hour_of_day)
      ) AT TIME ZONE 'Asia/Bangkok' AS slot_start_at
    FROM public.pseed_availability a
    CROSS JOIN now_local n
    CROSS JOIN (VALUES (0), (1)) AS d(offset_days)
    WHERE a.cohort_id = p_cohort_id
      AND a.day_of_week = (
        (EXTRACT(
          ISODOW FROM (date_trunc('day', n.ts) + make_interval(days => d.offset_days))
        )::int + 6) % 7
      )
  ),
  slot_totals AS (
    SELECT a.day_of_week, a.hour_of_day, COUNT(*)::integer AS people
    FROM public.pseed_availability a
    JOIN public.pseed_participants p ON p.id = a.participant_id AND p.status = 'active'
    WHERE a.cohort_id = p_cohort_id
    GROUP BY a.day_of_week, a.hour_of_day
  )
  SELECT
    c.participant_id,
    p.discord_user_id,
    COALESCE(NULLIF(btrim(p.display_name), ''), p.discord_username) AS display_name,
    c.slot_start_at,
    c.day_of_week,
    c.hour_of_day,
    t.people AS participant_count,
    -- A DM needs the opt-in and a linked account; without the snowflake there
    -- is nobody to send it to.
    (p.notify_dm AND p.discord_user_id IS NOT NULL) AS wants_dm,
    p.notify_channel AS wants_channel
  FROM candidates c
  JOIN public.pseed_participants p
    ON p.id = c.participant_id AND p.status = 'active'
  JOIN slot_totals t
    ON t.day_of_week = c.day_of_week AND t.hour_of_day = c.hour_of_day
  WHERE c.slot_start_at > p_now
    AND c.slot_start_at <= p_now + make_interval(mins => p.notify_lead_minutes)
    AND t.people >= p.notify_min_people
    AND (p.notify_dm OR p.notify_channel)
    -- Already sent on every channel this participant wants? Then skip. The bot
    -- writes pseed_reminder_log immediately after a successful send, so a crash
    -- mid-run resends rather than silently dropping.
    AND NOT (
      (NOT p.notify_channel OR EXISTS (
        SELECT 1 FROM public.pseed_reminder_log l
        WHERE l.participant_id = c.participant_id
          AND l.slot_start_at = c.slot_start_at
          AND l.channel = 'channel'
      ))
      AND
      (NOT (p.notify_dm AND p.discord_user_id IS NOT NULL) OR EXISTS (
        SELECT 1 FROM public.pseed_reminder_log l
        WHERE l.participant_id = c.participant_id
          AND l.slot_start_at = c.slot_start_at
          AND l.channel = 'dm'
      ))
    );
$$;

REVOKE ALL ON FUNCTION public.pseed_due_reminders(uuid, timestamptz) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.pseed_due_reminders(uuid, timestamptz) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.pseed_due_reminders(uuid, timestamptz) TO service_role;
