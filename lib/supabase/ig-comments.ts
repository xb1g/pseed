import { createAdminClient } from "@/utils/supabase/admin";
import type { DmLeadClassification, IgComment } from "@/types/dm-leads";

export async function upsertComment(params: {
  igCommentId: string;
  mediaId: string;
  parentCommentId?: string | null;
  username?: string | null;
  igUserId?: string | null;
  text: string;
  commentedAt: string;
}): Promise<IgComment> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("ig_comments")
    .upsert(
      {
        ig_comment_id: params.igCommentId,
        media_id: params.mediaId,
        parent_comment_id: params.parentCommentId ?? null,
        username: params.username ?? null,
        ig_user_id: params.igUserId ?? null,
        text: params.text,
        commented_at: params.commentedAt,
      },
      { onConflict: "ig_comment_id", ignoreDuplicates: false }
    )
    .select()
    .single();

  if (error) {
    console.error("Error upserting ig_comment:", error);
    throw new Error("Failed to record comment");
  }

  return data;
}

export async function getCommentsForAdmin(stage?: string): Promise<IgComment[]> {
  const supabase = createAdminClient();

  let query = supabase
    .from("ig_comments")
    .select("*")
    .order("commented_at", { ascending: false });

  if (stage) {
    query = query.eq("stage", stage);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching ig_comments:", error);
    throw new Error("Failed to fetch comments");
  }

  return data ?? [];
}

export async function applyCommentClassification(
  commentId: string,
  classification: DmLeadClassification
): Promise<void> {
  const supabase = createAdminClient();

  const { error } = await supabase
    .from("ig_comments")
    .update({
      grade_level: classification.gradeLevel,
      stage: classification.stage,
      recommended_product: classification.recommendedProduct,
      has_hands_on_experience: classification.hasHandsOnExperience,
      wants_pathlab: classification.wantsPathlab,
      pathlab_pay_ready: classification.pathlabPayReady,
      wants_community: classification.wantsCommunity,
      wants_talent: classification.wantsTalent,
      classified_at: new Date().toISOString(),
    })
    .eq("id", commentId);

  if (error) {
    console.error("Error applying ig comment classification:", error);
    throw new Error("Failed to save classification");
  }
}

/**
 * Comments from people the DM automation never reached: no dm_conversations
 * row exists for their ig_user_id at all. If it did, some message — inbound
 * or outbound — would have created one. Absence means the automation's send
 * silently failed (opted out, blocked, "not opted in" window, etc).
 * Only returns comments still inside the 7-day private-reply window.
 */
export async function getCommentsMissedByDm(): Promise<IgComment[]> {
  const supabase = createAdminClient();

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const { data: comments, error } = await supabase
    .from("ig_comments")
    .select("*")
    .gte("commented_at", sevenDaysAgo)
    .is("replied_at", null)
    .not("ig_user_id", "is", null)
    .order("commented_at", { ascending: false });

  if (error) {
    console.error("Error fetching ig_comments for dm gap check:", error);
    throw new Error("Failed to fetch comments");
  }
  if (!comments || comments.length === 0) return [];

  const igUserIds = [...new Set(comments.map((c) => c.ig_user_id).filter(Boolean))];

  const { data: matched, error: convError } = await supabase
    .from("dm_conversations")
    .select("platform_user_id")
    .eq("platform", "instagram")
    .in("platform_user_id", igUserIds);

  if (convError) {
    console.error("Error checking dm_conversations for gap check:", convError);
    throw new Error("Failed to cross-check conversations");
  }

  const reachedIds = new Set((matched ?? []).map((m) => m.platform_user_id));
  return comments.filter((c) => c.ig_user_id && !reachedIds.has(c.ig_user_id));
}

export async function markCommentReplied(commentId: string): Promise<void> {
  const supabase = createAdminClient();

  const { error } = await supabase
    .from("ig_comments")
    .update({ replied_at: new Date().toISOString() })
    .eq("id", commentId);

  if (error) {
    console.error("Error marking comment replied:", error);
    throw new Error("Failed to update comment");
  }
}
