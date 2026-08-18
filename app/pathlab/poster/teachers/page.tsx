import type { Metadata } from "next";
import { TeachersPosterClient } from "@/components/pathlab/TeachersPosterClient";

export const metadata: Metadata = {
  title: "Pathlab: Who Teaches, Passion Seed",
  /** A print artifact, not a landing page: keep it out of search. */
  robots: { index: false, follow: false },
};

/**
 * Server entry for /pathlab/poster/teachers: a thin shell that just mounts
 * the client island poster. All rendering lives in the client component so
 * the page can be served as a static artifact.
 */
export default function PathlabTeachersPosterPage() {
  return <TeachersPosterClient />;
}
