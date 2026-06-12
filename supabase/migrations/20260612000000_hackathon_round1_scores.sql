-- Round 1 judge scores for the hackathon.
-- Mirrors hackathon_semifinal_scores (Round 2) but simpler — one row per team,
-- total is the weighted composite from the Highschool / University xlsx tabs.
-- Admin/service-role only: RLS enabled with NO policy.

BEGIN;

CREATE TABLE IF NOT EXISTS public.hackathon_round1_scores (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id         UUID REFERENCES public.hackathon_teams(id) ON DELETE SET NULL,
  raw_team_name   TEXT NOT NULL,
  division        TEXT,           -- 'high_school' | 'university'
  total           NUMERIC(6,2),   -- weighted total from xlsx (roughly 0–100 scale)
  match_method    TEXT,           -- 'exact' | 'fuzzy' | 'manual' | 'unmatched'
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS hackathon_round1_scores_team_key
  ON public.hackathon_round1_scores(team_id) WHERE team_id IS NOT NULL;

ALTER TABLE public.hackathon_round1_scores ENABLE ROW LEVEL SECURITY;

COMMIT;
