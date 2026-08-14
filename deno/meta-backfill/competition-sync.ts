import { createClient, type SupabaseClient } from "@supabase/supabase-js";

interface SourceSyncConfig {
  supabaseUrl: string;
  supabaseServiceRoleKey: string;
  fetcher?: typeof fetch;
}

interface ContesterItem {
  id: number;
  slug: string | null;
  title: string;
  open_date: string | null;
  closing_date: string | null;
  opportunity_type: string | null;
  educational_level?: string[];
  categories?: Array<{ name: string }>;
  link?: string[];
  age_min?: number | null;
  age_max?: number | null;
}

interface ContesterResponse {
  data?: {
    items?: ContesterItem[];
    totalCount?: number;
    totalPages?: number;
  };
}

interface DevpostItem {
  id: number;
  title: string;
  url: string;
  open_state: string;
  submission_period_dates: string;
  themes?: Array<{ name: string }>;
}

interface DevpostResponse {
  hackathons?: DevpostItem[];
  meta?: { total_count?: number; per_page?: number };
}

interface Eligibility {
  status: "eligible" | "ineligible" | "needs_review";
  reason: string;
}

const CONTESTER_BASE = "https://api.contester.life/contest";
const CONTESTER_PAGE_SIZE = 100;
const DEVPOST_PAGE_SIZE = 40;
const MAX_CONTESTER_PAGES = 100;
const MAX_DEVPOST_PAGES = 200;
const FETCH_CONCURRENCY = 5;
const UPSERT_CHUNK_SIZE = 500;
const CONTESTER_TYPES = [
  "COMPETITION",
  "HACKATHON",
  "CASE_COMPETITION",
  "WORKSHOP",
  "BOOTCAMP",
  "FELLOWSHIP",
  "SCHOLARSHIP",
  "GRANT_FUNDING",
  "ACCELERATOR_INCUBATOR",
  "AMBASSADOR_PROGRAM",
  "SUMMIT_CONFERENCE",
  "VOLUNTEERING",
  "TRAINING_COURSE",
  "OTHERS",
].join(",");

export function contesterUrl(page: number): string {
  const url = new URL(CONTESTER_BASE);
  url.search = new URLSearchParams({
    page: String(page),
    limit: String(CONTESTER_PAGE_SIZE),
    query: "",
    approvalStatus: "APPROVED",
    sortBy: "created_timestamp",
    sortOrder: "desc",
    opportunityTypes: CONTESTER_TYPES,
    showOnlyActive: "true",
    lang: "en",
  }).toString();
  return url.toString();
}

export function devpostUrl(page: number): string {
  const url = new URL("https://devpost.com/api/hackathons");
  url.searchParams.append("challenge_type[]", "online");
  url.searchParams.set("per_page", String(DEVPOST_PAGE_SIZE));
  url.searchParams.set("page", String(page));
  return url.toString();
}

function sourceDate(value: string | null): string | null {
  return value && !Number.isNaN(Date.parse(value))
    ? new Date(value).toISOString()
    : null;
}

export function devpostDates(
  value: string,
): { opensAt: string | null; deadline: string | null } {
  const year = value.match(/\b(20\d{2})\b/)?.[1];
  const parts = value.split(" - ");
  if (!year || parts.length !== 2) return { opensAt: null, deadline: null };
  const parse = (part: string, endOfDay: boolean) => {
    const withYear = /20\d{2}/.test(part) ? part : `${part}, ${year}`;
    const time = Date.parse(
      `${withYear} ${endOfDay ? "23:59:59" : "00:00:00"} UTC`,
    );
    return Number.isNaN(time) ? null : new Date(time).toISOString();
  };
  return { opensAt: parse(parts[0], false), deadline: parse(parts[1], true) };
}

export function deriveContesterEligibility(
  levels: string[],
  ageMin: number | null,
  ageMax: number | null,
): Eligibility {
  if (levels.includes("HIGH")) {
    return {
      status: "eligible",
      reason: "Contester education level includes HIGH.",
    };
  }
  const overlapsHighSchoolAge = ageMin !== null && ageMin <= 18 &&
    (ageMax === null || ageMax >= 15);
  if (overlapsHighSchoolAge) {
    return {
      status: "needs_review",
      reason: `Published age range ${ageMin}–${
        ageMax ?? "open"
      } overlaps 15–18, but grade eligibility is not explicit.`,
    };
  }
  if (levels.length > 0 || ageMin !== null || ageMax !== null) {
    return {
      status: "ineligible",
      reason: "Published education/age limits do not include high school.",
    };
  }
  return {
    status: "needs_review",
    reason: "No structured age or education eligibility was published.",
  };
}

function fieldsFor(categories: string[]): string[] {
  const values = new Set<string>();
  for (const category of categories) {
    if (/Technology|Research|Education/i.test(category)) {
      values.add("วิทยาการคอมพิวเตอร์");
    }
    if (/Business|Marketing/i.test(category)) values.add("บริหารธุรกิจ");
    if (/Health/i.test(category)) values.add("แพทยศาสตร์");
    if (/Art|Design|Music/i.test(category)) values.add("ศิลปกรรมศาสตร์");
    if (/Environment|Agriculture/i.test(category)) {
      values.add("วิทยาศาสตร์สิ่งแวดล้อม");
    }
  }
  return values.size ? [...values] : ["สหวิทยาการ"];
}

