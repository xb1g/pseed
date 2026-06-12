"use client";

import type { ReactNode } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

type FeedbackChoiceProps = {
  children: ReactNode;
  selected: boolean;
  onClick: () => void;
  disabled?: boolean;
  className?: string;
};

export function FeedbackChoice({
  children,
  selected,
  onClick,
  disabled = false,
  className,
}: FeedbackChoiceProps) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "flex min-h-12 w-full items-center justify-between gap-3 rounded-xl border px-4 py-3 text-left font-[family-name:var(--font-bai-jamjuree)] text-sm font-medium transition-[background-color,border-color,color,transform] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring-color-dawn)] focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 disabled:cursor-not-allowed disabled:opacity-45",
        selected
          ? "border-indigo-300/60 bg-indigo-400/20 text-white"
          : "border-white/10 bg-white/[0.04] text-slate-300 hover:border-white/20 hover:bg-white/[0.07]",
        className
      )}
    >
      <span>{children}</span>
      <span
        aria-hidden="true"
        className={cn(
          "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition-colors",
          selected
            ? "border-indigo-300 bg-indigo-300 text-slate-950"
            : "border-white/15 bg-white/[0.03] text-transparent"
        )}
      >
        <Check className="h-3.5 w-3.5" strokeWidth={3} />
      </span>
    </button>
  );
}
