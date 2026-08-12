"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import {
  PORTFOLIO_FORMULA,
  PORTFOLIO_HEADING,
  PORTFOLIO_ITEMS,
} from "@/lib/content/pathlab-page";

/**
 * "Port ที่ดีต้องการอะไร" — four portfolio ingredients, then สูตรลับติดPort
 * (storytelling + interview + mindset).
 */
export function PathlabPortfolio() {
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
      { rootMargin: "-12% 0px" }
    );

    io.observe(node);
    return () => io.disconnect();
  }, []);

  return (
    <section
      ref={ref}
      id="pathlab-portfolio"
      className="pathlab-portfolio"
      aria-labelledby="pathlab-portfolio-heading"
    >
      <h2 id="pathlab-portfolio-heading" className="pathlab-portfolio__heading">
        {PORTFOLIO_HEADING}
      </h2>

      <ul className="pathlab-portfolio__grid">
        {PORTFOLIO_ITEMS.map((item, i) => (
          <li
            key={item.src}
            className={`pathlab-portfolio__item${shown ? " is-shown" : ""}`}
            style={{ ["--i" as string]: String(i) }}
            onPointerMove={(event) => {
              if (
                !window.matchMedia("(hover: hover) and (pointer: fine)").matches
              ) {
                return;
              }
              const target = event.currentTarget;
              const rect = target.getBoundingClientRect();
              const x = (event.clientX - rect.left) / rect.width - 0.5;
              const y = (event.clientY - rect.top) / rect.height - 0.5;
              target.style.setProperty("--tilt-x", (y * -8).toFixed(2));
              target.style.setProperty("--tilt-y", (x * 10).toFixed(2));
            }}
            onPointerLeave={(event) => {
              event.currentTarget.style.setProperty("--tilt-x", "0");
              event.currentTarget.style.setProperty("--tilt-y", "0");
            }}
          >
            <div
              className={`pathlab-portfolio__frame pathlab-portfolio__frame--${item.kind}`}
            >
              <Image
                src={item.src}
                alt={item.alt}
                fill
                sizes="(max-width: 640px) 44vw, (max-width: 1024px) 30vw, 14rem"
              />
            </div>
            <p className="pathlab-portfolio__caption">
              {item.lines.map((line) => (
                <span key={line}>{line}</span>
              ))}
            </p>
          </li>
        ))}
      </ul>

      <aside
        className={`pathlab-portfolio__formula${shown ? " is-shown" : ""}`}
        aria-label={PORTFOLIO_FORMULA.title}
      >
        <span className="pathlab-portfolio__formula-badge">
          {PORTFOLIO_FORMULA.badge}
        </span>
        <p className="pathlab-portfolio__formula-eyebrow">
          {PORTFOLIO_FORMULA.eyebrow}
        </p>
        <h3 className="pathlab-portfolio__formula-title">
          {PORTFOLIO_FORMULA.title}
        </h3>
        <p className="pathlab-portfolio__formula-body">
          {PORTFOLIO_FORMULA.body}
        </p>
        <ul className="pathlab-portfolio__pillars">
          {PORTFOLIO_FORMULA.pillars.map((pillar) => (
            <li key={pillar.label} className="pathlab-portfolio__pillar">
              <span className="pathlab-portfolio__pillar-label">
                {pillar.label}
              </span>
              <span className="pathlab-portfolio__pillar-detail">
                {pillar.detail}
              </span>
            </li>
          ))}
        </ul>
      </aside>
    </section>
  );
}
