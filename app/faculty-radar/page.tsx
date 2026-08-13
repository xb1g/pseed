import { FacultyRadarClient } from "@/components/faculty/FacultyRadarClient";
import { getFacultyTcasSummaries } from "@/lib/tcas/faculty-gallery";

export const metadata = {
  title: "Faculty Gallery | Passion Seed",
  description: "Explore university faculties by what students actually face inside.",
};

export const dynamic = "force-dynamic";

export default async function FacultyRadarPage() {
  const tcasSummaries = await getFacultyTcasSummaries();

  return <FacultyRadarClient tcasSummaries={tcasSummaries} />;
}
