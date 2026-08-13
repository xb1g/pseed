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
import type { DmLeadStage } from "@/types/dm-leads";

export const dynamic = "force-dynamic";

const STAGE_LABEL: Record<DmLeadStage, string> = {
  unknown: "Unknown",
  exploring: "Exploring",
  building: "Building",
  job_seeking: "Job seeking",
};

export default async function DmLeadsPage({
  searchParams,
}: {
  searchParams: Promise<{ stage?: string }>;
}) {
  const { stage } = await searchParams;
  const conversations = await getConversationsForAdmin(
    stage && stage !== "all" ? (stage as DmLeadStage) : undefined
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">DM Leads</h2>
        <p className="text-sm text-muted-foreground">
          Instagram &amp; Facebook DM leads, auto-labeled by stage.
        </p>
      </div>

      <div className="flex gap-2">
        {(["all", "unknown", "exploring", "building", "job_seeking"] as const).map((s) => (
          <Link
            key={s}
            href={s === "all" ? "/admin/dm-leads" : `/admin/dm-leads?stage=${s}`}
            className="text-sm text-muted-foreground underline-offset-4 hover:underline"
          >
            {s === "all" ? "All" : STAGE_LABEL[s]}
          </Link>
        ))}
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
                  <TableHead>Recommended</TableHead>
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
