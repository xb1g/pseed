-- Cache authentication claims once per statement instead of once per row.

DROP POLICY IF EXISTS "PassionSeed staff can read work items" ON public.work_items;
CREATE POLICY "PassionSeed staff can read work items"
  ON public.work_items
  FOR SELECT
  TO authenticated
  USING (
    NOT COALESCE((((SELECT auth.jwt()) ->> 'is_anonymous'))::boolean, false)
    AND (SELECT public.pseed_is_admin())
  );

DROP POLICY IF EXISTS "PassionSeed staff can create work items" ON public.work_items;
CREATE POLICY "PassionSeed staff can create work items"
  ON public.work_items
  FOR INSERT
  TO authenticated
  WITH CHECK (
    NOT COALESCE((((SELECT auth.jwt()) ->> 'is_anonymous'))::boolean, false)
    AND (SELECT public.pseed_is_admin())
    AND created_by = (SELECT auth.uid())
  );

DROP POLICY IF EXISTS "PassionSeed staff can update work items" ON public.work_items;
CREATE POLICY "PassionSeed staff can update work items"
  ON public.work_items
  FOR UPDATE
  TO authenticated
  USING (
    NOT COALESCE((((SELECT auth.jwt()) ->> 'is_anonymous'))::boolean, false)
    AND (SELECT public.pseed_is_admin())
  )
  WITH CHECK (
    NOT COALESCE((((SELECT auth.jwt()) ->> 'is_anonymous'))::boolean, false)
    AND (SELECT public.pseed_is_admin())
  );
