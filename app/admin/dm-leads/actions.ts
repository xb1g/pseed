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
    return { ok: false, error: "Failed to send reply" };
  }

  revalidatePath("/admin/dm-leads");
  return { ok: true, error: null };
}