async function fetchJson<T>(
  fetcher: typeof fetch,
  url: string,
  source: "contester" | "devpost",
): Promise<T> {
  const headers = new Headers({ accept: "application/json" });
  if (source === "contester") {
    headers.set("origin", "https://contester.life");
    headers.set("referer", "https://contester.life/");
    headers.set("x-tenant-slug", "contester");
  }
  const response = await fetcher(url, {
    headers,
    signal: AbortSignal.timeout(15_000),
  });
  if (!response.ok) throw new Error(`${source}_http_${response.status}`);
  return await response.json() as T;
}

async function fetchRemainingPages<T>(
  pages: number[],
  fetchPage: (page: number) => Promise<T[]>,
): Promise<T[]> {
  const items: T[] = [];
  for (let index = 0; index < pages.length; index += FETCH_CONCURRENCY) {
    const batch = pages.slice(index, index + FETCH_CONCURRENCY);
    const rows = await Promise.all(batch.map(fetchPage));
    items.push(...rows.flat());
  }
  return items;
}

function uniqueById<T extends { id: number }>(items: T[]): T[] {
  return [...new Map(items.map((item) => [item.id, item])).values()];
}

async function fetchContester(fetcher: typeof fetch) {
  const first = await fetchJson<ContesterResponse>(
    fetcher,
    contesterUrl(1),
    "contester",
  );
  const reportedTotal = first.data?.totalCount ?? 0;
  const reportedPages = first.data?.totalPages ?? 1;
  const pages = Math.min(reportedPages, MAX_CONTESTER_PAGES);
  const remaining = await fetchRemainingPages(
    Array.from({ length: Math.max(0, pages - 1) }, (_, index) => index + 2),
    async (page) => {
      const response = await fetchJson<ContesterResponse>(
        fetcher,
        contesterUrl(page),
        "contester",
      );
      return response.data?.items ?? [];
    },
  );
  const items = uniqueById([...(first.data?.items ?? []), ...remaining]);
  return {
    items,
    reportedTotal,
    pages,
    complete: reportedPages <= MAX_CONTESTER_PAGES &&
      items.length >= reportedTotal,
  };
}

async function fetchDevpost(fetcher: typeof fetch) {
  const first = await fetchJson<DevpostResponse>(
    fetcher,
    devpostUrl(1),
    "devpost",
  );
  const reportedTotal = first.meta?.total_count ?? 0;
  const perPage = first.meta?.per_page ?? DEVPOST_PAGE_SIZE;
  const reportedPages = Math.max(1, Math.ceil(reportedTotal / perPage));
  const pages = Math.min(reportedPages, MAX_DEVPOST_PAGES);
  const remaining = await fetchRemainingPages(
    Array.from({ length: Math.max(0, pages - 1) }, (_, index) => index + 2),
    async (page) => {
      const response = await fetchJson<DevpostResponse>(
        fetcher,
        devpostUrl(page),
        "devpost",
      );
      return response.hackathons ?? [];
    },
  );
  const items = uniqueById([...(first.hackathons ?? []), ...remaining]);
  return {
    items,
    reportedTotal,
    pages,
    complete: reportedPages <= MAX_DEVPOST_PAGES &&
      items.length >= reportedTotal,
  };
}

async function upsertChunks(
  client: SupabaseClient,
  rows: Array<Record<string, unknown>>,
): Promise<void> {
  for (let index = 0; index < rows.length; index += UPSERT_CHUNK_SIZE) {
    const { error } = await client.from("competition_source_items").upsert(
      rows.slice(index, index + UPSERT_CHUNK_SIZE),
      { onConflict: "source,external_id" },
    );
    if (error) throw new Error("competition_source_upsert_failed");
  }
}

async function resetOpenRows(
  client: SupabaseClient,
  source: "contester" | "devpost",
): Promise<void> {
  const { error } = await client.from("competition_source_items")
    .update({ is_open: false })
    .eq("source", source);
  if (error) throw new Error("competition_source_reset_failed");
}

function safeErrorCode(error: unknown): string {
  return error instanceof Error ? error.message.slice(0, 80) : "unknown_error";
}

