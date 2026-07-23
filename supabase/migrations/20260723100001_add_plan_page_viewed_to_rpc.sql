-- Add plan_page_viewed to the RPC function allowlist so the event is actually recorded.

create or replace function private.record_anonymous_my_path_event(
  p_session_id text,
  p_event_type text,
  p_career_slug text default null,
  p_metadata jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_event_id uuid;
  v_recent_count integer;
begin
  if p_session_id !~ '^[A-Za-z0-9._:-]{8,128}$' then
    raise exception 'invalid anonymous My Path session' using errcode = '22023';
  end if;
  if p_event_type not in (
    'reel_entry_viewed', 'career_preview_opened', 'radar_profile_opened',
    'micro_question_answered', 'micro_question_skipped', 'career_compared',
    'career_saved', 'career_dismissed', 'career_removed',
    'next_step_started', 'next_step_completed', 'pathlab_handoff_clicked',
    'wizard_step_viewed', 'pathlab_selected', 'pathlab_deselected',
    'goal_locked', 'mission_plan_viewed',
    'plan_page_viewed'
  ) then
    raise exception 'invalid anonymous My Path event' using errcode = '22023';
  end if;
  if jsonb_typeof(p_metadata) <> 'object' or pg_column_size(p_metadata) > 2048 then
    raise exception 'invalid anonymous My Path metadata' using errcode = '22023';
  end if;
  if p_career_slug is not null and not exists (
    select 1 from public.radar_fields
    where slug = p_career_slug and is_published = true
  ) then
    raise exception 'unknown Radar career' using errcode = '22023';
  end if;

  select count(*) into v_recent_count
  from public.anonymous_my_path_events
  where session_id = p_session_id
    and created_at >= now() - interval '1 hour';
  if v_recent_count >= 60 then
    raise exception 'anonymous My Path rate limit exceeded' using errcode = '54000';
  end if;

  insert into public.anonymous_my_path_events (
    session_id, event_type, career_slug, metadata
  ) values (
    p_session_id, p_event_type, p_career_slug, p_metadata
  ) returning id into v_event_id;

  return v_event_id;
end;
$$;
