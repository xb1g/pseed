\set ON_ERROR_STOP on

-- Run against a migrated local Supabase database:
-- supabase test db supabase/tests/parent_update_atomic_cohort_claim.test.sql
-- Fixtures and claims are rolled back.
begin;

create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
select plan(16);

select has_function(
  'public',
  'claim_parent_pathlab_update_cohort',
  array['timestamptz', 'integer', 'uuid', 'timestamptz'],
  'atomic parent update cohort claim exists'
);

-- trial_accesses has unrelated user/seed foreign keys. This isolated fixture
-- disables FK triggers only for the one synthetic parent-delivery trial row.
set local session_replication_role = replica;
insert into public.trial_accesses (
  id, user_id, seed_id, pay_token, status
) values (
  '71000000-0000-4000-8000-000000000001',
  '71000000-0000-4000-8000-000000000002',
  '71000000-0000-4000-8000-000000000003',
  repeat('7', 32),
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
  verification_expires_at,
  verified_at,
  unsubscribe_token_hash
) values (
  '72000000-0000-4000-8000-000000000001',
  '71000000-0000-4000-8000-000000000001',
  'parent-atomic@example.com',
  '2026-07-22T07:00:00Z',
  '2026-07-22T07:00:00Z',
  repeat('a', 64),
  '2026-07-23T07:00:00Z',
  '2026-07-22T07:01:00Z',
  repeat('b', 64)
);

-- Fifty-one new rows precede a five-row frozen retry in normal time order.
-- The old application-side 50-row page could not see the complete retry.
insert into public.parent_pathlab_update_outbox (
  subscription_id,
  event_kind,
  source_table,
  source_id,
  source_state,
  idempotency_key,
  safe_payload,
  scheduled_at,
  created_at
)
select
  '72000000-0000-4000-8000-000000000001',
  'milestone_completed',
  'path_activity_progress',
  gen_random_uuid(),
  'completed',
  'parent-atomic-fresh-' || item::text,
  jsonb_build_object('eventId', 'fresh-' || item::text),
  '2026-07-22T08:00:00Z'::timestamptz + item * interval '1 second',
  '2026-07-22T08:00:00Z'::timestamptz + item * interval '1 second'
from generate_series(1, 51) item;

insert into public.parent_pathlab_update_outbox (
  subscription_id,
  event_kind,
  source_table,
  source_id,
  source_state,
  idempotency_key,
  safe_payload,
  scheduled_at,
  created_at,
  attempt_count,
  delivery_group_key
)
select
  '72000000-0000-4000-8000-000000000001',
  'milestone_completed',
  'path_activity_progress',
  gen_random_uuid(),
  'completed',
  'parent-atomic-frozen-' || item::text,
  jsonb_build_object('eventId', 'frozen-' || item::text),
  '2026-07-22T09:00:00Z'::timestamptz + item * interval '1 second',
  '2026-07-22T09:00:00Z'::timestamptz + item * interval '1 second',
  1,
  'parent-update/' || repeat('c', 64)
from generate_series(1, 5) item;

create temp table first_claim on commit drop as
select *
from public.claim_parent_pathlab_update_cohort(
  '2026-07-22T10:00:00Z',
  5,
  '73000000-0000-4000-8000-000000000001',
  '2026-07-22T10:15:00Z'
);

select is(
  (select count(*) from first_claim),
  5::bigint,
  'the complete five-row frozen cohort is claimed beyond the old 50-row boundary'
);
select is(
  (select count(distinct delivery_group_key) from first_claim),
  1::bigint,
  'the first claim contains one immutable frozen cohort only'
);
select is(
  (select min(delivery_group_key) from first_claim),
  'parent-update/' || repeat('c', 64),
  'the frozen retry wins even though newer unfrozen events were scheduled earlier'
);
select is(
  (
    select count(*)
    from public.parent_pathlab_update_outbox
    where delivery_group_key = 'parent-update/' || repeat('c', 64)
      and status = 'leased'
      and lease_token = '73000000-0000-4000-8000-000000000001'
  ),
  5::bigint,
  'all frozen members are leased with the same token atomically'
);
select is(
  (
    select count(*)
    from public.parent_pathlab_update_outbox
    where delivery_group_key is null and status = 'pending'
  ),
  51::bigint,
  'no new event is mixed into the frozen retry lease'
);
select is(
  (
    select delivery_lease_token
    from public.parent_pathlab_subscriptions
    where id = '72000000-0000-4000-8000-000000000001'
  ),
  '73000000-0000-4000-8000-000000000001'::uuid,
  'the subscription owns the same atomic lease'
);

