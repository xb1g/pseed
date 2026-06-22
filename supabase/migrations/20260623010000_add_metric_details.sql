-- Add metric_details JSONB column to career_survival
-- Structure: { "demand_growth": { "th": "...", "en": "...", "sources": [{"title": "...", "url": "..."}] }, ... }
-- Each metric key maps to an explanation (bilingual) + sources array
ALTER TABLE public.career_survival
  ADD COLUMN IF NOT EXISTS metric_details jsonb DEFAULT '{}'::jsonb;

-- Also add for global market
ALTER TABLE public.career_survival
  ADD COLUMN IF NOT EXISTS global_metric_details jsonb DEFAULT '{}'::jsonb;
