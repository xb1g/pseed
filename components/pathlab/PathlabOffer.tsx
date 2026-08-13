"use client";

import { useEffect, useRef, useState } from "react";
import { OFFER_CARDS, OFFER_HEADING } from "@/lib/content/pathlab-page";

/**
 * "Pathlab เลยจะช่วยเริ่มต้นให้?" — the three things a Pathlab gives you.
 *
 * Client component (was server) so the cards can stagger-reveal on scroll
 * and carry the same charge-in glow as `.ei-card`, matching the rest of the
 * page instead of sitting flat.
 */
export function PathlabOffer() {
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
      className="pathlab-offer"
      aria-labelledby="pathlab-offer-heading"
    >
      <h2 id="pathlab-offer-heading" className="pathlab-offer__heading">
        {OFFER_HEADING}
      </h2>

      <ul className="pathlab-offer__grid">
        {OFFER_CARDS.map((card, i) => (
          <li
            key={card.title}
            className={`pathlab-offer__card${shown ? " is-shown" : ""}`}
            style={{ ["--i" as string]: String(i) }}
          >
            <span className="pathlab-offer__card-glow" aria-hidden="true" />
            <h3 className="pathlab-offer__card-title">{card.title}</h3>
            <p className="pathlab-offer__card-body">{card.body}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
