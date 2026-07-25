-- Fix saturation_level 6 → 7 for software-engineer
-- Reason: Our audience is students/new grads. Junior hiring dropped 50% (ARDURA 2026),
-- junior share went from 15% → 7% of tech hires. For entry-level, saturation is high (7-8/10).
-- Mid-senior is scarce (~3/10), but students face the junior market first.
-- 6/10 "ปานกลาง" undersells the difficulty. 7/10 is more honest.
-- Score recalc: (5/10 + 50/100 + (1-7/10) + (1-6/10)) / 4 * 10 = (0.5+0.5+0.3+0.4)/4*10 = 4.25 → 4

UPDATE public.radar_fields
SET
  research = jsonb_set(
    jsonb_set(research, '{metrics,saturation_level}', '7'),
    '{metric_details,saturation_level,th}',
    '"ตลาด junior อิ่มตัวสูงในปี 2026: สัดส่วนจ้างจบใหม่ลดจาก 15% เหลือ 7% การจ้าง junior developer ลดลง ~50% (ARDURA) แต่ mid-senior ยังขาดแคลน — สำหรับนักศึกษา ความอิ่มตัวที่จะเจอจริงสูงกว่าค่าเฉลี่ย"'::jsonb
  ),
  score = 4
WHERE slug = 'software-engineer';
