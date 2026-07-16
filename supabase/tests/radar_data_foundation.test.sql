BEGIN;
SELECT plan(28);

SELECT has_table('public', 'radar_skills', 'radar_skills exists');
SELECT has_table('public', 'radar_field_skills', 'radar_field_skills exists');
SELECT has_table('public', 'radar_skill_jobs', 'radar_skill_jobs exists');
SELECT has_table('public', 'radar_skill_start_options', 'radar_skill_start_options exists');
SELECT has_table('public', 'radar_interest_events', 'radar_interest_events exists');

SELECT col_is_pk('public', 'radar_skills', 'id', 'radar skill ids are immutable primary keys');
SELECT col_is_pk('public', 'radar_skill_start_options', 'id', 'start option ids are immutable primary keys');
SELECT col_is_fk('public', 'radar_field_skills', 'field_id', 'field-skill rows reference radar fields');
SELECT col_is_fk('public', 'radar_field_skills', 'skill_id', 'field-skill rows reference radar skills');
SELECT col_is_fk('public', 'radar_skill_jobs', 'field_id', 'skill-job rows reference Radar careers');
SELECT col_is_fk('public', 'radar_interest_events', 'start_option_id', 'interest events belong to one start option');

SELECT isnt_empty(
  $$SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.radar_skill_start_options'::regclass
      AND contype = 'c'
      AND pg_get_constraintdef(oid) LIKE '%youtube%resource%course%pathlab%project%community%'$$,
  'start option kinds are constrained'
);

SELECT isnt_empty(
  $$SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.radar_interest_events'::regclass
      AND contype = 'c'
      AND pg_get_constraintdef(oid) LIKE '%interested%opened%saved%dismissed%not_interested%'$$,
  'interest event kinds are constrained'
);

SELECT is(
  (SELECT relrowsecurity FROM pg_class WHERE oid = 'public.radar_skills'::regclass),
  true,
  'radar skills use RLS'
);
SELECT is(
  (SELECT relrowsecurity FROM pg_class WHERE oid = 'public.radar_interest_events'::regclass),
  true,
  'radar interest events use RLS'
);

SELECT has_function(
  'public',
  'record_radar_interest',
  ARRAY['uuid', 'text', 'text', 'jsonb'],
  'validated interest RPC exists'
);
SELECT function_returns(
  'public',
  'record_radar_interest',
  ARRAY['uuid', 'text', 'text', 'jsonb'],
  'uuid',
  'interest RPC returns its server-generated immutable id'
);

SELECT is(
  (SELECT proconfig @> ARRAY['search_path=""']
   FROM pg_proc
   WHERE oid = 'private.record_radar_interest(uuid,text,text,jsonb)'::regprocedure),
  true,
  'security definer interest writer has an empty search_path'
);
SELECT is(
  has_function_privilege(
    'anon',
    'private.record_radar_interest(uuid,text,text,jsonb)',
    'EXECUTE'
  ),
  false,
  'private interest writer is not executable by clients'
);

SELECT is(
  has_table_privilege('anon', 'public.radar_interest_events', 'INSERT'),
  false,
  'clients cannot bypass the validated interest RPC'
);

INSERT INTO public.radar_fields (
  id, slug, name_th, name_en, tagline_th, tagline_en, color, is_published
) VALUES
  ('10000000-0000-0000-0000-000000000001', 'radar-foundation-published',
   'สายงานทดสอบ', 'Test field', 'คำโปรย', 'Tagline', '#000000', true),
  ('10000000-0000-0000-0000-000000000002', 'radar-foundation-draft',
   'สายงานร่าง', 'Draft field', 'คำโปรย', 'Tagline', '#000000', false);

INSERT INTO public.radar_skills (
  id, namespace, slug, name_th, name_en, is_published
) VALUES
  ('20000000-0000-0000-0000-000000000001', 'career', 'published-skill',
   'ทักษะเผยแพร่', 'Published skill', true),
  ('20000000-0000-0000-0000-000000000002', 'career', 'draft-skill',
   'ทักษะร่าง', 'Draft skill', false);

INSERT INTO public.radar_field_skills (field_id, skill_id) VALUES
  ('10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001'),
  ('10000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000002');

INSERT INTO public.radar_skill_start_options (
  id, skill_id, kind, title_th, destination_url, is_published, sort_order
) VALUES
  ('30000000-0000-0000-0000-000000000001',
   '20000000-0000-0000-0000-000000000001',
   'youtube', 'ดูวิดีโอแนะนำ', 'https://www.youtube.com/watch?v=example', true, 0),
  ('30000000-0000-0000-0000-000000000002',
   '20000000-0000-0000-0000-000000000001',
   'project', 'ลองทำโปรเจกต์', 'https://example.com/project', true, 1),
  ('30000000-0000-0000-0000-000000000003',
   '20000000-0000-0000-0000-000000000001',
   'resource', 'ฉบับร่าง', 'https://example.com/draft', false, 2);

SET ROLE anon;
SELECT is(
  (SELECT count(*) FROM public.radar_skills
   WHERE namespace = 'career' AND slug IN ('published-skill', 'draft-skill')),
  1::bigint,
  'anonymous reads only published skills'
);
SELECT is(
  (SELECT count(*) FROM public.radar_field_skills
   WHERE field_id IN (
     '10000000-0000-0000-0000-000000000001',
     '10000000-0000-0000-0000-000000000002'
   )),
  1::bigint,
  'anonymous reads field skills only when both parents are published'
);
SELECT is(
  (SELECT count(*) FROM public.radar_skill_start_options
   WHERE skill_id = '20000000-0000-0000-0000-000000000001'),
  2::bigint,
  'anonymous reads only published start options'
);
SELECT throws_ok(
  $$INSERT INTO public.radar_interest_events
      (start_option_id, session_id, event_type)
    VALUES
      ('30000000-0000-0000-0000-000000000001', 'session-direct', 'interested')$$,
  '42501',
  NULL,
  'anonymous cannot insert interest events directly'
);
SELECT lives_ok(
  $$SELECT public.record_radar_interest(
      '30000000-0000-0000-0000-000000000001',
      'interested',
      'session-one',
      '{"surface":"skill-list"}'::jsonb
    )$$,
  'anonymous records interest through the validated RPC'
);
SELECT lives_ok(
  $$SELECT public.record_radar_interest(
      '30000000-0000-0000-0000-000000000002',
      'interested',
      'session-one',
      '{}'::jsonb
    )$$,
  'each start option accepts its own interest signal'
);
SELECT lives_ok(
  $$SELECT public.record_radar_interest(
      '30000000-0000-0000-0000-000000000002',
      'not_interested',
      'session-one',
      '{}'::jsonb
    )$$,
  'anonymous records negative intent through the validated RPC'
);
RESET ROLE;

SELECT is(
  (SELECT count(DISTINCT start_option_id)
   FROM public.radar_interest_events
   WHERE session_id = 'session-one'),
  2::bigint,
  'interest signals remain attributable to separate start options'
);

SELECT * FROM finish();
ROLLBACK;
