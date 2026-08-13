-- Lets the admin inbox filter to "my turn" (lead sent last, awaiting reply)
-- vs "their turn" (we already replied) without joining dm_messages each time.
ALTER TABLE public.dm_conversations
  ADD COLUMN IF NOT EXISTS last_message_direction text
  CHECK (last_message_direction IN ('inbound', 'outbound'));
