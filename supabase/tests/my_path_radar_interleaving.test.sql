\set ON_ERROR_STOP on

-- Run directly against local Supabase:
-- psql "$DATABASE_URL" -f supabase/tests/my_path_radar_interleaving.test.sql
-- Everything is rolled back, including the migrations loaded for isolation.
begin;

select to_regclass('public.my_paths') is null as load_my_path_migrations \gset
\if :load_my_path_migrations
\ir ../migrations/20260716090319_create_my_path_journey.sql
\ir ../migrations/20260719120000_extend_my_path_event_types.sql
\ir ../migrations/20260721191523_sync_radar_intent_into_my_path.sql
\ir ../migrations/20260721193402_prevent_stale_radar_state_regressions.sql
\ir ../migrations/20260721194303_make_stale_plan_sync_saved_limit_safe.sql
\endif

create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
select plan(8);

insert into auth.users (id)
values ('90000000-0000-0000-0000-000000000001')
on conflict (id) do nothing;

insert into public.radar_fields (
  id, slug, name_th, name_en, tagline_th, tagline_en, color, is_published
) values (
  '90000000-0000-0000-0000-000000000002',
  'radar-interleaving-fixture',
  'สายงานทดสอบ',
  'Interleaving test career',
  'คำโปรยทดสอบ',
  'Test tagline',
  '#000000',
  true
) on conflict (slug) do update set is_published = true;

select set_config(
  'request.jwt.claim.sub',
  '90000000-0000-0000-0000-000000000001',
  true
);

-- The plan tab begins with three saved careers at T1.
select public.sync_my_path_journey(
  '{
    "version": 1,
    "draftId": "draft-initial",
    "entryKey": "mission-wizard",
    "possibilities": {
      "ai-business": {
        "state": "saved",
        "openedCount": 1,
        "savedAt": "2026-07-22T01:00:00Z",
        "updatedAt": "2026-07-22T01:00:00Z"
      },
      "data-analyst": {
        "state": "saved",
        "openedCount": 1,
        "savedAt": "2026-07-22T01:00:00Z",
        "updatedAt": "2026-07-22T01:00:00Z"
      },
      "ux-design": {
        "state": "saved",
        "openedCount": 1,
        "savedAt": "2026-07-22T01:00:00Z",
        "updatedAt": "2026-07-22T01:00:00Z"
      }
    },
    "savedQuestions": [],
    "events": []
  }'::jsonb,
  '{"statement":"old direction","facets":["old"]}'::jsonb,
  '{
    "id":"initial-step",
    "kind":"review-direction",
    "title":"Review the old direction",
    "durationMinutes":10,
    "careerSlugs":[]
  }'::jsonb
);

-- Radar is newer: remove A at T2, then save D at T3. B/C/D are now saved.
select public.apply_my_path_radar_event(
  'radar-remove-a',
  'career_removed',
  'ai-business',
  '2026-07-22T02:00:00Z'::timestamptz
);
select public.apply_my_path_radar_event(
  'radar-save-d',
  'career_saved',
  'radar-interleaving-fixture',
  '2026-07-22T03:00:00Z'::timestamptz
);

-- The stale plan tab still says A/B/C are saved. Its unrelated goal,
-- timeline, direction, event, and step changes must nevertheless commit.
select public.sync_my_path_journey(
  '{
    "version": 1,
    "draftId": "draft-stale-tab",
    "entryKey": "mission-wizard",
    "possibilities": {
      "ai-business": {
        "state": "saved",
        "openedCount": 2,
        "savedAt": "2026-07-22T01:00:00Z",
        "updatedAt": "2026-07-22T01:00:00Z"
      },
      "data-analyst": {
        "state": "saved",
        "openedCount": 2,
        "savedAt": "2026-07-22T01:00:00Z",
        "updatedAt": "2026-07-22T01:00:00Z"
      },
      "ux-design": {
        "state": "saved",
        "openedCount": 2,
        "savedAt": "2026-07-22T01:00:00Z",
        "updatedAt": "2026-07-22T01:00:00Z"
      }
    },
    "savedQuestions": [],
    "events": [
      {
        "id":"goal-event-new",
        "type":"question_answered",
        "questionId":"locked-goal",
        "answerId":"scholarship",
        "occurredAt":"2026-07-22T04:00:00Z"
      },
      {
        "id":"timeline-event-new",
        "type":"question_answered",
        "questionId":"goal-timeline",
        "answerId":"3",
        "occurredAt":"2026-07-22T04:01:00Z"
      },
      {
        "id":"direction-event-new",
        "type":"direction_edited",
        "reason":"student-confirmed",
        "occurredAt":"2026-07-22T04:02:00Z"
      }
    ]
  }'::jsonb,
  '{"statement":"fresh plan direction","facets":["scholarship","3-months"]}'::jsonb,
  '{
    "id":"fresh-step",
    "kind":"pathlab",
    "title":"Try the matching PathLab",
    "detail":"Build evidence for the fresh goal.",
    "pathLabHref":"/seeds/pathlab/radar-interleaving-fixture",
    "durationMinutes":15,
    "careerSlugs":["radar-interleaving-fixture"]
  }'::jsonb
);

select is(
  (
    select state
    from public.my_path_possibilities
    where user_id = '90000000-0000-0000-0000-000000000001'
      and radar_slug = 'ai-business'
  ),
  'removed',
  'stale plan sync preserves the newer Radar removal'
);

select set_eq(
  $$
    select radar_slug
    from public.my_path_possibilities
    where user_id = '90000000-0000-0000-0000-000000000001'
      and state = 'saved'
  $$,
  $$
    values
      ('data-analyst'::text),
      ('radar-interleaving-fixture'::text),
      ('ux-design'::text)
  $$,
  'B/C/D remain the three saved careers'
);

select is(
  (
    select direction_hypothesis
    from public.my_paths
    where user_id = '90000000-0000-0000-0000-000000000001'
  ),
  'fresh plan direction',
  'unrelated direction update commits'
);

select is(
  (
    select direction_facets
    from public.my_paths
    where user_id = '90000000-0000-0000-0000-000000000001'
  ),
  array['scholarship', '3-months']::text[],
  'unrelated direction facets commit'
);

select ok(
  exists (
    select 1
    from public.my_path_events
    where user_id = '90000000-0000-0000-0000-000000000001'
      and client_event_id = 'goal-event-new'
      and event_type = 'question_answered'
      and payload @> '{"questionId":"locked-goal","answerId":"scholarship"}'::jsonb
  ),
  'goal event commits'
);

select ok(
  exists (
    select 1
    from public.my_path_events
    where user_id = '90000000-0000-0000-0000-000000000001'
      and client_event_id = 'timeline-event-new'
      and event_type = 'question_answered'
      and payload @> '{"questionId":"goal-timeline","answerId":"3"}'::jsonb
  ),
  'timeline event commits'
);

select is(
  (
    select count(*)
    from public.my_path_events
    where user_id = '90000000-0000-0000-0000-000000000001'
      and client_event_id in (
        'goal-event-new', 'timeline-event-new', 'direction-event-new'
      )
  ),
  3::bigint,
  'the unrelated event batch commits atomically'
);

select ok(
  exists (
    select 1
    from public.my_path_steps
    where user_id = '90000000-0000-0000-0000-000000000001'
      and external_key = 'fresh-step'
      and status = 'current'
  ),
  'the unrelated PathLab next step commits'
);

select * from finish();

rollback;
