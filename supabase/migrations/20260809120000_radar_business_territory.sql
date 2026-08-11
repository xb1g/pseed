-- Radar business territory: "ธุรกิจทำเงินยังไง"
--
-- Pilot for the Territory -> Profession -> Skill -> PathLab shape.
--
-- A territory is a radar_collection key. A profession is a radar_field carrying
-- that key in tags[]. Discovery copy (reveal / fantasy / reality) lives in
-- radar_fields.research->'territory' so no new tables and no CHECK-constraint
-- changes are needed; the legacy card renderer ignores that key entirely.
--
-- Professions here deliberately carry NO radar_cards. They are 30-second
-- discovery units, not encyclopedia entries. Day-in-life / salary / entry-route
-- depth belongs in the paid PathLab, not in a free browse surface.
--
-- Prod-first safe: additive, idempotent, re-runnable.

-- ── territory (collection) ───────────────────────────────────────────────────
INSERT INTO radar_collections (key, label_th, label_en, sort_order, is_active)
VALUES ('business-how-money-works', 'ธุรกิจทำเงินยังไง', 'How Business Makes Money', 10, true)
ON CONFLICT (key) DO UPDATE
  SET label_th  = excluded.label_th,
      label_en  = excluded.label_en,
      sort_order = excluded.sort_order,
      is_active = excluded.is_active;

