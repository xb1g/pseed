import { createClient } from "@supabase/supabase-js";

const targets = [
  {
    name: "local",
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    key: process.env.SUPABASE_SERVICE_ROLE_KEY,
  },
  {
    name: "production",
    url: process.env.HACKATHON_SUPABASE_URL,
    key: process.env.HACKATHON_SUPABASE_SERVICE_ROLE_KEY,
  },
];

const facultiesTh = [
  {
    name: "วิทยาการคอมพิวเตอร์",
    tier: "direct",
    examples: "Computer Science",
    note: "ได้พื้นฐาน coding, data structure, algorithm, database และ software engineering ที่ใช้สร้างระบบ AI จริง",
  },
  {
    name: "วิศวกรรมคอมพิวเตอร์",
    tier: "direct",
    examples: "Computer Engineering",
    note: "ได้ทั้ง software, computer architecture, network และระบบ เหมาะกับ AI ที่ต้องเชื่อมฮาร์ดแวร์หรือ infrastructure",
  },
  {
    name: "วิศวกรรมซอฟต์แวร์",
    tier: "direct",
    examples: "Software Engineering",
    note: "แข็งด้าน API, backend, testing, cloud และ system design ซึ่งจำเป็นต่อการนำโมเดลขึ้น production",
  },
  {
    name: "ปัญญาประดิษฐ์",
    tier: "direct",
    examples: "Artificial Intelligence / Machine Learning",
    note: "เรียน model, deep learning และการประเมินผลโดยตรง แต่ควรเสริม data engineering, DevOps และการออกแบบระบบ",
  },
  {
    name: "วิทยาศาสตร์ข้อมูล",
    tier: "related",
    examples: "Data Science",
    note: "ได้สถิติ การทดลอง การเตรียมข้อมูล และ machine learning ดี ต้องเติม software engineering และ deployment",
  },
  {
    name: "วิศวกรรมหุ่นยนต์",
    tier: "alternative",
    examples: "Robotics Engineering",
    note: "ต่อยอดสู่ computer vision, control และ edge AI ได้ดี แต่ต้องสร้าง coding, ML และ data pipeline ให้แน่น",
  },
];

const facultiesEn = [
  {
    name: "Computer Science",
    tier: "direct",
    examples: "Computer Science",
    note: "Builds the coding, data structures, algorithms, databases, and software-engineering foundation used in production AI systems.",
  },
  {
    name: "Computer Engineering",
    tier: "direct",
    examples: "Computer Engineering",
    note: "Combines software, computer architecture, networking, and systems knowledge for infrastructure- or hardware-connected AI.",
  },
  {
    name: "Software Engineering",
    tier: "direct",
    examples: "Software Engineering",
    note: "Develops API, backend, testing, cloud, and system-design skills needed to move models into production.",
  },
  {
    name: "Artificial Intelligence",
    tier: "direct",
    examples: "Artificial Intelligence / Machine Learning",
    note: "Covers models, deep learning, and evaluation directly; add data engineering, DevOps, and system design.",
  },
  {
    name: "Data Science",
    tier: "related",
    examples: "Data Science",
    note: "Provides statistics, experimentation, data preparation, and machine learning; add software engineering and deployment.",
  },
  {
    name: "Robotics Engineering",
    tier: "alternative",
    examples: "Robotics Engineering",
    note: "Transfers well to computer vision, control, and edge AI after strengthening coding, ML, and data pipelines.",
  },
];

async function updateTarget(target) {
  if (!target.url || !target.key) {
    throw new Error(`Missing credentials for ${target.name}`);
  }

  const supabase = createClient(target.url, target.key);
  const { data: field, error: fieldError } = await supabase
    .from("radar_fields")
    .select("id")
    .eq("slug", "ai-engineer")
    .single();
  if (fieldError) throw fieldError;

  const { data: card, error: cardError } = await supabase
    .from("radar_cards")
    .select("id,content_th,content_en")
    .eq("field_id", field.id)
    .eq("kind", "entryRoutes")
    .single();
  if (cardError) throw cardError;

  const { error: updateError } = await supabase
    .from("radar_cards")
    .update({
      content_th: { ...(card.content_th ?? {}), faculties: facultiesTh },
      content_en: { ...(card.content_en ?? {}), faculties: facultiesEn },
    })
    .eq("id", card.id);
  if (updateError) throw updateError;

  console.log(`Updated AI Engineer entry routes in ${target.name}`);
}

for (const target of targets) {
  await updateTarget(target);
}
