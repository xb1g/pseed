-- Make Meta webhook ingestion observable, retry-safe, and rich enough for
-- non-text messaging events. All tables are admin-only; webhook writes use the
-- service-role client and bypass RLS.

ALTER TABLE public.dm_messages
  ADD COLUMN IF NOT EXISTS message_type text NOT NULL DEFAULT 'text',
  ADD COLUMN IF NOT EXISTS metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS send_status text,
  ADD COLUMN IF NOT EXISTS delivered_at timestamptz,
  ADD COLUMN IF NOT EXISTS read_at timestamptz;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'dm_messages_message_type_check'
  ) THEN
    ALTER TABLE public.dm_messages
      ADD CONSTRAINT dm_messages_message_type_check
      CHECK (message_type IN ('text', 'attachment', 'quick_reply', 'postback', 'system'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'dm_messages_send_status_check'
  ) THEN
    ALTER TABLE public.dm_messages
      ADD CONSTRAINT dm_messages_send_status_check
      CHECK (send_status IS NULL OR send_status IN ('pending', 'sent', 'delivered', 'read', 'failed'));
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.dm_message_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid NOT NULL REFERENCES public.dm_messages(id) ON DELETE CASCADE,
  attachment_type text NOT NULL,
  position integer NOT NULL DEFAULT 0 CHECK (position >= 0),
  source_url text,
  title text,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (message_id, position)
);

CREATE TABLE IF NOT EXISTS public.dm_message_reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid REFERENCES public.dm_messages(id) ON DELETE CASCADE,
  target_platform_message_id text NOT NULL,
  actor_platform_user_id text NOT NULL,
  reaction text,
  reacted_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (target_platform_message_id, actor_platform_user_id)
);

CREATE TABLE IF NOT EXISTS public.meta_webhook_receipts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider text NOT NULL DEFAULT 'meta' CHECK (provider = 'meta'),
  provider_request_id text,
  object_type text NOT NULL,
  body_sha256 text NOT NULL,
  entry_count integer NOT NULL DEFAULT 0 CHECK (entry_count >= 0),
  event_count integer NOT NULL DEFAULT 0 CHECK (event_count >= 0),
  processed_count integer NOT NULL DEFAULT 0 CHECK (processed_count >= 0),
  duplicate_count integer NOT NULL DEFAULT 0 CHECK (duplicate_count >= 0),
  ignored_count integer NOT NULL DEFAULT 0 CHECK (ignored_count >= 0),
  failed_count integer NOT NULL DEFAULT 0 CHECK (failed_count >= 0),
  status text NOT NULL DEFAULT 'received'
    CHECK (status IN ('received', 'processed', 'partial', 'failed')),
  error_code text,
  received_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);

CREATE TABLE IF NOT EXISTS public.meta_webhook_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  receipt_id uuid NOT NULL REFERENCES public.meta_webhook_receipts(id) ON DELETE CASCADE,
  dedupe_key text NOT NULL,
  event_kind text NOT NULL,
  processing_status text NOT NULL
    CHECK (processing_status IN ('processed', 'duplicate', 'ignored', 'failed')),
  skip_reason text,
  source_event_id text,
  conversation_id uuid REFERENCES public.dm_conversations(id) ON DELETE SET NULL,
  dm_message_id uuid REFERENCES public.dm_messages(id) ON DELETE SET NULL,
  ig_comment_id uuid REFERENCES public.ig_comments(id) ON DELETE SET NULL,
  occurred_at timestamptz,
  payload_metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  raw_payload jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS dm_message_attachments_message_idx
  ON public.dm_message_attachments (message_id);
CREATE INDEX IF NOT EXISTS dm_message_reactions_message_idx
  ON public.dm_message_reactions (message_id);
CREATE INDEX IF NOT EXISTS dm_message_reactions_target_idx
  ON public.dm_message_reactions (target_platform_message_id);
CREATE INDEX IF NOT EXISTS meta_webhook_receipts_received_idx
  ON public.meta_webhook_receipts (received_at DESC);