-- ── professions ──────────────────────────────────────────────────────────────
WITH profession(
  slug, name_th, name_en, tagline_th, tagline_en, emoji, color, sort_order, territory
) AS (
  VALUES
  (
    'category-manager', 'ผู้จัดการหมวดสินค้า', 'Category Manager',
    'คนที่เลือกว่าอะไรได้อยู่บนชั้น', 'Decides what earns a place on the shelf',
    '🏪', '#f59e0b', 101,
    jsonb_build_object(
      'reveal_th', 'ของทุกชิ้นในเซเว่นมีคนเลือกให้มันอยู่ตรงนั้น ไม่ใช่ของมันขึ้นชั้นเอง',
      'fantasy_th', 'นั่งชิมขนมใหม่ทั้งวัน แล้วเลือกอันที่ตัวเองชอบ',
      'reality_th', 'งานจริงคือตัดสินใจว่าจะ "เอาอะไรออก" เพราะชั้นมีพื้นที่จำกัด แล้วรับสายจากคนที่ของโดนถอด',
      'sits_th', 'อยู่ระหว่างคนผลิตกับคนซื้อ ตัดสินใจแทนร้านว่าจะขายอะไร'
    )
  ),
  (
    'pricing-analyst', 'นักวิเคราะห์ราคา', 'Pricing Analyst',
    'คนที่งานทั้งงานคือตัวเลขบนป้าย', 'Their whole job is the number on the tag',
    '🏷️', '#fb923c', 102,
    jsonb_build_object(
      'reveal_th', 'มีคนที่งานทั้งงานคือตัดสินใจว่าจะติดป้าย 39 หรือ 45 บาท',
      'fantasy_th', 'ตั้งราคาให้แพงที่สุดเท่าที่บริษัทจะกล้า',
      'reality_th', 'ขยับสองบาทแล้วดูว่าคนซื้อหายไปกี่เปอร์เซ็นต์ เดาผิดทีเดียวทั้งบริษัทเห็น',
      'sits_th', 'อยู่ตรงจุดที่ "คนยอมจ่ายเท่าไหร่" เจอกับ "ต้นทุนเท่าไหร่"'
    )
  ),
  (
    'demand-planner', 'นักวางแผนอุปสงค์', 'Demand Planner',
    'คนที่ต้องเดาอนาคตเป็นจำนวนชิ้น', 'Guesses the future, in units',
    '📦', '#fbbf24', 103,
    jsonb_build_object(
      'reveal_th', 'มีคนต้องเดาว่าเดือนหน้าคนจะซื้อกี่ชิ้น ก่อนที่จะมีใครซื้อสักชิ้น',
      'fantasy_th', 'ดูกราฟสวยๆ แล้วกดปุ่มสั่งของ',
      'reality_th', 'เดามากไปคือโกดังเต็มของค้าง เดาน้อยไปคือชั้นว่างและลูกค้าเปลี่ยนไปใช้ยี่ห้ออื่นถาวร',
      'sits_th', 'อยู่ต้นน้ำสุดของทุกอย่าง ผิดตรงนี้แล้วทุกทีมข้างหลังผิดตาม'
    )
  ),
  (
    'trade-marketer', 'เทรดมาร์เก็ตติ้ง', 'Trade Marketer',
    'คนที่ซื้อพื้นที่สายตาในร้าน', 'Buys the spot your eyes land on',
    '🎯', '#f97316', 104,
    jsonb_build_object(
      'reveal_th', 'หัวชั้นที่ของวางเด่นๆ ตอนคุณเดินเข้าร้าน ไม่ได้มาฟรี มีคนจ่ายเงินเพื่อตำแหน่งนั้น',
      'fantasy_th', 'คิดโปรโมชั่นสนุกๆ ให้คนตื่นเต้น',
      'reality_th', 'ต่อรองกับห้างว่าจ่ายเท่าไหร่ได้ตรงไหน แล้วต้องพิสูจน์ด้วยตัวเลขว่าที่จ่ายไปคุ้ม',
      'sits_th', 'อยู่ระหว่างแบรนด์กับร้านค้า เป็นคนถือกระเป๋าเงินไปคุย'
    )
  ),
  (
    'growth-marketer', 'โกรทมาร์เก็ตเตอร์', 'Growth Marketer',
    'ซื้อความสนใจด้วยคณิตศาสตร์', 'Buys attention with math',
    '📈', '#facc15', 105,
    jsonb_build_object(
      'reveal_th', 'งานนี้ไม่ได้แข่งกันคิดไอเดียเจ๋ง แต่แข่งกันว่าใครยอมทิ้งไอเดียตัวเองได้เร็วกว่า',
      'fantasy_th', 'ทำคลิปหนึ่งอันให้ไวรัล แล้วทั้งบริษัทรอด',
      'reality_th', 'รันโฆษณายี่สิบเวอร์ชั่นพร้อมกัน ปิดสิบแปดอันที่แพ้ภายในสามวัน รวมอันที่ตัวเองภูมิใจที่สุด',
      'sits_th', 'อยู่ปากทางเข้า หน้าที่คือพาคนแปลกหน้ามาเจอของ'
    )
  ),
  (
    'partnerships-bd', 'พาร์ตเนอร์ชิป / BD', 'Partnerships & BD',
    'ทำดีลที่ฝ่ายเดียวทำไม่ได้', 'Makes deals neither side could do alone',
    '🤝', '#fdba74', 106,
    jsonb_build_object(
      'reveal_th', 'มีอาชีพที่ผลงานทั้งปีคือ "ดีลสามอัน" และนั่นถือว่าปีที่ดีมาก',
      'fantasy_th', 'กินข้าวกับผู้บริหาร จับมือ เซ็นสัญญา',
      'reality_th', 'ตามอีเมลหกเดือนเพื่อหาว่า ใครในองค์กรนั้นมีอำนาจตัดสินใจจริง แล้วเริ่มใหม่เมื่อคนนั้นลาออก',
      'sits_th', 'อยู่นอกบริษัท ทำงานกับคนที่ไม่ได้เงินเดือนจากที่เดียวกับคุณ'
    )
  ),
  (
    'retention-specialist', 'คนกันลูกค้าหาย', 'Retention Specialist',
    'รักษาเงินที่กำลังจะเดินออก', 'Keeps the money from walking out',
    '🔁', '#fcd34d', 107,
    jsonb_build_object(
      'reveal_th', 'บริษัทส่วนใหญ่เสียเงินจากคนที่เลิกใช้ มากกว่าที่ได้จากคนใหม่ และมีคนทำงานนี้เต็มเวลา',
      'fantasy_th', 'โทรไปถามลูกค้าว่าใช้แล้วเป็นยังไงบ้าง',
      'reality_th', 'หาให้เจอว่าคนหายไปตอนวันที่เท่าไหร่ของการใช้งาน แล้วแก้ตรงนั้นก่อนที่เขาจะรู้ตัวว่าเบื่อ',
      'sits_th', 'อยู่ปลายทาง ดูแลคนที่จ่ายเงินไปแล้ว ซึ่งเป็นคนที่ทุกคนลืม'
    )
  ),
  (
    'brand-strategist', 'นักวางกลยุทธ์แบรนด์', 'Brand Strategist',
    'ตัดสินใจว่าบริษัทแปลว่าอะไร', 'Decides what the company means',
    '🎭', '#fb923c', 108,
    jsonb_build_object(
      'reveal_th', 'มีคนตัดสินใจว่าบริษัทนี้ "แปลว่าอะไร" ในหัวคน แล้วอีกห้าร้อยคนทำงานตามคำตอบนั้น',
      'fantasy_th', 'เลือกสี เลือกฟอนต์ ออกแบบโลโก้',
      'reality_th', 'เขียนประโยคเดียวที่คนทั้งบริษัทต้องตอบตรงกัน แล้วปกป้องมันในห้องประชุมทุกไตรมาส',
      'sits_th', 'อยู่เหนือทุกทีม เพราะทุกทีมต้องพูดเรื่องเดียวกัน'
    )
  ),
  (
    'startup-founder', 'ผู้ก่อตั้ง', 'Founder',
    'แปดงานข้างบน คนเดียว ไม่มีเงินเดือน', 'All eight jobs, one person, unpaid',
    '🔥', '#f43f5e', 109,
    jsonb_build_object(
      'is_composite', true,
      'reveal_th', 'วันแรกของบริษัท ทั้งแปดงานข้างบนคือคนคนเดียว ทำได้ห่วยทั้งแปดอย่าง และยังไม่มีเงินเดือน',
      'fantasy_th', 'ขึ้นเวที พิตช์ ได้เงินลงทุน มีคนเรียกว่า CEO',
      'reality_th', 'ยังไม่มีใครจ่ายเงินให้คุณ จนกว่าจะมีคนจ่าย "ผู้ก่อตั้ง" ไม่ใช่ตำแหน่ง มันคือสภาพที่ไม่มีใครทำแปดงานนี้แทนคุณ',
      'sits_th', 'ไม่ได้อยู่ตรงไหนเลย เพราะยังไม่มีโครงสร้างให้อยู่ นั่นคือทั้งข้อดีและข้อเสีย'
    )
  )
)
INSERT INTO radar_fields (
  slug, name_th, name_en, tagline_th, tagline_en, emoji, color,
  tile_size, tags, is_published, has_content, sort_order, research
)
SELECT
  p.slug, p.name_th, p.name_en, p.tagline_th, p.tagline_en, p.emoji, p.color,
  CASE WHEN p.slug = 'startup-founder' THEN 'lg' ELSE 'md' END,
  ARRAY['business-how-money-works', 'business'],
  true,
  true,
  p.sort_order,
  jsonb_build_object(
    'territory',
    p.territory || jsonb_build_object('collection', 'business-how-money-works')
  )
