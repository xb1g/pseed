-- Server-authoritative growth count = completed path explorations.
-- Reads path_enrollments.status='explored' — NOT client-side user_events (duplicatable).
CREATE OR REPLACE FUNCTION public_profile_growth_count(p_user_id uuid)
RETURNS integer LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT COALESCE(
    (
      SELECT COUNT(*)::integer
      FROM path_enrollments
      WHERE user_id = p_user_id
        AND status = 'explored'
    ),
    0
  );
$$;

-- Grant anon + authenticated (app uses anon key from device)
GRANT EXECUTE ON FUNCTION public_profile_growth_count(uuid) TO anon, authenticated;
