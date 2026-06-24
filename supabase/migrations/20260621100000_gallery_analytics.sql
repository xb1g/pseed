-- Gallery analytics: page views and product clicks

CREATE TABLE IF NOT EXISTS public.hackathon_gallery_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page TEXT NOT NULL,              -- 'gallery' or 'product'
  product_id UUID REFERENCES public.hackathon_gallery_products(id) ON DELETE SET NULL,
  session_id TEXT,                 -- anonymous session identifier
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gallery_views_page ON public.hackathon_gallery_views(page);
CREATE INDEX IF NOT EXISTS idx_gallery_views_product ON public.hackathon_gallery_views(product_id);
CREATE INDEX IF NOT EXISTS idx_gallery_views_created ON public.hackathon_gallery_views(created_at);

ALTER TABLE public.hackathon_gallery_views ENABLE ROW LEVEL SECURITY;

-- Allow public inserts (anonymous tracking)
DO $$ BEGIN
  CREATE POLICY gallery_views_public_insert
    ON public.hackathon_gallery_views FOR INSERT
    WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Only service role can read
DO $$ BEGIN
  CREATE POLICY gallery_views_admin_select
    ON public.hackathon_gallery_views FOR SELECT
    USING (false);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
