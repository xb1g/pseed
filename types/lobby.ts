export type NodeProgressStatus =
  | "not_started"
  | "in_progress"
  | "submitted"
  | "passed"
  | "failed";

/**
 * How much of a map a lobby's members can reach.
 * - "full": the whole map.
 * - "micro": the free tier. Only the first island's content is readable;
 *   every later island stays locked regardless of progress.
 */
export type LobbyAccessTier = "full" | "micro";

export const LOBBY_ACCESS_TIERS: LobbyAccessTier[] = ["full", "micro"];

export const isLobbyAccessTier = (value: unknown): value is LobbyAccessTier =>
  typeof value === "string" &&
  (LOBBY_ACCESS_TIERS as string[]).includes(value);

export interface MapLobby {
  id: string;
  map_id: string;
  name: string;
  join_code: string;
  is_open: boolean;
  access_tier: LobbyAccessTier;
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

export interface JoinLobbyResult {
  lobby_id: string;
  map_id: string;
}

/**
 * Shown verbatim on any join failure. Must not distinguish an invalid code from
 * a closed lobby -- otherwise the form becomes an oracle for discovering valid
 * codes. Kept in sync with the message raised by join_lobby_by_code().
 */
export const JOIN_LOBBY_ERROR = "That code isn't valid or the lobby is closed.";
