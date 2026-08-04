-- Force create talent_profiles in public schema
-- Previous migrations confirmed table exists somewhere but not in public

DROP TABLE IF EXISTS public.talent_profiles;

CREATE TABLE public.talent_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  nickname text NOT NULL,
  age smallint,
  school text,
  line_id text,
  phone text,
  track text NOT NULL CHECK (track IN ('dev', 'video', 'strategy', 'design')),
  tools text[] DEFAULT '{}',
  portfolio_links text[] DEFAULT '{}',
  verified boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT talent_profiles_name_uq UNIQUE (full_name, nickname)
);

ALTER TABLE public.talent_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "talent_profiles_anon_select"
  ON public.talent_profiles
  FOR SELECT
  TO anon, authenticated
  USING (true);

NOTIFY pgrst, 'reload schema';
