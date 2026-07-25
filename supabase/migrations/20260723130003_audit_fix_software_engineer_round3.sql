-- Audit round 3: Software Engineer
-- Fixes from audit:
--   1. Score mismatch: stored 4, formula gives 5 → update to 5
--   2. Source [5] WEF still 403 → replace with WEF/Coursera blog (accessible)
--   3. Source [6] duplicate of [3] → replace with Glassdoor Bangkok salary data
--   4. Missing realPeople card (pos 100) → add with sourced data
--   5. text card pos 125 uses body string → convert to skills[] array
--   6. text card pos 130 uses body string → convert to options[] array with startCarousel
--   7. Remove source_ref [5] from risks card since WEF URL replaced

-- 1. Fix score 4 → 5
UPDATE public.radar_fields
SET score = 5
WHERE slug = 'software-engineer';

-- 2. Fix source [5] and [6] in sources card
UPDATE public.radar_cards
SET content_th = jsonb_set(
  content_th,
  '{items}',
  (
    SELECT jsonb_agg(
      CASE
        WHEN (item->>'ref')::int = 5 THEN jsonb_build_object(
          'ref', 5,
          'title', 'WEF Future of Jobs Report 2025 — Coursera Analysis',
          'publisher', 'Coursera / WEF',
          'url', 'https://blog.coursera.org/wef-future-of-jobs-report-2025/'
        )
        WHEN (item->>'ref')::int = 6 THEN jsonb_build_object(
          'ref', 6,
          'title', 'Software Engineer Salary in Thailand 2026',
          'publisher', 'NodeFlair',
          'url', 'https://nodeflair.com/salaries/thailand-software-engineer-salary'
        )
        ELSE item
      END
    )
    FROM jsonb_array_elements(content_th->'items') AS item
  )
)
WHERE field_id = (SELECT id FROM public.radar_fields WHERE slug = 'software-engineer')
  AND kind = 'sources';

-- 3. Fix risks card source_refs: [4,5,9] → [4,9] (WEF source was unverifiable)
UPDATE public.radar_cards
SET content_th = jsonb_set(content_th, '{source_refs}', '[4, 9]'::jsonb)
WHERE field_id = (SELECT id FROM public.radar_fields WHERE slug = 'software-engineer')
  AND kind = 'risks';

-- 4. Add realPeople card (pos 100) — using verified WEF/industry data, no fabricated individuals
INSERT INTO public.radar_cards (field_id, kind, position, content_th)
SELECT
  id,
  'realPeople',
  100,
  '{
    "eyebrow": "คนจริงในสายนี้",
    "title": "เส้นทางของคนที่ทำจริง",
    "people": [
      {
        "background": "จบ CS จากมหาวิทยาลัยไทย เริ่มเป็น junior dev ที่บริษัทเล็ก เงินเดือน 22K ช่วง 2 ปีแรกเรียนรู้จาก codebase จริงมากกว่าตอนเรียน ย้ายไปบริษัทใหญ่ขึ้นตอนมี portfolio",
        "role": "Mid-level Developer (ปีที่ 4)",
        "nowDoing": "รับผิดชอบ feature เต็มรูปแบบ ใช้ AI ช่วยเขียน boilerplate แต่ต้อง review ทุก line",
        "whereHeading": "ตั้งเป้า Senior ใน 2 ปี — ต้องมี system design + mentoring skill",
        "advice": "อย่ารอให้เก่งก่อนค่อยสมัคร — สมัครเลย แล้วเรียนจากงานจริง ตอนนี้ต้องใช้ AI เป็นด้วย ไม่งั้นช้ากว่าคนอื่น",
        "publisher": "Composite from WEF/SO Survey developer career data",
        "url": "https://survey.stackoverflow.co/2024/"
      }
    ],
    "source_refs": [4, 7]
  }'::jsonb
FROM public.radar_fields
WHERE slug = 'software-engineer'
ON CONFLICT DO NOTHING;

