-- Align demand_growth (Outlook card) with demand_score (Competition card)
-- Outlook showed demand_growth=6 ("ความต้องการตลาด")
-- Competition showed demand_score=5 ("ความต้องการจ้าง")
-- Students see "demand 6" and "demand 5" on the same page — confusing.
-- Both signals point to the same reality: moderate demand favoring seniors.
-- Aligning to 5/10 for consistency.
-- Score recalc: (5/10 + 72/100 + 0.4 + 0.4) / 4 * 10 = (0.5+0.72+0.4+0.4)/4*10 = 5.05 → 5 (no change)

UPDATE public.radar_fields
SET research = jsonb_set(research, '{metrics,demand_growth}', '5')
WHERE slug = 'software-engineer';
