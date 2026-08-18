"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { JOURNEY } from "@/lib/content/pathlab-page";
import {
  PARTNER_IG_DM_URL,
  PARTNER_MAP,
} from "@/lib/content/pathlab-partner";

/**
 * "นี่คือ PathLab ที่นักเรียนกำลังเดินอยู่ตอนนี้" — the same live, read-only
 * preview of a real published PathLab that /pathlab shows students, reused
 * here so experts see the actual artifact their knowledge becomes. Loaded
 * client-only like on the student page; the screenshot stands in while the
 * chunk arrives or whenever the preview fetch fails.
 */
const PathlabJourneyMap = dynamic(
  () => import("@/components/pathlab/PathlabJourneyMap"),
  {
    ssr: false,
    loading: () => (
      <figure className="pathlab-journey__frame">
        <Image
          src={JOURNEY.src}
          alt={JOURNEY.alt}
          width={2538}
          height={1342}
          sizes="(max-width: 900px) 94vw, 64rem"
          className="pathlab-journey__img"
          priority={false}
        />
      </figure>
    ),
  }
);

export function PartnerMap() {
  return (
    <section
      id="partner-map"
      className="pathlab-partner__section"
      aria-labelledby="partner-map-heading"
    >
      <p className="pathlab-partner__kicker">{PARTNER_MAP.kicker}</p>
      <h2 id="partner-map-heading" className="pathlab-partner__heading">
        {PARTNER_MAP.heading}
      </h2>
      <p className="pathlab-partner__body">{PARTNER_MAP.body}</p>

      <PathlabJourneyMap />

      {/* The map is the emotional peak; the DM door belongs right here. */}
      <div className="pathlab-partner__map-cta">
        <a
          href={PARTNER_IG_DM_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="pathlab-hero__cta pathlab-hero__cta--primary"
        >
          <span>{PARTNER_MAP.ctaLabel}</span>
          <ArrowRight className="pathlab-partner__cta-icon" aria-hidden="true" />
        </a>
      </div>
    </section>
  );
}
