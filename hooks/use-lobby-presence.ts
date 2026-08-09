"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { createClient } from "@/utils/supabase/client";
import type { LobbyPresenceEntry, NodeProgressStatus } from "@/types/lobby";

interface ProgressChangeRow {
  user_id?: string;
  node_id?: string;
  status?: NodeProgressStatus;
}

/**
 * Subscribe to live lobby presence for a map.
 *
 * Only tracks users present in the initial roster: realtime events for unknown
 * users are ignored, which prevents leaking the positions of non-lobbymates.
 * Each tracked user has exactly one entry at all times, so a member's avatar
 * moves between nodes rather than multiplying.
 *
 * Note: student_node_progress has no map_id column (the map is reached via
 * map_nodes), so events cannot be filtered server-side by map. Instead every
 * progress change is received and filtered client-side against the roster --
 * which is the same check that enforces the lobbymate boundary.
 */
export function useLobbyPresence(
  mapId: string,
  initial: LobbyPresenceEntry[]
): { presenceByNode: Record<string, LobbyPresenceEntry[]> } {
  const [presence, setPresence] = useState<LobbyPresenceEntry[]>(initial);

  // Re-seed when the server sends a fresh roster (e.g. after a navigation).
  useEffect(() => {
    setPresence(initial);
  }, [initial]);

  // Ref so the realtime callback tests membership against current state
  // without closing over a stale value or resubscribing on every change.
  const knownUserIdsRef = useRef<Set<string>>(
    new Set(initial.map((e) => e.user_id))
  );

  useEffect(() => {
    knownUserIdsRef.current = new Set(presence.map((e) => e.user_id));
  }, [presence]);

  useEffect(() => {
    const supabase = createClient();

    const applyChange = (payload: { new: ProgressChangeRow }) => {
      const row = payload.new;
      if (!row?.user_id || !row?.node_id) return;

      // The lobbymate boundary: ignore anyone not in the initial roster.
      if (!knownUserIdsRef.current.has(row.user_id)) return;

      setPresence((prev) =>
        prev.map((entry) =>
          entry.user_id === row.user_id
            ? {
                ...entry,
                node_id: row.node_id as string,
                status: row.status ?? entry.status,
              }
            : entry
        )
      );
    };

    const channel = supabase
      .channel(`lobby-presence-${mapId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "student_node_progress" },
        applyChange
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "student_node_progress" },
        applyChange
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [mapId]);

  const presenceByNode = useMemo(() => {
    const grouped: Record<string, LobbyPresenceEntry[]> = {};
    for (const entry of presence) {
      (grouped[entry.node_id] ??= []).push(entry);
    }
    return grouped;
  }, [presence]);

  return { presenceByNode };
}
