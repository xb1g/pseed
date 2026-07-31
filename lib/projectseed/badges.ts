import type { PseedHubState } from "@/types/projectseed";
import { buildHeatmapLookup, hasQuorum } from "@/lib/projectseed/schedule";

export interface PseedBadge {
  id: string;
  label: string;
  hint: string;
  icon: string;
  earned: boolean;
  /** True when nothing the participant does today can earn it yet. */
  locked?: boolean;
}

/**
 * Badges are derived from state that already exists — never stored, never
 * awarded by a background job.
 *
 * Every one of them is something the participant actually did. There is no
 * participation XP and no streak that resets: a badge you can earn by opening
 * the page is a badge that stops meaning anything by the second week, and this
 * cohort is small enough that everyone will notice.
 *
 * The two attendance badges are shown locked rather than hidden. Hiding them
 * would make declared hours look like the whole game; showing them greyed says
 * plainly that the real scoreboard starts when the Discord bot does.
 */
export function buildBadges(hub: PseedHubState): PseedBadge[] {
  const { participant, pick, mySlots, heatmap, stats } = hub;
  const heat = buildHeatmapLookup(heatmap);

  const hasProject = Boolean(pick?.custom_title?.trim() || pick?.project_option_id);
  const sharedSlot = mySlots.some((slot) =>
    hasQuorum(heat.count(slot.day, slot.hour))
  );

  return [
    {
      id: "joined",
      label: "เข้าห้องแล้ว",
      hint: "เข้าร่วมรุ่นนี้",
      icon: "🚪",
      earned: true,
    },
    {
      id: "discord",
      label: "ต่อสาย Discord",
      hint: "เชื่อมบัญชี Discord กับที่นี่",
      icon: "🔗",
      earned: Boolean(participant.discord_user_id),
    },
    {
      id: "project",
      label: "มีของจะทำ",
      hint: "เลือกหรือตั้งชื่อโปรเจกต์",
      icon: "🌱",
      earned: hasProject,
    },
    {
      id: "tagged",
      label: "ติดป้ายแล้ว",
      hint: "ใส่แท็กให้คนอื่นหาเจอ",
      icon: "🏷️",
      earned: (pick?.tags?.length ?? 0) > 0,
    },
    {
      id: "brief",
      label: "อธิบายได้",
      hint: "ส่งคำอธิบายโปรเจกต์",
      icon: "📝",
      earned: pick?.status === "submitted",
    },
    {
      id: "scheduled",
      label: "จองเวลาแล้ว",
      hint: "เลือกชั่วโมงที่เข้าห้องได้",
      icon: "🗓️",
      earned: mySlots.length > 0,
    },
    {
      id: "not-alone",
      label: "ไม่ได้อยู่คนเดียว",
      hint: "มีชั่วโมงที่ทับกับคนอื่นพอเป็นห้อง",
      icon: "🤝",
      earned: sharedSlot,
    },
    {
      id: "first-hour",
      label: "ชั่วโมงแรก",
      hint: "เข้าห้องเสียงจริงครั้งแรก",
      icon: "🎙️",
      earned: stats.recorded_seconds > 0,
      locked: stats.recorded_seconds === 0,
    },
    {
      id: "ten-hours",
      label: "สิบชั่วโมง",
      hint: "สะสมเวลาในห้องครบ 10 ชั่วโมง",
      icon: "🔥",
      earned: stats.recorded_seconds >= 10 * 3600,
      locked: stats.recorded_seconds < 10 * 3600,
    },
  ];
}

/** Whole hours, floored — a profile that claims 0.4 hours is claiming nothing. */
export function recordedHours(seconds: number): number {
  return Math.floor(seconds / 3600);
}

export function formatRecordedTime(seconds: number): string {
  if (seconds <= 0) return "0";
  const hours = Math.floor(seconds / 3600);
  if (hours > 0) return `${hours}`;
  return `${Math.max(1, Math.round(seconds / 60))} นาที`;
}
