import type { Metadata } from "next";
import { POSTER, PRICE_TIERS } from "@/lib/content/pathlab-page";
import { MedSocialPosterClient } from "@/components/pathlab/MedSocialPosterClient";

export const metadata: Metadata = {
  title: "Pathlab Med Social Card — Passion Seed",
  robots: { index: false, follow: false },
};

export default function MedSocialPosterPage() {
  return (
    <MedSocialPosterClient
      featured={PRICE_TIERS.find((tier) => tier.tone === "featured") ?? null}
      posterSchedule={POSTER.schedule}
    />
  );
}
