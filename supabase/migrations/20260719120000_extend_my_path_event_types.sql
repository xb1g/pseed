-- Extend My Path event types for the /plan mission wizard.
-- pathlab_selected / pathlab_deselected persist PathLab picks on the journey;
-- wizard_step_viewed / goal_locked / mission_plan_viewed are anonymous analytics.

alter table public.my_path_events
  drop constraint my_path_events_event_type_check;
alter table public.my_path_events
  add constraint my_path_events_event_type_check check (event_type in (
    'entry_viewed', 'career_opened', 'career_meaningful_open',
    'radar_profile_opened', 'career_compared', 'career_saved',
    'career_dismissed', 'career_removed', 'question_answered',
    'question_skipped', 'direction_edited', 'direction_rejected',
    'question_saved', 'step_started', 'step_completed', 'step_not_useful',
    'pathlab_selected', 'pathlab_deselected'
  ));

alter table public.anonymous_my_path_events
  drop constraint anonymous_my_path_events_event_type_check;
alter table public.anonymous_my_path_events
  add constraint anonymous_my_path_events_event_type_check check (event_type in (
    'reel_entry_viewed', 'career_preview_opened', 'radar_profile_opened',
    'micro_question_answered', 'micro_question_skipped', 'career_compared',
    'career_saved', 'career_dismissed', 'career_removed',
    'next_step_started', 'next_step_completed', 'pathlab_handoff_clicked',
    'wizard_step_viewed', 'pathlab_selected', 'pathlab_deselected',
    'goal_locked', 'mission_plan_viewed'
  ));

