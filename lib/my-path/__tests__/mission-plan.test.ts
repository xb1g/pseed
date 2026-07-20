import assert from "node:assert/strict";

import {
  buildMissionPlan,
  MISSION_GOAL_OPTIONS,
  type MissionPlanInput,
} from "../mission-plan";

function input(overrides: Partial<MissionPlanInput> = {}): MissionPlanInput {
  return {
    goal: null,
    timelineMonths: 4,
    pathlabTitles: ["AI Engineer PathLab"],
    careerTitles: ["AI Engineer"],
    ...overrides,
  };
}

test("a four-month timeline walks foundation, build, prove, and land", () => {
  const plan = buildMissionPlan(input());

  assert.equal(plan.timelineMonths, 4);
  assert.deepEqual(
    plan.months.map((month) => month.phase),
    ["foundation", "build", "prove", "land"]
  );
  assert.deepEqual(
    plan.months.map((month) => month.month),
    [1, 2, 3, 4]
  );
});

test("shorter timelines merge phases instead of dropping the ending", () => {
  const three = buildMissionPlan(input({ timelineMonths: 3 }));
  assert.equal(three.months.length, 3);
  assert.deepEqual(
    three.months.map((month) => month.phase),
    ["foundation", "build", "land"]
  );
  assert.equal(three.months[2].title, "พิสูจน์และปิดดีล");
  for (const outcomeId of ["competition", "volunteering", "interview"] as const) {
    assert.ok(three.months[2].outcomeIds.includes(outcomeId));
  }

  const two = buildMissionPlan(input({ timelineMonths: 2 }));
  assert.equal(two.months.length, 2);
  assert.deepEqual(
    two.months.map((month) => month.phase),
    ["foundation", "land"]
  );
  assert.ok(two.months[0].outcomeIds.includes("portfolio"));
  assert.ok(two.months[1].outcomeIds.includes("interview"));
});

test("the timeline is clamped to the supported 2–4 month range", () => {
  assert.equal(buildMissionPlan(input({ timelineMonths: 1 })).timelineMonths, 2);
  assert.equal(buildMissionPlan(input({ timelineMonths: 1 })).months.length, 2);
  assert.equal(buildMissionPlan(input({ timelineMonths: 9 })).timelineMonths, 4);
  assert.equal(buildMissionPlan(input({ timelineMonths: 9 })).months.length, 4);
});

test("a missing goal defaults to university", () => {
  const plan = buildMissionPlan(input({ goal: null }));

  assert.equal(plan.goal, "university");
  assert.match(plan.headline, /มหาวิทยาลัย/);
  assert.equal(MISSION_GOAL_OPTIONS.length, 4);
});

test("selected PathLab titles open the first month milestones", () => {
  const plan = buildMissionPlan(
    input({ pathlabTitles: ["AI Engineer PathLab", "Data Storytelling Lab"] })
  );

  assert.match(plan.months[0].milestones[0], /AI Engineer PathLab/);
  assert.match(plan.months[0].milestones[0], /Data Storytelling Lab/);
});

test("every plan carries exactly five outcomes and five red flags with concrete timing", () => {
  for (const timelineMonths of [2, 3, 4]) {
    const plan = buildMissionPlan(input({ timelineMonths }));

    assert.equal(plan.outcomes.length, 5);
    assert.deepEqual(
      plan.outcomes.map((outcome) => outcome.id),
      ["portfolio", "competition", "volunteering", "interview", "community"]
    );
    assert.equal(plan.redFlags.length, 5);
    for (const outcome of plan.outcomes) {
      assert.equal(typeof outcome.landsIn, "string");
      assert.ok(outcome.landsIn.length > 0, `${outcome.id} needs a landsIn`);
    }
  }

  const fourMonths = buildMissionPlan(input({ timelineMonths: 4 }));
  assert.equal(fourMonths.outcomes[0].landsIn, "เดือนที่ 2");
});
