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
 * The cohort meets online, which changes what a "good" slot is — but not into
 * an all-or-nothing one.
 *
 * Two people in a voice channel is a working session, and telling someone that
 * slot is worthless is both false and self-defeating: a room with two people in
 * it is how a room with five people starts. Three to five is where it stops
 * being a call and starts being a room. Past that it is a crowd — still fine,
 * just no longer the slot to steer an undecided person toward.
 */
export const PSEED_OPTIMAL_MIN = 3;
export const PSEED_OPTIMAL_MAX = 5;

export type SlotQuality = "empty" | "one" | "works" | "optimal" | "crowded";

export function slotQuality(count: number): SlotQuality {
  if (count <= 0) return "empty";
  if (count === 1) return "one";
  if (count < PSEED_OPTIMAL_MIN) return "works";
  if (count <= PSEED_OPTIMAL_MAX) return "optimal";
  return "crowded";
}

export const SLOT_QUALITY_LABEL: Record<SlotQuality, string> = {
  empty: "ยังไม่มีใคร",
  one: "มีคนหนึ่งคน",
  works: "ทำงานด้วยกันได้",
  optimal: "กำลังดี",
  crowded: "คนเยอะ",
};

/**
 * Absolute thresholds, deliberately not scaled to the cohort's busiest hour.
 *
 * A ratio-of-max scale lights up the best slot in a dead week as brightly as a
 * genuinely full one. The question is "how many people will be there", and that
 * has a fixed answer regardless of how the rest of the week looks.
 */
export function heatLevel(count: number): 0 | 1 | 2 | 3 | 4 {
  const quality = slotQuality(count);
  if (quality === "empty") return 0;
  if (quality === "one") return 1;
  if (quality === "works") return 2;
  if (quality === "optimal") return 3;
  return 4;
}

/** Someone else is there. The bar for "not sitting alone", and it is low. */
export function isWorthJoining(count: number): boolean {
  return count >= 2;
}

export function isOptimal(count: number): boolean {
  return count >= PSEED_OPTIMAL_MIN && count <= PSEED_OPTIMAL_MAX;
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

const QUALITY_RANK: Record<SlotQuality, number> = {
  optimal: 4,
  crowded: 3,
  works: 2,
  one: 1,
  empty: 0,
};

/**
 * Every slot with anyone in it, best first — 3-to-5 ahead of a crowd, a crowd
 * ahead of a pair, a pair ahead of one person.
 *
 * Ranked rather than filtered because a cohort in its first week has no optimal
 * slots at all, and a list that goes empty at exactly the moment it is most
 * needed tells a new participant there is nothing here. There is: there are two
 * people at 19:00, and joining them is how it becomes four.
 */
export function rankedSlots(cells: PseedHeatmapCell[]): PseedHeatmapCell[] {
  return cells
    .filter((cell) => cell.participant_count > 0)
    .sort(
      (a, b) =>
        QUALITY_RANK[slotQuality(b.participant_count)] -
          QUALITY_RANK[slotQuality(a.participant_count)] ||
        b.participant_count - a.participant_count ||
        a.day_of_week - b.day_of_week ||
        a.hour_of_day - b.hour_of_day
    );
}
