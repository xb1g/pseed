import { createClient } from "@supabase/supabase-js";

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
}

interface DevpostItem {
  id: number;
  title: string;
  url: string;
  open_state: string;
  submission_period_dates: string;
  themes?: Array<{ name: string }>;
}

const CONTESTER_BASE = "https://api.contester.life/contest";
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
    limit: "10",
    query: "",
    approvalStatus: "APPROVED",
    sortBy: "created_timestamp",
    sortOrder: "desc",
    opportunityTypes: CONTESTER_TYPES,
    showOnlyActive: "false",
    lang: "en",
  }).toString();
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

export async function syncCompetitionSources(config: SourceSyncConfig) {
  const fetcher = config.fetcher ?? fetch;
  const client = createClient(
    config.supabaseUrl,
    config.supabaseServiceRoleKey,
    {
      auth: { autoRefreshToken: false, persistSession: false },
    },
  );
  const checkedAt = new Date().toISOString();

  const contesterResponses = await Promise.all(
    [1, 2].map((page) =>
      fetcher(contesterUrl(page), {
        headers: {
          accept: "application/json",
          origin: "https://contester.life",
          referer: "https://contester.life/",
          "x-tenant-slug": "contester",
        },
        signal: AbortSignal.timeout(15_000),
      })
    ),
  );
  if (contesterResponses.some((response) => !response.ok)) {
    throw new Error("contester_sync_failed");
  }
  const contesterItems =
    (await Promise.all(contesterResponses.map(async (response) => {
      const body = await response.json() as {
        data?: { items?: ContesterItem[] };
      };
      return body.data?.items ?? [];
    }))).flat();

  const devpostResponse = await fetcher(
    "https://devpost.com/api/hackathons?challenge_type%5B%5D=online",
    {
      headers: { accept: "application/json" },
      signal: AbortSignal.timeout(15_000),
    },
  );
  if (!devpostResponse.ok) throw new Error("devpost_sync_failed");
  const devpostBody = await devpostResponse.json() as {
    hackathons?: DevpostItem[];
  };
  const devpostItems = devpostBody.hackathons ?? [];

  const now = Date.now();
  const sourceRows = [
    ...contesterItems.map((item) => {
      const levels = item.educational_level ?? [];
      const deadline = sourceDate(item.closing_date);
      return {
        source: "contester",
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
        opens_at: sourceDate(item.open_date),
        deadline,
        eligible_for_high_school: levels.includes("HIGH") ||
          levels.includes("MIDDLE"),
        is_open: Boolean(deadline && Date.parse(deadline) >= now),
        source_checked_at: checkedAt,
      };
    }),
    ...devpostItems.map((item) => {
      const dates = devpostDates(item.submission_period_dates);
      return {
        source: "devpost",
        external_id: String(item.id),
        title: item.title,
        source_url: item.url,
        organizer_url: item.url,
        opportunity_type: "HACKATHON",
        categories: (item.themes ?? []).map((theme) => theme.name),
        educational_levels: [],
        opens_at: dates.opensAt,
        deadline: dates.deadline,
        eligible_for_high_school: false,
        is_open: item.open_state === "open" &&
          Boolean(dates.deadline && Date.parse(dates.deadline) >= now),
        source_checked_at: checkedAt,
      };
    }),
  ];

  // Rows that fall out of the bounded source windows must not remain marked
  // open forever. Existing promoted competitions still expire independently
  // from their own deadline through the Supabase cron.
  for (const source of ["contester", "devpost"] as const) {
    const { error } = await client
      .from("competition_source_items")
      .update({ is_open: false })
      .eq("source", source);
    if (error) throw new Error("competition_source_reset_failed");
  }

  const { error: sourceError } = await client
    .from("competition_source_items")
    .upsert(sourceRows, { onConflict: "source,external_id" });
  if (sourceError) throw new Error("competition_source_upsert_failed");

  const eligible = sourceRows.filter((row) =>
    row.source === "contester" && row.eligible_for_high_school && row.is_open &&
    row.deadline
  );
  if (eligible.length > 0) {
    const { error: competitionError } = await client.from("competitions")
      .upsert(
        eligible.map((row) => ({
          name_th: row.title,
          name_en: row.title,
          field: fieldsFor(row.categories),
          grade_levels: ["ม.4", "ม.5", "ม.6"],
          weight: 3,
          application_opens: row.opens_at?.slice(0, 10) ?? null,
          deadline: row.deadline?.slice(0, 10) ?? null,
          url: row.organizer_url,
          contester_url: row.source_url,
          source_platform: row.source,
          source_external_id: row.external_id,
          source_checked_at: checkedAt,
          verified_by: "contester-api",
          notes: `Imported from Contester API. Categories: ${
            row.categories.join(", ") || "uncategorized"
          }.`,
          is_active: true,
        })),
        { onConflict: "source_platform,source_external_id" },
      );
    if (competitionError) throw new Error("competition_promotion_failed");
  }

  return {
    contesterSeen: contesterItems.length,
    devpostSeen: devpostItems.length,
    promoted: eligible.length,
  };
}
