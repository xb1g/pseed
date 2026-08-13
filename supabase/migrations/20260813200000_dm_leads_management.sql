-- Inbox management fields for DM leads: star, follow-up reminder, admin
-- tags, and a lead pipeline status. All additive with safe defaults so a
-- prod-first apply cannot break existing rows.
ALTER TABLE public.dm_conversations
  ADD COLUMN IF NOT EXISTS starred boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS admin_tags text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS follow_up_at timestamptz,
  ADD COLUMN IF NOT EXISTS lead_status text NOT NULL DEFAULT 'new';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'dm_conversations_lead_status_check'
  ) THEN
    ALTER TABLE public.dm_conversations
      ADD CONSTRAINT dm_conversations_lead_status_check
      CHECK (lead_status IN ('new', 'contacted', 'qualified', 'converted', 'lost', 'spam'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS dm_conversations_starred_idx
  ON public.dm_conversations (starred) WHERE starred;

CREATE INDEX IF NOT EXISTS dm_conversations_follow_up_at_idx
  ON public.dm_conversations (follow_up_at) WHERE follow_up_at IS NOT NULL;
