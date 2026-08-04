"use client";

import { useRef, useState } from "react";
import type { TalentProfile } from "@/lib/talent";
import { TalentCard } from "./TalentCard";

const TRACKS = [
  { key: "all", label: "ทั้งหมด" },
  { key: "dev", label: "Developer" },
  { key: "video", label: "Video" },
  { key: "strategy", label: "Strategy" },
  { key: "design", label: "Design" },
] as const;

interface TalentGridProps {
  profiles: TalentProfile[];
}

export function TalentGrid({ profiles }: TalentGridProps) {
  const [activeTrack, setActiveTrack] = useState<string>("all");
  const scrollRef = useRef<HTMLDivElement>(null);

  const filtered =
    activeTrack === "all" ? profiles : profiles.filter((p) => p.track === activeTrack);

  function trackCount(key: string) {
    return key === "all" ? profiles.length : profiles.filter((p) => p.track === key).length;
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Filter pills — radar style */}
      <div className="border-b border-[#524746]/15 pb-4">
        <div
          ref={scrollRef}
          role="group"
          aria-label="กรองตามสาย"
          className="flex min-w-0 gap-2 overflow-x-auto py-1"
        >
          {TRACKS.map((track) => {
            const isActive = activeTrack === track.key;
            const count = trackCount(track.key);

            return (
              <button
                key={track.key}
                onClick={() => setActiveTrack(track.key)}
                aria-pressed={isActive}
                className={`shrink-0 min-h-11 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C43E1D]/70 ${
                  isActive
                    ? "border border-[#C43E1D]/50 bg-[#C43E1D]/15 text-[#C43E1D]"
                    : "border border-[#524746]/20 bg-[#524746]/5 text-[#524746]/70 hover:bg-[#524746]/10 hover:text-[#524746]"
                }`}
              >
                {track.label}
                <span className="ml-1.5 text-xs opacity-60">{count}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Card grid — radar layout */}
      {filtered.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-lg" style={{ color: "rgba(82,71,70,0.45)" }}>
            ยังไม่มีนักสร้างในสายนี้
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {filtered.map((profile) => (
            <TalentCard key={profile.id} profile={profile} />
          ))}
        </div>
      )}
    </div>
  );
}
