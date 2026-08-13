-- Backfilling DM history from the Graph API needs to be safely re-runnable,
-- so dedupe on platform_message_id (NULLs excluded — that's fine for
-- webhook-received messages, which don't always carry an mid).
CREATE UNIQUE INDEX IF NOT EXISTS idx_dm_messages_platform_message_id
ON public.dm_messages(platform_message_id)
WHERE platform_message_id IS NOT NULL;
