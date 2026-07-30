import { redirect } from "next/navigation";

import { loadHub } from "@/lib/projectseed/hub";
import { ProjectWorkspace } from "@/components/projectseed/ProjectWorkspace";

export const dynamic = "force-dynamic";

export default async function ProjectPage() {
  const load = await loadHub();

  if (load.state === "anonymous") {
    redirect(`/login?next=${encodeURIComponent("/projectseed/hub/project")}`);
  }
  if (load.state !== "ready") {
    redirect("/projectseed/hub");
  }

  return (
    <ProjectWorkspace options={load.hub.options} pick={load.hub.pick} />
  );
}
