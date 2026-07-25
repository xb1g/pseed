-- Fix salary_floor consistency
-- Salary card shows Junior: 24,000-37,000฿/month
-- But salary_floor metric shows 25,000฿/month
-- Per skill rule: floor MUST equal lower bound of entry level salary card
-- Aligning salary_floor to 24,000

UPDATE public.radar_fields
SET research = jsonb_set(research, '{metrics,salary_floor}', '24000')
WHERE slug = 'software-engineer';
