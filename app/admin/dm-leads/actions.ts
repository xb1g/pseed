"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin/requireAdmin";
import {
  sendAdminReply,
  getConversationWithMessages,
  updateLeadMeta,
} from "@/lib/supabase/dm-leads";
import type { DmLeadStatus } from "@/types/dm-leads";

export async function replyToLead(conversationId: string, body: string) {
  await requireAdmin();

  if (!body.trim()) {
    return { ok: false, error: "Message is empty" };
  }

  try {
    await sendAdminReply(conversationId, body.trim());
  } catch (error) {
    console.error("replyToLead failed:", error);
    const message = error instanceof Error ? error.message : "Failed to send reply";
    return { ok: false, error: message };
  }

  revalidatePath("/admin/dm-leads");
  revalidatePath(`/admin/dm-leads/${conversationId}`);
  return { ok: true, error: null };
}

export async function getThread(conversationId: string) {
  await requireAdmin();
  return getConversationWithMessages(conversationId);
}

export type LeadMetaPatch = Partial<{
  starred: boolean;
  follow_up_at: string | null;
  lead_status: DmLeadStatus;
  admin_tags: string[];
}>;

export async function updateLead(conversationId: string, patch: LeadMetaPatch) {
  await requireAdmin();

  try {
    await updateLeadMeta(conversationId, patch);
  } catch (error) {
    console.error("updateLead failed:", error);
    return { ok: false, error: "Failed to update lead" };
  }

  revalidatePath("/admin/dm-leads");
  return { ok: true, error: null };
}

export async function generatePlanDraftAction(req: {
  studentName: string;
  gradeLevel: string;
  targetField: string;
  interests?: string[];
  conversationId?: string;
  readinessScore?: number;
}) {
  await requireAdmin();
  const { generateDraftPlan } = await import("@/lib/plans/generator");
  return generateDraftPlan(req);
}

export async function saveStudentPlanAction(input: import("@/types/student-plan").CreateStudentPlanInput) {
  await requireAdmin();
  try {
    const { createStudentPlan } = await import("@/lib/supabase/student-plans");
    const plan = await createStudentPlan(input);
    revalidatePath(`/admin/dm-leads/${input.conversation_id}`);
    return { ok: true, plan, error: null };
  } catch (error) {
    console.error("saveStudentPlanAction failed:", error);
    const message = error instanceof Error ? error.message : "Failed to save plan";
    return { ok: false, plan: null, error: message };
  }
}

export async function getLeadCommentInfo(conversationId: string) {
  await requireAdmin();
  const { createAdminClient } = await import("@/utils/supabase/admin");
  const supabase = createAdminClient();
  const { data: conversation } = await supabase
    .from("dm_conversations")
    .select("platform_user_id, username")
    .eq("id", conversationId)
    .single();

  if (!conversation) return null;
  const { getLatestCommentForUser } = await import("@/lib/supabase/ig-comments");
  const comment = await getLatestCommentForUser({
    igUserId: conversation.platform_user_id,
    username: conversation.username,
  });
  return comment;
}

export async function replyPubliclyToLeadComment(commentId: string, message: string) {
  await requireAdmin();
  const { replyPublicly } = await import("@/app/admin/ig-comments/actions");
  return replyPublicly(commentId, message);
}

