import type { SupabaseClient } from "@supabase/supabase-js";

export type PortfolioTrack = "dev" | "video" | "strategy" | "design" | "other";
export type PortfolioSeeking =
  | "internship"
  | "freelance"
  | "collaboration"
  | "not-looking";

export interface PortfolioIdentity {
  userId: string;
  username: string;
  fullName: string | null;
  avatarUrl: string | null;
  memberSince: string | null;
  handle: string | null;
  headline: string | null;
  track: PortfolioTrack | null;
  tools: string[];
  portfolioLinks: string[];
  seeking: PortfolioSeeking | null;
  isPublic: boolean;
  publishedSections: string[];
}

export interface PathlabJourney {
  enrollmentId: string;
  seedTitle: string;
  status: "active" | "paused" | "quit" | "explored";
  currentDay: number;
  totalDays: number;
  enrolledAt: string;
  completedAt: string | null;
  reportShareToken: string | null;
}

export interface ProjectSeedBuild {
  participantId: string;
  cohortName: string;
  title: string;
  summary: string | null;
  whatBuild: string | null;
  tags: string[];
  status: "draft" | "submitted";
  submittedAt: string | null;
}

export interface ProjectCard {
  id: string;
  /** Composite key used for curation: "pathlab:<id>" | "projectseed:<id>" */
  key: string;
  source: "pathlab" | "projectseed";
  title: string;
  subtitle: string;
  status: string;
  statusTone: "active" | "done" | "quiet";
  tags: string[];
  metric: string;
  detail: string | null;
  evidenceHref: string | null;
  sortKey: string;
  isHero: boolean;
  /** Student-written impact line, e.g. "37 people used this in week 1" */
  impact: string | null;
}

export interface PortfolioCuration {
  heroProject: string | null;
  notes: Record<string, string>;
  order: string[];
}

export interface OwnerPortfolio {
  kind: "owner";
  identity: PortfolioIdentity;
  curation: PortfolioCuration;
  pathlab: PathlabJourney[];
  projectseed: ProjectSeedBuild[];
  cards: ProjectCard[];
}

export interface PublicPortfolio {
  kind: "public";
  identity: PortfolioIdentity;
  curation: PortfolioCuration;
  cards: ProjectCard[];
}

interface PublicProfileRow {
  user_id: string;
  handle: string | null;
  headline: string | null;
  track: PortfolioTrack | null;
  tools: string[] | null;
  portfolio_links: string[] | null;
  seeking: PortfolioSeeking | null;
  is_public: boolean;
  published_sections: string[] | null;
  hero_project: string | null;
  portfolio_notes: Record<string, string> | null;
  portfolio_order: string[] | null;
}

function toCuration(row: {
  hero_project?: string | null;
  portfolio_notes?: Record<string, string> | null;
  portfolio_order?: string[] | null;
} | null): PortfolioCuration {
  return {
    heroProject: row?.hero_project ?? null,
    notes: row?.portfolio_notes ?? {},
    order: row?.portfolio_order ?? [],
  };
}

interface ProfileRow {
  id: string;
  username: string;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string | null;
}

const PATHLAB_STATUS_TONE: Record<PathlabJourney["status"], ProjectCard["statusTone"]> = {
  active: "active",
  paused: "quiet",
  quit: "quiet",
  explored: "done",
};

export function buildProjectCards(
  input: {
    pathlab: PathlabJourney[];
    projectseed: ProjectSeedBuild[];
  },
  curation: PortfolioCuration = { heroProject: null, notes: {}, order: [] },
): ProjectCard[] {
  const pathlabCards: ProjectCard[] = input.pathlab.map((journey) => {
    const key = `pathlab:${journey.enrollmentId}`;
    return {
      id: journey.enrollmentId,
      key,
      source: "pathlab",
      title: journey.seedTitle,
      subtitle: "PathLab journey",
      status: journey.status,
      statusTone: PATHLAB_STATUS_TONE[journey.status],
      tags: [],
      metric:
        journey.status === "explored"
          ? `Completed ${journey.totalDays} days`
          : `Day ${journey.currentDay} of ${journey.totalDays}`,
      detail: null,
      evidenceHref: journey.reportShareToken
        ? `/report/${journey.reportShareToken}`
        : null,
      sortKey: journey.completedAt ?? journey.enrolledAt,
      isHero: curation.heroProject === key,
      impact: curation.notes[key] ?? null,
    };
  });

  const buildCards: ProjectCard[] = input.projectseed.map((build) => {
    const key = `projectseed:${build.participantId}`;
    return {
      id: build.participantId,
      key,
      source: "projectseed",
      title: build.title,
    subtitle: build.cohortName,
    status: build.status,
    statusTone: build.status === "submitted" ? "active" : "quiet",
    tags: build.tags,
    metric: build.status === "submitted" ? "Brief submitted" : "Draft brief",
    detail: build.whatBuild ?? build.summary,
    evidenceHref: null,
    sortKey: build.submittedAt ?? "",
    isHero: curation.heroProject === key,
    impact: curation.notes[key] ?? null,
    };
  });

  const cards = [...pathlabCards, ...buildCards];
  const orderIndex = new Map(curation.order.map((key, index) => [key, index]));

  return cards.sort((a, b) => {
    if (a.isHero !== b.isHero) return a.isHero ? -1 : 1;
    const aOrder = orderIndex.get(a.key);
    const bOrder = orderIndex.get(b.key);
    if (aOrder !== undefined || bOrder !== undefined) {
      return (aOrder ?? Number.MAX_SAFE_INTEGER) - (bOrder ?? Number.MAX_SAFE_INTEGER);
    }
    return b.sortKey.localeCompare(a.sortKey);
  });
}

