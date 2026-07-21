-- Token-consuming mutations must compare the token state observed by the
-- server with the row state locked by Postgres. Only service-role routes may
-- call these helpers.

create or replace function public.verify_parent_pathlab_subscription_token(
  p_subscription_id uuid,
  p_expected_hash text,
  p_expected_version integer,
  p_at timestamptz
)
returns text
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_subscription public.parent_pathlab_subscriptions%rowtype;
begin
  select s.* into v_subscription
  from public.parent_pathlab_subscriptions s
  where s.id = p_subscription_id
  for update;

  if not found
    or v_subscription.verification_token_hash <> p_expected_hash
    or v_subscription.verification_version <> p_expected_version then
    return 'miss';
  end if;
  if v_subscription.verified_at is not null then
    return 'already_applied';
  end if;
  if not (v_subscription.verification_expires_at > p_at) then
    return 'expired';
  end if;
  if v_subscription.unsubscribed_at is not null
    or v_subscription.revoked_at is not null then
    return 'miss';
  end if;

  update public.parent_pathlab_subscriptions
  set verified_at = p_at
  where id = p_subscription_id
    and verification_token_hash = p_expected_hash
    and verification_version = p_expected_version
    and verified_at is null
    and verification_expires_at > p_at
    and unsubscribed_at is null
    and revoked_at is null;
  if not found then
    return 'miss';
  end if;
  return 'applied';
end;
$$;

revoke all on function public.verify_parent_pathlab_subscription_token(
  uuid, text, integer, timestamptz
) from public, anon, authenticated;
grant execute on function public.verify_parent_pathlab_subscription_token(
  uuid, text, integer, timestamptz
) to service_role;

create or replace function public.unsubscribe_parent_pathlab_subscription_token(
  p_subscription_id uuid,
  p_expected_hash text,
  p_expected_version integer,
  p_at timestamptz
)
returns text
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_subscription public.parent_pathlab_subscriptions%rowtype;
begin
  select s.* into v_subscription
  from public.parent_pathlab_subscriptions s
  where s.id = p_subscription_id
  for update;

  if not found
    or v_subscription.unsubscribe_token_hash <> p_expected_hash
    or v_subscription.unsubscribe_version <> p_expected_version then
    return 'miss';
  end if;
  if v_subscription.unsubscribed_at is not null then
    return 'already_applied';
  end if;

  update public.parent_pathlab_subscriptions
  set unsubscribed_at = p_at,
      delivery_lease_token = null,
      delivery_leased_until = null
  where id = p_subscription_id
    and unsubscribe_token_hash = p_expected_hash
    and unsubscribe_version = p_expected_version
    and unsubscribed_at is null;
  if not found then
    return 'miss';
  end if;

  update public.parent_pathlab_update_outbox
  set status = 'failed',
      lease_token = null,
      leased_until = null,
      last_error_code = 'subscription_unsubscribed'
  where subscription_id = p_subscription_id
    and status in ('pending', 'leased');

  return 'applied';
end;
$$;

revoke all on function public.unsubscribe_parent_pathlab_subscription_token(
  uuid, text, integer, timestamptz
) from public, anon, authenticated;
grant execute on function public.unsubscribe_parent_pathlab_subscription_token(
  uuid, text, integer, timestamptz
) to service_role;
