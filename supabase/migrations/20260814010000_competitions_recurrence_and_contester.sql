-- =============================================================================
-- competitions: add recurrence_pattern + contester_url columns,
-- backfill values on existing rows, add contester.life rows
--
-- Separated from 20260813210000 because:
--   1. 20260813210000 was already applied to remote before these columns existed
--   2. contester.life rows are lower-weight supplementary competitions (weight 3)
--      and need a different source_checked_at
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 0. Add the new columns (idempotent — safe to re-run)
-- ---------------------------------------------------------------------------

ALTER TABLE public.competitions
  ADD COLUMN IF NOT EXISTS recurrence_pattern text,
  ADD COLUMN IF NOT EXISTS contester_url      text;

COMMENT ON COLUMN public.competitions.recurrence_pattern IS
  'When to check source for next batch. Format: ''annual-<month>'' | ''biannual'' | NULL (one-off)';
COMMENT ON COLUMN public.competitions.contester_url IS
  'contester.life listing URL for this competition, if available';

-- ---------------------------------------------------------------------------
-- 1. Backfill recurrence_pattern for existing rows
-- ---------------------------------------------------------------------------


-- Annual July competitions (สอวน., I-New Gen)
UPDATE public.competitions
SET recurrence_pattern = 'annual-july'
WHERE name_th IN (
  'สอวน. สาขาฟิสิกส์ / เคมี / คอมพิวเตอร์',
  'สอวน. สาขาวิทยาการคอมพิวเตอร์',
  'สอวน. สาขาชีววิทยา (Thailand Biology Olympiad – TBO)',
  'การประกวดสิ่งประดิษฐ์คนรุ่นใหม่ (I-New Gen Award)'
);

-- Annual August competitions (YSC, LarnGear, MDCU camp, Pharmacamp)
UPDATE public.competitions
SET recurrence_pattern = 'annual-august'
WHERE name_th IN (
  'การประกวดโครงงานนักวิทยาศาสตร์รุ่นเยาว์ YSC ครั้งที่ 28',
  'ค่ายลานเกียร์ คณะวิศวกรรมศาสตร์ จุฬาลงกรณ์มหาวิทยาลัย (ครั้งที่ 25)',
  'ค่ายอยากเป็นหมอ สโมสรนิสิต คณะแพทยศาสตร์ จุฬาฯ (ครั้งที่ 35)',
  'ค่ายอยากเป็นเภสัชกร Pharmacamp คณะเภสัชศาสตร์ จุฬาฯ (ครั้งที่ 23)',
  'การแข่งขันความมั่นคงปลอดภัยไซเบอร์ Thailand Cyber Top Talent 2026',
  'การแข่งขัน Bangmod Hackathon (มจธ.)',
  'การแข่งขันไอที IT CLASH (สจล.)',
  'การแข่งขันนวัตกรรมดิจิทัล Coding Thailand 2026 (depa)',
  'ค่ายเจาะลึกภูมิปัญญาเว็บมาสเตอร์รุ่นเยาว์ (JWC)',
  'การแข่งขันเขียนโปรแกรม CPE Coding Box: High-School Edition (มช.)'
);

-- Annual October/November (WRO, งานศิลปหัตถกรรม, FTC Thailand)
UPDATE public.competitions
SET recurrence_pattern = 'annual-october'
WHERE name_th IN (
  'การแข่งขันงานศิลปหัตถกรรมนักเรียน สาขาคอมพิวเตอร์ (สพฐ.)'
);

-- Annual November / December (TPA Robot, 2B-KMUTT, Super AI, Steel Structure)
UPDATE public.competitions
SET recurrence_pattern = 'annual-november'
WHERE name_th IN (
  'การแข่งขันหุ่นยนต์ ส.ส.ท.–สพฐ. ยุวชน (Robo Rescue / Robo Soccer)',
  'โครงการ 2B-KMUTT วิจัยและโครงงานวิศวกรรมศาสตร์ รุ่นที่ 20',
  'โครงการพัฒนา Super AI Engineer Season 6',
  'การแข่งขันโครงสร้างไม้ไอศกรีมและเหล็กจำลอง ชิงแชมป์ประเทศไทย'
);

