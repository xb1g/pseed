import { applyPointsPossible, scoreQuizSubmission } from "../scoring";

const q = (id: string, correct: string | null) => ({ id, correct_option: correct });

describe("scoreQuizSubmission", () => {
  it("scores all-correct answers", () => {
    const result = scoreQuizSubmission([q("a", "A"), q("b", "B")], { a: "A", b: "B" });

    expect(result.score).toBe(2);
    expect(result.max).toBe(2);
    expect(result.breakdown.every((entry) => entry.isCorrect)).toBe(true);
  });

  it("counts wrong answers as incorrect", () => {
    const result = scoreQuizSubmission([q("a", "A"), q("b", "B")], { a: "A", b: "C" });

    expect(result.score).toBe(1);
    expect(result.max).toBe(2);
  });

  it("counts unanswered questions as incorrect rather than skipping them", () => {
    const result = scoreQuizSubmission([q("a", "A"), q("b", "B")], { a: "A" });

    expect(result.score).toBe(1);
    expect(result.max).toBe(2);
    expect(result.breakdown[1].selected).toBeNull();
    expect(result.breakdown[1].isCorrect).toBe(false);
  });

  it("treats a fully blank submission as zero, not perfect", () => {
    const result = scoreQuizSubmission([q("a", "A"), q("b", "B")], {});

    expect(result.score).toBe(0);
    expect(result.max).toBe(2);
  });

  it("handles null answers without throwing", () => {
    const result = scoreQuizSubmission([q("a", "A")], null);

    expect(result.score).toBe(0);
    expect(result.max).toBe(1);
  });

  it("excludes questions with no configured correct option from the denominator", () => {
    const result = scoreQuizSubmission([q("a", "A"), q("b", null)], { a: "A" });

    expect(result.score).toBe(1);
    expect(result.max).toBe(1);
    expect(result.breakdown).toHaveLength(1);
  });

  it("ignores whitespace around options", () => {
    const result = scoreQuizSubmission([q("a", " A ")], { a: "A" });

    expect(result.score).toBe(1);
  });

  it("does not credit non-string answer values", () => {
    const result = scoreQuizSubmission([q("a", "A")], { a: 1 });

    expect(result.score).toBe(0);
  });

  it("returns an empty result for an assessment with no scorable questions", () => {
    const result = scoreQuizSubmission([], {});

    expect(result.score).toBe(0);
    expect(result.max).toBe(0);
  });
});

describe("applyPointsPossible", () => {
  const half = scoreQuizSubmission([q("a", "A"), q("b", "B")], { a: "A" });

  it("passes through raw counts when no points are configured", () => {
    expect(applyPointsPossible(half, null)).toEqual({ score: 1, max: 2 });
  });

  it("scales onto the configured points", () => {
    expect(applyPointsPossible(half, 10)).toEqual({ score: 5, max: 10 });
  });

  it("rounds partial credit to two decimals", () => {
    const oneOfThree = scoreQuizSubmission(
      [q("a", "A"), q("b", "B"), q("c", "C")],
      { a: "A" },
    );

    expect(applyPointsPossible(oneOfThree, 10)).toEqual({ score: 3.33, max: 10 });
  });

  it("avoids divide-by-zero when nothing is scorable", () => {
    const empty = scoreQuizSubmission([], {});

    expect(applyPointsPossible(empty, 10)).toEqual({ score: 0, max: 10 });
  });

  it("ignores non-positive point configurations", () => {
    expect(applyPointsPossible(half, 0)).toEqual({ score: 1, max: 2 });
    expect(applyPointsPossible(half, -5)).toEqual({ score: 1, max: 2 });
  });
});
