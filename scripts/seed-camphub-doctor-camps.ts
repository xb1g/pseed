import { createClient } from "@supabase/supabase-js";

interface CampSeedItem {
  name_th: string;
  name_en?: string;
  field: string[];
  grade_levels: string[];
  weight: number;
  deadline: string;
  url: string;
  notes: string;
  recurrence_pattern?: string;
}

const CAMPHUB_DOCTOR_CAMPS: CampSeedItem[] = [
  {
    name_th: "Intensive Anatomy Workshop (เจาะลึกกายวิภาคศาสตร์ร่างอาจารย์ใหญ่ ม.มหิดล)",
    name_en: "Intensive Anatomy Workshop Appa x MU",
    field: ["แพทยศาสตร์", "วิทยาศาสตร์สุขภาพ", "ทันตแพทยศาสตร์", "วิทยาศาสตร์การแพทย์"],
    grade_levels: ["ม.4", "ม.5", "ม.6"],
    weight: 4,
    deadline: "2026-09-30",
    url: "https://www.camphub.in.th/intensive-anatomy-workshop-3/",
    notes: "Grade A: แล็บกายวิภาคศาสตร์ 7 ระบบหลักจากร่างอาจารย์ใหญ่ สอนโดยอาจารย์มหิดล มีใบรับรองและความน่าเชื่อถือสูงสำหรับพอร์ตแพทย์",
    recurrence_pattern: "biannual",
  },
  {
    name_th: "กิจกรรม Basic CPR & BLS (ได้รับเกียรติบัตรรับรองจาก รพ.เกษมราษฎร์ ประชาชื่น)",
    name_en: "Basic CPR & Basic Life Support Certificate by Kasemrad Hospital",
    field: ["แพทยศาสตร์", "พยาบาลศาสตร์", "วิทยาศาสตร์สุขภาพ", "เทคนิคการแพทย์"],
    grade_levels: ["ม.3", "ม.4", "ม.5", "ม.6"],
    weight: 4,
    deadline: "2026-10-03",
    url: "https://www.camphub.in.th/basic-cpr-bls-16/",
    notes: "Grade A: เกียรติบัตรรับรองทักษะช่วยชีวิตฉุกเฉินและ AED จากโรงพยาบาลโดยตรง เหมาะใส่เป็น Clinical Skills ในพอร์ตแพทย์และพยาบาล",
    recurrence_pattern: "annual-october",
  },
  {
    name_th: "Medical and Microbiology Camp (ปฏิบัติการจุลชีววิทยาการแพทย์และจิตอาสา)",
    name_en: "Medical and Microbiology Research & Health Camp",
    field: ["แพทยศาสตร์", "วิทยาศาสตร์การแพทย์", "เทคนิคการแพทย์", "เภสัชศาสตร์"],
    grade_levels: ["ม.4", "ม.5", "ม.6"],
    weight: 4,
    deadline: "2026-09-25",
    url: "https://www.camphub.in.th/medical-and-microbiology-camp/",
    notes: "Grade A-: ปฏิบัติการแล็บเพาะเลี้ยงเชื้อจุลชีพทางการแพทย์ + จิตอาสาสุขภาพ + นำเสนอโครงงานกับผู้เชี่ยวชาญ",
    recurrence_pattern: "annual-september",
  },
  {
    name_th: "ค่ายฝึกทักษะเย็บแผลทางการแพทย์ (Suturing Technique Workshop)",
    name_en: "Suturing Technique Clinical Skills Workshop",
    field: ["แพทยศาสตร์", "ทันตแพทยศาสตร์", "สัตวแพทยศาสตร์"],
    grade_levels: ["ม.3", "ม.4", "ม.5", "ม.6"],
    weight: 3,
    deadline: "2026-09-20",
    url: "https://www.camphub.in.th/saturing-technique-workshop/",
    notes: "Grade B+: เวิร์กช็อปฝึกการจับเครื่องมือผ่าตัดและการเย็บแผลศัลยกรรมเบื้องต้น แสดงถึงความมุ่งมั่นและทักษะหัตถการ",
    recurrence_pattern: "biannual",
  },
  {
    name_th: "Basic Life Support and AED Workshop (การช่วยฟื้นคืนชีพและการใช้เครื่อง AED)",
    name_en: "Basic Life Support and AED Hands-on Workshop",
    field: ["แพทยศาสตร์", "พยาบาลศาสตร์", "วิทยาศาสตร์สุขภาพ"],
    grade_levels: ["ม.3", "ม.4", "ม.5", "ม.6"],
    weight: 3,
    deadline: "2026-09-27",
    url: "https://www.camphub.in.th/basic-life-support-and-aed-27sep2026/",
    notes: "Grade B: เวิร์กช็อปการประเมินผู้ป่วย CPR และการใช้งานเครื่องกระตุกหัวใจอัตโนมัติ AED",
    recurrence_pattern: "biannual",
  },
  {
    name_th: "ค่าย 2 in 1 ปฐมพยาบาล + ทัศนศึกษาพิพิธภัณฑ์การแพทย์ศิริราชพิมุขสถาน",
    name_en: "Siriraj Medical Museum & First Aid Camp",
    field: ["แพทยศาสตร์", "วิทยาศาสตร์สุขภาพ", "พยาบาลศาสตร์"],
    grade_levels: ["ม.3", "ม.4", "ม.5"],
    weight: 3,
    deadline: "2026-08-30",
    url: "https://www.camphub.in.th/tutorpearmai-30aug2026/",
    notes: "Grade B: เหมาะกับน้อง ม.3-ม.4 สำหรับค้นหาตัวเอง เรียนรู้ประวัติศาสตร์การแพทย์และทักษะปฐมพยาบาลเบื้องต้น",
    recurrence_pattern: "annual-august",
  },
  {
    name_th: "ค่ายสืบคดีห้องแล็บการแพทย์ (Medical Mystery Detectives)",
    name_en: "Medical Mystery Detectives Lab Camp",
    field: ["แพทยศาสตร์", "วิทยาศาสตร์การแพทย์", "เทคนิคการแพทย์"],
    grade_levels: ["ม.4", "ม.5", "ม.6"],
    weight: 3,
    deadline: "2026-09-15",
    url: "https://www.camphub.in.th/medical-mystery-detectives/",
    notes: "Grade B: สืบคดีจำลองผ่านห้องปฏิบัติการ วิเคราะห์หลักฐานทางชีววิทยา Microlife Culturing",
    recurrence_pattern: "annual-september",
  },
  {
    name_th: "ค่ายสร้างหมอ Make Mor Mind Camp (แพทย์ ทันตะ เภสัช จิตอาสา)",
    name_en: "Make Mor Mind Camp Round 14",
    field: ["แพทยศาสตร์", "ทันตแพทยศาสตร์", "เภสัชศาสตร์"],
    grade_levels: ["ม.3", "ม.4", "ม.5"],
    weight: 2,
    deadline: "2026-09-10",
    url: "https://www.camphub.in.th/make-mor-mind-camp-14/",
    notes: "Grade B- (Exploration): ค่ายสำรวจตัวเอง 2 วัน 1 คืน เหมาะกับน้องที่ยังตัดสินใจไม่ได้ระหว่างแพทย์ ทันตะ หรือเภสัช",
    recurrence_pattern: "biannual",
  },
];

