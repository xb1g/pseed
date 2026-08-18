import { createAdminClient } from "@/utils/supabase/admin";
import { isPortRequest } from "@/lib/meta/comment-intent";
import { isSelfAuthored } from "@/lib/meta/self-account";
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
 * Comments we still owe a reply.
 *
 * Three conditions must hold. The commenter asked for the portfolio by using
 * the reel's keyword: anyone who commented something else never invited a DM,
 * so we leave them alone. The comment is not one of our own replies. And the
 * DM automation never reached them, meaning no dm_conversations row exists for
 * their ig_user_id; had any message landed, inbound or outbound, one would.
 * Absence means the send silently failed (privacy settings, blocked, opted
 * out, "not opted in" window).
 *
 * Only returns comments inside `maxAgeDays`. The 7-day default matches the
 * private-reply window; public replies have no such limit, so the bulk-reply
 * action passes a wider window.
 */
export async function getCommentsMissedByDm(maxAgeDays = 7): Promise<IgComment[]> {
  const supabase = createAdminClient();

  const cutoff = new Date(Date.now() - maxAgeDays * 24 * 60 * 60 * 1000).toISOString();

  const { data: comments, error } = await supabase
    .from("ig_comments")
    .select("*")
    .gte("commented_at", cutoff)
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
  return comments.filter(
    (c) =>
      c.ig_user_id &&
      !reachedIds.has(c.ig_user_id) &&
      // Our own replies are only kept out of this list by us happening to have
      // a dm_conversations row; excluding them explicitly means a reply can
      // never be addressed to ourselves.
      !isSelfAuthored({ igUserId: c.ig_user_id, username: c.username }) &&
      // Only people who commented the reel's keyword asked to hear from us.
      isPortRequest(c.text)
  );
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

export async function getLatestCommentForUser(params: {
  igUserId?: string | null;
  username?: string | null;
}): Promise<IgComment | null> {
  const supabase = createAdminClient();

  let query = supabase
    .from("ig_comments")
    .select("*")
    .order("commented_at", { ascending: false })
    .limit(1);

  if (params.igUserId && params.username) {
    query = query.or(`ig_user_id.eq.${params.igUserId},username.eq.${params.username}`);
  } else if (params.igUserId) {
    query = query.eq("ig_user_id", params.igUserId);
  } else if (params.username) {
    query = query.eq("username", params.username);
  } else {
    return null;
  }

  const { data, error } = await query.maybeSingle();
  if (error) {
    console.error("Error fetching latest comment for user:", error);
    return null;
  }

  return data ?? null;
}

