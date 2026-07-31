import { redirect } from "next/navigation";

import { loadHub } from "@/lib/projectseed/hub";
import { ScheduleBoard } from "@/components/projectseed/ScheduleBoard";

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

  // One grid, not two. Painting your hours and reading the room's are the same
  // decision, so they are the same table.
  return (
    <ScheduleBoard
      initialSlots={hub.mySlots}
      cells={hub.heatmap}
      roster={hub.roster}
      cohortTags={hub.cohortTags}
      participantCount={hub.participantCount}
    />
  );
}
