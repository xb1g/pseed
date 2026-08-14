import { deriveReadinessScore } from "./readiness";
import type { DmConversation } from "@/types/dm-leads";

type Signal = Parameters<typeof deriveReadinessScore>[0];

function base(overrides: Partial<Signal> = {}): Signal {
  return {
    stage: "unknown",
    grade_level: null,
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

  it("grades exploring as 1 for ม.4 and 2 for ม.5/ม.6", () => {
    expect(deriveReadinessScore(base({ stage: "exploring", grade_level: "ม.4" }))).toBe(1);
    expect(deriveReadinessScore(base({ stage: "exploring", grade_level: "ม.5" }))).toBe(2);
    expect(deriveReadinessScore(base({ stage: "exploring", grade_level: "ม.6" }))).toBe(2);
  });

  it("applies the same grade logic to other stages without dropping below 1", () => {
    expect(deriveReadinessScore(base({ stage: "building", grade_level: "ม.4" }))).toBe(3);
    expect(deriveReadinessScore(base({ stage: "building", grade_level: "ม.6" }))).toBe(4);
    expect(deriveReadinessScore(base({ stage: "unknown", grade_level: "ม.4" }))).toBe(1);
  });

  it("parses English grade labels (Grade 10 = ม.4)", () => {
    expect(deriveReadinessScore(base({ stage: "exploring", grade_level: "Grade 10" }))).toBe(1);
    expect(deriveReadinessScore(base({ stage: "exploring", grade_level: "Grade 12" }))).toBe(2);
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
