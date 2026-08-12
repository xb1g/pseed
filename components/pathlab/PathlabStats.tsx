"use client";

import { useEffect, useRef, useState } from "react";
import { STATS, STATS_HEADING, type PathlabStat } from "@/lib/content/pathlab-page";

const RADIUS = 52;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/**
 * The two figures that make the case for starting early, drawn as donut
 * rings. The ring fills on scroll; the figure and its caption are present
 * from first paint, so the section reads even if the animation never runs.
 */
export function PathlabStats() {
  const ref = useRef<HTMLElement | null>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    if (
      typeof window === "undefined" ||
      !("IntersectionObserver" in window) ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      setShown(true);
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
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
      ref={ref}
      className="pathlab-stats"
      aria-labelledby="pathlab-stats-heading"
    >
      <h2 id="pathlab-stats-heading" className="pathlab-stats__heading">
        {STATS_HEADING}
      </h2>

      <ul className="pathlab-stats__grid">
        {STATS.map((stat, i) => (
          <StatRing key={stat.percent} stat={stat} shown={shown} index={i} />
        ))}
      </ul>
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
    <li className="pathlab-stat">
      <div className="pathlab-stat__ring">
        <svg viewBox="0 0 120 120" role="img" aria-label={`${stat.percent}%`}>
          {/* Track */}
          <circle
            cx="60"
            cy="60"
            r={RADIUS}
            fill="none"
            stroke="rgba(196, 62, 29, 0.16)"
            strokeWidth="13"
          />
          {/* Value. Rotated so the arc starts at 12 o'clock. */}
          <circle
            className="pathlab-stat__arc"
            cx="60"
            cy="60"
            r={RADIUS}
            fill="none"
            stroke="#c43e1d"
            strokeWidth="13"
            strokeLinecap="round"
            strokeDasharray={`${filled} ${CIRCUMFERENCE - filled}`}
            strokeDashoffset={shown ? 0 : CIRCUMFERENCE}
            transform="rotate(-90 60 60)"
            style={{ transitionDelay: `${index * 160}ms` }}
          />
        </svg>
        <span className="pathlab-stat__value">{stat.percent}%</span>
      </div>

      <p className="pathlab-stat__caption">
        {stat.lines.map((line) => (
          <span key={line}>{line}</span>
        ))}
      </p>
    </li>
  );
}
