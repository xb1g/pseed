-- Security fix: pseed_due_reminders was executable by `anon`.
--
-- `20260731230000` revoked EXECUTE from PUBLIC and authenticated, which is not
-- enough. Supabase grants EXECUTE on functions in the public schema to `anon`
-- and `authenticated` directly through default privileges, and a direct grant
-- is not removed by revoking from PUBLIC. The function therefore stayed
-- callable with the anon key, which is shipped to every browser.
--
-- What that exposed: for any cohort id, the display name, Discord snowflake,
-- and upcoming voice-session times of every participant with a reminder due —
-- i.e. when a named person intends to be online, to anyone who could read the
-- anon key out of the client bundle. For a programme serving minors that is the
-- worst shape of leak available in this schema.
--
-- `20260801000000` got this right for its own functions by revoking `anon`
-- explicitly. This migration applies the same treatment to the one that
-- predates it, and is written to be safe to re-run.

DO $$
DECLARE
  fn text;
BEGIN
  FOREACH fn IN ARRAY ARRAY[
    'public.pseed_due_reminders(uuid, timestamptz)',
    'public.pseed_voice_join(uuid, text, text, timestamptz)',
    'public.pseed_voice_leave(text, timestamptz)',
    'public.pseed_voice_close_all(uuid, timestamptz)',
    'public.pseed_log_reminder(uuid, timestamptz, text)',
    'public.pseed_stats_for_discord_user(uuid, text)'
  ]
  LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC', fn);
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM anon', fn);
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM authenticated', fn);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO service_role', fn);
  END LOOP;
END;
$$;
