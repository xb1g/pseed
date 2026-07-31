import type {
  PseedHeatmapCell,
  PseedSlot,
  PseedSlotRosterEntry,
} from "@/types/projectseed";

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
 * The cohort meets online, which changes what a "good" slot is.
 *
 * In a physical room, showing up is worth it even if two people are there. In a
 * voice channel it is not: one other person is a meeting, and silence is the
 * default state that makes people leave. Three is where it starts feeling like
 * a room you joined rather than a call you are on.
 */
export const PSEED_QUORUM = 3;
export const PSEED_FULL = 5;

/**
 * Absolute thresholds, deliberately not scaled to the cohort's busiest hour.
 *
 * A ratio-of-max scale lights up the best slot in a dead week as brightly as a
 * genuinely full one, which tells someone to show up to a room with two people
 * in it. The question is "will enough people be there", and that has a fixed
 * answer regardless of how the rest of the week looks.
 */
export function heatLevel(count: number): 0 | 1 | 2 | 3 | 4 {
  if (count <= 0) return 0;
  if (count >= PSEED_FULL) return 4;
  if (count >= PSEED_QUORUM) return 3;
  if (count >= 2) return 2;
  return 1;
}

export function hasQuorum(count: number): boolean {
  return count >= PSEED_QUORUM;
}

export function describeSlot(cell: PseedHeatmapCell): string {
  const day = PSEED_DAYS[cell.day_of_week]?.long ?? "?";
  return `${day} ${formatSlotRange(cell.hour_of_day)}`;
}

/**
 * Groups the flat roster into one entry per slot, so a cell can answer both
 * "how many" and "who, working on what" without a second round trip.
 */
export function groupRosterBySlot(
  rows: PseedSlotRosterEntry[]
): Map<string, PseedSlotRosterEntry[]> {
  const bySlot = new Map<string, PseedSlotRosterEntry[]>();

  for (const row of rows) {
    const key = slotKey(row.day_of_week, row.hour_of_day);
    const bucket = bySlot.get(key);
    if (bucket) bucket.push(row);
    else bySlot.set(key, [row]);
  }

  return bySlot;
}

/** Distinct tags in a slot, most common first — the slot's subject line. */
export function slotTopics(entries: PseedSlotRosterEntry[]): string[] {
  const counts = new Map<string, number>();

  for (const entry of entries) {
    for (const tag of entry.tags ?? []) {
      counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }
  }

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([tag]) => tag);
}

/**
 * Slots worth showing up to: quorum met, busiest first. This is the answer to
 * "when should I be online", which is the only question the grid exists to
 * answer and the one a raw grid makes you squint to work out.
 */
export function quorumSlots(cells: PseedHeatmapCell[]): PseedHeatmapCell[] {
  return cells
    .filter((cell) => hasQuorum(cell.participant_count))
    .sort(
      (a, b) =>
        b.participant_count - a.participant_count ||
        a.day_of_week - b.day_of_week ||
        a.hour_of_day - b.hour_of_day
    );
}