create or replace function private.sync_my_path_journey(
  p_draft jsonb,
  p_direction jsonb,
  p_next_step jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_path_id uuid;
  v_previous_import_key text;
  v_imported boolean := false;
  v_saved_count integer := 0;
  v_slug text;
  v_possibility jsonb;
  v_item jsonb;
  v_event_count integer := 0;
  v_state text;
  v_direction_facets text[] := '{}';
begin
  if v_user_id is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;
  if jsonb_typeof(p_draft) <> 'object'
     or (p_draft->>'version')::integer <> 1
     or pg_column_size(p_draft) > 131072 then
    raise exception 'invalid My Path draft' using errcode = '22023';
  end if;
  if coalesce(p_draft->>'draftId', '') !~ '^[A-Za-z0-9._:-]{6,128}$' then
    raise exception 'invalid My Path draft id' using errcode = '22023';
  end if;
  if jsonb_typeof(coalesce(p_draft->'possibilities', '{}'::jsonb)) <> 'object'
     or jsonb_typeof(coalesce(p_draft->'events', '[]'::jsonb)) <> 'array'
     or jsonb_array_length(coalesce(p_draft->'events', '[]'::jsonb)) > 200 then
    raise exception 'invalid My Path draft collections' using errcode = '22023';
  end if;

  select count(*) into v_saved_count
  from jsonb_each(coalesce(p_draft->'possibilities', '{}'::jsonb)) as possibility
  where possibility.value->>'state' = 'saved';
  if v_saved_count > 3 then
    raise exception 'active saved path limit is three' using errcode = '23514';
  end if;

  for v_slug, v_possibility in
    select key, value
    from jsonb_each(coalesce(p_draft->'possibilities', '{}'::jsonb))
    order by (value->>'state' = 'saved') asc
  loop
    v_state := v_possibility->>'state';
    if v_slug !~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'
       or v_state not in ('explored', 'saved', 'dismissed', 'removed')
       or not exists (
         select 1 from public.radar_fields
         where slug = v_slug and is_published = true
       ) then
      raise exception 'draft contains an invalid or unpublished Radar career' using errcode = '22023';
    end if;
  end loop;

  if jsonb_typeof(coalesce(p_direction->'facets', '[]'::jsonb)) = 'array' then
    select coalesce(array_agg(facet), '{}') into v_direction_facets
    from (
      select left(value, 40) as facet
      from jsonb_array_elements_text(p_direction->'facets')
      limit 6
    ) as facets;
  end if;

  select id, last_import_key
    into v_path_id, v_previous_import_key
  from public.my_paths
  where user_id = v_user_id
  for update;

  if v_path_id is null then
    insert into public.my_paths (
      user_id, entry_key, direction_hypothesis, direction_facets,
      draft_version, last_import_key
    ) values (
      v_user_id,
      left(coalesce(p_draft->>'entryKey', 'generic'), 80),
      left(nullif(p_direction->>'statement', ''), 280),
      v_direction_facets,
      1,
      p_draft->>'draftId'
    )
    returning id into v_path_id;
    v_imported := true;
  else
    v_imported := v_previous_import_key is distinct from (p_draft->>'draftId');
    update public.my_paths
    set entry_key = left(coalesce(p_draft->>'entryKey', entry_key), 80),
        direction_hypothesis = left(nullif(p_direction->>'statement', ''), 280),
        direction_facets = v_direction_facets,
        last_import_key = p_draft->>'draftId'
    where id = v_path_id and user_id = v_user_id;
  end if;

  for v_slug, v_possibility in
    select key, value
    from jsonb_each(coalesce(p_draft->'possibilities', '{}'::jsonb))
    -- Apply removals/dismissals before saves so replacing one of three saved
    -- careers cannot trip the active-path trigger inside this transaction.
    order by (value->>'state' = 'saved') asc
  loop
    insert into public.my_path_possibilities (
      my_path_id, user_id, radar_slug, state, opened_count,
      meaningful_open, radar_opened, compared, saved_at, removed_at,
      removal_reason, first_explored_at, last_interaction_at
    ) values (
      v_path_id,
      v_user_id,
      v_slug,
      v_possibility->>'state',
      least(greatest(coalesce((v_possibility->>'openedCount')::integer, 0), 0), 1000),
      coalesce((v_possibility->>'meaningfulOpen')::boolean, false),
      coalesce((v_possibility->>'radarOpened')::boolean, false),
      coalesce((v_possibility->>'compared')::boolean, false),
      nullif(v_possibility->>'savedAt', '')::timestamptz,
      case when v_possibility->>'state' = 'removed'
        then nullif(v_possibility->>'updatedAt', '')::timestamptz else null end,
      left(nullif(v_possibility->>'removedReason', ''), 200),
      nullif(v_possibility->>'updatedAt', '')::timestamptz,
      nullif(v_possibility->>'updatedAt', '')::timestamptz
    )
    on conflict (my_path_id, radar_slug) do update
    set state = excluded.state,
        opened_count = greatest(public.my_path_possibilities.opened_count, excluded.opened_count),
        meaningful_open = public.my_path_possibilities.meaningful_open or excluded.meaningful_open,
        radar_opened = public.my_path_possibilities.radar_opened or excluded.radar_opened,
        compared = public.my_path_possibilities.compared or excluded.compared,
        saved_at = coalesce(excluded.saved_at, public.my_path_possibilities.saved_at),
        removed_at = excluded.removed_at,
        removal_reason = coalesce(excluded.removal_reason, public.my_path_possibilities.removal_reason),
        last_interaction_at = excluded.last_interaction_at;
  end loop;

  for v_item in
    select value from jsonb_array_elements(coalesce(p_draft->'savedQuestions', '[]'::jsonb))
  loop
    if coalesce(v_item->>'id', '') ~ '^[A-Za-z0-9._:-]{6,128}$'
       and char_length(coalesce(v_item->>'text', '')) between 1 and 280
       and v_item->>'status' in ('open', 'answered') then
      insert into public.my_path_questions (
        my_path_id, user_id, client_question_id, question_text,
        career_slugs, status, answered_at
      ) values (
        v_path_id,
        v_user_id,
        v_item->>'id',
        v_item->>'text',
        array(
          select value from jsonb_array_elements_text(
            coalesce(v_item->'careerSlugs', '[]'::jsonb)
          ) limit 2
        ),
        v_item->>'status',
        case when v_item->>'status' = 'answered' then now() else null end
      )
      on conflict (my_path_id, client_question_id) do update
      set question_text = excluded.question_text,
          career_slugs = excluded.career_slugs,
          status = excluded.status,
          answered_at = excluded.answered_at;
    end if;
  end loop;

  for v_item in
    select value from jsonb_array_elements(coalesce(p_draft->'events', '[]'::jsonb))
  loop
    if coalesce(v_item->>'id', '') !~ '^[A-Za-z0-9._:-]{6,128}$'
       or v_item->>'type' not in (
         'entry_viewed', 'career_opened', 'career_meaningful_open',
         'radar_profile_opened', 'career_compared', 'career_saved',
         'career_dismissed', 'career_removed', 'question_answered',
         'question_skipped', 'direction_edited', 'direction_rejected',
         'question_saved', 'step_started', 'step_completed', 'step_not_useful',
         'pathlab_selected', 'pathlab_deselected'
       ) then
      raise exception 'invalid My Path event' using errcode = '22023';
    end if;
    insert into public.my_path_events (
      my_path_id, user_id, client_event_id, event_type,
      career_slug, payload, occurred_at
    ) values (
      v_path_id,
      v_user_id,
      v_item->>'id',
      v_item->>'type',
      nullif(v_item->>'careerSlug', ''),
      v_item - 'id' - 'type' - 'careerSlug' - 'occurredAt',
      (v_item->>'occurredAt')::timestamptz
    )
    on conflict (my_path_id, client_event_id) do nothing;
    if found then
      v_event_count := v_event_count + 1;
      if v_item->>'type' = 'step_started' then
        update public.my_path_steps
        set started_at = coalesce(started_at, (v_item->>'occurredAt')::timestamptz)
        where my_path_id = v_path_id
          and user_id = v_user_id
          and external_key = v_item->>'stepId';
      elsif v_item->>'type' = 'step_completed' then
        update public.my_path_steps
        set status = 'completed',
            completed_at = (v_item->>'occurredAt')::timestamptz
        where my_path_id = v_path_id
          and user_id = v_user_id
          and external_key = v_item->>'stepId';
      elsif v_item->>'type' = 'step_not_useful' then
        update public.my_path_steps
        set status = case
          when v_item->>'reason' = 'replace' then 'replaced'
          else 'not_useful'
        end
        where my_path_id = v_path_id
          and user_id = v_user_id
          and external_key = v_item->>'stepId';
      end if;
    end if;
  end loop;

  if jsonb_typeof(p_next_step) = 'object'
     and char_length(coalesce(p_next_step->>'id', '')) between 1 and 160
     and p_next_step->>'kind' in (
       'understand-career', 'compare-careers', 'answer-question',
       'radar-reflection', 'lightweight-activity', 'pathlab', 'review-direction'
     ) then
    update public.my_path_steps
    set status = 'replaced'
    where my_path_id = v_path_id
      and user_id = v_user_id
      and status = 'current'
      and external_key <> p_next_step->>'id';

    insert into public.my_path_steps (
      my_path_id, user_id, external_key, kind, title, detail,
      href, pathlab_href, career_slugs, duration_minutes, status
    ) values (
      v_path_id,
      v_user_id,
      p_next_step->>'id',
      p_next_step->>'kind',
      left(p_next_step->>'title', 280),
      left(coalesce(p_next_step->>'detail', ''), 600),
      nullif(p_next_step->>'href', ''),
      nullif(p_next_step->>'pathLabHref', ''),
      array(
        select value from jsonb_array_elements_text(
          coalesce(p_next_step->'careerSlugs', '[]'::jsonb)
        ) limit 2
      ),
      least(greatest(coalesce((p_next_step->>'durationMinutes')::integer, 10), 1), 120),
      'current'
    )
    on conflict (my_path_id, external_key) do update
    set title = excluded.title,
        detail = excluded.detail,
        href = excluded.href,
        pathlab_href = excluded.pathlab_href,
        career_slugs = excluded.career_slugs,
        duration_minutes = excluded.duration_minutes,
        status = case
          when public.my_path_steps.status = 'completed' then 'completed'
          else 'current'
        end;
  end if;

  return jsonb_build_object(
    'pathId', v_path_id,
    'imported', v_imported,
    'eventsCreated', v_event_count,
    'savedCount', v_saved_count
  );
end;
$$;

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
    'goal_locked', 'mission_plan_viewed'
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
