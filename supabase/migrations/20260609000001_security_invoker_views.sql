-- =====================================================
-- SECURITY LINT FIX: security_definer_view (7 views)
-- =====================================================
-- Recreate each analytics/admin-facing view WITH (security_invoker = on)
-- so the view runs with the *querying user's* privileges (and RLS), instead
-- of the view owner's. This resolves the Supabase `security_definer_view`
-- linter findings.
--
-- CREATE OR REPLACE VIEW preserves existing GRANTs and dependent objects, so
-- no re-grant is required and no DROP is needed (the column sets are unchanged).
-- The SELECT bodies below are reproduced verbatim from the original defining
-- migrations:
--   * analytics_seed_velocity_*           -> 20260401121500_seed_velocity_analytics.sql
--   * analytics_retention_summary         -> 20260415000000_create_retention_analytics_views.sql
--   * phase3_leaderboard_cycles / funnel  -> 20260511000000_hackathon_phase3.sql
--   * phase3_team_score_breakdown         -> 20260513000000_hackathon_phase3_scoring.sql
--
-- Note: with security_invoker the querying role now needs SELECT on the
-- underlying tables. These views are authenticated admin/analytics surfaces;
-- existing grants remain intact via CREATE OR REPLACE.
--
-- Idempotent / safely re-runnable.
-- =====================================================

BEGIN;

-- ------------------------------------------------------------------
-- analytics_seed_velocity_user_metrics
-- ------------------------------------------------------------------
CREATE OR REPLACE VIEW public.analytics_seed_velocity_user_metrics
WITH (security_invoker = on) AS
with seed_progress as (
  select
    pe.user_id,
    count(*) as seeds_started,
    count(*) filter (where pe.status = 'explored') as seeds_completed,
    count(distinct s.category_id) filter (where s.category_id is not null) as categories_explored
  from public.path_enrollments pe
  join public.paths p
    on p.id = pe.path_id
  join public.seeds s
    on s.id = p.seed_id
  group by pe.user_id
),
direction_finder as (
  select
    ue.user_id,
    count(*) as direction_finder_views,
    min(ue.created_at) as first_direction_finder_view_at
  from public.user_events ue
  where ue.event_type = 'direction_finder_viewed'
  group by ue.user_id
),
completion_timeline as (
  select
    pe.user_id,
    pe.completed_at,
    row_number() over (
      partition by pe.user_id
      order by pe.completed_at asc, pe.id asc
    ) as completed_seed_count
  from public.path_enrollments pe
  where pe.status = 'explored'
    and pe.completed_at is not null
),
first_df_seed_count as (
  select
    df.user_id,
    coalesce(
      max(ct.completed_seed_count) filter (
        where ct.completed_at <= df.first_direction_finder_view_at
      ),
      0
    ) as seeds_completed_before_first_df_view
  from direction_finder df
  left join completion_timeline ct
    on ct.user_id = df.user_id
  group by df.user_id
)
select
  coalesce(sp.user_id, df.user_id) as user_id,
  coalesce(sp.seeds_started, 0) as seeds_started,
  coalesce(sp.seeds_completed, 0) as seeds_completed,
  coalesce(sp.categories_explored, 0) as categories_explored,
  coalesce(df.direction_finder_views, 0) as direction_finder_views,
  df.first_direction_finder_view_at,
  coalesce(fd.seeds_completed_before_first_df_view, 0) as seeds_completed_before_first_df_view,
  (coalesce(df.direction_finder_views, 0) > 0) as has_direction_finder_engaged,
  (coalesce(sp.seeds_completed, 0) >= 1) as milestone_1_completed,
  (coalesce(sp.seeds_completed, 0) >= 2) as milestone_2_completed,
  (coalesce(sp.seeds_completed, 0) >= 3) as milestone_3_completed,
  (coalesce(sp.seeds_completed, 0) >= 5) as milestone_5_completed,
  (
    coalesce(sp.seeds_completed, 0) >= 3
    and coalesce(df.direction_finder_views, 0) > 0
  ) as hypothesis_3_seeds_signal
from seed_progress sp
full outer join direction_finder df
  on df.user_id = sp.user_id
left join first_df_seed_count fd
  on fd.user_id = coalesce(sp.user_id, df.user_id);

-- ------------------------------------------------------------------
-- analytics_seed_velocity_engagement_by_seed_count
-- ------------------------------------------------------------------
CREATE OR REPLACE VIEW public.analytics_seed_velocity_engagement_by_seed_count
WITH (security_invoker = on) AS
select
  seeds_completed,
  count(*) as users_at_seed_count,
  count(*) filter (where has_direction_finder_engaged) as engaged_users,
  round(
    count(*) filter (where has_direction_finder_engaged)::numeric / nullif(count(*), 0),
    4
  ) as direction_finder_engagement_rate
