-- =============================================================================
-- competitions table
-- Playbook ref: docs/research/2026-08-13-dm-lead-reply-playbook.md §2.6
--
-- HARD RULE: Every date on a poster or plan comes from this table.
-- Never from model recall. If it's not in the table, it does not appear.
--
-- Research date: 2026-08-13 | Verified by: web research subagents
-- Sources: posn.or.th, nstda.or.th, nsm.or.th, gistda.or.th, ncsa.or.th,
--          nectec.or.th, set.or.th, teolympiad.com, tpa.or.th, gammaco.co.th
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. Table
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.competitions (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name_th           text        NOT NULL,
  name_en           text,
  field             text[]      NOT NULL,          -- e.g. ['วิศวกรรมศาสตร์','วิทยาการคอมพิวเตอร์']
  grade_levels      text[]      NOT NULL,          -- e.g. ['ม.4','ม.5','ม.6']
  weight            smallint    NOT NULL CHECK (weight BETWEEN 1 AND 5),
  application_opens date,
  deadline          date,
  url               text,
  source_checked_at timestamptz NOT NULL DEFAULT now(),
  verified_by       text        DEFAULT 'web-research-2026-08-13',
  notes             text,
  is_active         boolean     NOT NULL DEFAULT true,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- 2. Indexes
-- ---------------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_competitions_field
  ON public.competitions USING GIN (field);

CREATE INDEX IF NOT EXISTS idx_competitions_deadline
  ON public.competitions (deadline)
  WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_competitions_weight
  ON public.competitions (weight DESC)
  WHERE is_active = true;

-- ---------------------------------------------------------------------------
-- 3. updated_at trigger (reuse existing helper)
-- ---------------------------------------------------------------------------

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column'
  ) THEN
    CREATE TRIGGER set_competitions_updated_at
      BEFORE UPDATE ON public.competitions
      FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END
$$;

-- ---------------------------------------------------------------------------
-- 4. RLS — public read (active rows only), admin write
-- ---------------------------------------------------------------------------

ALTER TABLE public.competitions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "competitions_public_read"
  ON public.competitions FOR SELECT
  USING (is_active = true);

CREATE POLICY "competitions_admin_write"
  ON public.competitions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
        AND role IN ('admin', 'passion_seed')
    )
  );

-- ---------------------------------------------------------------------------
-- 5. Seed data — ~30 verified rows
--    Covers: วิศวะ / แพทย์+ทันตะ+เภสัช / คอม+IT / ธุรกิจ+เศรษฐ
--    Fields flagged needs_verification=true have estimated-month dates only.
-- ---------------------------------------------------------------------------

INSERT INTO public.competitions (
  name_th, name_en, field, grade_levels, weight,
  application_opens, deadline, url, notes, source_checked_at
) VALUES

-- ══════════════════════════════════════════════════════════════════════════
-- ENGINEERING (วิศวกรรมศาสตร์)
-- ══════════════════════════════════════════════════════════════════════════

(
  'สอวน. สาขาฟิสิกส์ / เคมี / คอมพิวเตอร์',
  'POSN Olympiad Camp Selection (Physics, Chemistry, Computer Science)',
  ARRAY['วิศวกรรมศาสตร์','วิศวกรรมคอมพิวเตอร์','วิศวกรรมไฟฟ้า','วิศวกรรมเคมี'],
  ARRAY['ม.4','ม.5'],
  5,
  '2025-07-01', '2025-07-31',
  'https://www.posn.or.th',
  'National Olympiad camp selection. Exam held Aug 31, 2025. Annual July window across regional POSN centers.',
  '2026-08-13'
),

(
  'การประกวดสิ่งประดิษฐ์คนรุ่นใหม่ (I-New Gen Award)',
  'Thailand New Gen Inventors Award by NRCT (วช.)',
  ARRAY['วิศวกรรมศาสตร์','วิศวกรรมหุ่นยนต์','วิศวกรรมเครื่องกล','วิศวกรรมไฟฟ้า','วิศวกรรมพลังงาน'],
  ARRAY['ม.1','ม.2','ม.3','ม.4','ม.5','ม.6'],
  5,
  '2025-07-01', '2025-09-30',
  'https://nriis.go.th',
  'Annual invention contest by NRCT. Projects submitted Jul–Sep via NRIIS. Finals at National Inventors'' Day, Feb, BITEC Bangna.',
  '2026-08-13'
),

