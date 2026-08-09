-- Map Lobbies: admin-created rooms that gate access to a single map.
--
-- Students join a lobby with a 6-character code. Lobby membership is what
-- grants access to a map's node content, and what lets lobbymates see each
-- other's progress on the canvas.
--
-- Prod-first: every statement is additive and idempotent.

-- Generates a unique 6-char code. The existing public.generate_join_code() is
-- hardcoded to check the classrooms table, so it cannot be reused here.
CREATE OR REPLACE FUNCTION public.generate_lobby_code()
RETURNS varchar(6)
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  chars text := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  result text := '';
  i integer;
BEGIN
  LOOP
    result := '';
    FOR i IN 1..6 LOOP
      result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
    END LOOP;
    IF NOT EXISTS (SELECT 1 FROM public.map_lobbies WHERE join_code = result) THEN
      RETURN result;
    END IF;
  END LOOP;
END;
$$;

GRANT EXECUTE ON FUNCTION public.generate_lobby_code() TO authenticated;

CREATE TABLE IF NOT EXISTS public.map_lobbies (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  map_id uuid NOT NULL,
  name text NOT NULL,
  join_code varchar(6) NOT NULL DEFAULT public.generate_lobby_code(),
  is_open boolean NOT NULL DEFAULT true,
  created_by uuid,
  created_at timestamp with time zone DEFAULT now(),
  PRIMARY KEY (id),
  CONSTRAINT map_lobbies_map_id_fkey FOREIGN KEY (map_id)
    REFERENCES public.learning_maps(id) ON DELETE CASCADE,
  CONSTRAINT map_lobbies_created_by_fkey FOREIGN KEY (created_by)
    REFERENCES public.profiles(id) ON DELETE SET NULL,
  CONSTRAINT map_lobbies_join_code_unique UNIQUE (join_code),
  CONSTRAINT map_lobbies_join_code_format CHECK (join_code ~ '^[A-Z0-9]{6}$')
);

CREATE TABLE IF NOT EXISTS public.lobby_members (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  lobby_id uuid NOT NULL,
  user_id uuid NOT NULL,
  joined_at timestamp with time zone DEFAULT now(),
  PRIMARY KEY (id),
  CONSTRAINT lobby_members_lobby_id_fkey FOREIGN KEY (lobby_id)
    REFERENCES public.map_lobbies(id) ON DELETE CASCADE,
  CONSTRAINT lobby_members_user_id_fkey FOREIGN KEY (user_id)
    REFERENCES public.profiles(id) ON DELETE CASCADE,
  CONSTRAINT lobby_members_unique UNIQUE (lobby_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_map_lobbies_map_id ON public.map_lobbies(map_id);
CREATE INDEX IF NOT EXISTS idx_lobby_members_user_id ON public.lobby_members(user_id);
CREATE INDEX IF NOT EXISTS idx_lobby_members_lobby_id ON public.lobby_members(lobby_id);

-- RLS on with NO policies yet: these tables deny all access to `authenticated`
-- until the policy migration lands. That is the safe failure direction.
ALTER TABLE public.map_lobbies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lobby_members ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE ON TABLE public.map_lobbies TO authenticated;
GRANT SELECT, INSERT ON TABLE public.lobby_members TO authenticated;
GRANT ALL ON TABLE public.map_lobbies TO service_role;
GRANT ALL ON TABLE public.lobby_members TO service_role;

COMMENT ON TABLE public.map_lobbies IS 'Admin-created rooms gating access to one learning map';
COMMENT ON COLUMN public.map_lobbies.is_open IS 'Gates NEW joins only; existing members keep access when false';
COMMENT ON TABLE public.lobby_members IS 'Which users belong to which lobby';
