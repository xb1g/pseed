\set ON_ERROR_STOP on

begin;

select to_regclass('public.trial_accesses') is null as load_trial_access \gset
\if :load_trial_access
\ir ../migrations/20260719130001_create_trial_access.sql
\endif

create schema if not exists private;

select to_regprocedure('public.start_pathlab_trial(uuid)') is null as load_migration \gset
\if :load_migration
\ir ../migrations/20260722103026_make_trial_launch_and_slip_status_cas.sql
\endif

create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
select plan(11);

insert into auth.users (id)
values ('91000000-0000-4000-8000-000000000001')
on conflict (id) do nothing;

insert into public.learning_maps (id, title)
values ('91000000-0000-4000-8000-000000000002', 'Trial CAS map')
on conflict (id) do nothing;

insert into public.seeds (id, map_id, title, seed_type)
values (
  '91000000-0000-4000-8000-000000000003',
  '91000000-0000-4000-8000-000000000002',
  'Trial CAS seed',
  'pathlab'
)
on conflict (id) do update set seed_type = 'pathlab';

insert into public.paths (id, seed_id, created_by)
values (
  '91000000-0000-4000-8000-000000000004',
  '91000000-0000-4000-8000-000000000003',
  '91000000-0000-4000-8000-000000000001'
)
on conflict (seed_id) do nothing;

set local role authenticated;
select set_config(
  'request.jwt.claim.sub',
  '91000000-0000-4000-8000-000000000001',
  true
);
select set_config('request.jwt.claim.role', 'authenticated', true);

create temporary table first_launch on commit drop as
select *
from public.start_pathlab_trial('91000000-0000-4000-8000-000000000003');

select is((select trial_status from first_launch), 'active', 'launch creates an active trial');
select ok((select enrollment_id is not null from first_launch), 'launch atomically creates enrollment');
select is(
  (select count(*)::integer from public.trial_accesses where user_id = auth.uid()),
  1,
  'launch remains idempotent at one trial'
);

update public.path_enrollments
set status = 'paused'
where id = (select enrollment_id from first_launch);

select *
from public.start_pathlab_trial('91000000-0000-4000-8000-000000000003')
limit 1 \gset resumed_

select is(
  :'resumed_enrollment_status'::text,
  'active'::text,
  'eligible paused enrollment resumes'
);

reset role;
update public.trial_accesses
set status = 'active',
    paid_at = null,
    payment_deadline = statement_timestamp() - interval '1 second'
where id = (select trial_id from first_launch);
update public.path_enrollments
set status = 'paused'
where id = (select enrollment_id from first_launch);
set local role authenticated;

create temporary table expired_launch on commit drop as
select *
from public.start_pathlab_trial('91000000-0000-4000-8000-000000000003');

select is((select trial_status from expired_launch), 'expired', 'overdue active trial expires under lock');
select ok((select enrollment_id is null from expired_launch), 'expired recovery returns no enrollment access');
select is(
  (select status from public.path_enrollments where id = (select enrollment_id from first_launch)),
  'paused',
  'expired recovery never resumes the paused enrollment'
);

reset role;
delete from public.path_enrollments where id = (select enrollment_id from first_launch);
set local role authenticated;
create temporary table expired_without_enrollment on commit drop as
select * from public.start_pathlab_trial('91000000-0000-4000-8000-000000000003');
select ok(
  (select enrollment_id is null from expired_without_enrollment),
  'expired recovery never recreates a missing enrollment'
);

reset role;
update public.trial_accesses
set status = 'expired', paid_at = null, slip_path = null
where id = (select trial_id from first_launch);
set local role service_role;

select is(
  public.submit_trial_payment_slip(
    (select id from public.trial_accesses
     where user_id = '91000000-0000-4000-8000-000000000001'),
    'trial/new-slip.jpg'
  ),
  'pending',
  'active recovery slip can enter review'
);

reset role;
update public.trial_accesses
set status = 'paid',
    paid_at = statement_timestamp(),
    slip_path = 'trial/verified-slip.jpg'
where id = (select trial_id from first_launch);
set local role service_role;

select is(
  public.submit_trial_payment_slip(
    (select id from public.trial_accesses
     where user_id = '91000000-0000-4000-8000-000000000001'),
    'trial/stale-upload.jpg'
  ),
  null,
  'stale slip transition reports that no CAS row changed'
);
select results_eq(
  $$
    select status, slip_path
    from public.trial_accesses
    where user_id = '91000000-0000-4000-8000-000000000001'
  $$,
  $$ values ('paid'::text, 'trial/verified-slip.jpg'::text) $$,
  'paid verification and its slip cannot be overwritten'
);

reset role;
select * from finish();
rollback;
