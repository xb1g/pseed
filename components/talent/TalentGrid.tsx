"use client";

import { useState } from "react";
import type { TalentProfile } from "@/lib/talent";
import { TalentCard } from "./TalentCard";

const TRACKS = [
  { key: "all", label: "All" },
  { key: "dev", label: "Developer", classes: "bg-blue-500/20 text-blue-300 ring-blue-500/30" },
  { key: "video", label: "Video", classes: "bg-pink-500/20 text-pink-300 ring-pink-500/30" },
  { key: "strategy", label: "Strategy", classes: "bg-amber-500/20 text-amber-300 ring-amber-500/30" },
  { key: "design", label: "Design", classes: "bg-purple-500/20 text-purple-300 ring-purple-500/30" },
] as const;

interface TalentGridProps {
  profiles: TalentProfile[];
}

export function TalentGrid({ profiles }: TalentGridProps) {
  const [activeTrack, setActiveTrack] = useState<string>("all");

  const filtered =
    activeTrack === "all" ? profiles : profiles.filter((p) => p.track === activeTrack);

  function trackCount(key: string) {
    return key === "all" ? profiles.length : profiles.filter((p) => p.track === key).length;
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Filter pills */}
      <div className="flex flex-wrap gap-2">
        {TRACKS.map((track) => {
          const isActive = activeTrack === track.key;
          const activeClasses =
            track.key === "all"
              ? "bg-white/15 text-white ring-white/30"
              : `${track.classes} ring-current`;
          const inactiveClasses =
            "bg-white/5 text-slate-400 ring-white/10 hover:bg-white/10 hover:text-white";

          return (
            <button
              key={track.key}
              onClick={() => setActiveTrack(track.key)}
              className={`rounded-full px-4 py-1.5 text-sm font-semibold ring-1 transition-all duration-150 ${
                isActive ? activeClasses : inactiveClasses
              }`}
            >
              {track.label}
              <span className="ml-1.5 text-xs opacity-60">{trackCount(track.key)}</span>
            </button>
          );
        })}
      </div>

      {/* Card grid */}
      {filtered.length === 0 ? (
        <p className="text-center text-sm text-slate-500">No builders in this track yet.</p>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((profile) => (
            <TalentCard key={profile.id} profile={profile} />
          ))}
        </div>
      )}
    </div>
  );
}
