-- Career Radar: end-of-chapter reflection checkpoints.
-- Logged-in only (reflection doubles as a login wedge for guests). Captures the
-- interest signal the design doc asks for: want_to_try score + reason tags + text,
-- sliceable by field. See ~/.gstack ceo-plan + docs/CAREER_RADAR_SCHEMA.md.

-- ── allow the 'reflection' card kind (re-declare full list incl growthCompare) ─
ALTER TABLE radar_cards DROP CONSTRAINT IF EXISTS radar_cards_kind_check;
ALTER TABLE radar_cards ADD CONSTRAINT radar_cards_kind_check CHECK (kind IN
  ('hook','fantasyReality','text','jobs','list','cta',
   'dayInLife','salaryProgression','growthCompare','aiImpact','marketThailand',
   'entryRoutes','risks','realPeople','sources','reflection'));

-- ── reflections (one row per chapter checkpoint submission) ──────────────────
CREATE TABLE IF NOT EXISTS radar_reflections (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id   text NOT NULL,                 -- groups one sitting (reuses eventLogger session)
  field_slug   text NOT NULL,
  chapter_key  text NOT NULL,
  want_to_try  int  CHECK (want_to_try BETWEEN 1 AND 5),   -- null on text-only chapters
  tags         text[] NOT NULL DEFAULT '{}',  -- tapped reason chips
  response_text text CHECK (response_text IS NULL OR char_length(response_text) <= 500),
  lang         text NOT NULL DEFAULT 'th' CHECK (lang IN ('th','en')),
  created_at   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS radar_reflections_field_idx   ON radar_reflections (field_slug, created_at DESC);
CREATE INDEX IF NOT EXISTS radar_reflections_user_idx    ON radar_reflections (user_id);
CREATE INDEX IF NOT EXISTS radar_reflections_created_idx ON radar_reflections (created_at DESC);

-- ── RLS: users insert/read their own; admins read all (no anon access) ───────
ALTER TABLE radar_reflections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users insert own reflections" ON radar_reflections;
CREATE POLICY "users insert own reflections" ON radar_reflections
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "users read own reflections" ON radar_reflections;
CREATE POLICY "users read own reflections" ON radar_reflections
  FOR SELECT TO authenticated USING (user_id = auth.uid());

DROP POLICY IF EXISTS "admins read all reflections" ON radar_reflections;
CREATE POLICY "admins read all reflections" ON radar_reflections
  FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));

COMMENT ON TABLE radar_reflections IS 'Career Radar chapter-checkpoint reflections: want_to_try score + reason tags + optional text, per field. Logged-in only.';

-- ── interest rollup per field (founder dashboard; admin reads via RLS) ────────
-- avg want_to_try, response volume, and the most-tapped reason chips per field.
CREATE OR REPLACE VIEW analytics_radar_interest AS
SELECT
  field_slug,
  count(*)                                              AS responses,
  count(DISTINCT user_id)                               AS users,
  round(avg(want_to_try) FILTER (WHERE want_to_try IS NOT NULL), 2) AS avg_want_to_try,
  count(*) FILTER (WHERE want_to_try >= 4)              AS keen_count,
  (
    SELECT array_agg(tag ORDER BY n DESC)
    FROM (
      SELECT t.tag, count(*) AS n
      FROM radar_reflections r2, unnest(r2.tags) AS t(tag)
      WHERE r2.field_slug = r.field_slug
      GROUP BY t.tag
      ORDER BY n DESC
      LIMIT 5
    ) top
  )                                                     AS top_tags,
  max(created_at)                                       AS last_at
FROM radar_reflections r
GROUP BY field_slug;

COMMENT ON VIEW analytics_radar_interest IS 'Per-field Career Radar interest: avg want_to_try, response/user counts, top reason tags. For founder/admin dashboards.';
