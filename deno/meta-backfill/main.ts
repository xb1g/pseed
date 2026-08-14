import { runMetaBackfill } from "./scheduler.ts";

const DEFAULT_ENDPOINT = "https://www.passionseed.org/api/cron/meta-backfill";

function isProductionTimeline(): boolean {
  const timeline = Deno.env.get("DENO_TIMELINE");
  return !timeline || timeline === "production";
}

Deno.cron(
  "passionseed-meta-backfill",
  "*/15 * * * *",
  { backoffSchedule: [60_000, 300_000, 900_000] },
  async () => {
    if (!isProductionTimeline()) return;

    try {
      const result = await runMetaBackfill({
        endpoint: Deno.env.get("META_BACKFILL_URL") ?? DEFAULT_ENDPOINT,
        secret: Deno.env.get("CRON_SECRET") ?? "",
      });
      console.info("Meta backfill cron completed", result);
    } catch {
      console.error("Meta backfill cron failed", {
        errorCode: "meta_backfill_cron_failed",
      });
      throw new Error("Meta backfill cron failed");
    }
  },
);

Deno.serve(() =>
  Response.json({
    service: "passionseed-meta-backfill",
    status: "ok",
    cronSecretConfigured: Boolean(Deno.env.get("CRON_SECRET")),
    timeline: Deno.env.get("DENO_TIMELINE") ?? "local",
  })
);
