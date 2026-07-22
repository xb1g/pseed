"use client";

import Link from "next/link";
import { ChevronLeft, ChevronRight, Map } from "lucide-react";

interface PlayerHeaderProps {
  dayNumber: number;
  totalDays: number;
  dayTitle: string | null;
  /** Completed vs total activities for this day — drives the progress bar */
  completed: number;
  total: number;
  onOpenMap?: () => void;
  onPreviousDay?: () => void;
  onNextDay?: () => void;
}

const iconButton =
  "inline-flex h-9 w-9 items-center justify-center rounded-lg text-neutral-400 transition-colors hover:bg-white/[0.06] hover:text-white disabled:pointer-events-none disabled:opacity-30";

/**
 * Slim fixed chrome: where you are in the week, how far into the day, and the
 * ways out. Everything else belongs in the scroll region.
 */
export function PlayerHeader({
  dayNumber,
  totalDays,
  dayTitle,
  completed,
  total,
  onOpenMap,
  onPreviousDay,
  onNextDay,
}: PlayerHeaderProps) {
  const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div className="mx-auto w-full max-w-3xl px-4 sm:px-6">
      <div className="flex h-12 items-center gap-2">
        <Link
          href="/seeds?gallery=1&type=pathlab"
          aria-label="Leave this day"
          className={iconButton}
        >
          <ChevronLeft className="h-5 w-5" />
        </Link>

        <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-300/80">
          Day {dayNumber} / {totalDays}
        </span>

        <div className="ml-auto flex items-center gap-0.5">
          {onOpenMap && (
            <button
              type="button"
              onClick={onOpenMap}
              aria-label="See what's coming"
              className={iconButton}
            >
              <Map className="h-[18px] w-[18px]" />
            </button>
          )}
          <button
            type="button"
            onClick={onPreviousDay}
            disabled={!onPreviousDay}
            aria-label="Previous day"
            className={iconButton}
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={onNextDay}
            disabled={!onNextDay}
            aria-label="Next day"
            className={iconButton}
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="pb-3">
        <h1 className="truncate text-[15px] font-semibold leading-6 text-white">
          {dayTitle || `Day ${dayNumber}`}
        </h1>
        {total > 0 && (
          <div
            className="mt-2 h-[3px] w-full overflow-hidden rounded-full bg-white/[0.08]"
            role="progressbar"
            aria-valuenow={percent}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`${completed} of ${total} activities complete`}
          >
            <div
              className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-500 transition-[width] duration-500 ease-out"
              style={{ width: `${percent}%` }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
