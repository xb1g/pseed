-- Durable source-sync evidence for the admin coverage console. These tables
-- are service-only: Deno writes them with the service role and the protected
-- Next.js admin page reads them server-side with the service role.

CREATE TABLE public.competition_sync_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  status text NOT NULL DEFAULT 'running'
    CHECK (status IN ('running', 'succeeded', 'partial', 'failed')),
  started_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  contester_reported_total integer,
  contester_fetched integer NOT NULL DEFAULT 0,
  contester_pages integer NOT NULL DEFAULT 0,
  contester_complete boolean NOT NULL DEFAULT false,
  devpost_reported_total integer,
  devpost_fetched integer NOT NULL DEFAULT 0,
  devpost_pages integer NOT NULL DEFAULT 0,
  devpost_complete boolean NOT NULL DEFAULT false,
  promoted_count integer NOT NULL DEFAULT 0,
  error_code text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (completed_at IS NULL OR completed_at >= started_at)
);

CREATE INDEX competition_sync_runs_started_idx
  ON public.competition_sync_runs (started_at DESC);

ALTER TABLE public.competition_sync_runs ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.competition_source_items
  ADD COLUMN age_min smallint,
  ADD COLUMN age_max smallint,
  ADD COLUMN eligibility_status text NOT NULL DEFAULT 'needs_review'
    CHECK (eligibility_status IN ('eligible', 'ineligible', 'needs_review')),
  ADD COLUMN eligibility_reason text,
  ADD COLUMN sync_run_id uuid REFERENCES public.competition_sync_runs(id)
    ON DELETE SET NULL;

CREATE INDEX competition_source_items_review_idx
  ON public.competition_source_items (source, eligibility_status, deadline)
  WHERE is_open;

CREATE INDEX competition_source_items_sync_run_idx
  ON public.competition_source_items (sync_run_id);
