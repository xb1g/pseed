-- PostgREST requires table-level mutation privileges. Keep audit and identity
-- fields protected in the database while RLS limits mutations to staff.

GRANT INSERT, UPDATE ON TABLE public.work_items TO authenticated;

CREATE OR REPLACE FUNCTION private.enforce_work_item_audit_fields()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    NEW.created_by = auth.uid();
    NEW.created_at = now();
    NEW.updated_at = now();
    RETURN NEW;
  END IF;

  IF NEW.id IS DISTINCT FROM OLD.id
    OR NEW.area IS DISTINCT FROM OLD.area
    OR NEW.kind IS DISTINCT FROM OLD.kind
    OR NEW.created_by IS DISTINCT FROM OLD.created_by
    OR NEW.created_at IS DISTINCT FROM OLD.created_at
  THEN
    RAISE EXCEPTION USING
      ERRCODE = '42501',
      MESSAGE = 'Work item identity and audit fields are immutable';
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION private.enforce_work_item_audit_fields() FROM PUBLIC;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_trigger
    WHERE tgname = 'enforce_work_item_audit_fields'
      AND tgrelid = 'public.work_items'::regclass
  ) THEN
    CREATE TRIGGER enforce_work_item_audit_fields
      BEFORE INSERT OR UPDATE ON public.work_items
      FOR EACH ROW
      EXECUTE FUNCTION private.enforce_work_item_audit_fields();
  END IF;
END;
$$;
