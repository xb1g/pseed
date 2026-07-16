-- My Path: mutable direction, Radar-backed possibilities, uncertainty questions,
-- next actions, and immutable evidence/history. Radar remains authoritative for
-- career content; these tables store references and student signals only.

create schema if not exists private;

create table public.my_paths (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  entry_key text not null default 'generic'
    check (char_length(entry_key) between 1 and 80),
  direction_hypothesis text
    check (direction_hypothesis is null or char_length(direction_hypothesis) <= 280),
  direction_facets text[] not null default '{}',
  draft_version integer not null default 1 check (draft_version = 1),
  last_import_key text
    check (last_import_key is null or char_length(last_import_key) between 6 and 128),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id),
  unique (id, user_id)
);

create table public.my_path_possibilities (
  id uuid primary key default gen_random_uuid(),
  my_path_id uuid not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  radar_slug text not null references public.radar_fields(slug) on update cascade,
  state text not null check (state in ('explored', 'saved', 'dismissed', 'removed')),
  opened_count integer not null default 0 check (opened_count between 0 and 1000),
  meaningful_open boolean not null default false,
  radar_opened boolean not null default false,
  compared boolean not null default false,
  saved_at timestamptz,
  removed_at timestamptz,
  removal_reason text check (removal_reason is null or char_length(removal_reason) <= 200),
  first_explored_at timestamptz not null default now(),
  last_interaction_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (my_path_id, user_id)
    references public.my_paths(id, user_id) on delete cascade,
  unique (my_path_id, radar_slug)
);

create table public.my_path_questions (
  id uuid primary key default gen_random_uuid(),
  my_path_id uuid not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  client_question_id text not null
    check (char_length(client_question_id) between 6 and 128),
  question_text text not null check (char_length(question_text) between 1 and 280),
  career_slugs text[] not null default '{}'
    check (cardinality(career_slugs) <= 2),
  status text not null default 'open' check (status in ('open', 'answered')),
  answered_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (my_path_id, user_id)
    references public.my_paths(id, user_id) on delete cascade,
  unique (my_path_id, client_question_id)
);

create table public.my_path_steps (
  id uuid primary key default gen_random_uuid(),
  my_path_id uuid not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  external_key text not null check (char_length(external_key) between 1 and 160),
  kind text not null check (kind in (
    'understand-career', 'compare-careers', 'answer-question',
    'radar-reflection', 'lightweight-activity', 'pathlab', 'review-direction'
  )),
  title text not null check (char_length(title) between 1 and 280),
  detail text not null default '' check (char_length(detail) <= 600),
  href text check (href is null or (href like '/%' and char_length(href) <= 500)),
  pathlab_href text check (
    pathlab_href is null or (pathlab_href like '/seeds/pathlab/%' and char_length(pathlab_href) <= 500)
  ),
  career_slugs text[] not null default '{}'
    check (cardinality(career_slugs) <= 2),
  duration_minutes integer not null default 10 check (duration_minutes between 1 and 120),
  status text not null default 'current'
    check (status in ('current', 'completed', 'replaced', 'not_useful')),
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (my_path_id, user_id)
    references public.my_paths(id, user_id) on delete cascade,
  unique (my_path_id, external_key)
);

create table public.my_path_events (
  id uuid primary key default gen_random_uuid(),
  my_path_id uuid not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  client_event_id text not null check (char_length(client_event_id) between 6 and 128),
  event_type text not null check (event_type in (
    'entry_viewed', 'career_opened', 'career_meaningful_open',
    'radar_profile_opened', 'career_compared', 'career_saved',
    'career_dismissed', 'career_removed', 'question_answered',
    'question_skipped', 'direction_edited', 'direction_rejected',
    'question_saved', 'step_started', 'step_completed', 'step_not_useful'
  )),
  career_slug text,
  payload jsonb not null default '{}'::jsonb
    check (jsonb_typeof(payload) = 'object' and pg_column_size(payload) <= 8192),
  occurred_at timestamptz not null,
  created_at timestamptz not null default now(),
  foreign key (my_path_id, user_id)
    references public.my_paths(id, user_id) on delete cascade,
  unique (my_path_id, client_event_id)
);

