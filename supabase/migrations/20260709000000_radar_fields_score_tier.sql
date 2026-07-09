-- Add score and tier columns directly to radar_fields
-- Replaces the need to parse research JSONB for career survival data

ALTER TABLE radar_fields ADD COLUMN IF NOT EXISTS score smallint;
ALTER TABLE radar_fields ADD COLUMN IF NOT EXISTS tier text;

-- Populate from existing research JSONB data
UPDATE radar_fields
SET
  tier = research->>'tier',
  score = ROUND(
    (
      COALESCE((research->'metrics'->>'demand_growth')::numeric / 10, 0)
      + COALESCE((research->'metrics'->>'grad_employment_pct')::numeric / 100, 0)
      + (1 - COALESCE((research->'metrics'->>'saturation_level')::numeric / 10, 0))
      + (1 - COALESCE((research->'metrics'->>'progression_difficulty')::numeric / 10, 0))
    ) / 4 * 10
  )::smallint
WHERE research->>'tier' IS NOT NULL
  AND research->'metrics' IS NOT NULL;
