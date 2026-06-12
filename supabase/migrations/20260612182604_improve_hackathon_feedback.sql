ALTER TABLE public.hackathon_feedback
  ADD COLUMN IF NOT EXISTS feedback_version TEXT
    CHECK (feedback_version IN ('future_path', 'project_growth')),
  ADD COLUMN IF NOT EXISTS overall_rating INTEGER
    CHECK (overall_rating BETWEEN 1 AND 5),
  ADD COLUMN IF NOT EXISTS top_takeaways TEXT[],
  ADD COLUMN IF NOT EXISTS other_takeaway TEXT,
  ADD COLUMN IF NOT EXISTS social_change_confidence TEXT
    CHECK (social_change_confidence IN ('much_more', 'more', 'same', 'less')),
  ADD COLUMN IF NOT EXISTS had_mentorship BOOLEAN,
  ADD COLUMN IF NOT EXISTS mentor_help_area TEXT
    CHECK (mentor_help_area IN (
      'technical',
      'project_development',
      'social_impact',
      'teamwork',
      'pitching',
      'career',
      'other'
    )),
  ADD COLUMN IF NOT EXISTS other_mentor_help TEXT,
  ADD COLUMN IF NOT EXISTS project_stage TEXT
    CHECK (project_stage IN ('idea', 'prototype', 'mvp', 'real_world_test', 'continuing')),
  ADD COLUMN IF NOT EXISTS project_continuation_interest TEXT
    CHECK (project_continuation_interest IN ('yes', 'maybe', 'no')),
  ADD COLUMN IF NOT EXISTS ongoing_mentorship_interest TEXT
    CHECK (ongoing_mentorship_interest IN ('yes', 'maybe', 'no')),
  ADD COLUMN IF NOT EXISTS future_event_interest TEXT
    CHECK (future_event_interest IN ('definitely', 'maybe', 'no')),
  ADD COLUMN IF NOT EXISTS learning_content_rating INTEGER
    CHECK (learning_content_rating BETWEEN 1 AND 5),
  ADD COLUMN IF NOT EXISTS learning_content_issues TEXT[],
  ADD COLUMN IF NOT EXISTS learning_content_feedback TEXT,
  ADD COLUMN IF NOT EXISTS future_path_uncertain BOOLEAN,
  ADD COLUMN IF NOT EXISTS follow_up_interests TEXT[],
  ADD COLUMN IF NOT EXISTS wants_contact BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS contact_name TEXT,
  ADD COLUMN IF NOT EXISTS contact_topics TEXT[],
  ADD COLUMN IF NOT EXISTS other_contact_topic TEXT;

ALTER TABLE public.hackathon_feedback
  ADD CONSTRAINT hackathon_feedback_top_takeaways_limit
    CHECK (top_takeaways IS NULL OR cardinality(top_takeaways) BETWEEN 1 AND 3),
  ADD CONSTRAINT hackathon_feedback_learning_issues_limit
    CHECK (learning_content_issues IS NULL OR cardinality(learning_content_issues) BETWEEN 1 AND 3),
  ADD CONSTRAINT hackathon_feedback_follow_up_limit
    CHECK (follow_up_interests IS NULL OR cardinality(follow_up_interests) <= 3),
  ADD CONSTRAINT hackathon_feedback_mentorship_details
    CHECK (
      had_mentorship IS NULL
      OR (
        had_mentorship = TRUE
        AND mentorship_rating IS NOT NULL
        AND mentor_help_area IS NOT NULL
      )
      OR (
        had_mentorship = FALSE
        AND mentorship_rating IS NULL
        AND mentor_help_area IS NULL
      )
    ),
  ADD CONSTRAINT hackathon_feedback_other_takeaway
    CHECK (
      top_takeaways IS NULL
      OR NOT ('other' = ANY(top_takeaways))
      OR NULLIF(BTRIM(other_takeaway), '') IS NOT NULL
    ),
  ADD CONSTRAINT hackathon_feedback_other_mentor_help
    CHECK (
      mentor_help_area IS DISTINCT FROM 'other'
      OR NULLIF(BTRIM(other_mentor_help), '') IS NOT NULL
    ),
  ADD CONSTRAINT hackathon_feedback_contact_details
    CHECK (
      wants_contact = FALSE
      OR (
        NULLIF(BTRIM(contact_name), '') IS NOT NULL
        AND cardinality(contact_topics) > 0
      )
    ),
  ADD CONSTRAINT hackathon_feedback_other_contact_topic
    CHECK (
      wants_contact = FALSE
      OR NOT ('other' = ANY(contact_topics))
      OR NULLIF(BTRIM(other_contact_topic), '') IS NOT NULL
    );

COMMENT ON COLUMN public.hackathon_feedback.feedback_version IS
  'Audience-tailored feedback version derived from participant grade level';
COMMENT ON COLUMN public.hackathon_feedback.learning_content_feedback IS
  'Optional feedback about the hackathon learning content and app experience';
