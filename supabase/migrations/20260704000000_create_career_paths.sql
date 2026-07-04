-- Career paths schema with RPG-style classification
-- Supports both list view and RPG view with A/B testing

-- 1) Career paths table
CREATE TABLE IF NOT EXISTS public.career_paths (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  class TEXT NOT NULL, -- e.g., "Founder", "Creator", "Operator"
  subclass TEXT NOT NULL, -- e.g., "Tech Founder", "Content Creator"
  difficulty TEXT NOT NULL CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
  duration_days INT NOT NULL DEFAULT 30,
  tags TEXT[] NOT NULL DEFAULT '{}',
  hero_image TEXT,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  is_published BOOLEAN NOT NULL DEFAULT true,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2) Career path examples (real people)
CREATE TABLE IF NOT EXISTS public.career_examples (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  career_path_id UUID NOT NULL REFERENCES public.career_paths(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  company TEXT,
  nationality TEXT,
  image_url TEXT,
  story_summary TEXT NOT NULL,
  notable_for TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3) View test events (A/B/C/D tracking)
CREATE TABLE IF NOT EXISTS public.view_test_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL, -- anonymous session
  user_id UUID REFERENCES auth.users(id),
  view_type TEXT NOT NULL CHECK (view_type IN ('list', 'rpg')),
  event_type TEXT NOT NULL CHECK (event_type IN (
    'view_loaded',
    'class_selected',
    'subclass_selected',
    'path_clicked',
    'example_clicked',
    'enroll_started',
    'enroll_completed',
    'time_on_page',
    'scroll_depth',
    'filter_applied',
    'search_query'
  )),
  payload JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4) Indexes
CREATE INDEX IF NOT EXISTS idx_career_paths_class ON public.career_paths(class);
CREATE INDEX IF NOT EXISTS idx_career_paths_subclass ON public.career_paths(subclass);
CREATE INDEX IF NOT EXISTS idx_career_paths_difficulty ON public.career_paths(difficulty);
CREATE INDEX IF NOT EXISTS idx_career_paths_published ON public.career_paths(is_published);
CREATE INDEX IF NOT EXISTS idx_career_examples_path_id ON public.career_examples(career_path_id);
CREATE INDEX IF NOT EXISTS idx_view_test_events_session ON public.view_test_events(session_id);
CREATE INDEX IF NOT EXISTS idx_view_test_events_view_type ON public.view_test_events(view_type);
CREATE INDEX IF NOT EXISTS idx_view_test_events_event_type ON public.view_test_events(event_type);
CREATE INDEX IF NOT EXISTS idx_view_test_events_created_at ON public.view_test_events(created_at);

-- 5) RLS
ALTER TABLE public.career_paths ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.career_examples ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.view_test_events ENABLE ROW LEVEL SECURITY;

-- Career paths: readable by everyone, manageable by admins
DROP POLICY IF EXISTS "Career paths are viewable by everyone" ON public.career_paths;
CREATE POLICY "Career paths are viewable by everyone"
  ON public.career_paths FOR SELECT
  USING (is_published = true);

DROP POLICY IF EXISTS "Career paths are manageable by admins" ON public.career_paths;
CREATE POLICY "Career paths are manageable by admins"
  ON public.career_paths FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role IN ('admin', 'instructor')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role IN ('admin', 'instructor')
    )
  );

-- Career examples: readable by everyone, manageable by admins
DROP POLICY IF EXISTS "Career examples are viewable by everyone" ON public.career_examples;
CREATE POLICY "Career examples are viewable by everyone"
  ON public.career_examples FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Career examples are manageable by admins" ON public.career_examples;
CREATE POLICY "Career examples are manageable by admins"
  ON public.career_examples FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role IN ('admin', 'instructor')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role IN ('admin', 'instructor')
    )
  );

-- View test events: users can create their own, admins can read all
DROP POLICY IF EXISTS "Users can create their own test events" ON public.view_test_events;
CREATE POLICY "Users can create their own test events"
  ON public.view_test_events FOR INSERT
  WITH CHECK (
    user_id IS NULL
    OR user_id = auth.uid()
  );

DROP POLICY IF EXISTS "Admins can read all test events" ON public.view_test_events;
CREATE POLICY "Admins can read all test events"
  ON public.view_test_events FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role IN ('admin', 'instructor')
    )
  );

-- 6) Grants
GRANT SELECT ON TABLE public.career_paths TO anon;
GRANT SELECT ON TABLE public.career_paths TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.career_paths TO authenticated;
GRANT SELECT ON TABLE public.career_examples TO anon;
GRANT SELECT ON TABLE public.career_examples TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.career_examples TO authenticated;
GRANT INSERT ON TABLE public.view_test_events TO anon;
GRANT INSERT ON TABLE public.view_test_events TO authenticated;
GRANT SELECT ON TABLE public.view_test_events TO authenticated;