CREATE INDEX IF NOT EXISTS meta_webhook_receipts_body_hash_idx
  ON public.meta_webhook_receipts (body_sha256);
CREATE INDEX IF NOT EXISTS meta_webhook_receipts_problem_idx
  ON public.meta_webhook_receipts (status, received_at DESC)
  WHERE status <> 'processed';
CREATE INDEX IF NOT EXISTS meta_webhook_events_receipt_idx
  ON public.meta_webhook_events (receipt_id);
CREATE INDEX IF NOT EXISTS meta_webhook_events_dedupe_idx
  ON public.meta_webhook_events (dedupe_key);
CREATE INDEX IF NOT EXISTS meta_webhook_events_kind_created_idx
  ON public.meta_webhook_events (event_kind, created_at DESC);
CREATE INDEX IF NOT EXISTS meta_webhook_events_problem_idx
  ON public.meta_webhook_events (processing_status, created_at DESC)
  WHERE processing_status IN ('failed', 'ignored');
CREATE INDEX IF NOT EXISTS meta_webhook_events_conversation_idx
  ON public.meta_webhook_events (conversation_id)
  WHERE conversation_id IS NOT NULL;

ALTER TABLE public.dm_message_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dm_message_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meta_webhook_receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meta_webhook_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "dm_message_attachments_select_admin"
ON public.dm_message_attachments FOR SELECT TO authenticated
USING (public.is_admin(auth.uid()));

CREATE POLICY "dm_message_reactions_select_admin"
ON public.dm_message_reactions FOR SELECT TO authenticated
USING (public.is_admin(auth.uid()));

CREATE POLICY "meta_webhook_receipts_select_admin"
ON public.meta_webhook_receipts FOR SELECT TO authenticated
USING (public.is_admin(auth.uid()));

CREATE POLICY "meta_webhook_events_select_admin"
ON public.meta_webhook_events FOR SELECT TO authenticated
USING (public.is_admin(auth.uid()));

REVOKE ALL ON public.dm_message_attachments FROM anon, authenticated;
REVOKE ALL ON public.dm_message_reactions FROM anon, authenticated;
REVOKE ALL ON public.meta_webhook_receipts FROM anon, authenticated;
REVOKE ALL ON public.meta_webhook_events FROM anon, authenticated;

GRANT SELECT ON public.dm_message_attachments TO authenticated;
GRANT SELECT ON public.dm_message_reactions TO authenticated;
GRANT SELECT ON public.meta_webhook_receipts TO authenticated;
GRANT SELECT ON public.meta_webhook_events TO authenticated;

CREATE OR REPLACE FUNCTION private.cleanup_meta_webhook_raw_payloads()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  cleared integer;
BEGIN
  UPDATE public.meta_webhook_events
  SET raw_payload = NULL
  WHERE raw_payload IS NOT NULL
    AND created_at < now() - interval '30 days';

  GET DIAGNOSTICS cleared = ROW_COUNT;
  RETURN cleared;
END;
$$;

REVOKE ALL ON FUNCTION private.cleanup_meta_webhook_raw_payloads() FROM PUBLIC;

-- Supabase projects normally provide pg_cron. Keep the migration portable for
-- test databases where the extension is not installed; the cleanup function
-- remains callable by an external cron in that environment.
DO $$
DECLARE
  job_exists boolean := false;
BEGIN
  IF to_regclass('cron.job') IS NOT NULL THEN
    EXECUTE 'SELECT EXISTS (SELECT 1 FROM cron.job WHERE jobname = $1)'
      INTO job_exists
      USING 'meta-webhook-raw-payload-cleanup';
  END IF;

  IF to_regprocedure('cron.schedule(text,text,text)') IS NOT NULL AND NOT job_exists THEN
    PERFORM cron.schedule(
      'meta-webhook-raw-payload-cleanup',
      '17 3 * * *',
      'SELECT private.cleanup_meta_webhook_raw_payloads();'
    );
  END IF;
END $$;
