-- Fix analytics_radar_engagement.last_at to use the later of view/intent timestamps.
-- Previously COALESCE(last_view_at, last_intent_at) ignored intent activity when any view existed.

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
  GREATEST(v.last_view_at, i.last_intent_at) AS last_at
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
