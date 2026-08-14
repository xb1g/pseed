import { listInstagramConversations, getConversationMessages, listInstagramMedia, getMediaComments } from "@/lib/meta/graph";
import { recordBackfilledMessage, applyClassification } from "@/lib/supabase/dm-leads";
import { upsertComment, applyCommentClassification } from "@/lib/supabase/ig-comments";
import { classifyConversationText } from "@/lib/meta/classify";
import { createAdminClient } from "@/utils/supabase/admin";

function isRateLimited(error: unknown): boolean {
  return error instanceof Error && /"code":4\b/.test(error.message);
}

export interface BackfillBatchResult {
  processed: number;
  remaining: number;
  stoppedReason: "deadline" | "rate_limited" | "done";
}

/**
 * Processes DM conversations not yet in our DB, stopping at `deadlineMs` or
 * on the first rate-limit hit. Stateless across invocations — "already done"
 * is derived straight from dm_conversations, not a local checkpoint file, so
 * a cron running this every N minutes just naturally resumes where the last
 * run left off (and rides out Meta's rate limit between ticks for free).
 */
export async function runDmConversationBackfillBatch(deadlineMs: number): Promise<BackfillBatchResult> {
  const igUserId = process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID;
  if (!igUserId) throw new Error("Missing INSTAGRAM_BUSINESS_ACCOUNT_ID env var");

  const supabase = createAdminClient();
  const conversations = await listInstagramConversations(igUserId);

  const { data: existing } = await supabase
    .from("dm_conversations")
    .select("platform_user_id")
    .eq("platform", "instagram");
  const doneParticipantIds = new Set((existing ?? []).map((r) => r.platform_user_id));

  const pending = conversations.filter((convo) => {
    const participant = convo.participants?.data.find((p) => p.id !== igUserId);
    return participant && !doneParticipantIds.has(participant.id);
  });

  let processed = 0;
  for (const convo of pending) {
    if (Date.now() >= deadlineMs) {
      return { processed, remaining: pending.length - processed, stoppedReason: "deadline" };
    }

    const participant = convo.participants!.data.find((p) => p.id !== igUserId)!;

    try {
      const messages = await getConversationMessages(convo.id);

      let conversationId: string | null = null;
      const inboundBodies: string[] = [];
      for (const msg of messages) {
        if (!msg.message) continue;

        const direction = msg.from?.id === igUserId ? "outbound" : "inbound";
        conversationId = await recordBackfilledMessage({
          platform: "instagram",
          platformThreadId: participant.id,
          platformUserId: participant.id,
          username: participant.username ?? null,
          direction,
          body: msg.message,
          platformMessageId: msg.id,
          sentAt: msg.created_time,
        });
        if (direction === "inbound") inboundBodies.push(msg.message);
      }

      if (conversationId && inboundBodies.length > 0) {
        const classification = classifyConversationText(inboundBodies);
        await applyClassification(conversationId, classification);
      }

      processed += 1;
    } catch (error) {
      if (isRateLimited(error)) {
        return { processed, remaining: pending.length - processed, stoppedReason: "rate_limited" };
      }
      console.error("DM backfill skipped one conversation", {
        errorCode: "conversation_backfill_failed",
      });
    }
  }

  return { processed, remaining: 0, stoppedReason: "done" };
}

/** Same idea as runDmConversationBackfillBatch, for post comments instead of DMs. */
export async function runIgCommentsBackfillBatch(deadlineMs: number): Promise<BackfillBatchResult> {
  const igUserId = process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID;
  if (!igUserId) throw new Error("Missing INSTAGRAM_BUSINESS_ACCOUNT_ID env var");

  const media = await listInstagramMedia(igUserId);

  let processed = 0;
  for (const item of media) {
    if (Date.now() >= deadlineMs) {
      return { processed, remaining: media.length - processed, stoppedReason: "deadline" };
    }

    try {
      const comments = await getMediaComments(item.id);
      for (const comment of comments) {
        if (!comment.text) continue;

        try {
          const stored = await upsertComment({
            igCommentId: comment.id,
            mediaId: item.id,
            parentCommentId: comment.parent_id ?? null,
            username: comment.from?.username ?? comment.username ?? null,
            igUserId: comment.from?.id ?? null,
            text: comment.text,
            commentedAt: comment.timestamp,
          });
          const classification = classifyConversationText([stored.text]);
          await applyCommentClassification(stored.id, classification);
        } catch (_error) {
          console.error("Comments backfill skipped one comment", {
            errorCode: "comment_backfill_failed",
          });
        }
      }
      processed += 1;
    } catch (error) {
      if (isRateLimited(error)) {
        return { processed, remaining: media.length - processed, stoppedReason: "rate_limited" };
      }
      console.error("Comments backfill skipped one media item", {
        errorCode: "media_comments_backfill_failed",
      });
    }
  }

  return { processed, remaining: 0, stoppedReason: "done" };
}
