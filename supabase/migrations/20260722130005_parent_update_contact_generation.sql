-- Replace a parent contact and retire the previous recipient generation in one
-- subscription-first transaction. Old queued content can then never be sent
-- to a newly verified address under an old provider idempotency key.
create or replace function public.replace_parent_pathlab_subscription_contact(
  p_id uuid,
  p_trial_access_id uuid,
  p_normalized_email text,
  p_consented_at timestamptz,
  p_attested_at timestamptz,
  p_verification_token_hash text,
  p_verification_version integer,
  p_verification_expires_at timestamptz,
  p_verification_requested_at timestamptz,
  p_verified_at timestamptz,
  p_unsubscribe_token_hash text,
  p_unsubscribe_version integer,
  p_unsubscribed_at timestamptz,
  p_revoked_at timestamptz
)
returns setof public.parent_pathlab_subscriptions
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_existing public.parent_pathlab_subscriptions%rowtype;
  v_generation_changed boolean;
begin
  if p_id is null
    or p_verification_version is null
    or p_unsubscribe_version is null then
    return;
  end if;

  -- Serialize first-time creation as well as replacement for this trial, so
  -- two concurrent contact submissions cannot race the unique trial key.
  perform 1
  from public.trial_accesses t
  where t.id = p_trial_access_id
  for update;
  if not found then
    return;
  end if;

  select s.*
  into v_existing
  from public.parent_pathlab_subscriptions s
  where s.trial_access_id = p_trial_access_id
  for update;

  if not found then
    return query
    insert into public.parent_pathlab_subscriptions (
      id,
      trial_access_id,
      normalized_email,
      consented_at,
      attested_at,
      verification_token_hash,
      verification_version,
      verification_expires_at,
      verification_requested_at,
      verified_at,
      unsubscribe_token_hash,
      unsubscribe_version,
      unsubscribed_at,
      revoked_at
    ) values (
      p_id,
      p_trial_access_id,
      p_normalized_email,
      p_consented_at,
      p_attested_at,
      p_verification_token_hash,
      p_verification_version,
      p_verification_expires_at,
      p_verification_requested_at,
      p_verified_at,
      p_unsubscribe_token_hash,
      p_unsubscribe_version,
      p_unsubscribed_at,
      p_revoked_at
    )
    returning *;
    return;
  end if;

  -- An exact replay of the same contact material is safe and makes concurrent
  -- duplicate form submissions idempotent. It never rewrites stored state.
  if p_id = v_existing.id
    and p_normalized_email is not distinct from v_existing.normalized_email
    and p_verification_version = v_existing.verification_version
    and p_verification_token_hash is not distinct from v_existing.verification_token_hash
    and p_unsubscribe_version = v_existing.unsubscribe_version
    and p_unsubscribe_token_hash is not distinct from v_existing.unsubscribe_token_hash
    and p_verified_at is not distinct from v_existing.verified_at
    and p_unsubscribed_at is not distinct from v_existing.unsubscribed_at
    and p_revoked_at is not distinct from v_existing.revoked_at then
    return query
    select s.*
    from public.parent_pathlab_subscriptions s
    where s.id = v_existing.id;
    return;
  end if;

  -- Caller token material is derived from the immutable subscription id.
  -- Reject a concurrent creator that observed "no row" under a different id,
  -- and reject every stale/equal generation attempt that could revive tokens.
  if p_id <> v_existing.id
    or p_verification_version <= v_existing.verification_version
    or p_unsubscribe_version < v_existing.unsubscribe_version
    or (
      p_unsubscribe_version = v_existing.unsubscribe_version
      and p_unsubscribe_token_hash is distinct from v_existing.unsubscribe_token_hash
    )
    or (
      v_existing.normalized_email is distinct from p_normalized_email
      and p_unsubscribe_version <= v_existing.unsubscribe_version
    )
    or (
      (v_existing.unsubscribed_at is not null or v_existing.revoked_at is not null)
      and p_unsubscribe_version <= v_existing.unsubscribe_version
    ) then
    return;
  end if;

  v_generation_changed :=
    p_unsubscribe_version > v_existing.unsubscribe_version;

  if v_generation_changed then
    update public.parent_pathlab_update_outbox o
    set status = 'failed',
        lease_token = null,
        leased_until = null,
        last_error_code = 'contact_replaced'
    where o.subscription_id = v_existing.id
      and o.status in ('pending', 'leased');
  end if;

  return query
  update public.parent_pathlab_subscriptions s
  set normalized_email = p_normalized_email,
      consented_at = p_consented_at,
      attested_at = p_attested_at,
      verification_token_hash = p_verification_token_hash,
      verification_version = p_verification_version,
      verification_expires_at = p_verification_expires_at,
      verification_requested_at = p_verification_requested_at,
      verified_at = p_verified_at,
      unsubscribe_token_hash = p_unsubscribe_token_hash,
      unsubscribe_version = p_unsubscribe_version,
      unsubscribed_at = p_unsubscribed_at,
      revoked_at = p_revoked_at,
      delivery_lease_token = case
        when v_generation_changed then null else s.delivery_lease_token end,
      delivery_leased_until = case
        when v_generation_changed then null else s.delivery_leased_until end,
      last_progress_delivered_at = case
        when v_generation_changed then null else s.last_progress_delivered_at end,
      last_transactional_delivered_at = case
        when v_generation_changed then null else s.last_transactional_delivered_at end
  where s.id = v_existing.id
  returning s.*;
end;
$$;

revoke all on function public.replace_parent_pathlab_subscription_contact(
  uuid, uuid, text, timestamptz, timestamptz, text, integer, timestamptz,
  timestamptz, timestamptz, text, integer, timestamptz, timestamptz
) from public, anon, authenticated;
grant execute on function public.replace_parent_pathlab_subscription_contact(
  uuid, uuid, text, timestamptz, timestamptz, text, integer, timestamptz,
  timestamptz, timestamptz, text, integer, timestamptz, timestamptz
) to service_role;

-- Queue identity belongs to one locked recipient generation. Replacement and
-- queueing serialize on the same subscription row: either the old event lands
-- first and replacement retires it, or replacement lands first and the
-- unverified new contact rejects old-generation queueing.
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
declare
  v_generation integer;
begin
  select s.unsubscribe_version
  into v_generation
  from public.parent_pathlab_subscriptions s
  where s.id = p_subscription_id
    and s.verified_at is not null
    and s.unsubscribed_at is null
    and s.revoked_at is null
  for update;
  if not found then
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
    p_subscription_id || ':g' || v_generation || ':' || p_event_kind || ':' ||
      p_source_table || ':' || p_source_id || ':' || p_source_state,
    p_safe_payload
  )
  on conflict (idempotency_key) do nothing;
end;
$$;

revoke all on function private.queue_parent_pathlab_update(
  uuid, text, text, uuid, text, jsonb
) from public, anon, authenticated;