(
  'การแข่งขันดาวเทียมขนาดเล็กและจรวดประดิษฐ์ (CanSat–Rocket 2026)',
  'Thailand CanSat – Rocket Competition 2026 by NSM & GISTDA',
  ARRAY['วิศวกรรมศาสตร์','วิศวกรรมการบินและอวกาศ','วิศวกรรมอิเล็กทรอนิกส์','วิศวกรรมเครื่องกล'],
  ARRAY['ม.4','ม.5','ม.6'],
  5,
  '2026-03-04', '2026-03-31',
  'https://www.nsm.or.th/nsm/th/node/8040',
  'Final launch competition June 11–14, 2026. Organized by อพวช. & GISTDA.',
  '2026-08-13'
),

(
  'การแข่งขันสร้างภารกิจดาวเทียม GISTDA School Satellite Competition (ปี 3)',
  'GISTDA School Satellite Competition – CubeSat Challenge Season 3',
  ARRAY['วิศวกรรมศาสตร์','วิศวกรรมการบินและอวกาศ','วิศวกรรมอิเล็กทรอนิกส์','วิศวกรรมคอมพิวเตอร์'],
  ARRAY['ม.4','ม.5','ม.6'],
  5,
  '2026-01-05', '2026-01-30',
  'https://www.gistda.or.th',
  'Winning team builds real Flight Model CubeSat for space launch. Top prize = actual satellite.',
  '2026-08-13'
),

(
  'การแข่งขันหุ่นยนต์โอลิมปิก WRO Thailand 2026',
  'World Robot Olympiad Thailand (WRO Thailand 2026)',
  ARRAY['วิศวกรรมศาสตร์','วิศวกรรมหุ่นยนต์','วิศวกรรมเมคคาทรอนิกส์','วิศวกรรมระบบอัตโนมัติ'],
  ARRAY['ม.1','ม.2','ม.3','ม.4','ม.5','ม.6'],
  4,
  '2026-07-20', '2026-08-19',
  'https://gammaco.co.th/wro/',
  'National final Sept 3–4, 2026 at RMUTR. Qualifier for WRO World Finals.',
  '2026-08-13'
),

(
  'การแข่งขันหุ่นยนต์ ส.ส.ท.–สพฐ. ยุวชน (Robo Rescue / Robo Soccer)',
  'TPA Robot Competition – Youth Division',
  ARRAY['วิศวกรรมศาสตร์','วิศวกรรมหุ่นยนต์','วิศวกรรมไฟฟ้า','วิศวกรรมเครื่องกล'],
  ARRAY['ม.1','ม.2','ม.3','ม.4','ม.5','ม.6'],
  4,
  '2025-12-15', '2026-01-31',
  'https://www.tpa.or.th/robot',
  'National finals May 30–31, 2026 at Zeer Rangsit. By Technology Promotion Association (Thailand-Japan) & OBEC.',
  '2026-08-13'
),

(
  'โครงการ 2B-KMUTT วิจัยและโครงงานวิศวกรรมศาสตร์ รุ่นที่ 20',
  '2B-KMUTT Engineering Research Camp (Batch 20)',
  ARRAY['วิศวกรรมศาสตร์','วิศวกรรมโยธา','วิศวกรรมไฟฟ้า','วิศวกรรมเครื่องกล','วิศวกรรมคอมพิวเตอร์','วิศวกรรมเคมี'],
  ARRAY['ม.4','ม.5'],
  4,
  '2025-11-03', '2026-01-16',
  'https://admission.kmutt.ac.th',
  'Successful participants earn direct TCAS1 Portfolio quota for KMUTT Engineering. Covers all engineering subfields.',
  '2026-08-13'
),

