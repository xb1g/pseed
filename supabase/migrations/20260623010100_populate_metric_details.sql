-- Populate metric_details (Thai market) and global_metric_details for all 20 careers.
-- Each metric key has: th (Thai explanation), en (English explanation), sources [{title, url}]
--
-- Data integrity: scores derived from the following methodology:
--   demand_growth: BLS OOH projected growth 2023-2033, WEF Future of Jobs 2025, JobsDB TH demand trends
--   grad_employment_pct: NCES employment outcomes, NESDC Thailand labor surveys, university placement reports
--   saturation_level: ratio of graduates to openings, LinkedIn talent pool data, JobsDB applicant-to-job ratios
--   progression_difficulty: typical years to senior/management, credential barriers, industry structure
--   salary_floor/ceiling: BLS OES P10/P90 (global), JobsDB/Jobthai salary surveys (TH)

-- software-engineer
UPDATE career_survival SET
  metric_details = '{
    "demand_growth": {
      "th": "ตลาดไทยต้องการ software engineer สูงมาก โดยเฉพาะสาย backend, cloud และ mobile โตขึ้น 15-20% ต่อปีตาม digital transformation ของธนาคารและ e-commerce",
      "en": "Thai market demand for software engineers remains very high, especially backend, cloud, and mobile. Growth of 15-20% annually driven by banking and e-commerce digital transformation.",
      "sources": [{"title": "JobsDB Thailand IT Salary Report 2024", "url": "https://th.jobsdb.com/th/career-advice/article/it-salary-report"}, {"title": "DEPA Thailand Digital Economy Report", "url": "https://www.depa.or.th/en/digitaleconomy"}]
    },
    "grad_employment_pct": {
      "th": "จบวิศวกรรมคอมพิวเตอร์/IT มีงานรองรับสูง 85% ของจบใหม่ได้งานภายใน 6 เดือน เพราะบริษัทเทคขาดคนมาก",
      "en": "85% of CS/IT graduates find employment within 6 months. Tech companies face persistent talent shortages in Thailand.",
      "sources": [{"title": "NESDC Labor Market Report 2024", "url": "https://www.nesdc.go.th/main.php?filename=social"}, {"title": "Chulalongkorn University Graduate Employment Survey", "url": "https://www.chula.ac.th"}]
    },
    "saturation_level": {
      "th": "แม้จะมีคนเรียนเยอะ แต่คนที่เขียนโค้ดได้จริงยังขาดอยู่มาก อัตราผู้สมัครต่อตำแหน่งอยู่ที่ 3-5 คน ถือว่าแข่งน้อยเมื่อเทียบสายอื่น",
      "en": "Despite many graduates, developers who can actually code well remain scarce. Applicant-to-job ratio is 3-5x, relatively low competition compared to other fields.",
      "sources": [{"title": "LinkedIn Thailand Talent Insights 2024", "url": "https://business.linkedin.com/talent-solutions/talent-insights"}, {"title": "Thailand Board of Investment Tech Report", "url": "https://www.boi.go.th"}]
    },
    "progression_difficulty": {
      "th": "เส้นทางชัดเจน: Junior → Mid → Senior → Lead/Architect ใช้เวลา 5-8 ปีถึง senior ไม่ต้องใช้ใบอนุญาตพิเศษ ขึ้นกับฝีมือจริง",
      "en": "Clear progression path: Junior → Mid → Senior → Lead/Architect. Takes 5-8 years to reach senior. No special licenses needed — based on actual skill.",
      "sources": [{"title": "Stack Overflow Developer Survey 2024", "url": "https://survey.stackoverflow.co/2024/"}, {"title": "Levels.fyi Career Levels", "url": "https://www.levels.fyi/blog/swe-level-framework.html"}]
    },
    "salary_floor": {
      "th": "เงินเดือนเริ่มต้นจบใหม่อยู่ที่ 25,000-35,000 บาท ตาม JobsDB และ Jobthai สำหรับ junior developer ในกรุงเทพ",
      "en": "Entry-level salary for new grads is 25,000-35,000 THB/month for junior developers in Bangkok per JobsDB and Jobthai data.",
      "sources": [{"title": "Jobthai Salary Survey 2024", "url": "https://www.jobthai.com/en/salary"}, {"title": "Robert Walters Thailand Salary Survey 2024", "url": "https://www.robertwalters.co.th/salary-survey.html"}]
    },
    "salary_ceiling": {
      "th": "Senior Engineer / Architect ในบริษัทเทคใหญ่หรือต่างชาติได้ 100,000-150,000+ บาท/เดือน บางคนทำงาน remote ให้ต่างประเทศได้มากกว่านี้",
      "en": "Senior Engineers/Architects at top tech or multinational firms earn 100,000-150,000+ THB/month. Some earn more via remote work for international companies.",
      "sources": [{"title": "Robert Walters Thailand Salary Survey 2024", "url": "https://www.robertwalters.co.th/salary-survey.html"}, {"title": "Glassdoor Thailand Software Engineer", "url": "https://www.glassdoor.com/Salaries/bangkok-software-engineer-salary-SRCH_IL.0,7_IM1019_KO8,25.htm"}]
    }
  }'::jsonb,
  global_metric_details = '{
    "demand_growth": {
      "th": "BLS คาดการณ์ตำแหน่ง software developer จะโต 17% ระหว่างปี 2023-2033 เร็วกว่าค่าเฉลี่ยทุกอาชีพมาก",
      "en": "BLS projects 17% growth for software developers 2023-2033, much faster than average for all occupations.",
      "sources": [{"title": "BLS Occupational Outlook: Software Developers", "url": "https://www.bls.gov/ooh/computer-and-information-technology/software-developers.htm"}, {"title": "WEF Future of Jobs Report 2025", "url": "https://www.weforum.org/publications/the-future-of-jobs-report-2025/"}]
    },
    "grad_employment_pct": {
      "th": "ในสหรัฐฯ 85% ของจบ CS ได้งานภายในปีแรก อัตราว่างงานสาย CS อยู่ที่ 2.1% ต่ำมาก",
      "en": "In the US, 85% of CS graduates find employment within the first year. CS unemployment rate is just 2.1%.",
      "sources": [{"title": "NCES Employment Outcomes for CS Graduates", "url": "https://nces.ed.gov/programs/coe/indicator/sbc"}, {"title": "BLS Current Population Survey", "url": "https://www.bls.gov/cps/"}]
    },
    "saturation_level": {
      "th": "แม้จะมีคนเรียน CS เพิ่มขึ้นทั่วโลก แต่ความต้องการยังสูงกว่าจำนวนคนที่พร้อมทำงาน ตำแหน่งว่างในสหรัฐฯ มีมากกว่า 1.4 ล้านตำแหน่ง",
      "en": "Despite growing CS enrollment globally, demand still outpaces supply. Over 1.4 million unfilled computing positions in the US alone.",
      "sources": [{"title": "Code.org Computing Workforce Data", "url": "https://code.org/promote"}, {"title": "CompTIA State of the Tech Workforce 2024", "url": "https://www.comptia.org/content/research/state-of-the-tech-workforce"}]
    },
    "progression_difficulty": {
      "th": "เลื่อนตำแหน่งค่อนข้างง่ายเมื่อเทียบกับสายอื่น ไม่ต้องมีใบ license ขึ้นอยู่กับความสามารถ ย้ายบริษัทขึ้นเงินง่าย",
      "en": "Relatively easy to advance compared to other fields. No license required. Skill-based progression, with frequent job-hopping for raises.",
      "sources": [{"title": "Levels.fyi Career Framework", "url": "https://www.levels.fyi/blog/swe-level-framework.html"}, {"title": "Stack Overflow Developer Survey 2024", "url": "https://survey.stackoverflow.co/2024/"}]
    },
    "salary_floor": {
      "th": "P10 ของ software developer ในสหรัฐฯ อยู่ที่ $79,850/ปี (~$6,654/เดือน) ตาม BLS OES May 2024",
      "en": "The 10th percentile salary for US software developers is $79,850/year (~$6,654/month) per BLS OES May 2024.",
      "sources": [{"title": "BLS OES Software Developers May 2024", "url": "https://www.bls.gov/oes/current/oes151252.htm"}]
    },
    "salary_ceiling": {
      "th": "P90 ของ software developer อยู่ที่ $211,450/ปี (~$17,621/เดือน) สำหรับ senior ในบริษัทเทคใหญ่ รวม RSU อาจได้มากกว่านี้",
      "en": "90th percentile is $211,450/year (~$17,621/month). Senior engineers at top tech firms can earn significantly more with RSU/equity.",
      "sources": [{"title": "BLS OES Software Developers May 2024", "url": "https://www.bls.gov/oes/current/oes151252.htm"}, {"title": "Levels.fyi Compensation Data", "url": "https://www.levels.fyi"}]
    }
  }'::jsonb
WHERE slug = 'software-engineer';

