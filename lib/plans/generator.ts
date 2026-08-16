import { createAdminClient } from "@/utils/supabase/admin";
import { COVERED_FIELDS } from "@/lib/dm-leads/playbook";
import type {
  GeneratedPlanDraft,
  PlanDraftRequest,
  PlanPriorityItem,
  PlanStepOneAction,
  PlanTimelineItem,
} from "@/types/student-plan";

interface CompetitionRow {
  id: string;
  name_th: string;
  name_en: string | null;
  field: string[];
  grade_levels: string[];
  weight: number;
  application_opens: string | null;
  deadline: string | null;
  url: string | null;
  notes: string | null;
}

/**
 * Format deadline date to readable Thai short date (e.g. '30 ก.ย. 69' or 'ปิด 15 เม.ย.')
 */
function formatDeadlineTh(dateStr: string | null): string {
  if (!dateStr) return "ช่วงเปิดรับสมัคร";
  try {
    const d = new Date(dateStr);
    const months = [
      "ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.",
      "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."
    ];
    const day = d.getDate();
    const month = months[d.getMonth()];
    const year = (d.getFullYear() + 543) % 100;
    return `ปิด ${day} ${month} ${year}`;
  } catch {
    return "ช่วงเปิดรับสมัคร";
  }
}

function formatMonthTh(dateStr: string | null): string {
  if (!dateStr) return "ช่วงเปิดเทอม";
  try {
    const d = new Date(dateStr);
    const months = [
      "ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.",
      "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."
    ];
    const month = months[d.getMonth()];
    const year = (d.getFullYear() + 543) % 100;
    return `${month} ${year}`;
  } catch {
    return "ช่วงเปิดเทอม";
  }
}

/**
 * Extract subfield and specific interests directly from conversation text
 */
export function extractSpecificFieldFromText(text: string, fallbackInterests: string[] = []): string {
  const lower = text.toLowerCase();

  // Specific high-intent subfields
  if (lower.includes("ยานยนต์") || lower.includes("เครื่องกล")) {
    return "วิศวกรรมเครื่องกล / ยานยนต์";
  }
  if (lower.includes("โยธา") || lower.includes("โครงสร้าง")) {
    return "วิศวกรรมโยธา / โครงสร้าง";
  }
  if (lower.includes("หุ่นยนต์") || lower.includes("เมคคาทรอนิกส์") || lower.includes("robot")) {
    return "วิศวกรรมหุ่นยนต์และระบบอัตโนมัติ";
  }
  if (lower.includes("ไฟฟ้า") || lower.includes("อิเล็กทรอนิกส์")) {
    return "วิศวกรรมไฟฟ้าและอิเล็กทรอนิกส์";
  }
  if (lower.includes("การบิน") || lower.includes("อวกาศ") || lower.includes("aerospace")) {
    return "วิศวกรรมการบินและอวกาศ";
  }
  if (lower.includes("วิศวะคอม") || lower.includes("วิศวกรรมคอม") || lower.includes("cecs")) {
    return "วิศวกรรมคอมพิวเตอร์";
  }
  if (lower.includes("ai") || lower.includes("ปัญญาประดิษฐ์") || lower.includes("data")) {
    return "วิทยาการคอมพิวเตอร์ / ปัญญาประดิษฐ์ (AI)";
  }
  if (lower.includes("cyber") || lower.includes("ความมั่นคงปลอดภัยไซเบอร์")) {
    return "วิทยาการคอมพิวเตอร์ / ความมั่นคงปลอดภัยไซเบอร์";
  }
  if (
    (lower.includes("ภาษา") && lower.includes("นิเทศ")) ||
    (lower.includes("นิเทศ") && lower.includes("สื่อ"))
  ) {
    return "ภาษาและการสื่อสารดิจิทัล / นิเทศศาสตร์";
  }
  if (lower.includes("นิเทศ") || lower.includes("วารสาร") || lower.includes("ภาพยนตร์") || lower.includes("คอนเทนต์")) {
    return "นิเทศศาสตร์ / สื่อสารมวลชน";
  }
  if (lower.includes("อักษร") || lower.includes("มนุษยศาสตร์") || lower.includes("ศิลปศาสตร์") || lower.includes("ภาษา")) {
    return "อักษรศาสตร์ / ภาษาและการสื่อสาร";
  }
  if (lower.includes("ทันตะ") || lower.includes("หมอฟัน")) {
    return "ทันตแพทยศาสตร์";
  }
  if (lower.includes("เภสัช")) {
    return "เภสัชศาสตร์";
  }
  if (lower.includes("แพทย์") || lower.includes("หมอ")) {
    return "แพทยศาสตร์";
  }
  if (lower.includes("พยาบาล")) {
    return "พยาบาลศาสตร์";
  }
  if (lower.includes("ชีวการแพทย์") || lower.includes("biomedical")) {
    return "วิศวกรรมชีวการแพทย์";
  }
  if (lower.includes("นิติ") || lower.includes("กฎหมาย")) {
    return "นิติศาสตร์";
  }
  if (lower.includes("รัฐศาสตร์") || lower.includes("ความสัมพันธ์ระหว่างประเทศ")) {
    return "รัฐศาสตร์ / ความสัมพันธ์ระหว่างประเทศ";
  }
  if (lower.includes("บริหาร") || lower.includes("bba") || lower.includes("ธุรกิจ") || lower.includes("การตลาด")) {
    return "บริหารธุรกิจ / การตลาด";
  }
  if (lower.includes("เศรษฐศาสตร์") || lower.includes("econ")) {
    return "เศรษฐศาสตร์";
  }
  if (lower.includes("สถาปัตย์") || lower.includes("interior") || lower.includes("ออกแบบ")) {
    return "สถาปัตยกรรมศาสตร์ / การออกแบบ";
  }
  if (lower.includes("จิตวิทยา")) {
    return "จิตวิทยา";
  }

  // Fallback to interests array or default
  if (fallbackInterests.length > 0) {
    return fallbackInterests.join(" / ");
  }

  return "วิศวกรรมศาสตร์";
}

