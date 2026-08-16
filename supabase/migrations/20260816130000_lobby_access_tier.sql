-- Lobby access tiers.
--
-- 'full'  : members see the whole map (existing behaviour, the default).
-- 'micro' : the free tier. Members only see the first island's content --
--           every later island stays locked no matter what they submit.
--
-- Prod-first: additive, idempotent, nullable-safe (existing rows default to
-- 'full', so no lobby loses access when this lands).

ALTER TABLE public.map_lobbies
  ADD COLUMN IF NOT EXISTS access_tier text NOT NULL DEFAULT 'full';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'map_lobbies_access_tier_check'
  ) THEN
    ALTER TABLE public.map_lobbies
      ADD CONSTRAINT map_lobbies_access_tier_check
      CHECK (access_tier IN ('full', 'micro'));
  END IF;
END $$;

COMMENT ON COLUMN public.map_lobbies.access_tier IS
  'full = whole map; micro = free tier, first island only.';
