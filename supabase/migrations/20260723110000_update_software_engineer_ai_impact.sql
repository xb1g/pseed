-- Update Software Engineer AI Impact card to reflect reality more honestly.
-- Previous score: 3/10 (too low). New score: 7/10.
-- Sources (Stack Overflow 2024, WEF 2025) actually support higher impact.
-- AI is reducing junior/mid headcount, not just augmenting.

UPDATE public.radar_cards
SET content_th = jsonb_build_object(
  'eyebrow', 'โดน AI กระทบเยอะแค่ไหน',
  'title', 'AI Impact',
  'verdict', 'AI กำลังเปลี่ยนวงการนี้อย่างรุนแรง — จำนวนตำแหน่งงานลดลงจริง โดยเฉพาะ junior/mid level เพราะ AI + senior น้อยคนทำงานได้เท่าทีมใหญ่ แต่คนที่ใช้ AI เป็นจะยิ่งมีค่ามากขึ้น',
  'ai_risk_score', 7,
  'augmented', jsonb_build_array(
    'เขียนโค้ดซ้ำๆ เร็วขึ้น (boilerplate, CRUD)',
    'เขียน test อัตโนมัติ',
    'Debug และหาบั๊กเร็วขึ้น',
    'แปลงโค้ดข้ามภาษา',
    'สร้าง prototype ได้ภายในชั่วโมง'
  ),
  'automated', jsonb_build_array(
    'งาน junior ที่เป็น routine — หลายบริษัทลด headcount แล้ว',
    'คนไม่ใช่ dev ก็สร้างแอปง่ายๆ ได้เอง (vibe coding)',
    'Code review เบื้องต้น AI ทำได้เลย',
    'Documentation และ migration scripts'
  )
),
content_en = jsonb_build_object(
  'eyebrow', 'How much AI disruption?',
  'title', 'AI Impact',
  'verdict', 'AI is fundamentally reshaping this field — headcount is genuinely shrinking, especially for junior/mid roles, as AI + fewer senior engineers match the output of larger teams. But engineers who leverage AI become exponentially more valuable.',
  'ai_risk_score', 7,
  'augmented', jsonb_build_array(
    'Write boilerplate and CRUD code faster',
    'Generate tests automatically',
    'Debug and find bugs faster',
    'Translate code across languages',
    'Build prototypes within hours'
  ),
  'automated', jsonb_build_array(
    'Routine junior tasks — many companies already reduced headcount',
    'Non-developers can build simple apps themselves (vibe coding)',
    'Basic code review done by AI',
    'Documentation and migration scripts'
  )
)
WHERE field_id = (SELECT id FROM public.radar_fields WHERE slug = 'software-engineer')
  AND kind = 'aiImpact';
