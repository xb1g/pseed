import {
  getConversationsForAdmin,
  getDmLeadFacets,
  getDmLeadSignals,
  type DmLeadFilters,
  type DmLeadIntentFilter,
} from "@/lib/supabase/dm-leads";
import { BUCKET_ORDER, type DmLeadBucket } from "@/lib/dm-leads/playbook";
import { DmLeadsInbox } from "@/components/admin/DmLeadsInbox";
import { DmLeadFilters as DmLeadFilterBar } from "@/components/admin/DmLeadFilters";
import { RefreshButton } from "@/components/admin/RefreshButton";
import { ScoreboardStrip } from "@/components/admin/ScoreboardStrip";
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

import { BucketPills } from "@/components/admin/BucketPills";

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
