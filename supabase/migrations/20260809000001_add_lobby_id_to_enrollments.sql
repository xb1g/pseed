-- Link enrollments to lobbies, and backfill pre-lobby enrollments.
--
-- The column is nullable because a NOT NULL add would fail against existing
-- rows on a prod-first apply. The backfill below fills every row, and
-- application code treats lobby_id as always present.
--
-- Prod-first: every statement is additive and idempotent.

ALTER TABLE public.user_map_enrollments
  ADD COLUMN IF NOT EXISTS lobby_id uuid;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'user_map_enrollments_lobby_id_fkey'
  ) THEN
    ALTER TABLE public.user_map_enrollments
      ADD CONSTRAINT user_map_enrollments_lobby_id_fkey
      FOREIGN KEY (lobby_id) REFERENCES public.map_lobbies(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_user_map_enrollments_lobby_id
  ON public.user_map_enrollments(lobby_id);

-- Backfill: one CLOSED legacy lobby per map that has lobby-less enrollments.
-- Closed so a leaked legacy code cannot be walked in on; an admin opens it
-- deliberately. The ' — Legacy' suffix (em dash) is matched by string equality
-- in the UPDATE below -- changing it in one place and not the other breaks
-- idempotency.
INSERT INTO public.map_lobbies (map_id, name, is_open)
SELECT DISTINCT e.map_id, COALESCE(m.title, 'Map') || ' — Legacy', false
FROM public.user_map_enrollments e
JOIN public.learning_maps m ON m.id = e.map_id
WHERE e.lobby_id IS NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.map_lobbies l
    WHERE l.map_id = e.map_id AND l.name = COALESCE(m.title, 'Map') || ' — Legacy'
  );

UPDATE public.user_map_enrollments e
SET lobby_id = l.id
FROM public.map_lobbies l
JOIN public.learning_maps m ON m.id = l.map_id
WHERE e.lobby_id IS NULL
  AND l.map_id = e.map_id
  AND l.name = COALESCE(m.title, 'Map') || ' — Legacy';

-- Every backfilled enrollee becomes a member of their legacy lobby, so the
-- "every enrollment has a lobby membership" invariant holds for old data too.
INSERT INTO public.lobby_members (lobby_id, user_id)
SELECT e.lobby_id, e.user_id
FROM public.user_map_enrollments e
WHERE e.lobby_id IS NOT NULL
ON CONFLICT (lobby_id, user_id) DO NOTHING;

COMMENT ON COLUMN public.user_map_enrollments.lobby_id IS 'The lobby this enrollment belongs to; backfilled for pre-lobby rows';
