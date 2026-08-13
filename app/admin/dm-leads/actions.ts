"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin/requireAdmin";
import { sendAdminReply } from "@/lib/supabase/dm-leads";

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
  return { ok: true, error: null };
}
