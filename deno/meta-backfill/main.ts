import { type DirectBackfillConfig, runDirectBackfill } from "./backfill.ts";
import { syncCompetitionSources } from "./competition-sync.ts";

function isProductionTimeline(): boolean {
  const timeline = Deno.env.get("DENO_TIMELINE");
  return !timeline || timeline === "production";
}

function loadConfig(): DirectBackfillConfig {
  const config = {
    supabaseUrl: Deno.env.get("NEXT_PUBLIC_SUPABASE_URL") ?? "",
    supabaseServiceRoleKey: Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    accessToken: Deno.env.get("META_PAGE_ACCESS_TOKEN") ?? "",
    instagramAccountId: Deno.env.get("INSTAGRAM_BUSINESS_ACCOUNT_ID") ?? "",
  };
  const missing = Object.entries(config).filter(([, value]) => !value).map((
    [key],
  ) => key);
  if (missing.length > 0) {
    throw new Error(`missing_config:${missing.join(",")}`);
  }
  return config;
}

Deno.cron(
  "passionseed-meta-backfill",
  "*/15 * * * *",
  { backoffSchedule: [60_000, 300_000, 900_000] },
  async () => {
    if (!isProductionTimeline()) return;

    try {
      const result = await runDirectBackfill(loadConfig());
      console.info("Meta backfill cron completed", result);
    } catch {
      console.error("Meta backfill cron failed", {
        errorCode: "meta_backfill_cron_failed",
      });
      throw new Error("Meta backfill cron failed");
    }
  },
);

Deno.cron(
  "passionseed-competition-source-sync",
  "23 1 * * *",
  { backoffSchedule: [60_000, 300_000, 900_000] },
  async () => {
    if (!isProductionTimeline()) return;
    try {
      const result = await syncCompetitionSources(loadConfig());
      console.info("Competition source sync completed", result);
    } catch {
      console.error("Competition source sync failed", {
        errorCode: "competition_source_sync_failed",
      });
      throw new Error("Competition source sync failed");
    }
  },
);

Deno.serve(() =>
  Response.json({
    service: "passionseed-meta-backfill",
    status: "ok",
    supabaseConfigured: Boolean(
      Deno.env.get("NEXT_PUBLIC_SUPABASE_URL") &&
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"),
    ),
    metaConfigured: Boolean(
      Deno.env.get("META_PAGE_ACCESS_TOKEN") &&
        Deno.env.get("INSTAGRAM_BUSINESS_ACCOUNT_ID"),
    ),
    timeline: Deno.env.get("DENO_TIMELINE") ?? "local",
  })
);
