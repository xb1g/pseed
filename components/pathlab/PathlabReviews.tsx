"use client";

import { useEffect, useRef, useState } from "react";
import { REVIEWS, REVIEWS_HEADING } from "@/lib/content/pathlab-page";

/** Time between auto-advances, and the tolerance for "reached the end". */
const AUTOPLAY_MS = 4000;
const END_SLACK_PX = 8;

/**
 * "Review จากรุ่นพี่" — alumni comments on a dark band under the offer.
 *
 * The quotes scroll sideways with snap so the row grows as more reviews come
 * in without the layout changing; neighbours peek at the edges to hint there
 * is more. While the section is on screen the track auto-advances one card at
 * a time, looping back to the start at the end; hovering or touching pauses
 * it so the reader keeps control. Client component for the same rise +
 * stagger scroll reveal as PathlabOffer.
 */
export function PathlabReviews() {
  const ref = useRef<HTMLElement | null>(null);
  const trackRef = useRef<HTMLUListElement | null>(null);
  const [shown, setShown] = useState(false);
  const [inView, setInView] = useState(false);

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
        for (const e of entries) {
          if (e.isIntersecting) setShown(true);
          setInView(e.isIntersecting);
        }
      },
      { rootMargin: "-12% 0px" }
    );

    io.observe(node);
    return () => io.disconnect();
  }, []);

  /* Auto-advance while the section is on screen. Reduced-motion users get a
     still row; manual scrolling stays possible at all times. */
  useEffect(() => {
    const track = trackRef.current;
    if (!inView || !track) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let paused = false;
    const pause = () => {
      paused = true;
    };
    const resume = () => {
      paused = false;
    };

    track.addEventListener("pointerenter", pause);
    track.addEventListener("pointerleave", resume);
    track.addEventListener("pointerdown", pause);
    track.addEventListener("pointerup", resume);
    track.addEventListener("pointercancel", resume);

    const id = window.setInterval(() => {
      if (paused) return;
      const card = track.querySelector<HTMLElement>(
        ".pathlab-reviews__card"
      );
      if (!card) return;
      const gap = parseFloat(getComputedStyle(track).columnGap) || 0;
      const step = card.getBoundingClientRect().width + gap;
      const atEnd =
        track.scrollLeft + track.clientWidth >= track.scrollWidth - END_SLACK_PX;
      track.scrollTo({
        left: atEnd ? 0 : track.scrollLeft + step,
        behavior: "smooth",
      });
    }, AUTOPLAY_MS);

    return () => {
      window.clearInterval(id);
      track.removeEventListener("pointerenter", pause);
      track.removeEventListener("pointerleave", resume);
      track.removeEventListener("pointerdown", pause);
      track.removeEventListener("pointerup", resume);
      track.removeEventListener("pointercancel", resume);
    };
  }, [inView]);

  return (
    <section
      ref={ref}
      className="pathlab-reviews"
      aria-labelledby="pathlab-reviews-heading"
    >
      <h2 id="pathlab-reviews-heading" className="pathlab-reviews__heading">
        {REVIEWS_HEADING}
      </h2>

      <ul ref={trackRef} className="pathlab-reviews__track">
        {REVIEWS.map((review, i) => (
          <li
            key={i}
            className={`pathlab-reviews__card${shown ? " is-shown" : ""}`}
            style={{ ["--i" as string]: String(i) }}
          >
            {/* The marks hang off the quote block, not the card, so the
                closing mark follows the text however tall the card gets. */}
            <div className="pathlab-reviews__body">
              <span
                className="pathlab-reviews__mark pathlab-reviews__mark--open"
                aria-hidden="true"
              >
                “
              </span>
              <blockquote className="pathlab-reviews__quote">
                {review.quote}
              </blockquote>
              <span
                className="pathlab-reviews__mark pathlab-reviews__mark--close"
                aria-hidden="true"
              >
                ”
              </span>
            </div>
            <p className="pathlab-reviews__ig">{review.ig}</p>
            {review.by && <p className="pathlab-reviews__by">{review.by}</p>}
          </li>
        ))}
      </ul>
    </section>
  );
}
