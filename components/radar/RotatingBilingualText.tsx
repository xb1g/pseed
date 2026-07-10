"use client";

import { useEffect, useState } from "react";

interface RotatingBilingualTextProps {
  en: string;
  th: string;
  intervalMs?: number;
  className?: string;
}

export function RotatingBilingualText({
  en,
  th,
  intervalMs = 2000,
  className = "",
}: RotatingBilingualTextProps) {
  const [showThai, setShowThai] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mq.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };

    mq.addEventListener("change", handleChange);
    return () => mq.removeEventListener("change", handleChange);
  }, []);

  useEffect(() => {
    if (prefersReducedMotion) return;

    const id = setInterval(() => {
      setShowThai((prev) => !prev);
    }, intervalMs);

    return () => clearInterval(id);
  }, [intervalMs, prefersReducedMotion]);

  if (prefersReducedMotion) {
    return <span className={className}>{en}</span>;
  }

  return (
    <span
      className={`grid [grid-template-areas:'stack'] ${className}`}
      aria-label={`${en} / ${th}`}
    >
      <span
        className="[grid-area:stack] transition-opacity duration-500 ease-in-out"
        aria-hidden={showThai}
        style={{ opacity: showThai ? 0 : 1 }}
      >
        {en}
      </span>
      <span
        className="[grid-area:stack] transition-opacity duration-500 ease-in-out"
        aria-hidden={!showThai}
        style={{ opacity: showThai ? 1 : 0 }}
      >
        {th}
      </span>
    </span>
  );
}
