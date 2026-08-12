import { createAdminClient } from "@/utils/supabase/admin";

function fileNameFromPublicUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    // https://{bucket}.{endpoint}/{key}
    const path = parsed.pathname.replace(/^\//, "");
    return path || null;
  } catch {
    return null;
  }
}

async function wipeUserUploads(userId: string, avatarUrl: string | null) {
  try {
    const { b2 } = await import("@/lib/backblaze");
    const avatarKey = fileNameFromPublicUrl(avatarUrl);
    if (avatarKey) {
      await b2.deleteFile(avatarKey).catch((err) => {
        console.warn("[purge] avatar delete skipped:", err);
      });
    }

    // Avatar + node submissions land under submissions/{userId}/
    await b2.deletePrefix(`submissions/${userId}/`).catch((err) => {
      console.warn("[purge] B2 prefix delete skipped:", err);
    });
  } catch (err) {
    // Missing B2 env in some environments — log, do not block account wipe
    console.warn("[purge] B2 cleanup unavailable:", err);
  }
}

/**
 * Wipe public-schema personal data + uploads, then delete the Auth user.
 * Fails hard if profile purge or auth delete fails.
 */
export async function purgeAndDeleteAccount(userId: string): Promise<void> {
  const admin = createAdminClient();

  const { data: profile } = await admin
    .from("profiles")
    .select("avatar_url")
    .eq("id", userId)
    .maybeSingle();

  await wipeUserUploads(userId, profile?.avatar_url ?? null);

  const { data: purgeResult, error: purgeError } = await admin.rpc(
    "purge_user_account_data",
    { p_user_id: userId }
  );

  if (purgeError) {
    console.error("[purge] purge_user_account_data failed:", purgeError);
    throw new Error(purgeError.message || "Failed to purge account data");
  }

  if (purgeResult && purgeResult.ok === false) {
    throw new Error("Account data purge returned unsuccessful result");
  }

  const { data: leftoverProfile } = await admin
    .from("profiles")
    .select("id")
    .eq("id", userId)
    .maybeSingle();

  if (leftoverProfile) {
    throw new Error("Profile still exists after purge");
  }

  const { error: authError } = await admin.auth.admin.deleteUser(userId);
  if (authError) {
    console.error("[purge] auth.admin.deleteUser failed:", authError);
    throw new Error(authError.message || "Failed to delete auth user");
  }
}
