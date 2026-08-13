"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin/requireAdmin";
import { replyToComment, privateReplyToComment } from "@/lib/meta/graph";
import { markCommentReplied } from "@/lib/supabase/ig-comments";
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