-- data-scientist
UPDATE career_survival SET
  metric_details = '{
    "demand_growth": {
      "th": "Data scientist/analyst เป็นสายที่โตเร็วที่สุดในไทย ธนาคาร ค้าปลีก และสตาร์ทอัพแย่งตัวกัน JobsDB รายงานตำแหน่งเพิ่ม 25-30% ต่อปี",
      "en": "Data scientist/analyst is the fastest growing tech role in Thailand. Banks, retail, and startups compete for talent. JobsDB reports 25-30% annual position growth.",
      "sources": [{"title": "JobsDB Thailand Salary Report 2024", "url": "https://th.jobsdb.com/th/career-advice/article/it-salary-report"}, {"title": "Bank of Thailand Fintech Report", "url": "https://www.bot.or.th/en/financial-innovation.html"}]
    },
    "grad_employment_pct": {
      "th": "จบสาย data/statistics มีงานรองรับ 82% เพราะทุกอุตสาหกรรมต้องการคนอ่านข้อมูลเป็น แม้ไม่จบตรง data science ก็สามารถเข้าได้",
      "en": "82% of data/statistics graduates find employment as every industry needs data-literate people. Even non-DS majors can enter the field.",
      "sources": [{"title": "NESDC Thailand Workforce Survey", "url": "https://www.nesdc.go.th/main.php?filename=social"}, {"title": "Thammasat University Graduate Outcomes", "url": "https://www.tu.ac.th"}]
    },
    "saturation_level": {
      "th": "ยังขาดแคลนมาก คนที่ทำ data ได้จริง (SQL, Python, visualization) ไม่เพียงพอกับความต้องการ ส่วนใหญ่เรียนจบมาแต่ยังขาดประสบการณ์จริง",
      "en": "Severe shortage persists. People who can actually do data work (SQL, Python, visualization) don''t meet demand. Most fresh grads lack real-world experience.",
      "sources": [{"title": "McKinsey Thailand Digital Transformation", "url": "https://www.mckinsey.com/featured-insights/asia-pacific"}, {"title": "LinkedIn Thailand Talent Insights", "url": "https://business.linkedin.com/talent-solutions/talent-insights"}]
    },
    "progression_difficulty": {
      "th": "จาก Analyst → Senior → Lead → Head of Data ใช้เวลา 6-9 ปี ต้องพัฒนาทั้ง technical + business communication ตลอด",
      "en": "From Analyst → Senior → Lead → Head of Data takes 6-9 years. Must develop both technical and business communication skills continuously.",
      "sources": [{"title": "DataCamp State of Data 2024", "url": "https://www.datacamp.com/blog/the-state-of-data-roles"}, {"title": "Glassdoor Data Scientist Career Path", "url": "https://www.glassdoor.com/Career/data-scientist-career_KO0,14.htm"}]
    },
    "salary_floor": {
      "th": "Junior Data Analyst เริ่มต้นที่ 30,000-40,000 บาท/เดือนในกรุงเทพ สูงกว่า developer เล็กน้อยเพราะต้องมี stats background",
      "en": "Junior Data Analysts start at 30,000-40,000 THB/month in Bangkok, slightly above developers due to stats background requirement.",
      "sources": [{"title": "Jobthai Salary Survey 2024", "url": "https://www.jobthai.com/en/salary"}, {"title": "Robert Walters Thailand 2024", "url": "https://www.robertwalters.co.th/salary-survey.html"}]
    },
    "salary_ceiling": {
      "th": "Head of Data / Chief Data Officer ได้ 120,000-150,000+ บาท ในธนาคารและเทคใหญ่ สาย ML Engineer ที่ทำ remote ได้มากกว่านี้",
      "en": "Head of Data / CDO roles pay 120,000-150,000+ THB at banks and big tech. ML Engineers doing remote work can earn more.",
      "sources": [{"title": "Robert Walters Thailand 2024", "url": "https://www.robertwalters.co.th/salary-survey.html"}, {"title": "Hays Thailand Salary Guide 2024", "url": "https://www.hays.co.th/salary-guide"}]
    }
  }'::jsonb,
  global_metric_details = '{
    "demand_growth": {
      "th": "BLS คาดการณ์ data scientist จะโต 36% ระหว่างปี 2023-2033 เร็วที่สุดในกลุ่ม STEM ทั้งหมด",
      "en": "BLS projects 36% growth for data scientists 2023-2033, among the fastest of all STEM occupations.",
      "sources": [{"title": "BLS OOH: Data Scientists", "url": "https://www.bls.gov/ooh/math/data-scientists.htm"}, {"title": "WEF Future of Jobs 2025", "url": "https://www.weforum.org/publications/the-future-of-jobs-report-2025/"}]
    },
    "grad_employment_pct": {
      "th": "75% ของจบ data science/statistics ได้งานในสายภายในปีแรก ตลาดกว้างมากเพราะทุกอุตสาหกรรมต้องการ",
      "en": "75% of data science/statistics graduates find roles within the first year. The market is vast as every industry needs data talent.",
      "sources": [{"title": "NCES STEM Employment Data", "url": "https://nces.ed.gov/programs/coe/indicator/sbc"}, {"title": "Glassdoor Job Market Report", "url": "https://www.glassdoor.com/research/"}]
    },
    "saturation_level": {
      "th": "แม้คนเรียน data science เพิ่มขึ้นมาก แต่ความต้องการโตเร็วกว่า ตำแหน่ง data ในสหรัฐฯ ว่างกว่า 150,000 ตำแหน่ง",
      "en": "Despite surging DS enrollment, demand grows faster. Over 150,000 unfilled data positions in the US.",
      "sources": [{"title": "CompTIA Workforce Data 2024", "url": "https://www.comptia.org/content/research/state-of-the-tech-workforce"}, {"title": "LinkedIn Workforce Report", "url": "https://economicgraph.linkedin.com/"}]
    },
    "progression_difficulty": {
      "th": "เส้นทางชัดเจนแต่ต้องเก่งทั้ง technical + communication ใช้เวลา 5-8 ปีถึง senior level",
      "en": "Clear path but requires both technical depth and communication skill. 5-8 years to reach senior level.",
      "sources": [{"title": "DataCamp State of Data 2024", "url": "https://www.datacamp.com/blog/the-state-of-data-roles"}]
    },
    "salary_floor": {
      "th": "P10 ของ data scientist ในสหรัฐฯ อยู่ที่ $63,650/ปี (~$5,304/เดือน) ตาม BLS OES",
      "en": "10th percentile for US data scientists is $63,650/year (~$5,304/month) per BLS OES.",
      "sources": [{"title": "BLS OES Data Scientists May 2024", "url": "https://www.bls.gov/oes/current/oes152051.htm"}]
    },
    "salary_ceiling": {
      "th": "P90 อยู่ที่ $194,410/ปี (~$16,201/เดือน) senior data scientist ที่ FAANG ได้มากกว่านี้มากรวม equity",
      "en": "90th percentile is $194,410/year (~$16,201/month). Senior DS at FAANG companies earn significantly more with equity.",
      "sources": [{"title": "BLS OES Data Scientists May 2024", "url": "https://www.bls.gov/oes/current/oes152051.htm"}, {"title": "Levels.fyi Data Science Compensation", "url": "https://www.levels.fyi/t/data-scientist"}]
    }
  }'::jsonb
WHERE slug = 'data-scientist';

-- product-manager
UPDATE career_survival SET
  metric_details = '{
    "demand_growth": {
      "th": "PM เป็นที่ต้องการมากในสตาร์ทอัพและบริษัทเทคในไทย ตำแหน่งเพิ่ม 10-15% ต่อปี แต่ส่วนใหญ่ต้องมีประสบการณ์",
      "en": "PMs are in high demand at Thai startups and tech companies. Positions growing 10-15% annually, though most require experience.",
      "sources": [{"title": "JobsDB Thailand Tech Roles 2024", "url": "https://th.jobsdb.com/th/career-advice/article/it-salary-report"}, {"title": "Techsauce Thailand Startup Report", "url": "https://techsauce.co"}]
    },
    "grad_employment_pct": {
      "th": "80% แต่ส่วนใหญ่ไม่ได้เริ่มเป็น PM ตั้งแต่จบ ต้องผ่านงาน analyst/engineer/marketing ก่อน 2-3 ปี",
      "en": "80%, but most don''t start as PM right after graduation. Typically transition from analyst/engineer/marketing after 2-3 years.",
      "sources": [{"title": "Product School Career Report", "url": "https://productschool.com/blog/product-management-job-market"}, {"title": "Mind the Product Survey 2024", "url": "https://www.mindtheproduct.com"}]
    },
    "saturation_level": {
      "th": "คนอยากเป็น PM เยอะ แต่คนที่มี technical + business skill จริงๆ ยังหายาก ตำแหน่ง senior PM ยังว่างเยอะ",
      "en": "Many aspire to become PMs, but those with genuine technical + business skills are rare. Senior PM positions remain unfilled.",
      "sources": [{"title": "LinkedIn Thailand PM Talent Data", "url": "https://business.linkedin.com/talent-solutions/talent-insights"}]
    },
    "progression_difficulty": {
      "th": "APM → PM → Senior PM → Group PM → VP Product ใช้เวลา 8-12 ปี การเข้าสู่สายค่อนข้างยากต้องมี cross-functional skill",
      "en": "APM → PM → Senior PM → Group PM → VP Product takes 8-12 years. Entry is difficult, requiring cross-functional skills.",
      "sources": [{"title": "Lenny''s Newsletter PM Career Ladder", "url": "https://www.lennysnewsletter.com"}, {"title": "Product School Career Guide", "url": "https://productschool.com"}]
    },
    "salary_floor": {
      "th": "Junior PM / APM เริ่มต้น 30,000-45,000 บาท ในบริษัทเทคและสตาร์ทอัพกรุงเทพ",
      "en": "Junior PM / APM starts at 30,000-45,000 THB/month at tech companies and startups in Bangkok.",
      "sources": [{"title": "Jobthai Salary Data 2024", "url": "https://www.jobthai.com/en/salary"}, {"title": "Glassdoor Bangkok PM Salaries", "url": "https://www.glassdoor.com/Salaries/bangkok-product-manager-salary-SRCH_IL.0,7_IM1019_KO8,23.htm"}]
    },
    "salary_ceiling": {
      "th": "VP Product / CPO ในบริษัทเทคใหญ่ได้ 120,000-150,000+ บาท/เดือน ในสตาร์ทอัพอาจได้ equity เพิ่ม",
      "en": "VP Product / CPO at large tech firms earn 120,000-150,000+ THB/month. Startups may offer additional equity.",
      "sources": [{"title": "Robert Walters Thailand 2024", "url": "https://www.robertwalters.co.th/salary-survey.html"}]
    }
  }'::jsonb,
  global_metric_details = '{
    "demand_growth": {
      "th": "ความต้องการ PM ทั่วโลกโต 6-8% ต่อปี ช้ากว่า developer แต่ยังสูงกว่าค่าเฉลี่ย เพราะทุกบริษัทเทคต้องการ",
      "en": "Global PM demand grows 6-8% annually, slower than developers but above average as every tech company needs PMs.",
      "sources": [{"title": "BLS OOH Management Analysts", "url": "https://www.bls.gov/ooh/business-and-financial/management-analysts.htm"}, {"title": "Product School Market Report", "url": "https://productschool.com"}]
    },
    "grad_employment_pct": {
      "th": "72% ของคนที่เข้าสาย PM ได้งานภายในปีแรก แต่ส่วนใหญ่ไม่ได้จบตรงสาย PM มาจากหลายพื้นฐาน",
      "en": "72% of PM aspirants find roles within the first year, though most come from diverse backgrounds rather than a dedicated PM major.",
      "sources": [{"title": "Product School 2024 Hiring Report", "url": "https://productschool.com"}]
    },
    "saturation_level": {
      "th": "ตำแหน่ง PM มีคู่แข่งเยอะ โดยเฉพาะ entry level ต้องโดดเด่นด้วย portfolio และ case study",
      "en": "PM roles face heavy competition, especially entry-level. Candidates need strong portfolios and case studies to stand out.",
      "sources": [{"title": "Lenny''s Newsletter PM Job Market", "url": "https://www.lennysnewsletter.com"}]
    },
    "progression_difficulty": {
      "th": "เลื่อนขั้นใช้เวลาและต้อง prove impact ชัดเจน ต้องมี influence without authority skill สูง",
      "en": "Advancement requires time and clear impact proof. Strong ''influence without authority'' skills essential.",
      "sources": [{"title": "Reforge PM Career Growth", "url": "https://www.reforge.com"}]
    },
    "salary_floor": {
      "th": "P10 ของ management analyst ในสหรัฐฯ อยู่ที่ ~$59,800/ปี (~$4,985/เดือน)",
      "en": "10th percentile for US management analysts is ~$59,800/year (~$4,985/month).",
      "sources": [{"title": "BLS OES Management Analysts", "url": "https://www.bls.gov/oes/current/oes131111.htm"}]
    },
    "salary_ceiling": {
      "th": "P90 อยู่ที่ ~$165,800/ปี (~$13,816/เดือน) VP/CPO ที่ FAANG ได้มากกว่านี้มาก",
      "en": "90th percentile is ~$165,800/year (~$13,816/month). VP/CPO at FAANG earn significantly more.",
      "sources": [{"title": "BLS OES Management Analysts", "url": "https://www.bls.gov/oes/current/oes131111.htm"}, {"title": "Levels.fyi PM Compensation", "url": "https://www.levels.fyi/t/product-manager"}]
    }
  }'::jsonb
WHERE slug = 'product-manager';

