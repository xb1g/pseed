-- Make the staff boundary legible to the database advisor and index the audit FK.

CREATE INDEX IF NOT EXISTS work_items_created_by_idx
  ON public.work_items (created_by)
  WHERE created_by IS NOT NULL;

DROP POLICY IF EXISTS "PassionSeed staff can read work items" ON public.work_items;
CREATE POLICY "PassionSeed staff can read work items"
  ON public.work_items
  FOR SELECT
  TO authenticated
  USING (
    NOT (SELECT COALESCE((auth.jwt() ->> 'is_anonymous')::boolean, false))
    AND (SELECT public.pseed_is_admin())
  );

DROP POLICY IF EXISTS "PassionSeed staff can create work items" ON public.work_items;
CREATE POLICY "PassionSeed staff can create work items"
  ON public.work_items
  FOR INSERT
  TO authenticated
  WITH CHECK (
    NOT (SELECT COALESCE((auth.jwt() ->> 'is_anonymous')::boolean, false))
    AND (SELECT public.pseed_is_admin())
    AND created_by = (SELECT auth.uid())
  );

DROP POLICY IF EXISTS "PassionSeed staff can update work items" ON public.work_items;
CREATE POLICY "PassionSeed staff can update work items"
  ON public.work_items
  FOR UPDATE
  TO authenticated
  USING (
    NOT (SELECT COALESCE((auth.jwt() ->> 'is_anonymous')::boolean, false))
    AND (SELECT public.pseed_is_admin())
  )
  WITH CHECK (
    NOT (SELECT COALESCE((auth.jwt() ->> 'is_anonymous')::boolean, false))
    AND (SELECT public.pseed_is_admin())
  );
