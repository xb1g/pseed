-- DM lead signals: per-message matcher flags + per-conversation rollup view.
--
-- Before this, every admin inbox load paged the whole `dm_messages` table
-- (bodies included) into Node just to derive five booleans per conversation.
-- The matchers stay in TypeScript (`lib/dm-leads/signals.ts`) so the list and
-- the detail pane cannot drift apart; they now write their result onto the row
-- at insert time, which turns the rollup into a plain aggregate.
--
-- Additive and idempotent: prod is the first Postgres to parse this.

alter table public.dm_messages
  add column if not exists signal_price boolean not null default false,
  add column if not exists signal_pathlab_link boolean not null default false,
  add column if not exists signal_offer boolean not null default false;

comment on column public.dm_messages.signal_price is
  'mentionsPrice(body) at insert time. Re-run scripts/backfill-message-signals.mjs after editing the matcher.';
comment on column public.dm_messages.signal_pathlab_link is
  'mentionsPathlabLink(body) at insert time. Direction rules live in dm_conversation_signals.';
comment on column public.dm_messages.signal_offer is
  'mentionsOffer(body) at insert time. Direction rules live in dm_conversation_signals.';

-- The rollup only ever groups by conversation, and always reads these columns.
create index if not exists dm_messages_signals_idx
  on public.dm_messages (conversation_id)
  include (direction, sent_at, signal_price, signal_pathlab_link, signal_offer);

-- One row per conversation that has at least one message. Mirrors
-- reduceMessagesToSignals() exactly, including the trailing rule that a link or
-- a price is itself an offer whatever the wording was.
create or replace view public.dm_conversation_signals as
select
  conversation_id,
  bool_or(direction = 'inbound')                          as has_inbound,
  max(sent_at) filter (where direction = 'inbound')       as last_inbound_message_at,
  bool_or(direction = 'outbound' and signal_pathlab_link) as pathlab_link_sent,
  bool_or(signal_price)                                   as price_mentioned,
  bool_or(direction = 'outbound' and signal_offer)
    or bool_or(direction = 'outbound' and signal_pathlab_link)
    or bool_or(signal_price)                              as offer_made
from public.dm_messages
group by conversation_id;

comment on view public.dm_conversation_signals is
  'Per-conversation DM playbook signals. Keep in lockstep with reduceMessagesToSignals() in lib/dm-leads/signals.ts.';

-- Reached only through the service role (admin inbox); no anon/authenticated grant.
revoke all on public.dm_conversation_signals from anon, authenticated;
