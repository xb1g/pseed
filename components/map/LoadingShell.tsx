"use client";

import React, { useEffect, useRef, useState } from "react";
import { SubmissionListSkeleton } from "./SubmissionListSkeleton";
import { Loader2, Wifi, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * LoadingShell — perf-first loading state for the submissions panels.
 *
 * Design priorities, in order, on a bad 3G link with packet loss:
 *
 *   1. Do not block the main thread. Skeletons use `transform` (compositor
 *      only) for shimmer, never `width/margin/height`. Layout is reserved
 *      once at mount and never recalculated.
 *
 *   2. Do not delay the moment data lands. There is no minimum-display
 *      timer; the moment `isLoading` flips false, the shell unmounts on
 *      the next frame. On flaky networks that ping-pong true/false, this
 *      keeps the UI honest: every successful response is visible
 *      immediately.
 *
 *   3. Surface failure clearly. After SLOW_MS with no resolution, swap
 *      the spinner for a "slow network" state with a manual retry button,
 *      and let the user cancel/retry rather than stare at a spinner.
 *
 *   4. Accessible without bloat. One live region, `aria-busy` reflects
 *      loading, icons are aria-hidden. No layout shift on announcement.
 */

const SLOW_MS = 6000;

interface LoadingShellProps {
  isLoading: boolean;
  /** Manual retry; called when the user clicks "Retry" in the slow state. */
  onRetry?: () => void;
  /** Skeleton rows. Default 3 keeps paint cost trivial. */
  rows?: number;
  headline?: string;
}

export function LoadingShell({
  isLoading,
  onRetry,
  rows = 3,
  headline = "Reading submissions",
}: LoadingShellProps) {
  const [slow, setSlow] = useState(false);
  // ref-based: avoid effect re-runs when onLoaded identity changes.
  const slowTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!isLoading) {
      // Loading resolved. Cancel any pending slow-state timer.
      if (slowTimerRef.current) {
        clearTimeout(slowTimerRef.current);
        slowTimerRef.current = null;
      }
      setSlow(false);
      return;
    }

    // Loading just started (or restarted). Begin the slow-network
    // watchdog.
    if (slowTimerRef.current) clearTimeout(slowTimerRef.current);
    slowTimerRef.current = setTimeout(() => setSlow(true), SLOW_MS);

    return () => {
      if (slowTimerRef.current) {
        clearTimeout(slowTimerRef.current);
        slowTimerRef.current = null;
      }
    };
  }, [isLoading]);

  if (!isLoading) return null;

  return (
    <div
      className="relative h-full"
      role="status"
      aria-live="polite"
      aria-busy={true}
      data-testid="loading-shell"
    >
      {/* Visually hidden announcement for AT users. */}
      <span className="sr-only">
        {slow
          ? "Loading submissions is taking longer than usual."
          : "Loading submissions."}
      </span>

      {slow ? (
        <div className="h-full flex flex-col items-center justify-center gap-3 px-6 text-center">
          <Wifi className="h-6 w-6 text-amber-300/80" aria-hidden="true" />
          <p className="text-sm text-stone-300">{headline}</p>
          <p className="text-xs text-stone-500 max-w-xs">
            The network is slow. Hold on, or try again.
          </p>
          {onRetry && (
            <Button
              size="sm"
              variant="outline"
              onClick={onRetry}
              className="mt-1"
            >
              <RefreshCw className="h-4 w-4 mr-1.5" aria-hidden="true" />
              Retry
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center gap-2 px-1 text-xs text-stone-500">
            <Loader2
              className="h-3.5 w-3.5 animate-spin text-amber-300/70"
              aria-hidden="true"
              style={{ animationDuration: "1.6s" }}
            />
            <span>{headline}</span>
          </div>
          <SubmissionListSkeleton rows={rows} />
        </div>
      )}
    </div>
  );
}