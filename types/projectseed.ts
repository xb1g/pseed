/**
 * ProjectSeed cohort hub — see docs/project/PROJECTSEED-STRATEGY.md.
 *
 * The MVP audience is alumni. Student and mentor roles exist in the schema so
 * batch 1 does not need a migration to start, but nothing reads them yet.
 */

export type PseedAudience = "alumni" | "student";
export type PseedRole = "alumni" | "student" | "mentor";
export type PseedPickStatus = "draft" | "submitted";

export interface PseedCohort {
  id: string;
  slug: string;
  name: string;
  audience: PseedAudience;
  discord_guild_id: string | null;
  starts_on: string | null;
  ends_on: string | null;
  is_active: boolean;
}

export interface PseedParticipant {
  id: string;
  cohort_id: string;
  user_id: string;
  role: PseedRole;
  status: string;
  display_name: string | null;
  discord_user_id: string | null;
  discord_username: string | null;
  discord_linked_at: string | null;
  timezone: string;
}

export interface PseedProjectOption {
  id: string;
  slug: string;
  title: string;
  summary: string;
  detail: string | null;
  difficulty: string;
  tags: string[];
  sort_order: number;
}

export interface PseedProjectPick {
  id: string;
  participant_id: string;
  project_option_id: string | null;
  custom_title: string | null;
  what_build: string | null;
  why_this: string | null;
  who_for: string | null;
  first_step: string | null;
  /** Free text, lowercased, max 5. What the room searches on. */
  tags: string[];
  status: PseedPickStatus;
  submitted_at: string | null;
}

/**
 * One person's presence in one hour, with what they are building.
 *
 * Flat rather than nested per slot because that is the shape the RPC returns
 * and the shape a heatmap cell needs after one `groupRosterBySlot` pass.
 */
export interface PseedSlotRosterEntry {
  day_of_week: number;
  hour_of_day: number;
  participant_id: string;
  display_name: string | null;
  project_title: string | null;
  tags: string[];
  is_me: boolean;
}

/** A tag and how many people in the cohort are using it. */
export interface PseedTagCount {
  tag: string;
  participant_count: number;
}

/** One occupied cell of the weekly grid, aggregated across the cohort. */
export interface PseedHeatmapCell {
  day_of_week: number;
  hour_of_day: number;
  participant_count: number;
  includes_me: boolean;
}

/** A slot the current participant marked. day 0 = Monday, hour is 0–23 local. */
export interface PseedSlot {
  day: number;
  hour: number;
}

/**
 * Everything the hub needs in one shape. Assembled server-side so each step of
 * the flow can decide what to show without its own round trip.
 */
export interface PseedHubState {
  cohort: PseedCohort;
  participant: PseedParticipant;
  pick: PseedProjectPick | null;
  options: PseedProjectOption[];
  mySlots: PseedSlot[];
  heatmap: PseedHeatmapCell[];
  /** Who is in each slot and what they are building. */
  roster: PseedSlotRosterEntry[];
  /** What the whole room is working on, most common first. */
  cohortTags: PseedTagCount[];
  participantCount: number;
}

export type PseedStepId = "discord" | "project" | "brief" | "schedule";

export interface PseedStep {
  id: PseedStepId;
  label: string;
  hint: string;
  href: string;
  done: boolean;
}
