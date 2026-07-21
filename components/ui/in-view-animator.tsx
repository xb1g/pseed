"use client";

import { useEffect } from "react";

const DEFAULT_SELECTOR =
  ".ei-card, .dawn-card, .ei-button-dawn, .ei-button-dusk";

interface InViewAnimatorProps {
  /** CSS selector for elements whose hover animation needs a touch fallback */
  selector?: string;
  /** How much of the element must be visible before the animation fires */
  threshold?: number;
}

/**
 * Touch fallback for the design system's hover-driven glow animations.
 *
 * Dusk/Dawn components build their glow with `:hover` keyframes, which never
 * fire on touch devices. This adds the `.in-view` class the `@media (hover:
 * none)` rules in globals.css listen for, so mobile users see the same
 * atmosphere. Renders nothing.
 */
export function InViewAnimator({
  selector = DEFAULT_SELECTOR,
  threshold = 0.4,
}: InViewAnimatorProps) {
  useEffect(() => {
    if (typeof window === "undefined") return;
    // Pointer devices drive these animations through :hover already.
    if (window.matchMedia("(hover: hover)").matches) return;

    const observer = new IntersectionObserver(
      (entries) =>
        entries.forEach((entry) => {
          if (entry.isIntersecting) entry.target.classList.add("in-view");
        }),
      { threshold },
    );

    document
      .querySelectorAll(selector)
      .forEach((element) => observer.observe(element));

    return () => observer.disconnect();
  }, [selector, threshold]);

  return null;
}
