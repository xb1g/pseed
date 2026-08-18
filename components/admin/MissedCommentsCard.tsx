"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { replyToAllMissedComments, type BulkReplyResult } from "@/app/admin/ig-comments/actions";
import { BULK_REPLY_BATCH_CAP } from "@/app/admin/ig-comments/constants";

export interface MissedCommentItem {
  id: string;
  username: string | null;
  text: string;
  commented_at: string;
}

function daysAgo(iso: string): number {
  return Math.floor((Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60 * 24));
}

export function MissedCommentsCard({
  comments,
  messagePreview,
}: {
  comments: MissedCommentItem[];
  /** The exact default message, rendered with a sample @mention. */
  messagePreview: string;
}) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [result, setResult] = useState<BulkReplyResult | null>(null);
  const [isPending, startTransition] = useTransition();

  if (comments.length === 0) return null;

  const batchSize = Math.min(comments.length, BULK_REPLY_BATCH_CAP);

  const send = () => {
    startTransition(async () => {
      const replyResult = await replyToAllMissedComments();
      setResult(replyResult);
      setConfirming(false);
      router.refresh();
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Missed by DM — {comments.length} unreplied</CardTitle>
        <CardDescription>
          These commenters have no DM thread (Instagram blocked the automated DM), so we can
          only reach them with a public reply. The batch sends this exact message to each,
          up to 50 per run:
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="rounded-md border bg-muted/40 p-3 text-sm whitespace-pre-wrap">
          {messagePreview}
        </p>

        <ul className="divide-y rounded-md border text-sm">
          {comments.map((comment) => (
            <li key={comment.id} className="flex items-baseline justify-between gap-3 px-3 py-2">
              <span className="font-medium shrink-0">
                {comment.username ?? "—"}
              </span>
              <span className="flex-1 truncate text-muted-foreground">{comment.text}</span>
              <span className="shrink-0 text-xs text-muted-foreground">
                {daysAgo(comment.commented_at)}d ago
              </span>
            </li>
          ))}
        </ul>

        {result && (
          <p className="text-sm">
            Sent {result.sent}, failed {result.failed}
            {result.skipped > 0 && `, skipped ${result.skipped} (over batch cap)`}.
            {result.errors.length > 0 && (
              <span className="block text-xs text-destructive">
                {result.errors.slice(0, 5).join(" · ")}
                {result.errors.length > 5 && ` · +${result.errors.length - 5} more`}
              </span>
            )}
          </p>
        )}

        {confirming ? (
          <div className="flex items-center gap-2">
            <Button onClick={send} disabled={isPending}>
              {isPending ? "Replying…" : `Confirm — reply publicly to ${batchSize}`}
            </Button>
            <Button variant="outline" onClick={() => setConfirming(false)} disabled={isPending}>
              Cancel
            </Button>
          </div>
        ) : (
          <Button
            variant="outline"
            onClick={() => setConfirming(true)}
            disabled={isPending}
          >
            Reply publicly to all {batchSize}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
