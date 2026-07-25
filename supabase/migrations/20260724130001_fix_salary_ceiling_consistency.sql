-- Fix salary_ceiling consistency
-- Salary card shows Lead/Staff: 130,000-220,000+฿/month
-- But salary_ceiling metric shows 200,000฿/month
-- Levels.fyi P90 = THB 2,650,518/year ≈ 221K/month
-- Aligning salary_ceiling to 220,000 to match the salary card upper bound

UPDATE public.radar_fields
SET research = jsonb_set(research, '{metrics,salary_ceiling}', '220000')
WHERE slug = 'software-engineer';
