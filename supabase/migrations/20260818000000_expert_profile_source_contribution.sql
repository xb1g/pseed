-- Track where an expert profile came from (e.g. the /pathlab/partner page)
-- and what the expert wants to contribute, so the contribution loop can be
-- measured end to end (page → interview → submission → published PathLab).
-- Additive and nullable: a prod-first apply cannot break existing rows.
ALTER TABLE public.expert_profiles
  ADD COLUMN IF NOT EXISTS source TEXT,
  ADD COLUMN IF NOT EXISTS contribution_mode TEXT;
