"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { PORTFOLIO_HEADING, PORTFOLIO_ITEMS } from "@/lib/content/pathlab-page";

/**
 * "Port ที่ดีต้องการอะไร" — the four things that make a portfolio credible.
 *
 * Items are visible by default and the reveal only adds a rise, so the section
 * still renders if IntersectionObserver never fires (hidden tab, headless
 * render, reduced motion).
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
            className={`pathlab-portfolio__item${
              shown ? " is-shown" : ""
            }`}
            style={{ ["--i" as string]: String(i) }}
          >
            {/* The artwork carries its own card treatment (rounded plate and
                padding baked into the file), so the frame only sets the shared
                size and the image fills it. */}
            <div className="pathlab-portfolio__frame">
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
    </section>
  );
}