/**
 * Format student name cleanly for display and DM greetings
 */
export function formatStudentDisplayName(rawName?: string | null, username?: string | null): string {
  if (rawName && rawName.trim() && rawName !== "null" && rawName !== "undefined") {
    return rawName.replace(/^@+/, "").trim();
  }
  if (username && username.trim() && username !== "null" && username !== "undefined") {
    return username.replace(/^@+/, "").trim();
  }
  return "น้อง";
}

/**
 * Keyword bank per archetype. Shared by getFieldArchetype (student field ->
 * archetype) and the DB competition matcher (competition.field[] ->
 * archetype), so widening a field's coverage only means editing one list.
 */
const ARCHETYPE_KEYWORDS: Record<string, string[]> = {
  engineering: ["วิศว", "หุ่นยนต์", "ยานยนต์", "เครื่องกล", "โยธา", "ไฟฟ้า", "การบิน"],
  computer_science: ["คอม", "ซอฟต์แวร์", "ai", "ไอที", "cyber", "เว็บ", "data"],
  health_medical: ["แพทย์", "หมอ", "ทันตะ", "เภสัช", "พยาบาล", "ชีว", "สุขภาพ"],
  business_econ: ["ธุรกิจ", "บริหาร", "เศรษฐศาสตร์", "การตลาด", "startup", "การเงิน", "bba"],
  communication_arts: ["นิเทศ", "สื่อ", "ภาษา", "วารสาร", "คอนเทนต์", "อักษร", "ศิลปศาสตร์"],
  architecture_design: ["สถาปัตย์", "ออกแบบ", "design", "interior"],
  law_polsci: ["นิติ", "กฎหมาย", "รัฐศาสตร์"],
};

/**
 * Identify Field Archetype for ranked priorities
 */
function getFieldArchetype(field: string, interests: string[] = []): string {
  const combined = `${field} ${interests.join(" ")}`.toLowerCase();

  for (const [archetype, keywords] of Object.entries(ARCHETYPE_KEYWORDS)) {
    if (keywords.some((k) => combined.includes(k))) {
      return archetype;
    }
  }

  return "general";
}

/**
 * Generate 3 Ranked Priorities based on archetype
 */