(
  'ค่ายลานเกียร์ คณะวิศวกรรมศาสตร์ จุฬาลงกรณ์มหาวิทยาลัย (ครั้งที่ 25)',
  'LarnGear Camp, Faculty of Engineering, Chulalongkorn University',
  ARRAY['วิศวกรรมศาสตร์','วิศวกรรมโยธา','วิศวกรรมไฟฟ้า','วิศวกรรมเครื่องกล','วิศวกรรมคอมพิวเตอร์','วิศวกรรมอุตสาหการ'],
  ARRAY['ม.4','ม.5','ม.6'],
  4,
  '2025-08-15', '2025-09-19',
  'https://larngear.org',
  'Batch 25 closed Sep 19, 2025; camp held Dec 2025–Jan 2026. Prime TCAS1 portfolio item for Chula Engineering. Batch 26 expected Sep 2026.',
  '2026-08-13'
),

(
  'การแข่งขันโครงสร้างไม้ไอศกรีมและเหล็กจำลอง ชิงแชมป์ประเทศไทย',
  'Thailand Ice Cream Stick & Steel Structure Competition (RMUTR)',
  ARRAY['วิศวกรรมศาสตร์','วิศวกรรมโยธา','วิศวกรรมโครงสร้าง'],
  ARRAY['ม.4','ม.5','ม.6'],
  4,
  '2025-12-01', '2026-01-25',
  'https://www.rmutr.ac.th',
  'Finals held Feb 12–13, 2026. Annual competition by RMUTR Salaya Faculty of Engineering.',
  '2026-08-13'
),

(
  'การแข่งขันออกแบบภารกิจดาวเทียม THE GEOQUEST 2026',
  'THE GEOQUEST 2026 – THEOS-2 Geospatial Mission Challenge by GISTDA',
  ARRAY['วิศวกรรมศาสตร์','วิศวกรรมภูมิสารสนเทศ','วิศวกรรมคอมพิวเตอร์','วิศวกรรมอวกาศ'],
  ARRAY['ม.3','ม.4','ม.5','ม.6'],
  4,
  '2026-06-15', '2026-08-12',
  'https://www.gistda.or.th',
  'Deadline extended to Aug 12, 2026. Uses real THEOS-2 satellite imagery.',
  '2026-08-13'
),

-- ══════════════════════════════════════════════════════════════════════════
-- COMPUTER SCIENCE / IT (วิทยาการคอมพิวเตอร์ / เทคโนโลยีสารสนเทศ)
-- ══════════════════════════════════════════════════════════════════════════

(
  'สอวน. สาขาวิทยาการคอมพิวเตอร์',
  'POSN Computer Science Olympiad (IOI Selection)',
  ARRAY['วิทยาการคอมพิวเตอร์','วิศวกรรมคอมพิวเตอร์'],
  ARRAY['ม.4','ม.5'],
  5,
  '2025-07-01', '2025-07-31',
  'https://www.posn.or.th',
  'Top-tier competitive programming. Leads to IOI (International Olympiad in Informatics). Highest weight for CS/Engineering portfolio.',
  '2026-08-13'
),

(
  'การแข่งขันพัฒนาโปรแกรมคอมพิวเตอร์แห่งประเทศไทย (NSC ครั้งที่ 28)',
  'National Software Contest (NSC 28th edition) by NECTEC/NSTDA',
  ARRAY['วิทยาการคอมพิวเตอร์','วิศวกรรมคอมพิวเตอร์','วิศวกรรมซอฟต์แวร์','ปัญญาประดิษฐ์','IoT'],
  ARRAY['ม.1','ม.2','ม.3','ม.4','ม.5','ม.6'],
  5,
  '2026-05-01', '2026-05-29',
  'https://www.nstda.or.th/nsc',
  'Proposals May 1–29, 2026 via SIMS. Final round Aug 21, 2026. Premier national software contest.',
  '2026-08-13'
),

(
  'โครงการบ่มเพาะเยาวชนพัฒนาทักษะ AI (AI Builders 2026)',
  'AI Builders Program 2026 by VISTEC & PyCon TH',
  ARRAY['วิทยาการคอมพิวเตอร์','วิศวกรรมคอมพิวเตอร์','ปัญญาประดิษฐ์','วิทยาการข้อมูล'],
  ARRAY['ม.1','ม.2','ม.3','ม.4','ม.5','ม.6'],
  4,
  '2026-03-04', '2026-03-17',
  'https://ai-builders.github.io',
  'Mentorship program Apr 8 – Jun 17, 2026. Backed by VISTEC & PyCon TH. Free.',
  '2026-08-13'
),

