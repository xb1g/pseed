-- Bearer tokens for the DM Copilot Chrome extension.
--
-- The extension lives in the operator's own Chrome and talks to
-- /api/copilot/* from inside Instagram's web UI. It authenticates with a
-- long-lived bearer token minted by the admin at /admin/dm-leads/copilot
-- instead of carrying the full Supabase session cookie.
--
-- We never store the raw token. `token_hash` is sha256(raw_token); the raw
-- value is shown to the operator exactly once at mint time. A leaked hash
-- cannot be reversed to a usable bearer.

CREATE TABLE IF NOT EXISTS public.dm_copilot_tokens (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name text NOT NULL,
    token_hash text NOT NULL UNIQUE,
    last_used_at timestamptz,
    expires_at timestamptz NOT NULL DEFAULT (now() + interval '90 days'),
    revoked_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_dm_copilot_tokens_user_active
    ON public.dm_copilot_tokens(user_id)
    WHERE revoked_at IS NULL;

ALTER TABLE public.dm_copilot_tokens ENABLE ROW LEVEL SECURITY;

-- Owners list / mint / revoke their own tokens. No anon path.
DROP POLICY IF EXISTS "dm_copilot_tokens_owner_select" ON public.dm_copilot_tokens;
CREATE POLICY "dm_copilot_tokens_owner_select"
    ON public.dm_copilot_tokens
    FOR SELECT
    USING (user_id = auth.uid());

DROP POLICY IF EXISTS "dm_copilot_tokens_owner_insert" ON public.dm_copilot_tokens;
CREATE POLICY "dm_copilot_tokens_owner_insert"
    ON public.dm_copilot_tokens
    FOR INSERT
    WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "dm_copilot_tokens_owner_update" ON public.dm_copilot_tokens;
CREATE POLICY "dm_copilot_tokens_owner_update"
    ON public.dm_copilot_tokens
    FOR UPDATE
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "dm_copilot_tokens_owner_delete" ON public.dm_copilot_tokens;
CREATE POLICY "dm_copilot_tokens_owner_delete"
    ON public.dm_copilot_tokens
    FOR DELETE
    USING (user_id = auth.uid());

-- Audit trail: every API hit from the extension lands here so a leaked token
-- is forensically recoverable. Keeps who / when / what with no payload.
CREATE TABLE IF NOT EXISTS public.dm_copilot_audit_log (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    token_id uuid NOT NULL REFERENCES public.dm_copilot_tokens(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    action text NOT NULL CHECK (action IN ('advise', 'log', 'token_rejected')),
    conversation_id uuid REFERENCES public.dm_conversations(id) ON DELETE SET NULL,
    remote_ip text,
    user_agent text,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_dm_copilot_audit_token_created
    ON public.dm_copilot_audit_log(token_id, created_at DESC);

ALTER TABLE public.dm_copilot_audit_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "dm_copilot_audit_owner_select" ON public.dm_copilot_audit_log;
CREATE POLICY "dm_copilot_audit_owner_select"
    ON public.dm_copilot_audit_log
    FOR SELECT
    USING (user_id = auth.uid());
