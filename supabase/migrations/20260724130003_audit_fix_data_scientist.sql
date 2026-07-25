-- Audit fix: Data Scientist (round 1)
-- Major issues:
--   1. Salary card in USD — convert to THB with levels_thb
--   2. grad_employment_pct=80 fabricated → 67 (NC State MSA at-graduation rate)
--   3. salary_ceiling=170K → 150K (JobsDB P90=114K, senior at top firms ~130-150K)
--   4. demand_growth=9 → 8 (34% US growth, Thailand 31% AI total)
--   5. Missing realPeople card, broken text cards
--   6. Dead sources [1] BLS 403, [3] Robert Walters 403
--   7. openings "1,000+" → "~800" (JobsDB: 810)
--   8. Non-integer job_access scores
--   Score: (8/10 + 67/100 + (1-5/10) + (1-5/10))/4*10 = (0.8+0.67+0.5+0.5)/4*10 = 6.175 → 6

-- 1. Fix field metrics and score
UPDATE public.radar_fields
SET
  research = jsonb_set(
    jsonb_set(
      jsonb_set(research,
        '{metrics,demand_growth}', '8'),
        '{metrics,grad_employment_pct}', '67'),
        '{metrics,salary_ceiling}', '150000'
      ),
  score = 6
WHERE slug = 'data-scientist';

-- 2. Fix sources card: replace dead [1] BLS and [3] Robert Walters
UPDATE public.radar_cards
SET content_th = jsonb_set(
  content_th,
  '{items}',
  (
    SELECT jsonb_agg(
      CASE
        WHEN (item->>'ref')::int = 1 THEN jsonb_build_object(
          'ref', 1,
          'title', 'Data Scientists — O*NET OnLine',
          'publisher', 'O*NET / BLS',
          'url', 'https://www.onetonline.org/link/summary/15-2051.00'
        )
        WHEN (item->>'ref')::int = 3 THEN jsonb_build_object(
          'ref', 3,
          'title', 'Data Scientist Salary in Thailand 2026',
          'publisher', 'Glassdoor',
          'url', 'https://www.glassdoor.com/Salaries/bangkok-thailand-data-scientist-salary-SRCH_IL.0,16_IM1119_KO17,31.htm'
        )
        ELSE item
      END
    )
    FROM jsonb_array_elements(content_th->'items') AS item
  )
)
WHERE field_id = (SELECT id FROM public.radar_fields WHERE slug = 'data-scientist')
  AND kind = 'sources';

-- 3. Fix salary card — add levels_thb for Thai Baht toggle
UPDATE public.radar_cards
SET content_th = content_th || '{
  "eyebrow_thb": "เงินเดือน (ไทย)",
  "title_thb": "ยิ่งเก่ง ยิ่งได้",
  "levels_thb": [
    {
      "level": "Junior Data Analyst",
      "years": "0-2",
      "salary": "25,000-40,000฿",
      "note": "เริ่มจากทำ dashboard, SQL query, ช่วย senior วิเคราะห์ — ต้องมี Python + SQL พื้นฐาน"
    },
    {
      "level": "Data Scientist",
      "years": "2-5",
      "salary": "45,000-80,000฿",
      "note": "สร้าง model เอง ทำ A/B test, feature engineering — ต้องมี stats + ML จริง"
    },
    {
      "level": "Senior Data Scientist",
      "years": "5-8",
      "salary": "80,000-120,000฿",
      "note": "Lead โปรเจค end-to-end ตัดสินใจ methodology เป็น mentor ให้ทีม"
    },
    {
      "level": "Staff / Principal DS",
      "years": "8+",
      "salary": "120,000-150,000+฿",
      "note": "กำหนด data strategy ระดับบริษัท ตัดสินใจว่าจะลงทุน ML ตรงไหน"
    }
  ]
}'::jsonb
WHERE field_id = (SELECT id FROM public.radar_fields WHERE slug = 'data-scientist')
  AND kind = 'salaryProgression';

-- 4. Fix marketThailand — openings and integer scores
UPDATE public.radar_cards
SET content_th = jsonb_set(
  jsonb_set(
    jsonb_set(
      jsonb_set(
        jsonb_set(content_th,
          '{openings}', '"~800 ตำแหน่ง (JobsDB, Jul 2026)"'),
          '{job_access,demand_score}', '8'),
          '{job_access,competition_score}', '7'),
          '{job_access,entry_barrier_score}', '7'),
          '{job_access,score}', '50'
        )
WHERE field_id = (SELECT id FROM public.radar_fields WHERE slug = 'data-scientist')
  AND kind = 'marketThailand';

-- 5. Add realPeople card (pos 100)
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
        "background": "จบ Statistics/Math แล้วเรียน Python + ML เพิ่มเอง เริ่มจาก Data Analyst ทำ dashboard ใน Power BI ก่อนจะย้ายไปเป็น DS เต็มตัว",
        "role": "Data Scientist (ปีที่ 3)",
        "nowDoing": "สร้าง churn prediction model ให้ทีม marketing ใช้ AutoML ช่วยแต่ยังต้อง feature engineer เอง",
        "whereHeading": "ตั้งเป้า Senior DS — ต้องเก่ง communication กับ business stakeholders มากขึ้น",
        "advice": "อย่าติดกับแค่ tool — Python, R, Spark จะเปลี่ยน แต่ statistical thinking กับ business sense อยู่ตลอด",
        "publisher": "Composite from BLS/365 Data Science career data",
        "url": "https://365datascience.com/career-advice/data-scientist-job-market/"
      }
    ],
    "source_refs": [4, 7]
  }'::jsonb
