CREATE TABLE IF NOT EXISTS public.profile_guardian_consents (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  guardian_phone text NOT NULL CHECK (char_length(guardian_phone) BETWEEN 7 AND 24),
  guardian_relationship text NOT NULL CHECK (char_length(guardian_relationship) BETWEEN 1 AND 60),
  consent_confirmed_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.profile_guardian_consents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own guardian consent"
  ON public.profile_guardian_consents FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own guardian consent"
  ON public.profile_guardian_consents FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own guardian consent"
  ON public.profile_guardian_consents FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

GRANT SELECT, INSERT, UPDATE ON public.profile_guardian_consents TO authenticated;

COMMENT ON TABLE public.profile_guardian_consents IS
  'Private parent or guardian approval attestations collected during account setup.';
