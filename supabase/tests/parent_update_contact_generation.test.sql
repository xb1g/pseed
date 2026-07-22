\set ON_ERROR_STOP on

begin;

create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
select plan(25);

select has_function(
  'public',
  'replace_parent_pathlab_subscription_contact',
  array[
    'uuid', 'uuid', 'text', 'timestamptz', 'timestamptz', 'text', 'integer',
    'timestamptz', 'timestamptz', 'timestamptz', 'text', 'integer',
    'timestamptz', 'timestamptz'
  ],
  'atomic parent contact-generation replacement exists'
);

set local session_replication_role = replica;
insert into public.trial_accesses (
  id, user_id, seed_id, pay_token, status
) values (
  '81000000-0000-4000-8000-000000000001',
  '81000000-0000-4000-8000-000000000002',
  '81000000-0000-4000-8000-000000000003',
  repeat('8', 32),
  'active'
);
set local session_replication_role = origin;

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
  last_progress_delivered_at,
  last_transactional_delivered_at,
  delivery_lease_token,
  delivery_leased_until
) values (
  '82000000-0000-4000-8000-000000000001',
  '81000000-0000-4000-8000-000000000001',
  'parent-a@example.com',
  '2026-07-22T07:00:00Z',
  '2026-07-22T07:00:00Z',
  repeat('a', 64),
  1,
  '2026-07-23T07:00:00Z',
  '2026-07-22T07:00:00Z',
  '2026-07-22T07:01:00Z',
  repeat('b', 64),
  1,
  '2026-07-22T08:00:00Z',
  '2026-07-22T08:00:00Z',
  '83000000-0000-4000-8000-000000000001',
  '2026-07-22T11:00:00Z'
);

insert into public.parent_pathlab_update_outbox (
  id,
  subscription_id,
  event_kind,
  source_table,
  source_id,
  source_state,
  idempotency_key,
  safe_payload,
  status,
  scheduled_at,
  leased_until,
  lease_token,
  delivery_group_key
) values (
  '84000000-0000-4000-8000-000000000001',
  '82000000-0000-4000-8000-000000000001',
  'payment_status_changed',
  'trial_accesses',
  '81000000-0000-4000-8000-000000000001',
  'pending',
  '82000000-0000-4000-8000-000000000001:g1:payment_status_changed:trial_accesses:81000000-0000-4000-8000-000000000001:pending',
  '{"status":"pending"}',
  'leased',
  '2026-07-22T09:00:00Z',
  '2026-07-22T11:00:00Z',
  '83000000-0000-4000-8000-000000000001',
  'parent-update/' || repeat('c', 64)
);

create temp table replacement on commit drop as
select *
from public.replace_parent_pathlab_subscription_contact(
  '82000000-0000-4000-8000-000000000001',
  '81000000-0000-4000-8000-000000000001',
  'parent-b@example.com',
  '2026-07-22T10:00:00Z',
  '2026-07-22T10:00:00Z',
  repeat('d', 64),
  2,
  '2026-07-22T10:30:00Z',
  '2026-07-22T10:00:00Z',
  null,
  repeat('e', 64),
  2,
  null,
  null
);

select is(
  (select normalized_email from replacement),
  'parent-b@example.com',
  'replacement returns the new normalized recipient'
);
select is(
  (select verified_at from replacement),
  null::timestamptz,
  'the new contact must verify before receiving updates'
);
select is(
  (
    select status
    from public.parent_pathlab_update_outbox
    where id = '84000000-0000-4000-8000-000000000001'
  ),
  'failed',
  'the old frozen cohort is retired before the recipient changes'
);
select is(
  (
    select last_error_code
    from public.parent_pathlab_update_outbox
    where id = '84000000-0000-4000-8000-000000000001'
  ),
  'contact_replaced',
  'retired work records a non-sensitive contact-generation reason'
);
select ok(
  (
    select lease_token is null and leased_until is null
    from public.parent_pathlab_update_outbox
    where id = '84000000-0000-4000-8000-000000000001'
  ),
  'old row leases are cleared'
);
select ok(
  (
    select delivery_lease_token is null
      and delivery_leased_until is null
      and last_progress_delivered_at is null
      and last_transactional_delivered_at is null
    from public.parent_pathlab_subscriptions
    where id = '82000000-0000-4000-8000-000000000001'
  ),
  'recipient generation clears subscription leases and delivery windows'
);

