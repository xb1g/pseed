"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ChevronDown, ExternalLink, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { getThread, syncLeadMessages, type LeadMetaPatch } from "@/app/admin/dm-leads/actions";
import {
  BUCKET_META,
  COVERAGE_OFFER,
  classifyBucket,
  getFieldCoverage,
  type DmLeadBucket,
  type FieldCoverage,
} from "@/lib/dm-leads/playbook";
import { deriveSignalsFromMessages } from "@/lib/dm-leads/signals";
import { isWithinMessagingWindow } from "@/lib/dm-leads/messaging-window";
import { leadFromConversation, lastInboundFromMessages } from "@/lib/dm-leads/personalize";
import { BUCKET_NEXT_RUNG, RUNG_META } from "@/lib/dm-leads/scripts";
import { DmLeadManageBar } from "@/components/admin/DmLeadManageBar";
import { DM_REPLY_TEXTAREA_ID, DmLeadReplyForm } from "@/components/admin/DmLeadReplyForm";
import { DmLeadScripts } from "@/components/admin/DmLeadScripts";
import { DmLeadTagsEditor } from "@/components/admin/DmLeadTagsEditor";
import { LeadTagBadges } from "@/components/admin/LeadTagBadges";
import { DmMessageBubble } from "@/components/admin/DmMessageBubble";
import { DmLeadPublicReplyBar } from "@/components/admin/DmLeadPublicReplyBar";
import type { DmConversation, DmConversationWithMessages } from "@/types/dm-leads";

const COVERAGE_BADGE: Record<FieldCoverage, { label: string; className: string }> = {
  covered: {
    label: "มี PathLab สายนี้",
    className:
      "border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300",
  },
  uncovered: {
    label: "ยังไม่มี seed — pre-sell",
    className:
      "border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-300",
  },
  unknown: {
    label: "ยังไม่รู้สาย — ถามก่อน",
    className: "border-border bg-muted text-muted-foreground",
  },
};

/**
 * Routing decision for the selected lead: which bucket it is in, whether its
 * field has a seed today, and which rung of the ladder to play next. This is
 * the answer to "what do I say?" — it sits above the transcript on purpose.
 */
function RoutingHeader({
  bucket,
  coverage,
}: {
  bucket: DmLeadBucket;
  coverage: FieldCoverage;
}) {
  const meta = BUCKET_META[bucket];
  const badge = COVERAGE_BADGE[coverage];
  const rung = RUNG_META[BUCKET_NEXT_RUNG[bucket]];

  return (
    <div className="space-y-0.5 text-[11px]">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
        <span className="font-semibold">{meta.label}</span>
        <span
          className={cn("rounded-full border px-1.5 py-0 text-[10px] font-medium", badge.className)}
        >
          {badge.label}
        </span>
        <span className="text-muted-foreground">ตาต่อไป:</span>
        <span className="font-medium">{rung.label}</span>
        <span className="truncate text-muted-foreground" title={rung.goal}>
          {rung.goal}
        </span>
      </div>
      <p
        className="truncate text-muted-foreground"
        title={`${meta.why} · ข้อเสนอ: ${COVERAGE_OFFER[coverage]}`}
      >
        ข้อเสนอ: <span className="font-medium text-foreground">{COVERAGE_OFFER[coverage]}</span>
      </p>
    </div>
  );
}

interface DmLeadDetailPaneProps {
  conversation: DmConversation;
  body: string;
  onBodyChange: (body: string) => void;
  onSent: (hadAttachment: boolean) => void;
  /** Syncs manage-bar patches (star, status, …) into the inbox list state. */
  onMetaChange?: (patch: LeadMetaPatch) => void;
  /** Shared thread cache, lifted to the inbox so prefetched neighbors land here too. */
  threadCache: React.RefObject<Map<string, DmConversationWithMessages>>;
  isSyncing?: boolean;
}

