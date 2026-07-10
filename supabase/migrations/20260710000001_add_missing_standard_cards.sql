-- Add missing `text` card at position 20 for data-scientist
INSERT INTO radar_cards (field_id, kind, position, content_th, is_hidden)
SELECT id, 'text', 20,
  '{"eyebrow": "สายนี้ทำอะไร?", "title": "เปลี่ยนข้อมูลให้เป็นคำตอบ", "body": "นักวิทยาศาสตร์ข้อมูลใช้สถิติ โปรแกรมมิ่ง และ Machine Learning วิเคราะห์ข้อมูลขนาดใหญ่เพื่อหาข้อมูลเชิงลึกที่ช่วยองค์กรตัดสินใจได้ดีขึ้น — ตั้งแต่การคาดการณ์ยอดขาย ไปจนถึงการตรวจจับการฉ้อโกง"}'::jsonb,
  false
FROM radar_fields WHERE slug = 'data-scientist'
ON CONFLICT DO NOTHING;

-- Add missing `text` card at position 20 for software-engineer
INSERT INTO radar_cards (field_id, kind, position, content_th, is_hidden)
SELECT id, 'text', 20,
  '{"eyebrow": "สายนี้ทำอะไร?", "title": "สร้างซอฟต์แวร์ที่ขับเคลื่อนโลก", "body": "วิศวกรซอฟต์แวร์ออกแบบ พัฒนา และดูแลระบบซอฟต์แวร์ทุกรูปแบบ — ตั้งแต่แอปมือถือ เว็บไซต์ ระบบคลาวด์ ไปจนถึง AI ทำงานเป็นทีม แก้ปัญหาด้วยโค้ด และเรียนรู้เทคโนโลยีใหม่ตลอดเวลา"}'::jsonb,
  false
FROM radar_fields WHERE slug = 'software-engineer'
ON CONFLICT DO NOTHING;

-- Fix ai-engineer: normalize positions to standard spacing
-- First move all positions to temp high values to avoid unique constraint conflicts
UPDATE radar_cards SET position = position + 1000
FROM radar_fields
WHERE radar_cards.field_id = radar_fields.id AND radar_fields.slug = 'ai-engineer';

-- Now set standard positions
UPDATE radar_cards SET position = 0
FROM radar_fields
WHERE radar_cards.field_id = radar_fields.id AND radar_fields.slug = 'ai-engineer'
  AND radar_cards.kind = 'hook';

UPDATE radar_cards SET position = 10
FROM radar_fields
WHERE radar_cards.field_id = radar_fields.id AND radar_fields.slug = 'ai-engineer'
  AND radar_cards.kind = 'fantasyReality';

UPDATE radar_cards SET position = 40
FROM radar_fields
WHERE radar_cards.field_id = radar_fields.id AND radar_fields.slug = 'ai-engineer'
  AND radar_cards.kind = 'salaryProgression';

UPDATE radar_cards SET position = 70
FROM radar_fields
WHERE radar_cards.field_id = radar_fields.id AND radar_fields.slug = 'ai-engineer'
  AND radar_cards.kind = 'aiImpact';

UPDATE radar_cards SET position = 90
FROM radar_fields
WHERE radar_cards.field_id = radar_fields.id AND radar_fields.slug = 'ai-engineer'
  AND radar_cards.kind = 'dayInLife';

UPDATE radar_cards SET position = 120
FROM radar_fields
WHERE radar_cards.field_id = radar_fields.id AND radar_fields.slug = 'ai-engineer'
  AND radar_cards.kind = 'entryRoutes';

UPDATE radar_cards SET position = 140
FROM radar_fields
WHERE radar_cards.field_id = radar_fields.id AND radar_fields.slug = 'ai-engineer'
  AND radar_cards.kind = 'cta';

UPDATE radar_cards SET position = 150
FROM radar_fields
WHERE radar_cards.field_id = radar_fields.id AND radar_fields.slug = 'ai-engineer'
  AND radar_cards.kind = 'sources';

-- Hidden cards get arbitrary high positions (doesn't matter, they're hidden)
UPDATE radar_cards SET position = 900
FROM radar_fields
WHERE radar_cards.field_id = radar_fields.id AND radar_fields.slug = 'ai-engineer'
  AND radar_cards.kind = 'futureOutlook';

UPDATE radar_cards SET position = 901
FROM radar_fields
WHERE radar_cards.field_id = radar_fields.id AND radar_fields.slug = 'ai-engineer'
  AND radar_cards.kind = 'realPeople';

UPDATE radar_cards SET position = 902
FROM radar_fields
WHERE radar_cards.field_id = radar_fields.id AND radar_fields.slug = 'ai-engineer'
  AND radar_cards.kind = 'reflection';

-- Add missing text card for ai-engineer
INSERT INTO radar_cards (field_id, kind, position, content_th, is_hidden)
SELECT id, 'text', 20,
  '{"eyebrow": "สายนี้ทำอะไร?", "title": "สร้าง AI ที่เปลี่ยนโลก", "body": "AI Engineer ออกแบบ สร้าง และ deploy ระบบ AI ตั้งแต่ Large Language Models ไปจนถึง Computer Vision — เป็นคนที่อยู่เบื้องหลังเทคโนโลยีที่กำลังเปลี่ยนทุกอุตสาหกรรม ต้องเก่งทั้งคณิตศาสตร์ โปรแกรมมิ่ง และเข้าใจ business"}'::jsonb,
  false
FROM radar_fields WHERE slug = 'ai-engineer'
ON CONFLICT DO NOTHING;

-- Add missing marketThailand card for ai-engineer
INSERT INTO radar_cards (field_id, kind, position, content_th, is_hidden)
SELECT id, 'marketThailand', 80,
  '{"eyebrow": "ตลาดงานไทย", "title": "ตลาด AI ไทยเติบโตเร็วมาก", "body": "บริษัทเทคและสตาร์ทอัพไทยเริ่มลงทุน AI หนัก ตำแหน่ง AI Engineer ในไทยยังมีน้อยแต่ demand สูง — เงินเดือนสูงกว่าสาย dev ทั่วไป 30-50%", "openings": "500+", "companies": ["SCB", "AIS", "True Digital", "Agoda", "LINE", "PTT Digital"], "source_refs": []}'::jsonb,
  false
FROM radar_fields WHERE slug = 'ai-engineer'
ON CONFLICT DO NOTHING;

-- Add missing risks card for ai-engineer
INSERT INTO radar_cards (field_id, kind, position, content_th, is_hidden)
SELECT id, 'risks', 110,
  '{"eyebrow": "ความเสี่ยง", "title": "ความเสี่ยงที่ต้องรู้", "risks": ["เทคโนโลยีเปลี่ยนเร็วมาก — ต้องเรียนรู้ตลอดเวลา ไม่งั้นตกยุค", "แข่งขันสูงกับคนทั่วโลก โดยเฉพาะจากจีนและอินเดีย", "Burnout สูง — งานกดดัน ต้อง ship เร็ว", "กฎระเบียบ AI ยังไม่ชัดเจน — อาจกระทบสายงานในอนาคต"], "source_refs": []}'::jsonb,
  false
FROM radar_fields WHERE slug = 'ai-engineer'
ON CONFLICT DO NOTHING;
