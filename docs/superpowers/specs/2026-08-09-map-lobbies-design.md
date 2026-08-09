# Map Lobbies — Design

**Date:** 2026-08-09
**Status:** Approved, pending implementation plan

## Problem

Today a student on `/map` clicks a map card and is enrolled immediately via
`MapEnrollmentDialog` → `enrollUserInMap`. There is no notion of a cohort: students
work maps in isolation and cannot see that anyone else is on the same map.

We want three things:

1. Clicking a map opens a **detail page** rather than enrolling directly.
2. Joining a map requires a **code**, issued by an admin.
3. Students in the same lobby **see each other's position** on the map's nodes —
   an avatar pinned to the node each classmate is currently working.

## Decisions

Recorded because each one closes off alternatives that would otherwise resurface:

| # | Decision | Rejected alternative |
|---|---|---|
| 1 | New `map_lobbies` table, independent of `classrooms` | Reusing `classrooms` (drags in teacher/assignment semantics) |
| 2 | Code required **always** — no solo enrollment | Optional code, or a per-map `requires_lobby_code` flag |
| 3 | Backfill a legacy lobby per map for existing enrollments | Grandfathering (creates a permanent null-lobby branch in every policy) |
| 4 | **Presence** model: one avatar per member, on their current node | Completion model (avatars on every passed node — unbounded per node) |
| 5 | Live updates via Supabase Realtime | Polling |
| 6 | Admin UI as a dialog on the existing `/admin/maps` page | Dedicated `/admin/maps/[id]/lobbies` route |
| 7 | `is_open` boolean for lobby lifecycle | Expiry dates, archival states |
| 8 | Map **preview** is public; only node content is gated | Gating the whole detail page behind membership |

Decision 2 is the load-bearing one: because every enrollment has a lobby, the
progress-visibility policy is a single join with no escape hatch. Decision 3 exists
to keep that invariant true for pre-existing data.

## Data model

### `map_lobbies`

| column | type | notes |
|---|---|---|
| `id` | uuid PK | |
| `map_id` | uuid FK → `learning_maps` | ON DELETE CASCADE |
| `name` | text NOT NULL | admin-facing label, e.g. "Period 3" |
| `join_code` | varchar(6) UNIQUE NOT NULL | `CHECK (join_code ~ '^[A-Z0-9]{6}$')`, default `generate_lobby_code()` |
| `is_open` | boolean NOT NULL DEFAULT true | gates **new joins only**; existing members unaffected |
| `created_by` | uuid FK → `profiles` | the admin |
| `created_at` | timestamptz DEFAULT now() | |

Index on `join_code` (implied by UNIQUE) and on `map_id`.

### `lobby_members`

| column | type | notes |
|---|---|---|
| `id` | uuid PK | |
| `lobby_id` | uuid FK → `map_lobbies` | ON DELETE CASCADE |
| `user_id` | uuid FK → `profiles` | ON DELETE CASCADE |
| `joined_at` | timestamptz DEFAULT now() | |
| | UNIQUE `(lobby_id, user_id)` | |

Index on `user_id` — the presence query and `shares_lobby_with()` both filter on it.

### `user_map_enrollments.lobby_id`

New **nullable** `uuid` FK → `map_lobbies`, added with `ADD COLUMN IF NOT EXISTS`.
Nullable in the schema because a `NOT NULL` add would fail against existing rows on a
prod-first apply; the backfill fills every row and application code treats it as
always present.

### `generate_lobby_code()`

Mirrors the existing `generate_join_code()` but checks `map_lobbies` for collisions.
The existing function is hardcoded to check `classrooms`, so it cannot be reused.

### Invariant

**One student, one map, one lobby.** Enforced by the pre-existing
`UNIQUE (user_id, map_id)` on `user_map_enrollments` — a student cannot hold two
enrollments for one map, therefore cannot be in two lobbies for it. This is what makes
the presence panel unambiguous about where a given student "is".

## Access control

The security-critical section: students must see lobbymates' progress and nobody else's.

### Recursion

The natural policy on `lobby_members` ("you can see members of lobbies you belong to")
queries `lobby_members` from inside a `lobby_members` policy, which Postgres rejects as
infinite recursion. Resolved with a `SECURITY DEFINER` helper that bypasses RLS for the
lookup:

```sql
CREATE OR REPLACE FUNCTION public.shares_lobby_with(target_user uuid, target_map uuid)
RETURNS boolean
LANGUAGE sql SECURITY DEFINER STABLE
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
```

`SET search_path = public` is mandatory — a `SECURITY DEFINER` function without a pinned
search_path is a privilege-escalation vector.

### Policies

- **`student_node_progress`** — additive SELECT policy: readable if `auth.uid() = user_id`
  **or** `shares_lobby_with(user_id, <node's map_id>)`, joining through `map_nodes.map_id`.
  Existing self-only policies are left intact. **SELECT only** — no new INSERT/UPDATE path,
  so a student still cannot write another student's progress.
- **`map_lobbies`** — members SELECT their own lobbies; admins full access. Code lookup does
  **not** go through a policy (see below).
- **`lobby_members`** — SELECT via `shares_lobby_with`; INSERT only as yourself, only into a
  lobby where `is_open = true`.

### Joining by code

A student must resolve a code to a lobby *before* being a member, but the SELECT policy
requires membership. Rather than open a policy that permits enumerating lobbies, joining
goes through a `SECURITY DEFINER` RPC:

```
join_lobby_by_code(code text) → { lobby_id, map_id }
```