function getRankedPrioritiesForArchetype(
  archetype: string,
  targetField: string
): PlanPriorityItem[] {
  switch (archetype) {
    case "engineering":
      return [
        {
          rank: 1,
          title: "โปรเจกต์เชิงกลไก/วิศวกรรมจริง",
          stars: 5,
          description:
            "เช่น ชิ้นงาน CAD 3D, โมเดลระบบส่งกำลัง/ช่วงล่าง, สิ่งประดิษฐ์กลไก หรือหุ่นยนต์ มีการคำนวณและชิ้นงานจริง",
          tag: "โปรเจกต์หลักชูโรง",
        },
        {
          rank: 2,
          title: "เวทีแข่งด้านฟิสิกส์/สิ่งประดิษฐ์/กลไก",
          stars: 4,
          description:
            "เช่น สอวน. ฟิสิกส์, โครงงานสิ่งประดิษฐ์คนรุ่นใหม่ (I-New Gen), หุ่นยนต์ ส.ส.ท. หรือ CanSat",
          tag: "เวทีแข่งขัน",
        },
        {
          rank: 3,
          title: "ค่ายวิศวะที่ได้ลงมือทำจริงใน Lab",
          stars: 3,
          description:
            "เช่น ค่าย 2B-KMUTT (มีโควตา TCAS1), ค่ายลานเกียร์ จุฬาฯ หรือค่ายเจาะลึกภาควิชา",
          tag: "ค่ายมหาลัย",
        },
      ];

    case "computer_science":
      return [
        {
          rank: 1,
          title: "โปรเจกต์ซอฟต์แวร์/AI ใช้งานได้จริง",
          stars: 5,
          description:
            "เว็บแอป, โมเดล AI หรือระบบอัตโนมัติที่มีผู้ใช้งานจริงและขึ้น GitHub/Live Demo",
          tag: "โปรเจกต์หลักชูโรง",
        },
        {
          rank: 2,
          title: "เวทีแข่งขัน Coding / Hackathon / NSC",
          stars: 4,
          description:
            "เช่น NSC ครั้งที่ 28, Super AI Engineer, AI Builders, Thailand Cyber Top Talent",
          tag: "เวทีแข่งขัน",
        },
        {
          rank: 3,
          title: "ค่ายเจาะลึกคอมพิวเตอร์ระดับมหาวิทยาลัย",
          stars: 3,
          description:
            "เช่น ComCamp มจธ., NextGen AI สจล. หรือ Bangmod Hackathon",
          tag: "ค่ายมหาลัย",
        },
      ];

    case "health_medical":
      return [
        {
          rank: 1,
          title: "งานวิจัย/โครงงานวิทยาศาสตร์สุขภาพ & ชุมชน",
          stars: 5,
          description:
            "โครงงานนวัตกรรมสุขภาพ, ชีวการแพทย์ หรือโปรเจกต์แก้ปัญหาสุขภาพชุมชนที่เก็บ Data จริง",
          tag: "โปรเจกต์หลักชูโรง",
        },
        {
          rank: 2,
          title: "สอวน. ชีววิทยา / การประกวดโครงงาน YSC / JSTP",
          stars: 5,
          description:
            "เวทีแข่งขันวิชาการและการประกวดโครงงานวิทยาศาสตร์ระดับประเทศ",
          tag: "เวทีแข่งขัน",
        },
        {
          rank: 3,
          title: "ค่ายเจาะลึกสายแพทย์/เภสัช & กิจกรรมอาสา",
          stars: 4,
          description:
            "เช่น ค่ายอยากเป็นหมอ MDCU, ค่าย Pharmacamp, ตอบปัญหาวิทยาศาสตร์การแพทย์ AMSci",
          tag: "ค่ายมหาลัย",
        },
      ];

    case "communication_arts":
      return [
        {
          rank: 1,
          title: "โปรเจกต์สื่อ/คอนเทนต์ที่มีผลงานและพัฒนาการจริง",
          stars: 5,
          description:
            "เช่น คอนเทนต์ 2 ภาษา, บทความวิเคราะห์เจาะลึก, เพจ/ช่อง Podcast หรือสื่อมัลติมีเดีย",
          tag: "โปรเจกต์หลักชูโรง",
        },
        {
          rank: 2,
          title: "เวทีประกวดนวัตกรรมสื่อและการสื่อสาร",
          stars: 4,
          description:
            "เช่น ค่าย JWC (Junior Webmaster Camp - Web Content) หรือการแข่งขันสปีช/บทความ",
          tag: "เวทีแข่งขัน",
        },
        {
          rank: 3,
          title: "ค่ายมหาลัยที่ได้ Workshop ผลงานจริงกลับมา",
          stars: 3,
          description:
            "ค่ายนิเทศ/วารสารศาสตร์ที่ให้ทดลองผลิตสื่อจริง ไม่ใช่แค่ฟังบรรยาย",
          tag: "ค่ายมหาลัย",
        },
      ];

    case "business_econ":
      return [
        {
          rank: 1,
          title: "โปรเจกต์ธุรกิจจริง / Case Study ที่มี Traction",
          stars: 5,
          description:
            "ทดลองทำธุรกิจขนาดเล็ก, แผนการตลาดดิจิทัล หรือโครงการแก้ปัญหาธุรกิจจริง",
          tag: "โปรเจกต์หลักชูโรง",
        },
        {
          rank: 2,
          title: "การแข่งขัน Business Case / เศรษฐศาสตร์โอลิมปิก",
          stars: 5,
          description:
            "เช่น TEO Thailand Economics Olympiad, ASPIRE Case Club มธ., SET INVESTORY",
          tag: "เวทีแข่งขัน",
        },
        {
          rank: 3,
          title: "ค่ายบริหารธุรกิจและสตาร์ตอัปของมหาลัย",
          stars: 3,
          description:
            "เวิร์กช็อป Business Model Canvas, Techstars Startup Weekend หรือ UniHack",
          tag: "ค่ายมหาลัย",
        },
      ];

    default:
      return [
        {
          rank: 1,
          title: `โปรเจกต์ชูโรงที่เกี่ยวข้องกับสาย ${targetField}`,
          stars: 5,
          description:
            "ผลงานที่เป็นรูปธรรม 1 ชิ้น แสดงถึงความสนใจและทักษะเฉพาะทางที่ลึกซึ้ง",
          tag: "โปรเจกต์หลักชูโรง",
        },
        {
          rank: 2,
          title: "การแข่งขัน/โครงงานระดับจังหวัดหรือระดับประเทศ",
          stars: 4,
          description:
            "เวทีประกวดที่วัดทักษะเฉพาะทางและมีเกียรติบัตรรับรอง",
          tag: "เวทีแข่งขัน",
        },
        {
          rank: 3,
          title: "ค่ายเจาะลึกวิชาชีพของมหาวิทยาลัย",
          stars: 3,
          description:
            "ค่ายเชิงปฏิบัติการที่ได้ลงมือทำจริงร่วมกับอาจารย์และรุ่นพี่",
          tag: "ค่ายมหาลัย",
        },
      ];
  }
}

