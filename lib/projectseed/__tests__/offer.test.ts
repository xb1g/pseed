import {
  formatThb,
  IS_OPEN_FOR_SALE,
  PAYING_SEATS,
  PRICE_THB,
  REFERRAL_ELIGIBLE_GRADES,
  SCHOLARSHIP_SEATS,
  TOTAL_SEATS,
} from "@/lib/projectseed/offer";

describe("ProjectSeed batch 1 offer", () => {
  // The 1,990฿ founding promo was removed on 2026-07-29. A live page showing it
  // again is the same class of bug as /techseed undercutting ProjectSeed.
  it("prices at the approved 2,990฿ single tier with no founding promo", () => {
    expect(PRICE_THB).toBe(2990);
  });

  it("keeps scholarship at 10% of the batch", () => {
    expect(SCHOLARSHIP_SEATS / TOTAL_SEATS).toBeCloseTo(0.1);
    expect(PAYING_SEATS).toBe(TOTAL_SEATS - SCHOLARSHIP_SEATS);
    expect(PAYING_SEATS).toBe(18);
  });

  // M6 students compete for the same university seats, so referral credit for
  // an M6 peer would ask a student to recruit a rival.
  it("restricts referral credit to non-M6 grades", () => {
    expect(REFERRAL_ELIGIBLE_GRADES).toEqual(["M4", "M5"]);
    expect(REFERRAL_ELIGIBLE_GRADES).not.toContain("M6");
  });

  // PROJECTSEED-SAFEGUARDING.md §11: no offering, selling, or accepting payment
  // for a seat until the launch gate clears. Four items are still open, so this
  // flag must stay false — flipping it is a deliberate launch decision, not a
  // tidy-up.
  it("is not open for sale while the safeguarding launch gate is incomplete", () => {
    expect(IS_OPEN_FOR_SALE).toBe(false);
  });

  it("formats baht in Thai locale", () => {
    expect(formatThb(PRICE_THB)).toBe("2,990฿");
  });
});
