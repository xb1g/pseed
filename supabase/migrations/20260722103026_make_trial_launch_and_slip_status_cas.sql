-- Launch/resume a PathLab trial as one transaction. The trial row is the
-- serialization point, so a concurrent expiry/payment decision cannot be
-- separated from the enrollment decision made for that same launch.
create or replace function private.start_pathlab_trial(
  p_user_id uuid,
  p_seed_id uuid
)
returns table (
  trial_id uuid,
  pay_token text,
  trial_status text,
  payment_deadline timestamptz,
  paid_at timestamptz,
  enrollment_id uuid,
  current_day integer,
  enrollment_status text
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := p_user_id;
  v_path_id uuid;
  v_trial public.trial_accesses%rowtype;
  v_enrollment public.path_enrollments%rowtype;
begin
  if v_user_id is null
    or v_user_id is distinct from auth.uid()
    or p_seed_id is null then
    return;
  end if;

  select p.id
  into v_path_id
  from public.paths p
  join public.seeds s on s.id = p.seed_id
  where s.id = p_seed_id
    and s.seed_type = 'pathlab'
  limit 1;

  if v_path_id is null then
    return;
  end if;

  insert into public.trial_accesses (user_id, seed_id)
  values (v_user_id, p_seed_id)
  on conflict (user_id, seed_id) do nothing;

  select t.*
  into v_trial
  from public.trial_accesses t
  where t.user_id = v_user_id
    and t.seed_id = p_seed_id
  for update;

  if v_trial.id is null then
    return;
  end if;

  -- Persist lazy active expiry while holding the same row lock used for the
  -- enrollment decision. The status predicate is intentionally repeated as
  -- a compare-and-swap guard.
  if v_trial.status = 'active'
    and v_trial.paid_at is null
    and v_trial.payment_deadline < statement_timestamp() then
    update public.trial_accesses t
    set status = 'expired',
        updated_at = statement_timestamp()
    where t.id = v_trial.id
      and t.status = 'active'
      and t.paid_at is null
      and t.payment_deadline < statement_timestamp()
    returning t.* into v_trial;
  end if;

  -- Recovery is payment-only. Never create or reactivate enrollment access
  -- for an expired trial.
  if v_trial.status = 'expired' then
    return query
    select v_trial.id,
           v_trial.pay_token,
           v_trial.status,
           v_trial.payment_deadline,
           v_trial.paid_at,
           null::uuid,
           null::integer,
           null::text;
    return;
  end if;

  insert into public.path_enrollments (user_id, path_id, current_day, status)
  values (v_user_id, v_path_id, 1, 'active')
  on conflict (user_id, path_id) do nothing;

  select e.*
  into v_enrollment
  from public.path_enrollments e
  where e.user_id = v_user_id
    and e.path_id = v_path_id
  for update;

  if v_enrollment.id is null then
    return;
  end if;

  if v_enrollment.status in ('paused', 'quit') then
    update public.path_enrollments e
    set status = 'active',
        completed_at = null
    where e.id = v_enrollment.id
      and e.status in ('paused', 'quit')
    returning e.* into v_enrollment;
  end if;

  return query
  select v_trial.id,
         v_trial.pay_token,
         v_trial.status,
         v_trial.payment_deadline,
         v_trial.paid_at,
         v_enrollment.id,
         v_enrollment.current_day,
         v_enrollment.status;
end;
$$;

create or replace function public.start_pathlab_trial(p_seed_id uuid)
returns table (
  trial_id uuid,
  pay_token text,
  trial_status text,
  payment_deadline timestamptz,
  paid_at timestamptz,
  enrollment_id uuid,
  current_day integer,
  enrollment_status text
)
language sql
security invoker
set search_path = ''
as $$
  select *
  from private.start_pathlab_trial(auth.uid(), p_seed_id);
$$;

revoke all on function private.start_pathlab_trial(uuid, uuid)
  from public, anon, authenticated;
grant usage on schema private to authenticated;
grant execute on function private.start_pathlab_trial(uuid, uuid)
  to authenticated;
revoke all on function public.start_pathlab_trial(uuid)
  from public, anon, authenticated;
grant execute on function public.start_pathlab_trial(uuid) to authenticated;

-- Move a slip into review with one UPDATE predicate. Under Read Committed,
-- PostgreSQL re-evaluates this predicate after waiting for a concurrent row
-- writer, so a paid verification wins and this function returns null.
create or replace function public.submit_trial_payment_slip(
  p_trial_id uuid,
  p_slip_path text
)
returns text
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_status text;
begin
  if p_trial_id is null or nullif(btrim(p_slip_path), '') is null then
    return null;
  end if;

  update public.trial_accesses t
  set status = 'pending',
      slip_path = p_slip_path,
      updated_at = statement_timestamp()
  where t.id = p_trial_id
    and t.status in ('active', 'pending', 'expired')
    and t.paid_at is null
  returning t.status into v_status;

  return v_status;
end;
$$;

revoke all on function public.submit_trial_payment_slip(uuid, text)
  from public, anon, authenticated;
grant execute on function public.submit_trial_payment_slip(uuid, text)
  to service_role;
