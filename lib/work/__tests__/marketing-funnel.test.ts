import {
  CONTENT_IDEAS,
  FUNNEL_STAGES,
  filterContentIdeas,
  getStageMix,
} from "../marketing-funnel";

describe("marketing funnel planning", () => {
  it("keeps a complete TOFU, MOFU, and BOFU mix", () => {
    expect(getStageMix(CONTENT_IDEAS)).toEqual([
      { stage: "tofu", count: 4 },
      { stage: "mofu", count: 4 },
      { stage: "bofu", count: 4 },
    ]);
    expect(FUNNEL_STAGES.reduce((total, stage) => total + stage.share, 0)).toBe(100);
  });

  it("includes shared-channel and shared-offer ideas in a specific filter", () => {
    const results = filterContentIdeas(CONTENT_IDEAS, "all", "instagram", "techseed");

    expect(results.length).toBeGreaterThan(0);
    expect(results.every((idea) => ["instagram", "both"].includes(idea.channel))).toBe(true);
    expect(results.every((idea) => ["techseed", "both"].includes(idea.offer))).toBe(true);
  });

  it("can isolate SHIFT bottom-of-funnel work", () => {
    const results = filterContentIdeas(CONTENT_IDEAS, "bofu", "all", "shift");

    expect(results).toHaveLength(3);
    expect(results.every((idea) => idea.stage === "bofu")).toBe(true);
  });
});
