import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  getConversationsForAdmin,
  getDmLeadFacets,
  getDmLeadSignals,
  type DmLeadFilters,
  type DmLeadIntentFilter,
} from "@/lib/supabase/dm-leads";
import {
  BUCKET_META,
  BUCKET_ORDER,
  SCOREBOARD_METRICS,
  pct,
  type DmLeadBucket,
  type FunnelScoreboard,
} from "@/lib/dm-leads/playbook";
import { DmLeadsInbox } from "@/components/admin/DmLeadsInbox";
import { DmLeadFilters as DmLeadFilterBar } from "@/components/admin/DmLeadFilters";
import { RefreshButton } from "@/components/admin/RefreshButton";
import type { DmLeadStage, DmPlatform } from "@/types/dm-leads";

export const dynamic = "force-dynamic";

interface RawParams {
  bucket?: string;
  stage?: string;
  turn?: string;
  grade?: string;
  intent?: string;
  platform?: string;
  sort?: string;
  search?: string;
  link?: string;
  star?: string;
  followup?: string;
  status?: string;
  tag?: string;
}

const LEAD_STATUSES = ["new", "contacted", "qualified", "converted", "lost", "spam"] as const;

function parseBucket(raw: string | undefined): DmLeadBucket | undefined {
  if (!raw || raw === "all") return undefined;
  return BUCKET_ORDER.find((b) => b === raw);
}

function parseFilters(raw: RawParams): DmLeadFilters {
  return {
    bucket: parseBucket(raw.bucket),
    stage:
      raw.stage && raw.stage !== "all" ? (raw.stage as DmLeadStage) : undefined,
    grade: raw.grade && raw.grade !== "all" ? raw.grade : undefined,
    intent:
      raw.intent && raw.intent !== "all" ? (raw.intent as DmLeadIntentFilter) : undefined,
    platform:
      raw.platform && raw.platform !== "all" ? (raw.platform as DmPlatform) : undefined,
    myTurnOnly: raw.turn === "mine",
    search: raw.search?.trim() || undefined,
    sort: raw.sort === "waiting" ? "waiting" : "newest",
    pathlabLinkSent: raw.link === "pathlab",
    starredOnly: raw.star === "1",
    followUpDue: raw.followup === "due",
    leadStatus: LEAD_STATUSES.find((s) => s === raw.status),
    tag: raw.tag && raw.tag !== "all" ? raw.tag : undefined,
  };
}

function buildHref(raw: RawParams, patch: Partial<RawParams>) {
  const merged = { ...raw, ...patch };
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(merged)) {
    if (!value || value === "all") continue;
    if (key === "sort" && value === "newest") continue;
    params.set(key, value);
  }
  const qs = params.toString();
  return qs ? `/admin/dm-leads?${qs}` : "/admin/dm-leads";
}

const PILL_BASE = "rounded-full border px-2.5 py-0.5 text-xs transition-colors";

/**
 * Funnel health for the whole inbox, one compact strip. Failing metrics are
 * red — the point of the strip is to be uncomfortable when we go quiet.
 */
function ScoreboardStrip({ scoreboard }: { scoreboard: FunnelScoreboard }) {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-lg border bg-muted/30 px-3 py-1.5 text-xs">
      <span className="text-muted-foreground">
        สุขภาพกรวย · คุยจริง <b className="text-foreground">{scoreboard.engaged}</b>
      </span>
      {SCOREBOARD_METRICS.map((metric) => {
        const value = pct(scoreboard[metric.key], scoreboard.engaged);
        const passing = value >= metric.targetPct;
        return (
          <span
            key={metric.key}
            className="flex items-center gap-1"
            title={`ฐาน ${metric.baselinePct}% · เป้า ${metric.targetPct}%`}
          >
            <span className="text-muted-foreground">{metric.label}</span>
            <b
              className={cn(
                "tabular-nums",
                passing ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
              )}
            >
              {value}%
            </b>
            <span className="text-muted-foreground/70">{passing ? "✓" : "✗"}</span>
          </span>
        );
      })}
    </div>
  );
}

/** Primary navigation: the playbook work order, highest-value bucket first. */
function BucketPills({
  raw,
  activeBucket,
  bucketCounts,
  total,
}: {
  raw: RawParams;
  activeBucket: DmLeadBucket | undefined;
  bucketCounts: Record<DmLeadBucket, number>;
  total: number;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Link
        href={buildHref(raw, { bucket: undefined })}
        className={cn(
          PILL_BASE,
          !activeBucket
            ? "border-foreground bg-foreground text-background"
            : "text-muted-foreground hover:border-foreground/40 hover:text-foreground"
        )}
      >
        All
        <span className={cn("ml-1.5 text-xs", !activeBucket ? "opacity-80" : "opacity-60")}>
          {total}
        </span>
      </Link>
      {BUCKET_ORDER.map((bucket) => {
        const meta = BUCKET_META[bucket];
        const isActive = activeBucket === bucket;
        return (
          <Link
            key={bucket}
            href={buildHref(raw, { bucket: isActive ? undefined : bucket })}
            title={meta.why}
            className={cn(PILL_BASE, isActive ? meta.activeClass : meta.idleClass)}
          >
            {meta.label}
            <span className={cn("ml-1.5 text-xs", isActive ? "opacity-80" : "opacity-60")}>
              {bucketCounts[bucket]}
            </span>
          </Link>
        );
      })}
    </div>
  );
}

export default async function DmLeadsPage({
  searchParams,
}: {
  searchParams: Promise<RawParams>;
}) {
  const raw = await searchParams;
  const filters = parseFilters(raw);
  // One scan of dm_messages, shared by the list and the facets.
  const signals = await getDmLeadSignals();
  const [conversations, facets] = await Promise.all([
    getConversationsForAdmin(filters, signals),
    getDmLeadFacets(filters, signals),
  ]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-baseline gap-2">
          <h2 className="text-xl font-semibold">DM Leads</h2>
          <p className="text-xs text-muted-foreground">
            เรียงตามลำดับงานจาก reply playbook — ทำจากซ้ายไปขวา
          </p>
        </div>
        <RefreshButton />
      </div>

      <ScoreboardStrip scoreboard={facets.scoreboard} />

      <BucketPills
        raw={raw}
        activeBucket={filters.bucket}
        bucketCounts={facets.bucketCounts}
        total={facets.total}
      />

      <DmLeadFilterBar
        values={{
          stage: raw.stage ?? "all",
          grade: raw.grade ?? "all",
          intent: raw.intent ?? "all",
          platform: raw.platform ?? "all",
          status: raw.status ?? "all",
          tag: raw.tag ?? "all",
          sort: raw.sort === "waiting" ? "waiting" : "newest",
          search: raw.search ?? "",
          turn: raw.turn === "mine" ? "mine" : "",
          link: raw.link === "pathlab" ? "pathlab" : "",
          star: raw.star === "1" ? "1" : "",
          followup: raw.followup === "due" ? "due" : "",
        }}
        chipCounts={{
          needsReply: facets.needsReply,
          pathlabSent: facets.pathlabSent,
          starred: facets.starred,
          followUpDue: facets.followUpDue,
        }}
        stageCounts={facets.stageCounts}
        statusCounts={facets.leadStatusCounts}
        tagCounts={facets.tagCounts}
      />

      <DmLeadsInbox conversations={conversations} />
    </div>
  );
}
