"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import { JOURNEY } from "@/lib/content/pathlab-page";

/**
 * Shows what a Pathlab learning journey looks like: a live preview of a real
 * learning map, fetched from /api/maps/public-preview and rendered as a
 * lightweight zigzag island trail instead of a static screenshot.
 *
 * The map loads client-only so the landing bundle stays light; the old
 * screenshot stands in while the chunk arrives (and whenever the fetch
 * fails, the visitor still sees something truthful).
 */
const PathlabJourneyMap = dynamic(() => import("./PathlabJourneyMap"), {
  ssr: false,
  loading: () => (
    <figure className="pathlab-journey__frame">
      <Image
        src={JOURNEY.src}
        alt={JOURNEY.alt}
        width={2538}
        height={1342}
        sizes="(max-width: 900px) 94vw, 72rem"
        className="pathlab-journey__img"
        priority={false}
      />
    </figure>
  ),
});

export function PathlabJourney() {
  return (
    <section
      id="pathlab-journey"
      className="pathlab-journey"
      aria-labelledby="pathlab-journey-heading"
    >
      <div className="pathlab-journey__copy">
        <h2 id="pathlab-journey-heading" className="pathlab-journey__heading">
          {JOURNEY.heading}
        </h2>
        <p className="pathlab-journey__body">{JOURNEY.body}</p>
      </div>

      <PathlabJourneyMap />
    </section>
  );
}
