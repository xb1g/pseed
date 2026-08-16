/**
 * Loads the AARRR counts.
 *
 * Reads the signals view and a per-thread inbound tally rather than scanning
 * message bodies, so this stays one round trip per stage regardless of inbox
 * size.
 */

import { createAdminClient } from "@/utils/supabase/admin";
import {
  computePirateFunnel,
  type PirateFunnel,
} from "@/lib/dm-leads/pirate-funnel";

const INTERNAL_TAG = "internal";
const PAGE_SIZE = 1000;

async function countSustainedThreads(
  supabase: ReturnType<typeof createAdminClient>,
  engagedIds: Set<string>
): Promise<number> {
  const inboundPerThread = new Map<string, number>();

  for (let offset = 0; ; offset += PAGE_SIZE) {
    const { data, error } = await supabase
      .from("dm_messages")
      .select("conversation_id")
      .eq("direction", "inbound")
      .order("id", { ascending: true })
      .range(offset, offset + PAGE_SIZE - 1);

    if (error) {
      console.error("Error tallying inbound messages:", error);
      throw new Error("Failed to compute retention");
    }
    const page = data ?? [];
    for (const row of page) {
      if (!engagedIds.has(row.conversation_id)) continue;
      inboundPerThread.set(
        row.conversation_id,
        (inboundPerThread.get(row.conversation_id) ?? 0) + 1
      );
    }
    if (page.length < PAGE_SIZE) break;
  }

  let sustained = 0;
  for (const count of inboundPerThread.values()) if (count >= 3) sustained += 1;
  return sustained;
}

export async function getPirateFunnel(): Promise<PirateFunnel> {
  const supabase = createAdminClient();

  const conversations: { id: string; admin_tags: string[] | null }[] = [];
  for (let offset = 0; ; offset += PAGE_SIZE) {
    const { data, error } = await supabase
      .from("dm_conversations")
      .select("id, admin_tags")
      .order("id", { ascending: true })
      .range(offset, offset + PAGE_SIZE - 1);
    if (error) {
      console.error("Error loading conversations for pirate funnel:", error);
      throw new Error("Failed to load funnel");
    }
    const page = data ?? [];
    conversations.push(...page);
    if (page.length < PAGE_SIZE) break;
  }

  const external = conversations.filter(
    (c) => !(c.admin_tags ?? []).includes(INTERNAL_TAG)
  );
  const externalIds = new Set(external.map((c) => c.id));

  const { data: signalRows, error: signalError } = await supabase
    .from("dm_conversation_signals")
    .select("conversation_id, has_inbound");
  if (signalError) {
    console.error("Error loading signals for pirate funnel:", signalError);
    throw new Error("Failed to load funnel");
  }

  const engagedIds = new Set(
    (signalRows ?? [])
      .filter((row) => row.has_inbound && externalIds.has(row.conversation_id))
      .map((row) => row.conversation_id)
  );

  const sustained = await countSustainedThreads(supabase, engagedIds);

  return computePirateFunnel({
    totalConversations: external.length,
    engagedConversations: engagedIds.size,
    sustainedConversations: sustained,
    // There is no conversation_id or campaign attribution on path_enrollments
    // yet. Reporting null keeps "we don't know" distinct from "nobody bought".
    enrollments: null,
    // No referral source is recorded anywhere yet. Reporting null keeps
    // "we don't know" distinct from "nobody referred anyone".
    referrals: null,
  });
}