async function main() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error("❌ Missing required environment variables: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY");
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  console.log(`🚀 Seeding ${CAMPHUB_DOCTOR_CAMPS.length} graded medical camps into competitions table...`);

  let inserted = 0;
  let updated = 0;

  for (const camp of CAMPHUB_DOCTOR_CAMPS) {
    // Check if camp already exists by name_th or url
    const { data: existing } = await supabase
      .from("competitions")
      .select("id, name_th")
      .or(`name_th.eq."${camp.name_th}",url.eq."${camp.url}"`)
      .maybeSingle();

    if (existing) {
      const { error } = await supabase
        .from("competitions")
        .update({
          name_en: camp.name_en,
          field: camp.field,
          grade_levels: camp.grade_levels,
          weight: camp.weight,
          deadline: camp.deadline,
          notes: camp.notes,
          recurrence_pattern: camp.recurrence_pattern,
          is_active: true,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existing.id);

      if (error) {
        console.error(`❌ Failed to update ${camp.name_th}:`, error.message);
      } else {
        console.log(`🔄 Updated: ${camp.name_th} (Weight ${camp.weight})`);
        updated++;
      }
    } else {
      const { error } = await supabase.from("competitions").insert({
        name_th: camp.name_th,
        name_en: camp.name_en,
        field: camp.field,
        grade_levels: camp.grade_levels,
        weight: camp.weight,
        deadline: camp.deadline,
        url: camp.url,
        notes: camp.notes,
        recurrence_pattern: camp.recurrence_pattern,
        is_active: true,
        source_checked_at: new Date().toISOString(),
        verified_by: "camphub-doctor-audit-2026",
      });

      if (error) {
        console.error(`❌ Failed to insert ${camp.name_th}:`, error.message);
      } else {
        console.log(`✨ Inserted: ${camp.name_th} (Weight ${camp.weight})`);
        inserted++;
      }
    }
  }

  console.log(`\n🎉 Completed! Inserted: ${inserted}, Updated: ${updated}`);
}

main().catch(console.error);
