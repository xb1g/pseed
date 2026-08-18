"use client";

import { useRef, useState } from "react";
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
  const [running, setRunning] = useState(false);
  const [runs, setRuns] = useState(0);
  /**
   * Read inside the loop between passes, so Stop takes effect after the run in
   * flight rather than abandoning replies mid-batch. State alone would be stale
   * inside the closure.
   */
  const stopRequested = useRef(false);

  if (comments.length === 0) return null;

  const batchSize = Math.min(comments.length, BULK_REPLY_BATCH_CAP);

  /**
   * One pass is capped so it finishes inside the platform's 60s function limit,
   * so a queue larger than the cap needs several passes. Chaining them here
   * keeps every request short while still draining the queue in one click.
   *
   * The loop trusts `skipped`, the count the action could not reach this pass,
   * rather than a local guess at what is left. Successes are marked as replied
   * before the next pass queries again, so the queue shrinks; failures are not,
   * so a pass that sends nothing means only unsendable work is left and
   * repeating it would spin. It stops on any of: nothing left, no progress,
   * Stop pressed, or MAX_PASSES as a backstop against an unforeseen loop.
   */
  const MAX_PASSES = 60;

  const send = async () => {
    setRunning(true);
    setConfirming(false);
    stopRequested.current = false;
    const totals: BulkReplyResult = { sent: 0, failed: 0, skipped: 0, errors: [] };
    let passes = 0;

    try {
      for (;;) {
        const pass = await replyToAllMissedComments();
        passes += 1;
        totals.sent += pass.sent;
        totals.failed += pass.failed;
        totals.skipped = pass.skipped;
        totals.errors.push(...pass.errors);
        setResult({ ...totals, errors: [...totals.errors] });
        setRuns(passes);

        const madeProgress = pass.sent > 0;
        if (pass.skipped === 0 || !madeProgress || stopRequested.current) break;
        if (passes >= MAX_PASSES) break;
      }
    } finally {
      setRunning(false);
      router.refresh();
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Missed by DM — {comments.length} unreplied</CardTitle>
        <CardDescription>
          These commenters have no DM thread (Instagram blocked the automated DM), so we can
          only reach them with a public reply. This exact message goes to each, {batchSize} at
          a time until the queue is empty:
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
            {result.skipped > 0 && `, ${result.skipped} still queued`}
            {runs > 1 && ` · ${runs} runs`}
            {running && " · running…"}.
            {result.errors.length > 0 && (
              <span className="block text-xs text-destructive">
                {result.errors.slice(0, 5).join(" · ")}
                {result.errors.length > 5 && ` · +${result.errors.length - 5} more`}
              </span>
            )}
          </p>
        )}

        {running ? (
          <div className="flex items-center gap-2">
            <Button disabled>
              Replying… {result ? `${result.sent} sent` : ""}
            </Button>
            <Button variant="outline" onClick={() => (stopRequested.current = true)}>
              Stop after this batch
            </Button>
          </div>
        ) : confirming ? (
          <div className="flex items-center gap-2">
            <Button onClick={send}>
              Confirm — reply publicly to all {comments.length}
            </Button>
            <Button variant="outline" onClick={() => setConfirming(false)}>
              Cancel
            </Button>
          </div>
        ) : (
          <Button variant="outline" onClick={() => setConfirming(true)}>
            Reply publicly to all {comments.length}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
