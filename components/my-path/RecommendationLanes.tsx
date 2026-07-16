"use client";

import { ArrowRight } from "lucide-react";

import type { CareerPreview } from "@/lib/my-path/radar-content";
import type { RecommendationLane } from "@/lib/my-path/types";

export function RecommendationLanes({
  lanes,
  careers,
  onOpen,
}: {
  lanes: RecommendationLane[];
  careers: CareerPreview[];
  onOpen: (slug: string) => void;
}) {
  const bySlug = new Map(careers.map((career) => [career.slug, career]));
  if (!lanes.length) return null;
  return (
    <section aria-labelledby="recommendations-heading">
      <div className="max-w-2xl">
        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-indigo-200/70">
          ขยายความเป็นไปได้
        </p>
        <h2
          id="recommendations-heading"
          className="mt-2 font-kodchasan text-2xl font-semibold text-slate-50 sm:text-3xl"
        >
          สามเส้นทางที่ช่วยให้เห็นความต่างชัดขึ้น
        </h2>
      </div>
      <div className="mt-7 divide-y divide-white/10 border-y border-white/10">
        {lanes.map((lane, index) => {
          const career = bySlug.get(lane.recommendation.slug);
          if (!career) return null;
          return (
            <button
              key={lane.id}
              type="button"
              onClick={() => onOpen(career.slug)}
              className="group grid min-h-28 w-full grid-cols-[2rem_1fr_auto] items-center gap-3 py-5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-amber-200 sm:grid-cols-[3rem_11rem_1fr_auto]"
            >
              <span className="font-space-mono text-xs text-slate-600">0{index + 1}</span>
              <span className="hidden text-xs font-semibold uppercase tracking-[0.12em] text-indigo-200/65 sm:block">
                {lane.title}
              </span>
              <span>
                <span className="block font-kodchasan text-lg font-semibold text-slate-100">
                  {career.titleTh}
                </span>
                <span className="mt-1 block max-w-2xl text-sm leading-6 text-slate-400">
                  {lane.recommendation.reason}
                </span>
                <span className="mt-2 block text-xs font-semibold uppercase tracking-[0.1em] text-indigo-200/65 sm:hidden">
                  {lane.title}
                </span>
              </span>
              <ArrowRight
                className="h-5 w-5 text-slate-500 transition-transform group-hover:translate-x-1 group-hover:text-amber-100"
                aria-hidden="true"
              />
            </button>
          );
        })}
      </div>
    </section>
  );
}