from public.analytics_seed_velocity_user_metrics
group by seeds_completed
order by seeds_completed;

-- ------------------------------------------------------------------
-- analytics_seed_velocity_dashboard
-- ------------------------------------------------------------------
CREATE OR REPLACE VIEW public.analytics_seed_velocity_dashboard
WITH (security_invoker = on) AS
with engagement as (
  select *
  from public.analytics_seed_velocity_engagement_by_seed_count
),
aha as (
  select min(seeds_completed) as aha_seed_count
  from engagement
  where direction_finder_engagement_rate >= 0.5
)
select
  (
    select round(avg(seeds_completed_before_first_df_view)::numeric, 2)
    from public.analytics_seed_velocity_user_metrics
    where has_direction_finder_engaged
  ) as avg_seeds_to_first_direction_finder_view,
  coalesce(aha.aha_seed_count, 0) as aha_seed_count,
  coalesce(
    (
      select direction_finder_engagement_rate
      from engagement
      where seeds_completed = 3
    ),
    0
  ) as engagement_rate_at_3_seeds,
  (
    coalesce(
      (
        select direction_finder_engagement_rate
        from engagement
        where seeds_completed = 3
      ),
      0
    ) >= 0.5
  ) as hypothesis_3_seeds_is_meaningful_signal
from aha;

-- ------------------------------------------------------------------
-- analytics_retention_summary
-- ------------------------------------------------------------------
CREATE OR REPLACE VIEW public.analytics_retention_summary
WITH (security_invoker = on) AS
SELECT
  CURRENT_DATE as report_date,
  (SELECT dau FROM analytics_daily_active_users ORDER BY activity_date DESC LIMIT 1) as current_dau,
  (SELECT wau FROM analytics_weekly_active_users ORDER BY activity_week DESC LIMIT 1) as current_wau,
  (SELECT mau FROM analytics_monthly_active_users ORDER BY activity_month DESC LIMIT 1) as current_mau,
  (SELECT dau FROM analytics_daily_active_users ORDER BY activity_date DESC OFFSET 1 LIMIT 1) as prev_dau,
  (SELECT wau FROM analytics_weekly_active_users ORDER BY activity_week DESC OFFSET 1 LIMIT 1) as prev_wau,
  (SELECT mau FROM analytics_monthly_active_users ORDER BY activity_month DESC OFFSET 1 LIMIT 1) as prev_mau,
  (SELECT COUNT(DISTINCT user_id) FROM analytics_user_cohorts) as total_users_ever,
  (SELECT COUNT(*) FROM analytics_user_cohorts WHERE is_active_last_7_days) as active_users_7d,
  (SELECT COUNT(*) FROM analytics_user_cohorts WHERE is_active_last_30_days) as active_users_30d,
  (SELECT avg_session_duration_min FROM analytics_session_duration ORDER BY session_date DESC LIMIT 1) as avg_session_min,
  -- Calculate week-over-week change percentages
  CASE
    WHEN (SELECT dau FROM analytics_daily_active_users ORDER BY activity_date DESC OFFSET 1 LIMIT 1) > 0
    THEN ROUND(
      ((SELECT dau FROM analytics_daily_active_users ORDER BY activity_date DESC LIMIT 1) -
       (SELECT dau FROM analytics_daily_active_users ORDER BY activity_date DESC OFFSET 1 LIMIT 1))::numeric /
      (SELECT dau FROM analytics_daily_active_users ORDER BY activity_date DESC OFFSET 1 LIMIT 1) * 100,
      2
    )
    ELSE 0
  END as dau_change_pct,
  CASE
    WHEN (SELECT wau FROM analytics_weekly_active_users ORDER BY activity_week DESC OFFSET 1 LIMIT 1) > 0
    THEN ROUND(
      ((SELECT wau FROM analytics_weekly_active_users ORDER BY activity_week DESC LIMIT 1) -
       (SELECT wau FROM analytics_weekly_active_users ORDER BY activity_week DESC OFFSET 1 LIMIT 1))::numeric /
      (SELECT wau FROM analytics_weekly_active_users ORDER BY activity_week DESC OFFSET 1 LIMIT 1) * 100,
      2
    )
    ELSE 0
  END as wau_change_pct,
  CASE
    WHEN (SELECT mau FROM analytics_monthly_active_users ORDER BY activity_month DESC OFFSET 1 LIMIT 1) > 0
    THEN ROUND(
      ((SELECT mau FROM analytics_monthly_active_users ORDER BY activity_month DESC LIMIT 1) -
       (SELECT mau FROM analytics_monthly_active_users ORDER BY activity_month DESC OFFSET 1 LIMIT 1))::numeric /
      (SELECT mau FROM analytics_monthly_active_users ORDER BY activity_month DESC OFFSET 1 LIMIT 1) * 100,
      2
    )
    ELSE 0
  END as mau_change_pct;

