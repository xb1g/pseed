import type { DmConversation, DmLeadStage } from "@/types/dm-leads";

/**
 * Derive portfolio readiness (1–8) from the lead classification signals we
 * already compute for every DM conversation — never a hardcoded constant.
 *
 * Base comes from the auto-classified stage, adjusted by grade level:
 * a younger student at the same stage has less portfolio material today.
 *   exploring + ม.4 → 1,  exploring + ม.5/6 → 2
 *   building  + ม.4 → 3,  building  + ม.5/6 → 4
 *
 * Signals then add on top:
 * - has_hands_on_experience (+2): real work exists, so there is something
 *   to put in a portfolio today
 * - activities_summary (+1): activities on record means material to write up
 * - interests (+1): a clear direction makes the portfolio coherent
 *
 * The result is a starting point for the admin, who can still adjust it in
 * the generator modal before the plan is saved.
 */
const STAGE_BASE: Record<DmLeadStage, number> = {
  unknown: 1,
  exploring: 2,
  job_seeking: 3,
  building: 4,
};

/**
 * Normalize "ม.4" / "ม4" / "Grade 10" style strings to a 1–6 level.
 * Returns null when the grade is unrecognized.
 */
export function parseGradeLevel(gradeLevel: string | null | undefined): number | null {
  if (!gradeLevel) return null;

  const thai = gradeLevel.match(/ม\.?\s*([1-6])/);
  if (thai) return Number(thai[1]);

  const english = gradeLevel.match(/grade\s*(1[0-2]|[1-9])\b/i);
  if (english) {
    const g = Number(english[1]);
    // Grade 10–12 map to ม.4–ม.6
    if (g >= 10) return g - 6;
    return g;
  }

  return null;
}

/** Younger students (≤ ม.4) start one notch lower at the same stage. */
function gradeOffset(gradeLevel: string | null | undefined): number {
  const level = parseGradeLevel(gradeLevel);
  if (level === null) return 0;
  return level <= 4 ? -1 : 0;
}

export function deriveReadinessScore(
  conversation: Pick<
    DmConversation,
    | "stage"
    | "grade_level"
    | "has_hands_on_experience"
    | "activities_summary"
    | "interests"
  >
): number {
  const base = Math.max(1, (STAGE_BASE[conversation.stage] ?? 1) + gradeOffset(conversation.grade_level));

  let score = base;
  if (conversation.has_hands_on_experience) score += 2;
  if (conversation.activities_summary?.trim()) score += 1;
  if (conversation.interests.length > 0) score += 1;

  return Math.min(8, Math.max(1, score));
}
