-- Migration: Update ProjectSeed options to real Project Genres
-- Timestamp: 2026-07-31

-- Deactivate old template project options for active cohort
UPDATE public.pseed_project_options
SET is_active = false
WHERE cohort_id IN (SELECT id FROM public.pseed_cohorts WHERE slug = 'alumni-mvp');

-- Insert or update genuine Project Genres
INSERT INTO public.pseed_project_options (cohort_id, slug, title, summary, detail, difficulty, tags, sort_order, is_active)
SELECT c.id, v.slug, v.title, v.summary, v.detail, v.difficulty, v.tags, v.sort_order, true
FROM public.pseed_cohorts c
CROSS JOIN (VALUES
  ('web-dev', 'Web & App Development',
   'Web applications, mobile apps, developer tools, SaaS, APIs, browser extensions, and utility tools.',
   'Building functional software that solves a real user problem or automates a workflow.',
   'starter', ARRAY['web','app','software'], 10),
  ('ai-tech', 'AI & Automation',
   'AI agents, LLM integrations, computer vision, smart assistants, and automated workflows.',
   'Leveraging modern AI APIs or building intelligent bots and tools.',
   'starter', ARRAY['ai','automation','llm'], 20),
  ('game-dev', 'Games & Interactive Media',
   'Indie games, game mods, interactive fiction, VR/AR, and 3D graphics.',
   'Designing interactive mechanics, gameplay loops, or playful experiences.',
   'starter', ARRAY['game','interactive','graphics'], 30),
  ('hardware-iot', 'Hardware & Physical Tech',
   'Arduino/Raspberry Pi, IoT sensors, robotics, microcontrollers, and physical devices.',
   'Connecting software with physical hardware, sensors, and real-world inputs.',
   'starter', ARRAY['hardware','iot','robotics'], 40),
  ('data-research', 'Data, Scrapers & Analytics',
   'Data visualization, web scraping, data stories, public statistics, and analytical tools.',
   'Extracting, analyzing, and presenting data to surface hidden insights.',
   'starter', ARRAY['data','scraping','analytics'], 50),
  ('edu-content', 'Education & Content Creation',
   'Interactive learning tools, courses, technical writing, tutorials, and educational media.',
   'Teaching complex concepts or building learning tools for other students.',
   'starter', ARRAY['education','content','teaching'], 60),
  ('creative-design', 'Design & Creative Arts',
   'UI/UX design systems, generative art, digital media, 3D assets, and branding tools.',
   'Crafting aesthetic design assets, design systems, or creative tools.',
   'starter', ARRAY['design','art','creative'], 70),
  ('social-impact', 'Community & Social Impact',
   'Local community tools, non-profit tech, environmental monitoring, and civic engagement.',
   'Building technology that directly impacts a local group or community issue.',
   'starter', ARRAY['community','impact','civic'], 80)
) AS v(slug, title, summary, detail, difficulty, tags, sort_order)
WHERE c.slug = 'alumni-mvp'
ON CONFLICT (COALESCE(cohort_id, '00000000-0000-0000-0000-000000000000'::uuid), slug)
DO UPDATE SET
  title = EXCLUDED.title,
  summary = EXCLUDED.summary,
  detail = EXCLUDED.detail,
  difficulty = EXCLUDED.difficulty,
  tags = EXCLUDED.tags,
  sort_order = EXCLUDED.sort_order,
  is_active = true;
