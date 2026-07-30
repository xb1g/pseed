import type { PseedHeatmapCell, PseedSlot } from "@/types/projectseed";

/**
 * The weekly grid. Everything is Asia/Bangkok wall-clock time — the cohort is
 * in one country and in one Discord voice channel, so a per-user timezone would
 * add conversion bugs to buy nothing. `pseed_participants.timezone` exists for
 * the day that stops being true.
 */
export const PSEED_TIMEZONE = "Asia/Bangkok";

/** 0 = Monday. Matches the order the grid renders, not ISO or JS getDay(). */
export const PSEED_DAYS = [
  { index: 0, short: "จ.", long: "จันทร์" },
  { index: 1, short: "อ.", long: "อังคาร" },
  { index: 2, short: "พ.", long: "พุธ" },
  { index: 3, short: "พฤ.", long: "พฤหัสบดี" },
  { index: 4, short: "ศ.", long: "ศุกร์" },
  { index: 5, short: "ส.", long: "เสาร์" },
  { index: 6, short: "อา.", long: "อาทิตย์" },
] as const;

/**
 * Hours shown in the picker. Nobody joins voice chat at 4am, and a 24-row grid
 * on a phone is unusable, so the grid is clipped rather than scrolled.
 * The column is stored 0–23, so widening this later needs no migration.
 */
export const PSEED_HOUR_START = 9;
export const PSEED_HOUR_END = 23;

export const PSEED_HOURS: number[] = Array.from(
  { length: PSEED_HOUR_END - PSEED_HOUR_START + 1 },
  (_, i) => PSEED_HOUR_START + i
);

export function slotKey(day: number, hour: number): string {
  return `${day}:${hour}`;
}

export function slotsToKeys(slots: PseedSlot[]): Set<string> {
  return new Set(slots.map((s) => slotKey(s.day, s.hour)));
}

export function keysToSlots(keys: Iterable<string>): PseedSlot[] {
  return Array.from(keys)
    .map((key) => {
      const [day, hour] = key.split(":").map(Number);
      return { day, hour };
    })
    .filter(
      (s) =>
        Number.isInteger(s.day) &&
        Number.isInteger(s.hour) &&
        s.day >= 0 &&
        s.day <= 6 &&
        s.hour >= 0 &&
        s.hour <= 23
    );
}

export function formatHour(hour: number): string {
  return `${String(hour).padStart(2, "0")}:00`;
}

export function formatSlotRange(hour: number): string {
  return `${formatHour(hour)}–${formatHour((hour + 1) % 24)}`;
}

export interface HeatmapLookup {
  count: (day: number, hour: number) => number;
  mine: (day: number, hour: number) => boolean;
  max: number;
  /** Busiest cells first — the hub uses the top few as "when the room is full". */
  peaks: PseedHeatmapCell[];
}

export function buildHeatmapLookup(cells: PseedHeatmapCell[]): HeatmapLookup {
  const byKey = new Map<string, PseedHeatmapCell>();
  let max = 0;

  for (const cell of cells) {
    byKey.set(slotKey(cell.day_of_week, cell.hour_of_day), cell);
    if (cell.participant_count > max) max = cell.participant_count;
  }

  const peaks = [...cells].sort(
    (a, b) =>
      b.participant_count - a.participant_count ||
      a.day_of_week - b.day_of_week ||
      a.hour_of_day - b.hour_of_day
  );

  return {
    count: (day, hour) => byKey.get(slotKey(day, hour))?.participant_count ?? 0,
    mine: (day, hour) => byKey.get(slotKey(day, hour))?.includes_me ?? false,
    max,
    peaks,
  };
}

/**
 * Five buckets rather than a continuous ramp: with a cohort of ~20 the raw
 * counts are small integers, and a continuous scale makes 2-vs-3 look like
 * noise instead of a decision.
 */
export function heatLevel(count: number, max: number): 0 | 1 | 2 | 3 | 4 {
  if (count <= 0 || max <= 0) return 0;
  const ratio = count / max;
  if (ratio > 0.75) return 4;
  if (ratio > 0.5) return 3;
  if (ratio > 0.25) return 2;
  return 1;
}

export function describeSlot(cell: PseedHeatmapCell): string {
  const day = PSEED_DAYS[cell.day_of_week]?.long ?? "?";
  return `${day} ${formatSlotRange(cell.hour_of_day)}`;
}
