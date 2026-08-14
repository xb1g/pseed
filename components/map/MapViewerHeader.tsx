"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ClipboardCheck, Eye, Pencil } from "lucide-react";
import { useMapViewMode, type MapViewMode } from "./map-view-mode";

interface MapViewerHeaderProps {
  backHref: string;
  backLabel: string;
  title: string;
  canEdit: boolean;
  canGrade: boolean;
}

interface ModeSegment {
  value: MapViewMode;
  label: string;
  icon: typeof Eye;
}

const MODE_SEGMENTS: ModeSegment[] = [
  { value: "preview", label: "Preview", icon: Eye },
  { value: "edit", label: "Edit", icon: Pencil },
  { value: "grade", label: "Grade", icon: ClipboardCheck },
];

/**
 * Floating menu bar over the map canvas: back navigation on the left, the map
 * title dead-center, and (for privileged users) a segmented mode toggle on the
 * right that switches the side panel between Preview / Edit / Grade.
 */
export function MapViewerHeader({
  backHref,
  backLabel,
  title,
  canEdit,
  canGrade,
}: MapViewerHeaderProps) {
  const { mode, setMode } = useMapViewMode();

  const showModeToggle = canEdit || canGrade;
  const segments = MODE_SEGMENTS.filter((segment) =>
    segment.value === "preview"
      ? true
      : segment.value === "edit"
        ? canEdit
        : canGrade
  );

  return (
    <div className="absolute top-3 inset-x-3 z-10 flex items-center justify-between gap-2 sm:top-4 sm:inset-x-4">
      {/* Back navigation — warm dawn glass */}
      <Button
        asChild
        variant="outline"
        size="sm"
        className="shrink-0 border-white/10 bg-[#17120e]/70 text-stone-200 backdrop-blur-md hover:bg-[#241b14]/85 hover:text-amber-50"
      >
        <Link href={backHref}>
          <ArrowLeft className="h-4 w-4 sm:mr-2" />
          <span className="hidden sm:inline">{backLabel}</span>
        </Link>
      </Button>

      {/* Title pill, centered independently of the side controls */}
      <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
        <div className="max-w-[34vw] rounded-full border border-white/10 bg-[#17120e]/70 px-4 py-1.5 text-center shadow-lg shadow-black/20 backdrop-blur-md sm:max-w-xs">
          <p className="truncate text-sm font-semibold leading-tight text-amber-50">
            {title}
          </p>
        </div>
      </div>

      {/* Mode toggle (privileged users only) — pale gold active segment,
          the single warm statement against the night sky */}
      {showModeToggle && (
        <div
          role="group"
          aria-label="Map view mode"
          className="flex shrink-0 items-center gap-0.5 rounded-full border border-white/10 bg-[#17120e]/70 p-1 shadow-lg shadow-black/20 backdrop-blur-md"
        >
          {segments.map(({ value, label, icon: Icon }) => {
            const isActive = mode === value;
            return (
              <button
                key={value}
                type="button"
                aria-pressed={isActive}
                aria-label={`${label} mode`}
                title={`${label} mode`}
                onClick={() => setMode(value)}
                className={`flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200/60 sm:px-3 ${
                  isActive
                    ? "bg-gradient-to-b from-amber-200 via-amber-300 to-amber-400 text-amber-950 shadow-[0_0_16px_rgba(254,217,92,0.35)]"
                    : "text-stone-400 hover:bg-white/5 hover:text-amber-50"
                }`}
              >
                <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                <span className="hidden md:inline">{label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
