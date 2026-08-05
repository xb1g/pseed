import { redirect } from "next/navigation";

import { loadAdminRoster } from "@/lib/projectseed/admin";
import { AdminRoster, AdminRosterError } from "@/components/projectseed/AdminRoster";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const load = await loadAdminRoster();

  // A non-admin is sent to the hub rather than shown a "forbidden" page: the
  // tab is not in their nav, so arriving here is a typed URL or a shared link,
  // and neither deserves confirmation that the page exists.
  if (load.state === "forbidden" || load.state === "no-cohort") {
    redirect("/projectseed/hub");
  }

  if (load.state === "error") {
    return <AdminRosterError cohortName={load.cohortName} />;
  }

  return <AdminRoster cohortName={load.cohortName} rows={load.rows} />;
}