/**
 * Right-hand reading pane of the DM inbox: lead header, needs summary,
 * full thread, and the reply box. Threads are cached per conversation (and
 * prefetched for neighboring leads by the inbox) so keyboard navigation is instant.
 */
export function DmLeadDetailPane({
  conversation,
  body,
  onBodyChange,
  onSent,
  onMetaChange,
  threadCache,
  isSyncing: propIsSyncing,
}: DmLeadDetailPaneProps) {
  const [thread, setThread] = useState<DmConversationWithMessages | null>(null);
  const [loading, setLoading] = useState(true);
  const [internalSyncing, setInternalSyncing] = useState(false);
  const isSyncing = propIsSyncing ?? internalSyncing;
  const [syncNotice, setSyncNotice] = useState<{ message: string; type: "warning" | "error" | "info" } | null>(null);
  const [scriptsOpen, setScriptsOpen] = useState(false);
  const threadRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    setSyncNotice(null);

    // Instantly display from cache if available, or fetch from local DB
    const cached = threadCache.current.get(conversation.id);
    if (cached) {
      setThread(cached);
      setLoading(false);
      return;
    }

    setLoading(true);
    getThread(conversation.id).then((result) => {
      if (cancelled) return;
      if (result) threadCache.current.set(conversation.id, result);
      setThread(result);
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [conversation.id, threadCache]);

  // Start scrolled to the newest message whenever the thread changes.
  useEffect(() => {
    const el = threadRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [thread, conversation.id]);

  const handleSent = async (hadAttachment: boolean) => {
    // The cached thread is now missing the sent message — drop it.
    threadCache.current.delete(conversation.id);
    if (hadAttachment) {
      // The inbox auto-advances to the next lead on send, which meant an
      // attachment never actually rendered before the pane switched away.
      // Refetch in place first so the image/video/file is visible here —
      // conversation.id hasn't changed, so the load-on-select effect above
      // won't refire on its own to pick up the new message.
      const result = await getThread(conversation.id);
      if (result) {
        threadCache.current.set(conversation.id, result);
        setThread(result);
      }
    }
    onSent(hadAttachment);
  };

  // Signals need message history, which only exists here once the thread loads.
  // Until then the classifier runs on EMPTY_SIGNALS and settles on first paint.
  const signals = useMemo(() => deriveSignalsFromMessages(thread?.dm_messages), [thread]);
  const bucket = classifyBucket(conversation, signals);
  const coverage = getFieldCoverage(conversation.interests);

  const lastInboundMessageAt = useMemo(() => {
    const inbound = (thread?.dm_messages ?? []).filter((m) => m.direction === "inbound");
    if (inbound.length === 0) return null;
    return inbound.reduce((latest, m) => (m.sent_at > latest ? m.sent_at : latest), inbound[0].sent_at);
  }, [thread]);
  const messagingWindowOpen = isWithinMessagingWindow(lastInboundMessageAt);

  /** Scripts drop straight into the reply box, then focus it for editing. */
  const insertScript = (script: string) => {
    onBodyChange(script);
    document.getElementById(DM_REPLY_TEXTAREA_ID)?.focus();
  };

  const handleSync = async () => {
    setInternalSyncing(true);
    setSyncNotice(null);
    try {
      const res = await syncLeadMessages(conversation.id);
      if (res.isRateLimited) {
        setSyncNotice({
          message: "⚠️ ติด Meta API Rate Limit (กำลังใช้งานเกินโควตา Instagram API ชั่วคราว)",
          type: "warning",
        });
      } else if (res.isTokenExpired) {
        setSyncNotice({
          message: "❌ Meta Access Token หมดอายุ",
          type: "error",
        });
      } else if (res.error) {
        setSyncNotice({
          message: `ℹ️ ${res.error}`,
          type: "info",
        });
      } else if (res.ok && res.messagesSynced !== undefined) {
        setSyncNotice({
          message: res.messagesSynced > 0 ? `✓ ซิงค์เรียบร้อย (พบ ${res.messagesSynced} ข้อความใหม่)` : "✓ ข้อความล่าสุดแล้ว",
          type: "info",
        });
      }

      if (res.ok && res.conversation) {
        threadCache.current.set(conversation.id, res.conversation);
        setThread(res.conversation);
        onMetaChange?.(res.conversation);
      }
    } catch (error) {
      console.error("Failed to sync conversation:", error);
    } finally {
      setInternalSyncing(false);
    }
  };

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-lg border">
      <div className="space-y-1.5 border-b px-3 py-2">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <h3 className="max-w-45 truncate text-base font-semibold">
            {conversation.display_name || conversation.username || conversation.platform_user_id}
          </h3>
          <div className="ml-auto flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleSync}
              disabled={isSyncing}
              title="โหลดข้อความล่าสุด (Load newest content)"
              className="inline-flex items-center gap-1 rounded border bg-background px-2 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50"
            >
              <RefreshCw className={cn("h-3 w-3", isSyncing && "animate-spin text-foreground")} />
              <span className="hidden sm:inline">โหลดข้อความล่าสุด</span>
            </button>
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
        <DmLeadTagsEditor conversation={conversation} onChange={onMetaChange} />
      </div>

      {syncNotice && (
        <div
          className={cn(
            "flex items-center justify-between gap-2 px-3 py-1.5 text-xs font-medium border-b",
            syncNotice.type === "warning" && "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
            syncNotice.type === "error" && "bg-destructive/10 text-destructive border-destructive/20",
            syncNotice.type === "info" && "bg-muted text-muted-foreground border-border"
          )}
        >
          <span>{syncNotice.message}</span>
          <button
            type="button"
            onClick={() => setSyncNotice(null)}
            className="text-xs opacity-70 hover:opacity-100"
          >
            ✕
          </button>
        </div>
      )}

      <div className="shrink-0 border-b bg-muted/30 px-3 py-1.5">
        <RoutingHeader bucket={bucket} coverage={coverage} />
        <button
          type="button"
          onClick={() => setScriptsOpen((open) => !open)}
          className="mt-0.5 flex w-full items-center gap-1.5 rounded px-1 py-0.5 text-left text-[11px] font-medium transition-colors hover:bg-muted/60"
        >
          สคริปต์ที่ใช้ได้
          <ChevronDown
            className={cn(
              "ml-auto h-3.5 w-3.5 text-muted-foreground transition-transform",
              scriptsOpen && "rotate-180"
            )}
          />
        </button>
        {scriptsOpen && (
          <div className="mt-1 max-h-52 overflow-y-auto pr-1">
            <DmLeadScripts
              bucket={bucket}
              coverage={coverage}
              lead={leadFromConversation(conversation, {
                lastInbound: lastInboundFromMessages(thread?.dm_messages),
              })}
              onInsert={insertScript}
            />
          </div>
        )}
      </div>

      <DmLeadPublicReplyBar conversation={conversation} thread={thread} />

      <div ref={threadRef} className="min-h-32 flex-1 space-y-2 overflow-y-auto p-3">
        {loading ? (
          <p className="py-8 text-center text-sm text-muted-foreground">Loading…</p>
        ) : !thread || thread.dm_messages.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">No messages.</p>
        ) : (
          thread.dm_messages.map((message) => (
            <DmMessageBubble key={message.id} message={message} />
          ))
        )}
      </div>

      <div className="border-t px-3 py-2">
        {!loading && !messagingWindowOpen && (
          <p className="mb-1.5 rounded border border-amber-500/30 bg-amber-500/10 px-2 py-1 text-[11px] font-medium text-amber-700 dark:text-amber-400">
            ⚠️ เกิน 24 ชม. จากข้อความล่าสุดที่น้องทักมา — Instagram อาจปฏิเสธการส่งข้อความนี้
          </p>
        )}
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
