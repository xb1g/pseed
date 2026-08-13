import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getConversationsForAdmin } from "@/lib/supabase/dm-leads";
import { DmLeadRow } from "@/components/admin/DmLeadRow";
import { RefreshButton } from "@/components/admin/RefreshButton";
import type { DmLeadStage } from "@/types/dm-leads";

export const dynamic = "force-dynamic";

const STAGE_LABEL: Record<DmLeadStage, string> = {
  unknown: "Unknown",
  exploring: "Exploring",
  building: "Building",
  job_seeking: "Job seeking",
};

function buildHref(stage: string, myTurn: boolean) {
  const params = new URLSearchParams();
  if (stage !== "all") params.set("stage", stage);
  if (myTurn) params.set("turn", "mine");
  const qs = params.toString();
  return qs ? `/admin/dm-leads?${qs}` : "/admin/dm-leads";
}

export default async function DmLeadsPage({
  searchParams,
}: {
  searchParams: Promise<{ stage?: string; turn?: string }>;
}) {
  const { stage, turn } = await searchParams;
  const myTurnOnly = turn === "mine";
  const conversations = await getConversationsForAdmin(
    stage && stage !== "all" ? (stage as DmLeadStage) : undefined,
    myTurnOnly
  );

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

      <div className="flex flex-wrap items-center gap-2">
        {(["all", "unknown", "exploring", "building", "job_seeking"] as const).map((s) => (
          <Link
            key={s}
            href={buildHref(s, myTurnOnly)}
            className={
              (s === "all" ? !stage || stage === "all" : stage === s)
                ? "text-sm font-medium underline underline-offset-4"
                : "text-sm text-muted-foreground underline-offset-4 hover:underline"
            }
          >
            {s === "all" ? "All" : STAGE_LABEL[s]}
          </Link>
        ))}
        <span className="mx-1 text-muted-foreground">·</span>
        <Link
          href={buildHref(stage ?? "all", !myTurnOnly)}
          className={
            myTurnOnly
              ? "text-sm font-medium underline underline-offset-4"
              : "text-sm text-muted-foreground underline-offset-4 hover:underline"
          }
        >
          {myTurnOnly ? "✓ My turn only" : "My turn only"}
        </Link>
      </div>

      <Card>
        <CardContent className="pt-6">
          {conversations.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No DM leads yet.
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
