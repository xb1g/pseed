import { buildGapHints, buildProjectCards } from "../portfolio";
import type { PathlabJourney, ProjectSeedBuild } from "../portfolio";

const journey = (overrides: Partial<PathlabJourney> = {}): PathlabJourney => ({
  enrollmentId: "enr-1",
  seedTitle: "AI Engineer",
  status: "active",
  currentDay: 3,
  totalDays: 5,
  enrolledAt: "2026-08-01T00:00:00Z",
  completedAt: null,
  reportShareToken: null,
  ...overrides,
});

const build = (overrides: Partial<ProjectSeedBuild> = {}): ProjectSeedBuild => ({
  participantId: "pt-1",
  cohortName: "Batch 1",
  title: "Meal planner",
  summary: null,
  whatBuild: "A LINE bot that plans meals",
  tags: ["bot", "food"],
  status: "submitted",
  submittedAt: "2026-08-05T00:00:00Z",
  ...overrides,
});

describe("buildProjectCards", () => {
  it("merges both sources into one sorted list, newest first", () => {
    const cards = buildProjectCards({
      pathlab: [journey()],
      projectseed: [build()],
    });
    expect(cards).toHaveLength(2);
    expect(cards[0].source).toBe("projectseed");
    expect(cards[1].source).toBe("pathlab");
  });

  it("renders an active journey metric as current day progress", () => {
    const [card] = buildProjectCards({ pathlab: [journey()], projectseed: [] });
    expect(card.metric).toBe("Day 3 of 5");
    expect(card.statusTone).toBe("active");
    expect(card.evidenceHref).toBeNull();
  });

  it("renders an explored journey as complete with report evidence", () => {
    const [card] = buildProjectCards({
      pathlab: [
        journey({ status: "explored", completedAt: "2026-08-06T00:00:00Z", reportShareToken: "tok" }),
      ],
      projectseed: [],
    });
    expect(card.metric).toBe("Completed 5 days");
    expect(card.statusTone).toBe("done");
    expect(card.evidenceHref).toBe("/report/tok");
  });

  it("marks quit and paused journeys as quiet", () => {
    const cards = buildProjectCards({
      pathlab: [journey({ status: "quit" }), journey({ enrollmentId: "e2", status: "paused" })],
      projectseed: [],
    });
    expect(cards.every((card) => card.statusTone === "quiet")).toBe(true);
  });

  it("carries projectseed tags and detail onto the card", () => {
    const [card] = buildProjectCards({ pathlab: [], projectseed: [build()] });
    expect(card.tags).toEqual(["bot", "food"]);
    expect(card.detail).toBe("A LINE bot that plans meals");
    expect(card.subtitle).toBe("Batch 1");
    expect(card.metric).toBe("Brief submitted");
  });

  it("falls back to the option summary when what_build is empty", () => {
    const [card] = buildProjectCards({
      pathlab: [],
      projectseed: [build({ whatBuild: null, summary: "Catalog summary" })],
    });
    expect(card.detail).toBe("Catalog summary");
  });

  it("sorts a submitted build ahead of an older draft", () => {
    const cards = buildProjectCards({
      pathlab: [],
      projectseed: [
        build({ participantId: "draft", status: "draft", submittedAt: null }),
        build({ participantId: "shipped" }),
      ],
    });
    expect(cards[0].id).toBe("shipped");
  });

  it("puts the hero first and marks it", () => {
    const cards = buildProjectCards(
      { pathlab: [journey()], projectseed: [build()] },
      { heroProject: "pathlab:enr-1", notes: {}, order: [] },
    );
    expect(cards[0].key).toBe("pathlab:enr-1");
    expect(cards[0].isHero).toBe(true);
    expect(cards[1].isHero).toBe(false);
  });

  it("attaches impact lines from curation notes", () => {
    const cards = buildProjectCards(
      { pathlab: [journey()], projectseed: [] },
      { heroProject: null, notes: { "pathlab:enr-1": "37 users in week 1" }, order: [] },
    );
    expect(cards[0].impact).toBe("37 users in week 1");
  });

  it("respects explicit order after the hero", () => {
    const cards = buildProjectCards(
      {
        pathlab: [journey(), journey({ enrollmentId: "enr-2", enrolledAt: "2026-07-01T00:00:00Z" })],
        projectseed: [build()],
      },
      {
        heroProject: "projectseed:pt-1",
        notes: {},
        order: ["pathlab:enr-2", "pathlab:enr-1"],
      },
    );
    expect(cards.map((card) => card.key)).toEqual([
      "projectseed:pt-1",
      "pathlab:enr-2",
      "pathlab:enr-1",
    ]);
  });
});

describe("buildGapHints", () => {
  it("is empty when there is nothing to advise on", () => {
    expect(buildGapHints([])).toEqual([]);
  });

  it("asks for a hero when none is picked", () => {
    const cards = buildProjectCards({ pathlab: [journey()], projectseed: [] });
    expect(buildGapHints(cards).map((hint) => hint.id)).toContain("no-hero");
  });

  it("asks for impact lines once a hero exists", () => {
    const cards = buildProjectCards(
      { pathlab: [journey()], projectseed: [] },
      { heroProject: "pathlab:enr-1", notes: {}, order: [] },
    );
    expect(buildGapHints(cards).map((hint) => hint.id)).toContain("missing-impact");
  });

  it("skips the impact hint when active pieces all have lines", () => {
    const cards = buildProjectCards(
      { pathlab: [journey()], projectseed: [] },
      { heroProject: "pathlab:enr-1", notes: { "pathlab:enr-1": "done" }, order: [] },
    );
    expect(buildGapHints(cards).map((hint) => hint.id)).not.toContain("missing-impact");
  });

  it("flags single-source portfolios with two or more pieces", () => {
    const cards = buildProjectCards(
      { pathlab: [journey(), journey({ enrollmentId: "enr-2" })], projectseed: [] },
      { heroProject: "pathlab:enr-1", notes: {}, order: [] },
    );
    expect(buildGapHints(cards).map((hint) => hint.id)).toContain("one-source");
  });

  it("flags a hero journey without a linked report", () => {
    const cards = buildProjectCards(
      { pathlab: [journey()], projectseed: [build()] },
      { heroProject: "pathlab:enr-1", notes: { "pathlab:enr-1": "x" }, order: [] },
    );
    expect(buildGapHints(cards).map((hint) => hint.id)).toContain("no-evidence");
  });

  it("never returns more than three hints", () => {
    const cards = buildProjectCards(
      { pathlab: [journey(), journey({ enrollmentId: "enr-2" })], projectseed: [] },
      { heroProject: null, notes: {}, order: [] },
    );
    expect(buildGapHints(cards).length).toBeLessThanOrEqual(3);
  });
});
