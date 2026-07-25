-- Audit fix: Software Developer cards
-- All claims now verified against actual source data (Jul 2026 audit).
-- Key changes:
--   hook: 25% growth → 7%+ (O*NET 2024-2034), title→นักพัฒนาซอฟต์แวร์
--   salaryProgression: ceiling raised to match Levels.fyi P90
--   dayInLife: title fixed, added AI tool usage
--   risks: added junior hiring crisis (ARDURA: -50%)
--   text cards: วิศวกร→นักพัฒนา
--   cta: วิศวกร→นักพัฒนา
--   sources: added missing refs [8],[9], removed unverifiable Robert Walters
--   tagline_th: fixed from English to Thai

-- 1. Fix hook — growth stat was fabricated (25%), O*NET says 7%+ for 2024-2034
UPDATE public.radar_cards
SET content_th = jsonb_build_object(
  'eyebrow', 'สายนักพัฒนาซอฟต์แวร์',
  'title', 'นักพัฒนาซอฟต์แวร์',
  'body', 'ทุกธุรกิจต้องใช้ซอฟต์แวร์ — แต่วงการกำลังเปลี่ยนเร็วมาก AI ทำให้ทีมเล็กลงแต่ต้องเก่งขึ้น คนที่ใช้ AI เป็นจะได้เปรียบสุดๆ แต่ตำแหน่ง junior กำลังลดลงอย่างรวดเร็ว',
  'stat', '7%+',
  'statLabel', 'อัตราเติบโตของตำแหน่งงาน 2024-2034 (O*NET/BLS) แต่ junior hiring ลดลง 50%'
)
WHERE field_id = (SELECT id FROM public.radar_fields WHERE slug = 'software-engineer')
  AND kind = 'hook';

-- 2. Fix salaryProgression — ceiling understated, verified against JobsDB + Levels.fyi
UPDATE public.radar_cards
SET content_th = jsonb_build_object(
  'eyebrow', 'เงินเดือน',
  'title', 'ยิ่งเก่ง ยิ่งได้',
  'levels', jsonb_build_array(
    jsonb_build_object('level', 'Junior Developer', 'years', '0-2', 'salary', '24,000-37,000฿', 'note', 'เริ่มต้นเรียนรู้ ทำ task เล็กๆ — ตำแหน่งนี้กำลังลดลงเพราะ AI'),
    jsonb_build_object('level', 'Mid-level Developer', 'years', '2-5', 'salary', '40,000-70,000฿', 'note', 'รับผิดชอบ feature เต็มรูปแบบ ใช้ AI เป็นเครื่องมือหลัก'),
    jsonb_build_object('level', 'Senior Developer', 'years', '5-8', 'salary', '90,000-130,000฿', 'note', 'ออกแบบระบบ เป็น mentor ให้ทีม — ตำแหน่งที่ยังขาดแคลน'),
    jsonb_build_object('level', 'Lead / Staff Engineer', 'years', '8+', 'salary', '130,000-220,000+฿', 'note', 'ตัดสินใจเรื่อง architecture ทั้งระบบ Levels.fyi P90 ≈ 221K/เดือน')
  ),
  'source_refs', jsonb_build_array(2, 8)
)
WHERE field_id = (SELECT id FROM public.radar_fields WHERE slug = 'software-engineer')
  AND kind = 'salaryProgression';

