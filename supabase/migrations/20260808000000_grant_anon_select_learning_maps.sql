-- Allow anonymous users to SELECT public learning maps.
-- The security hardening sweep (20260331) revoked ALL from anon but
-- the maps browse page needs to show public maps to unauthenticated visitors.

GRANT SELECT ON TABLE public.learning_maps TO anon;

-- Add a SELECT policy for anon that only exposes public-visibility maps.
DROP POLICY IF EXISTS "anon_view_public_maps" ON public.learning_maps;
CREATE POLICY "anon_view_public_maps" ON public.learning_maps
FOR SELECT TO anon
USING (visibility = 'public');
