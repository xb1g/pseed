"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { createClient } from "@/utils/supabase/client";
import type { LobbyPresenceEntry, NodeProgressStatus } from "@/types/lobby";

interface ProgressChangeRow {
  user_id?: string;
  node_id?: string;
  status?: NodeProgressStatus;
  arrived_at?: string | null;
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

  // Re-seed only when the roster's *contents* change, not its identity. The
  // server component hands down a fresh array on every render, so depending on
  // `initial` directly reset state on each one -- overwriting every realtime
  // update the moment anything else re-rendered, which froze lobbymates on
  // their page-load positions.
  const initialKey = initial
    .map((e) => `${e.user_id}:${e.node_id}:${e.status}`)
    .sort()
    .join("|");
  // Seeded with the mount-time key: useState(initial) has already applied it.
  const seededKeyRef = useRef<string>(initialKey);

  useEffect(() => {
    // A realtime update legitimately diverges from the server snapshot, so only
    // re-seed when the server itself reports something new.
    if (seededKeyRef.current === initialKey) return;
    seededKeyRef.current = initialKey;
    setPresence(initial);
  }, [initialKey]);

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
        prev.map((entry) => {
          if (entry.user_id !== row.user_id) return entry;

          const status = row.status ?? entry.status;

          // A node someone is actively working is where they are.
          if (status === "in_progress") {
            return { ...entry, node_id: row.node_id as string, status };
          }

          // Finishing a node (passed/submitted/failed) fires an event on the
          // node just completed, not on the next one -- no row exists for the
          // next node until they open it. Moving the avatar onto the finished
          // node would walk it backwards, so hold position and let the next
          // in_progress event advance it. Only the status is refreshed.
          if (entry.node_id === row.node_id) {
            return { ...entry, status };
          }

          return entry;
        })
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
