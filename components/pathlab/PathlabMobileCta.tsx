"use client";

import { useEffect, useState } from "react";
import { CONTACT, MICRO_PATHLAB, MOBILE_CTA } from "@/lib/content/pathlab-page";

/**
 * Sticky bottom action bar for touch devices.
 *
 * Deep in the page (an opened field's five-day plan, the pricing notes) the
 * next action used to be a long scroll away; from here the two
 * highest-intent actions are always one tap from the thumb. The bar stays
 * hidden until the hero leaves the viewport so the first screen keeps its
 * own CTAs, and desktop never renders it — CSS gates on hover/pointer
 * capability, not width.
 */
export function PathlabMobileCta() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const hero = document.querySelector(".pathlab-hero");
    if (!hero || !("IntersectionObserver" in window)) {
      setVisible(true);
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) setVisible(!entry.isIntersecting);
      },
      /* The bar arrives once the hero is mostly gone, not on the first
         pixel of scroll. */
      { rootMargin: "-45% 0px 0px 0px" }
    );

    io.observe(hero);
    return () => io.disconnect();
  }, []);

  return (
    <div
      className={`pathlab-mobile-cta${visible ? " is-visible" : ""}`}
      aria-hidden={!visible}
    >
      <a
        className="pathlab-mobile-cta__btn pathlab-mobile-cta__btn--primary"
        href={MICRO_PATHLAB.mapHref ?? MICRO_PATHLAB.fallbackHref}
        tabIndex={visible ? 0 : -1}
      >
        {MOBILE_CTA.primary}
      </a>
      <a
        className="pathlab-mobile-cta__btn pathlab-mobile-cta__btn--chat"
        href={CONTACT.lineHref}
        target="_blank"
        rel="noopener noreferrer"
        tabIndex={visible ? 0 : -1}
      >
        {MOBILE_CTA.chat}
      </a>
    </div>
  );
}
