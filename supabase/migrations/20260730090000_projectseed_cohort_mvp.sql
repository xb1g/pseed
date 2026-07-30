-- ProjectSeed cohort MVP
--
-- Alumni-first slice of the ProjectSeed hub (docs/project/PROJECTSEED-STRATEGY.md):
-- a participant joins a cohort with a code, links their Discord account, picks
-- (or proposes) a project, explains it, marks the weekly hours they can be in
-- voice chat, and sees the aggregate heatmap of everyone else's hours.
--
-- Prod-first apply: every statement is additive and idempotent.
--
-- Timezone contract: availability is stored as Asia/Bangkok wall-clock hours.
-- day_of_week is 0 = Monday .. 6 = Sunday (the grid the UI renders).

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.pseed_cohorts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  -- 'alumni' for the MVP batch; 'student' once batch 1 sells.
  audience text NOT NULL DEFAULT 'alumni',
  discord_guild_id text,
  starts_on date,
  ends_on date,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- The join code lives apart from the cohort row so the cohort itself can stay
-- readable by any signed-in user without leaking the code. Nothing selects from
-- this table except SECURITY DEFINER functions below.
CREATE TABLE IF NOT EXISTS public.pseed_cohort_secrets (
  cohort_id uuid PRIMARY KEY REFERENCES public.pseed_cohorts(id) ON DELETE CASCADE,
  join_code text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.pseed_project_options (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cohort_id uuid REFERENCES public.pseed_cohorts(id) ON DELETE CASCADE,
  slug text NOT NULL,
  title text NOT NULL,
  summary text NOT NULL,
  detail text,
  difficulty text NOT NULL DEFAULT 'starter',
  tags text[] NOT NULL DEFAULT '{}',
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS pseed_project_options_cohort_slug_idx
  ON public.pseed_project_options (COALESCE(cohort_id, '00000000-0000-0000-0000-000000000000'::uuid), slug);

CREATE TABLE IF NOT EXISTS public.pseed_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cohort_id uuid NOT NULL REFERENCES public.pseed_cohorts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  -- 'alumni' in the MVP. 'student' and 'mentor' land with batch 1.
  role text NOT NULL DEFAULT 'alumni',
  status text NOT NULL DEFAULT 'active',
  display_name text,
  -- Discord link. discord_user_id is the snowflake the phase-2 bot joins on.
  discord_user_id text,
  discord_username text,
  discord_linked_at timestamptz,
  timezone text NOT NULL DEFAULT 'Asia/Bangkok',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (cohort_id, user_id)
);

CREATE UNIQUE INDEX IF NOT EXISTS pseed_participants_discord_user_idx
  ON public.pseed_participants (cohort_id, discord_user_id)
  WHERE discord_user_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.pseed_project_picks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id uuid NOT NULL UNIQUE REFERENCES public.pseed_participants(id) ON DELETE CASCADE,
  project_option_id uuid REFERENCES public.pseed_project_options(id) ON DELETE SET NULL,
  -- Set when the participant proposes their own instead of picking from the catalog.
  custom_title text,
  what_build text,
  why_this text,
  who_for text,
  first_step text,
  status text NOT NULL DEFAULT 'draft',
  submitted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT pseed_project_picks_has_subject
    CHECK (project_option_id IS NOT NULL OR NULLIF(btrim(COALESCE(custom_title, '')), '') IS NOT NULL)
);

CREATE TABLE IF NOT EXISTS public.pseed_availability (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id uuid NOT NULL REFERENCES public.pseed_participants(id) ON DELETE CASCADE,
  cohort_id uuid NOT NULL REFERENCES public.pseed_cohorts(id) ON DELETE CASCADE,
  day_of_week smallint NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  hour_of_day smallint NOT NULL CHECK (hour_of_day BETWEEN 0 AND 23),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (participant_id, day_of_week, hour_of_day)
);

CREATE INDEX IF NOT EXISTS pseed_availability_cohort_slot_idx
  ON public.pseed_availability (cohort_id, day_of_week, hour_of_day);

-- ---------------------------------------------------------------------------
-- Helper: is the calling user a participant of this cohort?
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.pseed_is_participant(p_cohort_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.pseed_participants p
    WHERE p.cohort_id = p_cohort_id
      AND p.user_id = auth.uid()
      AND p.status = 'active'
  );
$$;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

ALTER TABLE public.pseed_cohorts          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pseed_cohort_secrets   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pseed_project_options  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pseed_participants     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pseed_project_picks    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pseed_availability     ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS pseed_cohorts_read ON public.pseed_cohorts;
CREATE POLICY pseed_cohorts_read ON public.pseed_cohorts
  FOR SELECT TO authenticated
  USING (is_active);

