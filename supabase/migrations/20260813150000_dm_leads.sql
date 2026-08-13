-- Instagram/Facebook DM lead capture: conversations + messages, with a
-- stage classification the admin inbox uses to route leads to the right
-- product (PathLab for exploring, Community for building, Talent for job-ready).

CREATE TABLE IF NOT EXISTS public.dm_conversations (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    platform text NOT NULL CHECK (platform IN ('instagram', 'facebook')),
    platform_thread_id text NOT NULL,
    platform_user_id text NOT NULL,
    username text,
    display_name text,
    grade_level text,
    interests text[] NOT NULL DEFAULT '{}',
    activities_summary text,
    stage text NOT NULL DEFAULT 'unknown' CHECK (
      stage IN ('unknown', 'exploring', 'building', 'job_seeking')
    ),
    recommended_product text,
    classified_at timestamptz,
    last_message_at timestamptz NOT NULL DEFAULT now(),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (platform, platform_thread_id)
);

CREATE TABLE IF NOT EXISTS public.dm_messages (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    conversation_id uuid NOT NULL REFERENCES public.dm_conversations(id) ON DELETE CASCADE,
    direction text NOT NULL CHECK (direction IN ('inbound', 'outbound')),
    sender_type text NOT NULL CHECK (sender_type IN ('lead', 'admin', 'ai_draft')),
    body text NOT NULL,
    platform_message_id text,
    sent_at timestamptz NOT NULL DEFAULT now(),
    created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.dm_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dm_messages ENABLE ROW LEVEL SECURITY;

-- Admin-only. Inbound writes happen via the webhook's service-role client,
-- which bypasses RLS entirely, so no anon/lead-facing policy is needed here.
CREATE POLICY "dm_conversations_select_admin" ON public.dm_conversations
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.user_roles
  WHERE user_id = auth.uid()
  AND role = 'admin'
));

CREATE POLICY "dm_conversations_modify_admin" ON public.dm_conversations
FOR ALL
USING (EXISTS (
  SELECT 1 FROM public.user_roles
  WHERE user_id = auth.uid()
  AND role = 'admin'
))
WITH CHECK (EXISTS (
  SELECT 1 FROM public.user_roles
  WHERE user_id = auth.uid()
  AND role = 'admin'
));

CREATE POLICY "dm_messages_select_admin" ON public.dm_messages
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.user_roles
  WHERE user_id = auth.uid()
  AND role = 'admin'
));

CREATE POLICY "dm_messages_modify_admin" ON public.dm_messages
FOR ALL
USING (EXISTS (
  SELECT 1 FROM public.user_roles
  WHERE user_id = auth.uid()
  AND role = 'admin'
))
WITH CHECK (EXISTS (
  SELECT 1 FROM public.user_roles
  WHERE user_id = auth.uid()
  AND role = 'admin'
));

CREATE INDEX IF NOT EXISTS idx_dm_conversations_stage ON public.dm_conversations(stage);
CREATE INDEX IF NOT EXISTS idx_dm_conversations_last_message ON public.dm_conversations(last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_dm_conversations_platform_user ON public.dm_conversations(platform, platform_user_id);
CREATE INDEX IF NOT EXISTS idx_dm_messages_conversation ON public.dm_messages(conversation_id, sent_at);

CREATE TRIGGER update_dm_conversations_updated_at
    BEFORE UPDATE ON public.dm_conversations
    FOR EACH ROW
    EXECUTE PROCEDURE public.update_updated_at_column();
