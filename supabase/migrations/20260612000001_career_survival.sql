-- Career Survival Table
-- Stores career outlook data: whether a career is growing, shifting, or exposed to AI disruption.

CREATE TABLE IF NOT EXISTS public.career_survival (
  slug          TEXT PRIMARY KEY,
  aliases       TEXT[] DEFAULT '{}'::text[],
  tier          TEXT NOT NULL CHECK (tier IN ('growing', 'shifting', 'exposed')),
  reasoning     TEXT,
  sources       JSONB DEFAULT '[]'::jsonb,
  escape_route_slug TEXT REFERENCES public.career_survival(slug) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.career_survival IS 'Career outlook data: growing, shifting, or exposed to AI disruption';

-- GIN index on aliases for fast array lookups
CREATE INDEX IF NOT EXISTS idx_career_survival_aliases
  ON public.career_survival USING gin (aliases);

-- Index on tier for filtering
CREATE INDEX IF NOT EXISTS idx_career_survival_tier
  ON public.career_survival(tier);

-- Updated_at trigger using extensions.moddatetime (idempotent, no standalone function needed)
DROP TRIGGER IF EXISTS career_survival_handle_updated_at ON public.career_survival;
CREATE TRIGGER career_survival_handle_updated_at
  BEFORE UPDATE ON public.career_survival
  FOR EACH ROW EXECUTE PROCEDURE extensions.moddatetime (updated_at);

-- Table to log unmatched career names searched via the RPC
CREATE TABLE IF NOT EXISTS public.career_survival_unmatched (
  name        TEXT NOT NULL,
  searched_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.career_survival_unmatched IS 'Log of career names that did not match any slug or alias';

CREATE INDEX IF NOT EXISTS idx_career_survival_unmatched_searched_at
  ON public.career_survival_unmatched(searched_at DESC);

-- RPC: get_career_survival
-- Normalizes input, tries exact slug match then alias match, logs unmatched names.
CREATE OR REPLACE FUNCTION public.get_career_survival(p_name TEXT)
RETURNS SETOF public.career_survival
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
DECLARE
  v_normalized TEXT;
  v_found BOOLEAN := FALSE;
BEGIN
  -- Normalize: lowercase, replace spaces with hyphens, strip non-alphanumeric except hyphens
  v_normalized := lower(regexp_replace(trim(p_name), '[^a-zA-Z0-9\s]', '', 'g'));
  v_normalized := regexp_replace(v_normalized, '\s+', '-', 'g');

  -- 1. Exact match on slug
  RETURN QUERY
    SELECT * FROM public.career_survival WHERE slug = v_normalized;
  IF FOUND THEN
    RETURN;
  END IF;

  -- 2. Case-insensitive alias match
  RETURN QUERY
    SELECT * FROM public.career_survival WHERE p_name ILIKE ANY (aliases);
  IF FOUND THEN
    RETURN;
  END IF;

  -- 3. No match: log the unmatched name and return nothing
  INSERT INTO public.career_survival_unmatched (name)
  VALUES (p_name);

  RETURN;
END;
$$;

COMMENT ON FUNCTION public.get_career_survival(TEXT) IS 'Look up a career by name (normalized slug or alias match). Logs unmatched names to career_survival_unmatched.';
