-- Add global market metrics columns to career_survival
-- Thai data stays in existing columns (demand_growth, salary_floor, etc.)
-- Global data uses new global_* columns (salaries in USD/month)

ALTER TABLE public.career_survival
ADD COLUMN IF NOT EXISTS global_demand_growth smallint DEFAULT NULL,
ADD COLUMN IF NOT EXISTS global_grad_employment_pct smallint DEFAULT NULL,
ADD COLUMN IF NOT EXISTS global_saturation_level smallint DEFAULT NULL,
ADD COLUMN IF NOT EXISTS global_progression_difficulty smallint DEFAULT NULL,
ADD COLUMN IF NOT EXISTS global_salary_floor integer DEFAULT NULL,
ADD COLUMN IF NOT EXISTS global_salary_ceiling integer DEFAULT NULL;

COMMENT ON COLUMN public.career_survival.global_demand_growth IS '1-10 scale, global market demand growth';
COMMENT ON COLUMN public.career_survival.global_grad_employment_pct IS '0-100, global graduate employment percentage';
COMMENT ON COLUMN public.career_survival.global_saturation_level IS '1-10 scale, global market saturation';
COMMENT ON COLUMN public.career_survival.global_progression_difficulty IS '1-10 scale, global career progression difficulty';
COMMENT ON COLUMN public.career_survival.global_salary_floor IS 'Entry-level salary in USD/month (global market)';
COMMENT ON COLUMN public.career_survival.global_salary_ceiling IS 'Senior-level salary in USD/month (global market)';
