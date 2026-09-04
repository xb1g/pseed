import {
  PMF_SIGNALS,
  PRODUCT_BETS,
  PRODUCT_LOOP,
  PRODUCT_WORK_ITEMS,
  workItemToProductBet,
} from "../product-development";

describe("startup validation system", () => {
  it("keeps the operating loop focused on a falsifiable decision", () => {
    expect(PRODUCT_LOOP.map((step) => step.label)).toEqual([
      "Evidence",
      "Hypothesis",
      "Test",
      "Pass bar",
      "Decide",
    ]);
  });

  it("requires every seeded bet to name a segment, hypothesis, and pass bar", () => {
    for (const bet of PRODUCT_BETS) {
      expect(bet.segment).not.toHaveLength(0);
      expect(bet.hypothesis).not.toHaveLength(0);
      expect(bet.passBar).not.toHaveLength(0);
    }
  });

  it("uses only the three Pareto PMF signals", () => {
    expect(PMF_SIGNALS.map((signal) => signal.label)).toEqual([
      "Paid pull",
      "Repeated value",
      "Compounding pull",
    ]);
  });

  it("keeps validation fields when a work item is mapped for the UI", () => {
    const bet = workItemToProductBet(PRODUCT_WORK_ITEMS[0]);

    expect(bet.segment).toBe(PRODUCT_BETS[0].segment);
    expect(bet.hypothesis).toBe(PRODUCT_BETS[0].hypothesis);
    expect(bet.passBar).toBe(PRODUCT_BETS[0].passBar);
  });
});
