import type { DmLeadClassification, DmLeadStage } from "@/types/dm-leads";

const GRADE_PATTERNS: { pattern: RegExp; label: string }[] = [
  { pattern: /ม\s*\.?\s*4|m4|มัธยม\s*4/i, label: "ม.4" },
  { pattern: /ม\s*\.?\s*5|m5|มัธยม\s*5/i, label: "ม.5" },
  { pattern: /ม\s*\.?\s*6|m6|มัธยม\s*6/i, label: "ม.6" },
  { pattern: /ม\s*\.?\s*3|m3|มัธยม\s*3/i, label: "ม.3" },
  { pattern: /ปี\s*1|freshman|year\s*1/i, label: "ปี 1" },
];

// A negated activity mention ("ยังไม่เคยเข้าค่าย", "ไม่มีผลงานอะไรเลย") is
// evidence of "exploring", not "building" — the bare keyword match alone
// can't tell the difference, so strip these spans before testing signals.
const NEGATED_ACTIVITY = new RegExp(
  "(?:ไม่เคย|ยังไม่เคย|ไม่มี|ยังไม่มี|ไม่ได้|ยังไม่ได้|ไม่)" +
    "[^.!?\\n]{0,20}" +
    "(?:ค่าย|โครงงาน|โปรเจกต์|แข่ง(?:ขัน)?|ผลงาน|เข้าร่วม|project|camp|portfolio)",
  "gi"
);

const BUILDING_SIGNALS = [
  /ทำโครงงาน/, /โปรเจกต์/, /project/i, /สร้างเกม/, /build.*app/i,
  /เคยทำ/, /portfolio/i, /แข่ง/, /hackathon/i, /ค่าย/, /camp/i, /เกียรติบัตร/,
];

const JOB_SEEKING_SIGNALS = [
  /freelance/i, /หางาน/, /รับงาน/, /portfolio.*ส่ง/, /ฝึกงาน/, /internship/i, /จ้างงาน/,
];

// Explicit interest in trying PathLab — asking how to start, wanting to try
// a project, or naming the product directly.
const PATHLAB_SIGNALS = [
  /pathlab/i, /path\s*lab/i, /เริ่ม[^.!?\n]{0,15}(?:ยังไง|ต้น|ลงมือ)/, /อยากลอง/, /อยากเริ่ม/,
  /อยากลงมือทำ/, /ควรเริ่มตรงไหน/, /อยากทำโปรเจกต์/,
];

// Buying intent — asking about price/enrollment, not just browsing info.
const PAY_READY_SIGNALS = [
  /ราคา/, /ค่าเรียน/, /กี่บาท/, /เท่าไหร่.*บาท/, /สมัคร/, /ลงทะเบียน/, /จ่าย(?:เงิน|ค่า)?/,
  /จอง(?:ที่|คิว)/, /วิธีสมัคร/, /enroll/i, /register/i,
];

// Wants an ongoing group / mentor / community, not a one-off program.
const COMMUNITY_SIGNALS = [
  /community/i, /ชุมชน/, /หาทีม/, /หาเพื่อนทำโปรเจกต์/, /กลุ่มคนที่สนใจเหมือนกัน/,
  /mentor/i, /ที่ปรึกษาต่อเนื่อง/, /ทำโปรเจกต์ต่อ/,
];

// Common Thai faculty/major names mentioned in leads. Order matters where
// one name is a substring of another (e.g. เทคนิคการแพทย์ before แพทย์).
const INTEREST_KEYWORDS: { pattern: RegExp; label: string }[] = [
  { pattern: /เทคนิคการแพทย์/, label: "เทคนิคการแพทย์" },
  { pattern: /แพทย์|หมอ/, label: "แพทยศาสตร์" },
  { pattern: /ทันตะ/, label: "ทันตแพทยศาสตร์" },
  { pattern: /เภสัช/, label: "เภสัชศาสตร์" },
  { pattern: /สัตวแพทย์|สัตวะ/, label: "สัตวแพทยศาสตร์" },
  { pattern: /พยาบาล/, label: "พยาบาลศาสตร์" },
  { pattern: /พาราเมดิก/, label: "พาราเมดิก" },
  { pattern: /วิศว(?:กรรม)?คอม|cecs|วิศวะคอม/i, label: "วิศวกรรมคอมพิวเตอร์" },
  { pattern: /วิศว(?:กรรม)?ไฟฟ้า/, label: "วิศวกรรมไฟฟ้า" },
  { pattern: /วิศว(?:กรรม)?|วิศวะ/, label: "วิศวกรรมศาสตร์" },
  { pattern: /จิตวิทยา/, label: "จิตวิทยา" },
  { pattern: /นิเทศ/, label: "นิเทศศาสตร์" },
  { pattern: /อักษร/, label: "อักษรศาสตร์" },
  { pattern: /มนุษยศาสตร์/, label: "มนุษยศาสตร์" },
  { pattern: /ครุศาสตร์|ศึกษาศาสตร์/, label: "ครุศาสตร์" },
  { pattern: /นิติ|กฎหมาย/, label: "นิติศาสตร์" },
  { pattern: /บริหารธุรกิจ|บริหาร/, label: "บริหารธุรกิจ" },
  { pattern: /เศรษฐศาสตร์/, label: "เศรษฐศาสตร์" },
  { pattern: /สถาปัตย/, label: "สถาปัตยกรรมศาสตร์" },
  { pattern: /ท่องเที่ยว|โรงแรม/, label: "การท่องเที่ยวและการโรงแรม" },
  { pattern: /คอมพิวเตอร์|programming|เขียนโปรแกรม/i, label: "วิทยาการคอมพิวเตอร์" },
  { pattern: /เทคโนโลยี/, label: "เทคโนโลยี" },
];

/**
 * Rule-based first pass on the raw thread text. Cheap and good enough to
 * route the lead; an admin can always override via applyClassification.
 */
export function classifyConversationText(messages: string[]): DmLeadClassification {
  const text = messages.join("\n");
  const textWithoutNegatedActivity = text.replace(NEGATED_ACTIVITY, "");

  const gradeMatch = GRADE_PATTERNS.find(({ pattern }) => pattern.test(text));
  const gradeLevel = gradeMatch?.label ?? null;

  const isJobSeeking = JOB_SEEKING_SIGNALS.some((p) => p.test(textWithoutNegatedActivity));
  const isBuilding = BUILDING_SIGNALS.some((p) => p.test(textWithoutNegatedActivity));

  let stage: DmLeadStage = "exploring";
  if (isJobSeeking) stage = "job_seeking";
  else if (isBuilding) stage = "building";
  else if (!gradeLevel && text.trim().length === 0) stage = "unknown";

  const interests = INTEREST_KEYWORDS.filter(({ pattern }) => pattern.test(text)).map(
    ({ label }) => label
  );

  const recommendedProduct = stageToProduct(stage);

  return {
    gradeLevel,
    interests,
    activitiesSummary: text.slice(0, 500),
    stage,
    recommendedProduct,
    hasHandsOnExperience: isBuilding,
    wantsPathlab: PATHLAB_SIGNALS.some((p) => p.test(text)),
    pathlabPayReady: PAY_READY_SIGNALS.some((p) => p.test(text)),
    wantsCommunity: COMMUNITY_SIGNALS.some((p) => p.test(text)),
    wantsTalent: isJobSeeking,
  };
}

export function stageToProduct(stage: DmLeadStage): string {
  switch (stage) {
    case "exploring":
      return "PathLab — https://www.passionseed.org/pathlab";
    case "building":
      return "Community";
    case "job_seeking":
      return "Talent platform";
    default:
      return "";
  }
}
