-- Allow hackathon_submission_signals to hold Phase 4 / Round 1 video-pitch grades.
-- submission_id = team id, submission_scope = 'phase4_video'. grappling = video total/100.
-- One video per team (from the Round 1 submission form CSV). Local-only feature work.

BEGIN;

ALTER TABLE public.hackathon_submission_signals
  DROP CONSTRAINT IF EXISTS hackathon_submission_signals_submission_scope_check;

ALTER TABLE public.hackathon_submission_signals
  ADD CONSTRAINT hackathon_submission_signals_submission_scope_check
  CHECK (submission_scope IN ('individual', 'team', 'phase3_cycle', 'phase4_video'));

COMMIT;
