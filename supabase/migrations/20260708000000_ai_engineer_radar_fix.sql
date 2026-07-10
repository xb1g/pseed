-- Re-seed AI Engineer radar with renderer-correct shapes + editorial-spine fixes.
-- 2026-07-08
--
-- Fixes vs 20260704000000_ai_engineer_radar.sql (which shipped with card shapes
-- that the RadarCards renderer never reads, so several cards rendered blank):
--   * dayInLife      : `schedule` -> `steps`      (steps were invisible)
--   * salaryProgression: `range`  -> `salary`     (pay numbers were invisible)
--   * sources        : string[]   -> `items[{ref,title,publisher,url}]` (blank list)
--   * realPeople     : `now`      -> `nowDoing`, drop fabricated Thai name
--   * cta            : `label`    -> `button`, link via radar_fields.squad_url
--   * reflection     : `prompt`   -> chapterKey + chips + allowText (was non-interactive)
--
-- Editorial spine (docs/CAREER_RADAR_EDITORIAL_SPINE.md): money/hype de-heroed.
-- The "+340% YoY job-posting growth" hero stat reads as hype to smart teens, so it
-- is removed from the hook and the future-outlook headline. Trajectory + honest
-- demand/risk stay; salary lives only in the dedicated progression card, each level
-- carrying its price tag (years + what it takes).

DO $$
DECLARE
  v_field_id uuid;
