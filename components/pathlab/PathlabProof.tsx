"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { PROOF, PROOF_PROJECTS } from "@/lib/content/pathlab-page";

const FIGURE_MATCH = PROOF.figure.match(/^(\d+)(.*)$/);
const FIGURE_TARGET = FIGURE_MATCH ? Number(FIGURE_MATCH[1]) : null;
const FIGURE_SUFFIX = FIGURE_MATCH ? FIGURE_MATCH[2] : "";

/**
 * Social-proof strip: the headline figure, then a few project examples.
 * Same reveal-on-scroll pattern as PathlabStats/PathlabPortfolio, plus a
 * count-up on the figure so the number feels earned rather than printed.
 */
export function PathlabProof() {
  const ref = useRef<HTMLElement | null>(null);
  const [shown, setShown] = useState(false);
  const [count, setCount] = useState(FIGURE_TARGET ?? 0);

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
      { rootMargin: "-12% 0px" }
    );

    io.observe(node);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!shown || FIGURE_TARGET === null) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    setCount(0);
    const duration = 1400;
    const start = performance.now();
    let frame: number;

    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(eased * FIGURE_TARGET));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [shown]);

  const figure =
    FIGURE_TARGET === null ? PROOF.figure : `${count}${FIGURE_SUFFIX}`;

  return (
    <section
      ref={ref}
      className="pathlab-proof"
      aria-labelledby="pathlab-proof-heading"
    >
      <p
        className={`pathlab-proof__figure${shown ? " is-shown" : ""}`}
        aria-label={PROOF.figure}
      >
        {figure}
      </p>
      <h2 id="pathlab-proof-heading" className="pathlab-proof__headline">
        {PROOF.headline}
      </h2>
      <p className="pathlab-proof__sub">{PROOF.sub}</p>

      <ul className="pathlab-proof__grid">
        {PROOF_PROJECTS.map((project, i) => (
          <li
            key={`${project.src}-${i}`}
            className={`pathlab-proof__item${shown ? " is-shown" : ""}`}
            style={{ ["--i" as string]: String(i) }}
          >
            <div className="pathlab-proof__frame">
              <span className="pathlab-proof__glow" aria-hidden="true" />
              <Image
                src={project.src}
                alt={project.alt}
                fill
                sizes="(max-width: 640px) 80vw, (max-width: 1024px) 40vw, 20rem"
              />
            </div>
            <p className="pathlab-proof__caption">
              {project.lines.map((line) => (
                <span key={line}>{line}</span>
              ))}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}
