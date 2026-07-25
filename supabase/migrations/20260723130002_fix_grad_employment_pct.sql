-- Fix grad_employment_pct: 72% is from bootcamp placement data (Metana/CIRR)
-- which is global and pre-AI-crisis. With junior hiring -50% (ARDURA 2026),
-- actual new grad placement in Thailand is likely much lower.
-- Lowering to 50% to be honest — if junior hiring halved, employment rate
-- likely halved too from the ~72% baseline.
-- Score recalc: (5/10 + 50/100 + 0.4 + 0.4) / 4 * 10 = (0.5+0.5+0.4+0.4)/4*10 = 4.5 → 5 (no change)

UPDATE public.radar_fields
SET research = jsonb_set(
    jsonb_set(research, '{metrics,grad_employment_pct}', '50'),
    '{metric_details,grad_employment_pct,th}',
    '"Bootcamp placement rate 71-79% (CIRR/Metana) แต่เป็นข้อมูลก่อนวิกฤต AI — junior hiring ลดลง 50% ในปี 2026 (ARDURA) ทำให้อัตราจ้างจบใหม่จริงน่าจะต่ำกว่ามาก ประมาณ 50%"'::jsonb
  )
WHERE slug = 'software-engineer';