export interface GapHint {
  id: "no-hero" | "missing-impact" | "one-source" | "no-evidence";
  message: string;
  actionKey: string | null;
}

export function buildGapHints(cards: ProjectCard[]): GapHint[] {
  if (cards.length === 0) return [];

  const hints: GapHint[] = [];
  const hero = cards.find((card) => card.isHero);

  if (!hero) {
    hints.push({
      id: "no-hero",
      message: "Pick your #1 piece — the strongest work leads the portfolio.",
      actionKey: null,
    });
  }

  const needsImpact = cards
    .filter((card) => card.statusTone !== "quiet")
    .filter((card) => !card.impact);
  if (hero && needsImpact.length > 0) {
    hints.push({
      id: "missing-impact",
      message: `Add an impact line to ${needsImpact.length === 1 ? `"${needsImpact[0].title}"` : `${needsImpact.length} pieces`} — numbers beat adjectives (users, people, rank).`,
      actionKey: needsImpact[0].key,
    });
  }

  const sources = new Set(cards.map((card) => card.source));
  if (sources.size === 1 && cards.length >= 2) {
    hints.push({
      id: "one-source",
      message:
        cards[0].source === "pathlab"
          ? "All journeys so far — ship one ProjectSeed build to show follow-through."
          : "All builds so far — a PathLab journey shows you can explore and finish.",
      actionKey: null,
    });
  }

  if (hero && !hero.evidenceHref && hero.source === "pathlab") {
    hints.push({
      id: "no-evidence",
      message: "Your hero has no linked report — finish the journey to unlock verifiable evidence.",
      actionKey: hero.key,
    });
  }

  return hints.slice(0, 3);
}

function toIdentity(
  profile: ProfileRow,
  publicProfile: PublicProfileRow | null,
): PortfolioIdentity {
  return {
    userId: profile.id,
    username: profile.username,
    fullName: profile.full_name,
    avatarUrl: profile.avatar_url,
    memberSince: profile.created_at,
    handle: publicProfile?.handle ?? null,
    headline: publicProfile?.headline ?? null,
    track: publicProfile?.track ?? null,
    tools: publicProfile?.tools ?? [],
    portfolioLinks: publicProfile?.portfolio_links ?? [],
    seeking: publicProfile?.seeking ?? null,
    isPublic: publicProfile?.is_public ?? false,
    publishedSections: publicProfile?.published_sections ?? [],
  };
}