FROM profession AS p
ON CONFLICT (slug) DO UPDATE
  SET name_th     = excluded.name_th,
      name_en     = excluded.name_en,
      tagline_th  = excluded.tagline_th,
      tagline_en  = excluded.tagline_en,
      emoji       = excluded.emoji,
      color       = excluded.color,
      tile_size   = excluded.tile_size,
      tags        = excluded.tags,
      is_published = excluded.is_published,
      has_content = excluded.has_content,
      sort_order  = excluded.sort_order,
      -- merge, never clobber: existing research (metrics/tier) must survive
      research    = COALESCE(radar_fields.research, '{}'::jsonb) || excluded.research;

-- ── skill spine ──────────────────────────────────────────────────────────────
WITH skill(slug, name_th, name_en, description_th, description_en) AS (
  VALUES
  ('demand-judgment', 'อ่านว่าคนอยากได้อะไร', 'Demand Judgment',
   'เดาความต้องการคนก่อนที่เขาจะบอกออกมา แล้ววัดว่าเดาถูกไหม',
   'Read what people want before they say it, then check whether you were right'),
  ('negotiation', 'การต่อรอง', 'Negotiation',
   'ตกลงกันให้ได้ ทั้งที่สองฝ่ายอยากได้คนละอย่าง',
   'Reach agreement when both sides want different things'),
  ('quantitative-reasoning', 'คิดเป็นตัวเลข', 'Quantitative Reasoning',
   'แปลงคำถามธุรกิจให้เป็นเลขที่ตอบได้ แล้วรู้ว่าเลขไหนเชื่อไม่ได้',
   'Turn a business question into a number, and know which numbers lie'),
  ('experimentation', 'ทดลองแล้ววัดผล', 'Experimentation',
   'ตั้งสมมติฐาน ทดลองให้เล็กและเร็ว ยอมรับผลแม้จะไม่ชอบ',
   'Hypothesise, test small and fast, accept the result you did not want'),
  ('storytelling', 'เล่าให้คนเชื่อ', 'Storytelling',
   'ทำให้คนที่ไม่มีเวลาฟัง เข้าใจและตัดสินใจได้',
   'Make someone with no time understand, and decide')
)
INSERT INTO radar_skills (namespace, slug, name_th, name_en, description_th, description_en, is_published)
SELECT 'career', s.slug, s.name_th, s.name_en, s.description_th, s.description_en, true
FROM skill AS s
ON CONFLICT (namespace, slug) DO UPDATE
  SET name_th        = excluded.name_th,
      name_en        = excluded.name_en,
      description_th = excluded.description_th,
      description_en = excluded.description_en,
      is_published   = excluded.is_published;

