UPDATE public.radar_cards
SET content_th = jsonb_set(content_th, '{presentation}', '"skills"', true)
WHERE kind = 'text'
  AND (
    content_th->>'eyebrow' ILIKE '%ทักษะ%'
    OR content_th->>'eyebrow' ILIKE '%skill%'
    OR content_th->>'title' ILIKE '%ทักษะ%'
  );

UPDATE public.radar_cards
SET content_th = jsonb_set(content_th, '{presentation}', '"startCarousel"', true)
WHERE kind = 'text'
  AND (
    content_th->>'eyebrow' ILIKE '%เริ่ม%'
    OR content_th->>'eyebrow' ILIKE '%start%'
    OR content_th->>'title' ILIKE '%มหาวิทยาลัย%'
    OR content_th->>'title' ILIKE '%เริ่ม%'
  );
