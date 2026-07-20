import type { PathQuizQuestion } from "@/types/pathlab-content";

/**
 * Result of scoring a submission. `max` is snapshotted at scoring time so that
 * later edits to an assessment never retroactively change a student's score.
 */
export interface QuizScore {
  score: number;
  max: number;
  correctCount: number;
  totalCount: number;
  /** Per-question outcome, kept for report drill-down and item analysis */
  breakdown: Array<{
    questionId: string;
    selected: string | null;
    correct: string;
    isCorrect: boolean;
  }>;
}

/**
 * Answers arrive as { [questionId]: selectedOption }.
 */
export type QuizAnswers = Record<string, unknown>;

function normalizeOption(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

/**
 * Score quiz answers against the stored correct options.
 *
 * Unanswered and unrecognised questions count as incorrect rather than being
 * skipped — a student who leaves half the quiz blank has not scored 100%.
 * Questions with no `correct_option` configured are excluded from the
 * denominator entirely, since an unanswerable question is an authoring bug and
 * should not be charged to the student.
 */
export function scoreQuizSubmission(
  questions: Pick<PathQuizQuestion, "id" | "correct_option">[],
  answers: QuizAnswers | null | undefined,
): QuizScore {
  const scorable = questions.filter(
    (question) => normalizeOption(question.correct_option) !== null,
  );

  const breakdown = scorable.map((question) => {
    const correct = normalizeOption(question.correct_option) as string;
    const selected = normalizeOption(answers?.[question.id]);

    return {
      questionId: question.id,
      selected,
      correct,
      isCorrect: selected !== null && selected === correct,
    };
  });

  const correctCount = breakdown.filter((entry) => entry.isCorrect).length;

  return {
    score: correctCount,
    max: scorable.length,
    correctCount,
    totalCount: scorable.length,
    breakdown,
  };
}

/**
 * Scale a raw quiz result onto an assessment's configured points.
 * Falls back to the raw question count when no points are configured.
 */
export function applyPointsPossible(
  result: QuizScore,
  pointsPossible: number | null | undefined,
): { score: number; max: number } {
  if (
    typeof pointsPossible !== "number" ||
    !Number.isFinite(pointsPossible) ||
    pointsPossible <= 0
  ) {
    return { score: result.score, max: result.max };
  }

  if (result.max === 0) {
    return { score: 0, max: pointsPossible };
  }

  const scaled = (result.score / result.max) * pointsPossible;
  // Two decimals keeps partial credit meaningful without float noise
  return { score: Math.round(scaled * 100) / 100, max: pointsPossible };
}