-- ── profession -> skill ──────────────────────────────────────────────────────
WITH link(field_slug, skill_slug, is_primary, sort_order) AS (
  VALUES
  ('category-manager',     'demand-judgment',        true,  0),
  ('category-manager',     'negotiation',            false, 1),
  ('pricing-analyst',      'quantitative-reasoning', true,  0),
  ('pricing-analyst',      'demand-judgment',        false, 1),
  ('demand-planner',       'quantitative-reasoning', true,  0),
  ('demand-planner',       'demand-judgment',        false, 1),
  ('trade-marketer',       'negotiation',            true,  0),
  ('trade-marketer',       'quantitative-reasoning', false, 1),
  ('growth-marketer',      'experimentation',        true,  0),
  ('growth-marketer',      'quantitative-reasoning', false, 1),
  ('partnerships-bd',      'storytelling',           true,  0),
  ('partnerships-bd',      'negotiation',            false, 1),
  ('retention-specialist', 'demand-judgment',        true,  0),
  ('retention-specialist', 'experimentation',        false, 1),
  ('brand-strategist',     'storytelling',           true,  0),
  ('brand-strategist',     'demand-judgment',        false, 1),
  ('startup-founder',      'demand-judgment',        true,  0),
  ('startup-founder',      'experimentation',        true,  1),
  ('startup-founder',      'storytelling',           false, 2),
  ('startup-founder',      'negotiation',            false, 3),
  ('startup-founder',      'quantitative-reasoning', false, 4)
)
INSERT INTO radar_field_skills (field_id, skill_id, sort_order, is_primary)
SELECT f.id, s.id, l.sort_order, l.is_primary
FROM link AS l
JOIN radar_fields AS f ON f.slug = l.field_slug
JOIN radar_skills AS s ON s.slug = l.skill_slug AND s.namespace = 'career'
ON CONFLICT (field_id, skill_id) DO UPDATE
  SET sort_order = excluded.sort_order,
      is_primary = excluded.is_primary;