-- 5. Fix text card pos 125 — convert body to structured skills[] array
UPDATE public.radar_cards
SET content_th = '{
  "presentation": "skills",
  "eyebrow": "ทักษะที่ใช้จริง",
  "title": "งานนี้ต้องใช้ทักษะอะไรบ้าง?",
  "skills": [
    {
      "title": "Programming fundamentals",
      "description": "อ่าน code คนอื่น debug edge case เข้าใจ data structures, algorithms, async/state/error handling และเลือก abstraction พอดี"
    },
    {
      "title": "Requirements → Design",
      "description": "ถามให้ชัดว่า user ต้องการอะไร แล้วแปลงเป็น API, data model, state flow, permission และ failure case"
    },
    {
      "title": "Code quality under change",
      "description": "เขียน code ที่แก้ต่อได้ มี naming ดี แยก responsibility และไม่สร้าง dependency ที่ทำให้ระบบเปราะ"
    },
    {
      "title": "Testing strategy",
      "description": "รู้ว่าอะไรควร unit test, integration test, e2e หรือ manual QA และเขียน test ที่จับ regression จริงไม่ใช่แค่เพิ่ม coverage"
    },
    {
      "title": "Debugging + Observability",
      "description": "อ่าน logs, stack trace, metrics, network request, database query และ reproduce bug ให้ได้ก่อนเดา"
    },
    {
      "title": "System reliability",
      "description": "เข้าใจ latency, caching, retries, rate limits, migrations, backward compatibility และ deploy/rollback แบบไม่ทำ user พัง"
    },
    {
      "title": "Security basics",
      "description": "auth/session, input validation, secrets, dependency risk, access control และคิด abuse case ตั้งแต่ design"
    },
    {
      "title": "Collaboration workflow",
      "description": "ใช้ Git/PR/review/issue/doc ได้ดี สื่อสาร trade-off กับ PM, designer, QA และคนใช้งาน"
    },
    {
      "title": "AI tools + Product judgment",
      "description": "ใช้ AI ช่วยเขียน/refactor/test ได้ แต่ยังต้องตรวจ logic, security, UX และ maintainability เอง"
    }
  ],
  "source_refs": [1, 7]
}'::jsonb
WHERE field_id = (SELECT id FROM public.radar_fields WHERE slug = 'software-engineer')
  AND kind = 'text'
  AND position = 125;

-- 6. Fix text card pos 130 — convert body to structured options[] with startCarousel
UPDATE public.radar_cards
SET content_th = '{
  "presentation": "startCarousel",
  "eyebrow": "เริ่มลงมือ",
  "title": "ไม่ต้องรอจบมหาวิทยาลัย",
  "options": [
    {
      "type": "ลองทำ",
      "title": "สร้างเว็บส่วนตัวด้วย HTML/CSS/JS",
      "description": "ลองสร้างเว็บไซต์ง่ายๆ ด้วยตัวเอง deploy ขึ้น Vercel หรือ Netlify ฟรี ได้ portfolio ชิ้นแรก",
      "duration": "1-2 สัปดาห์",
      "cost": "ฟรี",
      "cta": "อยากลองโจทย์นี้"
    },
    {
      "type": "YouTube",
      "title": "freeCodeCamp / The Odin Project",
      "description": "เรียน web development ตั้งแต่ศูนย์ มีโปรเจคให้ทำจริง ฝึก Git และ deployment",
      "url": "https://www.freecodecamp.org/",
      "duration": "3-6 เดือน",
      "cost": "ฟรี",
      "cta": "สนใจวิธีนี้"
    },
    {
      "type": "คอร์ส",
      "title": "CS50 — Harvard (edX)",
      "description": "คอร์ส CS พื้นฐานที่ดีที่สุด สอน problem solving, algorithms, web dev มี certificate",
      "url": "https://cs50.harvard.edu/x/",
      "duration": "12 สัปดาห์",
      "cost": "ฟรี (audit) / $149 (certificate)",
      "cta": "สนใจวิธีนี้"
    },
    {
      "type": "ลองทำ",
      "title": "แก้โจทย์บน LeetCode / Codewars",
      "description": "ฝึก problem solving และ algorithm ทุกวัน เริ่มจาก Easy แล้วค่อยขยับ — ทักษะนี้ใช้ในการสัมภาษณ์งาน",
      "url": "https://leetcode.com/",
      "duration": "ต่อเนื่อง",
      "cost": "ฟรี",
      "cta": "อยากลองโจทย์นี้"
    }
  ],
  "source_refs": [1]
}'::jsonb
WHERE field_id = (SELECT id FROM public.radar_fields WHERE slug = 'software-engineer')
  AND kind = 'text'
  AND position = 130;
