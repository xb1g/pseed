-- =============================================================================
-- student_plans table
-- Playbook ref: docs/research/2026-08-13-dm-lead-reply-playbook.md §1.2, §2.2, §2.3
--
-- Stores generated student portfolio plans, accessible via unique /plan/[token]
-- URLs. Used for student conversion, parent proof, and DM poster distribution.
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.student_plans (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token               text NOT NULL UNIQUE,
  conversation_id     uuid REFERENCES public.dm_conversations(id) ON DELETE SET NULL,
  student_name        text NOT NULL,
  grade_level         text NOT NULL, -- e.g. 'ม.4', 'ม.5', 'ม.6'
  target_field        text NOT NULL, -- e.g. 'วิศวกรรมเครื่องกล / ยานยนต์'
  readiness_score     smallint NOT NULL DEFAULT 2 CHECK (readiness_score BETWEEN 1 AND 8),
  ranked_priorities   jsonb NOT NULL DEFAULT '[]'::jsonb,
  timeline            jsonb NOT NULL DEFAULT '[]'::jsonb,
  step_one_action     jsonb NOT NULL DEFAULT '{}'::jsonb,
  parent_notes        text,
  custom_advice       text,
  view_count          integer NOT NULL DEFAULT 0,
  last_viewed_at      timestamptz,
  created_by          uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_student_plans_token
  ON public.student_plans (token);

CREATE INDEX IF NOT EXISTS idx_student_plans_conversation
  ON public.student_plans (conversation_id);

CREATE INDEX IF NOT EXISTS idx_student_plans_created_at
  ON public.student_plans (created_at DESC);

-- ---------------------------------------------------------------------------
-- Trigger: updated_at
-- ---------------------------------------------------------------------------

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column'
  ) THEN
    CREATE TRIGGER set_student_plans_updated_at
      BEFORE UPDATE ON public.student_plans
      FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END
$$;

-- ---------------------------------------------------------------------------
-- RLS Policies
-- Public read by token (students and parents need to view their plan without login)
-- Admin write (only admins/service role can create and edit plans)
-- ---------------------------------------------------------------------------

ALTER TABLE public.student_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "student_plans_public_read"
  ON public.student_plans FOR SELECT
  USING (true);

CREATE POLICY "student_plans_admin_write"
  ON public.student_plans FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
        AND role IN ('admin', 'passion_seed')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
        AND role IN ('admin', 'passion_seed')
    )
  );

-- ---------------------------------------------------------------------------
-- QR scan tracking
-- Poster QR codes point at /qr/plan/[token], which records the scan here and
-- redirects to /pathlab with utm params. Additive so a prod-first apply is safe.
-- ---------------------------------------------------------------------------

ALTER TABLE public.student_plans
  ADD COLUMN IF NOT EXISTS qr_scan_count integer NOT NULL DEFAULT 0;

ALTER TABLE public.student_plans
  ADD COLUMN IF NOT EXISTS last_qr_scanned_at timestamptz;

-- ---------------------------------------------------------------------------
-- Counter functions (called via RPC from server routes using the admin client)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.increment_plan_view(plan_token text)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.student_plans
  SET view_count = view_count + 1,
      last_viewed_at = now()
  WHERE token = plan_token;
$$;

CREATE OR REPLACE FUNCTION public.increment_plan_qr_scan(plan_token text)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.student_plans
  SET qr_scan_count = qr_scan_count + 1,
      last_qr_scanned_at = now()
  WHERE token = plan_token;
$$;
