-- Add plan_page_viewed event type for tracking every /plan page visit.

alter table public.anonymous_my_path_events
  drop constraint anonymous_my_path_events_event_type_check;
alter table public.anonymous_my_path_events
  add constraint anonymous_my_path_events_event_type_check check (event_type in (
    'reel_entry_viewed', 'career_preview_opened', 'radar_profile_opened',
    'micro_question_answered', 'micro_question_skipped', 'career_compared',
    'career_saved', 'career_dismissed', 'career_removed',
    'next_step_started', 'next_step_completed', 'pathlab_handoff_clicked',
    'wizard_step_viewed', 'pathlab_selected', 'pathlab_deselected',
    'goal_locked', 'mission_plan_viewed',
    'plan_page_viewed'
  ));
