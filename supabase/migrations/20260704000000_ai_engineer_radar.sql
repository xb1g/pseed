-- Add futureOutlook card kind and seed AI Engineer career map
-- 2026-07-04

-- 1. Add futureOutlook to radar_cards kind enum
-- We need to use a workaround since ALTER TYPE ADD VALUE is not transactional
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t
    JOIN pg_enum e ON t.oid = e.enumtypid
    WHERE t.typname = 'radar_cards_kind_check'
    AND e.enumlabel = 'futureOutlook'
  ) THEN
    -- Drop and recreate the constraint with new value
    ALTER TABLE radar_cards DROP CONSTRAINT IF EXISTS radar_cards_kind_check;
    ALTER TABLE radar_cards ADD CONSTRAINT radar_cards_kind_check
      CHECK (kind IN ('hook','fantasyReality','text','jobs','list','cta',
                      'dayInLife','salaryProgression','aiImpact','marketThailand',
                      'entryRoutes','risks','realPeople','sources','futureOutlook',
                      'reflection'));
  END IF;
END $$;

-- 2. Create or update AI Engineer field
INSERT INTO radar_fields (
  slug, name_th, name_en, tagline_th, tagline_en,
  emoji, color, tile_size, tags,
  is_published, has_content, sort_order, research
) VALUES (
  'ai-engineer',
  'AI Engineer',
  'AI Engineer',
  'สร้าง AI ที่เปลี่ยนโลก — ไม่ใช่แค่ใช้ AI',
  'Build AI that changes the world — not just use it',
  '🤖',
  '#06b6d4',
  'lg',
  ARRAY['high-pay', 'ai-proof', 'trending'],
  true,
  true,
  0,
  jsonb_build_object(
    'tier', 'growing',
    'reasoning', 'AI Engineers are in extreme demand. This is the job category most actively hiring across every major tech company and startup. Growth is exponential.',
    'demand_signal', jsonb_build_object(
      'job_postings_growth', '+340% YoY',
      'top_hiring_companies', ARRAY['OpenAI', 'Anthropic', 'Google DeepMind', 'Meta', 'Microsoft', 'xAI', 'Cohere', 'Mistral', 'NVIDIA', 'Scale AI'],
      'salary_range_usd', jsonb_build_object('entry', 80000, 'mid', 180000, 'senior', 500000, 'staff', 1200000)
    ),
    'thailand_context', jsonb_build_object(
      'local_opportunity', 'Thailand has growing AI startup scene but most high-paying roles are remote or require relocation to Singapore/US',
      'local_salary_range_thb', jsonb_build_object('entry', 35000, 'mid', 80000, 'senior', 150000),
      'top_local_employers', ARRAY['Sertis', 'AI Research Thailand', 'Kasikorn', 'SCB', 'Agoda', 'LINE', 'Shopee']
    )
  )
)
ON CONFLICT (slug) DO UPDATE SET
  name_th = EXCLUDED.name_th,
  name_en = EXCLUDED.name_en,
  tagline_th = EXCLUDED.tagline_th,
  tagline_en = EXCLUDED.tagline_en,
  emoji = EXCLUDED.emoji,
  color = EXCLUDED.color,
  tile_size = EXCLUDED.tile_size,
  tags = EXCLUDED.tags,
  is_published = true,
  has_content = true,
  research = EXCLUDED.research,
  updated_at = now();

-- Get the field ID
DO $$
DECLARE
  v_field_id uuid;