-- ── skill -> other professions (the unknown-unknown hop) ─────────────────────
WITH hop(skill_slug, field_slug, sort_order, note_th) AS (
  VALUES
  ('demand-judgment', 'category-manager',     0, 'ทายว่าคนจะหยิบอะไรจากชั้น ก่อนสั่งของเข้า'),
  ('demand-judgment', 'retention-specialist', 1, 'ทายว่าคนจะเบื่อตอนไหน ก่อนที่เขาจะเบื่อ'),
  ('demand-judgment', 'pricing-analyst',      2, 'ทายว่าที่ราคาเท่านี้ คนจะยังซื้ออยู่ไหม'),
  ('demand-judgment', 'brand-strategist',     3, 'ทายว่าคนอยากให้ตัวเองดูเป็นแบบไหน เวลาถือของยี่ห้อนี้'),
  ('negotiation', 'trade-marketer',       0, 'ต่อรองพื้นที่ในร้านกับห้าง'),
  ('negotiation', 'category-manager',     1, 'ต่อรองราคาและเงื่อนไขกับคนผลิต'),
  ('negotiation', 'partnerships-bd',      2, 'ต่อรองดีลที่ไม่มีราคาตลาดให้อ้างอิง'),
  ('quantitative-reasoning', 'pricing-analyst', 0, 'หาว่าขยับราคาเท่าไหร่แล้วกำไรรวมสูงสุด'),
  ('quantitative-reasoning', 'demand-planner',  1, 'พยากรณ์จำนวนชิ้นล่วงหน้าเป็นเดือน'),
  ('quantitative-reasoning', 'growth-marketer', 2, 'คำนวณว่าจ่ายค่าโฆษณาต่อลูกค้าหนึ่งคนได้เท่าไหร่'),
  ('experimentation', 'growth-marketer',      0, 'รันโฆษณาหลายเวอร์ชั่นพร้อมกันแล้วตัดตัวที่แพ้'),
  ('experimentation', 'retention-specialist', 1, 'ลองเปลี่ยนจังหวะที่ทักลูกค้า แล้ววัดว่าคนอยู่นานขึ้นไหม'),
  ('experimentation', 'startup-founder',      2, 'ทั้งบริษัทคือการทดลองที่ยังไม่รู้คำตอบ'),
  ('storytelling', 'brand-strategist', 0, 'เล่าว่าบริษัทนี้คือใคร ให้ทุกคนเล่าตามได้'),
  ('storytelling', 'partnerships-bd',  1, 'เล่าให้อีกบริษัทเห็นว่าร่วมมือกันแล้วเขาได้อะไร'),
  ('storytelling', 'startup-founder',  2, 'เล่าให้คนมาร่วมทีม ทั้งที่ยังไม่มีอะไรให้ดู')
)
INSERT INTO radar_skill_jobs (skill_id, field_id, sort_order, relevance_note_th)
SELECT s.id, f.id, h.sort_order, h.note_th
FROM hop AS h
JOIN radar_skills AS s ON s.slug = h.skill_slug AND s.namespace = 'career'
JOIN radar_fields AS f ON f.slug = h.field_slug
ON CONFLICT (skill_id, field_id) DO UPDATE
  SET sort_order        = excluded.sort_order,
      relevance_note_th = excluded.relevance_note_th;

-- ── PathLab terminus ─────────────────────────────────────────────────────────
-- The territory page dedupes these by destination, so one row per skill in the
-- spine renders as a single "start here" card covering the whole territory.
INSERT INTO radar_skill_start_options (
  skill_id, kind, title_th, summary_th, provider, destination_ref, metadata, sort_order, is_published
)
SELECT
  s.id,
  'pathlab',
  'Startup PathLab: ห้าวัน ลองทำแปดงานนี้จริง',
  'ลงมือทำงานจริงของแต่ละบทบาทวันละอย่าง จบแล้วเลือกว่าจะเริ่มจากอันไหน',
  'PassionSeed',
  '/curriculum/pathlab/startup',
  jsonb_build_object('territory', 'business-how-money-works', 'duration', '5 วัน'),
  0,
  true
FROM radar_skills AS s
WHERE s.namespace = 'career'
  AND s.slug IN (
    'demand-judgment', 'negotiation', 'quantitative-reasoning',
    'experimentation', 'storytelling'
  )
  AND NOT EXISTS (
    SELECT 1 FROM radar_skill_start_options AS existing
    WHERE existing.skill_id = s.id
      AND existing.kind = 'pathlab'
      AND existing.destination_ref = '/curriculum/pathlab/startup'
  );