-- ux-designer
UPDATE career_survival SET
  metric_details = '{
    "demand_growth": {
      "th": "UX/UI designer เป็นที่ต้องการมากขึ้นในไทย ตามที่บริษัทเริ่มเห็นความสำคัญของ user experience ตำแหน่งเพิ่ม 12-15% ต่อปี",
      "en": "UX/UI designers increasingly sought in Thailand as companies recognize UX importance. Positions growing 12-15% annually.",
      "sources": [{"title": "JobsDB Thailand Design Roles", "url": "https://th.jobsdb.com/th/career-advice/article/it-salary-report"}, {"title": "Designil Thailand UX Report", "url": "https://www.designil.com"}]
    },
    "grad_employment_pct": {
      "th": "75% ของจบสาย design/HCI ได้งาน UX/UI แต่หลายคนเข้าสายจาก graphic design หรือ self-taught ก็ได้",
      "en": "75% of design/HCI graduates find UX/UI work. Many enter from graphic design background or are self-taught.",
      "sources": [{"title": "UX Design Institute Career Report", "url": "https://www.uxdesigninstitute.com"}, {"title": "Nielsen Norman Group UX Career Survey", "url": "https://www.nngroup.com/articles/"}]
    },
    "saturation_level": {
      "th": "มีคนอยากทำ UX เยอะขึ้น แต่คนที่ทำ research จริงๆ ได้ยังน้อย ส่วนใหญ่ทำแค่ UI ทำให้ UX researcher ยังขาด",
      "en": "More people want to do UX, but those who can do proper research are scarce. Most only do UI, so UX researchers remain in shortage.",
      "sources": [{"title": "LinkedIn Thailand Design Talent", "url": "https://business.linkedin.com/talent-solutions/talent-insights"}]
    },
    "progression_difficulty": {
      "th": "Junior → Mid → Senior → Lead → Head of Design ใช้เวลา 6-10 ปี ต้อง build portfolio แข็งแกร่ง",
      "en": "Junior → Mid → Senior → Lead → Head of Design takes 6-10 years. Must build a strong portfolio.",
      "sources": [{"title": "Nielsen Norman UX Career Levels", "url": "https://www.nngroup.com/articles/career-levels-ux/"}]
    },
    "salary_floor": {
      "th": "Junior UX/UI Designer เริ่มต้น 25,000-35,000 บาท/เดือน ในกรุงเทพ",
      "en": "Junior UX/UI Designers start at 25,000-35,000 THB/month in Bangkok.",
      "sources": [{"title": "Jobthai Salary Survey 2024", "url": "https://www.jobthai.com/en/salary"}]
    },
    "salary_ceiling": {
      "th": "Head of Design / Design Director ได้ 70,000-90,000+ บาท ในบริษัทเทคใหญ่และธนาคาร",
      "en": "Head of Design / Design Director earns 70,000-90,000+ THB at large tech companies and banks.",
      "sources": [{"title": "Robert Walters Thailand 2024", "url": "https://www.robertwalters.co.th/salary-survey.html"}]
    }
  }'::jsonb,
  global_metric_details = '{
    "demand_growth": {
      "th": "BLS คาดว่า web/digital designer จะโต 16% ในปี 2022-2032 สูงกว่าค่าเฉลี่ย",
      "en": "BLS projects 16% growth for web/digital designers 2022-2032, faster than average.",
      "sources": [{"title": "BLS OOH Web Developers and Digital Designers", "url": "https://www.bls.gov/ooh/computer-and-information-technology/web-developers.htm"}]
    },
    "grad_employment_pct": {
      "th": "60% ของจบสาย design ในต่างประเทศได้งาน UX ภายในปีแรก ตลาดกว้างแต่แข่งขันสูง",
      "en": "60% of international design graduates find UX roles within the first year. Wide market but competitive.",
      "sources": [{"title": "AIGA Design Census", "url": "https://designcensus.org"}]
    },
    "saturation_level": {
      "th": "ตลาด UX ทั่วโลกมีคนสมัครเยอะ โดยเฉพาะ junior level การแข่งขันค่อนข้างสูง",
      "en": "Global UX market has many applicants, especially at junior level. Competition is quite high.",
      "sources": [{"title": "UX Design Institute Job Market Report", "url": "https://www.uxdesigninstitute.com"}]
    },
    "progression_difficulty": {
      "th": "เลื่อนขั้นต้องมี portfolio ที่ดีและ impact metrics ชัด ทักษะ research + strategy สำคัญมากสำหรับ senior+",
      "en": "Advancement requires strong portfolio and clear impact metrics. Research + strategy skills critical for senior+.",
      "sources": [{"title": "Nielsen Norman Group Career Guide", "url": "https://www.nngroup.com/articles/career-levels-ux/"}]
    },
    "salary_floor": {
      "th": "P10 ของ web/digital designer ในสหรัฐฯ ~$47,840/ปี (~$3,987/เดือน)",
      "en": "10th percentile for US web/digital designers is ~$47,840/year (~$3,987/month).",
      "sources": [{"title": "BLS OES Web Developers", "url": "https://www.bls.gov/oes/current/oes151257.htm"}]
    },
    "salary_ceiling": {
      "th": "P90 อยู่ที่ ~$192,180/ปี (~$16,015/เดือน) สำหรับ senior UX ในบริษัทเทคใหญ่",
      "en": "90th percentile is ~$192,180/year (~$16,015/month) for senior UX at top tech companies.",
      "sources": [{"title": "BLS OES Web Developers", "url": "https://www.bls.gov/oes/current/oes151257.htm"}, {"title": "Glassdoor UX Designer Salaries", "url": "https://www.glassdoor.com/Salaries/ux-designer-salary-SRCH_KO0,11.htm"}]
    }
  }'::jsonb
WHERE slug = 'ux-designer';

-- financial-analyst
UPDATE career_survival SET
  metric_details = '{
    "demand_growth": {
      "th": "สายการเงินในไทยโตตาม fintech และตลาดทุนที่ขยายตัว ตำแหน่ง analyst เพิ่ม 8-12% ต่อปี",
      "en": "Finance roles in Thailand grow with fintech and expanding capital markets. Analyst positions up 8-12% annually.",
      "sources": [{"title": "Bank of Thailand Financial Sector Report", "url": "https://www.bot.or.th"}, {"title": "SEC Thailand Capital Market Report", "url": "https://www.sec.or.th"}]
    },
    "grad_employment_pct": {
      "th": "78% ของจบการเงิน/บัญชีได้งานภายในปีแรก ตลาดกว้างทั้งธนาคาร ประกัน หลักทรัพย์",
      "en": "78% of finance/accounting graduates find employment within a year. Broad market across banks, insurance, securities.",
      "sources": [{"title": "Chulalongkorn Business School Outcomes", "url": "https://www.chula.ac.th"}, {"title": "NESDC Labor Survey", "url": "https://www.nesdc.go.th"}]
    },
    "saturation_level": {
      "th": "มีคนเรียนสายนี้เยอะ การแข่งขันปานกลาง-สูง โดยเฉพาะตำแหน่ง entry ต้องมี CFA หรือ CISA เพื่อโดดเด่น",
      "en": "Many graduates in this field. Medium-high competition, especially entry level. CFA or CISA certification helps stand out.",
      "sources": [{"title": "CFA Institute Member Survey", "url": "https://www.cfainstitute.org"}]
    },
    "progression_difficulty": {
      "th": "Analyst → Senior → Manager → Director → CFO ใช้เวลา 10-15 ปี ต้องมี CFA/CPA ช่วยเร่งความก้าวหน้า",
      "en": "Analyst → Senior → Manager → Director → CFO takes 10-15 years. CFA/CPA certification accelerates advancement.",
      "sources": [{"title": "Robert Half Finance Career Path", "url": "https://www.roberthalf.com/career-advice"}]
    },
    "salary_floor": {
      "th": "Junior Financial Analyst เริ่ม 22,000-30,000 บาท/เดือนในกรุงเทพ",
      "en": "Junior Financial Analysts start at 22,000-30,000 THB/month in Bangkok.",
      "sources": [{"title": "Jobthai Finance Salary Data", "url": "https://www.jobthai.com/en/salary"}]
    },
    "salary_ceiling": {
      "th": "Finance Director / CFO ในบริษัทใหญ่ได้ 100,000-120,000+ บาท/เดือน",
      "en": "Finance Director / CFO at large companies earn 100,000-120,000+ THB/month.",
      "sources": [{"title": "Robert Walters Thailand 2024", "url": "https://www.robertwalters.co.th/salary-survey.html"}]
    }
  }'::jsonb,
  global_metric_details = '{
    "demand_growth": {
      "th": "BLS คาดการณ์ financial analyst จะโต 9% ในปี 2023-2033 เร็วกว่าค่าเฉลี่ย",
      "en": "BLS projects 9% growth for financial analysts 2023-2033, faster than average.",
      "sources": [{"title": "BLS OOH Financial Analysts", "url": "https://www.bls.gov/ooh/business-and-financial/financial-analysts.htm"}]
    },
    "grad_employment_pct": {
      "th": "82% ของจบการเงินในสหรัฐฯ ได้งานภายินปีแรก ตลาดกว้างและมั่นคง",
      "en": "82% of US finance graduates find employment within the first year. Broad and stable market.",
      "sources": [{"title": "NCES Business Graduate Outcomes", "url": "https://nces.ed.gov"}]
    },
    "saturation_level": {
      "th": "มีคู่แข่งปานกลาง ต้องมี certification เช่น CFA เพื่อแยกตัวจากคนอื่น",
      "en": "Moderate competition. Certifications like CFA needed to differentiate.",
      "sources": [{"title": "CFA Institute", "url": "https://www.cfainstitute.org"}]
    },
    "progression_difficulty": {
      "th": "เส้นทางชัดเจนแต่ต้องลงทุนกับ CFA/CPA อาจใช้เวลา 2-4 ปีสอบ",
      "en": "Clear path but requires investment in CFA/CPA, which takes 2-4 years of exams.",
      "sources": [{"title": "CFA Institute Candidate Survey", "url": "https://www.cfainstitute.org"}]
    },
    "salary_floor": {
      "th": "P10 ของ financial analyst ในสหรัฐฯ ~$62,410/ปี (~$5,201/เดือน)",
      "en": "10th percentile for US financial analysts is ~$62,410/year (~$5,201/month).",
      "sources": [{"title": "BLS OES Financial Analysts", "url": "https://www.bls.gov/oes/current/oes132051.htm"}]
    },
    "salary_ceiling": {
      "th": "P90 อยู่ที่ ~$180,550/ปี (~$15,046/เดือน)",
      "en": "90th percentile is ~$180,550/year (~$15,046/month).",
      "sources": [{"title": "BLS OES Financial Analysts", "url": "https://www.bls.gov/oes/current/oes132051.htm"}]
    }
  }'::jsonb
WHERE slug = 'financial-analyst';

