#!/bin/bash
# Seed AI Engineer field and cards via Supabase REST API

SUPABASE_URL="https://iikrvgjfkuijcpvdwzvv.supabase.co"
SERVICE_KEY=""  # Set via environment variable
AUTH="apikey: $SERVICE_KEY\nAuthorization: Bearer $SERVICE_KEY"

# 1. Upsert AI Engineer field
echo "Creating AI Engineer field..."
FIELD_RESPONSE=$(curl -s -X POST "$SUPABASE_URL/rest/v1/radar_fields" \
  -H "apikey: $SERVICE_KEY" \
  -H "Authorization: Bearer $SERVICE_KEY" \
  -H "Content-Type: application/json" \
  -H "Prefer: resolution=merge-duplicates,return=representation" \
  -d '{
    "slug": "ai-engineer",
    "name_th": "AI Engineer",
    "name_en": "AI Engineer",
    "tagline_th": "สร้าง AI ที่เปลี่ยนโลก — ไม่ใช่แค่ใช้ AI",
    "tagline_en": "Build AI that changes the world — not just use it",
    "emoji": "🤖",
    "color": "#06b6d4",
    "tile_size": "lg",
    "tags": ["high-pay", "ai-proof", "trending"],
    "is_published": true,
    "has_content": true,
    "sort_order": 0,
    "research": {
      "tier": "growing",
      "demand_signal": {
        "job_postings_growth": "+340% YoY",
        "top_hiring_companies": ["OpenAI", "Anthropic", "Google DeepMind", "Meta", "Microsoft", "xAI", "Cohere", "Mistral", "NVIDIA", "Scale AI"],
        "salary_range_usd": {"entry": 80000, "mid": 180000, "senior": 500000, "staff": 1200000}
      },
      "thailand_context": {
        "local_opportunity": "Thailand has growing AI startup scene but most high-paying roles are remote or require relocation to Singapore/US",
        "local_salary_range_thb": {"entry": 35000, "mid": 80000, "senior": 150000},
        "top_local_employers": ["Sertis", "AI Research Thailand", "Kasikorn", "SCB", "Agoda", "LINE", "Shopee"]
      }
    }
  }')

