-- Division-aware funnel: split High School vs University.
-- Team division = majority of its members' track (participants.track).

CREATE OR REPLACE VIEW public.hackathon_team_division WITH (security_invoker = on) AS
SELECT m.team_id,
       CASE WHEN sum((p.track ILIKE '%มหาวิทยาลัย%')::int) > sum((p.track ILIKE '%มัธยม%')::int)
            THEN 'university' ELSE 'high_school' END AS division
  FROM hackathon_team_members m
  JOIN hackathon_participants p ON p.id = m.participant_id
 GROUP BY m.team_id;

DROP VIEW IF EXISTS public.hackathon_learning_funnel;
CREATE VIEW public.hackathon_learning_funnel WITH (security_invoker = on) AS
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
       COALESCE(td.division, 'high_school') AS division,
       count(DISTINCT ts.team_id)::int AS teams
  FROM team_subs ts
  JOIN hackathon_program_phases pp ON pp.id = ts.phase_id
  LEFT JOIN hackathon_team_division td ON td.team_id = ts.team_id
 GROUP BY pp.phase_number, ts.display_order, ts.title, division
 ORDER BY pp.phase_number, ts.display_order;
