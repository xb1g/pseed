import { createClient } from "@/utils/supabase/server";
import { getActiveCohort } from "@/lib/projectseed/hub";

/**
 * One row per participant, for the people running the batch.
 *
 * `planned_slots` against `kept_slot_count` is the pair worth the whole view:
 * it is the first measurement of who actually turns up that the programme has
 * ever had, and the input to PS-207 (mentor-hours per student, open risk 1).
 */
export interface PseedAdminRosterRow {
  participant_id: string;
  display_name: string | null;
  role: string;
  joined_at: string;
  discord_username: string | null;
  discord_user_id: string | null;
  project_title: string | null;
  tags: string[];
  brief_status: string | null;
  planned_slots: number;
  shared_slots: number;
  recorded_seconds: number;
  session_count: number;
  kept_slot_count: number;
  last_seen_at: string | null;
  notify_channel: boolean;
  notify_dm: boolean;
}

export async function isProjectSeedAdmin(): Promise<boolean> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;

  const { data, error } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .in("role", ["admin", "passion-seed-team"])
    .limit(1);

  if (error) {
    console.error("[projectseed] admin check failed:", error.message);
    return false;
  }
  return (data?.length ?? 0) > 0;
}

export type AdminRosterLoad =
  | { state: "forbidden" }
  | { state: "no-cohort" }
  | { state: "error"; cohortName: string }
  | { state: "ready"; cohortName: string; rows: PseedAdminRosterRow[] };

export async function loadAdminRoster(): Promise<AdminRosterLoad> {
  // Checked here for the redirect, and again inside the RPC. The database check
  // is the one that matters — this one only decides what to render.
  if (!(await isProjectSeedAdmin())) return { state: "forbidden" };

  const cohort = await getActiveCohort();
  if (!cohort) return { state: "no-cohort" };

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("pseed_cohort_roster_admin", {
    p_cohort_id: cohort.id,
  });

  if (error) {
    console.error("[projectseed] roster failed:", error.message);
    return { state: "error", cohortName: cohort.name };
  }

  return {
    state: "ready",
    cohortName: cohort.name,
    rows: (data as PseedAdminRosterRow[]) ?? [],
  };
}

export interface AdminRosterTotals {
  participants: number;
  linked: number;
  withProject: number;
  submitted: number;
  scheduled: number;
  /** Participants whose declared hours are all solo — nobody to work with. */
  alwaysAlone: number;
  recordedHours: number;
}

export function summarizeRoster(rows: PseedAdminRosterRow[]): AdminRosterTotals {
  return {
    participants: rows.length,
    linked: rows.filter((r) => r.discord_user_id).length,
    withProject: rows.filter((r) => r.project_title).length,
    submitted: rows.filter((r) => r.brief_status === "submitted").length,
    scheduled: rows.filter((r) => r.planned_slots > 0).length,
    alwaysAlone: rows.filter((r) => r.planned_slots > 0 && r.shared_slots === 0)
      .length,
    recordedHours: Math.floor(
      rows.reduce((sum, r) => sum + r.recorded_seconds, 0) / 3600
    ),
  };
}
