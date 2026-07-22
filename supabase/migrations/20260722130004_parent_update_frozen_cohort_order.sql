-- Preserve each subscription's delivery story across retries. Any unfinished
-- frozen cohort blocks fresh work, even while that retry is future-scheduled;
-- once due, frozen work still wins before fresh work.
create or replace function public.claim_parent_pathlab_update_cohort(
  p_now timestamptz,
  p_limit integer,
  p_lease_token uuid,
  p_leased_until timestamptz
)
returns table (
  id uuid,
  subscription_id uuid,
  event_kind text,
  safe_payload jsonb,
  attempt_count integer,
  delivery_group_key text,
  normalized_email text,
  last_progress_delivered_at timestamptz,
  unsubscribe_version integer
)
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_subscription_id uuid;
  v_delivery_group_key text;
  v_ids uuid[];
begin
  if p_now is null
    or p_limit is null
    or p_limit < 1
    or p_limit > 5
    or p_lease_token is null
    or p_leased_until is null
    or p_leased_until <= p_now then
    return;
  end if;

  -- Lock exactly one eligible subscription. Frozen work is eligible only when
  -- due. Fresh work is eligible only after every frozen cohort has finished.
  select o.subscription_id
  into v_subscription_id
  from public.parent_pathlab_update_outbox o
  join public.parent_pathlab_subscriptions s on s.id = o.subscription_id
  where o.scheduled_at <= p_now
    and (
      o.status = 'pending'
      or (o.status = 'leased' and o.leased_until < p_now)
    )
    and s.verified_at is not null
    and s.unsubscribed_at is null
    and s.revoked_at is null
    and (
      s.delivery_leased_until is null
      or s.delivery_leased_until < p_now
    )
    and (
      o.delivery_group_key is not null
      or not exists (
        select 1
        from public.parent_pathlab_update_outbox unfinished_frozen
        where unfinished_frozen.subscription_id = o.subscription_id
          and unfinished_frozen.delivery_group_key is not null
          and unfinished_frozen.status in ('pending', 'leased')
      )
    )
    and (
      o.delivery_group_key is null
      or (
        select count(*)
        from public.parent_pathlab_update_outbox cohort_count
        where cohort_count.subscription_id = o.subscription_id
          and cohort_count.delivery_group_key = o.delivery_group_key
          and cohort_count.status in ('pending', 'leased')
      ) <= p_limit
    )
  order by (o.delivery_group_key is null) asc,
           o.scheduled_at asc,
           o.created_at asc,
           o.id asc
  for update of s skip locked
  limit 1;

  if v_subscription_id is null then
    return;
  end if;

  select o.delivery_group_key
  into v_delivery_group_key
  from public.parent_pathlab_update_outbox o
  where o.subscription_id = v_subscription_id
    and o.scheduled_at <= p_now
    and (
      o.status = 'pending'
      or (o.status = 'leased' and o.leased_until < p_now)
    )
  order by (o.delivery_group_key is null) asc,
           o.scheduled_at asc,
           o.created_at asc,
           o.id asc
  limit 1;

  if v_delivery_group_key is not null then
    -- Lock every unfinished member, not a page of members. If any member is
    -- not claimable yet, the whole frozen retry remains untouched.
    select array_agg(cohort.id order by cohort.created_at, cohort.id)
    into v_ids
    from (
      select o.id, o.created_at
      from public.parent_pathlab_update_outbox o
      where o.subscription_id = v_subscription_id
        and o.delivery_group_key = v_delivery_group_key
        and o.status in ('pending', 'leased')
      for update
    ) cohort;

    if cardinality(v_ids) > p_limit
      or exists (
        select 1
        from public.parent_pathlab_update_outbox o
        where o.id = any(v_ids)
          and (
            o.scheduled_at > p_now
            or (o.status = 'leased' and o.leased_until >= p_now)
          )
      ) then
      return;
    end if;
  else
    select array_agg(fresh.id order by fresh.created_at, fresh.id)
    into v_ids
    from (
      select o.id, o.created_at
      from public.parent_pathlab_update_outbox o
      where o.subscription_id = v_subscription_id
        and o.delivery_group_key is null
        and o.scheduled_at <= p_now
        and (
          o.status = 'pending'
          or (o.status = 'leased' and o.leased_until < p_now)
        )
      order by o.scheduled_at asc, o.created_at asc, o.id asc
      for update
      limit p_limit
    ) fresh;
  end if;

  if coalesce(cardinality(v_ids), 0) = 0 then
    return;
  end if;

  update public.parent_pathlab_subscriptions s
  set delivery_lease_token = p_lease_token,
      delivery_leased_until = p_leased_until
  where s.id = v_subscription_id;

  update public.parent_pathlab_update_outbox o
  set status = 'leased',
      lease_token = p_lease_token,
      leased_until = p_leased_until
  where o.id = any(v_ids)
    and o.subscription_id = v_subscription_id;

  return query
  select o.id,
         o.subscription_id,
         o.event_kind,
         o.safe_payload,
         o.attempt_count,
         o.delivery_group_key,
         s.normalized_email,
         s.last_progress_delivered_at,
         s.unsubscribe_version
  from public.parent_pathlab_update_outbox o
  join public.parent_pathlab_subscriptions s on s.id = o.subscription_id
  where o.id = any(v_ids)
    and o.subscription_id = v_subscription_id
    and o.status = 'leased'
    and o.lease_token = p_lease_token
  order by o.created_at asc, o.id asc;
end;
$$;

revoke all on function public.claim_parent_pathlab_update_cohort(
  timestamptz, integer, uuid, timestamptz
) from public, anon, authenticated;
grant execute on function public.claim_parent_pathlab_update_cohort(
  timestamptz, integer, uuid, timestamptz
) to service_role;
