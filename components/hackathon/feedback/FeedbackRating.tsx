"use client";

import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

const ratingLabels = ["ควรปรับ", "พอใช้", "โอเค", "ดี", "ดีมาก"];

type FeedbackRatingProps = {
  label: string;
  value: number;
  onChange: (value: number) => void;
};

export function FeedbackRating({
  label,
  value,
  onChange,
}: FeedbackRatingProps) {
  return (
    <div role="group" aria-label={label} className="grid grid-cols-5 gap-2">
      {[1, 2, 3, 4, 5].map((rating) => (
        <button
          key={rating}
          type="button"
          aria-label={`${rating} ${ratingLabels[rating - 1]}`}
          aria-pressed={value === rating}
          onClick={() => onChange(rating)}
          className={cn(
            "flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl border px-1 py-2 font-[family-name:var(--font-bai-jamjuree)] transition-[background-color,border-color,color,transform] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring-color-dawn)] focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950",
            value === rating
              ? "border-yellow-300/60 bg-yellow-300/15 text-yellow-100"
              : "border-white/10 bg-white/[0.04] text-slate-500 hover:border-white/20 hover:text-slate-300"
          )}
        >
          <Star
            aria-hidden="true"
            className={cn(
              "h-5 w-5",
              value >= rating && "fill-yellow-300 text-yellow-300"
            )}
          />
          <span className="text-xs font-semibold">{rating}</span>
        </button>
      ))}
    </div>
  );
}
