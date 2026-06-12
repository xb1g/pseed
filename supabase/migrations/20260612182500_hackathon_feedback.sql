-- Hackathon Feedback Table
-- Stores post-event feedback from hackathon participants

CREATE TABLE IF NOT EXISTS public.hackathon_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id UUID NOT NULL REFERENCES public.hackathon_participants(id) ON DELETE CASCADE,
  
  -- Event experience
  event_takeaways TEXT,
  mentorship_rating INTEGER CHECK (mentorship_rating BETWEEN 1 AND 5),
  can_make_social_change BOOLEAN,
  would_do_again BOOLEAN,
  improvement_suggestions TEXT,
  
  -- Follow-up interests
  wants_call BOOLEAN NOT NULL DEFAULT FALSE,
  wants_product_beta BOOLEAN NOT NULL DEFAULT FALSE,
  wants_continue_mentorship BOOLEAN NOT NULL DEFAULT FALSE,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE (participant_id)
);

CREATE INDEX IF NOT EXISTS idx_hackathon_feedback_participant
  ON public.hackathon_feedback(participant_id);

COMMENT ON TABLE public.hackathon_feedback IS 'Post-event feedback submissions from hackathon participants';

-- Updated_at trigger
DROP TRIGGER IF EXISTS hackathon_feedback_handle_updated_at ON public.hackathon_feedback;
CREATE TRIGGER hackathon_feedback_handle_updated_at
  BEFORE UPDATE ON public.hackathon_feedback
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Row Level Security: participants can only read/write their own feedback
ALTER TABLE public.hackathon_feedback ENABLE ROW LEVEL SECURITY;

-- Allow participants to insert their own feedback
CREATE POLICY hackathon_feedback_insert_own
  ON public.hackathon_feedback
  FOR INSERT
  TO authenticated
  WITH CHECK (
    participant_id IN (
      SELECT id FROM public.hackathon_participants WHERE email = auth.jwt() ->> 'email'
    )
  );

-- Allow participants to select their own feedback
CREATE POLICY hackathon_feedback_select_own
  ON public.hackathon_feedback
  FOR SELECT
  TO authenticated
  USING (
    participant_id IN (
      SELECT id FROM public.hackathon_participants WHERE email = auth.jwt() ->> 'email'
    )
  );

-- Allow participants to update their own feedback
CREATE POLICY hackathon_feedback_update_own
  ON public.hackathon_feedback
  FOR UPDATE
  TO authenticated
  USING (
    participant_id IN (
      SELECT id FROM public.hackathon_participants WHERE email = auth.jwt() ->> 'email'
    )
  )
  WITH CHECK (
    participant_id IN (
      SELECT id FROM public.hackathon_participants WHERE email = auth.jwt() ->> 'email'
    )
  );
