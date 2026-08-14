import { deriveReadinessScore } from "./readiness";
import type { DmConversation } from "@/types/dm-leads";

type Signal = Parameters<typeof deriveReadinessScore>[0];

function base(overrides: Partial<Signal> = {}): Signal {
  return {
    stage: "unknown",
    has_hands_on_experience: false,
    activities_summary: null,
    interests: [],
    ...overrides,
  } as DmConversation;
}

describe("deriveReadinessScore", () => {
  it("scores an unknown lead with no signals at the floor", () => {
    expect(deriveReadinessScore(base())).toBe(1);
  });

  it("maps each classification stage to its base score", () => {
    expect(deriveReadinessScore(base({ stage: "unknown" }))).toBe(1);
    expect(deriveReadinessScore(base({ stage: "exploring" }))).toBe(2);
    expect(deriveReadinessScore(base({ stage: "job_seeking" }))).toBe(3);
    expect(deriveReadinessScore(base({ stage: "building" }))).toBe(4);
  });

  it("rewards hands-on experience most, then activities and interests", () => {
    expect(
      deriveReadinessScore(base({ stage: "building", has_hands_on_experience: true }))
    ).toBe(6);
    expect(
      deriveReadinessScore(
        base({
          stage: "building",
          has_hands_on_experience: true,
          activities_summary: "ชมรมหุ่นยนต์, แข่งโครงงาน",
          interests: ["วิศวกรรม"],
        })
      )
    ).toBe(8);
  });

  it("ignores blank activities summaries", () => {
    expect(deriveReadinessScore(base({ activities_summary: "   " }))).toBe(1);
  });

  it("never exceeds 8 or drops below 1", () => {
    expect(
      deriveReadinessScore(
        base({
          stage: "building",
          has_hands_on_experience: true,
          activities_summary: "x",
          interests: ["a", "b", "c"],
        })
      )
    ).toBeLessThanOrEqual(8);
  });
});
