-- Rename Software Engineer to Software Developer to better reflect the broader role.

UPDATE public.radar_fields
SET name_th = 'นักพัฒนาซอฟต์แวร์',
    name_en = 'Software Developer'
WHERE slug = 'software-engineer';
