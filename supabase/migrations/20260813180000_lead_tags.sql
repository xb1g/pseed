-- Funnel-stage tags beyond the coarse `stage` enum, so admin can see exactly
-- which product a lead is ready for instead of just exploring/building/job_seeking.
ALTER TABLE public.dm_conversations
  ADD COLUMN IF NOT EXISTS has_hands_on_experience boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS wants_pathlab boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS pathlab_pay_ready boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS wants_community boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS wants_talent boolean NOT NULL DEFAULT false;

ALTER TABLE public.ig_comments
  ADD COLUMN IF NOT EXISTS has_hands_on_experience boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS wants_pathlab boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS pathlab_pay_ready boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS wants_community boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS wants_talent boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_dm_conversations_pathlab_pay_ready
ON public.dm_conversations(pathlab_pay_ready) WHERE pathlab_pay_ready;
