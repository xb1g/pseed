-- The partial unique index doesn't satisfy a plain ON CONFLICT (col) clause
-- (Postgres requires the predicate to be repeated there too, which
-- postgrest/supabase-js upsert() can't express). A regular unique index
-- already permits multiple NULLs, so drop the partial one for a plain one.
DROP INDEX IF EXISTS public.idx_dm_messages_platform_message_id;
CREATE UNIQUE INDEX IF NOT EXISTS idx_dm_messages_platform_message_id
ON public.dm_messages(platform_message_id);