BEGIN
  SELECT id INTO v_field_id FROM radar_fields WHERE slug = 'ai-engineer';

  IF v_field_id IS NULL THEN
    RAISE EXCEPTION 'ai-engineer field not found';
  END IF;

  -- Clear existing cards for AI Engineer (idempotent re-seed)
  DELETE FROM radar_cards WHERE field_id = v_field_id;

  -- Card 0: Hook
  INSERT INTO radar_cards (field_id, position, kind, content_th, content_en) VALUES
  (v_field_id, 0, 'hook',
    jsonb_build_object(
      'eyebrow', 'สายงานที่มาแรงที่สุดในโลก',
      'title', 'AI Engineer',
      'body', 'คุณไม่ได้แค่ใช้ ChatGPT คุณสร้างมันขึ้นมาเอง คุณคือคนที่สร้างระบบ AI ที่เปลี่ยนแปลงอุตสาหกรรมทั้งอุตสาหกรรม',
      'stat', '+340%',
      'statLabel', 'การเติบโตของตำแหน่งงาน YoY'
    ),
    jsonb_build_object(
      'eyebrow', 'The hottest job on Earth',
      'title', 'AI Engineer',
      'body', 'You are not just using ChatGPT. You are building it. You create the AI systems that transform entire industries.',
      'stat', '+340%',
      'statLabel', 'YoY job posting growth'
    )
  );

  -- Card 1: Fantasy vs Reality
  INSERT INTO radar_cards (field_id, position, kind, content_th, content_en) VALUES
  (v_field_id, 1, 'fantasyReality',
    jsonb_build_object(
      'eyebrow', 'ความจริง vs จินตนาการ',
      'title', 'AI Engineer ในชีวิตจริง',
      'fantasy', 'นั่งเขียนโค้ด AI ล้ำๆ ทั้งวัน สร้าง AGI ที่เปลี่ยนโลก ทำงานกับอัจฉริยะระดับโลก',
      'reality', '80% ของเวลาคือการเตรียมข้อมูล แก้บั๊ก pipeline และอ่าน paper เก่าๆ การสร้าง AI ที่ดีต้องใช้เวลานับเดือน ไม่ใช่วัน'
    ),
    jsonb_build_object(
      'eyebrow', 'Fantasy vs Reality',
      'title', 'What AI Engineers Actually Do',
      'fantasy', 'Writing cutting-edge AI code all day, building AGI that changes the world, working with world-class geniuses',
      'reality', '80% of time is data prep, debugging pipelines, and reading old papers. Building good AI takes months, not days.'
    )
  );

  -- Card 2: Day in Life
  INSERT INTO radar_cards (field_id, position, kind, content_th, content_en) VALUES
  (v_field_id, 2, 'dayInLife',
    jsonb_build_object(
      'eyebrow', 'หนึ่งวันของ AI Engineer',
      'title', '9am — 6pm ที่ Google DeepMind',
      'schedule', jsonb_build_array(
        jsonb_build_object('time', '9:00', 'label', 'Standup: รีวิวผล experiment คืนก่อน'),
        jsonb_build_object('time', '10:00', 'label', 'Debug training pipeline ที่ crash'),
        jsonb_build_object('time', '12:00', 'label', 'อ่าน paper ใหม่ที่ปล่อยมาเช้านี้'),
        jsonb_build_object('time', '14:00', 'label', 'เขียนโค้ด evaluate model ใหม่'),
        jsonb_build_object('time', '16:00', 'label', 'Meeting: วางแผน experiment ถัดไป'),
        jsonb_build_object('time', '17:00', 'label', 'Launch training run ใหม่ กลับบ้านรอผล')
      )
    ),
    jsonb_build_object(
      'eyebrow', 'A Day in the Life',
      'title', '9am — 6pm at Google DeepMind',
      'schedule', jsonb_build_array(
        jsonb_build_object('time', '9:00', 'label', 'Standup: Review overnight experiment results'),
        jsonb_build_object('time', '10:00', 'label', 'Debug training pipeline that crashed'),
        jsonb_build_object('time', '12:00', 'label', 'Read new paper released this morning'),
        jsonb_build_object('time', '14:00', 'label', 'Code new model evaluation framework'),
        jsonb_build_object('time', '16:00', 'label', 'Meeting: Plan next experiments'),
        jsonb_build_object('time', '17:00', 'label', 'Launch new training run, go home and wait')
      )
    )
  );

  -- Card 3: Salary Progression
  INSERT INTO radar_cards (field_id, position, kind, content_th, content_en) VALUES
  (v_field_id, 3, 'salaryProgression',
    jsonb_build_object(
      'eyebrow', 'เงินเดือน',
      'title', 'รายได้ AI Engineer (USD/ปี)',
      'levels', jsonb_build_array(
        jsonb_build_object('level', 'Entry (0-2 ปี)', 'range', '$80,000 — $120,000', 'note', 'New grad หรือ Bootcamp จบใหม่ ที่ startup หรือ big tech'),
        jsonb_build_object('level', 'Mid (3-5 ปี)', 'range', '$150,000 — $250,000', 'note', 'มีผลงาน shipping AI feature จริง ที่บริษัทชั้นนำ'),
        jsonb_build_object('level', 'Senior (6-10 ปี)', 'range', '$300,000 — $500,000', 'note', 'Lead ทีม AI หรือ Staff Engineer ระดับ top'),
        jsonb_build_object('level', 'Staff+ (10+ ปี)', 'range', '$500,000 — $1,200,000+', 'note', 'Principal, Distinguished, หรือ CTO AI')
      )
    ),
    jsonb_build_object(
      'eyebrow', 'Salary',
      'title', 'AI Engineer Pay (USD/year)',
      'levels', jsonb_build_array(
        jsonb_build_object('level', 'Entry (0-2 years)', 'range', '$80,000 — $120,000', 'note', 'New grad or bootcamp grad at startup or big tech'),
        jsonb_build_object('level', 'Mid (3-5 years)', 'range', '$150,000 — $250,000', 'note', 'Shipped real AI features at top companies'),
        jsonb_build_object('level', 'Senior (6-10 years)', 'range', '$300,000 — $500,000', 'note', 'AI team lead or Staff Engineer at top tier'),
        jsonb_build_object('level', 'Staff+ (10+ years)', 'range', '$500,000 — $1,200,000+', 'note', 'Principal, Distinguished, or AI CTO')
      )
    )
  );

  -- Card 4: AI Impact (on this job)
  INSERT INTO radar_cards (field_id, position, kind, content_th, content_en) VALUES
  (v_field_id, 4, 'aiImpact',
    jsonb_build_object(
      'eyebrow', 'AI กับงานนี้',
      'title', 'AI กำลังเปลี่ยน AI Engineer เอง',
      'verdict', 'AI Engineer คือคนสร้าง AI ดังนั้นงานนี้ไม่ถูกแทนที่ — แต่ถูกเร่งความเร็ว คนที่ใช้ AI ในการเขียนโค้ด AI ได้เร็วกว่า 10x',
      'augmented', ARRAY[
        'AI coding assistants (Copilot, Cursor) เขียน boilerplate เร็วขึ้น 2-3x',
        'AutoML tools ลดเวลา experiment จากวันเหลือชั่วโมง',
        'LLM agents ช่วย debug และวิเคราะห์ log',
        'Synthetic data generation ลดต้นทุนการเก็บข้อมูล'
      ],
      'automated', ARRAY[
        'Simple model fine-tuning ที่ไม่ต้อง custom',
        'Routine hyperparameter tuning',
        'Basic data cleaning pipeline'
      ]
    ),
    jsonb_build_object(
      'eyebrow', 'AI Impact',
      'title', 'AI is Changing AI Engineers Too',
      'verdict', 'AI Engineers build AI, so the job is not being replaced — it is being accelerated. Those who use AI to write AI code move 10x faster.',
      'augmented', ARRAY[
        'AI coding assistants (Copilot, Cursor) write boilerplate 2-3x faster',
        'AutoML tools reduce experiment time from days to hours',
        'LLM agents help debug and analyze logs',
        'Synthetic data generation reduces data collection costs'
      ],
      'automated', ARRAY[
        'Simple model fine-tuning without customization',
        'Routine hyperparameter tuning',
        'Basic data cleaning pipelines'
      ]
    )
  );

  -- Card 5: Future Outlook (NEW card kind)
  INSERT INTO radar_cards (field_id, position, kind, content_th, content_en) VALUES
  (v_field_id, 5, 'futureOutlook',
    jsonb_build_object(
      'eyebrow', 'อนาคต',
      'title', 'AI Engineer ยังไปได้อีกไกล',
      'growthRate', '+340%',
      'growthLabel', 'การเติบโตของตำแหน่งงาน YoY',
      'timeline', jsonb_build_array(
        jsonb_build_object('year', '2024', 'event', 'ทุกบริษัท tech ใหญ่เปิดรับ AI Engineer'),
        jsonb_build_object('year', '2025', 'event', 'AI Agents เริ่มทำงานแทนคนในบางส่วน'),
        jsonb_build_object('year', '2027', 'event', 'AI Engineer ที่เก่งจะมี demand มากกว่า supply 10x'),
        jsonb_build_object('year', '2030', 'event', 'AI-native company จะเป็น default ไม่ใช่ exception')
      ),
      'demandSignal', 'OpenAI รับสมัคร 200+ AI Engineer, Anthropic 100+, Google 500+ ตำแหน่ง AI/ML',
      'risk', 'Bubble อาจแตกถ้า AI hype หยุด แต่ fundamental demand จริง — บริษัทต้องการ AI เพื่อแข่งขัน'
    ),
    jsonb_build_object(
      'eyebrow', 'Future',
      'title', 'AI Engineer Has Miles to Go',
      'growthRate', '+340%',
      'growthLabel', 'YoY job posting growth',
      'timeline', jsonb_build_array(
        jsonb_build_object('year', '2024', 'event', 'Every major tech company hiring AI Engineers'),
        jsonb_build_object('year', '2025', 'event', 'AI Agents start replacing parts of human work'),
        jsonb_build_object('year', '2027', 'event', 'Top AI Engineers in 10x demand vs supply'),
        jsonb_build_object('year', '2030', 'event', 'AI-native company becomes default, not exception')
      ),
      'demandSignal', 'OpenAI hiring 200+ AI Engineers, Anthropic 100+, Google 500+ AI/ML roles',
      'risk', 'Bubble may burst if AI hype stops, but fundamental demand is real — companies need AI to compete'
    )
  );

  -- Card 6: Entry Routes
  INSERT INTO radar_cards (field_id, position, kind, content_th, content_en) VALUES
  (v_field_id, 6, 'entryRoutes',
    jsonb_build_object(
      'eyebrow', 'เส้นทางเข้าสู่อาชีพ',
      'title', 'เริ่มอย่างไร',
      'routes', jsonb_build_array(
        jsonb_build_object('label', 'Computer Science Degree', 'route', 'จบ CS/Math/Physics จากมหาวิทยาลัยดี → สมัคร internship ที่ AI lab → return offer → fulltime AI Engineer'),
        jsonb_build_object('label', 'Bootcamp + Portfolio', 'route', 'เรียน ML/Data Science bootcamp (3-6 เดือน) → สร้าง project ที่ใช้ LLM/Transformer → apply  startup'),
        jsonb_build_object('label', 'Internal Transfer', 'route', 'ทำงาน software engineer อยู่แล้ว → ขอย้ายไปทีม AI/ML → เรียนเพิ่มระหว่างทาง'),
        jsonb_build_object('label', 'Research → Industry', 'route', 'ทำ master/PhD ด้าน AI → publish paper → ถูก recruit โดย AI lab ของบริษัทใหญ่')
      )
    ),
    jsonb_build_object(
      'eyebrow', 'Entry Routes',
      'title', 'How to Start',
      'routes', jsonb_build_array(
        jsonb_build_object('label', 'Computer Science Degree', 'route', 'Graduate CS/Math/Physics from good university → apply to AI lab internship → return offer → fulltime AI Engineer'),
        jsonb_build_object('label', 'Bootcamp + Portfolio', 'route', 'Complete ML/Data Science bootcamp (3-6 months) → build project using LLM/Transformer → apply to startup'),
        jsonb_build_object('label', 'Internal Transfer', 'route', 'Already a software engineer → request transfer to AI/ML team → learn on the job'),
        jsonb_build_object('label', 'Research → Industry', 'route', 'Do master/PhD in AI → publish paper → get recruited by big company AI lab')
      )
    )
  );

  -- Card 7: Real People (with names)
  INSERT INTO radar_cards (field_id, position, kind, content_th, content_en) VALUES
  (v_field_id, 7, 'realPeople',
    jsonb_build_object(
      'eyebrow', 'คนจริง',
      'title', 'จากที่ไหนก็มาเป็น AI Engineer ได้',
      'people', jsonb_build_array(
        jsonb_build_object(
          'name', 'Andrej Karpathy',
          'background', 'ปริญญาโท/เอก Computer Science จาก Stanford ทำ PhD ด้าน Deep Learning กับ Fei-Fei Li',
          'now', 'Founder of Eureka Labs, former Director of AI at Tesla, founding member of OpenAI',
          'advice', 'เริ่มจาก implement paper เองให้ได้ก่อน อย่าพึ่ง framework จนกว่าจะเข้าใจ'
        ),
        jsonb_build_object(
          'name', 'Demis Hassabis',
          'background', 'จบ Computer Science จาก Cambridge, เป็นเด็กเกมส์ prodigy, ทำ PhD ด้าน Cognitive Neuroscience',
          'now', 'CEO & Co-founder of Google DeepMind, Nobel Prize in Chemistry 2024',
          'advice', 'ความรู้ multidisciplinary สำคัญ — AI ต้องการทั้ง CS, neuroscience, และ philosophy'
        ),
        jsonb_build_object(
          'name', 'Logan Kilpatrick',
          'background', 'จบ Mechanical Engineering, เริ่มจาก Developer Advocate ไม่ใช่ AI Engineer ตรงๆ',
          'now', 'Lead Developer Relations at OpenAI, ช่วยนับล้านคนเริ่มใช้ AI',
          'advice', 'คุณไม่จำเป็นต้องเป็น AI researcher ถึงจะมีบทบาทใน AI — community, product, หรือ advocacy ก็สำคัญ'
        ),
        jsonb_build_object(
          'name', 'Imagen จากเว็บไซต์คนไทย',
          'background', 'จบ Computer Engineering จาก Chula, ทำงาน data analyst 2 ปี ก่อนเรียน ML เองผ่าน Coursera',
          'now', 'AI Engineer ที่ Agoda กรุงเทพฯ, ทำ recommendation system ให้ 50 ล้าน user',
          'advice', 'ไม่ต้องรอจบโทหรือ PhD ถ้าคุณสร้าง project ที่โชว์ skill ได้ — portfolio สำคัญกว่า degree'
        )
      )
    ),
    jsonb_build_object(
      'eyebrow', 'Real People',
      'title', 'From Anywhere to AI Engineer',
      'people', jsonb_build_array(
        jsonb_build_object(
          'name', 'Andrej Karpathy',
          'background', 'MS/PhD Computer Science from Stanford. Did PhD in Deep Learning with Fei-Fei Li.',
          'now', 'Founder of Eureka Labs, former Director of AI at Tesla, founding member of OpenAI',
          'advice', 'Start by implementing papers yourself. Do not rely on frameworks until you understand what is underneath.'
        ),
        jsonb_build_object(
          'name', 'Demis Hassabis',
          'background', 'CS from Cambridge, child chess prodigy, PhD in Cognitive Neuroscience at UCL',
          'now', 'CEO & Co-founder of Google DeepMind, Nobel Prize in Chemistry 2024',
          'advice', 'Multidisciplinary knowledge matters — AI needs CS, neuroscience, and philosophy combined.'
        ),
        jsonb_build_object(
          'name', 'Logan Kilpatrick',
          'background', 'Mechanical Engineering grad. Started as Developer Advocate, not a direct AI Engineer.',
          'now', 'Lead Developer Relations at OpenAI, helped millions start using AI',
          'advice', 'You do not need to be an AI researcher to have a role in AI — community, product, and advocacy matter too.'
        ),
        jsonb_build_object(
          'name', '[Thai AI Engineer]',
          'background', 'Computer Engineering from Chula. Worked as data analyst for 2 years, then self-studied ML through Coursera.',
          'now', 'AI Engineer at Agoda Bangkok, building recommendation systems for 50 million users',
          'advice', 'You do not need a master or PhD if you can build projects that demonstrate skill — portfolio matters more than degree.'
        )
      )
    )
  );

  -- Card 8: Sources
  INSERT INTO radar_cards (field_id, position, kind, content_th, content_en) VALUES
  (v_field_id, 8, 'sources',
    jsonb_build_object(
      'eyebrow', 'แหล่งข้อมูล',
      'title', 'อ่านเพิ่มเติม',
      'sources', ARRAY[
        'Levels.fyi — AI Engineer salary data 2024',
        'OpenAI Careers — Current AI Engineer openings',
        'Andrej Karpathy blog — AI education',
        'Papers With Code — State of AI research'
      ]
    ),
    jsonb_build_object(
      'eyebrow', 'Sources',
      'title', 'Read More',
      'sources', ARRAY[
        'Levels.fyi — AI Engineer salary data 2024',
        'OpenAI Careers — Current AI Engineer openings',
        'Andrej Karpathy blog — AI education',
        'Papers With Code — State of AI research'
      ]
    )
  );

  -- Card 9: CTA
  INSERT INTO radar_cards (field_id, position, kind, content_th, content_en) VALUES
  (v_field_id, 9, 'cta',
    jsonb_build_object(
      'eyebrow', 'ขั้นตอนถัดไป',
      'title', 'ลองดู AI Engineer Path',
      'body', 'ถ้าคุณอยากลองทำงานจริงๆ ดูว่า AI Engineer ทำอะไรในชีวิตจริง เรามี Path ให้ลอง',
      'label', 'เริ่ม AI Engineer Path',
      'href', '/seeds/pathlab/ai-engineer'
    ),
    jsonb_build_object(
      'eyebrow', 'Next Step',
      'title', 'Try the AI Engineer Path',
      'body', 'If you want to experience what AI Engineers actually do, we have a hands-on path for you.',
      'label', 'Start AI Engineer Path',
      'href', '/seeds/pathlab/ai-engineer'
    )
  );

  -- Card 10: Reflection
  INSERT INTO radar_cards (field_id, position, kind, content_th, content_en) VALUES
  (v_field_id, 10, 'reflection',
    jsonb_build_object(
      'eyebrow', 'คิดตาม',
      'title', 'สำหรับคุณ',
      'prompt', 'หลังจากอ่านมาทั้งหมด — AI Engineer ดูเหมือนคุณไหม อะไรที่ดึงดูดที่สุด อะไรที่ทำให้ลังเล'
    ),
    jsonb_build_object(
      'eyebrow', 'Reflect',
      'title', 'For You',
      'prompt', 'After reading all this — does AI Engineer feel like you? What attracts you most? What makes you hesitate?'
    )
  );

END $$;
