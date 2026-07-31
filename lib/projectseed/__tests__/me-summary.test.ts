import assert from "node:assert/strict";
import test from "node:test";

import { buildProjectSeedMeSummary } from "@/lib/projectseed/me-summary";
import type { HubLoad } from "@/lib/projectseed/hub";
import type { PseedHubState } from "@/types/projectseed";

const cohort = {
  id: "cohort-1",
  slug: "alumni-mvp",
  name: "Alumni MVP",
  audience: "alumni" as const,
  discord_guild_id: null,
  starts_on: null,
  ends_on: null,
  is_active: true,
};

function readyHub(overrides: Partial<PseedHubState> = {}): HubLoad {
  const hub: PseedHubState = {
    cohort,
    participant: {
      id: "p-1",
      cohort_id: cohort.id,
      user_id: "u-1",
      role: "alumni",
      status: "active",
      display_name: "Mint",
      discord_user_id: null,
      discord_username: null,
      discord_linked_at: null,
      timezone: "Asia/Bangkok",
    },
    options: [],
    pick: null,
    mySlots: [],
    heatmap: [],
    roster: [],
    cohortTags: [],
    participantCount: 3,
    ...overrides,
  };

  return { state: "ready", hub, userId: "u-1", needsDiscordSync: false };
}

test("no cohort points at the marketing page", () => {
  const summary = buildProjectSeedMeSummary({ state: "no-cohort" });
  assert.equal(summary.kind, "closed");
  assert.equal(summary.href, "/projectseed");
});

test("not-joined invites into the hub", () => {
  const summary = buildProjectSeedMeSummary({
    state: "not-joined",
    cohort,
    userId: "u-1",
  });
  assert.equal(summary.kind, "join");
  assert.equal(summary.href, "/projectseed/hub");
  assert.equal(summary.cta, "เข้าห้อง");
});

test("ready hub surfaces the next unfinished step", () => {
  const summary = buildProjectSeedMeSummary(readyHub());
  assert.equal(summary.kind, "active");
  if (summary.kind !== "active") return;
  assert.equal(summary.cta, "เชื่อม Discord");
  assert.equal(summary.doneCount, 0);
  assert.equal(summary.totalCount, 4);
  assert.equal(summary.complete, false);
  assert.equal(summary.href, "/projectseed/hub");
});

test("all steps done links back to the hub overview", () => {
  const summary = buildProjectSeedMeSummary(
    readyHub({
      participant: {
        id: "p-1",
        cohort_id: cohort.id,
        user_id: "u-1",
        role: "alumni",
        status: "active",
        display_name: "Mint",
        discord_user_id: "discord-1",
        discord_username: "mint",
        discord_linked_at: "2026-07-01T00:00:00Z",
        timezone: "Asia/Bangkok",
      },
      pick: {
        id: "pick-1",
        participant_id: "p-1",
        project_option_id: "opt-1",
        custom_title: null,
        what_build: "เครื่องมือช่วยจดโน้ต",
        why_this: "เพื่อนลืมงานบ่อย",
        who_for: "เพื่อนม.6",
        first_step: "คุยกับเพื่อน 3 คน",
        tags: ["โน้ต", "ม.6"],
        status: "submitted",
        submitted_at: "2026-07-02T00:00:00Z",
      },
      mySlots: [{ day: 1, hour: 19 }],
    })
  );

  assert.equal(summary.kind, "active");
  if (summary.kind !== "active") return;
  assert.equal(summary.complete, true);
  assert.equal(summary.doneCount, 4);
  assert.equal(summary.href, "/projectseed/hub");
  assert.equal(summary.cta, "เปิดห้อง");
});