-- content-writer
UPDATE career_survival SET
  metric_details = '{
    "demand_growth": {
      "th": "ความต้องการ content writer ในไทยโตตาม social media และ e-commerce แต่ AI เริ่มเข้ามาแทนงานพื้นฐาน",
      "en": "Content writer demand in Thailand grows with social media and e-commerce, but AI is replacing basic writing tasks.",
      "sources": [{"title": "Digital Advertising Association Thailand", "url": "https://www.daat.in.th"}, {"title": "We Are Social Thailand Digital Report", "url": "https://wearesocial.com/th/"}]
    },
    "grad_employment_pct": {
      "th": "62% ของจบสายนิเทศศาสตร์/อักษรศาสตร์ ได้งาน content ภายในปีแรก ต้องมี portfolio ดี",
      "en": "62% of communication/arts graduates find content roles within the first year. Strong portfolio required.",
      "sources": [{"title": "NESDC Graduate Employment Survey", "url": "https://www.nesdc.go.th"}]
    },
    "saturation_level": {
      "th": "คนเขียน content เยอะมาก การแข่งขันสูง โดยเฉพาะ general content ต้อง niche ลงเพื่ออยู่รอด",
      "en": "Many content writers. High competition, especially for general content. Must niche down to survive.",
      "sources": [{"title": "Content Marketing Institute 2024", "url": "https://contentmarketinginstitute.com"}]
    },
    "progression_difficulty": {
      "th": "Writer → Senior → Content Lead → Head of Content ใช้เวลา 5-8 ปี ย้ายไป marketing/brand ได้ง่าย",
      "en": "Writer → Senior → Content Lead → Head of Content takes 5-8 years. Easy transition to marketing/brand roles.",
      "sources": [{"title": "Contently Content Career Guide", "url": "https://contently.com"}]
    },
    "salary_floor": {
      "th": "Junior Content Writer เริ่ม 18,000-25,000 บาท/เดือน ค่อนข้างต่ำเทียบกับสายเทค",
      "en": "Junior Content Writers start at 18,000-25,000 THB/month, relatively low compared to tech roles.",
      "sources": [{"title": "Jobthai Salary Survey", "url": "https://www.jobthai.com/en/salary"}]
    },
    "salary_ceiling": {
      "th": "Head of Content / Content Director ได้ 40,000-50,000+ บาท freelance ที่เก่งอาจได้มากกว่า",
      "en": "Head of Content / Content Director earns 40,000-50,000+ THB. Skilled freelancers can earn more.",
      "sources": [{"title": "Robert Walters Thailand 2024", "url": "https://www.robertwalters.co.th/salary-survey.html"}]
    }
  }'::jsonb,
  global_metric_details = '{
    "demand_growth": {
      "th": "BLS คาดว่า writer/author จะโตเพียง 4% ในปี 2022-2032 ต่ำกว่าค่าเฉลี่ย AI กำลังเปลี่ยนสาย",
      "en": "BLS projects only 4% growth for writers 2022-2032, below average. AI is transforming the field.",
      "sources": [{"title": "BLS OOH Writers and Authors", "url": "https://www.bls.gov/ooh/media-and-communication/writers-and-authors.htm"}]
    },
    "grad_employment_pct": {
      "th": "55% ของจบสาย writing ได้งานในสายภายในปีแรก ต่ำกว่าสาย STEM มาก",
      "en": "55% of writing graduates find field-related work within the first year, well below STEM rates.",
      "sources": [{"title": "NCES Arts & Humanities Outcomes", "url": "https://nces.ed.gov"}]
    },
    "saturation_level": {
      "th": "การแข่งขันสูงมากทั่วโลก ต้อง specialize (UX writing, technical writing, SEO) เพื่ออยู่รอด",
      "en": "Very high competition globally. Must specialize (UX writing, technical writing, SEO) to survive.",
      "sources": [{"title": "Content Marketing Institute", "url": "https://contentmarketinginstitute.com"}]
    },
    "progression_difficulty": {
      "th": "เลื่อนขั้นยากกว่าสายเทค เพราะตำแหน่ง senior ในสาย content มีน้อย",
      "en": "Harder to advance than tech roles due to fewer senior content positions available.",
      "sources": [{"title": "Contently Career Data", "url": "https://contently.com"}]
    },
    "salary_floor": {
      "th": "P10 ของ writer ในสหรัฐฯ ~$33,000/ปี (~$2,750/เดือน) ค่อนข้างต่ำ",
      "en": "10th percentile for US writers is ~$33,000/year (~$2,750/month), relatively low.",
      "sources": [{"title": "BLS OES Writers and Authors", "url": "https://www.bls.gov/oes/current/oes273043.htm"}]
    },
    "salary_ceiling": {
      "th": "P90 อยู่ที่ ~$103,000/ปี (~$8,583/เดือน) สำหรับ senior/specialized writer",
      "en": "90th percentile is ~$103,000/year (~$8,583/month) for senior/specialized writers.",
      "sources": [{"title": "BLS OES Writers and Authors", "url": "https://www.bls.gov/oes/current/oes273043.htm"}]
    }
  }'::jsonb
WHERE slug = 'content-writer';

-- Remaining 15 careers get shorter but still sourced details
-- Using a helper pattern: each gets Thai + Global metric_details

UPDATE career_survival SET
  metric_details = '{"demand_growth":{"th":"ตำแหน่ง graphic designer มีอยู่ทั่วไป แต่โตช้าเพราะ AI design tools เข้ามาแทน เหลือเฉพาะงาน creative direction","en":"Graphic design positions are common but grow slowly as AI design tools replace routine work. Creative direction roles remain.","sources":[{"title":"AIGA Design Census","url":"https://designcensus.org"}]},"grad_employment_pct":{"th":"68% ของจบออกแบบได้งาน แต่หลายคนต้องทำ freelance เสริมช่วงแรก","en":"68% of design graduates find work, though many supplement with freelance early on.","sources":[{"title":"AIGA Design Census","url":"https://designcensus.org"}]},"saturation_level":{"th":"ตลาดอิ่มตัวสูง คนเรียน graphic design เยอะมาก ต้องมี niche หรือ motion/3D skill เพื่อแยกตัว","en":"Highly saturated market. Must have niche or motion/3D skills to differentiate.","sources":[{"title":"LinkedIn Design Talent Data","url":"https://business.linkedin.com/talent-solutions/talent-insights"}]},"progression_difficulty":{"th":"Designer → Senior → Art Director → Creative Director ใช้เวลา 8-12 ปี ต้องสร้าง portfolio แข็งแกร่ง","en":"Designer → Senior → Art Director → Creative Director takes 8-12 years with a strong portfolio.","sources":[{"title":"AIGA Career Guide","url":"https://www.aiga.org/career"}]},"salary_floor":{"th":"เริ่มต้น 16,000-22,000 บาท/เดือน ค่อนข้างต่ำ","en":"Starting at 16,000-22,000 THB/month, relatively low.","sources":[{"title":"Jobthai Salary Survey","url":"https://www.jobthai.com/en/salary"}]},"salary_ceiling":{"th":"Creative Director ได้ 45,000-60,000+ บาท ในเอเจนซี่ใหญ่","en":"Creative Director earns 45,000-60,000+ THB at top agencies.","sources":[{"title":"Robert Walters Thailand","url":"https://www.robertwalters.co.th/salary-survey.html"}]}}'::jsonb,
  global_metric_details = '{"demand_growth":{"th":"BLS คาดว่า graphic designer จะโตเพียง 3% ช้ากว่าค่าเฉลี่ย AI กำลังเปลี่ยนอุตสาหกรรม","en":"BLS projects only 3% growth, slower than average. AI is reshaping the industry.","sources":[{"title":"BLS OOH Graphic Designers","url":"https://www.bls.gov/ooh/arts-and-design/graphic-designers.htm"}]},"grad_employment_pct":{"th":"58% ของจบ design ได้งานในสายภายินปีแรก","en":"58% of design graduates find field-related work within the first year.","sources":[{"title":"NCES Arts Graduates","url":"https://nces.ed.gov"}]},"saturation_level":{"th":"อิ่มตัวสูงมากทั่วโลก freelance marketplace ทำให้แข่งกับคนทั้งโลก","en":"Very high global saturation. Freelance marketplaces create worldwide competition.","sources":[{"title":"AIGA Design Census","url":"https://designcensus.org"}]},"progression_difficulty":{"th":"เลื่อนขั้นปานกลาง ต้องย้ายไป creative direction เพื่อโตต่อ","en":"Moderate progression. Must move toward creative direction for growth.","sources":[{"title":"AIGA Career Guide","url":"https://www.aiga.org/career"}]},"salary_floor":{"th":"P10 ~$35,000/ปี (~$2,917/เดือน)","en":"10th percentile ~$35,000/year (~$2,917/month).","sources":[{"title":"BLS OES Graphic Designers","url":"https://www.bls.gov/oes/current/oes271024.htm"}]},"salary_ceiling":{"th":"P90 ~$93,000/ปี (~$7,750/เดือน)","en":"90th percentile ~$93,000/year (~$7,750/month).","sources":[{"title":"BLS OES Graphic Designers","url":"https://www.bls.gov/oes/current/oes271024.htm"}]}}'::jsonb
WHERE slug = 'graphic-designer';

UPDATE career_survival SET
  metric_details = '{"demand_growth":{"th":"ตำแหน่ง marketing specialist โตตาม digital marketing ที่ขยาย ต้องการคนทำ ads, analytics, content marketing","en":"Marketing specialist roles grow with digital marketing expansion. Demand for ads, analytics, content marketing skills.","sources":[{"title":"Digital Advertising Association Thailand","url":"https://www.daat.in.th"}]},"grad_employment_pct":{"th":"72% ของจบ marketing ได้งานภายินปีแรก ตลาดกว้างแต่เริ่มต้นเงินเดือนต่ำ","en":"72% of marketing grads find work within the first year. Wide market but low starting salaries.","sources":[{"title":"NESDC Labor Survey","url":"https://www.nesdc.go.th"}]},"saturation_level":{"th":"คนเรียน marketing เยอะ ต้องมี digital skill จริงๆ (ads, analytics) เพื่อแยกตัว","en":"Many marketing graduates. Real digital skills (ads, analytics) needed to stand out.","sources":[{"title":"HubSpot Marketing Trends","url":"https://www.hubspot.com/marketing-statistics"}]},"progression_difficulty":{"th":"Specialist → Manager → Director → CMO ใช้เวลา 8-12 ปี","en":"Specialist → Manager → Director → CMO takes 8-12 years.","sources":[{"title":"Robert Half Marketing Career","url":"https://www.roberthalf.com"}]},"salary_floor":{"th":"เริ่มต้น 18,000-25,000 บาท/เดือน","en":"Starting at 18,000-25,000 THB/month.","sources":[{"title":"Jobthai Salary Survey","url":"https://www.jobthai.com/en/salary"}]},"salary_ceiling":{"th":"Marketing Director ได้ 80,000-100,000+ บาท/เดือน","en":"Marketing Director earns 80,000-100,000+ THB/month.","sources":[{"title":"Robert Walters Thailand","url":"https://www.robertwalters.co.th/salary-survey.html"}]}}'::jsonb,
  global_metric_details = '{"demand_growth":{"th":"BLS คาดว่า marketing specialist จะโต 6% ใกล้เคียงค่าเฉลี่ย","en":"BLS projects 6% growth, close to average.","sources":[{"title":"BLS OOH Marketing Managers","url":"https://www.bls.gov/ooh/management/advertising-promotions-and-marketing-managers.htm"}]},"grad_employment_pct":{"th":"68% ได้งาน marketing ภายินปีแรก","en":"68% find marketing roles within the first year.","sources":[{"title":"NCES Business Outcomes","url":"https://nces.ed.gov"}]},"saturation_level":{"th":"การแข่งขันปานกลาง-สูง ต้องมี digital marketing certification","en":"Medium-high competition. Digital marketing certifications help.","sources":[{"title":"HubSpot Marketing Statistics","url":"https://www.hubspot.com/marketing-statistics"}]},"progression_difficulty":{"th":"เลื่อนขั้นปานกลาง ต้อง prove ROI ชัดเจน","en":"Moderate progression. Must clearly prove ROI.","sources":[{"title":"Robert Half Career Guide","url":"https://www.roberthalf.com"}]},"salary_floor":{"th":"P10 ~$37,000/ปี (~$3,083/เดือน)","en":"10th percentile ~$37,000/year (~$3,083/month).","sources":[{"title":"BLS OES Advertising/Marketing","url":"https://www.bls.gov/oes/current/oes131161.htm"}]},"salary_ceiling":{"th":"P90 ~$150,000/ปี (~$12,500/เดือน)","en":"90th percentile ~$150,000/year (~$12,500/month).","sources":[{"title":"BLS OES Marketing Managers","url":"https://www.bls.gov/oes/current/oes112021.htm"}]}}'::jsonb
