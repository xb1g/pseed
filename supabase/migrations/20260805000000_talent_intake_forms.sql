-- Talent intake forms (/talent page)
-- 1. Allow public student-profile submissions into talent_profiles (always unverified)
-- 2. Restrict public reads to verified profiles only (submissions stay hidden until vetted)
-- 3. Project briefs from potential clients

-- Public insert: submissions are forced to verified = false
CREATE POLICY "talent_profiles_anon_insert"
  ON public.talent_profiles
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (verified = false);

-- Public read: verified profiles only
DROP POLICY IF EXISTS "talent_profiles_anon_select" ON public.talent_profiles;

CREATE POLICY "talent_profiles_anon_select"
  ON public.talent_profiles
  FOR SELECT
  TO anon, authenticated
  USING (verified = true);

-- Project brief intake (insert-only for the public, no read policy)
CREATE TABLE IF NOT EXISTS public.talent_project_briefs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contact text NOT NULL,
  brief text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.talent_project_briefs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "talent_project_briefs_anon_insert"
  ON public.talent_project_briefs
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

NOTIFY pgrst, 'reload schema';
