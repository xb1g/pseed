-- Verified parent/guardian PathLab updates. All public writes go through
-- validated server routes; browser roles receive no table privileges.
create schema if not exists private;

alter table public.paths
  add column if not exists parent_outcomes text[] not null default array[
    'ผลงานจริงที่ใช้เป็นหลักฐานได้',
    'สัญญาณความเหมาะกับสายอาชีพที่ชัดขึ้น',
    'สรุปความคืบหน้าสำหรับครอบครัว'
  ]::text[];

create table if not exists public.parent_pathlab_subscriptions (
  id uuid primary key default gen_random_uuid(),
  trial_access_id uuid not null unique
    references public.trial_accesses(id) on delete cascade,
  normalized_email text not null
    check (
      normalized_email = lower(btrim(normalized_email))
      and char_length(normalized_email) between 3 and 254
    ),
  consented_at timestamptz not null,
  attested_at timestamptz not null,
  verification_token_hash text not null
    check (verification_token_hash ~ '^[0-9a-f]{64}$'),
  verification_version integer not null default 1 check (verification_version > 0),
  verification_expires_at timestamptz not null,
  verification_requested_at timestamptz,
  verified_at timestamptz,
  unsubscribe_token_hash text not null
    check (unsubscribe_token_hash ~ '^[0-9a-f]{64}$'),
  unsubscribe_version integer not null default 1 check (unsubscribe_version > 0),
  unsubscribed_at timestamptz,
  revoked_at timestamptz,
  last_progress_delivered_at timestamptz,
  last_transactional_delivered_at timestamptz,
  delivery_lease_token uuid,
  delivery_leased_until timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.parent_pathlab_subscriptions
  add column if not exists delivery_lease_token uuid,
  add column if not exists delivery_leased_until timestamptz;

create unique index if not exists parent_pathlab_subscriptions_verification_hash_idx
  on public.parent_pathlab_subscriptions (verification_token_hash);
create unique index if not exists parent_pathlab_subscriptions_unsubscribe_hash_idx
  on public.parent_pathlab_subscriptions (unsubscribe_token_hash);

create table if not exists public.parent_pathlab_update_outbox (
  id uuid primary key default gen_random_uuid(),
  subscription_id uuid not null
    references public.parent_pathlab_subscriptions(id) on delete cascade,
  event_kind text not null check (event_kind in (
    'pathlab_started',
    'milestone_completed',
    'pathlab_completed',
    'payment_status_changed'
  )),
  source_table text not null check (source_table in (
    'path_enrollments', 'path_activity_progress', 'trial_accesses'
  )),
  source_id uuid not null,
  source_state text not null check (char_length(source_state) between 1 and 80),
  idempotency_key text not null unique
    check (char_length(idempotency_key) between 20 and 500),
  safe_payload jsonb not null default '{}'::jsonb
    check (
      jsonb_typeof(safe_payload) = 'object'
      and pg_column_size(safe_payload) <= 4096
      and not (safe_payload ?| array[
        'reflection', 'reflectionText', 'answer', 'answerText',
        'chat', 'message', 'note', 'notes', 'score', 'studentName', 'userEmail'
      ])
    ),
  status text not null default 'pending'
    check (status in ('pending', 'leased', 'delivered', 'failed')),
  attempt_count integer not null default 0 check (attempt_count between 0 and 20),
  scheduled_at timestamptz not null default now(),
  leased_until timestamptz,
  lease_token uuid,
  delivered_at timestamptz,
  last_error_code text check (
    last_error_code is null or char_length(last_error_code) between 1 and 80
  ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists parent_pathlab_update_outbox_due_idx
  on public.parent_pathlab_update_outbox (scheduled_at, created_at)
  where status in ('pending', 'leased');
create index if not exists parent_pathlab_update_outbox_subscription_idx
  on public.parent_pathlab_update_outbox (subscription_id, created_at);

alter table public.parent_pathlab_subscriptions enable row level security;
alter table public.parent_pathlab_update_outbox enable row level security;

revoke all on table public.parent_pathlab_subscriptions from anon, authenticated;
revoke all on table public.parent_pathlab_update_outbox from anon, authenticated;

-- All delivery mutations are one transaction and compare both the
-- subscription-level lease and every row-level lease. A stale worker therefore
-- cannot finalize, reschedule, or fail work reclaimed by another worker.
create or replace function public.mutate_parent_pathlab_update_lease(
  p_subscription_id uuid,
  p_lease_token uuid,
  p_ids uuid[],
  p_action text,
  p_at timestamptz,
  p_error_code text,
  p_scheduled_at timestamptz,
  p_increment_attempt boolean,
  p_is_progress boolean
)
returns boolean
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_locked_count integer;
begin
  if p_action not in ('delivered', 'rescheduled', 'failed')
    or cardinality(p_ids) = 0 then
    return false;
  end if;

  perform 1
  from public.parent_pathlab_subscriptions s
  where s.id = p_subscription_id
    and s.delivery_lease_token = p_lease_token
    and s.delivery_leased_until > now()
  for update;
  if not found then
    return false;
  end if;

  select count(*) into v_locked_count
  from (
    select o.id
    from public.parent_pathlab_update_outbox o
    where o.id = any(p_ids)
      and o.subscription_id = p_subscription_id
      and o.status = 'leased'
      and o.lease_token = p_lease_token
      and o.leased_until > now()
    for update
  ) locked_rows;
  if v_locked_count <> cardinality(p_ids) then
    return false;
  end if;

  if p_action = 'delivered' then
    update public.parent_pathlab_update_outbox
    set status = 'delivered',
        delivered_at = p_at,
        leased_until = null,
        lease_token = null,
        last_error_code = null
    where id = any(p_ids)
      and subscription_id = p_subscription_id
      and lease_token = p_lease_token;

    update public.parent_pathlab_subscriptions
    set last_progress_delivered_at = case
          when p_is_progress then p_at else last_progress_delivered_at end,
        last_transactional_delivered_at = case
          when p_is_progress then last_transactional_delivered_at else p_at end
    where id = p_subscription_id
      and delivery_lease_token = p_lease_token;
  elsif p_action = 'rescheduled' then
    update public.parent_pathlab_update_outbox
    set status = 'pending',
        attempt_count = attempt_count + case when p_increment_attempt then 1 else 0 end,
        scheduled_at = p_scheduled_at,
        leased_until = null,
        lease_token = null,
        last_error_code = p_error_code
    where id = any(p_ids)
      and subscription_id = p_subscription_id
      and lease_token = p_lease_token;
  else
    update public.parent_pathlab_update_outbox
    set status = 'failed',
        leased_until = null,
        lease_token = null,
        last_error_code = p_error_code
    where id = any(p_ids)
      and subscription_id = p_subscription_id
      and lease_token = p_lease_token;
  end if;

  return true;
end;
$$;

revoke all on function public.mutate_parent_pathlab_update_lease(
  uuid, uuid, uuid[], text, timestamptz, text, timestamptz, boolean, boolean
) from public, anon, authenticated;
grant execute on function public.mutate_parent_pathlab_update_lease(
  uuid, uuid, uuid[], text, timestamptz, text, timestamptz, boolean, boolean
) to service_role;

create or replace function private.touch_parent_pathlab_updated_at()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists parent_pathlab_subscriptions_updated_at
  on public.parent_pathlab_subscriptions;
create trigger parent_pathlab_subscriptions_updated_at
  before update on public.parent_pathlab_subscriptions
  for each row execute function private.touch_parent_pathlab_updated_at();

drop trigger if exists parent_pathlab_update_outbox_updated_at
  on public.parent_pathlab_update_outbox;
create trigger parent_pathlab_update_outbox_updated_at
  before update on public.parent_pathlab_update_outbox
  for each row execute function private.touch_parent_pathlab_updated_at();

create or replace function private.queue_parent_pathlab_update(
  p_subscription_id uuid,
  p_event_kind text,
  p_source_table text,
  p_source_id uuid,
  p_source_state text,
  p_safe_payload jsonb
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not exists (
    select 1
    from public.parent_pathlab_subscriptions s
    where s.id = p_subscription_id
      and s.verified_at is not null
      and s.unsubscribed_at is null
      and s.revoked_at is null
  ) then
    return;
  end if;

  insert into public.parent_pathlab_update_outbox (
    subscription_id,
    event_kind,
    source_table,
    source_id,
    source_state,
    idempotency_key,
    safe_payload
  ) values (
    p_subscription_id,
    p_event_kind,
    p_source_table,
    p_source_id,
    p_source_state,
    p_subscription_id || ':' || p_event_kind || ':' || p_source_table || ':' ||
      p_source_id || ':' || p_source_state,
    p_safe_payload
  )
  on conflict (idempotency_key) do nothing;
end;
$$;

create or replace function private.emit_parent_pathlab_started()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_subscription_id uuid;
  v_seed_title text;
begin
  select s.id, seed.title
  into v_subscription_id, v_seed_title
  from public.parent_pathlab_subscriptions s
  join public.trial_accesses t on t.id = s.trial_access_id
  join public.paths p on p.seed_id = t.seed_id
  join public.seeds seed on seed.id = t.seed_id
  where p.id = new.path_id
    and t.user_id = new.user_id
    and s.verified_at is not null
    and s.unsubscribed_at is null
    and s.revoked_at is null
  limit 1;

  if v_subscription_id is not null then
    perform private.queue_parent_pathlab_update(
      v_subscription_id,
      'pathlab_started',
      'path_enrollments',
      new.id,
      'started',
      jsonb_build_object(
        'seedTitle', v_seed_title,
        'enrollmentId', new.id,
        'currentDay', new.current_day
      )
    );
  end if;
  return new;
end;
$$;

drop trigger if exists parent_pathlab_started_outbox
  on public.path_enrollments;
create trigger parent_pathlab_started_outbox
  after insert on public.path_enrollments
  for each row execute function private.emit_parent_pathlab_started();

-- Parent consent necessarily happens after the student's launch in the normal
-- flow. Backfill the same idempotent started event on first verification so the
-- insert-trigger event is not lost merely because no subscription existed yet.
create or replace function private.emit_parent_verified_current_state()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_enrollment_id uuid;
  v_seed_title text;
  v_current_day integer;
begin
  if new.verified_at is not null
    and old.verified_at is null
    and new.unsubscribed_at is null
    and new.revoked_at is null then
    select pe.id, seed.title, pe.current_day
    into v_enrollment_id, v_seed_title, v_current_day
    from public.trial_accesses t
    join public.paths p on p.seed_id = t.seed_id
    join public.path_enrollments pe
      on pe.path_id = p.id and pe.user_id = t.user_id
    join public.seeds seed on seed.id = t.seed_id
    where t.id = new.trial_access_id
    order by pe.enrolled_at desc, pe.id
    limit 1;

    if v_enrollment_id is not null then
      perform private.queue_parent_pathlab_update(
        new.id,
        'pathlab_started',
        'path_enrollments',
        v_enrollment_id,
        'started',
        jsonb_build_object(
          'seedTitle', v_seed_title,
          'enrollmentId', v_enrollment_id,
          'currentDay', v_current_day
        )
      );
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists parent_verified_started_outbox
  on public.parent_pathlab_subscriptions;
create trigger parent_verified_started_outbox
  after update of verified_at on public.parent_pathlab_subscriptions
  for each row execute function private.emit_parent_verified_current_state();

create or replace function private.emit_parent_milestone_completed()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_subscription_id uuid;
  v_seed_title text;
  v_current_day integer;
begin
  if new.status = 'completed'
    and old.status is distinct from 'completed' then
    select s.id, seed.title, pe.current_day
    into v_subscription_id, v_seed_title, v_current_day
    from public.path_enrollments pe
    join public.paths p on p.id = pe.path_id
    join public.trial_accesses t
      on t.seed_id = p.seed_id and t.user_id = pe.user_id
    join public.parent_pathlab_subscriptions s on s.trial_access_id = t.id
    join public.seeds seed on seed.id = t.seed_id
    where pe.id = new.enrollment_id
      and s.verified_at is not null
      and s.unsubscribed_at is null
      and s.revoked_at is null
    limit 1;

    if v_subscription_id is not null then
      perform private.queue_parent_pathlab_update(
        v_subscription_id,
        'milestone_completed',
        'path_activity_progress',
        new.id,
        'completed',
        jsonb_build_object(
          'seedTitle', v_seed_title,
          'enrollmentId', new.enrollment_id,
          'currentDay', v_current_day,
          'activityId', new.activity_id
        )
      );
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists parent_milestone_completed_outbox
  on public.path_activity_progress;
create trigger parent_milestone_completed_outbox
  after update of status on public.path_activity_progress
  for each row execute function private.emit_parent_milestone_completed();

create or replace function private.emit_parent_pathlab_completed()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_subscription_id uuid;
  v_seed_title text;
begin
  if new.status = 'explored'
    and old.status is distinct from 'explored' then
    select s.id, seed.title
    into v_subscription_id, v_seed_title
    from public.paths p
    join public.trial_accesses t
      on t.seed_id = p.seed_id and t.user_id = new.user_id
    join public.parent_pathlab_subscriptions s on s.trial_access_id = t.id
    join public.seeds seed on seed.id = t.seed_id
    where p.id = new.path_id
      and s.verified_at is not null
      and s.unsubscribed_at is null
      and s.revoked_at is null
    limit 1;

    if v_subscription_id is not null then
      perform private.queue_parent_pathlab_update(
        v_subscription_id,
        'pathlab_completed',
        'path_enrollments',
        new.id,
        'explored',
        jsonb_build_object(
          'seedTitle', v_seed_title,
          'enrollmentId', new.id,
          'currentDay', new.current_day
        )
      );
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists parent_pathlab_completed_outbox
  on public.path_enrollments;
create trigger parent_pathlab_completed_outbox
  after update of status on public.path_enrollments
  for each row execute function private.emit_parent_pathlab_completed();

create or replace function private.emit_parent_payment_status_changed()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_subscription_id uuid;
  v_seed_title text;
begin
  if old.status is distinct from new.status then
    select s.id, seed.title
    into v_subscription_id, v_seed_title
    from public.parent_pathlab_subscriptions s
    join public.seeds seed on seed.id = new.seed_id
    where s.trial_access_id = new.id
      and s.verified_at is not null
      and s.unsubscribed_at is null
      and s.revoked_at is null
    limit 1;

    if v_subscription_id is not null then
      perform private.queue_parent_pathlab_update(
        v_subscription_id,
        'payment_status_changed',
        'trial_accesses',
        new.id,
        new.status,
        jsonb_build_object(
          'seedTitle', v_seed_title,
          'status', new.status,
          'paidAt', new.paid_at
        )
      );
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists parent_payment_status_changed_outbox
  on public.trial_accesses;
create trigger parent_payment_status_changed_outbox
  after update of status on public.trial_accesses
  for each row execute function private.emit_parent_payment_status_changed();

-- Public parent page projection. The bearer token exposes only public PathLab
-- copy and payment state; student identity and authored response bodies are
-- deliberately absent.
create or replace function private.get_trial_by_token(p_token text)
returns json
language sql
security definer
set search_path = ''
stable
as $$
  select case
    when p_token is null or p_token !~ '^[0-9a-f]{32}$' then null
    else (
      select json_build_object(
        'status', t.status,
        'priceAmount', t.price_amount,
        'paymentDeadline', t.payment_deadline,
        'seedTitle', s.title,
        'seedDescription', s.description,
        'totalDays', p.total_days,
        'radarDirectionTitle', radar.name_th,
        'outcomes', p.parent_outcomes
      )
      from public.trial_accesses t
      join public.seeds s on s.id = t.seed_id
      join public.paths p on p.seed_id = t.seed_id
      left join lateral (
        select rf.name_th
        from public.my_paths mp
        join public.my_path_possibilities possibility
          on possibility.my_path_id = mp.id
         and possibility.user_id = mp.user_id
        join public.radar_fields rf on rf.slug = possibility.radar_slug
        where mp.user_id = t.user_id
          and possibility.state = 'saved'
        order by possibility.last_interaction_at desc, possibility.id
        limit 1
      ) radar on true
      where t.pay_token = p_token
      limit 1
    )
  end;
$$;

create or replace function public.get_trial_by_token(p_token text)
returns json
language sql
security invoker
set search_path = ''
stable
as $$
  select private.get_trial_by_token(p_token);
$$;

revoke all on function private.get_trial_by_token(text) from public;
revoke all on function public.get_trial_by_token(text) from public;
grant execute on function private.get_trial_by_token(text) to anon, authenticated;
grant execute on function public.get_trial_by_token(text) to anon, authenticated;

revoke all on function private.touch_parent_pathlab_updated_at() from public;
revoke all on function private.queue_parent_pathlab_update(uuid, text, text, uuid, text, jsonb) from public;
revoke all on function private.emit_parent_pathlab_started() from public;
revoke all on function private.emit_parent_verified_current_state() from public;
revoke all on function private.emit_parent_milestone_completed() from public;
revoke all on function private.emit_parent_pathlab_completed() from public;
revoke all on function private.emit_parent_payment_status_changed() from public;

comment on table public.parent_pathlab_subscriptions is
  'One verified parent or guardian progress-update contact per PathLab trial.';
comment on table public.parent_pathlab_update_outbox is
  'Privacy-safe, idempotent PathLab parent update delivery queue.';
