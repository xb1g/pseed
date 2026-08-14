"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin/requireAdmin";
import { replyToComment, privateReplyToComment } from "@/lib/meta/graph";
import { getCommentsMissedByDm, markCommentReplied } from "@/lib/supabase/ig-comments";
import { getDefaultPublicCommentReply } from "@/lib/dm-leads/delivery-status";
import { createAdminClient } from "@/utils/supabase/admin";

async function getIgCommentId(commentId: string): Promise<string> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("ig_comments")
    .select("ig_comment_id")
    .eq("id", commentId)
    .single();

  if (error || !data) throw new Error("Comment not found");
  return data.ig_comment_id;
}

/** Public reply, visible under the comment on the post. */
export async function replyPublicly(commentId: string, message: string) {
  await requireAdmin();
  if (!message.trim()) return { ok: false, error: "Message is empty" };

  try {
    const igCommentId = await getIgCommentId(commentId);
    await replyToComment(igCommentId, message.trim());
    await markCommentReplied(commentId);
  } catch (error) {
    console.error("replyPublicly failed:", error);
    return { ok: false, error: error instanceof Error ? error.message : "Failed to reply" };
  }

  revalidatePath("/admin/ig-comments");
  return { ok: true, error: null };
}

/**
 * DM triggered by the comment. Works even when the commenter never opened a
 * DM thread with us — that's the whole point — but only within 7 days of the
 * comment and only once per comment.
 */
export async function replyPrivately(commentId: string, message: string) {
  await requireAdmin();
  if (!message.trim()) return { ok: false, error: "Message is empty" };

  try {
    const igCommentId = await getIgCommentId(commentId);
    await privateReplyToComment(igCommentId, message.trim());
    await markCommentReplied(commentId);
  } catch (error) {
    console.error("replyPrivately failed:", error);
    return { ok: false, error: error instanceof Error ? error.message : "Failed to DM" };
  }

  revalidatePath("/admin/ig-comments");
  return { ok: true, error: null };
}

/**
 * Public replies have no 7-day Meta window (that limit is private replies
 * only), so the batch sweeps a 30-day window.
 */
const BULK_REPLY_WINDOW_DAYS = 30;
const BULK_REPLY_BATCH_CAP = 50;
const BULK_REPLY_DELAY_MS = 1000;

export interface BulkReplyResult {
  sent: number;
  failed: number;
  /** Missed comments beyond the batch cap — not attempted this run. */
  skipped: number;
  errors: string[];
}

/**
 * Sends the default "please DM us first" public reply to every comment the DM
 * automation never reached. One failure never aborts the batch — the comment
 * just stays unreplied and shows up again next run.
 */
export async function replyToAllMissedComments(): Promise<BulkReplyResult> {
  await requireAdmin();

  const missed = await getCommentsMissedByDm(BULK_REPLY_WINDOW_DAYS);
  const batch = missed.slice(0, BULK_REPLY_BATCH_CAP);
  const result: BulkReplyResult = {
    sent: 0,
    failed: 0,
    skipped: missed.length - batch.length,
    errors: [],
  };

  for (const comment of batch) {
    const who = comment.username ?? comment.ig_comment_id;
    try {
      await replyToComment(comment.ig_comment_id, getDefaultPublicCommentReply(comment.username));
      await markCommentReplied(comment.id);
      result.sent += 1;
    } catch (error) {
      console.error(`replyToAllMissedComments failed for ${who}:`, error);
      result.failed += 1;
      result.errors.push(`${who}: ${error instanceof Error ? error.message : "unknown error"}`);
    }
    await new Promise((resolve) => setTimeout(resolve, BULK_REPLY_DELAY_MS));
  }

  revalidatePath("/admin/ig-comments");
  return result;
}