-- 3. Fix dayInLife — title still said วิศวกร, missing AI tool usage
UPDATE public.radar_cards
SET content_th = jsonb_build_object(
  'eyebrow', 'หนึ่งวัน',
  'title', 'หนึ่งวันของนักพัฒนาซอฟต์แวร์',
  'steps', jsonb_build_array(
    jsonb_build_object('label', 'เขียนโค้ดฟีเจอร์ใหม่โดยใช้ AI ช่วย', 'detail', 'อ่าน user story จาก Jira ใช้ AI coding assistant (Copilot, Claude, Cursor) ช่วยเขียน implementation เร็วขึ้น แต่ต้องตรวจ logic, security และ edge case เอง'),
    jsonb_build_object('label', 'Review โค้ดของเพื่อนร่วมทีม (Code Review)', 'detail', 'อ่าน PR บน GitHub ตรวจสอบ logic ความถูกต้อง naming convention และ security issue — AI ช่วย review เบื้องต้นได้แต่ยังต้องใช้คนตัดสินใจ'),
    jsonb_build_object('label', 'แก้บั๊กจาก production', 'detail', 'อ่าน error log จาก Sentry หรือ Datadog หาจุดที่ fail reproduce ใน local วิเคราะห์ root cause แล้วแก้ไขพร้อมเขียน test กัน regression'),
    jsonb_build_object('label', 'ออกแบบ architecture สำหรับระบบใหม่', 'detail', 'ประชุมกับทีมเพื่อ whiteboard ระบบ พิจารณา scalability, cost และ trade-offs — งานนี้ AI ยังทำแทนไม่ได้'),
    jsonb_build_object('label', 'เขียน test และรัน CI pipeline', 'detail', 'ใช้ AI ช่วยสร้าง test cases แต่ต้องตรวจว่า test จับ bug จริง ไม่ใช่แค่เพิ่ม coverage รัน CI pipeline ให้ผ่านก่อน merge'),
    jsonb_build_object('label', 'Deploy และ monitor ระบบ', 'detail', 'Push code ผ่าน CI/CD ดู error rate, latency บน Grafana หรือ CloudWatch อย่างน้อย 30 นาทีหลัง deploy')
  ),
  'source_refs', jsonb_build_array(4)
)
WHERE field_id = (SELECT id FROM public.radar_fields WHERE slug = 'software-engineer')
  AND kind = 'dayInLife';

-- 4. Fix risks — missing the biggest risk: junior hiring crisis
UPDATE public.radar_cards
SET content_th = jsonb_build_object(
  'eyebrow', 'ความเสี่ยง',
  'title', 'ความเสี่ยงสายนี้',
  'risks', jsonb_build_array(
    'ตำแหน่ง junior ลดลง 50% — บริษัทใช้ AI + senior แทนทีมใหญ่ เข้าสู่วงการยากขึ้นมาก',
    'คนไม่ใช่ dev สร้างแอปง่ายๆ ได้เอง (vibe coding) — งานบางประเภทหายไป',
    'เทคโนโลยีเปลี่ยนเร็วมาก ต้องเรียนรู้ตลอดเวลา ถ้าหยุดเรียนจะตกยุค',
    'Burnout จากการ on-call, deadline กดดัน และความคาดหวังที่สูงขึ้นเรื่อยๆ',
    'ถ้าไม่พัฒนา soft skills + system thinking อาจติดอยู่ระดับ mid-level นาน',
    'Ageism — บางบริษัทชอบจ้างคนรุ่นใหม่ที่เงินเดือนถูกกว่า'
  ),
  'source_refs', jsonb_build_array(4, 5, 9)
)
WHERE field_id = (SELECT id FROM public.radar_fields WHERE slug = 'software-engineer')
  AND kind = 'risks';

-- 5. Fix text/skills card — title said Software Engineer
UPDATE public.radar_cards
SET content_th = content_th || '{"title": "ต้องเก่งอะไรถึงเป็น Software Developer ได้จริง?"}'::jsonb
WHERE field_id = (SELECT id FROM public.radar_fields WHERE slug = 'software-engineer')
  AND kind = 'text'
  AND position = 125;