export async function getOwnerPortfolio(
  supabase: SupabaseClient,
  userId: string,
): Promise<OwnerPortfolio | null> {
  const [profileRes, publicRes, enrollmentsRes, participantsRes] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("id, username, full_name, avatar_url, created_at")
        .eq("id", userId)
        .single(),
      supabase
        .from("public_profiles")
        .select(
          "user_id, handle, headline, track, tools, portfolio_links, seeking, is_public, published_sections, hero_project, portfolio_notes, portfolio_order",
        )
        .eq("user_id", userId)
        .maybeSingle(),
      supabase
        .from("path_enrollments")
        .select(
          "id, status, current_day, enrolled_at, completed_at, paths(total_days, seeds(title)), path_reports(share_token)",
        )
        .eq("user_id", userId)
        .order("enrolled_at", { ascending: false }),
      supabase
        .from("pseed_participants")
        .select(
          "id, pseed_cohorts(name), pseed_project_picks(custom_title, what_build, status, submitted_at, tags, pseed_project_options(title, summary))",
        )
        .eq("user_id", userId),
    ]);

  if (profileRes.error || !profileRes.data) {
    return null;
  }

  const pathlab: PathlabJourney[] = (enrollmentsRes.data ?? []).map((row) => {
    const path = first(row.paths);
    const seed = first(path?.seeds);
    const report = first(row.path_reports);
    return {
      enrollmentId: row.id as string,
      seedTitle: (seed?.title as string) ?? "Untitled journey",
      status: row.status as PathlabJourney["status"],
      currentDay: row.current_day as number,
      totalDays: (path?.total_days as number) ?? 5,
      enrolledAt: row.enrolled_at as string,
      completedAt: (row.completed_at as string | null) ?? null,
      reportShareToken: (report?.share_token as string | null) ?? null,
    };
  });

  const projectseed: ProjectSeedBuild[] = (participantsRes.data ?? [])
    .map((row) => {
      const cohort = first(row.pseed_cohorts);
      const pick = first(row.pseed_project_picks);
      if (!pick) return null;
      const option = first(pick.pseed_project_options);
      const title =
        (pick.custom_title as string | null) ?? (option?.title as string | null);
      if (!title) return null;
      return {
        participantId: row.id as string,
        cohortName: (cohort?.name as string) ?? "ProjectSeed",
        title,
        summary: (option?.summary as string | null) ?? null,
        whatBuild: (pick.what_build as string | null) ?? null,
        tags: (pick.tags as string[] | null) ?? [],
        status: pick.status as ProjectSeedBuild["status"],
        submittedAt: (pick.submitted_at as string | null) ?? null,
      } satisfies ProjectSeedBuild;
    })
    .filter((build): build is ProjectSeedBuild => build !== null);

  const identity = toIdentity(
    profileRes.data as ProfileRow,
    (publicRes.data as PublicProfileRow | null) ?? null,
  );
  const curation = toCuration(publicRes.data as PublicProfileRow | null);

  return {
    kind: "owner",
    identity,
    curation,
    pathlab,
    projectseed,
    cards: buildProjectCards({ pathlab, projectseed }, curation),
  };
}

interface PublicPortfolioRpc {
  profile: {
    user_id: string;
    username: string;
    full_name: string | null;
    avatar_url: string | null;
    member_since: string | null;
    handle: string | null;
    headline: string | null;
    track: PortfolioTrack | null;
    tools: string[] | null;
    portfolio_links: string[] | null;
    seeking: PortfolioSeeking | null;
    hero_project: string | null;
    portfolio_notes: Record<string, string> | null;
    portfolio_order: string[] | null;
  };
  pathlab: Array<{
    enrollment_id: string;
    seed_title: string;
    status: PathlabJourney["status"];
    current_day: number;
    total_days: number;
    enrolled_at: string;
    completed_at: string | null;
    report_share_token: string | null;
  }>;
  projectseed: Array<{
    participant_id: string;
    cohort_name: string;
    title: string;
    summary: string | null;
    what_build: string | null;
    tags: string[] | null;
    status: ProjectSeedBuild["status"];
    submitted_at: string | null;
  }>;
}

export async function getPublicPortfolio(
  supabase: SupabaseClient,
  handle: string,
): Promise<PublicPortfolio | null> {
  const { data, error } = await supabase.rpc("get_public_portfolio", {
    p_handle: handle,
  });

  if (error || !data) {
    return null;
  }

  const rpc = data as PublicPortfolioRpc;
  const pathlab: PathlabJourney[] = rpc.pathlab.map((journey) => ({
    enrollmentId: journey.enrollment_id,
    seedTitle: journey.seed_title,
    status: journey.status,
    currentDay: journey.current_day,
    totalDays: journey.total_days,
    enrolledAt: journey.enrolled_at,
    completedAt: journey.completed_at,
    reportShareToken: journey.report_share_token,
  }));
  const projectseed: ProjectSeedBuild[] = rpc.projectseed.map((build) => ({
    participantId: build.participant_id,
    cohortName: build.cohort_name,
    title: build.title,
    summary: build.summary,
    whatBuild: build.what_build,
    tags: build.tags ?? [],
    status: build.status,
    submittedAt: build.submitted_at,
  }));

  const curation = toCuration(rpc.profile);

  return {
    kind: "public",
    identity: {
      userId: rpc.profile.user_id,
      username: rpc.profile.username,
      fullName: rpc.profile.full_name,
      avatarUrl: rpc.profile.avatar_url,
      memberSince: rpc.profile.member_since,
      handle: rpc.profile.handle,
      headline: rpc.profile.headline,
      track: rpc.profile.track,
      tools: rpc.profile.tools ?? [],
      portfolioLinks: rpc.profile.portfolio_links ?? [],
      seeking: rpc.profile.seeking,
      isPublic: true,
      publishedSections: [],
    },
    curation,
    cards: buildProjectCards({ pathlab, projectseed }, curation),
  };
}

export async function resolveOwnerHandle(
  supabase: SupabaseClient,
  handle: string,
  userId: string,
): Promise<boolean> {
  const { data } = await supabase
    .from("public_profiles")
    .select("user_id")
    .eq("handle", handle)
    .maybeSingle();
  if (data?.user_id === userId) return true;

  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("username", handle)
    .eq("id", userId)
    .maybeSingle();
  return profile !== null;
}

function first<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}