/**
 * Fallback 2 timeline items (camp + competition slot) used when no live DB
 * competition matched the student's field. Named real camps/contests per
 * archetype instead of the generic "ค่ายเจาะลึกเฉพาะสาขา" placeholder.
 */
function getFallbackTimelineForArchetype(
  archetype: string,
  targetField: string
): PlanTimelineItem[] {
  // No confirmed month/deadline exists for these — none are pulled from the
  // DB competitions table. Leave month/deadline as a search prompt instead
  // of inventing a range; isVerified:false tells the UI to render this as a
  // "find the real date yourself" line, not a scheduled date.
  const titles: Record<string, [string, string]> = {
    engineering: [
      "ค่าย 2B-KMUTT / ค่ายลานเกียร์ จุฬาฯ / ค่ายเจาะลึกภาควิชาวิศวะ",
      "โครงงานสิ่งประดิษฐ์คนรุ่นใหม่ (I-New Gen) / หุ่นยนต์ ส.ส.ท. / CanSat",
    ],
    computer_science: [
      "ค่าย ComCamp มจธ. / NextGen AI สจล. / Bangmod Hackathon",
      "NSC / Super AI Engineer / Thailand Cyber Top Talent",
    ],
    health_medical: [
      "ค่ายอยากเป็นหมอ MDCU / ค่าย Pharmacamp / ตอบปัญหาวิทยาศาสตร์การแพทย์ AMSci",
      "สอวน. ชีววิทยา / YSC / JSTP",
    ],
    business_econ: [
      "Business Model Canvas Workshop / Techstars Startup Weekend / UniHack",
      "TEO Thailand Economics Olympiad / ASPIRE Case Club มธ. / SET INVESTORY",
    ],
    communication_arts: [
      "ค่ายนิเทศ/วารสารศาสตร์ที่ให้ทดลองผลิตสื่อจริง",
      "ค่าย JWC (Junior Webmaster Camp) / การแข่งขันสปีช-บทความระดับประเทศ",
    ],
    architecture_design: [
      "ค่ายสถาปัตย์จุฬาฯ / ค่ายเตรียมสถาปัตย์ลาดกระบัง / Workshop ออกแบบเชิงปฏิบัติ",
      "ประกวดออกแบบสถาปัตยกรรม/ผลิตภัณฑ์ระดับนักเรียน",
    ],
    law_polsci: [
      "ค่ายนิติศาสตร์/รัฐศาสตร์จำลอง (Moot Court, Model UN)",
      "การแข่งขันโต้วาที / เขียนบทความกฎหมาย-รัฐศาสตร์ระดับประเทศ",
    ],
  };

  const [campTitle, competitionTitle] = titles[archetype] || [
    `ค่ายเจาะลึกสาย ${targetField} ของมหาวิทยาลัย`,
    `เวทีประกวดสาย ${targetField} ระดับภูมิภาค/ประเทศ`,
  ];

  return [
    {
      month: "ค้นหาวันที่",
      title: campTitle,
      deadline: "ยังไม่ยืนยันรอบ — เช็กเว็บทางการก่อนยื่น",
      weight: 3,
      isVerified: false,
    },
    {
      month: "ค้นหาวันที่",
      title: competitionTitle,
      deadline: "ยังไม่ยืนยันรอบ — เช็กเว็บทางการก่อนยื่น",
      weight: 4,
      isVerified: false,
    },
  ];
}

