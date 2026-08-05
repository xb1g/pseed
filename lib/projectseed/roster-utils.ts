import type { PseedAdminRosterRow } from "@/lib/projectseed/admin";

/**
 * Pure helpers for the admin roster view. Kept free of any runtime imports
 * (the row type is erased at compile time) so they stay server-safe and
 * unit-testable without mocking next/headers.
 */

export interface RowFlags {
  noDiscord: boolean;
  noProject: boolean;
  alone: boolean;
  noShow: boolean;
}

export function getFlags(row: PseedAdminRosterRow): RowFlags {
  return {
    noDiscord: row.discord_user_id == null,
    noProject: row.project_title == null,
    alone: row.planned_slots > 0 && row.shared_slots === 0,
    noShow: row.planned_slots > 0 && row.recorded_seconds === 0,
  };
}

export function needsAttention(f: RowFlags): boolean {
  return f.noDiscord || f.noProject || f.alone || f.noShow;
}

export function hasRoseFlag(f: RowFlags): boolean {
  return f.alone || f.noShow;
}

/**
 * Flagged rows float above clean rows. The sort is stable, so the arrival
 * (created_at) order the RPC returns is preserved within each group.
 */
export function sortRosterRows(
  rows: PseedAdminRosterRow[]
): PseedAdminRosterRow[] {
  return [...rows].sort(
    (a, b) =>
      Number(needsAttention(getFlags(b))) - Number(needsAttention(getFlags(a)))
  );
}

export const THAI_MONTHS_SHORT = [
  "ม.ค.",
  "ก.พ.",
  "มี.ค.",
  "เม.ย.",
  "พ.ค.",
  "มิ.ย.",
  "ก.ค.",
  "ส.ค.",
  "ก.ย.",
  "ต.ค.",
  "พ.ย.",
  "ธ.ค.",
];

/**
 * 59 real minutes must not render as "0": sub-hour attendance is shown in
 * minutes, hours get one decimal when needed. Zero seconds means the bot has
 * seen nothing — the caller renders a dash, never a bare 0.
 */
export function formatAttendance(
  seconds: number,
  sessions: number
): string | null {
  if (seconds <= 0) return null;
  const minutes = Math.round(seconds / 60);
  const base = minutes >= 60 ? `${formatHours(seconds)} ชม.` : `${minutes} นาที`;
  return `${base} · ${sessions} ครั้ง`;
}

export function formatHours(seconds: number): string {
  const h = seconds / 3600;
  return Number.isInteger(h) ? String(h) : h.toFixed(1);
}

export function formatLastSeen(
  lastSeenAt: string | null,
  now: Date
): string | null {
  if (!lastSeenAt) return null;
  const days = Math.floor(
    (now.getTime() - new Date(lastSeenAt).getTime()) / 86_400_000
  );
  if (days <= 0) return "วันนี้";
  if (days === 1) return "เมื่อวาน";
  if (days < 7) return `${days} วันก่อน`;
  const d = new Date(lastSeenAt);
  return `${d.getDate()} ${THAI_MONTHS_SHORT[d.getMonth()]}`;
}
