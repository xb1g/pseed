# Map Lobbies Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Gate map access behind admin-issued lobby codes, and show each lobby member's live position on the map's nodes as an avatar.

**Architecture:** Three new tables (`map_lobbies`, `lobby_members`, plus a `lobby_id` column on `user_map_enrollments`) with a `SECURITY DEFINER` helper that lets RLS answer "do these two users share a lobby for this map?" without recursion. Joining happens through a single atomic RPC. The student-facing gate lives at `/map/[id]`, which renders a public preview plus a code form for non-members and the full canvas for members. Presence avatars render as children of `GameNode` so they inherit React Flow's pan/zoom transforms.

**Tech Stack:** Next.js 15 App Router, Supabase (Postgres + RLS + Realtime), TypeScript, TailwindCSS, Shadcn/ui, React Flow (`@xyflow/react`), Jest + `pg` for RLS tests.

**Source spec:** `docs/superpowers/specs/2026-08-09-map-lobbies-design.md`

## Global Constraints

- **Migrations are prod-first.** Production is the first Postgres to parse each migration. Every statement must be additive and idempotent: `CREATE TABLE IF NOT EXISTS`, `ADD COLUMN IF NOT EXISTS` (nullable only), `CREATE INDEX IF NOT EXISTS`, `CREATE OR REPLACE FUNCTION`, and `DROP POLICY IF EXISTS` before each `CREATE POLICY`.
- **Never hardcode secrets.** All Supabase credentials come from env vars; scripts validate and exit if missing.
- **Supabase SSR pattern only.** Use `@supabase/ssr` with `getAll()`/`setAll()` cookie methods. Never individual `get`/`set`/`remove`, never `@supabase/auth-helpers-nextjs`.
- **Do not modify `utils/supabase/public-routes.ts`.** `/map` is already public and must stay public — the gate is enforced by data access, not middleware.
- **The live MapViewer is `components/map/MapViewer/index.tsx`** (the directory), imported everywhere as `MapViewerWithProvider`. `components/map/MapViewer.tsx` and `MapViewer.refactored.tsx` are re-export shims — **do not edit them**. Node rendering lives in `components/map/MapViewer/components/GameNode.tsx`.
- **`SECURITY DEFINER` functions MUST include `SET search_path = public`.** Omitting it is a privilege-escalation vector.
- **Join code format:** exactly 6 characters matching `^[A-Z0-9]{6}$`.
- **Generic join failure copy, used verbatim in both SQL and UI:** `That code isn't valid or the lobby is closed.` Invalid-code and closed-lobby must be indistinguishable so the RPC cannot be used as an oracle.
- **Frontend tasks (7, 8, 9, 10) are delegated to Kimi** via the `/sub-agents` skill, per the user's standing preference.

## File Structure

**Migrations (create):**
- `supabase/migrations/20260809000000_create_map_lobbies.sql` — tables, code generator, indexes
- `supabase/migrations/20260809000001_add_lobby_id_to_enrollments.sql` — column + legacy backfill
- `supabase/migrations/20260809000002_lobby_rls_policies.sql` — `shares_lobby_with()`, policies, `join_lobby_by_code()`

**Data layer (create):**
- `lib/supabase/lobbies.ts` — server-side reads/writes (admin surface + presence)
- `lib/api/lobbies-client.ts` — client wrapper for the join RPC
- `types/lobby.ts` — shared TypeScript types

**Student UI (create/modify):**
- `components/map/LobbyCodeGate.tsx` (create) — preview + code form for non-members
- `app/map/[id]/page.tsx` (modify) — membership branch
- `app/map/client-page.tsx` (modify) — stop enrolling on click

**Presence (create/modify):**
- `hooks/use-lobby-presence.ts` (create) — Realtime subscription + reduction to one node per member
- `components/map/MapViewer/components/NodePresenceAvatars.tsx` (create) — the avatar ring
- `components/map/MapViewer/components/GameNode.tsx` (modify) — mount the avatars
- `components/map/MapViewer/types/index.ts` (modify) — presence types on node data

**Admin UI (create/modify):**
- `components/admin/lobbies/LobbyManagerDialog.tsx` (create)
- `components/admin/lobbies/LobbyList.tsx` (create)
- `components/admin/lobbies/LobbyRoster.tsx` (create)
- `components/admin/AdminMapsManagement.tsx` (modify) — add the "Lobbies" action

**Tests (create):**
- `lib/supabase/__tests__/lobby-rls.test.ts` — the five security cases

### Testing note — read before Task 1

`lib/supabase/__tests__/rls-security-lints.test.ts` connects to a **local** Postgres at `127.0.0.1:54322` and calls `describe.skip` when unreachable. CLAUDE.md states the local Supabase DB is no longer used — so that suite currently self-skips.

The lobby security tests are the main defense against cross-lobby data leaks and **must not silently skip**. Task 11 therefore requires a reachable database via `SUPABASE_DB_URL`. If no local DB is available, run those tests against a scratch/staging database — never production, since they create and delete rows. If the suite skips, the task is not complete.

---

### Task 1: Lobby tables and code generator

**Files:**
- Create: `supabase/migrations/20260809000000_create_map_lobbies.sql`

**Interfaces:**
- Consumes: existing `learning_maps(id)`, `profiles(id)`
- Produces: tables `public.map_lobbies`, `public.lobby_members`; function `public.generate_lobby_code() RETURNS varchar(6)`

- [ ] **Step 1: Write the migration**

Note `generate_lobby_code()` checks `map_lobbies` — the existing `generate_join_code()` is hardcoded against `classrooms` and cannot be reused.

```sql
-- Map Lobbies: admin-created rooms that gate access to a single map.

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

ALTER TABLE public.map_lobbies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lobby_members ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE ON TABLE public.map_lobbies TO authenticated;
GRANT SELECT, INSERT ON TABLE public.lobby_members TO authenticated;
GRANT ALL ON TABLE public.map_lobbies TO service_role;
GRANT ALL ON TABLE public.lobby_members TO service_role;

COMMENT ON TABLE public.map_lobbies IS 'Admin-created rooms gating access to one learning map';
COMMENT ON COLUMN public.map_lobbies.is_open IS 'Gates NEW joins only; existing members keep access when false';
```

RLS is enabled here with **no policies yet** — that is deliberate. Between this migration and Task 3, the tables deny all access to `authenticated`, which is the safe failure direction.

- [ ] **Step 2: Verify the SQL parses**