update public.parent_pathlab_update_outbox
set status = 'delivered', lease_token = null, leased_until = null
where delivery_group_key = 'parent-update/' || repeat('c', 64);
update public.parent_pathlab_subscriptions
set delivery_lease_token = null, delivery_leased_until = null
where id = '72000000-0000-4000-8000-000000000001';

create temp table oversized_claim on commit drop as
select *
from public.claim_parent_pathlab_update_cohort(
  '2026-07-22T10:00:00Z',
  6,
  '73000000-0000-4000-8000-000000000002',
  '2026-07-22T10:15:00Z'
);

select is(
  (select count(*) from oversized_claim),
  0::bigint,
  'the database rejects claims larger than five'
);
select is(
  (
    select count(*)
    from public.parent_pathlab_subscriptions
    where id = '72000000-0000-4000-8000-000000000001'
      and delivery_lease_token is not null
  ),
  0::bigint,
  'an oversized request acquires no subscription lease'
);

create temp table null_limit_claim on commit drop as
select *
from public.claim_parent_pathlab_update_cohort(
  '2026-07-22T10:00:00Z',
  null,
  '73000000-0000-4000-8000-000000000005',
  '2026-07-22T10:15:00Z'
);

select is(
  (select count(*) from null_limit_claim),
  0::bigint,
  'a null limit cannot become an unbounded claim'
);
select is(
  (
    select count(*)
    from public.parent_pathlab_subscriptions
    where id = '72000000-0000-4000-8000-000000000001'
      and delivery_lease_token is not null
  ),
  0::bigint,
  'a null limit acquires no subscription lease'
);

create temp table null_expiry_claim on commit drop as
select *
from public.claim_parent_pathlab_update_cohort(
  '2026-07-22T10:00:00Z',
  5,
  '73000000-0000-4000-8000-000000000006',
  null
);

select is(
  (select count(*) from null_expiry_claim),
  0::bigint,
  'a null expiry cannot create stuck outbox leases'
);
select is(
  (
    select count(*)
    from public.parent_pathlab_subscriptions
    where id = '72000000-0000-4000-8000-000000000001'
      and delivery_lease_token is not null
  ),
  0::bigint,
  'a null expiry acquires no subscription lease'
);

create temp table bounded_claim on commit drop as
select *
from public.claim_parent_pathlab_update_cohort(
  '2026-07-22T10:00:00Z',
  5,
  '73000000-0000-4000-8000-000000000003',
  '2026-07-22T10:15:00Z'
);

select is(
  (select count(*) from bounded_claim),
  5::bigint,
  'an unfrozen claim remains bounded at five rows'
);

update public.parent_pathlab_update_outbox
set status = 'pending', lease_token = null, leased_until = null
where delivery_group_key is null;
update public.parent_pathlab_subscriptions
set delivery_lease_token = null,
    delivery_leased_until = null,
    unsubscribed_at = '2026-07-22T10:01:00Z'
where id = '72000000-0000-4000-8000-000000000001';

create temp table inactive_claim on commit drop as
select *
from public.claim_parent_pathlab_update_cohort(
  '2026-07-22T10:02:00Z',
  5,
  '73000000-0000-4000-8000-000000000004',
  '2026-07-22T10:17:00Z'
);

select is(
  (select count(*) from inactive_claim),
  0::bigint,
  'an unsubscribed recipient cannot acquire a delivery lease'
);
select is(
  (
    select count(*)
    from public.parent_pathlab_update_outbox
    where delivery_group_key is null and status = 'pending'
  ),
  51::bigint,
  'claiming does not mutate queued work from a stale inactive snapshot'
);

select * from finish();
rollback;
