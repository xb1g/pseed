"use client";

import { ArrowUpRight, Check } from "lucide-react";
import { cn } from "@/lib/utils";

type FollowUpOpportunityProps = {
  title: string;
  outcome: string;
  benefit: string;
  selected: boolean;
  onClick: () => void;
};

export function FollowUpOpportunity({
  title,
  outcome,
  benefit,
  selected,
  onClick,
}: FollowUpOpportunityProps) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={cn(
        "group relative w-full overflow-hidden rounded-2xl border p-5 text-left font-[family-name:var(--font-bai-jamjuree)] transition-[background-color,border-color,transform,box-shadow] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring-color-dawn)] focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950",
        selected
          ? "border-indigo-300/60 bg-gradient-to-br from-indigo-400/25 via-violet-400/15 to-blue-400/10 shadow-[0_16px_45px_rgba(79,70,229,0.18)]"
          : "border-white/10 bg-white/[0.04] hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/[0.065]"
      )}
    >
      <div className="flex items-start gap-4">
        <span
          aria-hidden="true"
          className={cn(
            "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border",
            selected
              ? "border-indigo-200/60 bg-indigo-200 text-indigo-950"
              : "border-white/10 bg-white/[0.04] text-indigo-300"
          )}
        >
          {selected ? (
            <Check className="h-5 w-5" strokeWidth={3} />
          ) : (
            <ArrowUpRight className="h-5 w-5" />
          )}
        </span>
        <span className="min-w-0 space-y-2">
          <span className="block text-base font-semibold leading-6 text-white">
            {title}
          </span>
          <span className="block text-sm leading-6 text-slate-300">
            {outcome}
          </span>
          <span className="inline-flex rounded-full border border-white/10 bg-slate-950/30 px-3 py-1 text-xs font-medium text-indigo-200">
            {benefit}
          </span>
        </span>
      </div>
    </button>
  );
}
