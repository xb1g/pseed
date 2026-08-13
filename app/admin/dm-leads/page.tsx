import Link from "next/link";
import { Flame, Inbox, MessageSquareWarning } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  getConversationsForAdmin,
  getDmLeadFacets,
  type DmLeadFilters,
  type DmLeadIntentFilter,
} from "@/lib/supabase/dm-leads";
import { DmLeadsInbox } from "@/components/admin/DmLeadsInbox";
import { DmLeadFilters as DmLeadFilterBar } from "@/components/admin/DmLeadFilters";
import { RefreshButton } from "@/components/admin/RefreshButton";
import type { DmLeadStage, DmPlatform } from "@/types/dm-leads";

export const dynamic = "force-dynamic";

const STAGE_LABEL: Record<DmLeadStage, string> = {
  unknown: "Unknown",
  exploring: "Exploring",
  building: "Building",
  job_seeking: "Job seeking",
};

interface RawParams {
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

function parseFilters(raw: RawParams): DmLeadFilters {
  return {
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

export default async function DmLeadsPage({
  searchParams,
}: {
  searchParams: Promise<RawParams>;
}) {
  const raw = await searchParams;
  const filters = parseFilters(raw);
  const [conversations, facets] = await Promise.all([
    getConversationsForAdmin(filters),
    getDmLeadFacets(filters),
  ]);

  const activeStage = raw.stage && raw.stage !== "all" ? raw.stage : "all";
  const myTurnOnly = raw.turn === "mine";
  const pathlabSentOnly = raw.link === "pathlab";
  const starredOnly = raw.star === "1";
  const followUpDueOnly = raw.followup === "due";

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold">DM Leads</h2>
          <p className="text-sm text-muted-foreground">
            Instagram &amp; Facebook DM leads, auto-labeled by stage.
          </p>
        </div>
        <RefreshButton />
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <Inbox className="h-4 w-4" /> ทั้งหมด{" "}
          <b className="text-foreground">{facets.total}</b>
        </span>
        <span className="flex items-center gap-1.5">
          <MessageSquareWarning className="h-4 w-4 text-amber-500" /> รอเราตอบ{" "}
          <b className={cn(facets.needsReply > 0 && "text-amber-600 dark:text-amber-400")}>
            {facets.needsReply}
          </b>
        </span>
        <span className="flex items-center gap-1.5">
          <Flame className="h-4 w-4 text-red-500" /> พร้อมสมัคร{" "}
          <b className={cn(facets.payReady > 0 && "text-red-600 dark:text-red-400")}>
            {facets.payReady}
          </b>
        </span>
        <span>
          ตามตัวกรองนี้ <b className="text-foreground">{conversations.length}</b>
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {(["all", "unknown", "exploring", "building", "job_seeking"] as const).map((s) => {
          const isActive = activeStage === s;
          const count = s === "all" ? facets.total : facets.stageCounts[s];
          return (
            <Link
              key={s}
              href={buildHref(raw, { stage: s === "all" ? undefined : s })}
              className={cn(
                "rounded-full border px-3 py-1 text-sm transition-colors",
                isActive
                  ? "border-foreground bg-foreground text-background"
                  : "text-muted-foreground hover:border-foreground/40 hover:text-foreground"
              )}
            >
              {s === "all" ? "All" : STAGE_LABEL[s]}
              <span className={cn("ml-1.5 text-xs", isActive ? "opacity-80" : "opacity-60")}>
                {count}
              </span>
            </Link>
          );
        })}
        <span className="mx-1 text-muted-foreground">·</span>
        <Link
          href={buildHref(raw, { turn: myTurnOnly ? undefined : "mine" })}
          className={cn(
            "rounded-full border px-3 py-1 text-sm transition-colors",
            myTurnOnly
              ? "border-amber-500 bg-amber-500 text-white"
              : "text-muted-foreground hover:border-amber-400 hover:text-amber-600"
          )}
        >
          {myTurnOnly ? "✓ " : ""}รอเราตอบ
          <span className="ml-1.5 text-xs opacity-70">{facets.needsReply}</span>
        </Link>
        <Link
          href={buildHref(raw, { link: pathlabSentOnly ? undefined : "pathlab" })}
          className={cn(
            "rounded-full border px-3 py-1 text-sm transition-colors",
            pathlabSentOnly
              ? "border-emerald-500 bg-emerald-500 text-white"
              : "text-muted-foreground hover:border-emerald-400 hover:text-emerald-600"
          )}
        >
          {pathlabSentOnly ? "✓ " : ""}📨 ส่งลิงก์ PathLab แล้ว
          <span className="ml-1.5 text-xs opacity-70">{facets.pathlabSent}</span>
        </Link>
        <Link
          href={buildHref(raw, { star: starredOnly ? undefined : "1" })}
          className={cn(
            "rounded-full border px-3 py-1 text-sm transition-colors",
            starredOnly
              ? "border-amber-400 bg-amber-400 text-white"
              : "text-muted-foreground hover:border-amber-400 hover:text-amber-500"
          )}
        >
          {starredOnly ? "✓ " : ""}⭐ ติดดาว
          <span className="ml-1.5 text-xs opacity-70">{facets.starred}</span>
        </Link>
        <Link
          href={buildHref(raw, { followup: followUpDueOnly ? undefined : "due" })}
          className={cn(
            "rounded-full border px-3 py-1 text-sm transition-colors",
            followUpDueOnly
              ? "border-red-500 bg-red-500 text-white"
              : "text-muted-foreground hover:border-red-400 hover:text-red-600"
          )}
        >
          {followUpDueOnly ? "✓ " : ""}⏰ ถึงกำหนดติดตาม
          <span className="ml-1.5 text-xs opacity-70">{facets.followUpDue}</span>
        </Link>
      </div>

      <DmLeadFilterBar
        values={{
          grade: raw.grade ?? "all",
          intent: raw.intent ?? "all",
          platform: raw.platform ?? "all",
          sort: raw.sort === "waiting" ? "waiting" : "newest",
          search: raw.search ?? "",
          status: raw.status ?? "all",
          tag: raw.tag ?? "all",
        }}
        statusCounts={facets.leadStatusCounts}
        tagCounts={facets.tagCounts}
      />

      <DmLeadsInbox conversations={conversations} />
    </div>
  );
}
