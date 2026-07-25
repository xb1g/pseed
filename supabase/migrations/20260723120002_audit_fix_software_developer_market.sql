-- Audit fix: Software Developer marketThailand card
-- Problems found:
--   "5,000+ ตำแหน่ง" — JobsDB shows only ~825 (Jul 2026)
--   depa 150,071 / unemployment 6%/13% — source page 404, unverifiable
--   demand 7/10 too high — junior hiring dropped 50% (ARDURA)
--   competition 5/10 too low — bootcamp grads flood market, only 71-79% placement
--   entry barrier 4/10 too low — need portfolio + skills, not just a bootcamp cert
--   score 63 "ง่าย" misleading for new grads entering a shrinking junior market

UPDATE public.radar_cards
SET content_th = jsonb_build_object(
  'eyebrow', 'ตลาดไทย · ข้อมูลกลางปี 2569',
  'title', 'งานนี้หาง่ายแค่ไหนในไทย?',
  'body', 'ตลาดยังต้องการ dev เก่งๆ แต่ตำแหน่ง junior ลดลงมากเพราะบริษัทใช้ AI แทน ปัจจุบัน JobsDB มีตำแหน่ง Software Engineer/Developer ราว 800-1,000 ตำแหน่งทั่วประเทศ ส่วนใหญ่กระจุกในกรุงเทพฯ และต้องการคนระดับ mid-senior ที่ใช้ AI เป็น คนจบ bootcamp หรือจบใหม่ต้องแข่งกันสูงมาก — placement rate เฉลี่ยอยู่ที่ 71-79% เท่านั้น',
  'openings', '~800-1,000 ตำแหน่ง (JobsDB, Jul 2026)',
  'companies', jsonb_build_array(
    'Agoda', 'LINE MAN Wongnai', 'SCB', 'True Digital', 'KBTG', 'Shopee', 'Grab'
  ),
  'job_access', jsonb_build_object(
    'demand_score', 5,
    'competition_score', 7,
    'entry_barrier_score', 6,
    'score', 40,
    'label', 'ยากสำหรับมือใหม่ — ต้องมีผลงานจริง',
    'confidence', 'medium',
    'methodology', 'สูตร: ความต้องการจ้าง 50% + การแข่งขันแบบกลับคะแนน 25% + ด่านทักษะแรกเข้าแบบกลับคะแนน 25% คะแนนนี้ไม่ใช่เปอร์เซ็นต์โอกาสได้งาน',
    'applicant_data', 'Junior hiring ลดลง ~50% (ARDURA 2026) — bootcamp placement rate 71-79% (CIRR/Metana) ตำแหน่ง mid-senior ยังขาดแคลน แต่ต้องมีประสบการณ์ 3+ ปี'
  ),
  'source_refs', jsonb_build_array(2, 3, 9)
)
WHERE field_id = (SELECT id FROM public.radar_fields WHERE slug = 'software-engineer')
  AND kind = 'marketThailand';
