import { createClient } from "@/utils/supabase/server";
import { hasDiscordIdentity } from "@/lib/projectseed/discord";
import type {
  PseedCohort,
  PseedHeatmapCell,
  PseedHubState,
  PseedParticipant,
  PseedProjectOption,
  PseedProjectPick,
  PseedSlot,
} from "@/types/projectseed";

/** The only cohort the MVP serves. Batch 1 turns this into a route param. */
export const PSEED_ACTIVE_COHORT_SLUG = "alumni-mvp";

export type HubLoad =
  | { state: "anonymous" }
  | { state: "no-cohort" }
  | { state: "not-joined"; cohort: PseedCohort; userId: string }
  | {
      state: "ready";
      hub: PseedHubState;
      userId: string;
      /**
       * The auth user carries a Discord identity that has not reached the
       * participant row yet. Returned from here so the hub page does not have
       * to re-fetch the user just to answer it.
       */
      needsDiscordSync: boolean;
    };

const COHORT_COLUMNS =
  "id, slug, name, audience, discord_guild_id, starts_on, ends_on, is_active";
const PARTICIPANT_COLUMNS =
  "id, cohort_id, user_id, role, status, display_name, discord_user_id, discord_username, discord_linked_at, timezone";
const PICK_COLUMNS =
  "id, participant_id, project_option_id, custom_title, what_build, why_this, who_for, first_step, status, submitted_at";
const OPTION_COLUMNS =
  "id, slug, title, summary, detail, difficulty, tags, sort_order";

export async function getActiveCohort(): Promise<PseedCohort | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("pseed_cohorts")
    .select(COHORT_COLUMNS)
    .eq("slug", PSEED_ACTIVE_COHORT_SLUG)
    .eq("is_active", true)
    .maybeSingle();

  if (error) {
    console.error("[projectseed] failed to load cohort:", error.message);
    return null;
  }
  return (data as PseedCohort) ?? null;
}

/**
 * Loads every piece of hub state in one place.
 *
 * The queries after the participant lookup are independent, so they run
 * together — the hub is the first screen after login and a serial chain of five
 * round trips is the difference between "instant" and "is it broken".
 */
export async function loadHub(): Promise<HubLoad> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { state: "anonymous" };

  const cohort = await getActiveCohort();
  if (!cohort) return { state: "no-cohort" };

  const { data: participantRow } = await supabase
    .from("pseed_participants")
    .select(PARTICIPANT_COLUMNS)
    .eq("cohort_id", cohort.id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!participantRow) {
    return { state: "not-joined", cohort, userId: user.id };
  }

  const participant = participantRow as PseedParticipant;

  const [optionsRes, pickRes, slotsRes, heatmapRes, countRes] = await Promise.all([
    supabase
      .from("pseed_project_options")
      .select(OPTION_COLUMNS)
      .eq("is_active", true)
      .order("sort_order", { ascending: true }),
    supabase
      .from("pseed_project_picks")
      .select(PICK_COLUMNS)
      .eq("participant_id", participant.id)
      .maybeSingle(),
    supabase
      .from("pseed_availability")
      .select("day_of_week, hour_of_day")
      .eq("participant_id", participant.id),
    supabase.rpc("pseed_cohort_heatmap", { p_cohort_id: cohort.id }),
    supabase
      .from("pseed_participants")
      .select("id", { count: "exact", head: true })
      .eq("cohort_id", cohort.id)
      .eq("status", "active"),
  ]);

  const mySlots: PseedSlot[] = (slotsRes.data ?? []).map(
    (row: { day_of_week: number; hour_of_day: number }) => ({
      day: row.day_of_week,
      hour: row.hour_of_day,
    })
  );

  return {
    state: "ready",
    userId: user.id,
    needsDiscordSync:
      !participant.discord_user_id && hasDiscordIdentity(user),
    hub: {
      cohort,
      participant,
      pick: (pickRes.data as PseedProjectPick) ?? null,
      options: (optionsRes.data as PseedProjectOption[]) ?? [],
      mySlots,
      heatmap: (heatmapRes.data as PseedHeatmapCell[]) ?? [],
      participantCount: countRes.count ?? 0,
    },
  };
}