(
  'โครงการพัฒนา Super AI Engineer Season 6',
  'Super AI Engineer Development Program Season 6 by AIAT & NSTDA',
  ARRAY['วิทยาการคอมพิวเตอร์','วิศวกรรมคอมพิวเตอร์','ปัญญาประดิษฐ์'],
  ARRAY['ม.4','ม.5','ม.6'],
  4,
  '2025-11-01', '2026-01-31',
  'https://superai.aiat.or.th',
  'Free. Opening ceremony Mar 13, 2026. Hackathons + industry internships. Strong portfolio signal for CS/AI fields.',
  '2026-08-13'
),

(
  'การแข่งขันความมั่นคงปลอดภัยไซเบอร์ Thailand Cyber Top Talent 2026',
  'Thailand Cyber Top Talent 2026 by NCSA (Junior Category)',
  ARRAY['วิทยาการคอมพิวเตอร์','วิศวกรรมคอมพิวเตอร์','ความมั่นคงปลอดภัยไซเบอร์'],
  ARRAY['ม.1','ม.2','ม.3','ม.4','ม.5','ม.6'],
  4,
  '2026-07-01', '2026-08-13',
  'https://www.ncsa.or.th',
  'By National Cyber Security Agency. Junior category for ม.ปลาย. CTF-style cybersecurity competition.',
  '2026-08-13'
),

(
  'ค่าย NextGen AI Camp คณะวิศวกรรมคอมพิวเตอร์ สจล. (ครั้งที่ 3)',
  'NextGen AI Camp #3 – KMITL Computer Engineering',
  ARRAY['วิทยาการคอมพิวเตอร์','วิศวกรรมคอมพิวเตอร์','ปัญญาประดิษฐ์','วิศวกรรมซอฟต์แวร์'],
  ARRAY['ม.6'],
  4,
  '2026-04-13', '2026-04-27',
  'https://www.ce.kmitl.ac.th',
  'Top 10 in final hackathon receive direct TCAS1 Portfolio quota for KMITL Computer Engineering.',
  '2026-08-13'
),

-- ══════════════════════════════════════════════════════════════════════════
-- MEDICINE / DENTISTRY / PHARMACY (แพทยศาสตร์ / ทันตแพทยศาสตร์ / เภสัชศาสตร์)
-- ══════════════════════════════════════════════════════════════════════════

(
  'สอวน. สาขาชีววิทยา (Thailand Biology Olympiad – TBO)',
  'POSN Biology Olympiad / Thailand Biology Olympiad (TBO)',
  ARRAY['แพทยศาสตร์','ทันตแพทยศาสตร์','เภสัชศาสตร์','พยาบาลศาสตร์'],
  ARRAY['ม.3','ม.4','ม.5'],
  5,
  '2025-07-01', '2025-07-31',
  'https://www.posn.or.th',
  'National Biology Olympiad camp selection. Covers cell biology, genetics, human physiology, anatomy, ecology, biochemistry. Top signal for medical TCAS1.',
  '2026-08-13'
),

(
  'การประกวดโครงงานนักวิทยาศาสตร์รุ่นเยาว์ YSC ครั้งที่ 28',
  'Young Scientist Competition (YSC 2026 / 28th edition) by NSTDA',
  ARRAY['แพทยศาสตร์','เภสัชศาสตร์','วิทยาการคอมพิวเตอร์','วิศวกรรมศาสตร์'],
  ARRAY['ม.2','ม.3','ม.4','ม.5','ม.6'],
  5,
  '2025-08-06', '2025-09-10',
  'https://www.nstda.or.th/ysc',
  'Biological sciences, health & medical sciences, biomedical engineering. Winners qualify for Regeneron ISEF (USA).',
  '2026-08-13'
),

