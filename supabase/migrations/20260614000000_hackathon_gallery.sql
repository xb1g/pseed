-- Hackathon Gallery: public product showcase + interest tracking
-- Products built by hackathon teams, displayed for community adoption

CREATE TABLE IF NOT EXISTS public.hackathon_gallery_products (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id             UUID NOT NULL REFERENCES public.hackathon_teams(id) ON DELETE CASCADE,
  product_name        TEXT NOT NULL,
  problem_statement   TEXT NOT NULL,          -- 1-2 sentences
  solution_description TEXT NOT NULL,         -- ~150-300 words
  cover_image_url     TEXT,                   -- optional; null = atmospheric fallback
  additional_images   TEXT[] DEFAULT '{}',    -- optional extra screenshots
  demo_url            TEXT,                   -- optional link to live demo / video
  tags                TEXT[] NOT NULL DEFAULT '{}',
  hackathon_year      INTEGER NOT NULL DEFAULT 2026,
  hackathon_name      TEXT NOT NULL DEFAULT 'The Next Decade',
  is_published        BOOLEAN NOT NULL DEFAULT false,  -- admin toggles to true
  interest_count      INTEGER NOT NULL DEFAULT 0,      -- denormalized for fast reads
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gallery_products_team ON public.hackathon_gallery_products(team_id);
CREATE INDEX IF NOT EXISTS idx_gallery_products_published ON public.hackathon_gallery_products(is_published) WHERE is_published = true;
CREATE INDEX IF NOT EXISTS idx_gallery_products_tags ON public.hackathon_gallery_products USING GIN(tags);

-- Interest expressions from visitors
CREATE TABLE IF NOT EXISTS public.hackathon_gallery_interests (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id  UUID NOT NULL REFERENCES public.hackathon_gallery_products(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  email       TEXT NOT NULL,
  message     TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gallery_interests_product ON public.hackathon_gallery_interests(product_id);

-- Keep interest_count in sync
CREATE OR REPLACE FUNCTION public.update_gallery_interest_count()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.hackathon_gallery_products
    SET interest_count = interest_count + 1, updated_at = NOW()
    WHERE id = NEW.product_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.hackathon_gallery_products
    SET interest_count = GREATEST(interest_count - 1, 0), updated_at = NOW()
    WHERE id = OLD.product_id;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_gallery_interest_count ON public.hackathon_gallery_interests;
CREATE TRIGGER trg_gallery_interest_count
  AFTER INSERT OR DELETE ON public.hackathon_gallery_interests
  FOR EACH ROW EXECUTE FUNCTION public.update_gallery_interest_count();

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_gallery_products_updated_at ON public.hackathon_gallery_products;
CREATE TRIGGER trg_gallery_products_updated_at
  BEFORE UPDATE ON public.hackathon_gallery_products
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- RLS: published products readable by anyone; interests writable by anyone
ALTER TABLE public.hackathon_gallery_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hackathon_gallery_interests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS gallery_products_public_read ON public.hackathon_gallery_products;
CREATE POLICY gallery_products_public_read
  ON public.hackathon_gallery_products FOR SELECT
  USING (is_published = true);

DROP POLICY IF EXISTS gallery_interests_public_insert ON public.hackathon_gallery_interests;
CREATE POLICY gallery_interests_public_insert
  ON public.hackathon_gallery_interests FOR INSERT
  WITH CHECK (true);
