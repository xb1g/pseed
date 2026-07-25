-- TechSeed batch 6 public signup capture with referral discounts.
-- Funnel: radar CTA -> /techseed -> this table -> LINE closes payment manually.

create table if not exists public.techseed_signups (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  batch text not null default 'techseed-6',
  name text not null,
  school text,
  grade text,
  contact text not null,                -- LINE ID or phone number
  interest_track text,                  -- radar slug or free text
  referral_code text not null unique,   -- this student's own share code
  referred_by text,                     -- referral_code of the inviter
  referral_count int not null default 0, -- total friends signed up via their link
  price_anchor int not null default 2550, -- struck-through anchor price (THB)
  price_base int not null default 1550,   -- price before referral discounts (THB)
  price_final int not null default 1550,  -- price_base - 150 * min(referral_count, 4)
  source text                           -- e.g. radar slug / utm hint
);

comment on table public.techseed_signups is 'TechSeed batch 6 signups. Referral: -150 THB per friend, max 4 friends counted (floor 950). Payment collected manually via PromptPay/LINE.';

-- Referral accounting: count every referred friend, cap the discount at 4.
create or replace function public.techseed_apply_referral()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.referred_by is not null then
    update public.techseed_signups
    set referral_count = referral_count + 1,
        price_final = greatest(
          price_base - 150 * least(referral_count + 1, 4),
          950
        ),
        updated_at = now()
    where referral_code = new.referred_by;
  end if;
  return new;
end;
$$;

drop trigger if exists techseed_signups_apply_referral on public.techseed_signups;
create trigger techseed_signups_apply_referral
  after insert on public.techseed_signups
  for each row execute function public.techseed_apply_referral();

alter table public.techseed_signups enable row level security;

-- Anonymous public insert only. Reads go through service role (admin/API).
drop policy if exists "anyone can sign up for techseed" on public.techseed_signups;
create policy "anyone can sign up for techseed"
  on public.techseed_signups for insert
  to anon, authenticated
  with check (true);