Run: `psql "$SUPABASE_DB_URL" -f supabase/migrations/20260809000000_create_map_lobbies.sql --single-transaction --set ON_ERROR_STOP=1`

Expected: no errors. If no database is reachable, at minimum confirm balanced `$$` quoting and that every statement ends with `;`.

- [ ] **Step 3: Verify idempotency**

Run the same command a second time.
Expected: succeeds again with no errors — proving `IF NOT EXISTS` / `OR REPLACE` coverage. This is the property that makes a prod-first apply safe to retry.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/20260809000000_create_map_lobbies.sql
git commit -m "feat(lobbies): add map_lobbies and lobby_members tables"
```

---

### Task 2: Enrollment lobby column and legacy backfill

**Files:**
- Create: `supabase/migrations/20260809000001_add_lobby_id_to_enrollments.sql`

**Interfaces:**
- Consumes: `public.map_lobbies` (Task 1), existing `public.user_map_enrollments`
- Produces: column `user_map_enrollments.lobby_id uuid NULL`

- [ ] **Step 1: Write the migration**

The column is nullable because a `NOT NULL` add would fail against existing rows on a prod-first apply. The backfill then fills every row, and application code treats it as always present.

```sql
-- Link enrollments to lobbies, and backfill pre-lobby enrollments.

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
-- Closed so a leaked legacy code cannot be walked in on; an admin opens it deliberately.
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
WHERE e.lobby_id IS NULL
  AND l.map_id = e.map_id
  AND l.name = COALESCE(l_map.title, 'Map') || ' — Legacy'
  AND EXISTS (SELECT 1 FROM public.learning_maps l_map WHERE l_map.id = e.map_id);

-- Every backfilled enrollee becomes a member of their legacy lobby.
INSERT INTO public.lobby_members (lobby_id, user_id)
SELECT e.lobby_id, e.user_id
FROM public.user_map_enrollments e
WHERE e.lobby_id IS NOT NULL
ON CONFLICT (lobby_id, user_id) DO NOTHING;
```

- [ ] **Step 2: Fix the correlated-name bug in the UPDATE**

The `UPDATE` above references `l_map.title` in the `WHERE` while only introducing `l_map` inside an `EXISTS` subquery — that will not resolve. Replace the whole `UPDATE` statement with this corrected version:

```sql
UPDATE public.user_map_enrollments e
SET lobby_id = l.id
FROM public.map_lobbies l
JOIN public.learning_maps m ON m.id = l.map_id
WHERE e.lobby_id IS NULL
  AND l.map_id = e.map_id
  AND l.name = COALESCE(m.title, 'Map') || ' — Legacy';
```

- [ ] **Step 3: Apply and verify the invariant holds**

Run:

```bash
psql "$SUPABASE_DB_URL" -f supabase/migrations/20260809000001_add_lobby_id_to_enrollments.sql --single-transaction --set ON_ERROR_STOP=1
psql "$SUPABASE_DB_URL" -c "SELECT count(*) AS orphaned FROM public.user_map_enrollments WHERE lobby_id IS NULL;"
```

Expected: `orphaned = 0`. This is the invariant the entire RLS design rests on — if it is non-zero, stop and investigate before continuing.

- [ ] **Step 4: Verify idempotency**

Re-run the migration, then re-run the orphan count.
Expected: succeeds, `orphaned = 0`, and no duplicate `— Legacy` lobbies:

```bash
psql "$SUPABASE_DB_URL" -c "SELECT map_id, name, count(*) FROM public.map_lobbies GROUP BY 1,2 HAVING count(*) > 1;"
```

Expected: zero rows.

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/20260809000001_add_lobby_id_to_enrollments.sql
git commit -m "feat(lobbies): add lobby_id to enrollments with legacy backfill"
```

---

### Task 3: RLS policies and the atomic join RPC

**Files:**
- Create: `supabase/migrations/20260809000002_lobby_rls_policies.sql`

**Interfaces:**
- Consumes: everything from Tasks 1 and 2
- Produces: `public.shares_lobby_with(target_user uuid, target_map uuid) RETURNS boolean`; `public.join_lobby_by_code(code text) RETURNS TABLE(lobby_id uuid, map_id uuid)`

- [ ] **Step 1: Write the migration**

`shares_lobby_with` is `SECURITY DEFINER` specifically to break RLS recursion: a policy on `lobby_members` that queries `lobby_members` would re-enter itself and error.

```sql
-- Lobby access control.

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

-- Admin check helper (SECURITY DEFINER: user_roles is itself RLS-protected).
CREATE OR REPLACE FUNCTION public.is_lobby_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_lobby_admin() TO authenticated;

-- map_lobbies policies
DROP POLICY IF EXISTS "Members can view their lobbies" ON public.map_lobbies;
CREATE POLICY "Members can view their lobbies" ON public.map_lobbies
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.lobby_members lm
            WHERE lm.lobby_id = map_lobbies.id AND lm.user_id = auth.uid())
    OR public.is_lobby_admin()
  );

DROP POLICY IF EXISTS "Admins can create lobbies" ON public.map_lobbies;
CREATE POLICY "Admins can create lobbies" ON public.map_lobbies
  FOR INSERT WITH CHECK (public.is_lobby_admin());

DROP POLICY IF EXISTS "Admins can update lobbies" ON public.map_lobbies;
CREATE POLICY "Admins can update lobbies" ON public.map_lobbies
  FOR UPDATE USING (public.is_lobby_admin());

-- lobby_members policies
DROP POLICY IF EXISTS "Lobbymates can view each other" ON public.lobby_members;
CREATE POLICY "Lobbymates can view each other" ON public.lobby_members
  FOR SELECT USING (
    user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.map_lobbies l
               WHERE l.id = lobby_members.lobby_id
                 AND public.shares_lobby_with(lobby_members.user_id, l.map_id))
    OR public.is_lobby_admin()
  );

-- student_node_progress: ADDITIVE select policy. No new write path.
DROP POLICY IF EXISTS "Lobbymates can view progress" ON public.student_node_progress;
CREATE POLICY "Lobbymates can view progress" ON public.student_node_progress
  FOR SELECT USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.map_nodes n
      WHERE n.id = student_node_progress.node_id
        AND public.shares_lobby_with(student_node_progress.user_id, n.map_id)
    )
  );

-- Atomic join: membership + enrollment in one transaction.
CREATE OR REPLACE FUNCTION public.join_lobby_by_code(code text)
RETURNS TABLE(lobby_id uuid, map_id uuid)
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

  INSERT INTO public.user_map_enrollments (user_id, map_id, lobby_id, progress_percentage)
  VALUES (v_user, v_lobby.map_id, v_lobby.id, 0)
  ON CONFLICT (user_id, map_id) DO UPDATE
    SET lobby_id = COALESCE(public.user_map_enrollments.lobby_id, EXCLUDED.lobby_id);

  RETURN QUERY SELECT v_lobby.id, v_lobby.map_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.join_lobby_by_code(text) TO authenticated;
```

