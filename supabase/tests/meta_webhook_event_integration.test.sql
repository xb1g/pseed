BEGIN;
SELECT plan(24);

SELECT has_table('public', 'dm_message_attachments', 'DM attachments table exists');
SELECT has_table('public', 'dm_message_reactions', 'DM reactions table exists');
SELECT has_table('public', 'meta_webhook_receipts', 'Meta webhook receipts table exists');
SELECT has_table('public', 'meta_webhook_events', 'Meta webhook events table exists');

SELECT is(
  (SELECT relrowsecurity FROM pg_class WHERE oid = 'public.dm_message_attachments'::regclass),
  true,
  'DM attachments use RLS'
);
SELECT is(
  (SELECT relrowsecurity FROM pg_class WHERE oid = 'public.dm_message_reactions'::regclass),
  true,
  'DM reactions use RLS'
);
SELECT is(
  (SELECT relrowsecurity FROM pg_class WHERE oid = 'public.meta_webhook_receipts'::regclass),
  true,
  'Meta webhook receipts use RLS'
);
SELECT is(
  (SELECT relrowsecurity FROM pg_class WHERE oid = 'public.meta_webhook_events'::regclass),
  true,
  'Meta webhook events use RLS'
);

SELECT is(has_table_privilege('anon', 'public.dm_message_attachments', 'SELECT'), false, 'anon cannot read attachments');
SELECT is(has_table_privilege('anon', 'public.dm_message_reactions', 'SELECT'), false, 'anon cannot read reactions');
SELECT is(has_table_privilege('anon', 'public.meta_webhook_receipts', 'SELECT'), false, 'anon cannot read receipts');
SELECT is(has_table_privilege('anon', 'public.meta_webhook_events', 'SELECT'), false, 'anon cannot read event audit');

SELECT is(has_table_privilege('authenticated', 'public.meta_webhook_receipts', 'INSERT'), false, 'authenticated clients cannot insert receipts');
SELECT is(has_table_privilege('authenticated', 'public.meta_webhook_receipts', 'UPDATE'), false, 'authenticated clients cannot update receipts');
SELECT is(has_table_privilege('authenticated', 'public.meta_webhook_receipts', 'DELETE'), false, 'authenticated clients cannot delete receipts');
SELECT is(has_table_privilege('authenticated', 'public.meta_webhook_events', 'INSERT'), false, 'authenticated clients cannot insert event audit');
SELECT is(has_table_privilege('authenticated', 'public.meta_webhook_events', 'UPDATE'), false, 'authenticated clients cannot update event audit');
SELECT is(has_table_privilege('authenticated', 'public.meta_webhook_events', 'DELETE'), false, 'authenticated clients cannot delete event audit');

SELECT is(
  (SELECT count(*) FROM pg_policies WHERE schemaname = 'public' AND tablename = 'meta_webhook_receipts'),
  1::bigint,
  'receipts expose only one admin-select policy'
);
SELECT is(
  (SELECT count(*) FROM pg_policies WHERE schemaname = 'public' AND tablename = 'meta_webhook_events'),
  1::bigint,
  'event audit exposes only one admin-select policy'
);

SELECT is(
  has_function_privilege('anon', 'private.cleanup_meta_webhook_raw_payloads()', 'EXECUTE'),
  false,
  'anon cannot execute raw-payload cleanup'
);
SELECT is(
  has_function_privilege('authenticated', 'private.cleanup_meta_webhook_raw_payloads()', 'EXECUTE'),
  false,
  'authenticated clients cannot execute raw-payload cleanup'
);
SELECT is(
  (SELECT proconfig @> ARRAY['search_path=""']
   FROM pg_proc
   WHERE oid = 'private.cleanup_meta_webhook_raw_payloads()'::regprocedure),
  true,
  'cleanup function has an empty search_path'
);

INSERT INTO public.meta_webhook_receipts (
  id, object_type, body_sha256, entry_count, event_count
) VALUES (
  '10000000-0000-0000-0000-000000000001', 'instagram', repeat('a', 64), 1, 1
);

INSERT INTO public.meta_webhook_events (
  receipt_id, dedupe_key, event_kind, processing_status, raw_payload, created_at
) VALUES (
  '10000000-0000-0000-0000-000000000001',
  'unknown:test',
  'event.unknown',
  'ignored',
  '{"safe_test":true}'::jsonb,
  now() - interval '31 days'
);

SELECT is(
  private.cleanup_meta_webhook_raw_payloads(),
  1,
  'cleanup clears expired raw event payloads'
);

SELECT * FROM finish();
ROLLBACK;