BEGIN
  SELECT id INTO v_field_id FROM radar_fields WHERE slug = 'ai-engineer';
  IF v_field_id IS NULL THEN
    RAISE EXCEPTION 'ai-engineer field not found';
  END IF;

  -- Route the closing CTA at the AI Engineer path (CtaCard links via squad_url).
  UPDATE radar_fields
     SET squad_url = '/seeds/pathlab/ai-engineer', updated_at = now()
   WHERE id = v_field_id;

  -- Idempotent re-seed.
  DELETE FROM radar_cards WHERE field_id = v_field_id;

  -- Card 0: Hook — mission-led, no YoY hero stat.
  INSERT INTO radar_cards (field_id, position, kind, content_th, content_en) VALUES
  (v_field_id, 0, 'hook',
    jsonb_build_object(
      'eyebrow', 'สายงานที่มาแรงที่สุดในโลก',
      'title', 'AI Engineer',
      'body', 'คุณไม่ได้แค่ใช้ ChatGPT — คุณสร้างมันขึ้นมาเอง เป็นคนออกแบบระบบ AI ที่เปลี่ยนอุตสาหกรรมทั้งอุตสาหกรรม ทุกบริษัท tech ใหญ่กำลังแย่งตัวคนกลุ่มนี้อยู่ตอนนี้'
    ),
    jsonb_build_object(
      'eyebrow', 'The hottest job on Earth',
      'title', 'AI Engineer',
      'body', 'You are not just using ChatGPT — you build it. You design the AI systems that reshape whole industries, and every major tech company is fighting to hire the people who can.'
    )
  );

  -- Card 1: Fantasy vs Reality
  INSERT INTO radar_cards (field_id, position, kind, content_th, content_en) VALUES
  (v_field_id, 1, 'fantasyReality',
    jsonb_build_object(
      'eyebrow', 'ความจริง vs จินตนาการ',
      'title', 'AI Engineer ในชีวิตจริง',
      'fantasy', 'นั่งเขียนโค้ด AI ล้ำๆ ทั้งวัน สร้าง AGI ที่เปลี่ยนโลก ทำงานกับอัจฉริยะระดับโลก',
      'reality', '80% ของเวลาคือการเตรียมข้อมูล แก้บั๊ก pipeline และอ่าน paper การสร้าง AI ที่ดีใช้เวลาเป็นเดือน ไม่ใช่วัน — คนที่อยู่รอดคือคนที่อดทนกับงานน่าเบื่อได้'
    ),
    jsonb_build_object(
      'eyebrow', 'Fantasy vs Reality',
      'title', 'What AI Engineers Actually Do',
      'fantasy', 'Writing cutting-edge AI code all day, building AGI that changes the world, working with world-class geniuses',
      'reality', '80% of the time is data prep, debugging pipelines, and reading papers. Good AI takes months, not days — the people who last are the ones who can sit with the boring parts.'
    )
  );

  -- Card 2: Day in Life  (fixed: schedule -> steps)
  INSERT INTO radar_cards (field_id, position, kind, content_th, content_en) VALUES
  (v_field_id, 2, 'dayInLife',
    jsonb_build_object(
      'eyebrow', 'หนึ่งวันของ AI Engineer',
      'title', '9am — 6pm ที่ Google DeepMind',
      'steps', jsonb_build_array(
        jsonb_build_object('time', '9:00', 'label', 'Standup: รีวิวผล experiment ที่รันข้ามคืน'),
        jsonb_build_object('time', '10:00', 'label', 'ไล่แก้ training pipeline ที่ crash ตอนตีสาม'),
        jsonb_build_object('time', '12:00', 'label', 'อ่าน paper ใหม่ที่เพิ่งปล่อยเช้านี้'),
        jsonb_build_object('time', '14:00', 'label', 'เขียนโค้ดชุด evaluate โมเดลตัวใหม่'),
        jsonb_build_object('time', '16:00', 'label', 'Meeting: วางแผน experiment รอบถัดไป'),
        jsonb_build_object('time', '17:00', 'label', 'กด launch training run ใหม่ แล้วกลับบ้านรอผล')
      )
    ),
    jsonb_build_object(
      'eyebrow', 'A Day in the Life',
      'title', '9am — 6pm at Google DeepMind',
      'steps', jsonb_build_array(
        jsonb_build_object('time', '9:00', 'label', 'Standup: review overnight experiment results'),
        jsonb_build_object('time', '10:00', 'label', 'Chase down a training pipeline that crashed at 3am'),
        jsonb_build_object('time', '12:00', 'label', 'Read a new paper that dropped this morning'),
        jsonb_build_object('time', '14:00', 'label', 'Write the eval code for a new model'),
        jsonb_build_object('time', '16:00', 'label', 'Meeting: plan the next round of experiments'),
        jsonb_build_object('time', '17:00', 'label', 'Launch a new training run, go home, wait for results')
      )
    )
  );

  -- Card 3: Salary Progression  (fixed: range -> salary, + years, price-tagged notes, + THB toggle)
  INSERT INTO radar_cards (field_id, position, kind, content_th, content_en) VALUES
  (v_field_id, 3, 'salaryProgression',
    jsonb_build_object(
      'eyebrow', 'เงินเดือน',
      'title', 'รายได้ AI Engineer (USD/ปี)',
      'eyebrow_thb', 'เงินเดือน',
      'title_thb', 'รายได้ AI Engineer (THB/เดือน)',
      'currency', 'USD',
      'levels', jsonb_build_array(
        jsonb_build_object('level', 'Entry', 'years', '0-2', 'salary', '$80k — $120k', 'note', 'New grad หรือ bootcamp จบใหม่ ที่ startup หรือ big tech — สิ่งที่ต้องมี: implement โมเดลจาก paper เองได้ ไม่ใช่แค่เรียก API'),
        jsonb_build_object('level', 'Mid', 'years', '3-5', 'salary', '$150k — $250k', 'note', 'เคย ship AI feature จริงที่คนใช้ — สิ่งที่ต้องมี: ตัดสินใจได้ว่าปัญหาไหนควรใช้ AI และปัญหาไหนไม่ควร'),
        jsonb_build_object('level', 'Senior', 'years', '6-10', 'salary', '$300k — $500k', 'note', 'Lead ทีม AI หรือ Staff Engineer — สิ่งที่ต้องมี: วางกรอบปัญหาที่ยังไม่มีใครแก้ และพาทีมไปถึง'),
        jsonb_build_object('level', 'Staff+', 'years', '10+', 'salary', '$500k — $1.2M+', 'note', 'Principal / Distinguished / CTO AI — สิ่งที่ต้องมี: เดิมพันทิศทางเทคโนโลยีของทั้งบริษัทถูกต่อเนื่อง')
      ),
      'levels_thb', jsonb_build_array(
        jsonb_build_object('level', 'Entry', 'years', '0-2', 'salary', '฿35k — ฿60k', 'note', 'จบใหม่หรือ bootcamp ในบริษัทไทย / startup — สิ่งที่ต้องมี: project โชว์ skill ได้ ไม่ใช่แค่เรียก API'),
        jsonb_build_object('level', 'Mid', 'years', '3-5', 'salary', '฿60k — ฿100k', 'note', 'เคย ship AI feature จริงในบริษัทไทยหรือ remote เอเชีย — สิ่งที่ต้องมี: ตัดสินใจได้ว่าปัญหาไหนควรใช้ AI'),
        jsonb_build_object('level', 'Senior', 'years', '6-10', 'salary', '฿100k — ฿200k', 'note', 'Lead ทีม AI หรือ Staff ในองค์กรใหญ่ — ระดับนี้หายากมากในตลาดไทย มักต้องมีผลงานหรือประสบการณ์ต่างประเทศ'),
        jsonb_build_object('level', 'Staff+', 'years', '10+', 'salary', '฿200k+', 'note', 'Principal / Distinguished / CTO AI — มักต้อง remote หรือมีประสบการณ์ระดับสากล ตลาดไทยยังมีน้อย')
      )
    ),
    jsonb_build_object(
      'eyebrow', 'Salary',
      'title', 'AI Engineer Pay (USD/year)',
      'eyebrow_thb', 'Salary',
      'title_thb', 'AI Engineer Pay (THB/month)',
      'currency', 'USD',
      'levels', jsonb_build_array(
        jsonb_build_object('level', 'Entry', 'years', '0-2', 'salary', '$80k — $120k', 'note', 'New grad or bootcamp grad at a startup or big tech. What it takes: implement a model from a paper yourself, not just call an API.'),
        jsonb_build_object('level', 'Mid', 'years', '3-5', 'salary', '$150k — $250k', 'note', 'Shipped real AI features people use. What it takes: judgment on which problems AI should — and should not — solve.'),
        jsonb_build_object('level', 'Senior', 'years', '6-10', 'salary', '$300k — $500k', 'note', 'AI team lead or Staff Engineer. What it takes: framing problems no one has solved yet and getting a team there.'),
        jsonb_build_object('level', 'Staff+', 'years', '10+', 'salary', '$500k — $1.2M+', 'note', 'Principal / Distinguished / AI CTO. What it takes: betting the company''s technical direction right, again and again.')
      ),
      'levels_thb', jsonb_build_array(
        jsonb_build_object('level', 'Entry', 'years', '0-2', 'salary', '฿35k — ฿60k', 'note', 'New grad or bootcamp grad at Thai companies or startups. What it takes: projects that prove your skill, not just API calls.'),
        jsonb_build_object('level', 'Mid', 'years', '3-5', 'salary', '฿60k — ฿100k', 'note', 'Shipped real AI features at Thai tech companies or Asia remote. What it takes: judgment on which problems AI should solve.'),
        jsonb_build_object('level', 'Senior', 'years', '6-10', 'salary', '฿100k — ฿200k', 'note', 'AI team lead or Staff at a large org. Very rare in Thailand; usually requires a strong portfolio or international experience.'),
        jsonb_build_object('level', 'Staff+', 'years', '10+', 'salary', '฿200k+', 'note', 'Principal / Distinguished / AI CTO. Usually remote or requires global experience; the Thai market has very few of these roles.')
      )
    )
  );

  -- Card 4: AI Impact
  INSERT INTO radar_cards (field_id, position, kind, content_th, content_en) VALUES
  (v_field_id, 4, 'aiImpact',
    jsonb_build_object(
      'eyebrow', 'AI กับงานนี้',
      'title', 'AI กำลังเปลี่ยน AI Engineer เอง',
      'verdict', 'AI Engineer คือคนสร้าง AI งานนี้จึงไม่ถูกแทนที่ — แต่ถูกเร่งความเร็ว คนที่ใช้ AI เขียนโค้ด AI ได้ทำงานเร็วกว่าเดิมหลายเท่า',
      'augmented', ARRAY[
        'AI coding assistants (Copilot, Cursor) เขียน boilerplate เร็วขึ้น 2-3x',
        'AutoML ลดเวลา experiment จากวันเหลือชั่วโมง',
        'LLM agents ช่วย debug และไล่อ่าน log',
        'Synthetic data ลดต้นทุนการเก็บข้อมูล'
      ],
      'automated', ARRAY[
        'Fine-tuning โมเดลง่ายๆ ที่ไม่ต้อง custom',
        'Hyperparameter tuning ที่ทำซ้ำๆ',
        'Data cleaning pipeline พื้นฐาน'
      ]
    ),
    jsonb_build_object(
      'eyebrow', 'AI Impact',
      'title', 'AI is Changing AI Engineers Too',
      'verdict', 'AI Engineers build AI, so the job is not replaced — it is accelerated. People who use AI to write AI code move several times faster.',
      'augmented', ARRAY[
        'AI coding assistants (Copilot, Cursor) write boilerplate 2-3x faster',
        'AutoML cuts experiment time from days to hours',
        'LLM agents help debug and read through logs',
        'Synthetic data lowers data-collection cost'
      ],
      'automated', ARRAY[
        'Simple model fine-tuning with no customization',
        'Repetitive hyperparameter tuning',
        'Basic data-cleaning pipelines'
      ]
    )
  );

  -- Card 5: Future Outlook  (de-heroed: no +340% YoY headline; trajectory + honest risk)
  INSERT INTO radar_cards (field_id, position, kind, content_th, content_en) VALUES
  (v_field_id, 5, 'futureOutlook',
    jsonb_build_object(
      'eyebrow', 'อนาคต',
      'title', 'สายนี้ยังไปได้อีกไกล',
      'timeline', jsonb_build_array(
        jsonb_build_object('year', '2024', 'event', 'ทุกบริษัท tech ใหญ่เปิดรับ AI Engineer'),
        jsonb_build_object('year', '2025', 'event', 'AI Agents เริ่มทำงานบางส่วนแทนคน'),
        jsonb_build_object('year', '2027', 'event', 'AI Engineer ที่เก่งจริงยังหายาก — ความต้องการโตเร็วกว่าคนที่ทำได้'),
        jsonb_build_object('year', '2030', 'event', 'บริษัทที่สร้างมาบน AI ตั้งแต่แรกกลายเป็นเรื่องปกติ')
      ),
      'demandSignal', 'ตอนนี้ OpenAI, Anthropic, Google เปิดรับ AI/ML รวมกันหลายร้อยตำแหน่ง และยังหาคนเติมไม่ทัน',
      'risk', 'กระแส AI อาจเย็นลงเป็นช่วงๆ แต่ความต้องการพื้นฐานยังจริง — บริษัทต้องใช้ AI เพื่อแข่งขัน สิ่งที่ปกป้องคุณคือความเข้าใจ ไม่ใช่ hype'
    ),
    jsonb_build_object(
      'eyebrow', 'Future',
      'title', 'This Field Has Miles to Go',
      'timeline', jsonb_build_array(
        jsonb_build_object('year', '2024', 'event', 'Every major tech company hiring AI Engineers'),
        jsonb_build_object('year', '2025', 'event', 'AI Agents start doing parts of the work'),
        jsonb_build_object('year', '2027', 'event', 'Genuinely strong AI Engineers stay scarce — demand outgrows supply'),
        jsonb_build_object('year', '2030', 'event', 'Companies built on AI from day one become normal')
      ),
      'demandSignal', 'OpenAI, Anthropic, and Google have hundreds of open AI/ML roles right now and still cannot fill them fast enough.',
      'risk', 'AI hype may cool in waves, but the underlying demand is real — companies need AI to compete. What protects you is understanding, not hype.'
    )
  );

  -- Card 6: Entry Routes
  INSERT INTO radar_cards (field_id, position, kind, content_th, content_en) VALUES
  (v_field_id, 6, 'entryRoutes',
    jsonb_build_object(
      'eyebrow', 'เส้นทางเข้าสู่อาชีพ',
      'title', 'เริ่มอย่างไร',
      'routes', jsonb_build_array(
        jsonb_build_object('tag', 'Computer Science Degree', 'route', 'จบ CS/Math/Physics จากมหาวิทยาลัยดี → สมัคร internship ที่ AI lab → return offer → fulltime AI Engineer'),
        jsonb_build_object('tag', 'Bootcamp + Portfolio', 'route', 'เรียน ML/Data Science bootcamp (3-6 เดือน) → สร้าง project ที่ใช้ LLM/Transformer จริง → สมัคร startup'),
        jsonb_build_object('tag', 'Internal Transfer', 'route', 'เป็น software engineer อยู่แล้ว → ขอย้ายไปทีม AI/ML → เรียนเพิ่มระหว่างทาง'),
        jsonb_build_object('tag', 'Research → Industry', 'route', 'ทำ master/PhD ด้าน AI → publish paper → ถูก recruit โดย AI lab ของบริษัทใหญ่')
      )
    ),
    jsonb_build_object(
      'eyebrow', 'Entry Routes',
      'title', 'How to Start',
      'routes', jsonb_build_array(
        jsonb_build_object('tag', 'Computer Science Degree', 'route', 'Graduate CS/Math/Physics from a good university → apply to an AI lab internship → return offer → fulltime AI Engineer'),
        jsonb_build_object('tag', 'Bootcamp + Portfolio', 'route', 'Finish an ML/Data Science bootcamp (3-6 months) → build a real project using an LLM/Transformer → apply to a startup'),
        jsonb_build_object('tag', 'Internal Transfer', 'route', 'Already a software engineer → request a move to the AI/ML team → learn on the job'),
        jsonb_build_object('tag', 'Research → Industry', 'route', 'Do a master/PhD in AI → publish a paper → get recruited by a big company AI lab')
      )
    )
  );

  -- Card 7: Real People  (fixed: now -> nowDoing, add role, anonymize the Thai case)
  INSERT INTO radar_cards (field_id, position, kind, content_th, content_en) VALUES
  (v_field_id, 7, 'realPeople',
    jsonb_build_object(
      'eyebrow', 'คนจริง',
      'title', 'จากที่ไหนก็มาเป็น AI Engineer ได้',
      'people', jsonb_build_array(
        jsonb_build_object(
          'name', 'Andrej Karpathy', 'role', 'Founder, Eureka Labs',
          'background', 'ปริญญาโท/เอก Computer Science จาก Stanford ทำ PhD ด้าน Deep Learning กับ Fei-Fei Li',
          'nowDoing', 'อดีต Director of AI ที่ Tesla และ founding member ของ OpenAI ตอนนี้สร้างบริษัทสอน AI',
          'advice', 'เริ่มจาก implement paper เองให้ได้ก่อน อย่าพึ่ง framework จนกว่าจะเข้าใจว่าข้างในทำงานยังไง'
        ),
        jsonb_build_object(
          'name', 'Demis Hassabis', 'role', 'CEO, Google DeepMind',
          'background', 'จบ CS จาก Cambridge เคยเป็นเด็กหมากรุก prodigy แล้วทำ PhD ด้าน Cognitive Neuroscience',
          'nowDoing', 'นำ Google DeepMind และได้ Nobel Prize สาขาเคมี 2024',
          'advice', 'ความรู้ข้ามศาสตร์สำคัญ — AI ต้องการทั้ง CS, neuroscience และ philosophy รวมกัน'
        ),
        jsonb_build_object(
          'name', 'Logan Kilpatrick', 'role', 'Developer Relations',
          'background', 'จบ Mechanical Engineering เริ่มจากสาย Developer Advocate ไม่ใช่ AI Engineer ตรงๆ',
          'nowDoing', 'นำงาน Developer Relations สาย AI ช่วยคนหลายล้านเริ่มใช้ AI',
          'advice', 'คุณไม่จำเป็นต้องเป็น AI researcher ถึงจะมีบทบาทใน AI — community, product หรือ advocacy ก็สำคัญ'
        ),
        jsonb_build_object(
          'role', 'AI Engineer ชาวไทย (ขอไม่เปิดเผยชื่อ)',
          'background', 'จบ Computer Engineering จากจุฬาฯ ทำงาน data analyst 2 ปี แล้วเรียน ML เองผ่าน Coursera',
          'nowDoing', 'เป็น AI Engineer ที่บริษัท tech ในกรุงเทพฯ ทำ recommendation system ให้ผู้ใช้หลายสิบล้านคน',
          'advice', 'ไม่ต้องรอจบโทหรือ PhD ถ้าสร้าง project ที่โชว์ skill ได้จริง — portfolio สำคัญกว่า degree'
        )
      )
    ),
    jsonb_build_object(
      'eyebrow', 'Real People',
      'title', 'From Anywhere to AI Engineer',
      'people', jsonb_build_array(
        jsonb_build_object(
          'name', 'Andrej Karpathy', 'role', 'Founder, Eureka Labs',
          'background', 'MS/PhD Computer Science from Stanford. PhD in Deep Learning with Fei-Fei Li.',
          'nowDoing', 'Former Director of AI at Tesla and a founding member of OpenAI; now building an AI education company.',
          'advice', 'Start by implementing papers yourself. Do not lean on frameworks until you understand what is underneath.'
        ),
        jsonb_build_object(
          'name', 'Demis Hassabis', 'role', 'CEO, Google DeepMind',
          'background', 'CS from Cambridge, child chess prodigy, PhD in Cognitive Neuroscience at UCL.',
          'nowDoing', 'Leads Google DeepMind; won the Nobel Prize in Chemistry, 2024.',
          'advice', 'Multidisciplinary knowledge matters — AI needs CS, neuroscience, and philosophy together.'
        ),
        jsonb_build_object(
          'name', 'Logan Kilpatrick', 'role', 'Developer Relations',
          'background', 'Mechanical Engineering grad. Started as a Developer Advocate, not a direct AI Engineer.',
          'nowDoing', 'Leads AI developer relations, helping millions of people start using AI.',
          'advice', 'You do not need to be an AI researcher to matter in AI — community, product, and advocacy count too.'
        ),
        jsonb_build_object(
          'role', 'Thai AI Engineer (anonymous)',
          'background', 'Computer Engineering from Chulalongkorn. Two years as a data analyst, then self-taught ML through Coursera.',
          'nowDoing', 'AI Engineer at a Bangkok tech company, building recommendation systems for tens of millions of users.',
          'advice', 'You do not need a master or PhD if you can build projects that prove your skill — portfolio beats degree.'
        )
      )
    )
  );

  -- Card 8: Sources  (fixed: string[] -> items[{ref,title,publisher,url}])
  INSERT INTO radar_cards (field_id, position, kind, content_th, content_en) VALUES
  (v_field_id, 8, 'sources',
    jsonb_build_object(
      'eyebrow', 'อ้างอิง',
      'title', 'ตัวเลขพวกนี้มาจากไหน',
      'items', jsonb_build_array(
        jsonb_build_object('ref', 1, 'title', 'AI Engineer & ML salary data', 'publisher', 'Levels.fyi', 'url', 'https://www.levels.fyi/t/software-engineer/focus/machine-learning'),
        jsonb_build_object('ref', 2, 'title', 'Open AI/ML roles', 'publisher', 'OpenAI Careers', 'url', 'https://openai.com/careers/'),
        jsonb_build_object('ref', 3, 'title', 'Learning AI from first principles', 'publisher', 'Andrej Karpathy', 'url', 'https://karpathy.ai/'),
        jsonb_build_object('ref', 4, 'title', 'State of AI research', 'publisher', 'Papers With Code', 'url', 'https://paperswithcode.com/')
      )
    ),
    jsonb_build_object(
      'eyebrow', 'Sources',
      'title', 'Where These Numbers Come From',
      'items', jsonb_build_array(
        jsonb_build_object('ref', 1, 'title', 'AI Engineer & ML salary data', 'publisher', 'Levels.fyi', 'url', 'https://www.levels.fyi/t/software-engineer/focus/machine-learning'),
        jsonb_build_object('ref', 2, 'title', 'Open AI/ML roles', 'publisher', 'OpenAI Careers', 'url', 'https://openai.com/careers/'),
        jsonb_build_object('ref', 3, 'title', 'Learning AI from first principles', 'publisher', 'Andrej Karpathy', 'url', 'https://karpathy.ai/'),
        jsonb_build_object('ref', 4, 'title', 'State of AI research', 'publisher', 'Papers With Code', 'url', 'https://paperswithcode.com/')
      )
    )
  );

  -- Card 9: CTA  (fixed: label -> button; links via squad_url set above)
  INSERT INTO radar_cards (field_id, position, kind, content_th, content_en) VALUES
  (v_field_id, 9, 'cta',
    jsonb_build_object(
      'eyebrow', 'ขั้นตอนถัดไป',
      'title', 'ลองเป็น AI Engineer ดูจริงๆ',
      'body', 'อ่านมาถึงตรงนี้แล้ว วิธีเดียวที่จะรู้ว่าใช่ไหมคือลงมือทำ เรามี Path ให้ลองทำงานแบบเดียวกับที่ AI Engineer ทำจริง',
      'button', 'เริ่ม AI Engineer Path'
    ),
    jsonb_build_object(
      'eyebrow', 'Next Step',
      'title', 'Actually Try Being an AI Engineer',
      'body', 'You made it this far. The only way to know if it fits is to do it. We have a hands-on path that mirrors what AI Engineers really do.',
      'button', 'Start the AI Engineer Path'
    )
  );

  -- Card 10: Reflection  (fixed: prompt -> interactive chapterKey/chips/allowText)
  INSERT INTO radar_cards (field_id, position, kind, content_th, content_en) VALUES
  (v_field_id, 10, 'reflection',
    jsonb_build_object(
      'eyebrow', 'คำถามสุดท้าย',
      'title', 'แล้วคุณล่ะ?',
      'chapterKey', 'you-in-it',
      'chips', jsonb_build_array('ใช่เลย ตัวฉัน', 'อยากลองดู', 'ยังไม่แน่ใจ', 'คงไม่ใช่ทางฉัน'),
      'allowText', true,
      'placeholder', 'อะไรที่ดึงดูดที่สุด อะไรที่ทำให้ลังเล เขียนสั้นๆ ก็ได้...'
    ),
    jsonb_build_object(
      'eyebrow', 'Last question',
      'title', 'So… is this you?',
      'chapterKey', 'you-in-it',
      'chips', jsonb_build_array('Yes, that''s me', 'Want to try it', 'Not sure yet', 'Probably not mine'),
      'allowText', true,
      'placeholder', 'What pulls you in? What makes you hesitate? A sentence is fine...'
    )
  );

END $$;
