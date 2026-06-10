-- Allow hackathon_submission_signals to also hold Phase 3 cycle scores.
-- submission_id = cycle id, submission_scope = 'phase3_cycle'. grappling = cycle total/100.
-- Lets the learning pipeline reuse one signals table across Phase 1-2 submissions and
-- Phase 3 cycles. Local-only feature work (see 20260609010000).

BEGIN;

ALTER TABLE public.hackathon_submission_signals
  DROP CONSTRAINT IF EXISTS hackathon_submission_signals_submission_scope_check;

ALTER TABLE public.hackathon_submission_signals
  ADD CONSTRAINT hackathon_submission_signals_submission_scope_check
  CHECK (submission_scope IN ('individual', 'team', 'phase3_cycle'));

COMMIT;
