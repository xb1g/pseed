-- =====================================================
-- PATHLAB PERFORMANCE SIGNAL
-- =====================================================
-- PathLab measured interest (path_reflections) but never aptitude:
-- path_assessment_submissions stored student work with no way to score it,
-- so every report read identically regardless of work quality.
--
-- Adds the scoring columns and the effort/persistence fields needed to
-- separate "did they enjoy it" from "were they any good at it".
-- =====================================================

-- =====================================================
-- SUBMISSION SCORING
-- =====================================================
ALTER TABLE public.path_assessment_submissions
  ADD COLUMN IF NOT EXISTS score NUMERIC,
  ADD COLUMN IF NOT EXISTS max_score NUMERIC,
  ADD COLUMN IF NOT EXISTS scoring_method TEXT
    CHECK (scoring_method IS NULL OR scoring_method IN ('auto_quiz', 'rubric_ai', 'rubric_human')),
  ADD COLUMN IF NOT EXISTS rubric_scores JSONB,
  ADD COLUMN IF NOT EXISTS scored_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS scored_by UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS attempt_count INT NOT NULL DEFAULT 1;

-- Score must be within bounds when present
ALTER TABLE public.path_assessment_submissions
  DROP CONSTRAINT IF EXISTS path_assessment_submissions_score_range;

ALTER TABLE public.path_assessment_submissions
  ADD CONSTRAINT path_assessment_submissions_score_range
  CHECK (
    score IS NULL
    OR max_score IS NULL
    OR (score >= 0 AND score <= max_score)
  );

-- Partial index: reports and cohort stats only ever read scored rows
CREATE INDEX IF NOT EXISTS idx_path_submissions_scored
  ON public.path_assessment_submissions(assessment_id, score)
  WHERE score IS NOT NULL;

COMMENT ON COLUMN public.path_assessment_submissions.score IS 'Points earned. NULL means not yet scored';
COMMENT ON COLUMN public.path_assessment_submissions.max_score IS 'Points available at scoring time, snapshotted so later assessment edits do not retroactively change past scores';
COMMENT ON COLUMN public.path_assessment_submissions.scoring_method IS 'auto_quiz (correct_option match), rubric_ai (AI graded against expert rubric), rubric_human (expert graded)';
COMMENT ON COLUMN public.path_assessment_submissions.rubric_scores IS 'Per-criterion breakdown: {criterion_key: {score, max, note}}';
COMMENT ON COLUMN public.path_assessment_submissions.attempt_count IS 'Submissions made for this assessment. Revision effort is itself a fit signal';

-- =====================================================
-- ACTIVITY PROGRESS: EFFORT + PERSISTENCE
-- =====================================================
ALTER TABLE public.path_activity_progress
  ADD COLUMN IF NOT EXISTS visit_count INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_visited_at TIMESTAMPTZ;

COMMENT ON COLUMN public.path_activity_progress.visit_count IS 'Times the student opened this activity. Returning voluntarily is a revealed-preference signal';
COMMENT ON COLUMN public.path_activity_progress.last_visited_at IS 'Most recent open, used to derive return-after-gap behaviour';

-- time_spent_seconds already exists on path_activity_progress but was never
-- populated by any caller. Now written by /api/pathlab/progress.

-- =====================================================
-- RUBRIC DEFINITION ON ASSESSMENTS
-- =====================================================
ALTER TABLE public.path_assessments
  ADD COLUMN IF NOT EXISTS rubric JSONB;

COMMENT ON COLUMN public.path_assessments.rubric IS 'Scoring criteria for non-quiz assessments: [{key, label, max, guidance}]. Authored from the expert interview per docs/pathlab-design-doctrine.md';
