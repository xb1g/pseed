"use client";

import { memo } from "react";
import { ImageIcon } from "lucide-react";
import type { WebtoonPanel } from "@/types/map";

interface WebtoonReaderProps {
  panels: WebtoonPanel[];
  title?: string | null;
}

/**
 * Vertical webtoon/manhwa reader.
 *
 * The panels are slices of one long image, so they must stack back into a
 * seamless strip: no gap, no rounding, no border between them. Three details
 * do that work:
 *   - `block` on each img kills the inline-element baseline gap that would
 *     otherwise draw a hairline between every panel.
 *   - `aspectRatio` from the stored dimensions reserves each panel's exact
 *     height before it loads, so lazy-loaded panels never shift the scroll
 *     position under the reader's thumb.
 *   - a `-mt-px` overlap hides the sub-pixel seam that shows up when the
 *     panel's layout width scales to a fractional height.
 */
export const WebtoonReader = memo(({ panels, title }: WebtoonReaderProps) => {
  if (panels.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg bg-stone-100 p-8 text-center dark:bg-stone-800/50">
        <ImageIcon className="mb-3 h-10 w-10 text-stone-400" />
        <p className="text-sm font-medium text-stone-600 dark:text-stone-300">
          This webtoon has no panels yet
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-3xl overflow-hidden rounded-lg bg-black">
      {panels.map((panel, index) => (
        <img
          key={`${panel.url}-${index}`}
          src={panel.url}
          alt={
            title
              ? `${title}, panel ${index + 1} of ${panels.length}`
              : `Panel ${index + 1} of ${panels.length}`
          }
          width={panel.w}
          height={panel.h}
          style={{ aspectRatio: `${panel.w} / ${panel.h}` }}
          // The first panel loads eagerly so the reader sees art immediately;
          // the rest stream in as they scroll.
          loading={index === 0 ? "eager" : "lazy"}
          decoding="async"
          className={`block w-full ${index > 0 ? "-mt-px" : ""}`}
        />
      ))}
    </div>
  );
});
WebtoonReader.displayName = "WebtoonReader";
