-- Populate radar_fields from career_survival so the /radar gallery shows all 20 careers.
-- Maps tier → color + tags, reasoning → tagline, insights → research JSONB.
-- Idempotent: ON CONFLICT DO UPDATE.

INSERT INTO radar_fields (slug, name_th, name_en, tagline_th, tagline_en, emoji, color, tile_size, tags, is_published, has_content, sort_order, research)
SELECT
  cs.slug,
  -- Thai name: title-case the slug for now (we store English display name)
  INITCAP(REPLACE(cs.slug, '-', ' ')),
  INITCAP(REPLACE(cs.slug, '-', ' ')),
  -- Use first 120 chars of reasoning as tagline
  LEFT(cs.reasoning, 120),
  LEFT(cs.reasoning, 120),
  -- Emoji by tier
  CASE cs.tier
    WHEN 'growing' THEN '🚀'
    WHEN 'shifting' THEN '🔄'
    WHEN 'exposed' THEN '⚠️'
    ELSE '✨'
  END,
  -- Color by tier
  CASE cs.tier
    WHEN 'growing' THEN '#10b981'
    WHEN 'shifting' THEN '#f59e0b'
    WHEN 'exposed' THEN '#ef4444'
    ELSE '#3b82f6'
  END,
  'md',
  -- Tags: always include tier, add collection tags based on salary/tier
  ARRAY[cs.tier] ||
    CASE WHEN cs.salary_ceiling >= 100000 THEN ARRAY['high-pay'] ELSE ARRAY[]::text[] END ||
    CASE WHEN cs.tier = 'growing' THEN ARRAY['ai-proof'] ELSE ARRAY[]::text[] END,
  true,
  false,
  ROW_NUMBER() OVER (
    ORDER BY
      CASE cs.tier WHEN 'growing' THEN 0 WHEN 'shifting' THEN 1 WHEN 'exposed' THEN 2 ELSE 3 END,
      cs.slug
  )::int,
  -- Pack career_survival data into research JSONB
  jsonb_build_object(
    'tier', cs.tier,
    'reasoning', cs.reasoning,
    'sources', cs.sources,
    'insights', cs.insights,
    'metrics', jsonb_build_object(
      'demand_growth', cs.demand_growth,
      'grad_employment_pct', cs.grad_employment_pct,
      'saturation_level', cs.saturation_level,
      'progression_difficulty', cs.progression_difficulty,
      'salary_floor', cs.salary_floor,
      'salary_ceiling', cs.salary_ceiling
    ),
    'global_metrics', jsonb_build_object(
      'demand_growth', cs.global_demand_growth,
      'grad_employment_pct', cs.global_grad_employment_pct,
      'saturation_level', cs.global_saturation_level,
      'progression_difficulty', cs.global_progression_difficulty,
      'salary_floor', cs.global_salary_floor,
      'salary_ceiling', cs.global_salary_ceiling
    ),
    'metric_details', cs.metric_details,
    'global_metric_details', cs.global_metric_details,
    'escape_route_slug', cs.escape_route_slug,
    'aliases', cs.aliases
  )
FROM career_survival cs
ON CONFLICT (slug) DO UPDATE SET
  research = EXCLUDED.research,
  tags = EXCLUDED.tags,
  is_published = true,
  updated_at = now();
