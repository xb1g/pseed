"use client";

import React from "react";

/**
 * SubmissionListSkeleton — perf-first loading placeholder.
 *
 * Bad-network considerations:
 *
 *   - Shimmer is a SINGLE shared overlay (`.skeleton-shimmer`) positioned
 *     over the whole list and animated once via `transform`. The previous
 *     version ran one `::after` animation per bar, which on a CPU-throttled
 *     phone over 3G compounds into jank during scroll.
 *
 *   - No `will-change` on individual bars. `will-change` allocates a
 *     compositor layer per element; for ~13 bars that means more layers
 *     than the page has any business with. The shimmer overlay is the
 *     only promoted layer.
 *
 *   - Bars are 1px-high gradients. Skeleton paint cost is roughly
 *     constant regardless of viewport width.
 *
 *   - Rows beyond the first use `content-visibility: auto` so off-screen
 *     rows skip paint during scroll.
 *
 *   - Decorative only. Live-region copy lives in <LoadingShell />.
 */
export function SubmissionListSkeleton({
  rows = 3,
}: {
  rows?: number;
}) {
  return (
    <div
      className="relative"
      aria-hidden="true"
      data-testid="submission-list-skeleton"
    >
      <ul className="space-y-3">
        {Array.from({ length: rows }).map((_, i) => (
          <li
            key={i}
            className="border rounded-lg p-3"
            style={
              i > 0
                ? ({
                    contentVisibility: "auto",
                    containIntrinsicSize: "0 96px",
                  } as React.CSSProperties)
                : undefined
            }
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="skeleton-bar skeleton-bar--avatar" />
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="skeleton-bar skeleton-bar--name" />
                  <div className="skeleton-bar skeleton-bar--node" />
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <div className="skeleton-bar skeleton-bar--chip" />
                <div className="skeleton-bar skeleton-bar--badge" />
              </div>
            </div>
            <div className="mt-3 space-y-1.5">
              <div className="skeleton-bar skeleton-bar--line skeleton-bar--line-1" />
              <div className="skeleton-bar skeleton-bar--line skeleton-bar--line-2" />
            </div>
          </li>
        ))}
      </ul>
      {/* Single shared shimmer overlay — one compositor layer, one
          transform animation, covers every bar at once. */}
      <div className="skeleton-shimmer" aria-hidden="true" />
    </div>
  );
}