import type { DmConversation, DmLeadStage } from "@/types/dm-leads";

/**
 * Derive portfolio readiness (1–8) from the lead classification signals we
 * already compute for every DM conversation — never a hardcoded constant.
 *
 * Signals, in order of weight:
 * - stage (auto-classified): the strongest proxy for how far along they are
 *     unknown → 1, exploring → 2, job_seeking → 3, building → 4
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

export function deriveReadinessScore(
  conversation: Pick<
    DmConversation,
    "stage" | "has_hands_on_experience" | "activities_summary" | "interests"
  >
): number {
  let score = STAGE_BASE[conversation.stage] ?? 1;

  if (conversation.has_hands_on_experience) score += 2;
  if (conversation.activities_summary?.trim()) score += 1;
  if (conversation.interests.length > 0) score += 1;

  return Math.min(8, Math.max(1, score));
}
