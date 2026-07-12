CREATE TABLE public.radar_drafts (
  field_id uuid PRIMARY KEY REFERENCES public.radar_fields(id) ON DELETE CASCADE,
  content jsonb NOT NULL CHECK (
    jsonb_typeof(content) = 'object'
    AND pg_column_size(content) <= 1048576
  ),
  revision integer NOT NULL DEFAULT 1 CHECK (revision > 0),
  updated_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.radar_drafts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admins read radar drafts"
  ON public.radar_drafts FOR SELECT TO authenticated
  USING (public.is_admin((SELECT auth.uid())));

CREATE POLICY "admins create radar drafts"
  ON public.radar_drafts FOR INSERT TO authenticated
  WITH CHECK (
    public.is_admin((SELECT auth.uid()))
    AND updated_by = (SELECT auth.uid())
  );

CREATE POLICY "admins update radar drafts"
  ON public.radar_drafts FOR UPDATE TO authenticated
  USING (public.is_admin((SELECT auth.uid())))
  WITH CHECK (
    public.is_admin((SELECT auth.uid()))
    AND updated_by = (SELECT auth.uid())
  );

REVOKE ALL ON TABLE public.radar_drafts FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON TABLE public.radar_drafts TO authenticated;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_proc
    WHERE pronamespace = 'public'::regnamespace
      AND proname = 'touch_updated_at'
  ) THEN
    CREATE TRIGGER radar_drafts_updated_at
      BEFORE UPDATE ON public.radar_drafts
      FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
  END IF;
END;
$$;

COMMENT ON TABLE public.radar_drafts IS
  'One versioned WYSIWYG working draft per Career Radar field.';