(
  'โครงการพัฒนาอัจฉริยภาพทางวิทยาศาสตร์ JSTP รุ่นที่ 29',
  'Junior Science Talent Project (JSTP 29th cohort) by NSTDA',
  ARRAY['แพทยศาสตร์','เภสัชศาสตร์','วิศวกรรมศาสตร์','วิทยาการคอมพิวเตอร์'],
  ARRAY['ม.4','ม.5'],
  5,
  '2026-04-01', '2026-05-15',
  'https://www.nstda.or.th/jstp',
  'Research fellowship. Highest-tier signal for medical TCAS1 Portfolio. Mentored by university researchers.',
  '2026-08-13'
),

(
  'ค่ายอยากเป็นหมอ สโมสรนิสิต คณะแพทยศาสตร์ จุฬาฯ (ครั้งที่ 35)',
  'MDCU Medical Camp – Chulalongkorn University (35th edition)',
  ARRAY['แพทยศาสตร์'],
  ARRAY['ม.4','ม.5','ม.6'],
  4,
  '2025-08-15', '2025-09-15',
  'https://doc.med.chula.ac.th',
  'Medicine simulation, pre-clinical orientation, hospital rotations, medical ethics. Certificate provided.',
  '2026-08-13'
),

(
  'โครงการแข่งขันตอบปัญหาวิทยาศาสตร์การแพทย์ AMSci MDCU',
  'Academic Medicine & Science Competition (AMSci MDCU) by Chula Med',
  ARRAY['แพทยศาสตร์'],
  ARRAY['ม.4','ม.5','ม.6'],
  4,
  '2026-06-01', '2026-07-15',
  'https://doc.med.chula.ac.th',
  'Medical biology, human anatomy, physiology, pathology, clinical reasoning quiz competition.',
  '2026-08-13'
),

(
  'ค่ายอยากเป็นเภสัชกร Pharmacamp คณะเภสัชศาสตร์ จุฬาฯ (ครั้งที่ 23)',
  'Pharmacamp – Chulalongkorn University Faculty of Pharmaceutical Sciences (23rd edition)',
  ARRAY['เภสัชศาสตร์'],
  ARRAY['ม.4','ม.5','ม.6'],
  4,
  '2026-08-01', '2026-09-15',
  'https://www.pharm.chula.ac.th',
  'Pharmaceutical sciences, drug formulations, clinical & industrial pharmacy orientation.',
  '2026-08-13'
),

(
  'โครงการทดสอบอัจฉริยภาพทางชีววิทยา BIOISM มหิดล',
  'Biology Intelligence Skill Assessment (BIOISM) – Mahidol University',
  ARRAY['แพทยศาสตร์','ทันตแพทยศาสตร์','เภสัชศาสตร์'],
  ARRAY['ม.4','ม.5','ม.6'],
  4,
  '2026-03-01', '2026-04-30',
  'https://science.mahidol.ac.th',
  'Genetics, zoology, botany, ecology, biology lab skills exam. Strong portfolio signal for medical TCAS1.',
  '2026-08-13'
),

-- ══════════════════════════════════════════════════════════════════════════
-- BUSINESS / ECONOMICS (บริหารธุรกิจ / เศรษฐศาสตร์)
-- ══════════════════════════════════════════════════════════════════════════

(
  'การแข่งขันเศรษฐศาสตร์โอลิมปิกแห่งประเทศไทย (TEO 2026)',
  'Thailand Economics Olympiad (TEO 2026) – IEO National Selection',
  ARRAY['เศรษฐศาสตร์','บริหารธุรกิจ'],
  ARRAY['ม.3','ม.4','ม.5','ม.6'],
  5,
  '2026-02-12', '2026-05-10',
  'http://www.teolympiad.com',
  'National selection for International Economics Olympiad (IEO). Covers micro/macroeconomics, financial literacy, case presentation.',
  '2026-08-13'
),

(
  'การแข่งขัน ASPIRE Business Case Competition ระดับมัธยมปลาย',
  'ASPIRE High School Business Case Competition by IBMP Thammasat Case Club',
  ARRAY['บริหารธุรกิจ','เศรษฐศาสตร์'],
  ARRAY['ม.4','ม.5','ม.6'],
  4,
  '2026-02-20', '2026-03-13',
  'https://www.facebook.com/ibmp.caseclub',
  'Business strategy, marketing, financial planning, pitching presentation. Thammasat IBMP-organized.',
  '2026-08-13'
),