export async function syncCompetitionSources(config: SourceSyncConfig) {
  const fetcher = config.fetcher ?? fetch;
  const client = createClient(
    config.supabaseUrl,
    config.supabaseServiceRoleKey,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
  const { data: run, error: runError } = await client
    .from("competition_sync_runs")
    .insert({ status: "running" })
    .select("id")
    .single();
  if (runError || !run) throw new Error("competition_sync_run_create_failed");

  try {
    const [contester, devpost] = await Promise.all([
      fetchContester(fetcher),
      fetchDevpost(fetcher),
    ]);
    const checkedAt = new Date().toISOString();
    const now = Date.now();
    const sourceRows: Array<
      Record<string, unknown> & {
        source: "contester" | "devpost";
        deadline: string | null;
        is_open: boolean;
        eligibility_status: Eligibility["status"];
        categories: string[];
      }
    > = [
      ...contester.items.map((item) => {
        const levels = item.educational_level ?? [];
        const ageMin = item.age_min ?? null;
        const ageMax = item.age_max ?? null;
        const eligibility = deriveContesterEligibility(levels, ageMin, ageMax);
        const deadline = sourceDate(item.closing_date);
        return {
          source: "contester" as const,
          external_id: String(item.id),
          title: item.title,
          source_url: item.slug
            ? `https://contester.life/contest/${item.slug}`
            : `https://contester.life/contest/${item.id}`,
          organizer_url: item.link?.find((url) => /^https:\/\//.test(url)) ??
            null,
          opportunity_type: item.opportunity_type,
          categories: (item.categories ?? []).map((category) => category.name),
          educational_levels: levels,
          age_min: ageMin,
          age_max: ageMax,
          opens_at: sourceDate(item.open_date),
          deadline,
          eligibility_status: eligibility.status,
          eligibility_reason: eligibility.reason,
          eligible_for_high_school: eligibility.status === "eligible",
          is_open: Boolean(deadline && Date.parse(deadline) >= now),
          source_checked_at: checkedAt,
          sync_run_id: run.id,
        };
      }),
      ...devpost.items.map((item) => {
        const dates = devpostDates(item.submission_period_dates);
        return {
          source: "devpost" as const,
          external_id: String(item.id),
          title: item.title,
          source_url: item.url,
          organizer_url: item.url,
          opportunity_type: "HACKATHON",
          categories: (item.themes ?? []).map((theme) => theme.name),
          educational_levels: [],
          age_min: null,
          age_max: null,
          opens_at: dates.opensAt,
          deadline: dates.deadline,
          eligibility_status: "needs_review" as const,
          eligibility_reason:
            "Devpost list API does not publish age or grade eligibility.",
          eligible_for_high_school: false,
          is_open: item.open_state === "open" &&
            Boolean(dates.deadline && Date.parse(dates.deadline) >= now),
          source_checked_at: checkedAt,
          sync_run_id: run.id,
        };
      }),
    ];

    if (contester.complete) await resetOpenRows(client, "contester");
    if (devpost.complete) await resetOpenRows(client, "devpost");
    await upsertChunks(client, sourceRows);

    const eligible = sourceRows.filter((row) =>
      row.source === "contester" && row.eligibility_status === "eligible" &&
      row.is_open && row.deadline
    );
    if (contester.complete) {
      const { error } = await client.from("competitions")
        .update({ is_active: false })
        .eq("source_platform", "contester")
        .eq("is_active", true);
      if (error) throw new Error("competition_deactivation_failed");
    }
    if (eligible.length > 0) {
      const { error } = await client.from("competitions").upsert(
        eligible.map((row) => ({
          name_th: row.title,
          name_en: row.title,
          field: fieldsFor(row.categories),
          grade_levels: ["ม.4", "ม.5", "ม.6"],
          weight: 3,
          application_opens: typeof row.opens_at === "string"
            ? row.opens_at.slice(0, 10)
            : null,
          deadline: row.deadline?.slice(0, 10) ?? null,
          url: row.organizer_url,
          contester_url: row.source_url,
          source_platform: row.source,
          source_external_id: row.external_id,
          source_checked_at: checkedAt,
          verified_by: "contester-api",
          notes:
            `Imported from Contester API. Eligibility: ${row.eligibility_reason} Categories: ${
              row.categories.join(", ") || "uncategorized"
            }.`,
          is_active: true,
        })),
        { onConflict: "source_platform,source_external_id" },
      );
      if (error) throw new Error("competition_promotion_failed");
    }

    const complete = contester.complete && devpost.complete;
    const result = {
      contesterSeen: contester.items.length,
      contesterReported: contester.reportedTotal,
      contesterPages: contester.pages,
      contesterComplete: contester.complete,
      devpostSeen: devpost.items.length,
      devpostReported: devpost.reportedTotal,
      devpostPages: devpost.pages,
      devpostComplete: devpost.complete,
      promoted: eligible.length,
    };
    const { error: completionError } = await client
      .from("competition_sync_runs")
      .update({
        status: complete ? "succeeded" : "partial",
        completed_at: new Date().toISOString(),
        contester_reported_total: result.contesterReported,
        contester_fetched: result.contesterSeen,
        contester_pages: result.contesterPages,
        contester_complete: result.contesterComplete,
        devpost_reported_total: result.devpostReported,
        devpost_fetched: result.devpostSeen,
        devpost_pages: result.devpostPages,
        devpost_complete: result.devpostComplete,
        promoted_count: result.promoted,
      })
      .eq("id", run.id);
    if (completionError) throw new Error("competition_sync_run_update_failed");
    return result;
  } catch (error) {
    await client.from("competition_sync_runs").update({
      status: "failed",
      completed_at: new Date().toISOString(),
      error_code: safeErrorCode(error),
    }).eq("id", run.id);
    throw error;
  }
}
