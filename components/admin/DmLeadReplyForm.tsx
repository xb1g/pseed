"use client";

import { useMemo, useState, useTransition } from "react";
import { Sparkles } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { replyToLead } from "@/app/admin/dm-leads/actions";
import { contextFromConversation, getQuickReplies } from "@/lib/dm-leads/quick-replies";
import type { DmConversation } from "@/types/dm-leads";

const TONE_STYLES: Record<string, string> = {
  cta: "border-emerald-300 bg-emerald-50 hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-950/40 dark:hover:bg-emerald-950/70",
  guide: "border-sky-300 bg-sky-50 hover:bg-sky-100 dark:border-sky-800 dark:bg-sky-950/40 dark:hover:bg-sky-950/70",
  qualify:
    "border-violet-300 bg-violet-50 hover:bg-violet-100 dark:border-violet-800 dark:bg-violet-950/40 dark:hover:bg-violet-950/70",
};

export const DM_REPLY_TEXTAREA_ID = "dm-reply-textarea";

interface DmLeadReplyFormProps {
  conversation: DmConversation;
  /** Controlled body — when provided, onBodyChange must be too. */
  body?: string;
  onBodyChange?: (body: string) => void;
  /** Called after a reply is successfully sent. */
  onSent?: () => void;
  /** When provided, overrides the built-in send handler (e.g. for optimistic UI). */
  onSend?: () => void;
  /** Externally controlled pending state — used together with onSend. */
  isPending?: boolean;
  /** Externally controlled error — used together with onSend. */
  error?: string | null;
}

export function DmLeadReplyForm({
  conversation,
  body: controlledBody,
  onBodyChange,
  onSent,
  onSend,
  isPending: controlledIsPending,
  error: controlledError,
}: DmLeadReplyFormProps) {
  const [internalBody, setInternalBody] = useState("");
  const [internalError, setInternalError] = useState<string | null>(null);
  const [internalIsPending, startTransition] = useTransition();

  const body = controlledBody ?? internalBody;
  const setBody = (value: string) => {
    if (onBodyChange) onBodyChange(value);
    else setInternalBody(value);
  };
  const error = onSend ? controlledError ?? null : internalError;
  const isPending = onSend ? controlledIsPending ?? false : internalIsPending;

  const suggestions = useMemo(
    () => getQuickReplies(contextFromConversation(conversation)),
    [conversation]
  );

  const handleSend = () => {
    if (onSend) {
      onSend();
      return;
    }
    setInternalError(null);
    startTransition(async () => {
      const result = await replyToLead(conversation.id, body);
      if (!result.ok) {
        setInternalError(result.error);
        return;
      }
      setBody("");
      onSent?.();
    });
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="flex items-center gap-1 text-xs text-muted-foreground">
          <Sparkles className="h-3 w-3" /> Quick replies
        </span>
        {suggestions.map((s, i) => (
          <button
            key={s.id}
            type="button"
            title={s.body}
            onClick={() => setBody(s.body)}
            disabled={isPending}
            className={cn(
              "rounded-full border px-2.5 py-1 text-xs font-medium transition-colors disabled:opacity-50",
              TONE_STYLES[s.tone]
            )}
          >
            <span className="mr-1 opacity-50">{i + 1}.</span>
            {s.label}
          </button>
        ))}
      </div>
      <Textarea
        id={DM_REPLY_TEXTAREA_ID}
        value={body}
        onChange={(e) => setBody(e.target.value)}
        onKeyDown={(e) => {
          if ((e.metaKey || e.ctrlKey) && e.key === "Enter" && body.trim() && !isPending) {
            e.preventDefault();
            handleSend();
          }
        }}
        placeholder="Type a reply… (⌘/Ctrl + Enter to send)"
        rows={3}
        disabled={isPending}
      />
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="flex justify-end">
        <Button size="sm" onClick={handleSend} disabled={isPending || !body.trim()}>
          {isPending ? "Sending…" : "Send ⌘↵"}
        </Button>
      </div>
    </div>
  );
}