The `ON CONFLICT ... DO UPDATE` on enrollment uses `COALESCE` so a student already in a lobby for this map is **not** silently moved to a different one — it preserves the one-student-one-lobby-per-map invariant.

- [ ] **Step 2: Apply the migration**

Run: `psql "$SUPABASE_DB_URL" -f supabase/migrations/20260809000002_lobby_rls_policies.sql --single-transaction --set ON_ERROR_STOP=1`
Expected: no errors.

- [ ] **Step 3: Smoke-test that no recursion occurs**

Run: `psql "$SUPABASE_DB_URL" -c "SELECT public.shares_lobby_with('00000000-0000-0000-0000-000000000000'::uuid, '00000000-0000-0000-0000-000000000000'::uuid);"`
Expected: returns `f` — **not** an "infinite recursion detected in policy" error. That error means `shares_lobby_with` lost its `SECURITY DEFINER`.

- [ ] **Step 4: Verify idempotency**

Re-run the migration.
Expected: succeeds — proving the `DROP POLICY IF EXISTS` guards work.

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/20260809000002_lobby_rls_policies.sql
git commit -m "feat(lobbies): add RLS policies and atomic join_lobby_by_code RPC"
```

---

### Task 4: Lobby TypeScript types

**Files:**
- Create: `types/lobby.ts`

**Interfaces:**
- Produces: `MapLobby`, `LobbyMember`, `LobbyRosterEntry`, `LobbyPresenceEntry`, `JoinLobbyResult` — used by every later task

- [ ] **Step 1: Write the types**

```typescript
export interface MapLobby {
  id: string;
  map_id: string;
  name: string;
  join_code: string;
  is_open: boolean;
  created_by: string | null;
  created_at: string;
}

export interface MapLobbyWithCount extends MapLobby {
  member_count: number;
}

export interface LobbyMember {
  id: string;
  lobby_id: string;
  user_id: string;
  joined_at: string;
}

/** A lobby member as shown in the admin roster. */
export interface LobbyRosterEntry {
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
  joined_at: string;
  current_node_id: string | null;
  current_node_title: string | null;
  completed_count: number;
}

/** One member's position on the canvas: exactly one node per member. */
export interface LobbyPresenceEntry {
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
  node_id: string;
  status: NodeProgressStatus;
}

export type NodeProgressStatus =
  | "not_started"
  | "in_progress"
  | "submitted"
  | "passed"
  | "failed";

export interface JoinLobbyResult {
  lobby_id: string;
  map_id: string;
}

/** Shown verbatim on any join failure. Must not distinguish invalid from closed. */
export const JOIN_LOBBY_ERROR = "That code isn't valid or the lobby is closed.";
```

- [ ] **Step 2: Verify it compiles**

Run: `npx tsc --noEmit -p tsconfig.json`
Expected: no errors referencing `types/lobby.ts`. (Pre-existing errors elsewhere in the repo are out of scope — confirm none are new.)

- [ ] **Step 3: Commit**

```bash
git add types/lobby.ts
git commit -m "feat(lobbies): add lobby TypeScript types"
```

---

### Task 5: Server data layer

**Files:**
- Create: `lib/supabase/lobbies.ts`
- Reference (read for pattern, do not modify): `lib/supabase/enrollment.ts`

**Interfaces:**
- Consumes: `types/lobby.ts` (Task 4); `createClient` from `@/utils/supabase/server`
- Produces:
  - `createLobby(mapId: string, name: string): Promise<MapLobby>`
  - `getLobbiesForMap(mapId: string): Promise<MapLobbyWithCount[]>`
  - `getLobbyRoster(lobbyId: string): Promise<LobbyRosterEntry[]>`
  - `setLobbyOpen(lobbyId: string, isOpen: boolean): Promise<void>`
  - `getUserLobbyForMap(mapId: string): Promise<MapLobby | null>`
  - `getLobbyPresence(mapId: string): Promise<LobbyPresenceEntry[]>`

- [ ] **Step 1: Read the existing pattern**

Read `lib/supabase/enrollment.ts` in full. Match its conventions: `createClient()` from `@/utils/supabase/server`, `await supabase.auth.getUser()` for identity, `console.error` plus a thrown `Error` with a user-safe message on failure.

- [ ] **Step 2: Write the module**

```typescript
import { createClient } from "@/utils/supabase/server";
import type {
  MapLobby,
  MapLobbyWithCount,
  LobbyRosterEntry,
  LobbyPresenceEntry,
  NodeProgressStatus,
} from "@/types/lobby";

/** Admin: create a lobby for a map. The join code is generated by Postgres. */
export const createLobby = async (
  mapId: string,
  name: string
): Promise<MapLobby> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Must be authenticated to create a lobby");

  const { data, error } = await supabase
    .from("map_lobbies")
    .insert({ map_id: mapId, name, created_by: user.id })
    .select()
    .single();

  if (error) {
    console.error("Error creating lobby:", error);
    throw new Error("Failed to create lobby");
  }
  return data;
};

/** Admin: all lobbies for a map, with member counts. */
export const getLobbiesForMap = async (
  mapId: string
): Promise<MapLobbyWithCount[]> => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("map_lobbies")
    .select("*, lobby_members(count)")
    .eq("map_id", mapId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching lobbies:", error);
    throw new Error("Failed to load lobbies");
  }

  return (data ?? []).map((row: Record<string, unknown>) => {
    const { lobby_members, ...lobby } = row as MapLobby & {
      lobby_members: { count: number }[];
    };
    return { ...lobby, member_count: lobby_members?.[0]?.count ?? 0 };
  });
};

