export interface LeadClassification {
  gradeLevel: string | null;
  interests: string[];
  activitiesSummary: string;
  stage: "unknown" | "exploring" | "building" | "job_seeking";
  recommendedProduct: string;
  hasHandsOnExperience: boolean;
  wantsPathlab: boolean;
  pathlabPayReady: boolean;
  wantsCommunity: boolean;
  wantsTalent: boolean;
}

const GRADES: Array<[RegExp, string]> = [
  [/ม\s*\.?\s*4|m4|มัธยม\s*4/i, "ม.4"],
  [/ม\s*\.?\s*5|m5|มัธยม\s*5/i, "ม.5"],
  [/ม\s*\.?\s*6|m6|มัธยม\s*6/i, "ม.6"],
  [/ม\s*\.?\s*3|m3|มัธยม\s*3/i, "ม.3"],
  [/ปี\s*1|freshman|year\s*1/i, "ปี 1"],
];

const INTERESTS: Array<[RegExp, string]> = [
  [/เทคนิคการแพทย์/, "เทคนิคการแพทย์"],
  [/แพทย์|หมอ/, "แพทยศาสตร์"],
  [/ทันตะ/, "ทันตแพทยศาสตร์"],
  [/เภสัช/, "เภสัชศาสตร์"],
  [/สัตวแพทย์|สัตวะ/, "สัตวแพทยศาสตร์"],
  [/พยาบาล/, "พยาบาลศาสตร์"],
  [/พาราเมดิก/, "พาราเมดิก"],
  [/วิศว(?:กรรม)?คอม|cecs|วิศวะคอม/i, "วิศวกรรมคอมพิวเตอร์"],
  [/วิศว(?:กรรม)?ไฟฟ้า/, "วิศวกรรมไฟฟ้า"],
  [/วิศว(?:กรรม)?|วิศวะ/, "วิศวกรรมศาสตร์"],
  [/จิตวิทยา/, "จิตวิทยา"],
  [/นิเทศ/, "นิเทศศาสตร์"],
  [/อักษร/, "อักษรศาสตร์"],
  [/มนุษยศาสตร์/, "มนุษยศาสตร์"],
  [/ครุศาสตร์|ศึกษาศาสตร์/, "ครุศาสตร์"],
  [/นิติ|กฎหมาย/, "นิติศาสตร์"],
  [/บริหารธุรกิจ|บริหาร/, "บริหารธุรกิจ"],
  [/เศรษฐศาสตร์/, "เศรษฐศาสตร์"],
  [/สถาปัตย/, "สถาปัตยกรรมศาสตร์"],
  [/ท่องเที่ยว|โรงแรม/, "การท่องเที่ยวและการโรงแรม"],
  [/คอมพิวเตอร์|programming|เขียนโปรแกรม/i, "วิทยาการคอมพิวเตอร์"],
  [/เทคโนโลยี/, "เทคโนโลยี"],
];

const BUILDING = [
  /ทำโครงงาน/,
  /โปรเจกต์/,
  /project/i,
  /สร้างเกม/,
  /build.*app/i,
  /เคยทำ/,
  /portfolio/i,
  /แข่ง/,
  /hackathon/i,
  /ค่าย/,
  /camp/i,
  /เกียรติบัตร/,
];
const JOB = [
  /freelance/i,
  /หางาน/,
  /รับงาน/,
  /portfolio.*ส่ง/,
  /ฝึกงาน/,
  /internship/i,
  /จ้างงาน/,
];
const PATHLAB = [
  /pathlab/i,
  /path\s*lab/i,
  /เริ่ม[^.!?\n]{0,15}(?:ยังไง|ต้น|ลงมือ)/,
  /อยากลอง/,
  /อยากเริ่ม/,
  /อยากลงมือทำ/,
  /ควรเริ่มตรงไหน/,
  /อยากทำโปรเจกต์/,
];
const PAY = [
  /ราคา/,
  /ค่าเรียน/,
  /กี่บาท/,
  /เท่าไหร่.*บาท/,
  /สมัคร/,
  /ลงทะเบียน/,
  /จ่าย(?:เงิน|ค่า)?/,
  /จอง(?:ที่|คิว)/,
  /วิธีสมัคร/,
  /enroll/i,
  /register/i,
];
const COMMUNITY = [
  /community/i,
  /ชุมชน/,
  /หาทีม/,
  /หาเพื่อนทำโปรเจกต์/,
  /กลุ่มคนที่สนใจเหมือนกัน/,
  /mentor/i,
  /ที่ปรึกษาต่อเนื่อง/,
  /ทำโปรเจกต์ต่อ/,
];
const NEGATED_ACTIVITY =
  /(?:ไม่เคย|ยังไม่เคย|ไม่มี|ยังไม่มี|ไม่ได้|ยังไม่ได้|ไม่)[^.!?\n]{0,20}(?:ค่าย|โครงงาน|โปรเจกต์|แข่ง(?:ขัน)?|ผลงาน|เข้าร่วม|project|camp|portfolio)/gi;

function stageProduct(stage: LeadClassification["stage"]): string {
  if (stage === "exploring") {
    return "PathLab — https://www.passionseed.org/pathlab";
  }
  if (stage === "building") return "Community";
  if (stage === "job_seeking") return "Talent platform";
  return "";
}

export function classifyConversation(messages: string[]): LeadClassification {
  const text = messages.join("\n");
  const positiveText = text.replace(NEGATED_ACTIVITY, "");
  const gradeLevel = GRADES.find(([pattern]) => pattern.test(text))?.[1] ??
    null;
  const isJobSeeking = JOB.some((pattern) => pattern.test(positiveText));
  const isBuilding = BUILDING.some((pattern) => pattern.test(positiveText));
  const stage: LeadClassification["stage"] = isJobSeeking
    ? "job_seeking"
    : isBuilding
    ? "building"
    : text.trim()
    ? "exploring"
    : "unknown";

  return {
    gradeLevel,
    interests: INTERESTS.filter(([pattern]) => pattern.test(text)).map((
      [, label],
    ) => label),
    activitiesSummary: text.slice(0, 500),
    stage,
    recommendedProduct: stageProduct(stage),
    hasHandsOnExperience: isBuilding,
    wantsPathlab: PATHLAB.some((pattern) => pattern.test(text)),
    pathlabPayReady: PAY.some((pattern) => pattern.test(text)),
    wantsCommunity: COMMUNITY.some((pattern) => pattern.test(text)),
    wantsTalent: isJobSeeking,
  };
}
