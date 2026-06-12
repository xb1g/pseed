-- public_profiles: 1:1 with auth.users, holds ONLY public-safe columns by construction.
-- Privacy default = PRIVATE (is_public = false). RLS is the entire security boundary.
-- The app hits Supabase directly from device with anon key — NO PII here, ever.
CREATE TABLE public_profiles (
  user_id         uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  handle          text,
  class_slug      text CHECK (class_slug IN ('builder','strategist','creator','analyst','healer','producer')),
  subclass_slug   text,
  current_path    text,
  evolution_stage integer NOT NULL DEFAULT 0 CHECK (evolution_stage >= 0),
  growth_count    integer NOT NULL DEFAULT 0 CHECK (growth_count >= 0),
  is_public       boolean NOT NULL DEFAULT false,
  published_sections text[] NOT NULL DEFAULT '{}',
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

-- Handle: 3-30 lowercase alphanumeric + _ -
ALTER TABLE public_profiles ADD CONSTRAINT handle_format
  CHECK (handle IS NULL OR handle ~ '^[a-z0-9_-]{3,30}$');

CREATE UNIQUE INDEX public_profiles_handle_idx
  ON public_profiles(handle) WHERE handle IS NOT NULL;

-- Auto-touch updated_at
CREATE OR REPLACE FUNCTION touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER public_profiles_updated_at
  BEFORE UPDATE ON public_profiles
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

-- RLS
ALTER TABLE public_profiles ENABLE ROW LEVEL SECURITY;

-- Owner: full access to own row only
CREATE POLICY "owner_all" ON public_profiles
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Public read: only is_public=true rows (table is PII-free by construction)
CREATE POLICY "public_read" ON public_profiles
  FOR SELECT
  USING (is_public = true);

-- Transactional privacy RPC — atomically rewrites published_sections + is_public.
-- SECURITY DEFINER so it can write the row; it checks auth.uid() itself.
CREATE OR REPLACE FUNCTION set_profile_visibility(
  p_user_id          uuid,
  p_is_public        boolean,
  p_published_sections text[]
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  -- Must be the owning user
  IF auth.uid() != p_user_id THEN
    RAISE EXCEPTION 'forbidden';
  END IF;
  -- Validate section names
  IF NOT (p_published_sections <@ ARRAY['class','ikigai','growth']::text[]) THEN
    RAISE EXCEPTION 'invalid section';
  END IF;
  -- Upsert (creates row on first call)
  INSERT INTO public_profiles (user_id, is_public, published_sections)
    VALUES (p_user_id, p_is_public, p_published_sections)
    ON CONFLICT (user_id)
    DO UPDATE SET
      is_public          = EXCLUDED.is_public,
      published_sections = EXCLUDED.published_sections;
END; $$;

GRANT EXECUTE ON FUNCTION set_profile_visibility(uuid, boolean, text[]) TO authenticated;