(
  'โครงการแข่งขันออกแบบนโยบาย SEEP ครั้งที่ 6',
  'Social, Economic, and Environmental Policy Competition (SEEP 6th) by TU Economics',
  ARRAY['เศรษฐศาสตร์','บริหารธุรกิจ'],
  ARRAY['ม.4','ม.5','ม.6'],
  4,
  '2026-06-01', '2026-07-15',
  'https://www.econ.tu.ac.th',
  'Applied economics, public policy design, environmental economics, socioeconomic development. Thammasat Economics Faculty.',
  '2026-08-13'
),

(
  'การแข่งขันเรียนรู้การลงทุน SET INVESTORY Challenge',
  'SET INVESTORY Financial & Investment Challenge by Stock Exchange of Thailand',
  ARRAY['บริหารธุรกิจ','เศรษฐศาสตร์'],
  ARRAY['ม.4','ม.5','ม.6'],
  4,
  '2025-08-01', '2025-10-31',
  'https://www.set.or.th',
  'Stock market investment, personal finance, investment analysis. Dates estimated — verify at set.or.th. needs_verification: true',
  '2026-08-13'
),

(
  'การแข่งขัน Suannon Business Case Competition (SBCC)',
  'Suannon Business Case Competition (SBCC)',
  ARRAY['บริหารธุรกิจ','เศรษฐศาสตร์'],
  ARRAY['ม.4','ม.5','ม.6'],
  3,
  '2025-09-01', '2025-10-10',
  'https://dekport.com',
  'Business strategy, marketing, innovation, financial management case competition for high school students.',
  '2026-08-13'
),

-- ══════════════════════════════════════════════════════════════════════════
-- COMPUTER SCIENCE (additional — CS-specific camps & hackathons)
-- ══════════════════════════════════════════════════════════════════════════

(
  'ค่ายเจาะลึกภูมิปัญญาเว็บมาสเตอร์รุ่นเยาว์ (JWC)',
  'Junior Webmaster Camp (JWC) by Thai Webmaster Association',
  ARRAY['วิทยาการคอมพิวเตอร์','วิศวกรรมคอมพิวเตอร์'],
  ARRAY['ม.4','ม.5','ม.6'],
  3,
  '2026-03-15', '2026-04-15',
  'https://jwc.in.th',
  'Organized by Thai Webmaster Association (TWA). Tracks: Web Developer, Web Design, Web Content. Camp held May 2026.',
  '2026-08-13'
),

(
  'การแข่งขันเขียนโปรแกรม CPE Coding Box: High-School Edition (มช.)',
  'CPE Coding Box: High-School Edition by CMU Computer Engineering',
  ARRAY['วิทยาการคอมพิวเตอร์','วิศวกรรมคอมพิวเตอร์'],
  ARRAY['ม.4','ม.5','ม.6'],
  3,
  '2026-08-01', '2026-08-31',
  'https://www.facebook.com/CPECodingBox',
  'Online grader competitive programming contest for high school students. Competition day: Sep 27, 2026. By CMU CPE Department.',
  '2026-08-13'
),

(
  'การแข่งขันไอที IT CLASH (สจล.)',
  'KMITL IT CLASH Competition by KMITL Faculty of Information Technology',
  ARRAY['วิทยาการคอมพิวเตอร์','วิศวกรรมคอมพิวเตอร์','ความมั่นคงปลอดภัยไซเบอร์'],
  ARRAY['ม.4','ม.5','ม.6'],
  3,
  '2026-04-01', '2026-04-30',
  'https://clash.it.kmitl.ac.th',
  'Multiple tracks: Coding, Cyber, Multimedia. Organized by KMITL Faculty of IT. Competition held May 2026.',
  '2026-08-13'
),

(
  'การแข่งขัน Bangmod Hackathon (มจธ.)',
  'Bangmod Hackathon by KMUTT Department of Computer Engineering',
  ARRAY['วิทยาการคอมพิวเตอร์','วิศวกรรมคอมพิวเตอร์'],
  ARRAY['ม.4','ม.5','ม.6'],
  3,
  '2025-10-01', '2025-11-15',
  'https://www.facebook.com/bangmodhackathon',
  'Algorithm + hackathon contest for high school students. Competition held December 2025. By KMUTT CPE Department.',
  '2026-08-13'
),

