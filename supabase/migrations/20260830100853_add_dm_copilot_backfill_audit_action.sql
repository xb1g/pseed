ALTER TABLE public.dm_copilot_audit_log
    DROP CONSTRAINT IF EXISTS dm_copilot_audit_log_action_check;

ALTER TABLE public.dm_copilot_audit_log
    ADD CONSTRAINT dm_copilot_audit_log_action_check
    CHECK (action IN ('advise', 'log', 'backfill', 'token_rejected'));
