"use client";

import { useEffect, useRef, useState } from "react";

import { STATS, type PathlabStat } from "@/lib/content/pathlab-page";
import { PARENTS_WHY_NOW } from "@/lib/content/pathlab-parents";
import { ParentsNote, SectionHeading } from "./section";

const RADIUS = 52;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/**
 * The timing case, told with the same two figures as the student page but
 * framed as risk rather than FOMO. Rings fill on scroll; the printed figure
 * and caption are in the markup from first paint, so the section still reads
 * with JavaScript or motion disabled.
 */
export function ParentsWhyNow() {
  const ref = useRef<HTMLDivElement | null>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    if (
      !("IntersectionObserver" in window) ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      setShown(true);
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setShown(true);
          io.disconnect();
        }
      },
      { rootMargin: "-15% 0px" }
    );

    io.observe(node);
    return () => io.disconnect();
  }, []);

  return (
    <section
      aria-labelledby="parents-why-now"
      className="mx-auto w-full max-w-6xl px-5 py-16 sm:px-8 lg:py-24"
    >
      <div ref={ref} className="grid gap-12 lg:grid-cols-[1fr_0.9fr] lg:items-center">
        <div>
          <SectionHeading
            id="parents-why-now"
            eyebrow={PARENTS_WHY_NOW.eyebrow}
            title={PARENTS_WHY_NOW.title}
            body={PARENTS_WHY_NOW.body}
          />
          <ParentsNote>{PARENTS_WHY_NOW.note}</ParentsNote>
        </div>

        <div>
          <ul className="grid grid-cols-2 gap-4 sm:gap-6">
            {STATS.map((stat, index) => (
              <StatRing
                key={stat.percent}
                stat={stat}
                shown={shown}
                index={index}
              />
            ))}
          </ul>
          <p className="mt-5 text-center font-bai-jamjuree text-xs leading-6 text-slate-400">
            {PARENTS_WHY_NOW.ringCaption}
          </p>
        </div>
      </div>
    </section>
  );
}

function StatRing({
  stat,
  shown,
  index,
}: {
  stat: PathlabStat;
  shown: boolean;
  index: number;
}) {
  const filled = (stat.percent / 100) * CIRCUMFERENCE;

  return (
    <li className="ei-card ei-card--static flex flex-col items-center p-5 text-center sm:p-6">
      <div className="relative w-full max-w-[9rem]">
        <svg viewBox="0 0 120 120" role="img" aria-label={`${stat.percent}%`}>
          <circle
            cx="60"
            cy="60"
            r={RADIUS}
            fill="none"
            stroke="rgba(148, 197, 255, 0.16)"
            strokeWidth="13"
          />
          {/* Rotated so the arc starts at 12 o'clock. */}
          <circle
            cx="60"
            cy="60"
            r={RADIUS}
            fill="none"
            stroke="#fcd34d"
            strokeWidth="13"
            strokeLinecap="round"
            strokeDasharray={`${filled} ${CIRCUMFERENCE - filled}`}
            strokeDashoffset={shown ? 0 : CIRCUMFERENCE}
            transform="rotate(-90 60 60)"
            style={{
              transition: "stroke-dashoffset 1100ms cubic-bezier(0.05, 0.7, 0.35, 0.99)",
              transitionDelay: `${index * 160}ms`,
            }}
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center font-kodchasan text-2xl font-medium text-amber-200 sm:text-3xl">
          {stat.percent}%
        </span>
      </div>

      <p className="mt-3 font-bai-jamjuree text-sm leading-6 text-slate-300">
        {stat.lines.map((line) => (
          <span key={line} className="block">
            {line}
          </span>
        ))}
      </p>
    </li>
  );
}