It validates the code, checks `is_open`, and creates the `lobby_members` row **and** the
`user_map_enrollments` row in a single transaction — so there is no window where a student
is a member without an enrollment.

The RPC returns an **identical generic error** for "no such code" and "lobby closed", so it
cannot be used as an oracle to discover valid codes. It is also the natural place to add
rate limiting: six-character codes are brute-forceable in principle.

### Backfill

In the same migration, for each map having existing enrollments: create one lobby named
`"<Map title> — Legacy"` with `is_open = false`, and point every existing enrollment at it.
Closed by default so a leaked legacy code cannot be walked in on; an admin opens it
deliberately.

### Accepted exposure

Lobbymates gain read access to all columns of each other's `student_node_progress` rows —
status and timestamps. Status and position are precisely the feature; the timestamps
("submitted at 2am") are judged harmless in a classroom setting. If this changes, the fix is
a restricted view rather than a table policy.

## Student flow

**`/map` (index)** — map cards no longer call `enrollUserInMap`. Clicking navigates to the
detail page. `MapEnrollmentDialog`'s direct-enroll path is retired; the component is either
removed or repurposed as the code-entry dialog, decided by inspecting all call sites during
implementation.

**`/map/[id]` (detail)** — three states:

- **Not a member** — full **public preview**: title, description, cover image, node count,
  difficulty, category. Anyone may see what the map is and share a link. Withheld: node
  content and the canvas. Below the preview, the code entry form.
- **Member** — the full `MapViewer` canvas with the presence layer.
- **Signed out** — login redirect, returning to this page.

Submitting a code calls `join_lobby_by_code`. Success re-renders into the member state.
Failure shows one generic message: "That code isn't valid or the lobby is closed."

**Routing** — `/map/[id]` remains in `utils/supabase/public-routes.ts`; the gate is enforced
by data access, not middleware. The existing `20260808000000_grant_anon_select_learning_maps.sql`
grant is what makes the public preview work. Per CLAUDE.md, `public-routes.ts` is deliberately
not modified.

**Consequence:** membership is per-map, so a student working three maps holds three codes.
Codes are issued per map, not once per class.

## Presence layer

**Data** — one query per map load: lobbymates' `student_node_progress` joined to `profiles`
for name and avatar. Reduced client-side to one `{ user, node_id }` per member:
their `in_progress` node, else their furthest `passed` node, else the first node.

**Rendering** — avatars render as absolutely-positioned **children of the node component**,
hugging the node's circular border ring. As part of the node, they inherit React Flow's pan
and zoom transforms for free; an overlay layer would require duplicating that transform math.

**Overflow** — up to **3** avatars around the ring, then a `+N` chip. Clicking any avatar
opens a per-node roster popover. Preserves the mockup's look in the common case and degrades
cleanly at 25 students.

**Live updates** — a Supabase Realtime subscription on `student_node_progress` filtered to
lobby members, encapsulated in a `useLobbyPresence` hook with cleanup on unmount. On event,
the avatar animates from its old node to the new one; the movement is what makes the lobby
feel alive.

Frontend implementation is delegated to **Kimi** via the `/sub-agents` skill.

## Admin surface

On the existing `/admin/maps` page, each map row gains a **Lobbies** action opening a dialog
with two views:

- **Lobby list** — name, join code with copy button, member count, open/closed toggle, and a
  "New lobby" button (takes a name; code generated server-side and shown immediately).
- **Lobby detail** — roster of members with avatar, name, current node, completion count.
  Read-only.

**File organization** — `app/admin/maps/page.tsx` is currently a single file and is not grown
further. Lobby UI lives in `components/admin/lobbies/` as `LobbyManagerDialog`, `LobbyList`,
and `LobbyRoster`; the page imports only the dialog. Consistent with the CLAUDE.md rule
favouring deep, modular components over large files.

## Server functions

`lib/supabase/lobbies.ts`, mirroring the existing patterns in `enrollment.ts`:

| function | purpose |
|---|---|
| `createLobby(mapId, name)` | admin creates, code generated server-side |
| `getLobbiesForMap(mapId)` | admin list view |
| `getLobbyRoster(lobbyId)` | admin detail view |
| `setLobbyOpen(lobbyId, isOpen)` | the open/closed toggle |
| `joinLobbyByCode(code)` | client wrapper over the RPC |
| `getLobbyPresence(mapId)` | lobbymates' positions for the canvas |

Server client for admin reads; client wrapper for the join call.

## Testing

Integration tests in `lib/supabase/__tests__/`, following repo convention. The security cases
matter most and are written first:

1. A student in lobby A **cannot** read progress of a student in lobby B on the same map.
   *(The leak that matters most.)*
2. A student **can** read progress of a lobbymate.
3. `join_lobby_by_code` against a closed lobby fails with the **same error text** as an
   invalid code.
4. Joining creates membership and enrollment atomically — neither exists if the other fails.
5. After backfill, zero enrollments have a null `lobby_id`.

## Migration ordering

Prod-first, additive and idempotent throughout (per CLAUDE.md — production is the first
Postgres to parse these):

1. `generate_lobby_code()`
2. `map_lobbies`, `lobby_members` — `CREATE TABLE IF NOT EXISTS`
3. `user_map_enrollments.lobby_id` — `ADD COLUMN IF NOT EXISTS`, nullable
4. Backfill legacy lobbies (after the column exists)
5. `shares_lobby_with()`
6. RLS policies **last**, so they never reference a column that does not yet exist

## Out of scope

Removing or kicking members; lobby deletion; cross-map lobbies; leaderboards; chat;
per-map `requires_lobby_code`. Each is reachable from this design later.
