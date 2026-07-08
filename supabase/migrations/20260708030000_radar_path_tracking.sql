-- Career Radar path-intent + field-view tracking.
-- 2026-07-08
--
-- Tracks two signals for the AI Engineer Path experiment (and future paths):
--   1. radar_field_views  : every time someone opens a radar field page
--   2. radar_path_intents : every time someone clicks a CTA to "start" a path
--
-- Anonymous users are tracked via session_id stored in localStorage; logged-in
-- users also have user_id. Admin dashboards read the aggregate/joined data.

-- ── field views ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS radar_field_views (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id  text NOT NULL,
  field_id    uuid REFERENCES radar_fields(id) ON DELETE SET NULL,
  field_slug  text NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS radar_field_views_field_idx   ON radar_field_views (field_slug, created_at DESC);
CREATE INDEX IF NOT EXISTS radar_field_views_session_idx ON radar_field_views (session_id);
CREATE INDEX IF NOT EXISTS radar_field_views_user_idx    ON radar_field_views (user_id);
CREATE INDEX IF NOT EXISTS radar_field_views_created_idx ON radar_field_views (created_at DESC);

ALTER TABLE radar_field_views ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anyone insert field views" ON radar_field_views;
CREATE POLICY "anyone insert field views" ON radar_field_views
  FOR INSERT TO public WITH CHECK (user_id IS NULL OR user_id = auth.uid());

DROP POLICY IF EXISTS "admins read all field views" ON radar_field_views;
CREATE POLICY "admins read all field views" ON radar_field_views
  FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));

COMMENT ON TABLE radar_field_views IS 'Page views for individual Career Radar field pages. Anonymous via session_id; logged-in via user_id.';

-- ── path intents ("I want to try this path") ─────────────────────────────────
CREATE TABLE IF NOT EXISTS radar_path_intents (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id   text NOT NULL,
  field_id     uuid REFERENCES radar_fields(id) ON DELETE SET NULL,
  field_slug   text NOT NULL,
  path_slug    text NOT NULL,
  button_label text,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS radar_path_intents_field_idx   ON radar_path_intents (field_slug, created_at DESC);
CREATE INDEX IF NOT EXISTS radar_path_intents_path_idx    ON radar_path_intents (path_slug, created_at DESC);
CREATE INDEX IF NOT EXISTS radar_path_intents_session_idx ON radar_path_intents (session_id);
CREATE INDEX IF NOT EXISTS radar_path_intents_user_idx    ON radar_path_intents (user_id);
CREATE INDEX IF NOT EXISTS radar_path_intents_created_idx ON radar_path_intents (created_at DESC);

ALTER TABLE radar_path_intents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anyone insert path intents" ON radar_path_intents;
CREATE POLICY "anyone insert path intents" ON radar_path_intents
  FOR INSERT TO public WITH CHECK (user_id IS NULL OR user_id = auth.uid());

DROP POLICY IF EXISTS "admins read all path intents" ON radar_path_intents;
CREATE POLICY "admins read all path intents" ON radar_path_intents
  FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));

COMMENT ON TABLE radar_path_intents IS 'CTA clicks indicating a user wants to try a hands-on path from a Career Radar field (e.g. AI Engineer Path).';

-- ── admin helper view: per-field view/intent summary ─────────────────────────
CREATE OR REPLACE VIEW analytics_radar_engagement AS
SELECT
  f.slug                               AS field_slug,
  f.name_th                            AS field_name_th,
  f.name_en                            AS field_name_en,
  COALESCE(v.views, 0)                 AS views,
  COALESCE(v.unique_viewers, 0)        AS unique_viewers,
  COALESCE(i.intents, 0)               AS intents,
  COALESCE(i.unique_intenters, 0)      AS unique_intenters,
  COALESCE(i.intent_paths, ARRAY[]::text[]) AS intent_paths,
  COALESCE(v.last_view_at, i.last_intent_at) AS last_at
FROM radar_fields f
LEFT JOIN (
  SELECT
    field_slug,
    count(*) AS views,
    count(DISTINCT session_id) AS unique_viewers,
    max(created_at) AS last_view_at
  FROM radar_field_views
  GROUP BY field_slug
) v ON v.field_slug = f.slug
LEFT JOIN (
  SELECT
    field_slug,
    count(*) AS intents,
    count(DISTINCT session_id) AS unique_intenters,
    array_agg(DISTINCT path_slug ORDER BY path_slug) AS intent_paths,
    max(created_at) AS last_intent_at
  FROM radar_path_intents
  GROUP BY field_slug
) i ON i.field_slug = f.slug
WHERE f.is_published = true;

COMMENT ON VIEW analytics_radar_engagement IS 'Per-field Career Radar summary: views, unique viewers, path intents, and intent paths. For admin dashboards.';
