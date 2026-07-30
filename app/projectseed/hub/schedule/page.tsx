import { redirect } from "next/navigation";

import { loadHub } from "@/lib/projectseed/hub";
import { AvailabilityPicker } from "@/components/projectseed/AvailabilityPicker";
import { HeatmapGrid } from "@/components/projectseed/HeatmapGrid";

export const dynamic = "force-dynamic";

export default async function SchedulePage() {
  const load = await loadHub();

  if (load.state === "anonymous") {
    redirect(`/login?next=${encodeURIComponent("/projectseed/hub/schedule")}`);
  }
  if (load.state !== "ready") {
    redirect("/projectseed/hub");
  }

  const { hub } = load;

  return (
    <>
      <AvailabilityPicker initialSlots={hub.mySlots} />
      <HeatmapGrid
        cells={hub.heatmap}
        participantCount={hub.participantCount}
      />
    </>
  );
}
