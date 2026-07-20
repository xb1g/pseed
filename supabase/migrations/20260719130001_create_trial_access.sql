-- PathLab Trial: "do first, pay later" paywall.
-- Students start a trial instantly; a parent pays 1,490 THB within 24 hours
-- through a public, token-linked pay page (parents have no account).
-- Status flow: active -> pending (slip uploaded) -> paid (admin verified),
-- or active -> expired (deadline passed; resolved in app code, not stored).

create table public.trial_accesses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  seed_id uuid not null references public.seeds(id) on delete cascade,
  status text not null default 'active' check (status in ('active','pending','paid','expired')),
  pay_token text not null unique default replace(gen_random_uuid()::text, '-', ''),
  price_amount integer not null default 1490 check (price_amount >= 0),
  started_at timestamptz not null default now(),
  payment_deadline timestamptz not null default (now() + interval '24 hours'),
  slip_path text,
  paid_at timestamptz,
  verified_by uuid references auth.users(id),
  verified_at timestamptz,
  admin_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, seed_id)
);

create index trial_accesses_user_id_idx on public.trial_accesses (user_id);
create index trial_accesses_status_deadline_idx
  on public.trial_accesses (status, payment_deadline);

alter table public.trial_accesses enable row level security;

-- Students read their own trial rows.
create policy "students read own trial accesses"
  on public.trial_accesses for select to authenticated
  using (auth.uid() = user_id);

-- Students can only start a trial for themselves, and only in 'active'
-- status. Slip uploads, verification, and expiry move through the service
-- role server-side, so no user-side update/delete policies exist.
create policy "students create own active trial access"
  on public.trial_accesses for insert to authenticated
  with check (
    auth.uid() = user_id
    and status = 'active'
    and price_amount = 1490
    and paid_at is null
    and slip_path is null
    and verified_by is null
  );

-- Admins manage all rows (verify payments, add notes, resolve disputes).
create policy "admins manage trial accesses"
  on public.trial_accesses for all to authenticated
  using (
    exists (
      select 1 from user_roles
      where user_id = auth.uid()
      and role = 'admin'
    )
  )
  with check (
    exists (
      select 1 from user_roles
      where user_id = auth.uid()
      and role = 'admin'
    )
  );

-- Public parent pay page lookup. Parents are anonymous, so this security
-- definer function is the only read path into the table for anon. The token
-- acts as a bearer secret: malformed tokens return null without a scan.
create or replace function public.get_trial_by_token(p_token text)
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
        'id', t.id,
        'status', t.status,
        'priceAmount', t.price_amount,
        'startedAt', t.started_at,
        'paymentDeadline', t.payment_deadline,
        'paidAt', t.paid_at,
        'seedId', t.seed_id,
        'seedTitle', s.title
      )
      from public.trial_accesses t
      join public.seeds s on s.id = t.seed_id
      where t.pay_token = p_token
      limit 1
    )
  end;
$$;

-- Broad DML grant to authenticated (the repo's seeds-era pattern): table
-- privileges are coarse, RLS above does the real gating. Students hit only
-- the select-own / insert-own-active policies; update/delete have no student
-- policies, so their writes are denied while the admin policy gets full DML.
-- Anon gets nothing: parents read through get_trial_by_token only.
revoke all on table public.trial_accesses from anon, authenticated;
grant select, insert, update, delete on table public.trial_accesses to authenticated;

revoke all on function public.get_trial_by_token(text) from public;
grant execute on function public.get_trial_by_token(text) to anon, authenticated;

comment on table public.trial_accesses is
  'PathLab trial access: one "do first, pay later" trial per user per seed, paid by a parent within 24 hours.';

-- Payment slips uploaded by parents via the service role. Private bucket:
-- only admins can read the slips; service role bypasses RLS for uploads,
-- so no insert policy is needed.
insert into storage.buckets (id, name, public)
values ('trial-slips', 'trial-slips', false)
on conflict (id) do nothing;

drop policy if exists "Admins can read trial slips" on storage.objects;
create policy "Admins can read trial slips"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'trial-slips'
    and exists (
      select 1 from user_roles
      where user_id = auth.uid()
      and role = 'admin'
    )
  );