/** Admin: roster for one lobby, including each member's current node. */
export const getLobbyRoster = async (
  lobbyId: string
): Promise<LobbyRosterEntry[]> => {
  const supabase = await createClient();

  const { data: lobby, error: lobbyError } = await supabase
    .from("map_lobbies")
    .select("map_id")
    .eq("id", lobbyId)
    .single();

  if (lobbyError || !lobby) {
    console.error("Error loading lobby:", lobbyError);
    throw new Error("Failed to load lobby");
  }

  const { data: members, error: membersError } = await supabase
    .from("lobby_members")
    .select("user_id, joined_at, profiles(full_name, avatar_url)")
    .eq("lobby_id", lobbyId);

  if (membersError) {
    console.error("Error loading roster:", membersError);
    throw new Error("Failed to load roster");
  }

  const userIds = (members ?? []).map((m) => m.user_id);
  if (userIds.length === 0) return [];

  const progress = await fetchProgressForUsers(userIds, lobby.map_id);

  return (members ?? []).map((m) => {
    const profile = m.profiles as unknown as {
      full_name: string | null;
      avatar_url: string | null;
    } | null;
    const rows = progress.filter((p) => p.user_id === m.user_id);
    const current = pickCurrentNode(rows);
    return {
      user_id: m.user_id,
      full_name: profile?.full_name ?? null,
      avatar_url: profile?.avatar_url ?? null,
      joined_at: m.joined_at,
      current_node_id: current?.node_id ?? null,
      current_node_title: current?.node_title ?? null,
      completed_count: rows.filter((r) => r.status === "passed").length,
    };
  });
};

/** Admin: open or close a lobby. Closing blocks NEW joins only. */
export const setLobbyOpen = async (
  lobbyId: string,
  isOpen: boolean
): Promise<void> => {
  const supabase = await createClient();
  const { error } = await supabase
    .from("map_lobbies")
    .update({ is_open: isOpen })
    .eq("id", lobbyId);

  if (error) {
    console.error("Error updating lobby:", error);
    throw new Error("Failed to update lobby");
  }
};

/** The current user's lobby for a map, or null if they are not a member. */
export const getUserLobbyForMap = async (
  mapId: string
): Promise<MapLobby | null> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("map_lobbies")
    .select("*, lobby_members!inner(user_id)")
    .eq("map_id", mapId)
    .eq("lobby_members.user_id", user.id)
    .maybeSingle();

  if (error) {
    console.error("Error checking lobby membership:", error);
    return null;
  }
  if (!data) return null;

  const { lobby_members, ...lobby } = data as MapLobby & {
    lobby_members: unknown;
  };
  return lobby;
};

/** Presence: exactly one entry per lobbymate, on the node they are working. */
export const getLobbyPresence = async (
  mapId: string
): Promise<LobbyPresenceEntry[]> => {
  const supabase = await createClient();
  const lobby = await getUserLobbyForMap(mapId);
  if (!lobby) return [];

  const { data: members, error } = await supabase
    .from("lobby_members")
    .select("user_id, profiles(full_name, avatar_url)")
    .eq("lobby_id", lobby.id);

  if (error) {
    console.error("Error loading lobby members:", error);
    return [];
  }

  const userIds = (members ?? []).map((m) => m.user_id);
  if (userIds.length === 0) return [];

  const progress = await fetchProgressForUsers(userIds, mapId);
  const firstNodeId = await fetchFirstNodeId(mapId);

  return (members ?? [])
    .map((m) => {
      const profile = m.profiles as unknown as {
        full_name: string | null;
        avatar_url: string | null;
      } | null;
      const current = pickCurrentNode(
        progress.filter((p) => p.user_id === m.user_id)
      );
      const nodeId = current?.node_id ?? firstNodeId;
      if (!nodeId) return null;
      return {
        user_id: m.user_id,
        full_name: profile?.full_name ?? null,
        avatar_url: profile?.avatar_url ?? null,
        node_id: nodeId,
        status: current?.status ?? ("not_started" as NodeProgressStatus),
      };
    })
    .filter((e): e is LobbyPresenceEntry => e !== null);
};

// --- internals ---

interface ProgressRow {
  user_id: string;
  node_id: string;
  node_title: string | null;
  status: NodeProgressStatus;
  arrived_at: string | null;
}

const fetchProgressForUsers = async (
  userIds: string[],
  mapId: string
): Promise<ProgressRow[]> => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("student_node_progress")
    .select("user_id, node_id, status, arrived_at, map_nodes!inner(map_id, title)")
    .in("user_id", userIds)
    .eq("map_nodes.map_id", mapId);

  if (error) {
    console.error("Error loading progress:", error);
    return [];
  }

  return (data ?? []).map((row: Record<string, unknown>) => {
    const node = row.map_nodes as { title: string | null };
    return {
      user_id: row.user_id as string,
      node_id: row.node_id as string,
      node_title: node?.title ?? null,
      status: row.status as NodeProgressStatus,
      arrived_at: (row.arrived_at as string | null) ?? null,
    };
  });
};

const fetchFirstNodeId = async (mapId: string): Promise<string | null> => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("map_nodes")
    .select("id")
    .eq("map_id", mapId)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  return data?.id ?? null;
};

/**
 * One node per member: the in_progress node, else the most recent passed node,
 * else nothing (caller falls back to the map's first node).
 */
const pickCurrentNode = (rows: ProgressRow[]): ProgressRow | null => {
  if (rows.length === 0) return null;

  const inProgress = rows.find((r) => r.status === "in_progress");
  if (inProgress) return inProgress;

  const submitted = rows.find((r) => r.status === "submitted");
  if (submitted) return submitted;

  const passed = rows
    .filter((r) => r.status === "passed")
    .sort((a, b) => (b.arrived_at ?? "").localeCompare(a.arrived_at ?? ""));
  return passed[0] ?? null;
};
```

- [ ] **Step 3: Verify it compiles**

Run: `npx tsc --noEmit -p tsconfig.json`
Expected: no new errors in `lib/supabase/lobbies.ts`.

- [ ] **Step 4: Commit**

```bash
git add lib/supabase/lobbies.ts
git commit -m "feat(lobbies): add server data layer"
```

---

### Task 6: Client join wrapper

**Files:**
- Create: `lib/api/lobbies-client.ts`
- Reference (read for pattern, do not modify): `lib/api/enrollment-client.ts`

**Interfaces:**
- Consumes: `JOIN_LOBBY_ERROR`, `JoinLobbyResult` from `types/lobby.ts` (Task 4)
- Produces: `joinLobbyByCode(code: string): Promise<JoinLobbyResult>`

- [ ] **Step 1: Write the wrapper**

Every failure surfaces the same message. Do not pass through the raw Postgres error — that would reintroduce the oracle the RPC was written to avoid.

```typescript
"use client";

