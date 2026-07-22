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

const fieldNames = {
  "ai-engineer": { name_th: "วิศวกร AI", name_en: "AI Engineer" },
  cybersecurity: {
    name_th: "ความมั่นคงปลอดภัยทางไซเบอร์",
    name_en: "Cybersecurity",
  },
  "data-scientist": {
    name_th: "นักวิทยาศาสตร์ข้อมูล",
    name_en: "Data Scientist",
  },
  "software-engineer": {
    name_th: "วิศวกรซอฟต์แวร์",
    name_en: "Software Engineer",
  },
};

async function updateTarget(target) {
  if (!target.url || !target.key) {
    throw new Error(`Missing credentials for ${target.name}`);
  }

  const supabase = createClient(target.url, target.key);
  for (const [slug, names] of Object.entries(fieldNames)) {
    const { error } = await supabase
      .from("radar_fields")
      .update(names)
      .eq("slug", slug);
    if (error) throw error;
  }

  console.log(`Normalized ${Object.keys(fieldNames).length} Radar field names in ${target.name}`);
}

for (const target of targets) {
  await updateTarget(target);
}