echo "Field response: $FIELD_RESPONSE"
FIELD_ID=$(echo "$FIELD_RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

if [ -z "$FIELD_ID" ]; then
  echo "Failed to get field ID, trying to fetch existing..."
  FIELD_ID=$(curl -s "$SUPABASE_URL/rest/v1/radar_fields?select=id&slug=eq.ai-engineer" \
    -H "apikey: $SERVICE_KEY" \
    -H "Authorization: Bearer $SERVICE_KEY" \
    -H "Accept: application/json" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
fi

if [ -z "$FIELD_ID" ]; then
  echo "ERROR: Could not get field ID"
  exit 1
fi

echo "Field ID: $FIELD_ID"

# 2. Delete existing cards for this field
echo "Deleting existing cards..."
curl -s -X DELETE "$SUPABASE_URL/rest/v1/radar_cards?field_id=eq.$FIELD_ID" \
  -H "apikey: $SERVICE_KEY" \
  -H "Authorization: Bearer $SERVICE_KEY" \
  -H "Prefer: return=minimal"

# 3. Insert cards
echo "Inserting cards..."

# Hook
curl -s -X POST "$SUPABASE_URL/rest/v1/radar_cards" \
  -H "apikey: $SERVICE_KEY" \
  -H "Authorization: Bearer $SERVICE_KEY" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=minimal" \
  -d "{
    \"field_id\": \"$FIELD_ID\",
    \"position\": 0,
    \"kind\": \"hook\",
    \"content_th\": {\"eyebrow\": \"สายงานที่มาแรงที่สุดในโลก\", \"title\": \"AI Engineer\", \"body\": \"คุณไม่ได้แค่ใช้ ChatGPT คุณสร้างมันขึ้นมาเอง คุณคือคนที่สร้างระบบ AI ที่เปลี่ยนแปลงอุตสาหกรรมทั้งอุตสาหกรรม\", \"stat\": \"+340%\", \"statLabel\": \"การเติบโตของตำแหน่งงาน YoY\"},
    \"content_en\": {\"eyebrow\": \"The hottest job on Earth\", \"title\": \"AI Engineer\", \"body\": \"You are not just using ChatGPT. You are building it. You create the AI systems that transform entire industries.\", \"stat\": \"+340%\", \"statLabel\": \"YoY job posting growth\"}
  }"

# Fantasy/Reality
curl -s -X POST "$SUPABASE_URL/rest/v1/radar_cards" \
  -H "apikey: $SERVICE_KEY" \
  -H "Authorization: Bearer $SERVICE_KEY" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=minimal" \
  -d "{
    \"field_id\": \"$FIELD_ID\",
    \"position\": 1,
    \"kind\": \"fantasyReality\",
    \"content_th\": {\"eyebrow\": \"ความจริง vs จินตนาการ\", \"title\": \"AI Engineer ในชีวิตจริง\", \"fantasy\": \"นั่งเขียนโค้ด AI ล้ำๆ ทั้งวัน สร้าง AGI ที่เปลี่ยนโลก ทำงานกับอัจฉริยะระดับโลก\", \"reality\": \"80% ของเวลาคือการเตรียมข้อมูล แก้บั๊ก pipeline และอ่าน paper เก่าๆ การสร้าง AI ที่ดีต้องใช้เวลานับเดือน ไม่ใช่วัน\"},
    \"content_en\": {\"eyebrow\": \"Fantasy vs Reality\", \"title\": \"What AI Engineers Actually Do\", \"fantasy\": \"Writing cutting-edge AI code all day, building AGI that changes the world, working with world-class geniuses\", \"reality\": \"80% of time is data prep, debugging pipelines, and reading old papers. Building good AI takes months, not days.\"}
  }"

# Day in Life
curl -s -X POST "$SUPABASE_URL/rest/v1/radar_cards" \
  -H "apikey: $SERVICE_KEY" \
  -H "Authorization: Bearer $SERVICE_KEY" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=minimal" \
  -d "{
    \"field_id\": \"$FIELD_ID\",
    \"position\": 2,
    \"kind\": \"dayInLife\",
    \"content_th\": {\"eyebrow\": \"หนึ่งวันของ AI Engineer\", \"title\": \"9am — 6pm ที่ Google DeepMind\", \"schedule\": [{\"time\": \"9:00\", \"label\": \"Standup: รีวิวผล experiment คืนก่อน\"}, {\"time\": \"10:00\", \"label\": \"Debug training pipeline ที่ crash\"}, {\"time\": \"12:00\", \"label\": \"อ่าน paper ใหม่ที่ปล่อยมาเช้านี้\"}, {\"time\": \"14:00\", \"label\": \"เขียนโค้ด evaluate model ใหม่\"}, {\"time\": \"16:00\", \"label\": \"Meeting: วางแผน experiment ถัดไป\"}, {\"time\": \"17:00\", \"label\": \"Launch training run ใหม่ กลับบ้านรอผล\"}]},
    \"content_en\": {\"eyebrow\": \"A Day in the Life\", \"title\": \"9am — 6pm at Google DeepMind\", \"schedule\": [{\"time\": \"9:00\", \"label\": \"Standup: Review overnight experiment results\"}, {\"time\": \"10:00\", \"label\": \"Debug training pipeline that crashed\"}, {\"time\": \"12:00\", \"label\": \"Read new paper released this morning\"}, {\"time\": \"14:00\", \"label\": \"Code new model evaluation framework\"}, {\"time\": \"16:00\", \"label\": \"Meeting: Plan next experiments\"}, {\"time\": \"17:00\", \"label\": \"Launch new training run, go home and wait\"}]}
  }"

# Salary
curl -s -X POST "$SUPABASE_URL/rest/v1/radar_cards" \
  -H "apikey: $SERVICE_KEY" \
  -H "Authorization: Bearer $SERVICE_KEY" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=minimal" \
  -d "{
    \"field_id\": \"$FIELD_ID\",
    \"position\": 3,
    \"kind\": \"salaryProgression\",
    \"content_th\": {\"eyebrow\": \"เงินเดือน\", \"title\": \"รายได้ AI Engineer (USD/ปี)\", \"eyebrow_thb\": \"เงินเดือน\", \"title_thb\": \"รายได้ AI Engineer (THB/เดือน)\", \"currency\": \"USD\", \"levels\": [{\"level\": \"Entry\", \"years\": \"0-2\", \"salary\": \"$80k — $120k\", \"note\": \"New grad หรือ bootcamp จบใหม่ ที่ startup หรือ big tech — สิ่งที่ต้องมี: implement โมเดลจาก paper เองได้ ไม่ใช่แค่เรียก API\"}, {\"level\": \"Mid\", \"years\": \"3-5\", \"salary\": \"$150k — $250k\", \"note\": \"เคย ship AI feature จริงที่คนใช้ — สิ่งที่ต้องมี: ตัดสินใจได้ว่าปัญหาไหนควรใช้ AI และปัญหาไหนไม่ควร\"}, {\"level\": \"Senior\", \"years\": \"6-10\", \"salary\": \"$300k — $500k\", \"note\": \"Lead ทีม AI หรือ Staff Engineer — สิ่งที่ต้องมี: วางกรอบปัญหาที่ยังไม่มีใครแก้ และพาทีมไปถึง\"}, {\"level\": \"Staff+\", \"years\": \"10+\", \"salary\": \"$500k — $1.2M+\", \"note\": \"Principal / Distinguished / CTO AI — สิ่งที่ต้องมี: เดิมพันทิศทางเทคโนโลยีของทั้งบริษัทถูกต่อเนื่อง\"}], \"levels_thb\": [{\"level\": \"Entry\", \"years\": \"0-2\", \"salary\": \"฿35k — ฿60k\", \"note\": \"จบใหม่หรือ bootcamp ในบริษัทไทย / startup — สิ่งที่ต้องมี: project โชว์ skill ได้ ไม่ใช่แค่เรียก API\"}, {\"level\": \"Mid\", \"years\": \"3-5\", \"salary\": \"฿60k — ฿100k\", \"note\": \"เคย ship AI feature จริงในบริษัทไทยหรือ remote เอเชีย — สิ่งที่ต้องมี: ตัดสินใจได้ว่าปัญหาไหนควรใช้ AI\"}, {\"level\": \"Senior\", \"years\": \"6-10\", \"salary\": \"฿100k — ฿200k\", \"note\": \"Lead ทีม AI หรือ Staff ในองค์กรใหญ่ — ระดับนี้หายากมากในตลาดไทย มักต้องมีผลงานหรือประสบการณ์ต่างประเทศ\"}, {\"level\": \"Staff+\", \"years\": \"10+\", \"salary\": \"฿200k+\", \"note\": \"Principal / Distinguished / CTO AI — มักต้อง remote หรือมีประสบการณ์ระดับสากล ตลาดไทยยังมีน้อย\"}]},
    \"content_en\": {\"eyebrow\": \"Salary\", \"title\": \"AI Engineer Pay (USD/year)\", \"eyebrow_thb\": \"Salary\", \"title_thb\": \"AI Engineer Pay (THB/month)\", \"currency\": \"USD\", \"levels\": [{\"level\": \"Entry\", \"years\": \"0-2\", \"salary\": \"$80k — $120k\", \"note\": \"New grad or bootcamp grad at a startup or big tech. What it takes: implement a model from a paper yourself, not just call an API.\"}, {\"level\": \"Mid\", \"years\": \"3-5\", \"salary\": \"$150k — $250k\", \"note\": \"Shipped real AI features people use. What it takes: judgment on which problems AI should — and should not — solve.\"}, {\"level\": \"Senior\", \"years\": \"6-10\", \"salary\": \"$300k — $500k\", \"note\": \"AI team lead or Staff Engineer. What it takes: framing problems no one has solved yet and getting a team there.\"}, {\"level\": \"Staff+\", \"years\": \"10+\", \"salary\": \"$500k — $1.2M+\", \"note\": \"Principal / Distinguished / AI CTO. What it takes: betting the company's technical direction right, again and again.\"}], \"levels_thb\": [{\"level\": \"Entry\", \"years\": \"0-2\", \"salary\": \"฿35k — ฿60k\", \"note\": \"New grad or bootcamp grad at Thai companies or startups. What it takes: projects that prove your skill, not just API calls.\"}, {\"level\": \"Mid\", \"years\": \"3-5\", \"salary\": \"฿60k — ฿100k\", \"note\": \"Shipped real AI features at Thai tech companies or Asia remote. What it takes: judgment on which problems AI should solve.\"}, {\"level\": \"Senior\", \"years\": \"6-10\", \"salary\": \"฿100k — ฿200k\", \"note\": \"AI team lead or Staff at a large org. Very rare in Thailand; usually requires a strong portfolio or international experience.\"}, {\"level\": \"Staff+\", \"years\": \"10+\", \"salary\": \"฿200k+\", \"note\": \"Principal / Distinguished / AI CTO. Usually remote or requires global experience; the Thai market has very few of these roles.\"}]}
  }"

# AI Impact
curl -s -X POST "$SUPABASE_URL/rest/v1/radar_cards" \
  -H "apikey: $SERVICE_KEY" \
  -H "Authorization: Bearer $SERVICE_KEY" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=minimal" \
  -d "{
    \"field_id\": \"$FIELD_ID\",
    \"position\": 4,
    \"kind\": \"aiImpact\",
    \"content_th\": {\"eyebrow\": \"AI กับงานนี้\", \"title\": \"AI กำลังเปลี่ยน AI Engineer เอง\", \"verdict\": \"AI Engineer คือคนสร้าง AI ดังนั้นงานนี้ไม่ถูกแทนที่ — แต่ถูกเร่งความเร็ว คนที่ใช้ AI ในการเขียนโค้ด AI ได้เร็วกว่า 10x\", \"augmented\": [\"AI coding assistants (Copilot, Cursor) เขียน boilerplate เร็วขึ้น 2-3x\", \"AutoML tools ลดเวลา experiment จากวันเหลือชั่วโมง\", \"LLM agents ช่วย debug และวิเคราะห์ log\", \"Synthetic data generation ลดต้นทุนการเก็บข้อมูล\"], \"automated\": [\"Simple model fine-tuning ที่ไม่ต้อง custom\", \"Routine hyperparameter tuning\", \"Basic data cleaning pipeline\"]},
    \"content_en\": {\"eyebrow\": \"AI Impact\", \"title\": \"AI is Changing AI Engineers Too\", \"verdict\": \"AI Engineers build AI, so the job is not being replaced — it is being accelerated. Those who use AI to write AI code move 10x faster.\", \"augmented\": [\"AI coding assistants (Copilot, Cursor) write boilerplate 2-3x faster\", \"AutoML tools reduce experiment time from days to hours\", \"LLM agents help debug and analyze logs\", \"Synthetic data generation reduces data collection costs\"], \"automated\": [\"Simple model fine-tuning without customization\", \"Routine hyperparameter tuning\", \"Basic data cleaning pipelines\"]}
  }"

# Future Outlook
curl -s -X POST "$SUPABASE_URL/rest/v1/radar_cards" \
  -H "apikey: $SERVICE_KEY" \
  -H "Authorization: Bearer $SERVICE_KEY" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=minimal" \
  -d "{
    \"field_id\": \"$FIELD_ID\",
    \"position\": 5,
    \"kind\": \"futureOutlook\",
    \"content_th\": {\"eyebrow\": \"อนาคต\", \"title\": \"AI Engineer ยังไปได้อีกไกล\", \"growthRate\": \"+340%\", \"growthLabel\": \"การเติบโตของตำแหน่งงาน YoY\", \"timeline\": [{\"year\": \"2024\", \"event\": \"ทุกบริษัท tech ใหญ่เปิดรับ AI Engineer\"}, {\"year\": \"2025\", \"event\": \"AI Agents เริ่มทำงานแทนคนในบางส่วน\"}, {\"year\": \"2027\", \"event\": \"AI Engineer ที่เก่งจะมี demand มากกว่า supply 10x\"}, {\"year\": \"2030\", \"event\": \"AI-native company จะเป็น default ไม่ใช่ exception\"}], \"demandSignal\": \"OpenAI รับสมัคร 200+ AI Engineer, Anthropic 100+, Google 500+ ตำแหน่ง AI/ML\", \"risk\": \"Bubble อาจแตกถ้า AI hype หยุด แต่ fundamental demand จริง — บริษัทต้องการ AI เพื่อแข่งขัน\"},
    \"content_en\": {\"eyebrow\": \"Future\", \"title\": \"AI Engineer Has Miles to Go\", \"growthRate\": \"+340%\", \"growthLabel\": \"YoY job posting growth\", \"timeline\": [{\"year\": \"2024\", \"event\": \"Every major tech company hiring AI Engineers\"}, {\"year\": \"2025\", \"event\": \"AI Agents start replacing parts of human work\"}, {\"year\": \"2027\", \"event\": \"Top AI Engineers in 10x demand vs supply\"}, {\"year\": \"2030\", \"event\": \"AI-native company becomes default, not exception\"}], \"demandSignal\": \"OpenAI hiring 200+ AI Engineers, Anthropic 100+, Google 500+ AI/ML roles\", \"risk\": \"Bubble may burst if AI hype stops, but fundamental demand is real — companies need AI to compete\"}
  }"

# Entry Routes
curl -s -X POST "$SUPABASE_URL/rest/v1/radar_cards" \
  -H "apikey: $SERVICE_KEY" \
  -H "Authorization: Bearer $SERVICE_KEY" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=minimal" \
  -d "{
    \"field_id\": \"$FIELD_ID\",
    \"position\": 6,
    \"kind\": \"entryRoutes\",
    \"content_th\": {\"eyebrow\": \"เส้นทางเข้าสู่อาชีพ\", \"title\": \"เริ่มอย่างไร\", \"routes\": [{\"label\": \"Computer Science Degree\", \"route\": \"จบ CS/Math/Physics จากมหาวิทยาลัยดี → สมัคร internship ที่ AI lab → return offer → fulltime AI Engineer\"}, {\"label\": \"Bootcamp + Portfolio\", \"route\": \"เรียน ML/Data Science bootcamp (3-6 เดือน) → สร้าง project ที่ใช้ LLM/Transformer → apply startup\"}, {\"label\": \"Internal Transfer\", \"route\": \"ทำงาน software engineer อยู่แล้ว → ขอย้ายไปทีม AI/ML → เรียนเพิ่มระหว่างทาง\"}, {\"label\": \"Research → Industry\", \"route\": \"ทำ master/PhD ด้าน AI → publish paper → ถูก recruit โดย AI lab ของบริษัทใหญ่\"}]},
    \"content_en\": {\"eyebrow\": \"Entry Routes\", \"title\": \"How to Start\", \"routes\": [{\"label\": \"Computer Science Degree\", \"route\": \"Graduate CS/Math/Physics from good university → apply to AI lab internship → return offer → fulltime AI Engineer\"}, {\"label\": \"Bootcamp + Portfolio\", \"route\": \"Complete ML/Data Science bootcamp (3-6 months) → build project using LLM/Transformer → apply to startup\"}, {\"label\": \"Internal Transfer\", \"route\": \"Already a software engineer → request transfer to AI/ML team → learn on the job\"}, {\"label\": \"Research → Industry\", \"route\": \"Do master/PhD in AI → publish paper → get recruited by big company AI lab\"}]}
  }"

# Real People
curl -s -X POST "$SUPABASE_URL/rest/v1/radar_cards" \
  -H "apikey: $SERVICE_KEY" \
  -H "Authorization: Bearer $SERVICE_KEY" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=minimal" \
  -d "{
    \"field_id\": \"$FIELD_ID\",
    \"position\": 7,
    \"kind\": \"realPeople\",
    \"content_th\": {\"eyebrow\": \"คนจริง\", \"title\": \"จากที่ไหนก็มาเป็น AI Engineer ได้\", \"people\": [{\"name\": \"Andrej Karpathy\", \"background\": \"ปริญญาโท/เอก Computer Science จาก Stanford ทำ PhD ด้าน Deep Learning กับ Fei-Fei Li\", \"now\": \"Founder of Eureka Labs, former Director of AI at Tesla, founding member of OpenAI\", \"advice\": \"เริ่มจาก implement paper เองให้ได้ก่อน อย่าพึ่ง framework จนกว่าจะเข้าใจ\"}, {\"name\": \"Demis Hassabis\", \"background\": \"จบ Computer Science จาก Cambridge, เป็นเด็กเกมส์ prodigy, ทำ PhD ด้าน Cognitive Neuroscience\", \"now\": \"CEO & Co-founder of Google DeepMind, Nobel Prize in Chemistry 2024\", \"advice\": \"ความรู้ multidisciplinary สำคัญ — AI ต้องการทั้ง CS, neuroscience, และ philosophy\"}, {\"name\": \"Logan Kilpatrick\", \"background\": \"จบ Mechanical Engineering, เริ่มจาก Developer Advocate ไม่ใช่ AI Engineer ตรงๆ\", \"now\": \"Lead Developer Relations at OpenAI, ช่วยนับล้านคนเริ่มใช้ AI\", \"advice\": \"คุณไม่จำเป็นต้องเป็น AI researcher ถึงจะมีบทบาทใน AI — community, product, หรือ advocacy ก็สำคัญ\"}, {\"name\": \"[Thai AI Engineer]\", \"background\": \"จบ Computer Engineering จาก Chula, ทำงาน data analyst 2 ปี ก่อนเรียน ML เองผ่าน Coursera\", \"now\": \"AI Engineer ที่ Agoda กรุงเทพฯ, ทำ recommendation system ให้ 50 ล้าน user\", \"advice\": \"ไม่ต้องรอจบโทหรือ PhD ถ้าคุณสร้าง project ที่โชว์ skill ได้ — portfolio สำคัญกว่า degree\"}]},
    \"content_en\": {\"eyebrow\": \"Real People\", \"title\": \"From Anywhere to AI Engineer\", \"people\": [{\"name\": \"Andrej Karpathy\", \"background\": \"MS/PhD Computer Science from Stanford. Did PhD in Deep Learning with Fei-Fei Li.\", \"now\": \"Founder of Eureka Labs, former Director of AI at Tesla, founding member of OpenAI\", \"advice\": \"Start by implementing papers yourself. Do not rely on frameworks until you understand what is underneath.\"}, {\"name\": \"Demis Hassabis\", \"background\": \"CS from Cambridge, child chess prodigy, PhD in Cognitive Neuroscience at UCL\", \"now\": \"CEO & Co-founder of Google DeepMind, Nobel Prize in Chemistry 2024\", \"advice\": \"Multidisciplinary knowledge matters — AI needs CS, neuroscience, and philosophy combined.\"}, {\"name\": \"Logan Kilpatrick\", \"background\": \"Mechanical Engineering grad. Started as Developer Advocate, not a direct AI Engineer.\", \"now\": \"Lead Developer Relations at OpenAI, helped millions start using AI\", \"advice\": \"You do not need to be an AI researcher to have a role in AI — community, product, and advocacy matter too.\"}, {\"name\": \"[Thai AI Engineer]\", \"background\": \"Computer Engineering from Chula. Worked as data analyst for 2 years, then self-studied ML through Coursera.\", \"now\": \"AI Engineer at Agoda Bangkok, building recommendation systems for 50 million users\", \"advice\": \"You do not need a master or PhD if you can build projects that demonstrate skill — portfolio matters more than degree.\"}]}
  }"

# Sources
curl -s -X POST "$SUPABASE_URL/rest/v1/radar_cards" \
  -H "apikey: $SERVICE_KEY" \
  -H "Authorization: Bearer $SERVICE_KEY" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=minimal" \
  -d "{
    \"field_id\": \"$FIELD_ID\",
    \"position\": 8,
    \"kind\": \"sources\",
    \"content_th\": {\"eyebrow\": \"แหล่งข้อมูล\", \"title\": \"อ่านเพิ่มเติม\", \"sources\": [\"Levels.fyi — AI Engineer salary data 2024\", \"OpenAI Careers — Current AI Engineer openings\", \"Andrej Karpathy blog — AI education\", \"Papers With Code — State of AI research\"]},
    \"content_en\": {\"eyebrow\": \"Sources\", \"title\": \"Read More\", \"sources\": [\"Levels.fyi — AI Engineer salary data 2024\", \"OpenAI Careers — Current AI Engineer openings\", \"Andrej Karpathy blog — AI education\", \"Papers With Code — State of AI research\"]}
  }"

# CTA
curl -s -X POST "$SUPABASE_URL/rest/v1/radar_cards" \
  -H "apikey: $SERVICE_KEY" \
  -H "Authorization: Bearer $SERVICE_KEY" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=minimal" \
  -d "{
    \"field_id\": \"$FIELD_ID\",
    \"position\": 9,
    \"kind\": \"cta\",
    \"content_th\": {\"eyebrow\": \"ขั้นตอนถัดไป\", \"title\": \"ลองดู AI Engineer Path\", \"body\": \"ถ้าคุณอยากลองทำงานจริงๆ ดูว่า AI Engineer ทำอะไรในชีวิตจริง เรามี Path ให้ลอง\", \"label\": \"เริ่ม AI Engineer Path\", \"href\": \"/seeds/pathlab/ai-engineer\"},
    \"content_en\": {\"eyebrow\": \"Next Step\", \"title\": \"Try the AI Engineer Path\", \"body\": \"If you want to experience what AI Engineers actually do, we have a hands-on path for you.\", \"label\": \"Start AI Engineer Path\", \"href\": \"/seeds/pathlab/ai-engineer\"}
  }"

# Reflection
curl -s -X POST "$SUPABASE_URL/rest/v1/radar_cards" \
  -H "apikey: $SERVICE_KEY" \
  -H "Authorization: Bearer $SERVICE_KEY" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=minimal" \
  -d "{
    \"field_id\": \"$FIELD_ID\",
    \"position\": 10,
    \"kind\": \"reflection\",
    \"content_th\": {\"eyebrow\": \"คิดตาม\", \"title\": \"สำหรับคุณ\", \"prompt\": \"หลังจากอ่านมาทั้งหมด — AI Engineer ดูเหมือนคุณไหม อะไรที่ดึงดูดที่สุด อะไรที่ทำให้ลังเล\"},
    \"content_en\": {\"eyebrow\": \"Reflect\", \"title\": \"For You\", \"prompt\": \"After reading all this — does AI Engineer feel like you? What attracts you most? What makes you hesitate?\"}
  }"

echo "Done seeding AI Engineer career map."