import { createClient } from "@/utils/supabase/client";
import { JOIN_LOBBY_ERROR, type JoinLobbyResult } from "@/types/lobby";

/**
 * Join a lobby by its 6-character code.
 * Any failure — bad code, closed lobby, network — surfaces JOIN_LOBBY_ERROR,
 * so callers cannot distinguish "no such code" from "closed".
 */
export const joinLobbyByCode = async (
  code: string
): Promise<JoinLobbyResult> => {
  const supabase = createClient();

  const { data, error } = await supabase.rpc("join_lobby_by_code", {
    code: code.trim().toUpperCase(),
  });

  if (error) {
    console.error("Join lobby failed:", error);
    throw new Error(JOIN_LOBBY_ERROR);
  }

  const row = Array.isArray(data) ? data[0] : data;
  if (!row?.lobby_id || !row?.map_id) {
    throw new Error(JOIN_LOBBY_ERROR);
  }

  return { lobby_id: row.lobby_id, map_id: row.map_id };
};
```

- [ ] **Step 2: Confirm the client helper path**

Run: `ls utils/supabase/client.ts && grep -n "export" utils/supabase/client.ts`
Expected: a `createClient` export. If the file exports a different name, adjust the import — do not create a new client.

- [ ] **Step 3: Verify it compiles**

Run: `npx tsc --noEmit -p tsconfig.json`
Expected: no new errors.

- [ ] **Step 4: Commit**

```bash
git add lib/api/lobbies-client.ts
git commit -m "feat(lobbies): add client join-by-code wrapper"
```

---

### Task 7: Code gate UI *(delegate to Kimi)*

**Files:**
- Create: `components/map/LobbyCodeGate.tsx`

**Interfaces:**
- Consumes: `joinLobbyByCode` (Task 6), `JOIN_LOBBY_ERROR` (Task 4)
- Produces: `<LobbyCodeGate map={...} onJoined={() => void} />`

- [ ] **Step 1: Build the component**

Requirements — hand these to Kimi verbatim:

- Props: `map: { id, title, description, cover_image_url, node_count, avg_difficulty, category }` and `onJoined: () => void`.
- Renders the **public preview**: cover image, title, description, node count, difficulty, category. Visible to everyone including signed-out users.
- Below the preview, a code form: a single 6-character input, auto-uppercasing, `maxLength={6}`, and a submit button disabled until 6 characters are entered.
- On submit call `joinLobbyByCode(code)`. On success call `onJoined()`. On failure show `JOIN_LOBBY_ERROR` verbatim — never a raw error.
- Loading state on the button while the request is in flight; the form must not be double-submittable.
- If the user is signed out, the button routes to `/login?redirect=/map/<id>` instead of calling the RPC.
- Reuse `.ei-card` from `app/globals.css` — do not redefine card styles inline. Follow `docs/ui-design-system.md`.
- Use existing Shadcn `Button`, `Input`, and `useToast` from `components/ui/`.

- [ ] **Step 2: Verify it compiles**

Run: `npx tsc --noEmit -p tsconfig.json`
Expected: no new errors.

- [ ] **Step 3: Commit**

```bash
git add components/map/LobbyCodeGate.tsx
git commit -m "feat(lobbies): add lobby code gate component"
```

---

### Task 8: Gate the map detail page *(delegate to Kimi)*

**Files:**
- Modify: `app/map/[id]/page.tsx`
- Modify: `app/map/client-page.tsx`

**Interfaces:**
- Consumes: `getUserLobbyForMap` (Task 5), `LobbyCodeGate` (Task 7)

- [ ] **Step 1: Add the membership branch to the detail page**

In `app/map/[id]/page.tsx`, the existing code already fetches `user` and `map` concurrently and computes `userIsAdmin` / `userIsInstructor`. Add a lobby-membership check to that flow and branch on it.

After the existing `map.map_type === 'seed'` guard, add:

```typescript
import { getUserLobbyForMap } from "@/lib/supabase/lobbies";
import { LobbyCodeGate } from "@/components/map/LobbyCodeGate";

// ...inside the component, after userIsInstructor is computed:
const userLobby = user ? await getUserLobbyForMap(params.id) : null;
const canBypassGate = userIsAdmin || userIsInstructor || map.creator_id === user?.id;

