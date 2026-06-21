-- Add YouTube video URL to gallery products
ALTER TABLE public.hackathon_gallery_products
  ADD COLUMN IF NOT EXISTS youtube_url TEXT;
