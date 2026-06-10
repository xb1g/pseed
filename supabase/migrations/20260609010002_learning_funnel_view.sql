-- Activity-level drop-off funnel for the learning-analytics dashboard.
-- Distinct teams that made a submitted submission for each activity, ordered by phase.
-- security_invoker so it respects the querying role; admin/service-role reads it.

CREATE OR REPLACE VIEW public.hackathon_learning_funnel WITH (security_invoker = on) AS
WITH team_subs AS (
  SELECT DISTINCT a.phase_id, a.display_order, a.title, m.team_id
    FROM hackathon_phase_activity_submissions s
    JOIN hackathon_team_members m ON m.participant_id = s.participant_id
    JOIN hackathon_phase_activities a ON a.id = s.activity_id
   WHERE s.status = 'submitted'
  UNION
  SELECT DISTINCT a.phase_id, a.display_order, a.title, ts.team_id
    FROM hackathon_phase_activity_team_submissions ts
    JOIN hackathon_phase_activities a ON a.id = ts.activity_id
   WHERE ts.status = 'submitted'
)
SELECT pp.phase_number,
       ts.display_order,
       ts.title,
       count(DISTINCT ts.team_id)::int AS teams
  FROM team_subs ts
  JOIN hackathon_program_phases pp ON pp.id = ts.phase_id
 GROUP BY pp.phase_number, ts.display_order, ts.title
 ORDER BY pp.phase_number, ts.display_order;