/**
 * Month-6 bookend copy depends on how far the student actually is from
 * TCAS1. Most leads are ม.4/ม.5 (66 + 39 of 119 known-grade conversations
 * vs. 14 ม.6 — checked against dm_conversations), so "พร้อมยื่น TCAS1" as a
 * fixed month-6 goal is wrong for the majority: they aren't submitting
 * anything in 6 months. Only ม.6 is actually submitting TCAS1 this cycle.
 */
function getMonth6MilestoneForGrade(gradeLevel: string): PlanTimelineItem {
  const grade = normalizeGrade(gradeLevel);

  if (grade === "ม.6") {
    return {
      month: "เดือนที่ 6",
      title: "รวบรวมหลักฐาน + จัดรูปเล่ม Portfolio สรุป Impact",
      deadline: "พร้อมยื่น TCAS1",
      weight: 5,
      isVerified: true,
    };
  }

  if (grade === "ม.5") {
    return {
      month: "เดือนที่ 6",
      title: "รวบรวมหลักฐาน + จัดรูปเล่ม Portfolio ชิ้นแรกให้เป็นระบบ",
      deadline: "พร้อมต่อยอดตอนขึ้น ม.6 ปีหน้า",
      weight: 5,
      isVerified: true,
    };
  }

  if (grade === "ม.3" || grade === "ม.4") {
    return {
      month: "เดือนที่ 6",
      title: "รวบรวมหลักฐาน + จัดรูปเล่ม Portfolio ชิ้นแรกให้เป็นระบบ",
      deadline: "สะสมผลงานต่อเนื่องก่อนถึงปี TCAS",
      weight: 5,
      isVerified: true,
    };
  }

  // Unrecognized grade string (e.g. "ปี 1") — university-track framing.
  return {
    month: "เดือนที่ 6",
    title: "รวบรวมหลักฐาน + จัดรูปเล่ม Portfolio ให้เป็นระบบ",
    deadline: "พร้อมใช้สมัครฝึกงาน/ทุนต่อยอด",
    weight: 5,
    isVerified: true,
  };
}

/**
 * Format Value-First DM Copy
 */