-- 7) Insert sample data
INSERT INTO public.career_paths (id, title, description, class, subclass, difficulty, duration_days, tags, is_featured, sort_order)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'Tech Founder', 'Build and scale technology companies from zero to one. Learn product, fundraising, and team building.', 'Founder', 'Tech Founder', 'advanced', 90, ARRAY['startup', 'technology', 'venture'], true, 1),
  ('22222222-2222-2222-2222-222222222222', 'Small Business Owner', 'Start and operate a local service or retail business. Focus on cash flow, operations, and customer relationships.', 'Founder', 'Small Business', 'beginner', 60, ARRAY['local', 'service', 'retail'], true, 2),
  ('33333333-3333-3333-3333-333333333333', 'Content Creator', 'Build an audience and monetize through platforms. Learn storytelling, editing, and brand partnerships.', 'Creator', 'Digital Content', 'beginner', 45, ARRAY['social', 'media', 'storytelling'], true, 3),
  ('44444444-4444-4444-4444-444444444444', 'Product Manager', 'Lead product development from discovery to launch. Bridge user needs, business goals, and engineering.', 'Operator', 'Product', 'intermediate', 75, ARRAY['product', 'strategy', 'tech'], true, 4),
  ('55555555-5555-5555-5555-555555555555', 'Growth Marketer', 'Drive user acquisition and retention through data-driven experiments. Master channels, funnels, and analytics.', 'Operator', 'Marketing', 'intermediate', 60, ARRAY['growth', 'data', 'marketing'], false, 5),
  ('66666666-6666-6666-6666-666666666666', 'AI Product Builder', 'Build products powered by AI/ML. Learn prompt engineering, model selection, and AI-native UX.', 'Founder', 'AI Startup', 'advanced', 90, ARRAY['ai', 'ml', 'technology'], true, 6),
  ('77777777-7777-7777-7777-777777777777', 'Indie Hacker', 'Build small profitable software products independently. Focus on revenue, not funding.', 'Founder', 'Indie', 'intermediate', 60, ARRAY['solo', 'saas', 'revenue'], false, 7),
  ('88888888-8888-8888-8888-888888888888', 'Community Builder', 'Grow and monetize online communities. Learn engagement, moderation, and community-led growth.', 'Creator', 'Community', 'beginner', 45, ARRAY['community', 'engagement', 'growth'], false, 8),
  ('99999999-9999-9999-9999-999999999999', 'Design Engineer', 'Bridge design and code. Build interfaces that are both beautiful and technically excellent.', 'Operator', 'Design', 'intermediate', 60, ARRAY['design', 'frontend', 'ux'], false, 9),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'No-Code Maker', 'Build apps and automations without writing code. Perfect for validating ideas fast.', 'Founder', 'No-Code', 'beginner', 30, ARRAY['nocode', 'automation', 'mvp'], false, 10)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.career_examples (career_path_id, name, role, company, nationality, story_summary, notable_for, sort_order)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'Demis Hassabis', 'CEO & Co-founder', 'DeepMind / Google', 'UK', 'Researcher turned founder who sold AI company to Google for $500M+. Combined neuroscience + AI.', 'AlphaGo, Nobel Prize in Chemistry 2024', 1),
  ('11111111-1111-1111-1111-111111111111', 'Alex Zhu', 'Co-founder', 'Musical.ly / TikTok', 'China', 'Built Musical.ly from Shanghai, merged into TikTok. Proved Chinese teams can build global consumer products.', 'TikTok algorithm, global scale', 2),
  ('22222222-2222-2222-2222-222222222222', 'Jay Fai', 'Owner & Head Chef', 'Jay Fai Restaurant', 'Thailand', 'Street food cook who earned a Michelin star. No formal training, just decades of excellence.', 'Michelin star street food, Bangkok', 1),
  ('33333333-3333-3333-3333-333333333333', 'MrBeast', 'Creator', 'MrBeast LLC', 'USA', 'Started with gaming commentary, pivoted to expensive stunts. Now runs a $700M+ content empire.', 'Biggest YouTuber, philanthropy content', 1),
  ('44444444-4444-4444-4444-444444444444', 'Lenny Rachitsky', 'Product Leader', 'Lenny''s Newsletter', 'USA', 'Airbnb PM turned newsletter founder. Built the most trusted product community online.', 'Newsletter product management', 1),
  ('66666666-6666-6666-6666-666666666666', 'Shane Legg', 'Chief Scientist', 'DeepMind', 'New Zealand', 'Co-founded DeepMind with Hassabis. Focused on AGI safety and research.', 'AGI research, safety', 1),
  ('77777777-7777-7777-7777-777777777777', 'Pieter Levels', 'Solo Founder', 'Nomad List / Photo AI', 'Netherlands', 'Built multiple profitable solo products. Transparent about revenue, anti-VC philosophy.', 'Indie hacking transparency', 1)
ON CONFLICT DO NOTHING;
