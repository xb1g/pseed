import { computePirateFunnel, stageConversion } from "@/lib/dm-leads/pirate-funnel";

const input = {
  totalConversations: 616,
  engagedConversations: 246,
  sustainedConversations: 90,
  enrollments: 35,
  referrals: null,
};

describe("computePirateFunnel", () => {
  it("keeps referral unmeasured rather than reporting it as zero", () => {
    expect(computePirateFunnel(input).counts.referral).toBeNull();
  });

  // 616→246 loses 60%, 246→90 loses 63%, 90→35 loses 61%. The middle step is
  // worst, which is the whole reason to measure step-to-step and not against
  // the top of the funnel.
  it("names the worst step-to-step drop", () => {
    const funnel = computePirateFunnel(input);
    expect(funnel.worstDropoff).toEqual({ stage: "retention", lostPct: 63 });
  });

  it("skips unmeasured stages when picking the worst drop", () => {
    const funnel = computePirateFunnel({ ...input, referrals: null });
    expect(funnel.worstDropoff?.stage).not.toBe("referral");
  });

  it("survives an empty inbox without dividing by zero", () => {
    const funnel = computePirateFunnel({
      totalConversations: 0,
      engagedConversations: 0,
      sustainedConversations: 0,
      enrollments: 0,
      referrals: null,
    });
    expect(funnel.worstDropoff).toBeNull();
  });
});

describe("stageConversion", () => {
  it("divides by the previous stage, not the top of the funnel", () => {
    const funnel = computePirateFunnel(input);
    expect(stageConversion(funnel, "activation")).toBe(40);
    expect(stageConversion(funnel, "retention")).toBe(37);
    expect(stageConversion(funnel, "revenue")).toBe(39);
  });

  it("has no conversion for the first stage", () => {
    expect(stageConversion(computePirateFunnel(input), "acquisition")).toBeNull();
  });

  it("returns null for an unmeasured stage", () => {
    expect(stageConversion(computePirateFunnel(input), "referral")).toBeNull();
  });
});