export function formatPlanDmCopy(draft: {
  studentName: string;
  gradeLevel: string;
  targetField: string;
  rankedPriorities: PlanPriorityItem[];
  stepOneAction: PlanStepOneAction;
}): string {
  const nameDisplay = draft.studentName ? `น้อง ${draft.studentName}` : "น้อง";

  const priorityLines = draft.rankedPriorities
    .map(
      (p) =>
        `${p.rank}. ${p.title} ${"★".repeat(p.stars)}${"☆".repeat(5 - p.stars)}\n   ${p.description}`
    )
    .join("\n\n");

  return `จัดให้เลยครับ${nameDisplay}! 🎯 พี่ลองวางเป็นแนวทางสำหรับ **${draft.gradeLevel} ${draft.targetField}** ให้ก่อนนะ

**3 อย่างที่พี่อยากให้น้องโฟกัส (เรียงตามน้ำหนักพอร์ต)**

${priorityLines}

**ช่วง 6 เดือนนี้**
1. เริ่มจากทำโปรเจกต์ชิ้นแรกให้เสร็จสมบูรณ์ 1 ชิ้น
2. ติดตามกำหนดการค่ายและเวทีแข่งที่ตรงสาย
3. สรุปกระบวนการคิดและผลงานลง Portfolio พร้อมยื่น TCAS1

ส่วนพี่อยากให้น้องเริ่มจากการ **ลองทำโปรเจกต์จริง 1 ชิ้นก่อน** จะได้รู้ด้วยว่าชอบสายนี้จริงไหม ไม่ใช่ทำพอร์ตไปเรื่อยๆ โดยยังไม่เห็นภาพงานจริง

ถ้าน้องสนใจ เดี๋ยวพี่ช่วยดูต่อให้ได้ว่า **โปรเจกต์แรกควรเริ่มจากอะไรดี** ครับ 😊`;
}

/**
 * Normalize grade strings ("ม.5", "ม5", "Grade 11") for comparing against
 * competitions.grade_levels entries like "ม.5".
 */
function normalizeGrade(g: string): string {
  const m = g.match(/ม\.?\s*([1-6])/);
  if (m) return `ม.${m[1]}`;
  const e = g.match(/grade\s*(1[0-2])\b/i);
  if (e) return `ม.${Number(e[1]) - 6}`;
  return g.trim();
}

/**
 * Extract up to 2 distinct interest fields. Kids often list 2–3 interests;
 * the plan should test the top paths side by side instead of forcing one.
 */
function extractDistinctFields(targetField: string, interests: string[]): string[] {
  const raw = interests.length > 0 ? interests : targetField.split(/[/,|]+/);
  const fields = raw.map((f) => f.trim()).filter(Boolean);
  return [...new Set(fields)].slice(0, 2);
}

/**
 * Generate a complete, verified Plan Draft
 */