-- Annual February/March
UPDATE public.competitions
SET recurrence_pattern = 'annual-february'
WHERE name_th IN (
  'ค่ายคอมพิวเตอร์ ComCamp มจธ. (ครั้งที่ 36/37)',
  'การแข่งขัน ASPIRE Business Case Competition ระดับมัธยมปลาย',
  'การแข่งขันเศรษฐศาสตร์โอลิมปิกแห่งประเทศไทย (TEO 2026)'
);

-- Annual March
UPDATE public.competitions
SET recurrence_pattern = 'annual-march'
WHERE name_th IN (
  'โครงการบ่มเพาะเยาวชนพัฒนาทักษะ AI (AI Builders 2026)',
  'โครงการทดสอบอัจฉริยภาพทางชีววิทยา BIOISM มหิดล',
  'การแข่งขันนวัตกรรมดิจิทัล Coding Thailand 2026 (depa)'
);

-- Annual January
UPDATE public.competitions
SET recurrence_pattern = 'annual-january'
WHERE name_th IN (
  'การแข่งขันสร้างภารกิจดาวเทียม GISTDA School Satellite Competition (ปี 3)',
  'การแข่งขันดาวเทียมขนาดเล็กและจรวดประดิษฐ์ (CanSat–Rocket 2026)'
);

-- Annual April
UPDATE public.competitions
SET recurrence_pattern = 'annual-april'
WHERE name_th IN (
  'โครงการพัฒนาอัจฉริยภาพทางวิทยาศาสตร์ JSTP รุ่นที่ 29',
  'ค่าย NextGen AI Camp คณะวิศวกรรมคอมพิวเตอร์ สจล. (ครั้งที่ 3)'
);

-- Annual May
UPDATE public.competitions
SET recurrence_pattern = 'annual-may'
WHERE name_th IN (
  'การแข่งขันพัฒนาโปรแกรมคอมพิวเตอร์แห่งประเทศไทย (NSC ครั้งที่ 28)'
);

-- Annual June
UPDATE public.competitions
SET recurrence_pattern = 'annual-june'
WHERE name_th IN (
  'โครงการแข่งขันตอบปัญหาวิชาการและวิทยาศาสตร์การแพทย์ AMSci MDCU',
  'โครงการแข่งขันออกแบบนโยบาย SEEP ครั้งที่ 6'
);

-- Annual July–August (WRO cycle)
UPDATE public.competitions
SET recurrence_pattern = 'annual-july'
WHERE name_th IN (
  'การแข่งขันหุ่นยนต์โอลิมปิก WRO Thailand 2026'
);

-- ---------------------------------------------------------------------------
-- 2. New rows from contester.life (source_checked_at = 2026-08-14)
--    All weight 3 — supplementary, not olympiad-tier
--    recurrence_pattern = NULL for one-off events or unknown repeat schedule
-- ---------------------------------------------------------------------------

INSERT INTO public.competitions (
  name_th, name_en, field, grade_levels, weight,
  application_opens, deadline, recurrence_pattern, url, contester_url, notes, source_checked_at, verified_by
) VALUES

(
  'UniHack 2026 (ยูนิแฮก)',
  'UniHack 2026 by Chula CSII',
  ARRAY['บริหารธุรกิจ','วิทยาการคอมพิวเตอร์','วิศวกรรมศาสตร์'],
  ARRAY['ม.4','ม.5','ม.6'],
  3,
  '2026-08-10', '2026-08-21',
  'annual-august',
  'https://chulatechstartup.com',
  'https://contester.life/',
  '48-hour business & tech hackathon by Chula CSII. No coding required. Certificate from CSII + internship opportunities. Prize pool 30,000 THB.',
  '2026-08-14',
  'contester.life-2026-08-14'
),

(
  'Techstars Startup Weekend เตรียมอุดมศึกษา',
  'Techstars Startup Weekend Triamudom',
  ARRAY['บริหารธุรกิจ','วิทยาการคอมพิวเตอร์'],
  ARRAY['ม.4','ม.5','ม.6'],
  3,
  '2026-08-01', '2026-08-21',
  NULL,
  'https://forms.gle/QJhPy2YL7QBaRyyH6',
  'https://contester.life/',
  '54-hour startup hackathon at Triam Udom Suksa School. Aug 21–23, 2026. Free. Pitching Day on Aug 23. Prize pool 20,000 THB.',
  '2026-08-14',
  'contester.life-2026-08-14'
),

