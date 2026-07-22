import type { MyPathSummary } from "@/components/my-path/MyPathSummaryCard";

import {
  getGoalTimeline,
  getLockedGoal,
  getSavedPossibilities,
} from "./journey";
import {
  buildMissionPlan,
  MISSION_GOAL_OPTIONS,
  type MissionGoal,
} from "./mission-plan";
import { getRegistryItem } from "./registry";
import type { MyPathDraft } from "./types";

/**
 * แปลง draft ที่บันทึกไว้ให้เป็นสรุปสำหรับ /me — ใช้ registry แทนการยิง DB
 * เพราะชื่อสายอาชีพอยู่ในโค้ดอยู่แล้ว
 */
export function buildMyPathSummary(
  draft: MyPathDraft | null | undefined
): MyPathSummary | null {
  if (!draft) return null;

  const goal = getLockedGoal(draft) as MissionGoal | null;
  const savedSlugs = getSavedPossibilities(draft).map((item) => item.slug);
  // แผนที่ยังไม่ได้ล็อกเป้าและไม่ได้เลือกอะไรเลย ไม่ใช่แผน — อย่าโชว์
  if (!goal && savedSlugs.length === 0) return null;

  const timelineMonths = Number(getGoalTimeline(draft)) || 4;
  const careerTitles = savedSlugs.map(
    (slug) => getRegistryItem(slug)?.titleTh ?? slug
  );

  return {
    plan: buildMissionPlan({
      goal,
      timelineMonths,
      pathlabTitles: [],
      careerTitles,
    }),
    careerTitles,
    goalLabel:
      MISSION_GOAL_OPTIONS.find((option) => option.id === goal)?.title ?? null,
    updatedAt: draft.updatedAt,
  };
}
