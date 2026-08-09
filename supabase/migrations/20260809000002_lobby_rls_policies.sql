-- Lobby access control.
--
-- The guarantee this file exists to provide: a student may read the progress of
-- users who share a lobby with them for that map, and nobody else.
--
-- Reuses the existing public.is_admin(uuid) helper rather than adding another
-- admin check. Prod-first: additive and idempotent throughout.

-- SECURITY DEFINER specifically to break RLS recursion: a policy on
-- lobby_members that queries lobby_members would re-enter itself and error with
-- "infinite recursion detected in policy".
--
-- SET search_path = public is mandatory -- a SECURITY DEFINER function without a
-- pinned search_path is a privilege-escalation vector.
CREATE OR REPLACE FUNCTION public.shares_lobby_with(target_user uuid, target_map uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM lobby_members me
    JOIN lobby_members them ON them.lobby_id = me.lobby_id
    JOIN map_lobbies l ON l.id = me.lobby_id
    WHERE me.user_id = auth.uid()
      AND them.user_id = target_user
      AND l.map_id = target_map
  );
$$;

GRANT EXECUTE ON FUNCTION public.shares_lobby_with(uuid, uuid) TO authenticated;

-- Is the current user a member of this lobby? SECURITY DEFINER for the same
-- recursion reason as above.
CREATE OR REPLACE FUNCTION public.is_lobby_member(lookup_lobby_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM lobby_members
    WHERE lobby_id = lookup_lobby_id AND user_id = auth.uid()
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_lobby_member(uuid) TO authenticated;

-- map_lobbies -----------------------------------------------------------------

DROP POLICY IF EXISTS "Members can view their lobbies" ON public.map_lobbies;
CREATE POLICY "Members can view their lobbies" ON public.map_lobbies
  FOR SELECT USING (
    public.is_lobby_member(id) OR public.is_admin(auth.uid())
  );

DROP POLICY IF EXISTS "Admins can create lobbies" ON public.map_lobbies;
CREATE POLICY "Admins can create lobbies" ON public.map_lobbies
  FOR INSERT WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can update lobbies" ON public.map_lobbies;
CREATE POLICY "Admins can update lobbies" ON public.map_lobbies
  FOR UPDATE USING (public.is_admin(auth.uid()));

-- lobby_members ---------------------------------------------------------------

DROP POLICY IF EXISTS "Lobbymates can view each other" ON public.lobby_members;
CREATE POLICY "Lobbymates can view each other" ON public.lobby_members
  FOR SELECT USING (
    user_id = auth.uid()
    OR public.is_lobby_member(lobby_id)
    OR public.is_admin(auth.uid())
  );

-- Students may only insert themselves, and only into an open lobby. The join
-- RPC below is SECURITY DEFINER so it bypasses this, but a direct client insert
-- is still constrained.
DROP POLICY IF EXISTS "Users can join open lobbies as themselves" ON public.lobby_members;
CREATE POLICY "Users can join open lobbies as themselves" ON public.lobby_members
  FOR INSERT WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.map_lobbies l
      WHERE l.id = lobby_members.lobby_id AND l.is_open
    )
  );

-- student_node_progress -------------------------------------------------------

-- ADDITIVE: Postgres ORs permissive SELECT policies, so the pre-existing
-- view_progress_policy (self / admin / classroom instructor) still applies.
-- This adds lobbymates. SELECT only -- no new write path is created here, so a
-- student still cannot modify another student's progress.
DROP POLICY IF EXISTS "Lobbymates can view progress" ON public.student_node_progress;
CREATE POLICY "Lobbymates can view progress" ON public.student_node_progress
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.map_nodes n
      WHERE n.id = student_node_progress.node_id
        AND public.shares_lobby_with(student_node_progress.user_id, n.map_id)
    )
  );

-- Atomic join -----------------------------------------------------------------

-- Creates the membership row and the enrollment row in one transaction, so
-- there is no window where a student is a member without an enrollment.
-- CREATE OR REPLACE cannot change a function's return type, so drop first to
-- keep this migration re-runnable.
DROP FUNCTION IF EXISTS public.join_lobby_by_code(text);

-- The OUT parameters are named out_* rather than lobby_id/map_id: plpgsql puts
-- output parameter names in scope for the whole body, so bare `lobby_id` inside
-- the INSERTs below would be ambiguous between the parameter and the column.
CREATE OR REPLACE FUNCTION public.join_lobby_by_code(code text)
RETURNS TABLE(out_lobby_id uuid, out_map_id uuid)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_lobby public.map_lobbies%ROWTYPE;
  v_user uuid := auth.uid();
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT * INTO v_lobby FROM public.map_lobbies
  WHERE join_code = upper(trim(code));

  -- Identical error for "not found" and "closed" so this cannot be used as an
  -- oracle to discover valid codes.
  IF NOT FOUND OR NOT v_lobby.is_open THEN
    RAISE EXCEPTION 'That code isn''t valid or the lobby is closed.';
  END IF;

  INSERT INTO public.lobby_members (lobby_id, user_id)
  VALUES (v_lobby.id, v_user)
  ON CONFLICT (lobby_id, user_id) DO NOTHING;

  -- COALESCE preserves an existing lobby assignment, so a student already in a
  -- lobby for this map is not silently moved to a different one.
  INSERT INTO public.user_map_enrollments (user_id, map_id, lobby_id, progress_percentage)
  VALUES (v_user, v_lobby.map_id, v_lobby.id, 0)
  ON CONFLICT (user_id, map_id) DO UPDATE
    SET lobby_id = COALESCE(public.user_map_enrollments.lobby_id, EXCLUDED.lobby_id);

  RETURN QUERY SELECT v_lobby.id, v_lobby.map_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.join_lobby_by_code(text) TO authenticated;

COMMENT ON FUNCTION public.shares_lobby_with(uuid, uuid) IS 'Do the current user and target_user share a lobby for target_map? SECURITY DEFINER to avoid RLS recursion.';
COMMENT ON FUNCTION public.join_lobby_by_code(text) IS 'Atomically join a lobby by code: creates membership + enrollment. Generic error prevents code enumeration.';
