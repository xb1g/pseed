"use client";

import { createClient } from "@/utils/supabase/client";
import { JOIN_LOBBY_ERROR, type JoinLobbyResult } from "@/types/lobby";

/**
 * Join a lobby by its 6-character code.
 *
 * Any failure -- bad code, closed lobby, network -- surfaces JOIN_LOBBY_ERROR,
 * so callers cannot distinguish "no such code" from "closed". Passing the raw
 * Postgres error through would reintroduce the oracle the RPC was written to
 * avoid.
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