-- No policy on pseed_cohort_secrets: RLS on with zero policies denies every
-- client. Only the SECURITY DEFINER join function reads it.

DROP POLICY IF EXISTS pseed_project_options_read ON public.pseed_project_options;
CREATE POLICY pseed_project_options_read ON public.pseed_project_options
  FOR SELECT TO authenticated
  USING (
    is_active
    AND (cohort_id IS NULL OR public.pseed_is_participant(cohort_id))
  );

-- A participant sees their own row plus their cohort-mates, because the hub
-- shows who else is in the room. Only their own row is writable.
DROP POLICY IF EXISTS pseed_participants_read ON public.pseed_participants;
CREATE POLICY pseed_participants_read ON public.pseed_participants
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.pseed_is_participant(cohort_id));

DROP POLICY IF EXISTS pseed_participants_update_own ON public.pseed_participants;
CREATE POLICY pseed_participants_update_own ON public.pseed_participants
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS pseed_project_picks_read ON public.pseed_project_picks;
CREATE POLICY pseed_project_picks_read ON public.pseed_project_picks
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.pseed_participants p
      WHERE p.id = participant_id
        AND (p.user_id = auth.uid() OR public.pseed_is_participant(p.cohort_id))
    )
  );

DROP POLICY IF EXISTS pseed_project_picks_write_own ON public.pseed_project_picks;
CREATE POLICY pseed_project_picks_write_own ON public.pseed_project_picks
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.pseed_participants p
      WHERE p.id = participant_id AND p.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.pseed_participants p
      WHERE p.id = participant_id AND p.user_id = auth.uid()
    )
  );

-- Availability is readable cohort-wide: the heatmap is the point.
DROP POLICY IF EXISTS pseed_availability_read ON public.pseed_availability;
CREATE POLICY pseed_availability_read ON public.pseed_availability
  FOR SELECT TO authenticated
  USING (public.pseed_is_participant(cohort_id));

DROP POLICY IF EXISTS pseed_availability_write_own ON public.pseed_availability;
CREATE POLICY pseed_availability_write_own ON public.pseed_availability
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.pseed_participants p
      WHERE p.id = participant_id AND p.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.pseed_participants p
      WHERE p.id = participant_id
        AND p.user_id = auth.uid()
        AND p.cohort_id = pseed_availability.cohort_id
    )
  );

