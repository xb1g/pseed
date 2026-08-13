"use client";

import { useState, useTransition } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { TableCell, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { getThread } from "@/app/admin/dm-leads/actions";
import { DmLeadReplyForm } from "@/components/admin/DmLeadReplyForm";
import type { DmConversation, DmConversationWithMessages, DmLeadStage } from "@/types/dm-leads";

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

export function DmLeadRow({ conversation }: { conversation: DmConversation }) {
  const [open, setOpen] = useState(false);
  const [thread, setThread] = useState<DmConversationWithMessages | null>(null);
  const [isPending, startTransition] = useTransition();

  const toggle = () => {
    if (open) {
      setOpen(false);
      return;
    }
    setOpen(true);
    if (!thread) {
      startTransition(async () => {
        const result = await getThread(conversation.id);
        setThread(result);
      });
    }
  };

  return (
    <>
      <TableRow className="cursor-pointer" onClick={toggle}>
        <TableCell>
          <div className="flex items-center gap-1 font-medium">
            {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            {conversation.display_name || conversation.username || conversation.platform_user_id}
          </div>
        </TableCell>
        <TableCell className="capitalize">{conversation.platform}</TableCell>
        <TableCell>{conversation.grade_level ?? "—"}</TableCell>
        <TableCell>
          <Badge variant={STAGE_VARIANT[conversation.stage]}>{STAGE_LABEL[conversation.stage]}</Badge>
        </TableCell>
        <TableCell className="max-w-[220px] truncate text-sm text-muted-foreground">
          {conversation.recommended_product ?? "—"}
        </TableCell>
        <TableCell className="text-sm text-muted-foreground">
          {formatDate(conversation.last_message_at)}
        </TableCell>
      </TableRow>
      {open && (
        <TableRow>
          <TableCell colSpan={6} className="bg-muted/30">
            {isPending || !thread ? (
              <p className="py-4 text-center text-sm text-muted-foreground">Loading…</p>
            ) : (
              <div className="space-y-3 py-3">
                <div className="max-h-80 space-y-2 overflow-y-auto">
                  {thread.dm_messages.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No messages.</p>
                  ) : (
                    thread.dm_messages.map((m) => (
                      <div
                        key={m.id}
                        className={cn(
                          "max-w-[75%] rounded-lg px-3 py-2 text-sm",
                          m.direction === "inbound"
                            ? "mr-auto bg-background"
                            : "ml-auto bg-primary text-primary-foreground"
                        )}
                      >
                        <p>{m.body}</p>
                        <p className="mt-1 text-xs opacity-70">{formatDate(m.sent_at)}</p>
                      </div>
                    ))
                  )}
                </div>
                <div onClick={(e) => e.stopPropagation()}>
                  <DmLeadReplyForm conversationId={conversation.id} />
                </div>
              </div>
            )}
          </TableCell>
        </TableRow>
      )}
    </>
  );
}