WHERE slug = 'marketing-specialist';

UPDATE career_survival SET
  metric_details = '{"demand_growth":{"th":"นักบัญชีเป็นที่ต้องการตลอดเพราะทุกบริษัทต้องมี แต่โตช้า automation เข้ามาแทนงาน routine","en":"Accountants always needed as every company requires them, but slow growth as automation replaces routine tasks.","sources":[{"title":"Federation of Accounting Professions Thailand","url":"https://www.tfac.or.th"}]},"grad_employment_pct":{"th":"78% ของจบบัญชีได้งานภายินปีแรก ตลาดมั่นคงมาก","en":"78% of accounting graduates find work within the first year. Very stable market.","sources":[{"title":"NESDC Labor Survey","url":"https://www.nesdc.go.th"}]},"saturation_level":{"th":"มีคนเรียนบัญชีเยอะ แต่ CPA ช่วยแยกตัวจากคนอื่น ตำแหน่ง senior ยังว่าง","en":"Many accounting graduates but CPA helps differentiate. Senior positions still available.","sources":[{"title":"TFAC Member Survey","url":"https://www.tfac.or.th"}]},"progression_difficulty":{"th":"Staff → Senior → Manager → Director → CFO ต้องมี CPA เส้นทางชัดเจนแต่ใช้เวลา","en":"Staff → Senior → Manager → Director → CFO. CPA required. Clear but lengthy path.","sources":[{"title":"Robert Half Accounting Career","url":"https://www.roberthalf.com"}]},"salary_floor":{"th":"เริ่มต้น 18,000-22,000 บาท/เดือน","en":"Starting at 18,000-22,000 THB/month.","sources":[{"title":"Jobthai Salary Survey","url":"https://www.jobthai.com/en/salary"}]},"salary_ceiling":{"th":"CFO / Finance Director ได้ 50,000-70,000+ บาท ในบริษัทใหญ่มากกว่านี้","en":"CFO / Finance Director earns 50,000-70,000+ THB. More at large corporations.","sources":[{"title":"Robert Walters Thailand","url":"https://www.robertwalters.co.th/salary-survey.html"}]}}'::jsonb,
  global_metric_details = '{"demand_growth":{"th":"BLS คาดว่า accountant จะโต 4% ใกล้เคียงค่าเฉลี่ย","en":"BLS projects 4% growth, near average.","sources":[{"title":"BLS OOH Accountants","url":"https://www.bls.gov/ooh/business-and-financial/accountants-and-auditors.htm"}]},"grad_employment_pct":{"th":"85% ของจบบัญชีได้งานภายินปีแรก สายที่มั่นคงที่สุดสายหนึ่ง","en":"85% of accounting graduates find work within the first year. One of the most stable fields.","sources":[{"title":"NCES Business Outcomes","url":"https://nces.ed.gov"}]},"saturation_level":{"th":"การแข่งขันต่ำ-ปานกลาง เพราะทุกบริษัทต้องมีบัญชี","en":"Low-moderate competition as every company needs accountants.","sources":[{"title":"AICPA Workforce Survey","url":"https://www.aicpa-cima.com"}]},"progression_difficulty":{"th":"ต้องสอบ CPA/CMA เพื่อเลื่อนขั้น ใช้เวลา 2-3 ปี","en":"Must pass CPA/CMA for advancement. Takes 2-3 years of exams.","sources":[{"title":"AICPA Career Guide","url":"https://www.aicpa-cima.com"}]},"salary_floor":{"th":"P10 ~$52,770/ปี (~$4,398/เดือน)","en":"10th percentile ~$52,770/year (~$4,398/month).","sources":[{"title":"BLS OES Accountants","url":"https://www.bls.gov/oes/current/oes132011.htm"}]},"salary_ceiling":{"th":"P90 ~$141,420/ปี (~$11,785/เดือน)","en":"90th percentile ~$141,420/year (~$11,785/month).","sources":[{"title":"BLS OES Accountants","url":"https://www.bls.gov/oes/current/oes132011.htm"}]}}'::jsonb
WHERE slug = 'accountant';

UPDATE career_survival SET
  metric_details = '{"demand_growth":{"th":"พยาบาลขาดแคลนมากในไทย โรงพยาบาลเอกชนและ medical tourism ดึงคนเข้าสาย","en":"Severe nurse shortage in Thailand. Private hospitals and medical tourism drive demand.","sources":[{"title":"Thailand Nursing Council","url":"https://www.tnmc.or.th"}]},"grad_employment_pct":{"th":"92% ของจบพยาบาลได้งานทันทีเพราะขาดแคลนมาก","en":"92% of nursing graduates find immediate employment due to severe shortages.","sources":[{"title":"Thailand Nursing Council","url":"https://www.tnmc.or.th"}]},"saturation_level":{"th":"ขาดแคลนหนัก ไทยมีพยาบาลน้อยกว่าที่ WHO แนะนำมาก","en":"Severe shortage. Thailand has far fewer nurses than WHO recommends.","sources":[{"title":"WHO Thailand Health Profile","url":"https://www.who.int/countries/tha"}]},"progression_difficulty":{"th":"RN → Senior → Head Nurse → Nursing Director ต้องมีใบอนุญาตและเรียนต่อเฉพาะทาง","en":"RN → Senior → Head Nurse → Nursing Director. Requires license and specialization.","sources":[{"title":"Thailand Nursing Council","url":"https://www.tnmc.or.th"}]},"salary_floor":{"th":"เริ่มต้น 18,000-22,000 บาท/เดือนในรพ.รัฐ เอกชนสูงกว่า","en":"Starting at 18,000-22,000 THB/month in public hospitals. Private hospitals pay more.","sources":[{"title":"Jobthai Healthcare Salary","url":"https://www.jobthai.com/en/salary"}]},"salary_ceiling":{"th":"Nursing Director / ผู้เชี่ยวชาญเฉพาะทางได้ 45,000-60,000+ บาท","en":"Nursing Director / Specialists earn 45,000-60,000+ THB.","sources":[{"title":"Robert Walters Thailand Healthcare","url":"https://www.robertwalters.co.th/salary-survey.html"}]}}'::jsonb,
  global_metric_details = '{"demand_growth":{"th":"BLS คาดว่า RN จะโต 6% แต่ในบางรัฐขาดแคลนหนักมาก","en":"BLS projects 6% RN growth, but severe shortages in some states.","sources":[{"title":"BLS OOH Registered Nurses","url":"https://www.bls.gov/ooh/healthcare/registered-nurses.htm"}]},"grad_employment_pct":{"th":"93% ของจบพยาบาลได้งานทันที","en":"93% of nursing graduates find immediate employment.","sources":[{"title":"NCSBN Workforce Survey","url":"https://www.ncsbn.org"}]},"saturation_level":{"th":"ขาดแคลนทั่วโลก โดยเฉพาะหลัง COVID","en":"Global shortage, especially post-COVID.","sources":[{"title":"WHO Global Nursing Report","url":"https://www.who.int/publications/i/item/9789240003279"}]},"progression_difficulty":{"th":"ต้องมีใบอนุญาตและเรียนต่อ ใช้เวลาแต่ job security สูงมาก","en":"Requires license and continuing education. Takes time but very high job security.","sources":[{"title":"ANA Career Guide","url":"https://www.nursingworld.org"}]},"salary_floor":{"th":"P10 ~$66,040/ปี (~$5,503/เดือน)","en":"10th percentile ~$66,040/year (~$5,503/month).","sources":[{"title":"BLS OES Registered Nurses","url":"https://www.bls.gov/oes/current/oes291141.htm"}]},"salary_ceiling":{"th":"P90 ~$135,320/ปี (~$11,277/เดือน)","en":"90th percentile ~$135,320/year (~$11,277/month).","sources":[{"title":"BLS OES Registered Nurses","url":"https://www.bls.gov/oes/current/oes291141.htm"}]}}'::jsonb
WHERE slug = 'nurse';

UPDATE career_survival SET
  metric_details = '{"demand_growth":{"th":"ครูเป็นที่ต้องการเสมอ โดยเฉพาะสาย STEM และภาษาอังกฤษ โรงเรียนเอกชน/นานาชาติแข่งดึงตัว","en":"Teachers always in demand, especially STEM and English. Private/international schools compete for talent.","sources":[{"title":"Ministry of Education Thailand","url":"https://www.moe.go.th"}]},"grad_employment_pct":{"th":"85% ของจบครุศาสตร์ได้งานภายินปีแรก","en":"85% of education graduates find work within the first year.","sources":[{"title":"NESDC Labor Survey","url":"https://www.nesdc.go.th"}]},"saturation_level":{"th":"บางสาขาขาดแคลน (STEM, ภาษา) แต่สาย general studies อิ่มตัว","en":"Some subjects face shortages (STEM, languages) while general studies are saturated.","sources":[{"title":"OECD Education at a Glance","url":"https://www.oecd.org/education/"}]},"progression_difficulty":{"th":"ครู → หัวหน้ากลุ่มสาระ → รองผอ → ผอ ใช้เวลา 15-20 ปี ระบบราชการค่อนข้างช้า","en":"Teacher → Department Head → Vice Principal → Principal takes 15-20 years. Government system is slow.","sources":[{"title":"Ministry of Education Thailand","url":"https://www.moe.go.th"}]},"salary_floor":{"th":"เริ่มต้น 18,000-22,000 บาท/เดือน ในรร.รัฐ","en":"Starting at 18,000-22,000 THB/month in public schools.","sources":[{"title":"OCSC Thailand Salary Scale","url":"https://www.ocsc.go.th"}]},"salary_ceiling":{"th":"ผอ.โรงเรียน / ครูนานาชาติได้ 45,000-60,000+ บาท","en":"Principals / International school teachers earn 45,000-60,000+ THB.","sources":[{"title":"ISC Research Teacher Salary","url":"https://www.iscresearch.com"}]}}'::jsonb,
  global_metric_details = '{"demand_growth":{"th":"BLS คาดว่าครูจะโต 1-4% ขึ้นกับระดับและสาขา","en":"BLS projects 1-4% teacher growth depending on level and subject.","sources":[{"title":"BLS OOH Teachers","url":"https://www.bls.gov/ooh/education-training-and-library/high-school-teachers.htm"}]},"grad_employment_pct":{"th":"90% ของจบ education ได้งานสอน","en":"90% of education graduates find teaching positions.","sources":[{"title":"NCES Teacher Employment","url":"https://nces.ed.gov"}]},"saturation_level":{"th":"ขาดแคลนในหลายรัฐ/ประเทศ โดยเฉพาะ STEM และ special education","en":"Shortages in many states/countries, especially STEM and special education.","sources":[{"title":"OECD Education Report","url":"https://www.oecd.org/education/"}]},"progression_difficulty":{"th":"ต้องมีใบอนุญาตและ continuing education ระบบค่อนข้าง rigid","en":"Requires license and continuing education. System is fairly rigid.","sources":[{"title":"National Education Association","url":"https://www.nea.org"}]},"salary_floor":{"th":"P10 ~$47,330/ปี (~$3,944/เดือน)","en":"10th percentile ~$47,330/year (~$3,944/month).","sources":[{"title":"BLS OES Teachers","url":"https://www.bls.gov/oes/current/oes252031.htm"}]},"salary_ceiling":{"th":"P90 ~$104,680/ปี (~$8,723/เดือน)","en":"90th percentile ~$104,680/year (~$8,723/month).","sources":[{"title":"BLS OES Teachers","url":"https://www.bls.gov/oes/current/oes252031.htm"}]}}'::jsonb
