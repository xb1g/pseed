import { NextResponse } from "next/server";
import { requireUser, safeServerError } from "@/lib/security/route-guards";
import { purgeAndDeleteAccount } from "@/lib/account/purge-user-data";

export async function DELETE() {
  const guard = await requireUser();
  if (!guard.ok) return guard.response;

  try {
    const { userId } = guard.value;
    await purgeAndDeleteAccount(userId);
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error("[Delete Account] Exception:", error);
    return safeServerError("Failed to delete account", error);
  }
}
