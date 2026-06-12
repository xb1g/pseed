ALTER TABLE public.hackathon_feedback
  ADD COLUMN IF NOT EXISTS product_priority TEXT,
  ADD COLUMN IF NOT EXISTS product_priority_reason TEXT;

ALTER TABLE public.hackathon_feedback
  ADD CONSTRAINT hackathon_feedback_product_priority_valid
    CHECK (
      product_priority IS NULL
      OR product_priority IN (
        'career_classes',
        'student_reviews',
        'interest_squad',
        'seven_day_project',
        'job_intelligence',
        'parent_summary'
      )
    );

COMMENT ON COLUMN public.hackathon_feedback.product_priority IS
  'First future-path product experience the participant most wants to try';
COMMENT ON COLUMN public.hackathon_feedback.product_priority_reason IS
  'Optional explanation for the selected product priority';