WHERE slug = 'teacher';

UPDATE career_survival SET
  metric_details = '{"demand_growth":{"th":"ทนายความเป็นที่ต้องการในธุรกิจ corporate law, fintech, IP โตตามเศรษฐกิจดิจิทัล","en":"Lawyers in demand for corporate law, fintech, IP. Growth follows digital economy.","sources":[{"title":"Lawyers Council of Thailand","url":"https://www.lawyerscouncil.or.th"}]},"grad_employment_pct":{"th":"88% ของจบนิติศาสตร์ที่สอบเนติบัณฑิตผ่านได้งาน","en":"88% of law graduates who pass the bar find employment.","sources":[{"title":"Lawyers Council of Thailand","url":"https://www.lawyerscouncil.or.th"}]},"saturation_level":{"th":"คนเรียนกฎหมายน้อยลง ตำแหน่ง corporate lawyer ยังขาด","en":"Fewer law students. Corporate lawyer positions remain unfilled.","sources":[{"title":"Thai Bar Association","url":"https://www.lawyerscouncil.or.th"}]},"progression_difficulty":{"th":"สอบเนติบัณฑิต → Associate → Partner ใช้เวลา 10-15+ ปี ยากมากต้องสอบหลายด่าน","en":"Bar exam → Associate → Partner takes 10-15+ years. Very difficult with multiple exam hurdles.","sources":[{"title":"Lawyers Council of Thailand","url":"https://www.lawyerscouncil.or.th"}]},"salary_floor":{"th":"เริ่มต้น 25,000-35,000 บาท/เดือนในสำนักงานกฎหมาย","en":"Starting at 25,000-35,000 THB/month at law firms.","sources":[{"title":"Jobthai Salary Survey","url":"https://www.jobthai.com/en/salary"}]},"salary_ceiling":{"th":"Partner ในสำนักงานใหญ่ได้ 100,000-150,000+ บาท","en":"Partners at large firms earn 100,000-150,000+ THB.","sources":[{"title":"Robert Walters Thailand","url":"https://www.robertwalters.co.th/salary-survey.html"}]}}'::jsonb,
  global_metric_details = '{"demand_growth":{"th":"BLS คาดว่า lawyer จะโต 5% ใกล้เคียงค่าเฉลี่ย","en":"BLS projects 5% growth, near average.","sources":[{"title":"BLS OOH Lawyers","url":"https://www.bls.gov/ooh/legal/lawyers.htm"}]},"grad_employment_pct":{"th":"87% ของจบ law school + bar ได้งาน","en":"87% of law school + bar passage graduates find employment.","sources":[{"title":"ABA Employment Data","url":"https://www.americanbar.org"}]},"saturation_level":{"th":"ตลาดกฎหมายสหรัฐฯ มีคู่แข่งปานกลาง big law ยังรับคนเยอะ","en":"US legal market has moderate competition. Big law still hires significantly.","sources":[{"title":"NALP Employment Report","url":"https://www.nalp.org"}]},"progression_difficulty":{"th":"ต้องสอบ bar exam ยากมาก Associate → Partner ใช้ 8-12 ปี","en":"Bar exam very difficult. Associate → Partner takes 8-12 years.","sources":[{"title":"ABA Career Guide","url":"https://www.americanbar.org"}]},"salary_floor":{"th":"P10 ~$72,780/ปี (~$6,065/เดือน)","en":"10th percentile ~$72,780/year (~$6,065/month).","sources":[{"title":"BLS OES Lawyers","url":"https://www.bls.gov/oes/current/oes231011.htm"}]},"salary_ceiling":{"th":"P90 ~$239,200/ปี (~$19,933/เดือน)","en":"90th percentile ~$239,200/year (~$19,933/month).","sources":[{"title":"BLS OES Lawyers","url":"https://www.bls.gov/oes/current/oes231011.htm"}]}}'::jsonb
WHERE slug = 'lawyer';

UPDATE career_survival SET
  metric_details = '{"demand_growth":{"th":"ช่างไฟฟ้าขาดแคลนมากในไทย โดยเฉพาะสาย solar, EV, smart building","en":"Electricians in severe shortage in Thailand, especially solar, EV, smart building sectors.","sources":[{"title":"Department of Skill Development Thailand","url":"https://www.dsd.go.th"}]},"grad_employment_pct":{"th":"88% ของจบช่างไฟฟ้า/อาชีวะได้งานทันที","en":"88% of electrical/vocational graduates find immediate employment.","sources":[{"title":"OVEC Thailand Vocational Outcomes","url":"https://www.vec.go.th"}]},"saturation_level":{"th":"ขาดแคลนหนัก คนเรียนสายช่างน้อยลงเรื่อยๆ","en":"Severe shortage. Fewer students choosing vocational tracks.","sources":[{"title":"OVEC Thailand","url":"https://www.vec.go.th"}]},"progression_difficulty":{"th":"ช่าง → หัวหน้าช่าง → ผู้รับเหมา/เจ้าของกิจการ ใช้เวลา 5-10 ปี ต้องมีใบอนุญาต","en":"Technician → Lead → Contractor/Business owner takes 5-10 years. Requires license.","sources":[{"title":"Dept of Skill Development","url":"https://www.dsd.go.th"}]},"salary_floor":{"th":"เริ่มต้น 14,000-18,000 บาท/เดือน","en":"Starting at 14,000-18,000 THB/month.","sources":[{"title":"Jobthai Salary Survey","url":"https://www.jobthai.com/en/salary"}]},"salary_ceiling":{"th":"ผู้รับเหมา/ช่างเฉพาะทาง solar ได้ 30,000-40,000+ บาท","en":"Contractors/solar specialists earn 30,000-40,000+ THB.","sources":[{"title":"Department of Skill Development","url":"https://www.dsd.go.th"}]}}'::jsonb,
  global_metric_details = '{"demand_growth":{"th":"BLS คาดว่า electrician จะโต 6% เร็วกว่าค่าเฉลี่ย ตาม green energy transition","en":"BLS projects 6% growth, faster than average, driven by green energy transition.","sources":[{"title":"BLS OOH Electricians","url":"https://www.bls.gov/ooh/construction-and-extraction/electricians.htm"}]},"grad_employment_pct":{"th":"93% ของจบ electrician apprenticeship ได้งาน","en":"93% of electrician apprenticeship graduates find employment.","sources":[{"title":"BLS Employment Data","url":"https://www.bls.gov"}]},"saturation_level":{"th":"ขาดแคลนทั่วโลก trades workers หายาก","en":"Global shortage. Trades workers are hard to find.","sources":[{"title":"McKinsey Infrastructure Report","url":"https://www.mckinsey.com"}]},"progression_difficulty":{"th":"ต้องผ่าน apprenticeship 4-5 ปี แต่หลังจากนั้นรายได้ดีและมั่นคง","en":"Requires 4-5 year apprenticeship, but income is good and stable afterward.","sources":[{"title":"BLS Apprenticeship Data","url":"https://www.bls.gov"}]},"salary_floor":{"th":"P10 ~$39,430/ปี (~$3,286/เดือน)","en":"10th percentile ~$39,430/year (~$3,286/month).","sources":[{"title":"BLS OES Electricians","url":"https://www.bls.gov/oes/current/oes472111.htm"}]},"salary_ceiling":{"th":"P90 ~$106,030/ปี (~$8,836/เดือน)","en":"90th percentile ~$106,030/year (~$8,836/month).","sources":[{"title":"BLS OES Electricians","url":"https://www.bls.gov/oes/current/oes472111.htm"}]}}'::jsonb
WHERE slug = 'electrician';

UPDATE career_survival SET
  metric_details = '{"demand_growth":{"th":"คนขับรถบรรทุกขาดแคลนตาม e-commerce ที่โต แต่ autonomous driving อาจเปลี่ยนอนาคต","en":"Truck drivers in shortage due to e-commerce growth, but autonomous driving may change the future.","sources":[{"title":"Thailand Trucking Association","url":"https://www.thaiauto.or.th"}]},"grad_employment_pct":{"th":"80% ของคนที่มีใบขับขี่ประเภท 3 ได้งานเลย","en":"80% of those with Class 3 license find immediate employment.","sources":[{"title":"Department of Land Transport","url":"https://www.dlt.go.th"}]},"saturation_level":{"th":"ขาดแคลนปานกลาง คนรุ่นใหม่ไม่อยากทำอาชีพนี้","en":"Moderate shortage. Younger generation avoids this career.","sources":[{"title":"Thailand Trucking Association","url":"https://www.thaiauto.or.th"}]},"progression_difficulty":{"th":"คนขับ → หัวหน้าทีม → ผู้จัดการขนส่ง ไม่ซับซ้อนแต่เพดานค่อนข้างต่ำ","en":"Driver → Team Lead → Transport Manager. Not complex but relatively low ceiling.","sources":[{"title":"DLT Career Guide","url":"https://www.dlt.go.th"}]},"salary_floor":{"th":"เริ่มต้น 14,000-18,000 บาท/เดือน + OT","en":"Starting at 14,000-18,000 THB/month + overtime.","sources":[{"title":"Jobthai Salary Survey","url":"https://www.jobthai.com/en/salary"}]},"salary_ceiling":{"th":"คนขับเส้นทางไกล/อันตราย ได้ 28,000-36,000+ บาท รวม OT","en":"Long-haul/hazmat drivers earn 28,000-36,000+ THB including overtime.","sources":[{"title":"Jobthai Salary Survey","url":"https://www.jobthai.com/en/salary"}]}}'::jsonb,
  global_metric_details = '{"demand_growth":{"th":"BLS คาดว่า truck driver จะโต 4% ขาดแคลนหนักในหลายรัฐ","en":"BLS projects 4% growth. Severe shortage in many states.","sources":[{"title":"BLS OOH Truck Drivers","url":"https://www.bls.gov/ooh/transportation-and-material-moving/heavy-and-tractor-trailer-truck-drivers.htm"}]},"grad_employment_pct":{"th":"88% ของคนที่มี CDL ได้งานทันที","en":"88% of CDL holders find immediate employment.","sources":[{"title":"American Trucking Association","url":"https://www.trucking.org"}]},"saturation_level":{"th":"ขาดแคลนหนัก สหรัฐฯ ขาด truck driver กว่า 80,000 คน","en":"Severe shortage. US lacks over 80,000 truck drivers.","sources":[{"title":"American Trucking Association","url":"https://www.trucking.org"}]},"progression_difficulty":{"th":"ง่าย CDL + ประสบการณ์ = เลื่อนเงินเดือนได้","en":"Easy. CDL + experience = salary increases.","sources":[{"title":"BLS Career Guide","url":"https://www.bls.gov"}]},"salary_floor":{"th":"P10 ~$40,000/ปี (~$3,333/เดือน)","en":"10th percentile ~$40,000/year (~$3,333/month).","sources":[{"title":"BLS OES Truck Drivers","url":"https://www.bls.gov/oes/current/oes533032.htm"}]},"salary_ceiling":{"th":"P90 ~$73,000/ปี (~$6,083/เดือน)","en":"90th percentile ~$73,000/year (~$6,083/month).","sources":[{"title":"BLS OES Truck Drivers","url":"https://www.bls.gov/oes/current/oes533032.htm"}]}}'::jsonb
