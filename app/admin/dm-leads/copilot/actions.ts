/**
 * Token mint/revoke server actions for /admin/dm-leads/copilot.
 *
 * The raw token is returned to the client exactly once and never persisted;
 * we keep sha256(raw) in `token_hash`. `listCopilotTokens` reads back only the
 * metadata columns the admin UI needs (no hashes).
 */

"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin/requireAdmin";
import {
  generateCopilotToken,
  hashCopilotToken,
  DEFAULT_TOKEN_TTL_DAYS,
  type CopilotTokenRow,
  type MintedToken,
} from "@/lib/supabase/dm-copilot-tokens";

/**
 * Minimum Supabase surface we reach for. Kept structural so the action layer
 * does not have to import the heavy SupabaseClient generic — that generic
 * fights structural typing and obscures intent.
 */
type SupabaseQueryResult<T> = Promise<{ data: T | null; error: unknown | null }>;
interface AdminClient {
  from(table: "dm_copilot_tokens"): {
    insert(row: Record<string, unknown>): {
      select(cols: string): { single(): SupabaseQueryResult<CopilotTokenRow> };
    };
    update(patch: { revoked_at: string }): {
      eq(col: "id", value: string): {
        eq(col: "user_id", value: string): { is(col: "revoked_at", value: null): SupabaseQueryResult<unknown> };
      };
    };
    select(cols: string): {
      eq(col: "user_id", value: string): {
        order(col: "created_at", opts: { ascending: boolean }): SupabaseQueryResult<CopilotTokenRow[]>;
      };
    };
  };
}

async function adminDb(): Promise<{ userId: string; admin: AdminClient }> {
  const user = await requireAdmin();
  const { createAdminClient } = await import("@/utils/supabase/admin");
  return { userId: user.id, admin: createAdminClient() as unknown as AdminClient };
}

function trimName(name: string): string {
  const cleaned = name.trim().slice(0, 80);
  if (!cleaned) throw new Error("ตั้งชื่อ token ก่อน (e.g. 'boon macbook')");
  return cleaned;
}

export async function createCopilotTokenAction(input: {
  name: string;
  ttlDays?: number;
}): Promise<MintedToken> {
  const { userId, admin } = await adminDb();
  const name = trimName(input.name);
  const ttl = Math.max(1, Math.min(input.ttlDays ?? DEFAULT_TOKEN_TTL_DAYS, 365));
  const raw = generateCopilotToken();
  const tokenHash = hashCopilotToken(raw);
  const expiresAt = new Date(Date.now() + ttl * 24 * 60 * 60 * 1000).toISOString();

  const { data, error } = await admin
    .from("dm_copilot_tokens")
    .insert({
      user_id: userId,
      name,
      token_hash: tokenHash,
      expires_at: expiresAt,
    })
    .select("*")
    .single();

  if (error || !data) {
    console.error("[copilot actions] mint failed:", error);
    throw new Error("สร้าง token ไม่สำเร็จ");
  }

  revalidatePath("/admin/dm-leads/copilot");
  return { raw, row: data as CopilotTokenRow };
}

export async function revokeCopilotTokenAction(tokenId: string): Promise<void> {
  const { userId, admin } = await adminDb();
  if (!tokenId) throw new Error("Missing token id");

  const { error } = await admin
    .from("dm_copilot_tokens")
    .update({ revoked_at: new Date().toISOString() })
    .eq("id", tokenId)
    .eq("user_id", userId)
    .is("revoked_at", null);

  if (error) {
    console.error("[copilot actions] revoke failed:", error);
    throw new Error(" revoke token ไม่สำเร็จ");
  }
  revalidatePath("/admin/dm-leads/copilot");
}

export async function listCopilotTokensAction(): Promise<CopilotTokenRow[]> {
  const { userId, admin } = await adminDb();
  const { data, error } = await admin
    .from("dm_copilot_tokens")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[copilot actions] list failed:", error);
    throw new Error("โหลดรายการ token ไม่สำเร็จ");
  }
  return (data ?? []) as CopilotTokenRow[];
}
