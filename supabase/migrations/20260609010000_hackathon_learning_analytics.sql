-- Hackathon Learning Analytics (P1)
-- Results tables for the "Genuine Learning Index" admin feature: measures who actually
-- learned/grappled with the problem (process), validated against human semifinal scores
-- (outcome). All tables are admin/service-role only — RLS enabled with NO policy, accessed
-- via createAdminClient() in requireAdmin()-guarded routes (service role bypasses RLS),
-- matching the existing hackathon_team_direction_* pattern.

BEGIN;

-- =====================================================================
-- 1. Semifinal (Round 2) human judge scores — the OUTCOME ground truth.
--    Imported from the Round 2 Judge xlsx. One row per team per panel.
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.hackathon_semifinal_scores (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id         UUID REFERENCES public.hackathon_teams(id) ON DELETE SET NULL,
  raw_team_name   TEXT NOT NULL,                 -- name as it appears in the spreadsheet
  division        TEXT,                          -- 'high_school' | 'university'
  panel           TEXT,                          -- 'HS-G1' | 'HS-G2' | 'UNI'
  -- panel-mean per rubric criterion (1-10)
  score_problem      NUMERIC(4,2),
  score_solution     NUMERIC(4,2),
  score_market_fit   NUMERIC(4,2),
  score_readiness    NUMERIC(4,2),
  score_journey      NUMERIC(4,2),
  score_pitching     NUMERIC(4,2),
  total           NUMERIC(5,2),                  -- sum of the 6 means, out of 60
  judge_count     INTEGER,
  rank_in_panel   INTEGER,
  per_judge       JSONB NOT NULL DEFAULT '[]'::jsonb,   -- [{judge, scores{...}, comment}]
  comments        TEXT[]  NOT NULL DEFAULT '{}',
  match_method    TEXT,                          -- 'exact' | 'normalized' | 'fuzzy' | 'manual' | 'unmatched'
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS hackathon_semifinal_scores_team_idx ON public.hackathon_semifinal_scores(team_id);
-- one score row per team per panel (re-import is idempotent on this key)
CREATE UNIQUE INDEX IF NOT EXISTS hackathon_semifinal_scores_team_panel_key
  ON public.hackathon_semifinal_scores(team_id, panel) WHERE team_id IS NOT NULL;

-- =====================================================================
-- 2. Per-submission signals — the raw analyzed inputs feeding the rollup.
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.hackathon_submission_signals (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id      UUID NOT NULL,
  submission_scope   TEXT NOT NULL CHECK (submission_scope IN ('individual','team')),
  participant_id     UUID REFERENCES public.hackathon_participants(id) ON DELETE SET NULL,
  team_id            UUID REFERENCES public.hackathon_teams(id) ON DELETE SET NULL,
  activity_id        UUID,
  revision_count     INTEGER,
  semantic_drift     NUMERIC,        -- embedding distance across revisions (growth within an activity)
  ai_likelihood      NUMERIC,        -- 0-1, INDEPENDENT signal (never folded into learning)
  specificity        NUMERIC,        -- grounding / concreteness
  grappling          NUMERIC,        -- problem-engagement vs generic solution-jumping
  image_authenticity NUMERIC,        -- real artifact vs generic/AI image (VLM, P3)
  signals            JSONB NOT NULL DEFAULT '{}'::jsonb,
  computed_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS hackathon_submission_signals_key
  ON public.hackathon_submission_signals(submission_id, submission_scope);
CREATE INDEX IF NOT EXISTS hackathon_submission_signals_team_idx ON public.hackathon_submission_signals(team_id);
CREATE INDEX IF NOT EXISTS hackathon_submission_signals_participant_idx ON public.hackathon_submission_signals(participant_id);

-- =====================================================================
-- 3. Rolled-up learning metrics — per participant and per team.
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.hackathon_learning_metrics (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_type       TEXT NOT NULL CHECK (subject_type IN ('participant','team')),
  participant_id     UUID REFERENCES public.hackathon_participants(id) ON DELETE CASCADE,
  team_id            UUID REFERENCES public.hackathon_teams(id) ON DELETE CASCADE,
  iteration_score    NUMERIC,
  authenticity_score NUMERIC,
  engagement_score   NUMERIC,
  grappling_score    NUMERIC,
  learning_index     NUMERIC,        -- composite (NOT including ai_likelihood)
  ai_likelihood      NUMERIC,        -- INDEPENDENT column, reported alongside
  semifinal_total    NUMERIC,        -- denormalized from semifinal_scores for the 2x2 (teams only)
  quadrant           TEXT,           -- 'grew_delivered' | 'undervalued_growth' | 'polished_coaster' | 'disengaged'
  behavioral         JSONB NOT NULL DEFAULT '{}'::jsonb,
  evidence           JSONB NOT NULL DEFAULT '{}'::jsonb,
  computed_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK ( (subject_type = 'participant' AND participant_id IS NOT NULL)
       OR (subject_type = 'team'        AND team_id IS NOT NULL) )
);
CREATE UNIQUE INDEX IF NOT EXISTS hackathon_learning_metrics_participant_key
  ON public.hackathon_learning_metrics(participant_id) WHERE subject_type = 'participant';
CREATE UNIQUE INDEX IF NOT EXISTS hackathon_learning_metrics_team_key
  ON public.hackathon_learning_metrics(team_id) WHERE subject_type = 'team';

-- =====================================================================
-- RLS: admin/service-role only. Enable with NO policy (service role bypasses;
-- anon/authenticated denied). Consistent with the security-lint remediation.
-- =====================================================================
ALTER TABLE public.hackathon_semifinal_scores   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hackathon_submission_signals  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hackathon_learning_metrics    ENABLE ROW LEVEL SECURITY;

COMMIT;
