-- Campaign runs over the DM inbox: one row per batch, one target row per
-- conversation in that batch.
--
-- Exists because the inbox has no memory of a sweep. Without it we cannot tell
-- "this lead was already followed up today" from "this lead is untouched", and
-- the playbook's one-follow-up-then-stop rule is unenforceable at batch size.
--
-- Additive and idempotent throughout: this migration is applied straight to
-- production, which is the first Postgres to parse it.

create table if not exists public.dm_campaigns (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  -- The single variable under test. Null means no test, everyone gets control.
  ab_variable text,
  created_at timestamptz not null default now(),
  started_at timestamptz,
  finished_at timestamptz,
  notes text
);

create table if not exists public.dm_campaign_targets (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.dm_campaigns (id) on delete cascade,
  conversation_id uuid not null references public.dm_conversations (id) on delete cascade,

  -- Snapshot of the routing decision at queue-build time, so a later
  -- reclassification cannot silently rewrite history on a sent message.
  bucket text not null,
  rung smallint not null,
  variant text not null,
  window_mode text not null,

  -- The template before Qwen, and the draft after. Keeping both is what makes
  -- a bad rewrite diagnosable after the fact.
  template_body text not null,
  draft_body text,

  -- 'auto' cleared the safety gate; 'review' needs a human. Set at queue build.
  gate_decision text not null default 'review',
  gate_reasons text[] not null default '{}',

  status text not null default 'pending',
  skip_reason text,
  sent_message_id uuid references public.dm_messages (id) on delete set null,
  sent_at timestamptz,
  created_at timestamptz not null default now(),

  unique (campaign_id, conversation_id)
);

create index if not exists dm_campaign_targets_queue_idx
  on public.dm_campaign_targets (campaign_id, status, gate_decision);

create index if not exists dm_campaign_targets_conversation_idx
  on public.dm_campaign_targets (conversation_id, sent_at desc);

-- Stamped on the outbound message so outcomes join back to the arm without a
-- second lookup, and so a message keeps its variant even if the target row is
-- later deleted.
alter table public.dm_messages
  add column if not exists campaign_id uuid references public.dm_campaigns (id) on delete set null,
  add column if not exists campaign_variant text;

create index if not exists dm_messages_campaign_idx
  on public.dm_messages (campaign_id)
  where campaign_id is not null;

-- Reply attribution for the A/B readout: for every campaign message we sent,
-- did an inbound message follow it, and how fast.
--
-- `replied_within` is null when nothing came back, which is the losing arm's
-- signal, so callers must count rows rather than average non-nulls.
create or replace view public.dm_campaign_outcomes as
select
  t.campaign_id,
  t.variant,
  t.conversation_id,
  t.rung,
  t.bucket,
  t.gate_decision,
  t.sent_at,
  (
    select min(m.sent_at)
    from public.dm_messages m
    where m.conversation_id = t.conversation_id
      and m.direction = 'inbound'
      and m.sent_at > t.sent_at
  ) as replied_at,
  (
    select min(m.sent_at) - t.sent_at
    from public.dm_messages m
    where m.conversation_id = t.conversation_id
      and m.direction = 'inbound'
      and m.sent_at > t.sent_at
  ) as replied_within
from public.dm_campaign_targets t
where t.sent_at is not null;

-- Admin-only surfaces; every read goes through the service-role client.
alter table public.dm_campaigns enable row level security;
alter table public.dm_campaign_targets enable row level security;
revoke all on public.dm_campaign_outcomes from anon, authenticated;
