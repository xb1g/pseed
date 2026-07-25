-- Audit round 2: Software Developer
-- Fixes from /radar-research audit:
--   1. Source [2] JobsDB IT Salary Report 404 → replace with working salary page
--   2. Source [6] LinkedIn generic page → replace with Metana bootcamp stats (already ref 3)
--      Actually: remove [6] LinkedIn, keep slot for future use
--   3. demand_growth 8 → 6 (O*NET says 7%+, not 15%; junior -50%)
--   4. field score 6 → 5 (recalculated)
--   5. fantasyReality "60%" → soften to "ส่วนใหญ่ของเวลา" (unverified %)
--   6. entryRoutes empty source_refs → add [1] O*NET

-- 1. Fix source [2] — replace dead URL with working JobsDB salary page
UPDATE public.radar_cards
SET content_th = jsonb_set(
  content_th,
  '{items}',
  (
    SELECT jsonb_agg(
      CASE
        WHEN item->>'ref' = '2' THEN jsonb_build_object(
          'ref', 2,
          'title', 'Software Engineer Salary in Thailand',
          'publisher', 'JobsDB',
          'url', 'https://th.jobsdb.com/career-advice/role/software-engineer/salary'
        )
        WHEN item->>'ref' = '6' THEN jsonb_build_object(
          'ref', 6,
          'title', 'Coding Bootcamp Statistics for 2026',
          'publisher', 'Metana',
          'url', 'https://metana.io/blog/coding-bootcamp-statistics-for-2026/'
        )
        ELSE item
      END
    )
    FROM jsonb_array_elements(content_th->'items') AS item
  )
)
WHERE field_id = (SELECT id FROM public.radar_fields WHERE slug = 'software-engineer')
  AND kind = 'sources';

-- 2. Fix fantasyReality — remove unverified "60%" claim
UPDATE public.radar_cards
SET content_th = jsonb_build_object(
  'eyebrow', 'Fantasy vs Reality',
  'title', 'มันไม่ใช่แบบที่คิด',
  'fantasy', 'นั่งเขียนโค้ดทั้งวัน สร้างแอปเท่ๆ คนเดียว ใส่หูฟังเปิดเพลง Lo-fi ไม่ต้องคุยกับใคร',
  'reality', 'ส่วนใหญ่ของเวลาไปกับการอ่านโค้ดคนอื่น ประชุม code review แก้บั๊กที่หาสาเหตุไม่เจอ และเขียน documentation — แต่ตอนที่ทุกอย่างรันผ่าน มันฟินมาก',
  'source_refs', jsonb_build_array(4)
)
WHERE field_id = (SELECT id FROM public.radar_fields WHERE slug = 'software-engineer')
  AND kind = 'fantasyReality';

-- 3. Fix entryRoutes — add source_refs
UPDATE public.radar_cards
SET content_th = content_th || '{"source_refs": [1]}'::jsonb
WHERE field_id = (SELECT id FROM public.radar_fields WHERE slug = 'software-engineer')
  AND kind = 'entryRoutes';

-- 4. Fix demand_growth 8 → 6 and recalculate score 6 → 5
UPDATE public.radar_fields
SET
  research = jsonb_set(
    jsonb_set(research, '{metrics,demand_growth}', '6'),
    '{metric_details,demand_growth,th}',
    '"O*NET คาดการณ์ software developer จะโต 7%+ ระหว่างปี 2024-2034 (Much faster than average) แต่ตำแหน่ง junior ลดลง 50% จาก AI"'::jsonb
  ),
  score = 5
WHERE slug = 'software-engineer';
