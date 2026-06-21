-- Allow public/anonymous feedback submissions
-- Add nickname + team_name columns, make participant_id nullable

ALTER TABLE public.hackathon_feedback
  ALTER COLUMN participant_id DROP NOT NULL;

ALTER TABLE public.hackathon_feedback
  ADD COLUMN IF NOT EXISTS nickname TEXT,
  ADD COLUMN IF NOT EXISTS team_name TEXT;

-- Drop the unique constraint on participant_id so multiple anonymous submissions are allowed
ALTER TABLE public.hackathon_feedback
  DROP CONSTRAINT IF EXISTS hackathon_feedback_participant_id_key;

-- Re-add unique constraint but only for non-null participant_id
CREATE UNIQUE INDEX IF NOT EXISTS hackathon_feedback_participant_id_unique
  ON public.hackathon_feedback(participant_id)
  WHERE participant_id IS NOT NULL;