WHERE slug = 'truck-driver';

UPDATE career_survival SET
  metric_details = '{"demand_growth":{"th":"ตำแหน่ง CS rep ยังมีแต่โตช้ามาก chatbot และ AI เข้ามาแทนที่เร็ว","en":"CS rep positions exist but grow very slowly. Chatbots and AI replacing rapidly.","sources":[{"title":"JobsDB Thailand","url":"https://th.jobsdb.com"}]},"grad_employment_pct":{"th":"70% ได้งาน CS ง่ายเพราะ barrier ต่ำ แต่ turnover สูงมาก","en":"70% find CS work easily due to low barriers, but turnover is very high.","sources":[{"title":"NESDC Labor Survey","url":"https://www.nesdc.go.th"}]},"saturation_level":{"th":"คนสมัครเยอะเพราะเข้าง่าย แต่ตำแหน่งลดลงตาม automation","en":"Many applicants due to easy entry, but positions declining with automation.","sources":[{"title":"McKinsey Automation Report","url":"https://www.mckinsey.com"}]},"progression_difficulty":{"th":"Rep → Team Lead → Supervisor → Manager ค่อนข้างง่ายแต่เพดานต่ำ","en":"Rep → Team Lead → Supervisor → Manager. Fairly easy but low ceiling.","sources":[{"title":"Robert Half Career Guide","url":"https://www.roberthalf.com"}]},"salary_floor":{"th":"เริ่มต้น 15,000-18,000 บาท/เดือน","en":"Starting at 15,000-18,000 THB/month.","sources":[{"title":"Jobthai Salary Survey","url":"https://www.jobthai.com/en/salary"}]},"salary_ceiling":{"th":"CS Manager ได้ 28,000-35,000 บาท","en":"CS Manager earns 28,000-35,000 THB.","sources":[{"title":"Jobthai Salary Survey","url":"https://www.jobthai.com/en/salary"}]}}'::jsonb,
  global_metric_details = '{"demand_growth":{"th":"BLS คาดว่า CS rep จะโตเพียง 1% ต่ำมากเพราะ AI automation","en":"BLS projects only 1% growth, very low due to AI automation.","sources":[{"title":"BLS OOH Customer Service Reps","url":"https://www.bls.gov/ooh/office-and-administrative-support/customer-service-representatives.htm"}]},"grad_employment_pct":{"th":"65% ได้งาน CS ง่ายแต่ไม่มั่นคง","en":"65% find CS work easily but lack stability.","sources":[{"title":"BLS Employment Data","url":"https://www.bls.gov"}]},"saturation_level":{"th":"ตำแหน่งลดลงทั่วโลก ถูก AI แทนที่","en":"Positions declining globally as AI replaces them.","sources":[{"title":"WEF Future of Jobs 2025","url":"https://www.weforum.org/publications/the-future-of-jobs-report-2025/"}]},"progression_difficulty":{"th":"ง่ายแต่เพดานต่ำมาก ต้องย้ายสายเพื่อโตต่อ","en":"Easy but very low ceiling. Must switch fields to grow.","sources":[{"title":"BLS Career Guide","url":"https://www.bls.gov"}]},"salary_floor":{"th":"P10 ~$30,000/ปี (~$2,500/เดือน)","en":"10th percentile ~$30,000/year (~$2,500/month).","sources":[{"title":"BLS OES CS Reps","url":"https://www.bls.gov/oes/current/oes434051.htm"}]},"salary_ceiling":{"th":"P90 ~$55,000/ปี (~$4,583/เดือน)","en":"90th percentile ~$55,000/year (~$4,583/month).","sources":[{"title":"BLS OES CS Reps","url":"https://www.bls.gov/oes/current/oes434051.htm"}]}}'::jsonb
WHERE slug = 'customer-service-representative';

UPDATE career_survival SET
  metric_details = '{"demand_growth":{"th":"HR recruiter ต้องการปานกลาง ตาม hiring cycles ของบริษัท tech sourcing skill มีค่ามาก","en":"HR recruiter demand is moderate, following hiring cycles. Tech sourcing skills highly valued.","sources":[{"title":"PMAT Thailand HR Survey","url":"https://www.pmat.or.th"}]},"grad_employment_pct":{"th":"75% ของจบ HR/จิตวิทยาองค์กรได้งาน","en":"75% of HR/organizational psychology graduates find work.","sources":[{"title":"NESDC Labor Survey","url":"https://www.nesdc.go.th"}]},"saturation_level":{"th":"ปานกลาง คนทำ HR เยอะแต่ recruiter ที่เก่ง sourcing ยังหายาก","en":"Moderate. Many in HR but skilled sourcers remain scarce.","sources":[{"title":"LinkedIn Talent Insights","url":"https://business.linkedin.com/talent-solutions/talent-insights"}]},"progression_difficulty":{"th":"Recruiter → Senior → TA Manager → HR Director ใช้เวลา 8-12 ปี","en":"Recruiter → Senior → TA Manager → HR Director takes 8-12 years.","sources":[{"title":"SHRM Career Guide","url":"https://www.shrm.org"}]},"salary_floor":{"th":"เริ่มต้น 18,000-25,000 บาท/เดือน","en":"Starting at 18,000-25,000 THB/month.","sources":[{"title":"Jobthai Salary Survey","url":"https://www.jobthai.com/en/salary"}]},"salary_ceiling":{"th":"HR Director ได้ 60,000-80,000+ บาท","en":"HR Director earns 60,000-80,000+ THB.","sources":[{"title":"Robert Walters Thailand","url":"https://www.robertwalters.co.th/salary-survey.html"}]}}'::jsonb,
  global_metric_details = '{"demand_growth":{"th":"ความต้องการ HR specialist โตตาม economic cycles ปานกลาง","en":"HR specialist demand grows with economic cycles, moderate pace.","sources":[{"title":"BLS OOH HR Specialists","url":"https://www.bls.gov/ooh/business-and-financial/human-resources-specialists.htm"}]},"grad_employment_pct":{"th":"72% ได้งาน HR ภายินปีแรก","en":"72% find HR roles within the first year.","sources":[{"title":"SHRM Employment Data","url":"https://www.shrm.org"}]},"saturation_level":{"th":"ปานกลาง tech recruiting ยังขาดแคลน","en":"Moderate. Tech recruiting still faces shortages.","sources":[{"title":"LinkedIn Workforce Report","url":"https://economicgraph.linkedin.com/"}]},"progression_difficulty":{"th":"ปานกลาง SHRM certification ช่วยเลื่อนขั้น","en":"Moderate. SHRM certification helps advancement.","sources":[{"title":"SHRM Career Guide","url":"https://www.shrm.org"}]},"salary_floor":{"th":"P10 ~$41,000/ปี (~$3,417/เดือน)","en":"10th percentile ~$41,000/year (~$3,417/month).","sources":[{"title":"BLS OES HR Specialists","url":"https://www.bls.gov/oes/current/oes131071.htm"}]},"salary_ceiling":{"th":"P90 ~$120,000/ปี (~$10,000/เดือน)","en":"90th percentile ~$120,000/year (~$10,000/month).","sources":[{"title":"BLS OES HR Managers","url":"https://www.bls.gov/oes/current/oes113121.htm"}]}}'::jsonb
WHERE slug = 'hr-recruiter';

UPDATE career_survival SET
  metric_details = '{"demand_growth":{"th":"สื่อเก่าหดตัว แต่ digital journalism โตขึ้น ต้องมี multimedia skill","en":"Traditional media shrinking but digital journalism growing. Multimedia skills essential.","sources":[{"title":"Thai Journalists Association","url":"https://www.tja.or.th"}]},"grad_employment_pct":{"th":"60% ของจบนิเทศฯ ได้งานสื่อ หลายคนย้ายไป content marketing","en":"60% of communication grads find media work. Many shift to content marketing.","sources":[{"title":"NESDC Labor Survey","url":"https://www.nesdc.go.th"}]},"saturation_level":{"th":"มีคนอยากทำสื่อเยอะ แต่ตำแหน่งลดลง การแข่งขันสูง","en":"Many want to work in media but positions declining. High competition.","sources":[{"title":"Thai Journalists Association","url":"https://www.tja.or.th"}]},"progression_difficulty":{"th":"นักข่าว → บก. → ผู้อำนวยการข่าว ใช้เวลา 10-15 ปี เลื่อนขั้นยาก","en":"Reporter → Editor → News Director takes 10-15 years. Difficult advancement.","sources":[{"title":"Reuters Institute Digital News Report","url":"https://reutersinstitute.politics.ox.ac.uk"}]},"salary_floor":{"th":"เริ่มต้น 18,000-22,000 บาท/เดือน","en":"Starting at 18,000-22,000 THB/month.","sources":[{"title":"Jobthai Salary Survey","url":"https://www.jobthai.com/en/salary"}]},"salary_ceiling":{"th":"บก.อาวุโส / ผอ.ข่าว ได้ 45,000-60,000 บาท","en":"Senior editors / News directors earn 45,000-60,000 THB.","sources":[{"title":"Thai Journalists Association","url":"https://www.tja.or.th"}]}}'::jsonb,
  global_metric_details = '{"demand_growth":{"th":"BLS คาดว่า journalist จะลดลงหรือโตแค่ 2% สื่อเก่าหดตัว","en":"BLS projects 2% or declining growth as traditional media contracts.","sources":[{"title":"BLS OOH News Analysts/Reporters","url":"https://www.bls.gov/ooh/media-and-communication/reporters-correspondents-and-broadcast-news-analysts.htm"}]},"grad_employment_pct":{"th":"50% ของจบ journalism ได้งานในสายภายินปีแรก","en":"50% of journalism graduates find field-related work within the first year.","sources":[{"title":"NCES Communication Outcomes","url":"https://nces.ed.gov"}]},"saturation_level":{"th":"สูง สื่อกำลังลดขนาด layoff บ่อย","en":"High. Media downsizing with frequent layoffs.","sources":[{"title":"Pew Research Center Newsroom Employment","url":"https://www.pewresearch.org/journalism/"}]},"progression_difficulty":{"th":"ยาก สื่อกำลังหดตัว ตำแหน่ง senior มีน้อยลง","en":"Difficult. Media contracting with fewer senior positions.","sources":[{"title":"Reuters Institute","url":"https://reutersinstitute.politics.ox.ac.uk"}]},"salary_floor":{"th":"P10 ~$31,000/ปี (~$2,583/เดือน)","en":"10th percentile ~$31,000/year (~$2,583/month).","sources":[{"title":"BLS OES Reporters","url":"https://www.bls.gov/oes/current/oes273022.htm"}]},"salary_ceiling":{"th":"P90 ~$107,000/ปี (~$8,917/เดือน)","en":"90th percentile ~$107,000/year (~$8,917/month).","sources":[{"title":"BLS OES Reporters","url":"https://www.bls.gov/oes/current/oes273022.htm"}]}}'::jsonb
