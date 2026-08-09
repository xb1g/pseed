-- Allow the client-side quiz auto-grader to write its grade.
--
-- Context: 20260331120000_security_hardening_sweep.sql restricted INSERT on
-- submission_grades to admins and classroom instructors. Quiz auto-grading runs
-- in the student's browser (lib/supabase/assessment.ts), so every quiz
-- submission failed with "new row violates row-level security policy", leaving
-- progress stuck at `submitted` and never reaching `passed`.
--
-- This policy is deliberately narrow. A student may insert a grade only when:
--   * graded_by IS NULL          -- system-generated, not impersonating a grader
--   * the submission is theirs   -- traced submission -> progress -> user_id
--
-- "Only one auto-grade per submission" is enforced by a partial unique index
-- rather than a policy clause: a NOT EXISTS over submission_grades inside a
-- submission_grades policy re-enters that policy and errors with "infinite
-- recursion detected in policy".
--
-- Scope note: this grants no capability students do not already have. The
-- answer key (quiz_questions.correct_option) is already readable by any student
-- on a public map under view_quiz_questions_policy, and the client already
-- grades against it. A student who wanted to force a pass could simply read the
-- key and answer correctly. Moving scoring server-side is the real fix for that
-- exposure and is tracked separately -- it is not what this migration claims to
-- do.
--
-- Prod-first: additive and idempotent.

DROP POLICY IF EXISTS "students_can_auto_grade_own_submission" ON public.submission_grades;
CREATE POLICY "students_can_auto_grade_own_submission" ON public.submission_grades
  FOR INSERT
  WITH CHECK (
    graded_by IS NULL
    AND EXISTS (
      SELECT 1
      FROM public.assessment_submissions asub
      JOIN public.student_node_progress snp ON snp.id = asub.progress_id
      WHERE asub.id = submission_grades.submission_id
        AND snp.user_id = auth.uid()
    )
  );

-- One auto-grade per submission. A student cannot stack repeated system grades
-- on the same submission; instructor grades (graded_by NOT NULL) are unaffected.
CREATE UNIQUE INDEX IF NOT EXISTS idx_submission_grades_one_auto_per_submission
  ON public.submission_grades (submission_id)
  WHERE graded_by IS NULL;

COMMENT ON POLICY "students_can_auto_grade_own_submission" ON public.submission_grades IS
  'Lets the client-side quiz auto-grader insert a system grade (graded_by IS NULL) for the student''s own ungraded submission. Instructor grading is unaffected.';
