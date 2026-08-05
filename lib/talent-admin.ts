import { createAdminClient } from "@/utils/supabase/admin";
import type { TalentProfile } from "@/lib/talent";

/**
 * Admin-side reads for the /talent funnel.
 *
 * `talent_project_briefs` is insert-only for the public and has no SELECT
 * policy, and unverified profiles are hidden from the anon read policy — so
 * both reads go through the service-role client. Every caller must sit behind
 * `requireAdmin()` (the /admin layout enforces it).
 */

export interface ProjectBrief {
  id: string;
  contact: string;
  brief: string;
  created_at: string;
}

/** Full profile row, including the contact fields the public page never sees. */
export interface TalentSignup extends TalentProfile {
  line_id: string | null;
  phone: string | null;
  created_at: string;
}

export async function getProjectBriefs(): Promise<ProjectBrief[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("talent_project_briefs")
    .select("id, contact, brief, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to fetch project briefs:", error.message);
    return [];
  }

  return (data ?? []) as ProjectBrief[];
}

export async function getTalentSignups(): Promise<TalentSignup[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("talent_profiles")
    .select(
      "id, full_name, nickname, age, school, line_id, phone, track, tools, portfolio_links, verified, created_at",
    )
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to fetch talent signups:", error.message);
    return [];
  }

  return (data ?? []) as TalentSignup[];
}