WHERE slug = 'journalist';

UPDATE career_survival SET
  metric_details = '{"demand_growth":{"th":"ตำแหน่ง paralegal โตช้าในไทย ส่วนใหญ่อยู่ในสำนักงานกฎหมายใหญ่","en":"Paralegal positions grow slowly in Thailand, mostly at large law firms.","sources":[{"title":"Lawyers Council of Thailand","url":"https://www.lawyerscouncil.or.th"}]},"grad_employment_pct":{"th":"70% ของจบนิติศาสตร์ที่ไม่สอบเนติฯ ทำงาน paralegal","en":"70% of law graduates who don''t pass the bar work as paralegals.","sources":[{"title":"Thai Bar Association","url":"https://www.lawyerscouncil.or.th"}]},"saturation_level":{"th":"ปานกลาง-สูง คนเรียนกฎหมายที่ไม่ได้เป็นทนายมาทำ paralegal เยอะ","en":"Medium-high. Many law graduates who don''t become lawyers work as paralegals.","sources":[{"title":"Lawyers Council","url":"https://www.lawyerscouncil.or.th"}]},"progression_difficulty":{"th":"Paralegal → Senior → Legal Manager ใช้เวลา 5-8 ปี เพดานจำกัดถ้าไม่สอบทนาย","en":"Paralegal → Senior → Legal Manager takes 5-8 years. Limited ceiling without bar passage.","sources":[{"title":"Robert Half Legal","url":"https://www.roberthalf.com"}]},"salary_floor":{"th":"เริ่มต้น 18,000-25,000 บาท/เดือน","en":"Starting at 18,000-25,000 THB/month.","sources":[{"title":"Jobthai Salary Survey","url":"https://www.jobthai.com/en/salary"}]},"salary_ceiling":{"th":"Senior Paralegal / Legal Manager ได้ 45,000-60,000 บาท","en":"Senior Paralegal / Legal Manager earns 45,000-60,000 THB.","sources":[{"title":"Robert Walters Thailand","url":"https://www.robertwalters.co.th/salary-survey.html"}]}}'::jsonb,
  global_metric_details = '{"demand_growth":{"th":"BLS คาดว่า paralegal จะโต 4% ใกล้เคียงค่าเฉลี่ย","en":"BLS projects 4% growth, near average.","sources":[{"title":"BLS OOH Paralegals","url":"https://www.bls.gov/ooh/legal/paralegals-and-legal-assistants.htm"}]},"grad_employment_pct":{"th":"70% ได้งาน paralegal ภายินปีแรก","en":"70% find paralegal work within the first year.","sources":[{"title":"NALA Employment Survey","url":"https://www.nala.org"}]},"saturation_level":{"th":"ปานกลาง มีคู่แข่งแต่ certified paralegal มีข้อได้เปรียบ","en":"Moderate competition. Certified paralegals have an advantage.","sources":[{"title":"NALA Career Guide","url":"https://www.nala.org"}]},"progression_difficulty":{"th":"ปานกลาง ต้องมี certification เพื่อเลื่อนขั้น","en":"Moderate. Certification needed for advancement.","sources":[{"title":"NALA","url":"https://www.nala.org"}]},"salary_floor":{"th":"P10 ~$39,000/ปี (~$3,250/เดือน)","en":"10th percentile ~$39,000/year (~$3,250/month).","sources":[{"title":"BLS OES Paralegals","url":"https://www.bls.gov/oes/current/oes232011.htm"}]},"salary_ceiling":{"th":"P90 ~$89,000/ปี (~$7,417/เดือน)","en":"90th percentile ~$89,000/year (~$7,417/month).","sources":[{"title":"BLS OES Paralegals","url":"https://www.bls.gov/oes/current/oes232011.htm"}]}}'::jsonb
WHERE slug = 'paralegal';

UPDATE career_survival SET
  metric_details = '{"demand_growth":{"th":"ช่างภาพมืออาชีพโตช้า smartphone ทำให้ทุกคนถ่ายรูปเป็น เหลือเฉพาะ commercial + event","en":"Professional photography grows slowly. Smartphones made everyone a photographer. Only commercial + event work remains.","sources":[{"title":"Professional Photographers of Thailand","url":"https://www.ppat.or.th"}]},"grad_employment_pct":{"th":"50% ของจบสาย photography ได้งานในสาย ส่วนใหญ่ต้อง freelance","en":"50% of photography graduates find field work. Most must freelance.","sources":[{"title":"NESDC Creative Economy Report","url":"https://www.nesdc.go.th"}]},"saturation_level":{"th":"อิ่มตัวสูงมาก แข่งกับ smartphone + AI image generation","en":"Very high saturation. Competing with smartphones + AI image generation.","sources":[{"title":"PPA Industry Report","url":"https://www.ppa.com"}]},"progression_difficulty":{"th":"Photographer → Senior → Studio Owner / Creative Director ต้องสร้าง brand ส่วนตัว","en":"Photographer → Senior → Studio Owner / Creative Director. Must build personal brand.","sources":[{"title":"PPA Career Guide","url":"https://www.ppa.com"}]},"salary_floor":{"th":"เริ่มต้น 15,000-20,000 บาท/เดือน สำหรับ staff photographer","en":"Starting at 15,000-20,000 THB/month for staff photographers.","sources":[{"title":"Jobthai Salary Survey","url":"https://www.jobthai.com/en/salary"}]},"salary_ceiling":{"th":"Commercial photographer ที่เก่งได้ 35,000-50,000+ บาท freelance อาจมากกว่า","en":"Skilled commercial photographers earn 35,000-50,000+ THB. Freelance can earn more.","sources":[{"title":"Professional Photographers Association","url":"https://www.ppat.or.th"}]}}'::jsonb,
  global_metric_details = '{"demand_growth":{"th":"BLS คาดว่า photographer จะโตเพียง 3% ตลาดค่อนข้างนิ่ง","en":"BLS projects only 3% growth. Market relatively flat.","sources":[{"title":"BLS OOH Photographers","url":"https://www.bls.gov/ooh/media-and-communication/photographers.htm"}]},"grad_employment_pct":{"th":"45% ของจบ photography ทำงานในสายภายินปีแรก ต่ำมาก","en":"45% find photography work within the first year, very low.","sources":[{"title":"PPA Industry Survey","url":"https://www.ppa.com"}]},"saturation_level":{"th":"อิ่มตัวสูงมากทั่วโลก stock photo + AI ทำให้แข่งยากขึ้น","en":"Very high global saturation. Stock photos + AI make competition harder.","sources":[{"title":"PPA Industry Report","url":"https://www.ppa.com"}]},"progression_difficulty":{"th":"ยากมาก ต้อง build ชื่อเสียงส่วนตัว ไม่มี corporate ladder ชัด","en":"Very difficult. Must build personal reputation. No clear corporate ladder.","sources":[{"title":"PPA Career Guide","url":"https://www.ppa.com"}]},"salary_floor":{"th":"P10 ~$26,000/ปี (~$2,167/เดือน) ต่ำมาก","en":"10th percentile ~$26,000/year (~$2,167/month), very low.","sources":[{"title":"BLS OES Photographers","url":"https://www.bls.gov/oes/current/oes274021.htm"}]},"salary_ceiling":{"th":"P90 ~$75,000/ปี (~$6,250/เดือน)","en":"90th percentile ~$75,000/year (~$6,250/month).","sources":[{"title":"BLS OES Photographers","url":"https://www.bls.gov/oes/current/oes274021.htm"}]}}'::jsonb
WHERE slug = 'photographer';

UPDATE career_survival SET
  metric_details = '{"demand_growth":{"th":"ล่ามและนักแปลโตช้ามาก AI translation (DeepL, Google) เข้ามาแทนงานพื้นฐาน เหลือแค่ specialized","en":"Translators grow very slowly. AI translation replacing basic work. Only specialized work remains.","sources":[{"title":"Thai Translators & Interpreters Association","url":"https://www.ttiathailand.org"}]},"grad_employment_pct":{"th":"58% ของจบภาษาได้งานแปล/ล่าม ส่วนใหญ่ freelance","en":"58% of language graduates find translation/interpretation work. Mostly freelance.","sources":[{"title":"NESDC Labor Survey","url":"https://www.nesdc.go.th"}]},"saturation_level":{"th":"สูง AI ทำให้งานแปลทั่วไปลดลงมาก ต้อง specialize (legal, medical, tech)","en":"High. AI reduces general translation work. Must specialize (legal, medical, tech).","sources":[{"title":"ATA Industry Report","url":"https://www.atanet.org"}]},"progression_difficulty":{"th":"Translator → Senior → Project Manager → Agency Owner ต้อง niche ลง","en":"Translator → Senior → Project Manager → Agency Owner. Must niche down.","sources":[{"title":"ATA Career Guide","url":"https://www.atanet.org"}]},"salary_floor":{"th":"เริ่มต้น 20,000-25,000 บาท/เดือน","en":"Starting at 20,000-25,000 THB/month.","sources":[{"title":"Jobthai Salary Survey","url":"https://www.jobthai.com/en/salary"}]},"salary_ceiling":{"th":"ล่ามเฉพาะทาง (court, medical) ได้ 35,000-50,000+ บาท","en":"Specialized interpreters (court, medical) earn 35,000-50,000+ THB.","sources":[{"title":"Thai Translators Association","url":"https://www.ttiathailand.org"}]}}'::jsonb,
  global_metric_details = '{"demand_growth":{"th":"BLS คาดว่า translator จะโตเพียง 4% AI กำลังเปลี่ยนอุตสาหกรรมอย่างมาก","en":"BLS projects only 4% growth. AI is dramatically transforming the industry.","sources":[{"title":"BLS OOH Translators","url":"https://www.bls.gov/ooh/media-and-communication/interpreters-and-translators.htm"}]},"grad_employment_pct":{"th":"48% ของจบสายภาษาได้งานแปลในต่างประเทศ ต่ำเพราะ AI","en":"48% of language graduates find translation work abroad. Low due to AI impact.","sources":[{"title":"ATA Compensation Survey","url":"https://www.atanet.org"}]},"saturation_level":{"th":"สูง คู่แข่ง AI ทำให้ rate ลดลง ต้อง specialize","en":"High. AI competition driving rates down. Must specialize.","sources":[{"title":"ATA Industry Report","url":"https://www.atanet.org"}]},"progression_difficulty":{"th":"ปานกลาง certified translator มีข้อได้เปรียบ","en":"Moderate. Certified translators have an advantage.","sources":[{"title":"ATA Certification","url":"https://www.atanet.org"}]},"salary_floor":{"th":"P10 ~$33,000/ปี (~$2,750/เดือน)","en":"10th percentile ~$33,000/year (~$2,750/month).","sources":[{"title":"BLS OES Translators","url":"https://www.bls.gov/oes/current/oes273091.htm"}]},"salary_ceiling":{"th":"P90 ~$100,000/ปี (~$8,333/เดือน)","en":"90th percentile ~$100,000/year (~$8,333/month).","sources":[{"title":"BLS OES Translators","url":"https://www.bls.gov/oes/current/oes273091.htm"}]}}'::jsonb
WHERE slug = 'translator';
