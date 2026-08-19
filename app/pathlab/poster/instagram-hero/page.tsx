import type { Metadata } from "next";
import { InstagramHeroPosterClient } from "@/components/pathlab/InstagramHeroPosterClient";

export const metadata: Metadata = {
  title: "Pathlab × Passion Seed — IG Hero Poster",
  /** A shareable graphic tool, not a landing page — keep it out of search. */
  robots: { index: false, follow: false },
};

/**
 * 10x rebuild of the A4 markered poster for Instagram Feed (4:5), Square
 * (1:1) and Story (9:16). The art direction trades the paper feel for a
 * hero-sheet feel: one huge brand line, one short promise, three proof
 * bullets, two alumni quotes, the round dates, and the next step.
 *
 * Server entry only mounts the client island. All rendering lives in
 * `components/pathlab/InstagramHeroPosterClient.tsx` so the format switch
 * stays client-side.
 */
export default function PathlabInstagramHeroPosterPage() {
  return <InstagramHeroPosterClient />;
}
