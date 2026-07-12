-- Global radar analytics totals for admin top cards.
-- Unique viewers must be distinct across all fields (not a sum of per-field uniques).

CREATE OR REPLACE VIEW analytics_radar_totals AS
SELECT
  (SELECT count(*)::bigint FROM radar_field_views) AS total_views,
  (SELECT count(DISTINCT session_id)::bigint FROM radar_field_views) AS unique_viewers,
  (SELECT count(*)::bigint FROM radar_path_intents) AS total_intents;

COMMENT ON VIEW analytics_radar_totals IS 'Global Career Radar totals: views, distinct sessions, path intents. Reads underlying radar_* tables (admin RLS).';
