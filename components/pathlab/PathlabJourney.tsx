"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import { JOURNEY } from "@/lib/content/pathlab-page";

/**
 * Shows what a Pathlab learning journey looks like — now as the real thing:
 * an interactive island map of each open path's five days, instead of a
 * screenshot of it.
 *
 * The map is React Flow, which is far too heavy for the landing bundle, so
 * it loads client-only and the old screenshot stands in while the chunk
 * arrives (and whenever the chunk fails, the visitor still sees something
 * truthful).
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