create temp table wrong_id_replay on commit drop as
select * from public.replace_parent_pathlab_subscription_contact(
  '82000000-0000-4000-8000-000000000099',
  '81000000-0000-4000-8000-000000000001',
  'parent-c@example.com',
  '2026-07-22T10:00:30Z', '2026-07-22T10:00:30Z',
  repeat('1', 64), 3, '2026-07-22T10:30:30Z',
  '2026-07-22T10:00:30Z', null,
  repeat('2', 64), 3, null, null
);
select is(
  (select count(*) from wrong_id_replay),
  0::bigint,
  'a stale concurrent creator cannot attach id-B token hashes to stored id A'
);

create temp table equal_generation_replay on commit drop as
select * from public.replace_parent_pathlab_subscription_contact(
  '82000000-0000-4000-8000-000000000001',
  '81000000-0000-4000-8000-000000000001',
  'parent-c@example.com',
  '2026-07-22T10:00:31Z', '2026-07-22T10:00:31Z',
  repeat('3', 64), 3, '2026-07-22T10:30:31Z',
  '2026-07-22T10:00:31Z', null,
  repeat('e', 64), 2, null, null
);
select is(
  (select count(*) from equal_generation_replay),
  0::bigint,
  'an equal unsubscribe generation cannot switch recipients'
);

create temp table lower_generation_replay on commit drop as
select * from public.replace_parent_pathlab_subscription_contact(
  '82000000-0000-4000-8000-000000000001',
  '81000000-0000-4000-8000-000000000001',
  'parent-b@example.com',
  '2026-07-22T10:00:32Z', '2026-07-22T10:00:32Z',
  repeat('4', 64), 3, '2026-07-22T10:30:32Z',
  '2026-07-22T10:00:32Z', null,
  repeat('5', 64), 1, null, null
);
select is(
  (select count(*) from lower_generation_replay),
  0::bigint,
  'a lower unsubscribe generation cannot reactivate old tokens'
);

create temp table stale_verification_replay on commit drop as
select * from public.replace_parent_pathlab_subscription_contact(
  '82000000-0000-4000-8000-000000000001',
  '81000000-0000-4000-8000-000000000001',
  'parent-b@example.com',
  '2026-07-22T10:00:33Z', '2026-07-22T10:00:33Z',
  repeat('7', 64), 2, '2026-07-22T10:30:33Z',
  '2026-07-22T10:00:33Z', null,
  repeat('e', 64), 2, null, null
);
select is(
  (select count(*) from stale_verification_replay),
  0::bigint,
  'an equal verification version cannot replay stale write material'
);
select ok(
  (
    select id = '82000000-0000-4000-8000-000000000001'
      and normalized_email = 'parent-b@example.com'
      and verification_version = 2
      and unsubscribe_version = 2
    from public.parent_pathlab_subscriptions
    where trial_access_id = '81000000-0000-4000-8000-000000000001'
  ),
  'all rejected replays leave contact B generation unchanged'
);

create temp table exact_replay on commit drop as
select * from public.replace_parent_pathlab_subscription_contact(
  '82000000-0000-4000-8000-000000000001',
  '81000000-0000-4000-8000-000000000001',
  'parent-b@example.com',
  '2026-07-22T10:00:00Z', '2026-07-22T10:00:00Z',
  repeat('d', 64), 2, '2026-07-22T10:30:00Z',
  '2026-07-22T10:00:00Z', null,
  repeat('e', 64), 2, null, null
);
select ok(
  (
    select count(*) = 1 and min(normalized_email) = 'parent-b@example.com'
    from exact_replay
  ),
  'an exact concurrent same-contact replay is idempotent'
);

select is(
  public.verify_parent_pathlab_subscription_token(
    '82000000-0000-4000-8000-000000000001',
    repeat('d', 64),
    2,
    '2026-07-22T10:01:00Z'
  ),
  'applied',
  'contact B verifies its own generation'
);

create temp table old_claim on commit drop as
select *
from public.claim_parent_pathlab_update_cohort(
  '2026-07-22T10:02:00Z',
  5,
  '83000000-0000-4000-8000-000000000002',
  '2026-07-22T10:17:00Z'
);