FROM public.radar_fields
WHERE slug = 'data-scientist'
ON CONFLICT DO NOTHING;

-- 6. Fix text card pos 125 — body → structured skills[]
UPDATE public.radar_cards
SET content_th = '{
  "presentation": "skills",
  "eyebrow": "ทักษะที่ใช้จริง",
  "title": "งานนี้ต้องใช้ทักษะอะไรบ้าง?",
  "skills": [
    {
      "title": "Statistical Thinking",
      "description": "เลือก hypothesis test ที่ถูกต้อง ประเมิน significance, effect size, confounders — ไม่ใช่แค่รัน p-value"
    },
    {
      "title": "SQL + Data Wrangling",
      "description": "ดึงข้อมูลจาก warehouse ด้วย SQL ซับซ้อน ทำความสะอาด missing values, outliers, join หลาย table"
    },
    {
      "title": "Machine Learning",
      "description": "เลือก algorithm ที่เหมาะกับปัญหา (classification, regression, clustering) tune hyperparameters ประเมิน overfitting"
    },
    {
      "title": "Python / R Programming",
      "description": "เขียน pandas, scikit-learn, PyTorch ได้คล่อง สร้าง reproducible pipeline ไม่ใช่แค่ notebook ที่รันครั้งเดียว"
    },
    {
      "title": "Feature Engineering",
      "description": "สร้าง features ใหม่จากข้อมูลดิบที่ทำให้ model แม่นขึ้น — ทักษะนี้ AutoML ยังทำแทนได้ยาก"
    },
    {
      "title": "Data Visualization + Storytelling",
      "description": "สร้าง chart ที่ตอบคำถามธุรกิจได้ชัด นำเสนอ insight ให้คนไม่มี technical background เข้าใจ"
    },
    {
      "title": "Experiment Design (A/B Testing)",
      "description": "ออกแบบ experiment ที่ valid กำหนด sample size, control group, metrics ก่อนรัน — ไม่ใช่ดู data แล้วสรุปย้อนหลัง"
    },
    {
      "title": "Business Acumen",
      "description": "ตั้งคำถามที่ถูกก่อนสร้าง model ถาม business ว่าจะเอา output ไปทำอะไร แล้ว scope งานให้ตรง"
    }
  ],
  "source_refs": [1, 7]
}'::jsonb
WHERE field_id = (SELECT id FROM public.radar_fields WHERE slug = 'data-scientist')
  AND kind = 'text'
  AND position = 125;

-- 7. Fix text card pos 130 — body → structured options[] with startCarousel
UPDATE public.radar_cards
SET content_th = '{
  "presentation": "startCarousel",
  "eyebrow": "เริ่มลงมือ",
  "title": "ไม่ต้องรอจบมหาวิทยาลัย",
  "options": [
    {
      "type": "คอร์ส",
      "title": "Google Data Analytics Certificate",
      "description": "เรียน data analytics ตั้งแต่ศูนย์ ครอบคลุม SQL, spreadsheet, Tableau, R — ได้ certificate จาก Google",
      "url": "https://www.coursera.org/professional-certificates/google-data-analytics",
      "duration": "6 เดือน",
      "cost": "ฟรี (audit) / $49/mo",
      "cta": "สนใจวิธีนี้"
    },
    {
      "type": "ลองทำ",
      "title": "Kaggle Competitions",
      "description": "ลองแก้โจทย์ data science จริง เริ่มจาก Titanic dataset แล้วค่อยขยับไป featured competitions",
      "url": "https://www.kaggle.com/competitions",
      "duration": "ต่อเนื่อง",
      "cost": "ฟรี",
      "cta": "อยากลองโจทย์นี้"
    },
    {
      "type": "YouTube",
      "title": "StatQuest with Josh Starmer",
      "description": "สอน statistics + ML ด้วยภาษาง่ายๆ มี animation ช่วยเข้าใจ — พื้นฐานที่ DS ทุกคนต้องมี",
      "url": "https://www.youtube.com/@statquest",
      "duration": "ดูเรื่อยๆ",
      "cost": "ฟรี",
      "cta": "สนใจวิธีนี้"
    },
    {
      "type": "ลองทำ",
      "title": "วิเคราะห์ข้อมูลที่สนใจด้วย Python",
      "description": "หาข้อมูลที่สนใจ (เช่น ราคาหอพัก อาหาร หนัง) ทำ EDA ด้วย pandas + matplotlib แล้ว publish บน GitHub",
      "duration": "2-4 สัปดาห์",
      "cost": "ฟรี",
      "cta": "อยากลองโจทย์นี้"
    }
  ],
  "source_refs": [1]
}'::jsonb
WHERE field_id = (SELECT id FROM public.radar_fields WHERE slug = 'data-scientist')
  AND kind = 'text'
  AND position = 130;
