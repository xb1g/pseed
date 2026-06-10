-- Cross-phase journey: one-line synthesis of how a team's idea evolved across ALL their work
-- (Phase 1-2 submissions, Phase 3 experiment cycles, Round-1 video), not just the video pitch.
-- Stored per team on the learning-metrics row.

ALTER TABLE public.hackathon_learning_metrics
  ADD COLUMN IF NOT EXISTS journey_summary text;
