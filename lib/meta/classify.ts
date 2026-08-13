import type { DmLeadClassification, DmLeadStage } from "@/types/dm-leads";

const GRADE_PATTERNS: { pattern: RegExp; label: string }[] = [
  { pattern: /ม\s*\.?\s*4|m4|มัธยม\s*4/i, label: "ม.4" },
  { pattern: /ม\s*\.?\s*5|m5|มัธยม\s*5/i, label: "ม.5" },
  { pattern: /ม\s*\.?\s*6|m6|มัธยม\s*6/i, label: "ม.6" },
  { pattern: /ม\s*\.?\s*3|m3|มัธยม\s*3/i, label: "ม.3" },
  { pattern: /ปี\s*1|freshman|year\s*1/i, label: "ปี 1" },
];

const BUILDING_SIGNALS = [
  /ทำโครงงาน/, /โปรเจกต์/, /project/i, /สร้างเกม/, /build.*app/i,
  /เคยทำ/, /portfolio/i, /แข่ง/, /hackathon/i, /ค่าย/, /camp/i,
];

const JOB_SEEKING_SIGNALS = [
  /freelance/i, /หางาน/, /รับงาน/, /portfolio.*ส่ง/, /ฝึกงาน/, /internship/i, /จ้างงาน/,
];

/**
 * Rule-based first pass on the raw thread text. Cheap and good enough to
 * route the lead; an admin can always override via applyClassification.
 */
export function classifyConversationText(messages: string[]): DmLeadClassification {
  const text = messages.join("\n");

  const gradeMatch = GRADE_PATTERNS.find(({ pattern }) => pattern.test(text));
  const gradeLevel = gradeMatch?.label ?? null;

  const isJobSeeking = JOB_SEEKING_SIGNALS.some((p) => p.test(text));
  const isBuilding = BUILDING_SIGNALS.some((p) => p.test(text));

  let stage: DmLeadStage = "exploring";
  if (isJobSeeking) stage = "job_seeking";
  else if (isBuilding) stage = "building";
  else if (!gradeLevel && text.trim().length === 0) stage = "unknown";

  const recommendedProduct = stageToProduct(stage);

  return {
    gradeLevel,
    interests: [],
    activitiesSummary: text.slice(0, 500),
    stage,
    recommendedProduct,
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
