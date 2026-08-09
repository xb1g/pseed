"use client";

import React, { useMemo } from "react";
import Image from "next/image";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import type { LobbyPresenceEntry } from "@/types/lobby";

interface NodePresenceAvatarsProps {
  entries: LobbyPresenceEntry[];
}

/** Fixed palette for deterministic avatar backgrounds. */
const AVATAR_PALETTE = [
  "#ef4444", // red-500
  "#f97316", // orange-500
  "#f59e0b", // amber-500
  "#84cc16", // lime-500
  "#10b981", // emerald-500
  "#06b6d4", // cyan-500
  "#3b82f6", // blue-500
  "#8b5cf6", // violet-500
  "#d946ef", // fuchsia-500
  "#f43f5e", // rose-500
];

/** Simple string hash -> index into palette. */
function hashToColor(userId: string): string {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % AVATAR_PALETTE.length;
  return AVATAR_PALETTE[index];
}

/** Positions for up to 3 avatars around the right side of a circular node. */
const POSITIONS = [
  { top: "-6px", right: "-6px" },      // ~45deg  top-right
  { top: "50%", right: "-14px" },      // 0deg    right edge
  { bottom: "-6px", right: "-6px" },   // ~-45deg bottom-right
];

export function NodePresenceAvatars({ entries }: NodePresenceAvatarsProps) {
  if (!entries || entries.length === 0) return null;

  // With overflow, the third slot is given to the +N chip so the two never
  // stack on the same spot on the ring.
  const hasOverflow = entries.length > 3;
  const visible = hasOverflow ? entries.slice(0, 2) : entries.slice(0, 3);
  const overflow = hasOverflow ? entries.length - 2 : 0;

  return (
    <div className="absolute inset-0 pointer-events-none z-50">
      {visible.map((entry, index) => (
        <PresenceAvatar
          key={entry.user_id}
          entry={entry}
          position={POSITIONS[index]}
        />
      ))}
      {overflow > 0 && (
        <Popover>
          <PopoverTrigger asChild>
            <button
              className="absolute pointer-events-auto flex items-center justify-center rounded-full text-[10px] font-bold text-white shadow-md border-2 border-white/80"
              style={{
                width: 28,
                height: 28,
                bottom: -6,
                right: -6,
                backgroundColor: "#4b5563",
                transition:
                  "top 400ms cubic-bezier(0.05, 0.7, 0.35, 0.99), left 400ms cubic-bezier(0.05, 0.7, 0.35, 0.99), right 400ms cubic-bezier(0.05, 0.7, 0.35, 0.99), bottom 400ms cubic-bezier(0.05, 0.7, 0.35, 0.99)",
              }}
              aria-label={`${overflow} more lobbymates on this node`}
            >
              +{overflow}
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-56 p-3" side="top" align="center">
            <p className="text-xs font-semibold text-muted-foreground mb-2">
              Lobbymates here
            </p>
            <ul className="space-y-2">
              {entries.map((e) => (
                <li key={e.user_id} className="flex items-center gap-2">
                  <MiniAvatar entry={e} />
                  <span className="text-sm truncate">
                    {e.full_name || "Anonymous"}
                  </span>
                </li>
              ))}
            </ul>
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
}

/** Single avatar badge positioned around the node ring. */
function PresenceAvatar({
  entry,
  position,
}: {
  entry: LobbyPresenceEntry;
  position: { top?: string; right?: string; bottom?: string };
}) {
  const bgColor = useMemo(() => hashToColor(entry.user_id), [entry.user_id]);
  const initial = entry.full_name?.charAt(0)?.toUpperCase() || "?";

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          className="absolute pointer-events-auto rounded-full overflow-hidden shadow-md border-2 border-white/80 flex items-center justify-center"
          style={{
            width: 32,
            height: 32,
            ...position,
            transform: position.top === "50%" ? "translateY(-50%)" : undefined,
            transition:
              "top 400ms cubic-bezier(0.05, 0.7, 0.35, 0.99), left 400ms cubic-bezier(0.05, 0.7, 0.35, 0.99), right 400ms cubic-bezier(0.05, 0.7, 0.35, 0.99), bottom 400ms cubic-bezier(0.05, 0.7, 0.35, 0.99), transform 400ms cubic-bezier(0.05, 0.7, 0.35, 0.99)",
          }}
          title={entry.full_name || "Anonymous"}
          aria-label={entry.full_name || "Anonymous"}
        >
          {entry.avatar_url ? (
            <Image
              src={entry.avatar_url}
              alt={entry.full_name || "Avatar"}
              width={32}
              height={32}
              className="object-cover w-full h-full"
            />
          ) : (
            <span
              className="w-full h-full flex items-center justify-center text-xs font-bold text-white"
              style={{ backgroundColor: bgColor }}
            >
              {initial}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-48 p-3" side="top" align="center">
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
            style={{ backgroundColor: bgColor }}
          >
            {entry.avatar_url ? (
              <Image
                src={entry.avatar_url}
                alt={entry.full_name || "Avatar"}
                width={32}
                height={32}
                className="object-cover w-full h-full rounded-full"
              />
            ) : (
              initial
            )}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">
              {entry.full_name || "Anonymous"}
            </p>
            <p className="text-xs text-muted-foreground capitalize">
              {entry.status.replace("_", " ")}
            </p>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

/** Small inline avatar for the overflow popover list. */
function MiniAvatar({ entry }: { entry: LobbyPresenceEntry }) {
  const bgColor = useMemo(() => hashToColor(entry.user_id), [entry.user_id]);
  const initial = entry.full_name?.charAt(0)?.toUpperCase() || "?";

  return (
    <div
      className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0 overflow-hidden"
      style={{ backgroundColor: bgColor }}
    >
      {entry.avatar_url ? (
        <Image
          src={entry.avatar_url}
          alt={entry.full_name || "Avatar"}
          width={24}
          height={24}
          className="object-cover w-full h-full"
        />
      ) : (
        initial
      )}
    </div>
  );
}
