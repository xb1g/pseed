"use client";

import { cn } from "@/lib/utils";

/**
 * Compact EN/ไทย segmented control for bilingual learning-map nodes.
 * Matches the gold map-chrome toggle (Preview / Edit / Grade) so it
 * reads as part of the panel, not a bolted-on extra row.
 *
 * Student/preview: hidden when no Thai translation exists.
 * Edit mode (`forceShow`): always visible; the ไทย pill shows a + when
 * no translation exists yet, so the teacher can create one.
 */

interface LanguageToggleProps {
  lang: "en" | "th";
  onChange: (lang: "en" | "th") => void;
  /** When true, a Thai translation node exists. */
  thAvailable: boolean;
  /** When true, always render even if thAvailable is false (edit mode). */
  forceShow?: boolean;
  className?: string;
}

const OPTIONS = [
  { value: "en" as const, label: "EN", aria: "English" },
  { value: "th" as const, label: "ไทย", aria: "Thai" },
];

export function LanguageToggle({
  lang,
  onChange,
  thAvailable,
  forceShow = false,
  className,
}: LanguageToggleProps) {
  if (!thAvailable && !forceShow) return null;

  return (
    <div
      role="group"
      aria-label="Display language"
      className={cn(
        "inline-flex shrink-0 items-center gap-0.5 rounded-full border border-white/10 bg-[#17120e]/70 p-0.5 shadow-lg shadow-black/20",
        className,
      )}
    >
      {OPTIONS.map((opt) => {
        const active = lang === opt.value;
        const missingTh = opt.value === "th" && !thAvailable;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            aria-pressed={active}
            aria-label={missingTh ? "Thai, no translation yet" : opt.aria}
            title={missingTh ? "No translation yet" : opt.aria}
            className={cn(
              "flex h-7 min-w-[2.25rem] items-center justify-center gap-0.5 rounded-full px-2.5 text-[11px] font-semibold tracking-wide transition-all duration-200",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200/60",
              active
                ? "bg-gradient-to-b from-amber-200 via-amber-300 to-amber-400 text-amber-950 shadow-[0_0_16px_rgba(254,217,92,0.35)]"
                : "text-stone-400 hover:bg-white/5 hover:text-amber-50",
            )}
          >
            {opt.label}
            {missingTh && (
              <span className="text-[10px] leading-none text-amber-300/90" aria-hidden>
                +
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
