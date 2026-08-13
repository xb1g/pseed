import { notFound } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { getConversationWithMessages } from "@/lib/supabase/dm-leads";
import { DmLeadManageBar } from "@/components/admin/DmLeadManageBar";
import { DmLeadReplyForm } from "@/components/admin/DmLeadReplyForm";
import { DmLeadTagsEditor } from "@/components/admin/DmLeadTagsEditor";
import { LeadNeedsSummary } from "@/components/admin/LeadNeedsSummary";
import { LeadTagBadges } from "@/components/admin/LeadTagBadges";

export const dynamic = "force-dynamic";

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function DmLeadDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const conversation = await getConversationWithMessages(id);
  if (!conversation) notFound();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">
          {conversation.display_name || conversation.username || conversation.platform_user_id}
        </h2>
        <div className="mt-2 flex flex-wrap gap-2 text-sm">
          <Badge variant="outline" className="capitalize">{conversation.platform}</Badge>
          {conversation.grade_level && <Badge variant="outline">{conversation.grade_level}</Badge>}
          <Badge variant="secondary">{conversation.stage}</Badge>
        </div>
        <div className="mt-2">
          <LeadTagBadges tags={conversation} />
        </div>
        <div className="mt-3 space-y-2">
          <DmLeadManageBar conversation={conversation} />
          <DmLeadTagsEditor conversation={conversation} />
        </div>
        {conversation.interests.length > 0 && (
          <p className="mt-2 text-sm text-muted-foreground">
            Interests: {conversation.interests.join(", ")}
          </p>
        )}
        <div className="mt-3 max-w-xl">
          <LeadNeedsSummary conversation={conversation} />
        </div>
      </div>

      <Card>
        <CardContent className="space-y-3 pt-6">
          {conversation.dm_messages.map((m) => (
            <div
              key={m.id}
              className={cn(
                "max-w-[75%] rounded-lg px-3 py-2 text-sm",
                m.direction === "inbound"
                  ? "mr-auto bg-muted"
                  : "ml-auto bg-primary text-primary-foreground"
              )}
            >
              <p>{m.body}</p>
              <p className="mt-1 text-xs opacity-70">{formatDate(m.sent_at)}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <DmLeadReplyForm conversation={conversation} />
    </div>
  );
}
