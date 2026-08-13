"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChevronDown, ExternalLink, Flame, MessageSquareWarning } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { getThread, type LeadMetaPatch } from "@/app/admin/dm-leads/actions";
import { summarizeLeadNeeds } from "@/lib/dm-leads/lead-summary";
import { DmLeadManageBar } from "@/components/admin/DmLeadManageBar";
import { DmLeadReplyForm } from "@/components/admin/DmLeadReplyForm";
import { DmLeadTagsEditor } from "@/components/admin/DmLeadTagsEditor";
import { LeadNeedsSummary } from "@/components/admin/LeadNeedsSummary";
import { LeadTagBadges } from "@/components/admin/LeadTagBadges";
import type { DmConversation, DmConversationWithMessages } from "@/types/dm-leads";

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

interface DmLeadDetailPaneProps {
  conversation: DmConversation;
  body: string;
  onBodyChange: (body: string) => void;
  onSent: () => void;
  /** Syncs manage-bar patches (star, status, …) into the inbox list state. */
  onMetaChange?: (patch: LeadMetaPatch) => void;
}

/**
 * Right-hand reading pane of the DM inbox: lead header, needs summary,
 * full thread, and the reply box. Threads are cached per conversation so
 * keyboard navigation back and forth is instant.
 */
export function DmLeadDetailPane({
  conversation,
  body,
  onBodyChange,
  onSent,
  onMetaChange,
}: DmLeadDetailPaneProps) {
  const [thread, setThread] = useState<DmConversationWithMessages | null>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const cache = useRef(new Map<string, DmConversationWithMessages>());
  const threadRef = useRef<HTMLDivElement>(null);

  // Fresh lead → collapse the details section again.
  useEffect(() => setExpanded(false), [conversation.id]);

  useEffect(() => {
    const cached = cache.current.get(conversation.id);
    if (cached) {
      setThread(cached);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    getThread(conversation.id).then((result) => {
      if (cancelled) return;
      if (result) cache.current.set(conversation.id, result);
      setThread(result);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [conversation.id]);

  // Start scrolled to the newest message whenever the thread changes.
  useEffect(() => {
    const el = threadRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [thread, conversation.id]);

  const handleSent = () => {
    // The cached thread is now missing the sent message — drop it.
    cache.current.delete(conversation.id);
    onSent();
  };

  const summary = summarizeLeadNeeds(conversation);

  return (
    <div className="flex flex-col overflow-hidden rounded-lg border lg:h-[calc(100vh-14rem)]">
      <div className="space-y-1.5 border-b px-3 py-2">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <h3 className="max-w-45 truncate text-base font-semibold">
            {conversation.display_name || conversation.username || conversation.platform_user_id}
          </h3>
          <div className="ml-auto flex items-center gap-1.5">
            <DmLeadManageBar conversation={conversation} onChange={onMetaChange} />
            <Link
              href={`/admin/dm-leads/${conversation.id}`}
              className="shrink-0 rounded-full p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              title="Open full page (o)"
            >
              <ExternalLink className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-1 text-[11px]">
          <Badge variant="outline" className="px-1.5 py-0 text-[10px] capitalize">
            {conversation.platform}
          </Badge>
          {conversation.grade_level && (
            <Badge variant="outline" className="px-1.5 py-0 text-[10px]">
              {conversation.grade_level}
            </Badge>
          )}
          <Badge variant="secondary" className="px-1.5 py-0 text-[10px]">
            {conversation.stage}
          </Badge>
          <LeadTagBadges tags={conversation} />
          {conversation.interests.length > 0 && (
            <span className="truncate text-muted-foreground">
              · {conversation.interests.join(", ")}
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="flex w-full items-center gap-1.5 rounded px-1 py-0.5 text-left text-xs transition-colors hover:bg-muted/60"
          title="Needs summary & tags"
        >
          {summary.priority === "hot" && (
            <Flame className="h-3 w-3 shrink-0 text-red-500" aria-label="Hot lead" />
          )}
          {summary.priority === "reply" && (
            <MessageSquareWarning
              className="h-3 w-3 shrink-0 text-amber-500"
              aria-label="Awaiting our reply"
            />
          )}
          <span className="shrink-0 font-medium">{summary.headline}</span>
          <span className="truncate text-muted-foreground">→ {summary.suggestedAction}</span>
          <ChevronDown
            className={cn(
              "ml-auto h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform",
              expanded && "rotate-180"
            )}
          />
        </button>
        {expanded && (
          <div className="space-y-2 pb-1 pt-1">
            <LeadNeedsSummary conversation={conversation} />
            <DmLeadTagsEditor conversation={conversation} onChange={onMetaChange} />
          </div>
        )}
      </div>

      <div ref={threadRef} className="min-h-32 flex-1 space-y-2 overflow-y-auto p-3">
        {loading ? (
          <p className="py-8 text-center text-sm text-muted-foreground">Loading…</p>
        ) : !thread || thread.dm_messages.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">No messages.</p>
        ) : (
          thread.dm_messages.map((m) => (
            <div
              key={m.id}
              className={cn(
                "max-w-[75%] rounded-lg px-3 py-2 text-sm",
                m.direction === "inbound"
                  ? "mr-auto bg-muted"
                  : "ml-auto bg-primary text-primary-foreground"
              )}
            >
              <p className="whitespace-pre-wrap">{m.body}</p>
              <p className="mt-1 text-xs opacity-70">{formatDate(m.sent_at)}</p>
            </div>
          ))
        )}
      </div>

      <div className="border-t px-3 py-2">
        <DmLeadReplyForm
          conversation={conversation}
          body={body}
          onBodyChange={onBodyChange}
          onSent={handleSent}
        />
      </div>
    </div>
  );
}
