-- supabase/tests/public_profiles_rls.test.sql
BEGIN;
SELECT plan(7);

-- Test 1: Private row invisible to anon
INSERT INTO public_profiles (user_id, is_public)
  VALUES ('00000000-0000-0000-0000-000000000001', false);
SET ROLE anon;
SELECT is(
  (SELECT COUNT(*) FROM public_profiles WHERE user_id = '00000000-0000-0000-0000-000000000001'),
  0::bigint,
  'anon cannot see private row'
);
RESET ROLE;

-- Test 2: Public row visible to anon
UPDATE public_profiles SET is_public = true WHERE user_id = '00000000-0000-0000-0000-000000000001';
SET ROLE anon;
SELECT is(
  (SELECT COUNT(*) FROM public_profiles WHERE user_id = '00000000-0000-0000-0000-000000000001'),
  1::bigint,
  'anon can see public row'
);
RESET ROLE;

-- Test 3: Handle uniqueness enforced
INSERT INTO public_profiles (user_id, handle, is_public)
  VALUES ('00000000-0000-0000-0000-000000000002', 'testhandle', false);
SELECT throws_ok(
  $$INSERT INTO public_profiles (user_id, handle) VALUES ('00000000-0000-0000-0000-000000000003', 'testhandle')$$,
  'unique_violation',
  NULL,
  'duplicate handle raises unique violation'
);

-- Test 4: Handle format constraint
SELECT throws_ok(
  $$INSERT INTO public_profiles (user_id, handle) VALUES ('00000000-0000-0000-0000-000000000004', 'AB')$$,
  'check_violation',
  NULL,
  'invalid handle format rejected'
);

-- Test 5: class_slug CHECK constraint
SELECT throws_ok(
  $$INSERT INTO public_profiles (user_id, class_slug) VALUES ('00000000-0000-0000-0000-000000000005', 'wizard')$$,
  'check_violation',
  NULL,
  'invalid class_slug rejected'
);

-- Test 6: published_sections validation in RPC
-- (set_profile_visibility rejects unknown sections)
SELECT throws_ok(
  $$SELECT set_profile_visibility('00000000-0000-0000-0000-000000000001', true, ARRAY['unknown_section'])$$,
  NULL,
  'invalid section',
  'set_profile_visibility rejects unknown section'
);

-- Test 7: growth RPC returns 0 for user with no completions
SELECT is(
  public_profile_growth_count('00000000-0000-0000-0000-000000000099'),
  0,
  'growth_count returns 0 for unknown user'
);

SELECT * FROM finish();
ROLLBACK;
