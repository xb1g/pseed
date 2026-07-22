-- Never let a client clock place Radar freshness in the future. Past timestamps
-- stay intact so queued offline intent still merges in its real event order.

create or replace function private.apply_my_path_radar_event(
  p_client_event_id text,
  p_event_type text,
  p_career_slug text,
  p_occurred_at timestamptz
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_path_id uuid;
  v_event_created boolean := false;
  v_current_state text;
  v_current_interaction timestamptz;
  v_saved_count integer := 0;
  v_effective_occurred_at timestamptz := least(p_occurred_at, statement_timestamp());
begin
  if v_user_id is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;
  if coalesce(p_client_event_id, '') !~ '^[A-Za-z0-9._:-]{6,128}$'
     or p_event_type not in (
       'radar_profile_opened', 'career_saved', 'career_removed'
     )
     or coalesce(p_career_slug, '') !~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'
     or p_occurred_at is null then
    raise exception 'invalid Radar My Path event' using errcode = '22023';
  end if;
  if not exists (
    select 1
    from public.radar_fields
    where slug = p_career_slug and is_published = true
  ) then
    raise exception 'unknown Radar career' using errcode = '22023';
  end if;

  insert into public.my_paths (user_id, entry_key)
  values (v_user_id, 'radar')
  on conflict (user_id) do update
    set user_id = excluded.user_id
  returning id into v_path_id;

  insert into public.my_path_events (
    my_path_id, user_id, client_event_id, event_type,
    career_slug, payload, occurred_at
  ) values (
    v_path_id, v_user_id, p_client_event_id, p_event_type,
    p_career_slug, jsonb_build_object('source', 'radar'), v_effective_occurred_at
  )
  on conflict (my_path_id, client_event_id) do nothing;
  v_event_created := found;

  if not v_event_created then
    return jsonb_build_object('accepted', true, 'duplicate', true);
  end if;

  select state, last_interaction_at
    into v_current_state, v_current_interaction
  from public.my_path_possibilities
  where my_path_id = v_path_id and radar_slug = p_career_slug;

  if v_current_interaction is not null
     and v_current_interaction > v_effective_occurred_at then
    return jsonb_build_object(
      'accepted', true,
      'duplicate', false,
      'stale', true
    );
  end if;

  if p_event_type = 'radar_profile_opened' then
    insert into public.my_path_possibilities (
      my_path_id, user_id, radar_slug, state, radar_opened,
      first_explored_at, last_interaction_at
    ) values (
      v_path_id, v_user_id, p_career_slug, 'explored', true,
      v_effective_occurred_at, v_effective_occurred_at
    )
    on conflict (my_path_id, radar_slug) do update
    set radar_opened = true,
        last_interaction_at = greatest(
          public.my_path_possibilities.last_interaction_at,
          excluded.last_interaction_at
        );
  elsif p_event_type = 'career_saved' then
    select count(*) into v_saved_count
    from public.my_path_possibilities
    where my_path_id = v_path_id and state = 'saved';

    if v_current_state = 'saved' or v_saved_count < 3 then
      insert into public.my_path_possibilities (
        my_path_id, user_id, radar_slug, state, saved_at,
        first_explored_at, last_interaction_at
      ) values (
        v_path_id, v_user_id, p_career_slug, 'saved', v_effective_occurred_at,
        v_effective_occurred_at, v_effective_occurred_at
      )
      on conflict (my_path_id, radar_slug) do update
      set state = 'saved',
          saved_at = excluded.saved_at,
          removed_at = null,
          removal_reason = null,
          last_interaction_at = excluded.last_interaction_at;
    else
      insert into public.my_path_possibilities (
        my_path_id, user_id, radar_slug, state,
        first_explored_at, last_interaction_at
      ) values (
        v_path_id, v_user_id, p_career_slug, 'explored',
        v_effective_occurred_at, v_effective_occurred_at
      )
      on conflict (my_path_id, radar_slug) do nothing;
    end if;
  else
    insert into public.my_path_possibilities (
      my_path_id, user_id, radar_slug, state, removed_at, removal_reason,
      first_explored_at, last_interaction_at
    ) values (
      v_path_id, v_user_id, p_career_slug, 'removed', v_effective_occurred_at,
      'radar_intent', v_effective_occurred_at, v_effective_occurred_at
    )
    on conflict (my_path_id, radar_slug) do update
    set state = 'removed',
        removed_at = excluded.removed_at,
        removal_reason = excluded.removal_reason,
        last_interaction_at = excluded.last_interaction_at;
  end if;

  return jsonb_build_object(
    'accepted', true,
    'duplicate', false,
    'savedCount', v_saved_count
  );
end;
$$;
