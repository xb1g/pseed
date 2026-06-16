-- Add LINE QR code URL field to gallery products
ALTER TABLE public.hackathon_gallery_products
  ADD COLUMN IF NOT EXISTS line_qr_url TEXT;
