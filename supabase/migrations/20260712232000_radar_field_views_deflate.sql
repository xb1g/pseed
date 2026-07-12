-- Deflate inflated radar_field_views caused by re-recording on card/auth churn.
-- Keep the earliest view per (session_id, field_slug) as the canonical page-open.

WITH ranked AS (
  SELECT
    id,
    row_number() OVER (
      PARTITION BY session_id, field_slug
      ORDER BY created_at ASC, id ASC
    ) AS rn
  FROM radar_field_views
)
DELETE FROM radar_field_views v
USING ranked r
WHERE v.id = r.id
  AND r.rn > 1;
