import Link from "next/link";
import { Flame, Inbox, MessageSquareWarning } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import {
  getConversationsForAdmin,
  getDmLeadFacets,
  type DmLeadFilters,
  type DmLeadIntentFilter,
} from "@/lib/supabase/dm-leads";
import { DmLeadRow } from "@/components/admin/DmLeadRow";
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
}

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

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-3 py-4">
            <Inbox className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-2xl font-semibold leading-none">{facets.total}</p>
              <p className="mt-1 text-xs text-muted-foreground">Leads ทั้งหมด</p>
            </div>
          </CardContent>
        </Card>
        <Card className={cn(facets.needsReply > 0 && "border-amber-300 dark:border-amber-800")}>
          <CardContent className="flex items-center gap-3 py-4">
            <MessageSquareWarning className="h-5 w-5 text-amber-500" />
            <div>
              <p className="text-2xl font-semibold leading-none">{facets.needsReply}</p>
              <p className="mt-1 text-xs text-muted-foreground">รอเราตอบ</p>
            </div>
          </CardContent>
        </Card>
        <Card className={cn(facets.payReady > 0 && "border-red-300 dark:border-red-800")}>
          <CardContent className="flex items-center gap-3 py-4">
            <Flame className="h-5 w-5 text-red-500" />
            <div>
              <p className="text-2xl font-semibold leading-none">{facets.payReady}</p>
              <p className="mt-1 text-xs text-muted-foreground">พร้อมสมัคร (Hot)</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 py-4">
            <Inbox className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-2xl font-semibold leading-none">{conversations.length}</p>
              <p className="mt-1 text-xs text-muted-foreground">ตามตัวกรองนี้</p>
            </div>
          </CardContent>
        </Card>
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
      </div>

      <DmLeadFilterBar
        values={{
          grade: raw.grade ?? "all",
          intent: raw.intent ?? "all",
          platform: raw.platform ?? "all",
          sort: raw.sort === "waiting" ? "waiting" : "newest",
          search: raw.search ?? "",
        }}
      />

      <Card>
        <CardContent className="pt-6">
          {conversations.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              ไม่พบ lead ที่ตรงกับตัวกรองนี้
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Lead</TableHead>
                  <TableHead>Platform</TableHead>
                  <TableHead>Grade</TableHead>
                  <TableHead>Stage</TableHead>
                  <TableHead>Tags</TableHead>
                  <TableHead>Last message</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {conversations.map((c) => (
                  <DmLeadRow key={c.id} conversation={c} />
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
