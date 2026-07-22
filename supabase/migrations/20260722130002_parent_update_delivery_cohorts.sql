-- Freeze the exact outbox cohort before a provider call. Retries then reuse
-- both the same content ordering and the same provider idempotency key even if
-- newer events become due for the subscription.

alter table public.parent_pathlab_update_outbox
  add column if not exists delivery_group_key text
  check (
    delivery_group_key is null
    or delivery_group_key ~ '^parent-update/[0-9a-f]{64}$'
  );

create or replace function public.freeze_parent_pathlab_delivery_group(
  p_subscription_id uuid,
  p_lease_token uuid,
  p_ids uuid[],
  p_delivery_group_key text
)
returns boolean
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_locked_count integer;
begin
  if cardinality(p_ids) = 0
    or p_delivery_group_key !~ '^parent-update/[0-9a-f]{64}$' then
    return false;
  end if;

  perform 1
  from public.parent_pathlab_subscriptions s
  where s.id = p_subscription_id
    and s.delivery_lease_token = p_lease_token
    and s.delivery_leased_until > now()
    and s.verified_at is not null
    and s.unsubscribed_at is null
    and s.revoked_at is null
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
      and (
        o.delivery_group_key is null
        or o.delivery_group_key = p_delivery_group_key
      )
    for update
  ) locked_rows;
  if v_locked_count <> cardinality(p_ids) then
    return false;
  end if;

  update public.parent_pathlab_update_outbox
  set delivery_group_key = coalesce(delivery_group_key, p_delivery_group_key)
  where id = any(p_ids)
    and subscription_id = p_subscription_id
    and lease_token = p_lease_token;
  return true;
end;
$$;

revoke all on function public.freeze_parent_pathlab_delivery_group(
  uuid, uuid, uuid[], text
) from public, anon, authenticated;
grant execute on function public.freeze_parent_pathlab_delivery_group(
  uuid, uuid, uuid[], text
) to service_role;
