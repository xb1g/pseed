-- ProjectSeed — free-text project tags, and a per-slot roster for the heatmap.
--
-- Two additions driven by the same observation: the cohort meets online, so a
-- time slot is only worth joining if enough people are in it AND they are
-- working on something you care about. Counts alone cannot answer the second
-- half, so the heatmap needs to say who is there and what they are building.
--
-- Prod-first apply: additive and idempotent throughout.

-- ---------------------------------------------------------------------------
-- Tags on a project pick
-- ---------------------------------------------------------------------------

ALTER TABLE public.pseed_project_picks
  ADD COLUMN IF NOT EXISTS tags text[] NOT NULL DEFAULT '{}';

-- Five is a limit on the person, not the database: an unbounded tag list stops
-- being a signal and turns into a description nobody reads. Enforced here as
-- well as in the action so a direct PostgREST write cannot bypass it.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'pseed_project_picks_tag_limit'
  ) THEN
    ALTER TABLE public.pseed_project_picks
      ADD CONSTRAINT pseed_project_picks_tag_limit
      CHECK (array_length(tags, 1) IS NULL OR array_length(tags, 1) <= 5);
  END IF;
END;
$$;

-- Tag search across the cohort ("who else is doing anything with `godot`").
CREATE INDEX IF NOT EXISTS pseed_project_picks_tags_idx
  ON public.pseed_project_picks USING gin (tags);

-- ---------------------------------------------------------------------------
-- Slot roster: who is available at each hour, and what they are building.
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.pseed_cohort_slot_roster(p_cohort_id uuid)
RETURNS TABLE (
  day_of_week smallint,
  hour_of_day smallint,
  participant_id uuid,
  display_name text,
  project_title text,
  tags text[],
  is_me boolean
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    a.day_of_week,
    a.hour_of_day,
    p.id AS participant_id,
    -- Falls back to the Discord handle so a row is never a blank name. The
    -- cohort meets in voice chat, where the handle is what people answer to.
    COALESCE(NULLIF(btrim(p.display_name), ''), p.discord_username) AS display_name,
    COALESCE(NULLIF(btrim(pick.custom_title), ''), opt.title) AS project_title,
    COALESCE(pick.tags, '{}') AS tags,
    (p.user_id = auth.uid()) AS is_me
  FROM public.pseed_availability a
  JOIN public.pseed_participants p ON p.id = a.participant_id
  LEFT JOIN public.pseed_project_picks pick ON pick.participant_id = p.id
  LEFT JOIN public.pseed_project_options opt ON opt.id = pick.project_option_id
  WHERE a.cohort_id = p_cohort_id
    AND p.status = 'active'
    AND public.pseed_is_participant(p_cohort_id);
$$;

REVOKE ALL ON FUNCTION public.pseed_cohort_slot_roster(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.pseed_cohort_slot_roster(uuid) TO authenticated;

-- ---------------------------------------------------------------------------
-- What the room is working on, cohort-wide. Feeds the dashboard and, later,
-- the Discord bot's per-member stats.
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.pseed_cohort_tags(p_cohort_id uuid)
RETURNS TABLE (tag text, participant_count integer)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    t.tag,
    COUNT(DISTINCT p.id)::integer AS participant_count
  FROM public.pseed_project_picks pick
  JOIN public.pseed_participants p ON p.id = pick.participant_id
  CROSS JOIN LATERAL unnest(pick.tags) AS t(tag)
  WHERE p.cohort_id = p_cohort_id
    AND p.status = 'active'
    AND public.pseed_is_participant(p_cohort_id)
  GROUP BY t.tag
  ORDER BY participant_count DESC, t.tag ASC;
$$;

REVOKE ALL ON FUNCTION public.pseed_cohort_tags(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.pseed_cohort_tags(uuid) TO authenticated;
