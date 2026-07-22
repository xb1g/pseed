"use client";

import { Check } from "lucide-react";

export interface ActivityRailItem {
  id: string;
  title: string;
  isComplete: boolean;
}

interface ActivityRailProps {
  items: ActivityRailItem[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

/**
 * One-line switcher for the day's activities.
 *
 * A wrapping pile of buttons costs three rows on a phone before any work is
 * visible, so this stays a single scrollable row: dot, short title, done mark.
 */
export function ActivityRail({
  items,
  selectedId,
  onSelect,
}: ActivityRailProps) {
  if (items.length <= 1) return null;

  const currentIndex = items.findIndex((item) => item.id === selectedId);

  return (
    <div className="mb-4">
      <div className="mb-2 flex items-baseline justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-neutral-500">
          Activity {currentIndex >= 0 ? currentIndex + 1 : 1} of {items.length}
        </span>
        <span className="text-[11px] text-neutral-600">
          {items.filter((item) => item.isComplete).length} done
        </span>
      </div>

      {/* Negative margin lets the row bleed to the screen edge while scrolling */}
      <div className="-mx-4 overflow-x-auto px-4 sm:-mx-6 sm:px-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="flex w-max gap-2">
          {items.map((item) => {
            const isSelected = item.id === selectedId;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelect(item.id)}
                aria-current={isSelected ? "step" : undefined}
                className={`inline-flex h-11 max-w-[15rem] items-center gap-2 rounded-full border px-3.5 text-sm transition-colors ${
                  isSelected
                    ? "border-amber-400/40 bg-amber-400/10 font-semibold text-white"
                    : "border-white/10 bg-white/[0.03] text-neutral-400 hover:border-white/20 hover:text-white"
                }`}
              >
                {item.isComplete ? (
                  <Check
                    aria-hidden="true"
                    className="h-4 w-4 shrink-0 text-emerald-400"
                  />
                ) : (
                  <span
                    aria-hidden="true"
                    className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                      isSelected ? "bg-amber-300" : "bg-neutral-600"
                    }`}
                  />
                )}
                <span className="truncate">{item.title}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