-- ------------------------------------------------------------------
-- phase3_leaderboard_cycles
-- ------------------------------------------------------------------
CREATE OR REPLACE VIEW public.phase3_leaderboard_cycles
WITH (security_invoker = on) AS
SELECT
  t.id AS team_id,
  t.name AS team_name,
  COUNT(DISTINCT c.cycle_number) AS cycles_completed,
  COUNT(DISTINCT ts.tester_name) AS distinct_testers,
  COUNT(DISTINCT ts.id) FILTER (WHERE ts.fresh_tester) AS fresh_testers,
  COUNT(DISTINCT rp.id) AS hypotheses_preregistered,
  MAX(ms.submitted_at) AS synthesis_submitted_at,
  MAX(vs.submitted_at) AS video_submitted_at
FROM public.hackathon_teams t
LEFT JOIN public.hackathon_phase3_cycles c ON c.team_id = t.id AND c.status = 'completed'
LEFT JOIN public.hackathon_phase3_test_sessions ts ON ts.team_id = t.id
LEFT JOIN public.hackathon_phase3_ritual_posts rp ON rp.team_id = t.id
LEFT JOIN public.hackathon_phase3_midphase_synthesis ms ON ms.team_id = t.id
LEFT JOIN public.hackathon_phase3_video_submissions vs ON vs.team_id = t.id
GROUP BY t.id, t.name;

-- ------------------------------------------------------------------
-- phase3_funnel
-- ------------------------------------------------------------------
CREATE OR REPLACE VIEW public.phase3_funnel
WITH (security_invoker = on) AS
SELECT
  t.id AS team_id,
  t.name AS team_name,
  MAX(c.cycle_number) AS current_cycle,
  MAX(c.status) AS current_status,
  MAX(c.gate_decision) AS last_gate_decision,
  COUNT(DISTINCT dc.id) FILTER (WHERE dc.status = 'submitted') AS checkins_submitted,
  COUNT(DISTINCT ts.id) AS total_test_sessions,
  COUNT(DISTINCT ts.id) FILTER (WHERE ts.fresh_tester) AS fresh_test_sessions,
  MAX(ms.confidence_score) AS confidence,
  CASE
    WHEN MAX(vs.submitted_at) IS NOT NULL THEN 'submitted'
    WHEN MAX(c.cycle_number) >= 2 THEN 'proceeding'
    WHEN MAX(c.cycle_number) = 1 THEN 'in_cycle_1'
    ELSE 'not_started'
  END AS funnel_stage
FROM public.hackathon_teams t
LEFT JOIN public.hackathon_phase3_cycles c ON c.team_id = t.id
LEFT JOIN public.hackathon_phase3_daily_checkins dc ON dc.team_id = t.id
LEFT JOIN public.hackathon_phase3_test_sessions ts ON ts.team_id = t.id
LEFT JOIN public.hackathon_phase3_midphase_synthesis ms ON ms.team_id = t.id
LEFT JOIN public.hackathon_phase3_video_submissions vs ON vs.team_id = t.id
GROUP BY t.id, t.name;

-- ------------------------------------------------------------------
-- phase3_team_score_breakdown
-- ------------------------------------------------------------------
CREATE OR REPLACE VIEW public.phase3_team_score_breakdown
WITH (security_invoker = on) AS
SELECT
  t.id AS team_id,
  t.name AS team_name,
  COALESCE((
    SELECT MAX(points_awarded)
    FROM public.hackathon_phase3_score_events
    WHERE team_id = t.id AND score_category = 'cycle'
  ), 0) AS best_cycle_score,
  COALESCE((
    SELECT MAX(points_awarded)
    FROM public.hackathon_phase3_score_events
    WHERE team_id = t.id AND score_category = 'midphase'
  ), 0) AS best_midphase_score,
  COALESCE((
    SELECT MAX(points_awarded)
    FROM public.hackathon_phase3_score_events
    WHERE team_id = t.id AND score_category = 'video'
  ), 0) AS best_video_score,
  COALESCE((
    SELECT MAX(points_awarded)
    FROM public.hackathon_phase3_score_events
    WHERE team_id = t.id AND score_category = 'module_quiz'
  ), 0) AS best_module_score,
  COALESCE((
    SELECT MAX(points_awarded)
    FROM public.hackathon_phase3_score_events
    WHERE team_id = t.id AND score_category = 'daily_checkin'
  ), 0) AS best_checkin_score,
  COALESCE((
    SELECT SUM(best_score)
    FROM (
      SELECT MAX(points_awarded) AS best_score
      FROM public.hackathon_phase3_score_events
      WHERE team_id = t.id
      GROUP BY score_category
    ) sq
  ), 0) AS phase3_total
FROM public.hackathon_teams t;

COMMIT;