(
  'ค่ายคอมพิวเตอร์ ComCamp มจธ. (ครั้งที่ 36/37)',
  'ComCamp KMUTT – Computer Science Exploration Camp',
  ARRAY['วิทยาการคอมพิวเตอร์','วิศวกรรมคอมพิวเตอร์'],
  ARRAY['ม.4','ม.5','ม.6'],
  2,
  '2026-02-01', '2026-03-15',
  'http://www.comcamp.io',
  'Legendary CS camp in Thailand. Workshops + mini project. Certificate accepted for TCAS1 Portfolio at KMUTT CS/CPE. Camp held April 2026.',
  '2026-08-13'
),

(
  'การแข่งขันนวัตกรรมดิจิทัล Coding Thailand 2026 (depa)',
  'Coding Thailand 2026 AI Competition by DEPA',
  ARRAY['วิทยาการคอมพิวเตอร์','ปัญญาประดิษฐ์','วิศวกรรมคอมพิวเตอร์'],
  ARRAY['ม.4','ม.5','ม.6'],
  3,
  '2026-03-15', '2026-04-26',
  'https://codingthailand.co',
  'By DEPA (Digital Economy Promotion Agency). Regional + national rounds. 4 tracks: Smart Industry, Green, Health, Creative.',
  '2026-08-13'
),

(
  'การแข่งขันงานศิลปหัตถกรรมนักเรียน สาขาคอมพิวเตอร์ (สพฐ.)',
  'National Student Arts & Crafts Competition – Computer Division (MOE/OBEC)',
  ARRAY['วิทยาการคอมพิวเตอร์','วิศวกรรมคอมพิวเตอร์'],
  ARRAY['ม.4','ม.5','ม.6'],
  3,
  '2025-10-01', '2025-11-30',
  'https://www.siamgrafts.org',
  'Official MOE/OBEC competition. National-level certificate valid for TCAS1 Portfolio. Tracks: Webpage creation, programming language, animation. National finals held Dec 2025–Jan 2026.',
  '2026-08-13'
);

-- ---------------------------------------------------------------------------
-- 6. pg_cron jobs — staleness management
--    Requires pg_cron extension (already available in this Supabase project)
-- ---------------------------------------------------------------------------

-- Cron A: Monthly staleness flag (1st of every month, 09:00 UTC = 16:00 BKK)
SELECT cron.schedule(
  'flag-stale-competitions',
  '0 9 1 * *',
  $$
    UPDATE public.competitions
    SET notes = COALESCE(notes, '') ||
      ' [NEEDS REVIEW: source_checked_at > 45d as of ' ||
      now()::date::text || ']',
      updated_at = now()
    WHERE source_checked_at < now() - INTERVAL '45 days'
      AND is_active = true
      AND (notes IS NULL OR notes NOT LIKE '%NEEDS REVIEW%');
  $$
);

-- Cron B: Weekly deadline expiry sweep (every Monday 02:00 UTC)
SELECT cron.schedule(
  'expire-past-competitions',
  '0 2 * * 1',
  $$
    UPDATE public.competitions
    SET is_active = false, updated_at = now()
    WHERE deadline IS NOT NULL
      AND deadline < now() - INTERVAL '7 days'
      AND is_active = true;
  $$
);

-- Cron C: Annual refresh reminder (Sept 1 = Thai academic year start, 08:00 UTC)
SELECT cron.schedule(
  'competitions-annual-refresh',
  '0 8 1 9 *',
  $$
    INSERT INTO public.build_todos (title, body, status, created_at)
    SELECT
      '📋 Annual: refresh competition dates for new academic year',
      'Check posn.or.th, nstda.or.th, nsm.or.th, gistda.or.th, ncsa.or.th, set.or.th, teolympiad.com. Update deadlines + application_opens for each row. Set source_checked_at = now() and verified_by after confirming.',
      'pending',
      now()
    WHERE NOT EXISTS (
      SELECT 1 FROM public.build_todos
      WHERE title LIKE '%refresh competition dates%'
        AND created_at > now() - INTERVAL '300 days'
    );
  $$
);