(
  'Thailand Metaverse Hackathon and Exhibition 2026',
  'Thailand Metaverse Hackathon and Exhibition 2026',
  ARRAY['วิศวกรรมศาสตร์','วิทยาการคอมพิวเตอร์'],
  ARRAY['ม.4','ม.5','ม.6'],
  3,
  NULL, '2026-03-13',
  'annual-february',
  'https://contester.life/',
  'https://contester.life/?q=วิศวะ',
  '2nd annual Metaverse competition by Chula Electrical Engineering & IntaniaVerse. Theme: Metaverse for Society. Past deadline — check 2027 cycle.',
  '2026-08-14',
  'contester.life-2026-08-14'
),

(
  'THAILAND SCI-FI HACKATHON 2026',
  'Thailand Sci-Fi Hackathon 2026 by CIA CreativeLab & Harbour.Space@UTCC',
  ARRAY['วิทยาการคอมพิวเตอร์','วิศวกรรมศาสตร์'],
  ARRAY['ม.4','ม.5','ม.6'],
  3,
  NULL, '2026-02-15',
  'annual-february',
  'https://contester.life/',
  'https://contester.life/?q=hackathon',
  'Sci-Fi synopsis + tech hackathon. Past deadline — check 2027 cycle.',
  '2026-08-14',
  'contester.life-2026-08-14'
),

(
  'Casecalator Business Case Competition',
  'Casecalator Business Case Competition',
  ARRAY['บริหารธุรกิจ','เศรษฐศาสตร์'],
  ARRAY['ม.4','ม.5','ม.6'],
  3,
  NULL, NULL,
  NULL,
  'https://contester.life/',
  'https://contester.life/?q=ธุรกิจ',
  'Business case competition solving real corporate problems. Open to high school and university students. Dates TBC — check contester.life.',
  '2026-08-14',
  'contester.life-2026-08-14'
),

(
  'IFP 2026 — Innovation & Future Problem-Solving',
  'Innovation & Future Problem-Solving Project (IFP 2026)',
  ARRAY['วิศวกรรมศาสตร์','วิทยาการคอมพิวเตอร์','บริหารธุรกิจ'],
  ARRAY['ม.4','ม.5'],
  3,
  NULL, NULL,
  NULL,
  'https://contester.life/',
  'https://contester.life/?q=มัธยม',
  'Youth innovation program for ม.1-ม.5 to design solutions for youth and community problems. Dates TBC — check contester.life.',
  '2026-08-14',
  'contester.life-2026-08-14'
);

-- ---------------------------------------------------------------------------
-- 3. Improved Cron B — creates a specific per-competition build_todo
--    when an annual competition expires, instead of just flipping is_active
-- ---------------------------------------------------------------------------

-- Drop old version first
SELECT cron.unschedule('expire-past-competitions');

-- Re-register with build_todos INSERT
SELECT cron.schedule(
  'expire-past-competitions',
  '0 2 * * 1',   -- Every Monday 02:00 UTC
  $$
    -- Insert a build_todo for each annual competition about to be expired
    INSERT INTO public.build_todos (title, body, status, created_at)
    SELECT
      '🔁 Re-verify: ' || name_th,
      'Competition expired (deadline was ' || deadline::text || '). recurrence_pattern: ' ||
        COALESCE(recurrence_pattern, 'unknown') || '. Source: ' || COALESCE(url, '?') ||
        '. Update deadline + application_opens for next cycle, set source_checked_at = now().',
      'pending',
      now()
    FROM public.competitions
    WHERE deadline < now() - INTERVAL '7 days'
      AND is_active = true
      AND recurrence_pattern IS NOT NULL   -- only annual ones worth tracking
      AND NOT EXISTS (
        SELECT 1 FROM public.build_todos bt
        WHERE bt.title LIKE '🔁 Re-verify: ' || name_th
          AND bt.created_at > now() - INTERVAL '300 days'
      );

    -- Then expire them
    UPDATE public.competitions
    SET is_active = false, updated_at = now()
    WHERE deadline IS NOT NULL
      AND deadline < now() - INTERVAL '7 days'
      AND is_active = true;
  $$
);
