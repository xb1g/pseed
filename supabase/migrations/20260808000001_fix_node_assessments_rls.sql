-- Fix node_assessments RLS: ensure map creators, editors, and admins can manage assessments.
-- Previous migrations left conflicting policies.

-- Ensure RLS is enabled
ALTER TABLE public.node_assessments ENABLE ROW LEVEL SECURITY;

-- Grant table-level permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.node_assessments TO authenticated;
GRANT SELECT ON TABLE public.node_assessments TO anon;

-- Drop all existing assessment policies to start clean
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN
    SELECT policyname FROM pg_policies WHERE tablename = 'node_assessments' AND schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.node_assessments', pol.policyname);
  END LOOP;
END $$;

-- SELECT: anyone who can view the parent map's nodes
CREATE POLICY "view_assessments_policy" ON public.node_assessments
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.map_nodes mn
    JOIN public.learning_maps lm ON lm.id = mn.map_id
    WHERE mn.id = node_assessments.node_id
      AND (
        lm.visibility = 'public'
        OR lm.creator_id = auth.uid()
        OR public.is_admin(auth.uid())
        OR EXISTS (
          SELECT 1
          FROM public.classroom_maps cm
          WHERE cm.map_id = lm.id
            AND cm.is_active = true
            AND public.can_access_classroom(cm.classroom_id, auth.uid())
        )
      )
  )
);

-- Anon can view assessments on public maps
CREATE POLICY "anon_view_assessments_policy" ON public.node_assessments
FOR SELECT TO anon
USING (
  EXISTS (
    SELECT 1
    FROM public.map_nodes mn
    JOIN public.learning_maps lm ON lm.id = mn.map_id
    WHERE mn.id = node_assessments.node_id
      AND lm.visibility = 'public'
  )
);

-- INSERT/UPDATE/DELETE: map creator, editor, or admin
CREATE POLICY "manage_assessments_policy" ON public.node_assessments
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.map_nodes mn
    JOIN public.learning_maps lm ON lm.id = mn.map_id
    WHERE mn.id = node_assessments.node_id
      AND (
        lm.creator_id = auth.uid()
        OR public.is_admin(auth.uid())
        OR EXISTS (
          SELECT 1
          FROM public.map_editors me
          WHERE me.map_id = lm.id AND me.user_id = auth.uid()
        )
      )
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.map_nodes mn
    JOIN public.learning_maps lm ON lm.id = mn.map_id
    WHERE mn.id = node_assessments.node_id
      AND (
        lm.creator_id = auth.uid()
        OR public.is_admin(auth.uid())
        OR EXISTS (
          SELECT 1
          FROM public.map_editors me
          WHERE me.map_id = lm.id AND me.user_id = auth.uid()
        )
      )
  )
);