-- 6. Fix text/intro card — said วิศวกรซอฟต์แวร์
UPDATE public.radar_cards
SET content_th = jsonb_build_object(
  'eyebrow', 'สายนี้ทำอะไร?',
  'title', 'สร้างซอฟต์แวร์ที่ขับเคลื่อนโลก',
  'body', 'นักพัฒนาซอฟต์แวร์ออกแบบ พัฒนา และดูแลระบบซอฟต์แวร์ทุกรูปแบบ — ตั้งแต่แอปมือถือ เว็บไซต์ ระบบคลาวด์ ไปจนถึง AI ทำงานเป็นทีม แก้ปัญหาด้วยโค้ด และต้องปรับตัวกับ AI tools ใหม่ๆ ตลอดเวลา'
)
WHERE field_id = (SELECT id FROM public.radar_fields WHERE slug = 'software-engineer')
  AND kind = 'text'
  AND position = 130;

-- 7. Fix cta — said วิศวกร
UPDATE public.radar_cards
SET content_th = jsonb_build_object(
  'eyebrow', 'สนใจไหม?',
  'title', 'อยากลองสายนักพัฒนาซอฟต์แวร์',
  'body', 'ถ้าเธอสนใจสายนี้ กดปุ่มด้านล่างเพื่อบอกเราว่าอยากรู้เพิ่มเติม',
  'button', 'สนใจสายนี้'
)
WHERE field_id = (SELECT id FROM public.radar_fields WHERE slug = 'software-engineer')
  AND kind = 'cta';

-- 8. Fix sources — add missing refs [8,9], replace unverifiable Robert Walters with Levels.fyi
UPDATE public.radar_cards
SET content_th = jsonb_build_object(
  'eyebrow', 'Sources',
  'title', 'แหล่งข้อมูล',
  'items', jsonb_build_array(
    jsonb_build_object('ref', 1, 'title', 'Software Developers — O*NET OnLine', 'publisher', 'O*NET / BLS', 'url', 'https://www.onetonline.org/link/summary/15-1252.00'),
    jsonb_build_object('ref', 2, 'title', 'Software Engineer Salary in Thailand', 'publisher', 'JobsDB', 'url', 'https://th.jobsdb.com/career-advice/role/software-engineer/salary'),
    jsonb_build_object('ref', 3, 'title', 'Coding Bootcamp Statistics for 2026', 'publisher', 'Metana', 'url', 'https://metana.io/blog/coding-bootcamp-statistics-for-2026/'),
    jsonb_build_object('ref', 4, 'title', 'Stack Overflow Developer Survey 2024', 'publisher', 'Stack Overflow', 'url', 'https://survey.stackoverflow.co/2024/'),
    jsonb_build_object('ref', 5, 'title', 'WEF Future of Jobs Report 2025', 'publisher', 'World Economic Forum', 'url', 'https://www.weforum.org/publications/the-future-of-jobs-report-2025/'),
    jsonb_build_object('ref', 6, 'title', 'LinkedIn Thailand Talent Insights', 'publisher', 'LinkedIn', 'url', 'https://business.linkedin.com/talent-solutions/talent-insights'),
    jsonb_build_object('ref', 7, 'title', 'Levels.fyi SWE Level Framework', 'publisher', 'Levels.fyi', 'url', 'https://www.levels.fyi/blog/swe-level-framework.html'),
    jsonb_build_object('ref', 8, 'title', 'Software Engineer Compensation — Thailand', 'publisher', 'Levels.fyi', 'url', 'https://www.levels.fyi/t/software-engineer/locations/thailand'),
    jsonb_build_object('ref', 9, 'title', 'Junior Developer Crisis 2026: Why Hiring Dropped 50%', 'publisher', 'ARDURA Consulting', 'url', 'https://ardura.consulting/blog/junior-developer-crisis-2026-why-companies-stopped-hiring-entry-level/')
  )
)
WHERE field_id = (SELECT id FROM public.radar_fields WHERE slug = 'software-engineer')
  AND kind = 'sources';

-- 9. Fix tagline_th — was in English
UPDATE public.radar_fields
SET tagline_th = 'ทุกธุรกิจต้องใช้ซอฟต์แวร์ แต่ AI กำลังเปลี่ยนวงการ — ตำแหน่ง junior ลดลง คนที่ใช้ AI เป็นจะได้เปรียบ'
WHERE slug = 'software-engineer';
