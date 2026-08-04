CREATE TABLE IF NOT EXISTS talent_profiles (
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
  created_at timestamptz DEFAULT now()
);

-- Unique constraint for upsert in seed script
ALTER TABLE talent_profiles ADD CONSTRAINT talent_profiles_name_uq UNIQUE (full_name, nickname);

-- Enable RLS
ALTER TABLE talent_profiles ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "talent_profiles_anon_select"
  ON talent_profiles
  FOR SELECT
  TO anon, authenticated
  USING (true);
