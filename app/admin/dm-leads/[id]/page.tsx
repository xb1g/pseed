import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { getConversationWithMessages } from "@/lib/supabase/dm-leads";
import { DmLeadManageBar } from "@/components/admin/DmLeadManageBar";
import { DmLeadTagsEditor } from "@/components/admin/DmLeadTagsEditor";
import { LeadNeedsSummary } from "@/components/admin/LeadNeedsSummary";
import { LeadTagBadges } from "@/components/admin/LeadTagBadges";
import { DmLeadConversation } from "@/components/admin/DmLeadConversation";
import { PlanGeneratorModal } from "@/components/admin/PlanGeneratorModal";

export const dynamic = "force-dynamic";

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
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold">
              {conversation.display_name || conversation.username || conversation.platform_user_id}
            </h2>
            <div className="mt-2 flex flex-wrap gap-2 text-sm">
              <Badge variant="outline" className="capitalize">{conversation.platform}</Badge>
              {conversation.grade_level && <Badge variant="outline">{conversation.grade_level}</Badge>}
              <Badge variant="secondary">{conversation.stage}</Badge>
            </div>
          </div>
          <PlanGeneratorModal conversation={conversation} />
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

      <DmLeadConversation conversation={conversation} />
    </div>
  );
}