export async function generateDraftPlan(
  req: PlanDraftRequest
): Promise<GeneratedPlanDraft> {
  const supabase = createAdminClient();

  let studentName = req.studentName;
  let gradeLevel = req.gradeLevel;
  let targetField = req.targetField;
  let interests = req.interests || [];

  if (req.conversationId) {
    try {
      const { data: conv } = await supabase
        .from("dm_conversations")
        .select("*, dm_messages(body, direction)")
        .eq("id", req.conversationId)
        .maybeSingle();

      if (conv) {
        if (!studentName || studentName === "น้อง" || studentName === "นักเรียน") {
          studentName = formatStudentDisplayName(conv.display_name, conv.username);
        }
        if (!gradeLevel || gradeLevel === "ม.5") {
          gradeLevel = conv.grade_level || "ม.5";
        }
        if (conv.interests?.length && interests.length === 0) {
          interests = conv.interests;
        }

        // Scan messages for specific subfield mentions
        const inboundText = (conv.dm_messages || [])
          .filter((m: { direction: string }) => m.direction === "inbound")
          .map((m: { body: string }) => m.body)
          .join("\n");

        if (inboundText) {
          const detectedSpecific = extractSpecificFieldFromText(inboundText, conv.interests || []);
          if (detectedSpecific && (!targetField || targetField === "วิศวกรรมศาสตร์" || targetField === "ทั่วไป")) {
            targetField = detectedSpecific;
          }
        }
      }
    } catch (err) {
      console.error("Error inspecting conversation context:", err);
    }
  }

  const archetype = getFieldArchetype(targetField, interests);
  const distinctFields = extractDistinctFields(targetField, interests);

  // Check if field is covered by an existing seed
  const isCovered =
    COVERED_FIELDS.has(targetField.trim()) ||
    interests.some((i) => COVERED_FIELDS.has(i.trim()));

  // 1. Fetch relevant competitions from DB.
  //    Defense in depth against stale rows: even though a weekly cron expires
  //    past-deadline rows, the generator only considers competitions whose
  //    deadline is still in the future, so a poster can never advertise a
  //    competition that is already over. Rows without a deadline (TBC) are
  //    excluded — a plan needs real dates.
  let matchedCompetitions: CompetitionRow[] = [];
  try {
    const today = new Date().toISOString().slice(0, 10);
    const { data } = await supabase
      .from("competitions")
      .select("*")
      .eq("is_active", true)
      .gte("deadline", today)
      .order("deadline", { ascending: true });

    if (data && data.length > 0) {
      // Filter by archetype keywords
      const fieldKeywords = [
        targetField,
        ...interests,
      ].map((k) => k.toLowerCase());

      const studentGrade = gradeLevel ? normalizeGrade(gradeLevel) : null;

      const archetypeKeywords = ARCHETYPE_KEYWORDS[archetype] || [];

      matchedCompetitions = (data as CompetitionRow[]).filter((c) => {
        const cFields = c.field.map((f) => f.toLowerCase());
        const matchField =
          cFields.some((cf) => fieldKeywords.some((fk) => cf.includes(fk) || fk.includes(cf))) ||
          cFields.some((cf) => archetypeKeywords.some((ak) => cf.includes(ak)));

        if (!matchField) return false;

        // Only show competitions the student's grade can actually enter
        if (
          studentGrade &&
          c.grade_levels.length > 0 &&
          !c.grade_levels.includes(studentGrade)
        ) {
          return false;
        }

        return true;
      });
    }
  } catch (err) {
    console.error("Error matching competitions from DB:", err);
  }

  // 2. Build 6-Month Timeline — project bookends + real competition dates
  //    in chronological order.
  const timeline: PlanTimelineItem[] = [];

  timeline.push({
    month: "เดือนที่ 1",
    title: `เริ่มทำโปรเจกต์ ${targetField} ชิ้นแรก (วางโครงสร้าง + สร้างชิ้นงานจริง)`,
    deadline: "30 วันแรก",
    weight: 5,
    isVerified: true,
  });

  if (matchedCompetitions.length > 0) {
    matchedCompetitions.slice(0, 3).forEach((comp) => {
      timeline.push({
        month: formatMonthTh(comp.application_opens || comp.deadline),
        title: comp.name_th,
        deadline: formatDeadlineTh(comp.deadline),
        weight: comp.weight,
        url: comp.url,
        notes: comp.notes,
        isVerified: true,
      });
    });
  } else {
    // Fallback: archetype-specific real camp/competition names, not generic text
    timeline.push(...getFallbackTimelineForArchetype(archetype, targetField));
  }

  timeline.push(getMonth6MilestoneForGrade(gradeLevel));

  // 3. Build Ranked Priorities
  const rankedPriorities = getRankedPrioritiesForArchetype(
    archetype,
    targetField
  );

  // 4. Build Step 1 Action (PathLab) — framed as a 5-day path discovery:
  // build one real project to find out whether this path truly fits,
  // before committing months to competitions and portfolio building.
  // Kids with 2+ distinct interests get a dual-path test: one PathLab per
  // field, so the plan answers "which of these paths fits" with evidence.
  const isPresell = !isCovered;
  const stepOneAction: PlanStepOneAction =
    distinctFields.length >= 2
      ? {
          title: `PathLab ${distinctFields[0]} + ${distinctFields[1]}`,
          subtitle:
            "ทดลองทำโปรเจกต์จริง 2 สาย (สายละ 5 วัน) เพื่อเทียบว่าทางไหนใช่สำหรับน้อง",
          duration: "5 วัน × 2 สาย",
          price: 299,
          cohortDate: isPresell
            ? "รอบเปิดตัวเร็วๆ นี้ (จองสิทธิ์ล่วงหน้า)"
            : "รอบถัดไป เริ่มเร็วๆ นี้",
          isPresell,
          keyDeliverables: [
            `คำตอบเทียบ 2 สาย (${distinctFields[0]} vs ${distinctFields[1]}) ว่าทางไหนใช่สำหรับน้อง`,
            "โปรเจกต์ผลงานจริงอย่างน้อย 1 ชิ้นพร้อมขึ้นพอร์ต",
            "เมนเทอร์ตรวจสอบงานวันแรกและวันสรุปผล",
            "หน้าเว็บไซต์แสดงผลงานจริง (Live Project Page)",
            "เกียรติบัตรรับรองการเข้าร่วม",
            "สิทธิ์เข้าถึงแผนพอร์ต 6 เดือนฉบับเต็ม",
          ],
        }
      : {
          title: `PathLab ${targetField}`,
          subtitle: isPresell
            ? "ทำโปรเจกต์จริง 5 วัน เพื่อค้นหาว่าสายนี้ใช่สำหรับน้องไหม (เปิดรอบแรกเร็วๆ นี้)"
            : "ทำโปรเจกต์จริง 5 วัน เพื่อค้นหาว่าสายนี้ใช่สำหรับน้องไหม มีเมนเทอร์ดูแล",
          duration: "5 วัน",
          price: 299,
          cohortDate: isPresell
            ? "รอบเปิดตัวเร็วๆ นี้ (จองสิทธิ์ล่วงหน้า)"
            : "รอบถัดไป เริ่มเร็วๆ นี้",
          isPresell,
          keyDeliverables: [
            "คำตอบจากประสบการณ์จริงว่า “สายนี้ใช่สำหรับเราไหม”",
            "โปรเจกต์ผลงานจริง 1 ชิ้นพร้อมขึ้นพอร์ต",
            "เมนเทอร์ตรวจสอบงานวันแรกและวันสรุปผล",
            "หน้าเว็บไซต์แสดงผลงานจริง (Live Project Page)",
            "เกียรติบัตรรับรองการเข้าร่วม",
            "สิทธิ์เข้าถึงแผนพอร์ต 6 เดือนฉบับเต็ม",
          ],
        };

  const parentNotes = `แผนการเตรียมพอร์ตนี้ถูกออกแบบขึ้นเพื่อให้น้อง ${studentName || "นักเรียน"} มีทิศทางที่ชัดเจนในการเก็บผลงาน TCAS รอบที่ 1 โดยเน้นการสร้างผลงานเชิงลึกที่คณะกรรมการให้ความสำคัญสูงสุด (น้ำหนัก 5 ดาว) แทนการสะสมเกียรติบัตรทั่วไป`;

  const customAdvice = `เน้นการบันทึกกระบวนการคิด การแก้ปัญหา และผลลัพธ์ที่จับต้องได้ลงในพอร์ต เพื่อสร้างความแตกต่างในการสอบสัมภาษณ์`;

  const previewDraft = {
    studentName,
    gradeLevel,
    targetField,
    rankedPriorities,
    stepOneAction,
  };

  const templateCopy = formatPlanDmCopy(previewDraft);
  let dmCopy = templateCopy;
  try {
    const { personalizeMessage } = await import("@/lib/dm-leads/personalize");
    dmCopy = await personalizeMessage({
      template: templateCopy,
      lead: {
        displayName: studentName,
        gradeLevel,
        interests: interests.length > 0 ? interests : [targetField],
        coverage: isCovered ? "covered" : "uncovered",
      },
      kind: "plan_dm",
    });
  } catch (error) {
    console.warn("[plans.generator] Qwen plan copy failed, using template", error);
  }

  // Admin-assessed readiness from the DM conversation (1–8); defaults to 3
  // when the admin has not signalled a level yet.
  const readinessScore = Math.min(
    8,
    Math.max(1, Math.round(req.readinessScore ?? 3))
  );

  return {
    token: `p5-${Math.random().toString(36).substring(2, 8)}`,
    studentName,
    gradeLevel,
    targetField,
    readinessScore,
    rankedPriorities,
    timeline,
    stepOneAction,
    parentNotes,
    customAdvice,
    dmCopy,
    isPresell,
  };
}
