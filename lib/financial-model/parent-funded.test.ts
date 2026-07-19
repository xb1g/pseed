import {
  DEFAULT_PARENT_FUNDED_ASSUMPTIONS,
  calculateParentFundedModel,
  normalizeParentFundedAssumptions,
} from "./parent-funded";

describe("parent-funded financial model", () => {
  it("calculates the approved founder-led base case", () => {
    const result = calculateParentFundedModel(DEFAULT_PARENT_FUNDED_ASSUMPTIONS);

    expect(result.funnel).toEqual({
      completedFreePlans: 20_000,
      paidTrials: 600,
      firstSprintSeats: 180,
      repeatSprintSeats: 54,
    });
    expect(result.revenue.total).toBe(1_952_400);
    expect(result.costs.directDelivery).toBe(680_400);
    expect(result.costs.acquisition).toBe(360_000);
    expect(result.costs.annualFixedBusiness).toBe(420_000);
    expect(result.costs.annualFounderDraw).toBe(480_000);
    expect(result.operatingResult).toBe(12_000);
    expect(result.unitEconomics.breakEvenSprintSeatsPerMonth).toBe(20);
  });

  it("credits the Trial price instead of double-counting first-Sprint revenue", () => {
    const result = calculateParentFundedModel({
      ...DEFAULT_PARENT_FUNDED_ASSUMPTIONS,
      completedFreePlans: 100,
      freeToTrialRate: 100,
      trialToSprintRate: 100,
      sprintRepeatRate: 0,
    });

    expect(result.revenue.trials).toBe(149_000);
    expect(result.revenue.firstSprintUpgrades).toBe(441_000);
    expect(result.revenue.total).toBe(590_000);
  });

  it("counts only incremental delivery cost after a converting Trial", () => {
    const result = calculateParentFundedModel({
      ...DEFAULT_PARENT_FUNDED_ASSUMPTIONS,
      completedFreePlans: 100,
      freeToTrialRate: 100,
      trialToSprintRate: 100,
      sprintRepeatRate: 0,
    });

    expect(result.costs.trialDelivery).toBe(45_000);
    expect(result.costs.firstSprintDelivery).toBe(165_000);
    expect(result.costs.directDelivery).toBe(210_000);
  });

  it("returns finite zero values when nobody converts", () => {
    const result = calculateParentFundedModel({
      ...DEFAULT_PARENT_FUNDED_ASSUMPTIONS,
      completedFreePlans: 0,
      freeToTrialRate: 0,
      trialToSprintRate: 0,
      sprintRepeatRate: 0,
    });

    expect(result.funnel.paidTrials).toBe(0);
    expect(result.revenue.total).toBe(0);
    expect(result.grossContributionMargin).toBe(0);
    expect(Number.isFinite(result.unitEconomics.revenuePerPaidTrialFamily)).toBe(true);
  });

  it("normalizes unsafe assumptions", () => {
    const normalized = normalizeParentFundedAssumptions({
      ...DEFAULT_PARENT_FUNDED_ASSUMPTIONS,
      completedFreePlans: -100,
      freeToTrialRate: 150,
      trialToSprintRate: -20,
      monthlyFounderDraw: Number.NaN,
      cohortSize: 0,
    });

    expect(normalized.completedFreePlans).toBe(0);
    expect(normalized.freeToTrialRate).toBe(100);
    expect(normalized.trialToSprintRate).toBe(0);
    expect(normalized.monthlyFounderDraw).toBe(0);
    expect(normalized.cohortSize).toBe(1);
  });
});
