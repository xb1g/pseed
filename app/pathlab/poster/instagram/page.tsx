import type { Metadata } from "next";
import { InstagramPosterClient } from "@/components/pathlab/InstagramPosterClient";

export const metadata: Metadata = {
  title: "Pathlab Instagram Poster — Passion Seed",
  /** A shareable graphic tool, not a landing page — keep it out of search results. */
  robots: { index: false, follow: false },
};

export default function PathlabInstagramPosterPage() {
  return <InstagramPosterClient />;
}