create table public.anonymous_my_path_events (
  id uuid primary key default gen_random_uuid(),
  session_id text not null check (
    char_length(session_id) between 8 and 128
    and session_id ~ '^[A-Za-z0-9._:-]+$'
  ),
  event_type text not null check (event_type in (
    'reel_entry_viewed', 'career_preview_opened', 'radar_profile_opened',
    'micro_question_answered', 'micro_question_skipped', 'career_compared',
    'career_saved', 'career_dismissed', 'career_removed',
    'next_step_started', 'next_step_completed', 'pathlab_handoff_clicked'
  )),
  career_slug text,
  metadata jsonb not null default '{}'::jsonb
    check (jsonb_typeof(metadata) = 'object' and pg_column_size(metadata) <= 2048),
  created_at timestamptz not null default now()
);

create index my_path_possibilities_user_state_idx
  on public.my_path_possibilities (user_id, state, last_interaction_at desc);
create index my_path_questions_user_status_idx
  on public.my_path_questions (user_id, status, created_at desc);
create index my_path_steps_user_status_idx
  on public.my_path_steps (user_id, status, updated_at desc);
create unique index my_path_steps_one_current_idx
  on public.my_path_steps (my_path_id) where status = 'current';
create index my_path_events_user_occurred_idx
  on public.my_path_events (user_id, occurred_at desc);
create index anonymous_my_path_events_session_created_idx
  on public.anonymous_my_path_events (session_id, created_at desc);

create or replace function private.set_my_path_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger my_paths_set_updated_at
  before update on public.my_paths
  for each row execute function private.set_my_path_updated_at();
create trigger my_path_possibilities_set_updated_at
  before update on public.my_path_possibilities
  for each row execute function private.set_my_path_updated_at();
create trigger my_path_questions_set_updated_at
  before update on public.my_path_questions
  for each row execute function private.set_my_path_updated_at();
create trigger my_path_steps_set_updated_at
  before update on public.my_path_steps
  for each row execute function private.set_my_path_updated_at();

create or replace function private.enforce_my_path_saved_limit()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_saved_count integer;
begin
  if new.state <> 'saved' then
    return new;
  end if;

  if tg_op = 'UPDATE' and old.state = 'saved' then
    return new;
  end if;

  if tg_op = 'UPDATE' then
    select count(*) into v_saved_count
    from public.my_path_possibilities
    where my_path_id = new.my_path_id
      and state = 'saved'
      and id <> new.id;
  else
    select count(*) into v_saved_count
    from public.my_path_possibilities
    where my_path_id = new.my_path_id
      and state = 'saved';
  end if;

  if v_saved_count >= 3 then
    raise exception 'active saved path limit is three' using errcode = '23514';
  end if;
  return new;
end;
$$;

create trigger my_path_possibilities_saved_limit
  before insert or update of state on public.my_path_possibilities
  for each row execute function private.enforce_my_path_saved_limit();

alter table public.my_paths enable row level security;
alter table public.my_path_possibilities enable row level security;
alter table public.my_path_questions enable row level security;
alter table public.my_path_steps enable row level security;
alter table public.my_path_events enable row level security;
alter table public.anonymous_my_path_events enable row level security;

create policy "users read own my path"
  on public.my_paths for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "users read own my path possibilities"
  on public.my_path_possibilities for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "users read own my path questions"
  on public.my_path_questions for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "users read own my path steps"
  on public.my_path_steps for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "users read own my path events"
  on public.my_path_events for select to authenticated
  using ((select auth.uid()) = user_id);

-- No policies are created for anonymous_my_path_events. Only the private,
-- validated function below can write them and clients cannot read them.

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
         'question_saved', 'step_started', 'step_completed', 'step_not_useful'
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

create or replace function public.sync_my_path_journey(
  p_draft jsonb,
  p_direction jsonb,
  p_next_step jsonb
)
returns jsonb
language sql
security invoker
set search_path = ''
as $$
  select private.sync_my_path_journey(p_draft, p_direction, p_next_step);
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
    'next_step_started', 'next_step_completed', 'pathlab_handoff_clicked'
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

create or replace function public.record_anonymous_my_path_event(
  p_session_id text,
  p_event_type text,
  p_career_slug text default null,
  p_metadata jsonb default '{}'::jsonb
)
returns uuid
language sql
security invoker
set search_path = ''
as $$
  select private.record_anonymous_my_path_event(
    p_session_id, p_event_type, p_career_slug, p_metadata
  );
