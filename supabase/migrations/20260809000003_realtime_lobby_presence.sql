-- Broadcast student_node_progress changes so lobby presence avatars move
-- without a page refresh.
--
-- The useLobbyPresence hook subscribes to postgres_changes on this table, but a
-- subscription only receives events for tables in the supabase_realtime
-- publication. Without this the subscription is silent and a lobbymate's avatar
-- only moves on reload.
--
-- Note this publishes row changes to the realtime server, not to clients: RLS
-- is still applied per-subscriber, so a student receives events only for rows
-- their policies allow them to read. The lobbymate boundary from
-- 20260809000002 continues to hold.
--
-- Prod-first: additive and idempotent.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'student_node_progress'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.student_node_progress;
  END IF;
END $$;

-- REPLICA IDENTITY FULL so UPDATE events carry the full new row. Without it the
-- payload only includes the primary key plus changed columns, and the hook
-- needs user_id and node_id on every event to place the avatar.
ALTER TABLE public.student_node_progress REPLICA IDENTITY FULL;
