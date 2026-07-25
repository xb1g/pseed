-- Hardening for the public anonymous signup surface (adversarial review):
-- bound text field lengths and enforce referral code format on referred_by,
-- so garbage/oversized rows can't be inserted even bypassing the client.

alter table public.techseed_signups
  drop constraint if exists techseed_signups_name_len,
  add constraint techseed_signups_name_len check (char_length(name) <= 200);

alter table public.techseed_signups
  drop constraint if exists techseed_signups_contact_len,
  add constraint techseed_signups_contact_len check (char_length(contact) <= 100);

alter table public.techseed_signups
  drop constraint if exists techseed_signups_school_len,
  add constraint techseed_signups_school_len check (char_length(school) <= 200);

alter table public.techseed_signups
  drop constraint if exists techseed_signups_track_len,
  add constraint techseed_signups_track_len check (char_length(interest_track) <= 100);

alter table public.techseed_signups
  drop constraint if exists techseed_signups_source_len,
  add constraint techseed_signups_source_len check (char_length(source) <= 200);

alter table public.techseed_signups
  drop constraint if exists techseed_signups_referred_by_fmt,
  add constraint techseed_signups_referred_by_fmt
    check (referred_by is null or referred_by ~ '^[A-Z2-9]{8}$');

-- Keep updated_at honest on manual staff edits (referral trigger already
-- bumps it on referral events).
create or replace function public.techseed_touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists techseed_signups_touch_updated_at on public.techseed_signups;
create trigger techseed_signups_touch_updated_at
  before update on public.techseed_signups
  for each row execute function public.techseed_touch_updated_at();
