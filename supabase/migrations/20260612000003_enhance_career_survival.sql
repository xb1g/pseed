-- Add insights column to career_survival table
-- insights is an array of objects: {category, content, priority}
-- Categories: skills, education, certifications, portfolio, market, timeline, salary, competition

ALTER TABLE public.career_survival
ADD COLUMN IF NOT EXISTS insights jsonb DEFAULT '[]'::jsonb;

-- Add comment for documentation
COMMENT ON COLUMN public.career_survival.insights IS 'Array of market intelligence insights. Each object has: category (string), content (string), priority (number 1-5). Categories: skills, education, certifications, portfolio, market, timeline, salary, competition.';
