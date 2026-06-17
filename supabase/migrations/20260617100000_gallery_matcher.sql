-- Whale Product Matcher: target personas, match tracking, match_count

-- 1. Add target_personas column to gallery products
ALTER TABLE public.hackathon_gallery_products
  ADD COLUMN IF NOT EXISTS target_personas JSONB DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS match_count INTEGER NOT NULL DEFAULT 0;

-- 2. Match tracking table
CREATE TABLE IF NOT EXISTS public.hackathon_gallery_matches (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id  UUID NOT NULL REFERENCES public.hackathon_gallery_products(id) ON DELETE CASCADE,
  session_id  TEXT NOT NULL,
  match_score NUMERIC NOT NULL,
  answers     JSONB NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gallery_matches_product ON public.hackathon_gallery_matches(product_id);
CREATE INDEX IF NOT EXISTS idx_gallery_matches_session ON public.hackathon_gallery_matches(session_id);

-- 3. RLS
ALTER TABLE public.hackathon_gallery_matches ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS gallery_matches_public_insert ON public.hackathon_gallery_matches;
CREATE POLICY gallery_matches_public_insert
  ON public.hackathon_gallery_matches FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS gallery_matches_team_read ON public.hackathon_gallery_matches;
-- Match records are read via service role (admin only); no public SELECT needed
-- Teams see their match_count via the denormalized column on hackathon_gallery_products
CREATE POLICY gallery_matches_team_read
  ON public.hackathon_gallery_matches FOR SELECT
  USING (false);

-- 4. Auto-increment match_count (deduplicated per session+product)
CREATE OR REPLACE FUNCTION public.increment_gallery_match_count()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.hackathon_gallery_matches
    WHERE session_id = NEW.session_id AND product_id = NEW.product_id
    AND id != NEW.id
  ) THEN
    UPDATE public.hackathon_gallery_products
    SET match_count = match_count + 1, updated_at = NOW()
    WHERE id = NEW.product_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_gallery_match_count ON public.hackathon_gallery_matches;
CREATE TRIGGER trg_gallery_match_count
  AFTER INSERT ON public.hackathon_gallery_matches
  FOR EACH ROW EXECUTE FUNCTION public.increment_gallery_match_count();
