\set ON_ERROR_STOP on

-- Run against a migrated local Supabase database:
-- supabase test db supabase/tests/parent_update_frozen_cohort_order.test.sql
-- Fixtures and claims are rolled back.
begin;

create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
select plan(12);

select has_function(
  'public',
  'claim_parent_pathlab_update_cohort',
  array['timestamptz', 'integer', 'uuid', 'timestamptz'],
  'parent update cohort claim exists'
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
  verification_expires_at,
  verified_at,
  unsubscribe_token_hash
) values (
  '82000000-0000-4000-8000-000000000001',
  '81000000-0000-4000-8000-000000000001',
  'parent-order@example.com',
  '2026-07-22T07:00:00Z',
  '2026-07-22T07:00:00Z',
  repeat('d', 64),
  '2026-07-23T07:00:00Z',
  '2026-07-22T07:01:00Z',
  repeat('e', 64)
);

-- A failed delivery of the earlier "pending payment" update was frozen for
-- retry in the future. A newer "paid" update is already due, but delivering it
-- first would tell the parent the end of a story before its earlier chapter.
insert into public.parent_pathlab_update_outbox (
  id,
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
  last_error_code,
  delivery_group_key
) values (
  '83000000-0000-4000-8000-000000000001',
  '82000000-0000-4000-8000-000000000001',
  'payment_status_changed',
  'trial_accesses',
  '81000000-0000-4000-8000-000000000001',
  'pending',
  'parent-order-payment-pending',
  '{"paymentStatus":"pending"}'::jsonb,
  '2026-07-22T11:00:00Z',
  '2026-07-22T09:00:00Z',
  1,
  'provider_unavailable',
  'parent-update/' || repeat('f', 64)
), (
  '83000000-0000-4000-8000-000000000002',
  '82000000-0000-4000-8000-000000000001',
  'payment_status_changed',
  'trial_accesses',
  '81000000-0000-4000-8000-000000000001',
  'paid',
  'parent-order-payment-paid',
  '{"paymentStatus":"paid"}'::jsonb,
  '2026-07-22T09:30:00Z',
  '2026-07-22T09:30:00Z',
  0,
  null,
  null
);

create temp table before_frozen_due on commit drop as
select *
from public.claim_parent_pathlab_update_cohort(
  '2026-07-22T10:00:00Z',
  5,
  '84000000-0000-4000-8000-000000000001',
  '2026-07-22T10:15:00Z'
);

select is(
  (select count(*) from before_frozen_due),
  0::bigint,
  'fresh paid work is blocked while an unfinished frozen retry is future-scheduled'
);
select is(
  (select count(*) from public.parent_pathlab_update_outbox where status = 'pending'),
  2::bigint,
  'the blocked claim mutates neither queued update'
);
select is(
  (
    select count(*)
    from public.parent_pathlab_subscriptions
    where id = '82000000-0000-4000-8000-000000000001'
      and delivery_lease_token is not null
  ),
  0::bigint,
  'the blocked claim acquires no subscription lease'
);

create temp table frozen_due_claim on commit drop as
select *
from public.claim_parent_pathlab_update_cohort(
  '2026-07-22T11:00:00Z',
  5,
  '84000000-0000-4000-8000-000000000002',
  '2026-07-22T11:15:00Z'
);

select is(
  (select count(*) from frozen_due_claim),
  1::bigint,
  'the frozen retry becomes claimable when its retry time arrives'
);
select is(
  (select min(delivery_group_key) from frozen_due_claim),
  'parent-update/' || repeat('f', 64),
  'the frozen retry is claimed before fresh paid work'
);
select is(
  (select safe_payload ->> 'paymentStatus' from frozen_due_claim),
  'pending',
  'the first claimed message is the frozen pending-payment chapter'
);
select is(
  (
    select status
    from public.parent_pathlab_update_outbox
    where id = '83000000-0000-4000-8000-000000000002'
  ),
  'pending',
  'fresh paid work is not mixed into the frozen lease'
);

update public.parent_pathlab_update_outbox
set status = 'delivered',
    delivered_at = '2026-07-22T11:01:00Z',
    lease_token = null,
    leased_until = null
where id = '83000000-0000-4000-8000-000000000001';
update public.parent_pathlab_subscriptions
set delivery_lease_token = null,
    delivery_leased_until = null
where id = '82000000-0000-4000-8000-000000000001';

create temp table paid_claim on commit drop as
select *
from public.claim_parent_pathlab_update_cohort(
  '2026-07-22T11:02:00Z',
  5,
  '84000000-0000-4000-8000-000000000003',
  '2026-07-22T11:17:00Z'
);

select is(
  (select count(*) from paid_claim),
  1::bigint,
  'fresh paid work becomes claimable after frozen work finishes'
);
select is(
  (select count(*) from paid_claim where delivery_group_key is null),
  1::bigint,
  'the later paid claim remains a fresh unfrozen delivery'
);
select is(
  (select safe_payload ->> 'paymentStatus' from paid_claim),
  'paid',
  'the paid chapter is delivered after the frozen pending-payment chapter'
);
select is(
  (
    select count(*)
    from public.parent_pathlab_update_outbox
    where status = 'leased'
      and lease_token = '84000000-0000-4000-8000-000000000003'
  ),
  1::bigint,
  'only the paid row belongs to the later lease'
);

select * from finish();
rollback;
