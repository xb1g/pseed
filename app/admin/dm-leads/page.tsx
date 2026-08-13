import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getConversationsForAdmin } from "@/lib/supabase/dm-leads";
import type { DmLeadStage } from "@/types/dm-leads";

export const dynamic = "force-dynamic";

const STAGE_LABEL: Record<DmLeadStage, string> = {
  unknown: "Unknown",
  exploring: "Exploring",
  building: "Building",
  job_seeking: "Job seeking",
};

const STAGE_VARIANT: Record<DmLeadStage, "secondary" | "default" | "outline"> = {
  unknown: "outline",
  exploring: "secondary",
  building: "default",
  job_seeking: "default",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

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
                  <TableRow key={c.id}>
                    <TableCell>
                      <Link href={`/admin/dm-leads/${c.id}`} className="font-medium hover:underline">
                        {c.display_name || c.username || c.platform_user_id}
                      </Link>
                    </TableCell>
                    <TableCell className="capitalize">{c.platform}</TableCell>
                    <TableCell>{c.grade_level ?? "—"}</TableCell>
                    <TableCell>
                      <Badge variant={STAGE_VARIANT[c.stage]}>{STAGE_LABEL[c.stage]}</Badge>
                    </TableCell>
                    <TableCell className="max-w-[220px] truncate text-sm text-muted-foreground">
                      {c.recommended_product ?? "—"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(c.last_message_at)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