if (!userLobby && !canBypassGate) {
  return (
    <LobbyCodeGateWrapper
      map={{
        id: map.id,
        title: map.title,
        description: map.description,
        cover_image_url: map.cover_image_url,
        node_count: map.nodes?.length ?? 0,
        avg_difficulty: map.avg_difficulty ?? 0,
        category: map.category,
      }}
    />
  );
}
```

`LobbyCodeGate` is a client component with an `onJoined` callback, so it needs a thin client wrapper that calls `router.refresh()` on join. Create that wrapper inside `components/map/LobbyCodeGate.tsx` as a named export `LobbyCodeGateWrapper` that takes only `map` and supplies `onJoined`.

**Admins, instructors, and the map creator bypass the gate** — otherwise an admin cannot preview their own map without joining a lobby.

- [ ] **Step 2: Stop enroll-on-click in the map list**

In `app/map/client-page.tsx`, the list currently opens `MapEnrollmentDialog` via `handleStartAdventure` from `useMapOperations`. Change card clicks to navigate to `/map/<id>` instead.

First, find every call site:

Run: `grep -rn "handleStartAdventure\|MapEnrollmentDialog\|selectedMapForEnrollment" app/ components/ hooks/`

Then, in `app/map/client-page.tsx`, replace the `handleStartAdventure` handler passed to `MapSection` with `(mapId: string) => router.push(\`/map/${mapId}\`)`, and remove the `MapEnrollmentDialog` render plus its now-unused state. Leave `hooks/use-map-operations.ts` exports intact if other pages still use them — the grep tells you.

- [ ] **Step 3: Verify it compiles and the gate renders**

Run: `npx tsc --noEmit -p tsconfig.json && pnpm build`
Expected: build succeeds. Then run `pnpm dev` and visit `/map/<some-map-id>` as a signed-in non-member: the preview plus code form should render, with no node canvas.

- [ ] **Step 4: Commit**

```bash
git add "app/map/[id]/page.tsx" app/map/client-page.tsx components/map/LobbyCodeGate.tsx
git commit -m "feat(lobbies): gate map detail page behind lobby membership"
```

---

### Task 9: Presence hook *(delegate to Kimi)*

**Files:**
- Create: `hooks/use-lobby-presence.ts`

**Interfaces:**
- Consumes: `LobbyPresenceEntry` (Task 4)
- Produces: `useLobbyPresence(mapId: string, initial: LobbyPresenceEntry[]): { presenceByNode: Record<string, LobbyPresenceEntry[]> }`

- [ ] **Step 1: Build the hook**

Requirements — hand these to Kimi verbatim:

- Signature: `useLobbyPresence(mapId, initial)` where `initial` is the server-fetched array from `getLobbyPresence`.
- Holds `LobbyPresenceEntry[]` in state, seeded from `initial`.
- Subscribes to Supabase Realtime on `postgres_changes` for `student_node_progress`, events `INSERT` and `UPDATE`.
- On an event for a user already in the list, update that user's entry to the new node — **one entry per user at all times**. Ignore events for users not in the list (they are not lobbymates).
- Returns `presenceByNode`: entries grouped by `node_id`, memoized with `useMemo`.
- **Must unsubscribe on unmount** via the cleanup returned from `useEffect` — a leaked channel per map visit is a real bug.
- Uses `createClient` from `@/utils/supabase/client`.

- [ ] **Step 2: Verify the Realtime pattern matches the codebase**

Run: `grep -rn "postgres_changes\|\.channel(" hooks/ lib/ components/ | head -20`
Expected: at least one existing subscription. Match its channel-naming and cleanup style. If none exists, use `supabase.channel(\`lobby-presence-${mapId}\`)` and `supabase.removeChannel(channel)` in cleanup.

- [ ] **Step 3: Verify it compiles**

Run: `npx tsc --noEmit -p tsconfig.json`
Expected: no new errors.

- [ ] **Step 4: Commit**

```bash
git add hooks/use-lobby-presence.ts
git commit -m "feat(lobbies): add live presence hook"
```

---

### Task 10: Node avatars *(delegate to Kimi)*

**Files:**
- Create: `components/map/MapViewer/components/NodePresenceAvatars.tsx`
- Modify: `components/map/MapViewer/components/GameNode.tsx`
- Modify: `components/map/MapViewer/types/index.ts`

**Interfaces:**
- Consumes: `LobbyPresenceEntry` (Task 4), `presenceByNode` (Task 9)
- Produces: `<NodePresenceAvatars entries={LobbyPresenceEntry[]} />`

- [ ] **Step 1: Build the avatar ring**

Requirements — hand these to Kimi verbatim:

- Props: `entries: LobbyPresenceEntry[]`.
- Renders up to **3** avatars positioned around the node's circular border, then a `+N` chip when `entries.length > 3`.
- Each avatar: circular, ~32px, 2px border, `profiles.avatar_url` when present, otherwise the first initial of `full_name` on a colored background. Derive the background color deterministically from `user_id` so a given student keeps one color.
- Position avatars absolutely around the ring — top-right, right, bottom-right at roughly 45°/0°/-45° — matching the reference screenshot where badges sit on the circular border.
- Clicking any avatar opens a popover listing all entries for that node with full names.
- Animate position changes with a CSS transition so a student moving nodes visibly slides. Follow `docs/ui-design-system.md`: animate `clip-path + opacity + filter` together for any glow, and use `cubic-bezier(0.05, 0.7, 0.35, 0.99)` for tension.
- Must not intercept node click/drag except on the avatars themselves — wrap in a container that is `pointer-events-none`, with `pointer-events-auto` on the avatars.

- [ ] **Step 2: Mount into GameNode**

`components/map/MapViewer/components/GameNode.tsx` is 325 lines; its root is `<div className="relative inline-block group w-fit h-fit">` at line 187. Existing badges use the `absolute -top-2 -right-2 z-50` pattern (lines 74, 93, 148, 170) — follow it.

Add `<NodePresenceAvatars entries={data.presenceEntries ?? []} />` as a child of that root div, after the existing badges. Extend the node data type in `components/map/MapViewer/types/index.ts` with `presenceEntries?: LobbyPresenceEntry[]`.

Wire the data through: `MapViewer/index.tsx` calls `useLobbyPresence`, and `utils/nodeTransformers.ts` attaches `presenceByNode[node.id]` to each node's `data` — the same place other per-node data is attached.

- [ ] **Step 3: Verify visually**

Run: `pnpm build` then `pnpm dev`.
Expected: build succeeds. On a map where two users in one lobby have progress, both avatars appear on their respective nodes and survive pan/zoom without drifting.

- [ ] **Step 4: Commit**

```bash
git add components/map/MapViewer/
git commit -m "feat(lobbies): show lobbymate avatars on map nodes"
```

---

### Task 11: Security tests

**Files:**
- Create: `lib/supabase/__tests__/lobby-rls.test.ts`
- Reference (read for pattern, do not modify): `lib/supabase/__tests__/rls-security-lints.test.ts`

**Interfaces:**
- Consumes: all migrations (Tasks 1-3)

**This task must not be skipped.** Re-read the "Testing note" near the top of this plan: the existing RLS suite self-skips without a reachable DB. These tests are the defense against cross-lobby leaks, so they require `SUPABASE_DB_URL` pointing at a scratch or staging database. Never production — they create and delete rows.

- [ ] **Step 1: Write the failing tests**

```typescript
/**
 * @jest-environment node
 *
 * Lobby RLS — cross-lobby isolation.
 *
 * The load-bearing guarantee: a student in lobby A must never read the progress
 * of a student in lobby B, even on the same map.
 *
 * Requires a reachable Postgres via SUPABASE_DB_URL. Creates and removes its own
 * fixtures inside a rolled-back transaction. Never point this at production.
 */

import { Client } from "pg";

const DB_URL =
  process.env.SUPABASE_DB_URL ??
  "postgresql://postgres:postgres@127.0.0.1:54322/postgres";

let client: Client;
let reachable = false;

beforeAll(async () => {
  client = new Client({ connectionString: DB_URL });
  try {
    await client.connect();
    reachable = true;
  } catch {
    reachable = false;
  }
});

afterAll(async () => {
  if (reachable) await client.end();
});

describe("lobby RLS", () => {
  test("database is reachable", () => {
    expect(reachable).toBe(true);
  });

  test("shares_lobby_with is SECURITY DEFINER with pinned search_path", async () => {
    if (!reachable) throw new Error("DB unreachable");
    const { rows } = await client.query(`
      SELECT p.prosecdef, p.proconfig
      FROM pg_proc p
      JOIN pg_namespace n ON n.oid = p.pronamespace
      WHERE n.nspname = 'public' AND p.proname = 'shares_lobby_with'
    `);
    expect(rows).toHaveLength(1);
    expect(rows[0].prosecdef).toBe(true);
    expect(rows[0].proconfig).toContain("search_path=public");
  });

  test("student_node_progress has a lobbymate SELECT policy and no new write policy", async () => {
    if (!reachable) throw new Error("DB unreachable");
    const { rows } = await client.query(`
      SELECT polname, polcmd FROM pg_policy
      WHERE polrelid = 'public.student_node_progress'::regclass
        AND polname = 'Lobbymates can view progress'
    `);
    expect(rows).toHaveLength(1);
    expect(rows[0].polcmd).toBe("r"); // r = SELECT only
  });

  test("cross-lobby progress is not visible", async () => {
    if (!reachable) throw new Error("DB unreachable");
    await client.query("BEGIN");
    try {
      const { rows: setup } = await client.query(`
        WITH m AS (
          INSERT INTO learning_maps (title, description)
          VALUES ('RLS Test Map', 'fixture') RETURNING id
        ),
        n AS (
          INSERT INTO map_nodes (map_id, title)
          SELECT id, 'Node 1' FROM m RETURNING id, map_id
        ),
        ua AS (
          INSERT INTO profiles (id, full_name)
          VALUES (gen_random_uuid(), 'Student A') RETURNING id
        ),
        ub AS (
          INSERT INTO profiles (id, full_name)
          VALUES (gen_random_uuid(), 'Student B') RETURNING id
        ),
        la AS (
          INSERT INTO map_lobbies (map_id, name) SELECT id, 'Lobby A' FROM m RETURNING id
        ),
        lb AS (
          INSERT INTO map_lobbies (map_id, name) SELECT id, 'Lobby B' FROM m RETURNING id
        ),
        ma AS (
          INSERT INTO lobby_members (lobby_id, user_id)
          SELECT la.id, ua.id FROM la, ua RETURNING user_id
        ),
        mb AS (
          INSERT INTO lobby_members (lobby_id, user_id)
          SELECT lb.id, ub.id FROM lb, ub RETURNING user_id
        ),
        pb AS (
          INSERT INTO student_node_progress (user_id, node_id, status)
          SELECT ub.id, n.id, 'in_progress' FROM ub, n RETURNING id
        )
        SELECT (SELECT id FROM ua) AS user_a,
               (SELECT id FROM ub) AS user_b,
               (SELECT map_id FROM n) AS map_id
      `);

      const { user_a, user_b, map_id } = setup[0];

      // Student A asks whether they share a lobby with Student B: they must not.
      const { rows: shared } = await client.query(
        `SELECT set_config('request.jwt.claims',
                 json_build_object('sub', $1::text)::text, true);
         SELECT public.shares_lobby_with($2::uuid, $3::uuid) AS shares`,
        [user_a, user_b, map_id]
      );
      expect(shared[0].shares).toBe(false);
    } finally {
      await client.query("ROLLBACK");
    }
  });

  test("same-lobby progress IS visible", async () => {
    if (!reachable) throw new Error("DB unreachable");
    await client.query("BEGIN");
    try {
      const { rows: setup } = await client.query(`
        WITH m AS (
          INSERT INTO learning_maps (title, description)
          VALUES ('RLS Test Map 2', 'fixture') RETURNING id
        ),
        ua AS (
          INSERT INTO profiles (id, full_name)
          VALUES (gen_random_uuid(), 'Student A') RETURNING id
        ),
        ub AS (
          INSERT INTO profiles (id, full_name)
          VALUES (gen_random_uuid(), 'Student B') RETURNING id
        ),
        l AS (
          INSERT INTO map_lobbies (map_id, name) SELECT id, 'Shared' FROM m RETURNING id, map_id
        ),
        ma AS (
          INSERT INTO lobby_members (lobby_id, user_id)
          SELECT l.id, ua.id FROM l, ua RETURNING user_id
        ),
        mb AS (
          INSERT INTO lobby_members (lobby_id, user_id)
          SELECT l.id, ub.id FROM l, ub RETURNING user_id
        )
        SELECT (SELECT id FROM ua) AS user_a,
               (SELECT id FROM ub) AS user_b,
               (SELECT map_id FROM l) AS map_id
      `);

      const { user_a, user_b, map_id } = setup[0];

      const { rows: shared } = await client.query(
        `SELECT set_config('request.jwt.claims',
                 json_build_object('sub', $1::text)::text, true);
         SELECT public.shares_lobby_with($2::uuid, $3::uuid) AS shares`,
        [user_a, user_b, map_id]
      );
      expect(shared[0].shares).toBe(true);
    } finally {
      await client.query("ROLLBACK");
    }
  });

  test("join_lobby_by_code gives an identical error for closed and invalid", async () => {
    if (!reachable) throw new Error("DB unreachable");
    await client.query("BEGIN");
    try {
      const { rows } = await client.query(`
        WITH m AS (
          INSERT INTO learning_maps (title, description)
          VALUES ('Closed Map', 'fixture') RETURNING id
        ),
        u AS (
          INSERT INTO profiles (id, full_name)
          VALUES (gen_random_uuid(), 'Joiner') RETURNING id
        ),
        l AS (
          INSERT INTO map_lobbies (map_id, name, is_open)
          SELECT id, 'Closed', false FROM m RETURNING join_code
        )
        SELECT (SELECT join_code FROM l) AS code, (SELECT id FROM u) AS user_id
      `);
      const { code, user_id } = rows[0];

      await client.query(
        `SELECT set_config('request.jwt.claims',
                 json_build_object('sub', $1::text)::text, true)`,
        [user_id]
      );

      const closedErr = await client
        .query("SELECT public.join_lobby_by_code($1)", [code])
        .then(() => null)
        .catch((e: Error) => e.message);

      const invalidErr = await client
        .query("SELECT public.join_lobby_by_code($1)", ["ZZZZZZ"])
        .then(() => null)
        .catch((e: Error) => e.message);

      expect(closedErr).toBeTruthy();
      expect(closedErr).toBe(invalidErr); // no oracle
    } finally {
      await client.query("ROLLBACK");
    }
  });

  test("no enrollment is left without a lobby after backfill", async () => {
    if (!reachable) throw new Error("DB unreachable");
    const { rows } = await client.query(
      "SELECT count(*)::int AS orphaned FROM user_map_enrollments WHERE lobby_id IS NULL"
    );
    expect(rows[0].orphaned).toBe(0);
  });
});
```

- [ ] **Step 2: Run and watch them fail if migrations are missing**

Run: `SUPABASE_DB_URL=<scratch-db-url> npx jest lib/supabase/__tests__/lobby-rls.test.ts`
Expected against a database **without** the migrations: failures on the policy and function tests. This confirms the tests actually assert something.

- [ ] **Step 3: Apply migrations and re-run**

Run the three migrations from Tasks 1-3 against the scratch DB, then:
`SUPABASE_DB_URL=<scratch-db-url> npx jest lib/supabase/__tests__/lobby-rls.test.ts`
Expected: **all tests pass, zero skipped.** A skipped suite is a failed task.

- [ ] **Step 4: Adjust fixtures if column names differ**

The fixtures above assume `learning_maps(title, description)`, `map_nodes(map_id, title)`, and `profiles(id, full_name)`. If any insert fails on a missing or NOT NULL column, run `psql "$SUPABASE_DB_URL" -c "\d learning_maps"` (and the same for `map_nodes`, `profiles`) and add the required columns to the fixture. Do not weaken an assertion to make a test pass.

- [ ] **Step 5: Commit**

```bash
git add lib/supabase/__tests__/lobby-rls.test.ts
git commit -m "test(lobbies): add cross-lobby RLS isolation tests"
```

---

### Task 12: Admin lobby management *(delegate to Kimi)*

**Files:**
- Create: `components/admin/lobbies/LobbyManagerDialog.tsx`
- Create: `components/admin/lobbies/LobbyList.tsx`
- Create: `components/admin/lobbies/LobbyRoster.tsx`
- Modify: `components/admin/AdminMapsManagement.tsx`

**Interfaces:**
- Consumes: `createLobby`, `getLobbiesForMap`, `getLobbyRoster`, `setLobbyOpen` (Task 5); `MapLobbyWithCount`, `LobbyRosterEntry` (Task 4)

Note `app/admin/maps/page.tsx` is only 15 lines and renders `<AdminMapsManagement />` — the row actions live in that component, so it is the one to modify. Keep the page file untouched.

- [ ] **Step 1: Build the three components**

Requirements — hand these to Kimi verbatim:

- **`LobbyList`** — props `{ mapId: string; onSelect: (lobbyId: string) => void }`. Lists lobbies via `getLobbiesForMap`: name, join code in a monospace font with a copy-to-clipboard button, member count, and an open/closed `Switch` calling `setLobbyOpen`. A "New lobby" row takes a name and calls `createLobby`; the generated code appears immediately. Clicking a lobby calls `onSelect`.
- **`LobbyRoster`** — props `{ lobbyId: string; onBack: () => void }`. Table via `getLobbyRoster`: avatar, name, current node title (or "Not started"), completed count. Read-only — no kick/remove. A back button calls `onBack`.
- **`LobbyManagerDialog`** — props `{ mapId: string; mapTitle: string; open: boolean; onOpenChange: (o: boolean) => void }`. Holds `selectedLobbyId` state and shows `LobbyList` when null, `LobbyRoster` otherwise.
- Use existing Shadcn `Dialog`, `Table`, `Switch`, `Button`, `Input`, `useToast` from `components/ui/`.
- Since these call server functions from a client component, add a thin route handler at `app/api/admin/lobbies/route.ts` (GET list, POST create, PATCH open/close) and `app/api/admin/lobbies/[id]/roster/route.ts` (GET roster) rather than importing server code into the client. Validate every input and confirm the caller is an admin in each handler.

- [ ] **Step 2: Wire the action into the maps table**

In `components/admin/AdminMapsManagement.tsx`, add a "Lobbies" button to each map row that opens `LobbyManagerDialog` with that map's id and title. Find the existing row-actions block first:

Run: `grep -n "DropdownMenu\|<Button\|actions\|row" components/admin/AdminMapsManagement.tsx | head -30`

Match whatever pattern the other row actions use.

- [ ] **Step 3: Verify end to end**

Run: `pnpm build` then `pnpm dev`. As an admin, open `/admin/maps`, click **Lobbies** on a map, create a lobby, and copy the code. In a second browser signed in as a student, visit that map, enter the code, and confirm the canvas appears.
Expected: the full round trip works.

- [ ] **Step 4: Commit**

```bash
git add components/admin/lobbies/ components/admin/AdminMapsManagement.tsx app/api/admin/lobbies/
git commit -m "feat(lobbies): add admin lobby management UI"
```

---

### Task 13: Final verification

**Files:** none (verification only)

- [ ] **Step 1: Full test suite**

Run: `pnpm test`
Expected: passes. Note any pre-existing failures separately from new ones — do not claim success if the lobby tests skipped.

- [ ] **Step 2: Lint and build**

Run: `pnpm lint && pnpm build`
Expected: both succeed.

- [ ] **Step 3: Confirm the invariant on the target database**

Run: `psql "$SUPABASE_DB_URL" -c "SELECT count(*) FROM user_map_enrollments WHERE lobby_id IS NULL;"`
Expected: `0`.

- [ ] **Step 4: Manual smoke test of the five flows**

1. Signed-out visitor sees the map preview at `/map/<id>` — no canvas.
2. Signed-in non-member sees preview + code form.
3. Wrong code shows exactly `That code isn't valid or the lobby is closed.`
4. Correct code grants access and the canvas renders.
5. Two students in one lobby see each other's avatars, and an avatar moves when one advances a node.

- [ ] **Step 5: Commit any fixes**

```bash
git add -A
git commit -m "fix(lobbies): address final verification findings"
```

---

## Notes for the implementer

- **Do not touch `utils/supabase/public-routes.ts`.** `/map` is already public; the gate is data-access based. CLAUDE.md records repeated debugging sessions caused by changes there.
- **Do not edit `components/map/MapViewer.tsx` or `MapViewer.refactored.tsx`** — they are re-export shims. The real component is `components/map/MapViewer/index.tsx`.
- **The `— Legacy` lobby name uses an em dash.** It is matched by string equality in the Task 2 backfill; changing it in one place and not the other breaks the backfill's idempotency.
- **If `pnpm build` fails on a pre-existing error unrelated to lobbies**, note it and continue — but never mark a task complete on a build you did not see succeed.