select is(
  (select count(*) from old_claim),
  0::bigint,
  'old contact A work is never claimed for verified contact B'
);
select is(
  (
    select count(*)
    from public.parent_pathlab_update_outbox
    where idempotency_key =
      '82000000-0000-4000-8000-000000000001:g1:payment_status_changed:trial_accesses:81000000-0000-4000-8000-000000000001:pending'
  ),
  1::bigint,
  'the old provider cohort identity remains retired and cannot be reused'
);

select private.queue_parent_pathlab_update(
  '82000000-0000-4000-8000-000000000001',
  'payment_status_changed',
  'trial_accesses',
  '81000000-0000-4000-8000-000000000001',
  'pending',
  '{"status":"pending","generation":2}'
);

select is(
  (
    select count(*)
    from public.parent_pathlab_update_outbox
    where source_id = '81000000-0000-4000-8000-000000000001'
      and source_state = 'pending'
  ),
  2::bigint,
  'the same source state can be queued once for each contact generation'
);
select is(
  (
    select count(*)
    from public.parent_pathlab_update_outbox
    where source_id = '81000000-0000-4000-8000-000000000001'
      and source_state = 'pending'
      and status = 'pending'
  ),
  1::bigint,
  'only contact B generation has live same-source work'
);
select is(
  (
    select count(distinct idempotency_key)
    from public.parent_pathlab_update_outbox
    where source_id = '81000000-0000-4000-8000-000000000001'
      and source_state = 'pending'
  ),
  2::bigint,
  'queue idempotency identity includes the locked recipient generation'
);

create temp table new_claim on commit drop as
select *
from public.claim_parent_pathlab_update_cohort(
  '2026-07-22T10:03:00Z',
  5,
  '83000000-0000-4000-8000-000000000003',
  '2026-07-22T10:18:00Z'
);

select is(
  (select count(*) from new_claim),
  1::bigint,
  'new contact B events remain deliverable'
);
select is(
  (select normalized_email from new_claim),
  'parent-b@example.com',
  'new events resolve only to contact B'
);
select is(
  (select safe_payload ->> 'generation' from new_claim),
  '2',
  'the new claim contains only the generation-2 requeue'
);

update public.parent_pathlab_update_outbox
set status = 'delivered', lease_token = null, leased_until = null
where lease_token = '83000000-0000-4000-8000-000000000003';
update public.parent_pathlab_subscriptions
set delivery_lease_token = null, delivery_leased_until = null
where id = '82000000-0000-4000-8000-000000000001';

insert into public.parent_pathlab_update_outbox (
  id,
  subscription_id,
  event_kind,
  source_table,
  source_id,
  source_state,
  idempotency_key,
  safe_payload,
  scheduled_at
) values (
  '84000000-0000-4000-8000-000000000003',
  '82000000-0000-4000-8000-000000000001',
  'milestone_completed',
  'path_activity_progress',
  '85000000-0000-4000-8000-000000000001',
  'completed',
  'same-contact-new-event-completed',
  '{"currentDay":2}',
  '2026-07-22T10:04:00Z'
);

create temp table same_contact on commit drop as
select *
from public.replace_parent_pathlab_subscription_contact(
  '82000000-0000-4000-8000-000000000001',
  '81000000-0000-4000-8000-000000000001',
  'parent-b@example.com',
  '2026-07-22T10:04:00Z',
  '2026-07-22T10:04:00Z',
  repeat('6', 64),
  3,
  '2026-07-22T10:30:00Z',
  '2026-07-22T10:00:00Z',
  '2026-07-22T10:01:00Z',
  repeat('e', 64),
  2,
  null,
  null
);

select is(
  (
    select status
    from public.parent_pathlab_update_outbox
    where id = '84000000-0000-4000-8000-000000000003'
  ),
  'pending',
  'an idempotent same-contact save does not cancel current-generation work'
);
select is(
  (
    select count(*)
    from public.parent_pathlab_update_outbox
    where last_error_code = 'contact_replaced'
  ),
  1::bigint,
  'only the previous contact generation is retired'
);
select is(
  (select normalized_email from same_contact),
  'parent-b@example.com',
  'same-contact idempotent replacement preserves contact B'
);

select * from finish();
rollback;
