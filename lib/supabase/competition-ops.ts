import { createAdminClient } from "@/utils/supabase/admin";

export type CompetitionSource = "contester" | "devpost";
export type EligibilityStatus = "eligible" | "ineligible" | "needs_review";

export interface CompetitionOpsFilters {
  source?: CompetitionSource;
  eligibility?: EligibilityStatus;
  state?: "open" | "closed";
  query?: string;
  page?: number;
}

export interface CompetitionSourceItem {
  source: CompetitionSource;
  external_id: string;
  title: string;
  source_url: string;
  organizer_url: string | null;
  opportunity_type: string | null;
  categories: string[];
  educational_levels: string[];
  age_min: number | null;
  age_max: number | null;
  deadline: string | null;
  eligibility_status: EligibilityStatus;
  eligibility_reason: string | null;
  is_open: boolean;
  source_checked_at: string;
}

export interface CompetitionSyncRun {
  id: string;
  status: "running" | "succeeded" | "partial" | "failed";
  started_at: string;
  completed_at: string | null;
  contester_reported_total: number | null;
  contester_fetched: number;
  contester_pages: number;
  contester_complete: boolean;
  devpost_reported_total: number | null;
  devpost_fetched: number;
  devpost_pages: number;
  devpost_complete: boolean;
  promoted_count: number;
  error_code: string | null;
}

export interface CompetitionReviewItem {
  id: string;
  review_type: "expired" | "annual_refresh" | "stale_source";
  title: string;
  details: string;
  status: "pending" | "completed" | "dismissed";
  due_at: string;
  created_at: string;
}

const PAGE_SIZE = 50;

async function exactCount(
  table: "competition_source_items" | "competitions" | "competition_review_queue",
  filters: Array<[string, "eq" | "lt", string | boolean]>,
): Promise<number> {
  const client = createAdminClient();
  let query = client.from(table).select("*", { count: "exact", head: true });
  for (const [column, operator, value] of filters) {
    query = operator === "eq"
      ? query.eq(column, value)
      : query.lt(column, value);
  }
  const { count, error } = await query;
  if (error) throw new Error(`competition_ops_count_failed:${table}`);
  return count ?? 0;
}

export async function getCompetitionOpsData(filters: CompetitionOpsFilters) {
  const client = createAdminClient();
  const page = Math.max(1, filters.page ?? 1);
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;
  const today = new Date().toISOString().slice(0, 10);

  let itemQuery = client
    .from("competition_source_items")
    .select(
      "source,external_id,title,source_url,organizer_url,opportunity_type,categories,educational_levels,age_min,age_max,deadline,eligibility_status,eligibility_reason,is_open,source_checked_at",
      { count: "exact" },
    )
    .order("is_open", { ascending: false })
    .order("deadline", { ascending: true, nullsFirst: false })
    .range(from, to);
  if (filters.source) itemQuery = itemQuery.eq("source", filters.source);
  if (filters.eligibility) {
    itemQuery = itemQuery.eq("eligibility_status", filters.eligibility);
  }
  if (filters.state) itemQuery = itemQuery.eq("is_open", filters.state === "open");
  if (filters.query?.trim()) {
    itemQuery = itemQuery.ilike("title", `%${filters.query.trim()}%`);
  }

  const [
    itemsResult,
    runsResult,
    reviewsResult,
    totalSources,
    openSources,
    eligibleSources,
    reviewSources,
    openContester,
    openDevpost,
    activeCompetitions,
    staleCompetitions,
    pendingReviews,
  ] = await Promise.all([
    itemQuery,
    client.from("competition_sync_runs").select("*").order("started_at", {
      ascending: false,
    }).limit(10),
    client.from("competition_review_queue")
      .select("id,review_type,title,details,status,due_at,created_at")
      .eq("status", "pending")
      .order("due_at", { ascending: true })
      .limit(50),
    exactCount("competition_source_items", []),
    exactCount("competition_source_items", [["is_open", "eq", true]]),
    exactCount("competition_source_items", [["is_open", "eq", true], [
      "eligibility_status",
      "eq",
      "eligible",
    ]]),
    exactCount("competition_source_items", [["is_open", "eq", true], [
      "eligibility_status",
      "eq",
      "needs_review",
    ]]),
    exactCount("competition_source_items", [["source", "eq", "contester"], [
      "is_open",
      "eq",
      true,
    ]]),
    exactCount("competition_source_items", [["source", "eq", "devpost"], [
      "is_open",
      "eq",
      true,
    ]]),
    exactCount("competitions", [["is_active", "eq", true]]),
    exactCount("competitions", [["is_active", "eq", true], [
      "deadline",
      "lt",
      today,
    ]]),
    exactCount("competition_review_queue", [["status", "eq", "pending"]]),
  ]);

  if (itemsResult.error) throw new Error("competition_ops_items_failed");
  if (runsResult.error) throw new Error("competition_ops_runs_failed");
  if (reviewsResult.error) throw new Error("competition_ops_reviews_failed");

  return {
    items: (itemsResult.data ?? []) as CompetitionSourceItem[],
    itemCount: itemsResult.count ?? 0,
    page,
    pageSize: PAGE_SIZE,
    runs: (runsResult.data ?? []) as CompetitionSyncRun[],
    reviews: (reviewsResult.data ?? []) as CompetitionReviewItem[],
    metrics: {
      totalSources,
      openSources,
      eligibleSources,
      reviewSources,
      openContester,
      openDevpost,
      activeCompetitions,
      staleCompetitions,
      pendingReviews,
    },
  };
}
