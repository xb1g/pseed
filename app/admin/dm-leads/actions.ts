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
