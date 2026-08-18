import type { Metadata } from "next";
import { HowWeLearnPosterClient } from "@/components/pathlab/HowWeLearnPosterClient";

export const metadata: Metadata = {
  title: "Pathlab — How We Learn — Passion Seed",
  /** A print artifact, not a landing page: keep it out of search. */
  robots: { index: false, follow: false },
};

/**
 * Server entry for /pathlab/poster/how-we-learn: a thin shell that just
 * mounts the client island poster. All rendering lives in the client
 * component so the live fetch can run in the browser.
 */
export default function PathlabHowWeLearnPosterPage() {
  return <HowWeLearnPosterClient />;
}