$$;

create or replace function public.get_my_path_journey()
returns jsonb
language sql
stable
security invoker
set search_path = ''
as $$
  with current_path as (
    select
      id, entry_key, direction_hypothesis, last_import_key, created_at, updated_at
    from public.my_paths
    where user_id = (select auth.uid())
  )
  select case
    when not exists (select 1 from current_path) then null
    else jsonb_build_object(
      'path', (
        select to_jsonb(path_row) - 'id'
        from current_path as path_row
      ),
      'possibilities', coalesce((
        select jsonb_agg(to_jsonb(possibility_row) order by last_interaction_at)
        from (
          select
            radar_slug, state, opened_count, meaningful_open, radar_opened,
            compared, saved_at, removal_reason, last_interaction_at
          from public.my_path_possibilities
          where my_path_id = (select id from current_path)
        ) as possibility_row
      ), '[]'::jsonb),
      'questions', coalesce((
        select jsonb_agg(to_jsonb(question_row) order by client_question_id)
        from (
          select client_question_id, question_text, career_slugs, status
          from public.my_path_questions
          where my_path_id = (select id from current_path)
        ) as question_row
      ), '[]'::jsonb),
      'events', coalesce((
        select jsonb_agg(to_jsonb(event_row) order by occurred_at)
        from (
          select client_event_id, event_type, career_slug, payload, occurred_at
          from public.my_path_events
          where my_path_id = (select id from current_path)
          order by occurred_at desc
          limit 200
        ) as event_row
      ), '[]'::jsonb),
      'reflections', coalesce((
        select jsonb_agg(to_jsonb(reflection_row) order by created_at desc)
        from (
          select
            id, field_slug, chapter_key, response_text, tags,
            want_to_try, created_at
          from public.radar_reflections
          where user_id = (select auth.uid()) and field_slug is not null
          order by created_at desc
          limit 20
        ) as reflection_row
      ), '[]'::jsonb)
    )
  end;
$$;

revoke all on table public.my_paths from anon, authenticated;
revoke all on table public.my_path_possibilities from anon, authenticated;
revoke all on table public.my_path_questions from anon, authenticated;
revoke all on table public.my_path_steps from anon, authenticated;
revoke all on table public.my_path_events from anon, authenticated;
revoke all on table public.anonymous_my_path_events from anon, authenticated;

grant select on table public.my_paths to authenticated;
grant select on table public.my_path_possibilities to authenticated;
grant select on table public.my_path_questions to authenticated;
grant select on table public.my_path_steps to authenticated;
grant select on table public.my_path_events to authenticated;

-- Events are immutable through the Data API even for their owner.
revoke update, delete on table public.my_path_events from anon, authenticated;

revoke all on function private.set_my_path_updated_at() from public;
revoke all on function private.enforce_my_path_saved_limit() from public;
revoke all on function private.sync_my_path_journey(jsonb, jsonb, jsonb) from public;
revoke all on function private.record_anonymous_my_path_event(text, text, text, jsonb) from public;
revoke all on function public.sync_my_path_journey(jsonb, jsonb, jsonb) from public;
revoke all on function public.record_anonymous_my_path_event(text, text, text, jsonb) from public;
revoke all on function public.get_my_path_journey() from public;

grant usage on schema private to anon, authenticated;
grant execute on function private.sync_my_path_journey(jsonb, jsonb, jsonb)
  to authenticated;
grant execute on function public.sync_my_path_journey(jsonb, jsonb, jsonb)
  to authenticated;
grant execute on function private.record_anonymous_my_path_event(text, text, text, jsonb)
  to anon, authenticated;
grant execute on function public.record_anonymous_my_path_event(text, text, text, jsonb)
  to anon, authenticated;
grant execute on function public.get_my_path_journey() to authenticated;

comment on table public.my_paths is
  'One mutable My Path direction hypothesis per user.';
comment on table public.my_path_possibilities is
  'Radar career references and student exploration state; no copied career content.';
comment on table public.my_path_events is
  'Immutable behavioral, evidence, history, and funnel events for My Path.';
