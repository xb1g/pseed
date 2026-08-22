import type { Metadata } from "next";
import { POSTER, PRICE_TIERS } from "@/lib/content/pathlab-page";
import { MedPosterClient } from "@/components/pathlab/MedPosterClient";

export const metadata: Metadata = {
  title: "Pathlab Med Poster — Passion Seed",
  robots: { index: false, follow: false },
};

/**
 * Med-focused A4 print sheet. Mirrors the handmade vocabulary of the tech
 * poster (marker frame, logo lockup, rubber stamp, sparkles, deal panel)
 * but the projects row is replaced with a live zigzag PathLab island
 * trail, the same display the main Pathlab page uses. Medical is still a
 * "coming soon" path, so the trail reuses the allowlisted demo map as a
 * sample of how a Med learner's journey will be laid out.
 *
 * Thin server shell: the client component handles the live preview fetch
 * and download button. Numbers come from PRICE_TIERS so the promo can't
 * drift from the site.
 */

export default function MedPosterPage() {
  return (
    <MedPosterClient
      featured={PRICE_TIERS.find((tier) => tier.tone === "featured") ?? null}
      posterSchedule={POSTER.schedule}
    />
  );
}
