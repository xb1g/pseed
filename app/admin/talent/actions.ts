"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/utils/supabase/admin";
import { requireAdmin } from "@/lib/admin/requireAdmin";

/**
 * Flip a signup's `verified` flag. Unverified profiles are hidden by the anon
 * read policy, so this is the gate that puts someone on the public /talent page.
 */
export async function setTalentVerified(id: string, verified: boolean) {
  await requireAdmin();

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("talent_profiles")
    .update({ verified })
    .eq("id", id);

  if (error) {
    console.error("setTalentVerified failed:", error.message);
    return { ok: false, error: "Update failed" };
  }

  revalidatePath("/admin/talent");
  revalidatePath("/talent");
  return { ok: true, error: null };
}
