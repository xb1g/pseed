-- Add structured career metrics to career_survival.
-- These power the 7-metric radar summary in the Explore tab.

ALTER TABLE public.career_survival
ADD COLUMN IF NOT EXISTS demand_growth smallint DEFAULT NULL,
ADD COLUMN IF NOT EXISTS grad_employment_pct smallint DEFAULT NULL,
ADD COLUMN IF NOT EXISTS saturation_level smallint DEFAULT NULL,
ADD COLUMN IF NOT EXISTS progression_difficulty smallint DEFAULT NULL,
ADD COLUMN IF NOT EXISTS salary_floor integer DEFAULT NULL,
ADD COLUMN IF NOT EXISTS salary_ceiling integer DEFAULT NULL;

COMMENT ON COLUMN public.career_survival.demand_growth IS '1-10 score: how fast demand is growing (10 = explosive growth)';
COMMENT ON COLUMN public.career_survival.grad_employment_pct IS 'Approximate graduate employment rate within 1 year, 0-100';
COMMENT ON COLUMN public.career_survival.saturation_level IS '1-10 score: how saturated the market is (10 = very crowded)';
COMMENT ON COLUMN public.career_survival.progression_difficulty IS '1-10 score: how hard it is to advance (10 = very difficult)';
COMMENT ON COLUMN public.career_survival.salary_floor IS 'Entry-level monthly salary in THB';
COMMENT ON COLUMN public.career_survival.salary_ceiling IS 'Senior-level monthly salary ceiling in THB';