-- ---------------------------------------------------------------------------
-- Join: verifies the code without ever exposing it to the client.
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.pseed_join_cohort(
  p_slug text,
  p_code text,
  p_display_name text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_cohort  public.pseed_cohorts%ROWTYPE;
  v_code    text;
  v_id      uuid;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'not_authenticated' USING ERRCODE = '28000';
  END IF;

  SELECT * INTO v_cohort
  FROM public.pseed_cohorts
  WHERE slug = p_slug AND is_active;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'cohort_not_found' USING ERRCODE = 'P0002';
  END IF;

  SELECT join_code INTO v_code
  FROM public.pseed_cohort_secrets
  WHERE cohort_id = v_cohort.id;

  IF v_code IS NULL OR lower(btrim(v_code)) <> lower(btrim(COALESCE(p_code, ''))) THEN
    RAISE EXCEPTION 'invalid_join_code' USING ERRCODE = '28000';
  END IF;

  INSERT INTO public.pseed_participants (cohort_id, user_id, role, display_name)
  VALUES (v_cohort.id, v_user_id, v_cohort.audience, NULLIF(btrim(COALESCE(p_display_name, '')), ''))
  ON CONFLICT (cohort_id, user_id) DO UPDATE
    SET status       = 'active',
        display_name = COALESCE(EXCLUDED.display_name, public.pseed_participants.display_name),
        updated_at   = now()
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

REVOKE ALL ON FUNCTION public.pseed_join_cohort(text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.pseed_join_cohort(text, text, text) TO authenticated;

-- ---------------------------------------------------------------------------
-- Heatmap: one row per occupied slot, with the caller's own slots marked.
-- Aggregated server-side so a participant never pulls the full slot list.
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.pseed_cohort_heatmap(p_cohort_id uuid)
RETURNS TABLE (
  day_of_week smallint,
  hour_of_day smallint,
  participant_count integer,
  includes_me boolean
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    a.day_of_week,
    a.hour_of_day,
    COUNT(*)::integer AS participant_count,
    bool_or(p.user_id = auth.uid()) AS includes_me
  FROM public.pseed_availability a
  JOIN public.pseed_participants p ON p.id = a.participant_id
  WHERE a.cohort_id = p_cohort_id
    AND p.status = 'active'
    AND public.pseed_is_participant(p_cohort_id)
  GROUP BY a.day_of_week, a.hour_of_day;
$$;

REVOKE ALL ON FUNCTION public.pseed_cohort_heatmap(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.pseed_cohort_heatmap(uuid) TO authenticated;

-- ---------------------------------------------------------------------------
-- Replace-the-whole-week save. One statement pair, so a half-saved grid is not
-- a reachable state.
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.pseed_set_availability(
  p_participant_id uuid,
  p_slots jsonb
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_cohort_id uuid;
  v_count     integer;
BEGIN
  SELECT cohort_id INTO v_cohort_id
  FROM public.pseed_participants
  WHERE id = p_participant_id AND user_id = auth.uid() AND status = 'active';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'not_your_participant_row' USING ERRCODE = '28000';
  END IF;

  DELETE FROM public.pseed_availability WHERE participant_id = p_participant_id;

  INSERT INTO public.pseed_availability (participant_id, cohort_id, day_of_week, hour_of_day)
  SELECT DISTINCT
    p_participant_id,
    v_cohort_id,
    (slot->>'day')::smallint,
    (slot->>'hour')::smallint
  FROM jsonb_array_elements(COALESCE(p_slots, '[]'::jsonb)) AS slot
  WHERE (slot->>'day')::smallint BETWEEN 0 AND 6
    AND (slot->>'hour')::smallint BETWEEN 0 AND 23;

  GET DIAGNOSTICS v_count = ROW_COUNT;

  UPDATE public.pseed_participants SET updated_at = now() WHERE id = p_participant_id;

  RETURN v_count;
END;
$$;

REVOKE ALL ON FUNCTION public.pseed_set_availability(uuid, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.pseed_set_availability(uuid, jsonb) TO authenticated;

-- ---------------------------------------------------------------------------
-- Seed: the alumni MVP cohort and its starter project catalog.
-- ---------------------------------------------------------------------------

INSERT INTO public.pseed_cohorts (slug, name, audience, is_active)
VALUES ('alumni-mvp', 'ProjectSeed — Alumni MVP', 'alumni', true)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.pseed_cohort_secrets (cohort_id, join_code)
SELECT id, 'SEEDLING' FROM public.pseed_cohorts WHERE slug = 'alumni-mvp'
ON CONFLICT (cohort_id) DO NOTHING;

INSERT INTO public.pseed_project_options (cohort_id, slug, title, summary, detail, difficulty, tags, sort_order)
SELECT c.id, v.slug, v.title, v.summary, v.detail, v.difficulty, v.tags, v.sort_order
FROM public.pseed_cohorts c
CROSS JOIN (VALUES
  ('discord-bot', 'Discord bot for the room',
   'Build a bot that makes this community better to be in.',
   'Voice-time leaderboards, build-log reminders, a /shipped command. You are the first user, so you find out fast whether it works.',
   'starter', ARRAY['discord','typescript','community'], 10),
  ('tool-for-juniors', 'A tool for the juniors behind you',
   'Something an M4-M6 student would actually open twice.',
   'Interview three of them first. The interview is the deliverable that proves the tool was not invented at a desk.',
   'starter', ARRAY['product','interviews'], 20),
  ('data-story', 'A data story about Thai education',
   'Find a public dataset, ask one uncomfortable question, publish the answer.',
   'TCAS stats, university admission rates, tuition. One chart that changes what a reader believed.',
   'starter', ARRAY['data','writing'], 30),
  ('automate-annoyance', 'Automate the thing that annoys you weekly',
   'Pick one recurring 20-minute chore and delete it.',
   'Smallest honest scope in the catalog. Ships fastest, which is why it is here.',
   'starter', ARRAY['automation','scripting'], 40),
  ('teach-something', 'Teach one thing you had to learn the hard way',
   'A workshop, a short course, or a written guide, delivered to real people.',
   'Alumni who came back to teach are the reason this program exists. This project is that instinct, made into an artifact.',
   'intermediate', ARRAY['teaching','content'], 50),
  ('local-problem', 'A problem in your own neighbourhood',
   'Something physical, local, and specific to where you live.',
   'Hardest to fake and hardest to finish. Take it if you want the portfolio piece nobody else has.',
   'intermediate', ARRAY['community','fieldwork'], 60),
  ('open-source', 'Land a real pull request in an open-source project',
   'Not a typo fix. A change a maintainer argues with you about.',
   'The review thread is the evidence. Save it.',
   'intermediate', ARRAY['open-source','engineering'], 70),
  ('own-idea', 'Something already on your list',
   'You have had an idea sitting around. Bring that one.',
   'Pick the custom option on the next screen and describe it yourself.',
   'starter', ARRAY['custom'], 80)
) AS v(slug, title, summary, detail, difficulty, tags, sort_order)
WHERE c.slug = 'alumni-mvp'
ON CONFLICT DO NOTHING;
