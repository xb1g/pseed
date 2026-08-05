import type { PseedAdminRosterRow } from "@/lib/projectseed/admin";
import {
  formatAttendance,
  formatLastSeen,
  getFlags,
  hasRoseFlag,
  needsAttention,
  sortRosterRows,
} from "@/lib/projectseed/roster-utils";

function makeRow(
  overrides: Partial<PseedAdminRosterRow> = {}
): PseedAdminRosterRow {
  return {
    participant_id: "p-1",
    display_name: "ทดสอบ",
    role: "student",
    joined_at: "2026-07-01T00:00:00Z",
    discord_username: "tester",
    discord_user_id: "123",
    project_title: "โปรเจกต์",
    tags: [],
    brief_status: "draft",
    planned_slots: 0,
    shared_slots: 0,
    recorded_seconds: 0,
    session_count: 0,
    kept_slot_count: 0,
    last_seen_at: null,
    notify_channel: false,
    notify_dm: false,
    ...overrides,
  };
}

describe("getFlags", () => {
  it("flags alone when hours are planned but shared with nobody", () => {
    const flags = getFlags(makeRow({ planned_slots: 4, shared_slots: 0 }));
    expect(flags.alone).toBe(true);
  });

  it("does not flag alone when at least one slot is shared", () => {
    const flags = getFlags(makeRow({ planned_slots: 4, shared_slots: 1 }));
    expect(flags.alone).toBe(false);
  });

  it("flags noShow when hours are planned but nothing was recorded", () => {
    const flags = getFlags(makeRow({ planned_slots: 2, recorded_seconds: 0 }));
    expect(flags.noShow).toBe(true);
  });

  it("flags neither alone nor noShow when nothing is planned", () => {
    const flags = getFlags(
      makeRow({ planned_slots: 0, shared_slots: 0, recorded_seconds: 0 })
    );
    expect(flags.alone).toBe(false);
    expect(flags.noShow).toBe(false);
  });

  it("flags noDiscord when the account is not linked", () => {
    expect(getFlags(makeRow({ discord_user_id: null })).noDiscord).toBe(true);
    expect(getFlags(makeRow()).noDiscord).toBe(false);
  });

  it("flags noProject when no project is chosen", () => {
    expect(getFlags(makeRow({ project_title: null })).noProject).toBe(true);
    expect(getFlags(makeRow()).noProject).toBe(false);
  });
});

describe("needsAttention / hasRoseFlag", () => {
  const clean = {
    noDiscord: false,
    noProject: false,
    alone: false,
    noShow: false,
  };

  it("needsAttention is true when any flag is set", () => {
    expect(needsAttention(clean)).toBe(false);
    expect(needsAttention({ ...clean, noDiscord: true })).toBe(true);
    expect(needsAttention({ ...clean, noProject: true })).toBe(true);
    expect(needsAttention({ ...clean, alone: true })).toBe(true);
    expect(needsAttention({ ...clean, noShow: true })).toBe(true);
  });

  it("hasRoseFlag is true only for alone or noShow", () => {
    expect(hasRoseFlag(clean)).toBe(false);
    expect(hasRoseFlag({ ...clean, noDiscord: true })).toBe(false);
    expect(hasRoseFlag({ ...clean, noProject: true })).toBe(false);
    expect(hasRoseFlag({ ...clean, alone: true })).toBe(true);
    expect(hasRoseFlag({ ...clean, noShow: true })).toBe(true);
  });
});

describe("sortRosterRows", () => {
  it("sorts flagged rows above clean rows, stably within each group", () => {
    const cleanA = makeRow({ participant_id: "clean-a" });
    const flaggedA = makeRow({
      participant_id: "flagged-a",
      discord_user_id: null,
    });
    const cleanB = makeRow({ participant_id: "clean-b" });
    const flaggedB = makeRow({
      participant_id: "flagged-b",
      planned_slots: 3,
      shared_slots: 0,
    });
    const cleanC = makeRow({ participant_id: "clean-c" });

    const sorted = sortRosterRows([cleanA, flaggedA, cleanB, flaggedB, cleanC]);

    expect(sorted.map((r) => r.participant_id)).toEqual([
      "flagged-a",
      "flagged-b",
      "clean-a",
      "clean-b",
      "clean-c",
    ]);
  });

  it("does not mutate the input array", () => {
    const rows = [
      makeRow({ participant_id: "clean" }),
      makeRow({ participant_id: "flagged", discord_user_id: null }),
    ];
    sortRosterRows(rows);
    expect(rows.map((r) => r.participant_id)).toEqual(["clean", "flagged"]);
  });
});

describe("formatAttendance", () => {
  it("renders sub-hour attendance in minutes, never as 0", () => {
    expect(formatAttendance(3540, 2)).toBe("59 นาที · 2 ครั้ง");
  });

  it("renders fractional hours with one decimal", () => {
    expect(formatAttendance(9000, 4)).toBe("2.5 ชม. · 4 ครั้ง");
  });

  it("renders whole hours without a trailing .0", () => {
    expect(formatAttendance(7200, 1)).toBe("2 ชม. · 1 ครั้ง");
  });

  it("returns null for zero seconds", () => {
    expect(formatAttendance(0, 0)).toBeNull();
  });
});

describe("formatLastSeen", () => {
  const now = new Date("2026-08-02T12:00:00");

  it("returns null when the bot has never seen the person", () => {
    expect(formatLastSeen(null, now)).toBeNull();
  });

  it("renders same-day as วันนี้", () => {
    expect(formatLastSeen("2026-08-02T08:00:00", now)).toBe("วันนี้");
  });

  it("renders yesterday as เมื่อวาน", () => {
    expect(formatLastSeen("2026-08-01T12:00:00", now)).toBe("เมื่อวาน");
  });

  it("renders 2–6 days as a relative count", () => {
    expect(formatLastSeen("2026-07-30T12:00:00", now)).toBe("3 วันก่อน");
  });

  it("renders a week or more as an absolute Thai date", () => {
    expect(formatLastSeen("2026-07-23T12:00:00", now)).toBe("23 ก.ค.");
  });
});
