import type { SupabaseClient } from "@supabase/supabase-js";

export interface InternalTrialAccess {
  id: string;
  status: "active" | "pending" | "paid" | "expired";
  seedId: string;
  seedTitle: string;
}

/**
 * Server-only pay-token lookup. The service client is required because trial
 * identity is deliberately absent from the anonymous get_trial_by_token RPC.
 */
export async function resolveTrialAccessByToken(
  serviceClient: SupabaseClient,
  token: string
): Promise<InternalTrialAccess | null> {
  const { data, error } = await serviceClient
    .from("trial_accesses")
    .select("id, status, seed_id, seed:seeds!inner(title)")
    .eq("pay_token", token)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const seedValue = data.seed as unknown;
  const seed = Array.isArray(seedValue) ? seedValue[0] : seedValue;
  const seedTitle =
    seed && typeof seed === "object" && "title" in seed
      ? (seed as { title?: unknown }).title
      : null;
  if (
    typeof data.id !== "string" ||
    typeof data.seed_id !== "string" ||
    typeof seedTitle !== "string" ||
    !["active", "pending", "paid", "expired"].includes(data.status)
  ) {
    return null;
  }
  return {
    id: data.id,
    status: data.status as InternalTrialAccess["status"],
    seedId: data.seed_id,
    seedTitle,
  };
}
