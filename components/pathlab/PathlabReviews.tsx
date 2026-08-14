"use client";

import { useEffect, useRef, useState } from "react";
import { REVIEWS, REVIEWS_HEADING } from "@/lib/content/pathlab-page";

/**
 * "Review จากรุ่นพี่" — alumni comments on a dark band under the offer.
 *
 * The quotes scroll sideways with snap so the row grows as more reviews come
 * in without the layout changing; neighbours peek at the edges to hint there
 * is more. Client component for the same rise + stagger scroll reveal as
 * PathlabOffer.
 */
export function PathlabReviews() {
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
      className="pathlab-reviews"
      aria-labelledby="pathlab-reviews-heading"
    >
      <h2 id="pathlab-reviews-heading" className="pathlab-reviews__heading">
        {REVIEWS_HEADING}
      </h2>

      <ul className="pathlab-reviews__track">
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
            <p className="pathlab-reviews__by">{review.by}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
