import { createAdminClient } from "@/utils/supabase/admin";
import type {
  DmConversation,
  DmConversationWithMessages,
  DmLeadClassification,
  DmLeadStage,
  DmMessageDirection,
  DmMessageSenderType,
  DmPlatform,
} from "@/types/dm-leads";

/**
 * Upserts the conversation for an inbound DM and appends the message.
 * Called from the Meta webhook, which has no authenticated user, so this
 * always runs through the service-role client.
 */
export async function recordInboundMessage(params: {
  platform: DmPlatform;
  platformThreadId: string;
  platformUserId: string;
  username?: string | null;
  displayName?: string | null;
  body: string;
  platformMessageId?: string | null;
  sentAt: string;
}): Promise<DmConversation> {
  const supabase = createAdminClient();

  const { data: conversation, error: conversationError } = await supabase
    .from("dm_conversations")
    .upsert(
      {
        platform: params.platform,
        platform_thread_id: params.platformThreadId,
        platform_user_id: params.platformUserId,
        username: params.username ?? null,
        display_name: params.displayName ?? null,
        last_message_at: params.sentAt,
        last_message_direction: "inbound",
      },
      { onConflict: "platform,platform_thread_id", ignoreDuplicates: false }
    )
    .select()
    .single();

  if (conversationError) {
    console.error("Error upserting dm_conversation:", conversationError);
    throw new Error("Failed to record conversation");
  }

  const { error: messageError } = await supabase.from("dm_messages").insert({
    conversation_id: conversation.id,
    direction: "inbound" as DmMessageDirection,
    sender_type: "lead" as DmMessageSenderType,
    body: params.body,
    platform_message_id: params.platformMessageId ?? null,
    sent_at: params.sentAt,
  });

  if (messageError) {
    console.error("Error inserting inbound dm_message:", messageError);
    throw new Error("Failed to record message");
  }

  return conversation;
}

/**
 * Upserts a conversation + message pulled from Graph API history, not the
 * webhook. Dedupes on platform_message_id so re-running backfill is safe.
 */
export async function recordBackfilledMessage(params: {
  platform: DmPlatform;
  platformThreadId: string;
  platformUserId: string;
  username?: string | null;
  direction: DmMessageDirection;
  body: string;
  platformMessageId: string;
  sentAt: string;
}): Promise<string> {
  const supabase = createAdminClient();

  const { data: conversation, error: conversationError } = await supabase
    .from("dm_conversations")
    .upsert(
      {
        platform: params.platform,
        platform_thread_id: params.platformThreadId,
        platform_user_id: params.platformUserId,
        username: params.username ?? null,
        last_message_at: params.sentAt,
        last_message_direction: params.direction,
      },
      { onConflict: "platform,platform_thread_id", ignoreDuplicates: false }
    )
    .select()
    .single();

  if (conversationError) {
    console.error("Error upserting dm_conversation (backfill):", conversationError);
    throw new Error("Failed to record conversation");
  }

  const { error: messageError } = await supabase.from("dm_messages").upsert(
    {
      conversation_id: conversation.id,
      direction: params.direction,
      sender_type: params.direction === "inbound" ? "lead" : "admin",
      body: params.body,
      platform_message_id: params.platformMessageId,
      sent_at: params.sentAt,
    },
    { onConflict: "platform_message_id", ignoreDuplicates: true }
  );

  if (messageError) {
    console.error("Error upserting dm_message (backfill):", messageError);
    throw new Error("Failed to record message");
  }

  return conversation.id;
}

export async function updateConversationUsername(
  conversationId: string,
  username: string
): Promise<void> {
  const supabase = createAdminClient();

  const { error } = await supabase
    .from("dm_conversations")
    .update({ username })
    .eq("id", conversationId);

  if (error) {
    console.error("Error updating dm_conversation username:", error);
    throw new Error("Failed to update username");
  }
}

export type DmLeadIntentFilter =
  | "pay_ready"
  | "pathlab"
  | "community"
  | "talent"
  | "hands_on";

export interface DmLeadFilters {
  stage?: DmLeadStage;
  /** Grade label ("ม.4", "ปี 1", …) or "none" for unclassified. */
  grade?: string;
  platform?: DmPlatform;
  intent?: DmLeadIntentFilter;
  myTurnOnly?: boolean;
  /** Case-insensitive match on username / display name. */
  search?: string;
  /** "newest" (default) or "waiting" (oldest unanswered first). */
  sort?: "newest" | "waiting";
  /** Only conversations where we already sent a /pathlab link (outbound). */
  pathlabLinkSent?: boolean;
}

const INTENT_COLUMN: Record<DmLeadIntentFilter, string> = {
  pay_ready: "pathlab_pay_ready",
  pathlab: "wants_pathlab",
  community: "wants_community",
  talent: "wants_talent",
  hands_on: "has_hands_on_experience",
};

function escapeIlike(term: string): string {
  return term.replace(/[%_,()"]/g, " ").trim();
}

/** Shared filter application so list + facet counts stay in sync. */
function applyDmLeadFilters<T>(
  query: T,
  filters: DmLeadFilters,
  { skipStage = false }: { skipStage?: boolean } = {}
): T {
  let q = query as {
    eq: (col: string, val: unknown) => typeof q;
    is: (col: string, val: unknown) => typeof q;
    or: (expr: string) => typeof q;
  };

  if (filters.stage && !skipStage) q = q.eq("stage", filters.stage);
  if (filters.grade) {
    q = filters.grade === "none" ? q.is("grade_level", null) : q.eq("grade_level", filters.grade);
  }
  if (filters.platform) q = q.eq("platform", filters.platform);
  if (filters.intent) q = q.eq(INTENT_COLUMN[filters.intent], true);
  if (filters.myTurnOnly) q = q.eq("last_message_direction", "inbound");
  if (filters.search) {
    const term = escapeIlike(filters.search);
    if (term) q = q.or(`username.ilike.%${term}%,display_name.ilike.%${term}%`);
  }

  return q as unknown as T;
}

/**
 * Conversation IDs where any outbound message contains a /pathlab link.
 * Detected from message history, so it works for backfilled threads too.
 */
async function getPathlabLinkConversationIds(
  supabase: ReturnType<typeof createAdminClient>
): Promise<Set<string>> {
  const { data, error } = await supabase
    .from("dm_messages")
    .select("conversation_id")
    .eq("direction", "outbound")
    .ilike("body", "%/pathlab%");

  if (error) {
    console.error("Error fetching pathlab-link messages:", error);
    throw new Error("Failed to check sent PathLab links");
  }

  return new Set((data ?? []).map((m) => m.conversation_id));
}

export async function getConversationsForAdmin(
  filters: DmLeadFilters = {}
): Promise<DmConversation[]> {
  const supabase = createAdminClient();

  let query = supabase.from("dm_conversations").select("*");
  query = applyDmLeadFilters(query, filters);
  if (filters.pathlabLinkSent) {
    const ids = await getPathlabLinkConversationIds(supabase);
    if (ids.size === 0) return [];
    query = query.in("id", [...ids]);
  }
  query = query.order("last_message_at", {
    ascending: filters.sort === "waiting",
  });

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching dm_conversations:", error);
    throw new Error("Failed to fetch conversations");
  }

  return data ?? [];
}

export interface DmLeadFacets {
  /** Stage counts respect every active filter except the stage filter itself. */
  stageCounts: Record<DmLeadStage, number>;
  total: number;
  needsReply: number;
  payReady: number;
  /** Conversations we already sent a /pathlab link to. */
  pathlabSent: number;
}

const EMPTY_FACETS: DmLeadFacets = {
  stageCounts: { unknown: 0, exploring: 0, building: 0, job_seeking: 0 },
  total: 0,
  needsReply: 0,
  payReady: 0,
  pathlabSent: 0,
};

export async function getDmLeadFacets(filters: DmLeadFilters = {}): Promise<DmLeadFacets> {
  const supabase = createAdminClient();

  const pathlabIds = await getPathlabLinkConversationIds(supabase);

  let query = supabase
    .from("dm_conversations")
    .select("id, stage, last_message_direction, pathlab_pay_ready");
  query = applyDmLeadFilters(query, filters, { skipStage: true });
  if (filters.pathlabLinkSent) {
    if (pathlabIds.size === 0) return EMPTY_FACETS;
    query = query.in("id", [...pathlabIds]);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching dm_conversation facets:", error);
    throw new Error("Failed to fetch conversation facets");
  }

  const rows = data ?? [];
  const stageCounts: Record<DmLeadStage, number> = {
    unknown: 0,
    exploring: 0,
    building: 0,
    job_seeking: 0,
  };
  let needsReply = 0;
  let payReady = 0;
  let pathlabSent = 0;

  for (const row of rows) {
    if (row.stage in stageCounts) stageCounts[row.stage as DmLeadStage] += 1;
    if (row.last_message_direction === "inbound") needsReply += 1;
    if (row.pathlab_pay_ready) payReady += 1;
    if (pathlabIds.has(row.id)) pathlabSent += 1;
  }

  return { stageCounts, total: rows.length, needsReply, payReady, pathlabSent };
}

export async function getConversationWithMessages(
  conversationId: string
): Promise<DmConversationWithMessages | null> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("dm_conversations")
    .select("*, dm_messages(*)")
    .eq("id", conversationId)
    .order("sent_at", { referencedTable: "dm_messages", ascending: true })
    .single();

  if (error) {
    if (error.code === "PGRST116") return null;
    console.error("Error fetching dm_conversation:", error);
    throw new Error("Failed to fetch conversation");
  }

  return data;
}

export async function applyClassification(
  conversationId: string,
  classification: DmLeadClassification
): Promise<void> {
  const supabase = createAdminClient();

  const { error } = await supabase
    .from("dm_conversations")
    .update({
      grade_level: classification.gradeLevel,
      interests: classification.interests,
      activities_summary: classification.activitiesSummary,
      stage: classification.stage,
      recommended_product: classification.recommendedProduct,
      has_hands_on_experience: classification.hasHandsOnExperience,
      wants_pathlab: classification.wantsPathlab,
      pathlab_pay_ready: classification.pathlabPayReady,
      wants_community: classification.wantsCommunity,
      wants_talent: classification.wantsTalent,
      classified_at: new Date().toISOString(),
    })
    .eq("id", conversationId);

  if (error) {
    console.error("Error applying dm lead classification:", error);
    throw new Error("Failed to save classification");
  }
}

/**
 * Records an admin-sent reply and pushes it to the lead via the Send API.
 * Insert-then-send: if the Send API call fails, the outbound message row is
 * still there so the admin UI shows it was attempted, not silently dropped.
 */
export async function sendAdminReply(
  conversationId: string,
  body: string
): Promise<void> {
  const supabase = createAdminClient();

  const { data: conversation, error: fetchError } = await supabase
    .from("dm_conversations")
    .select("platform, platform_user_id")
    .eq("id", conversationId)
    .single();

  if (fetchError || !conversation) {
    console.error("Error fetching conversation for reply:", fetchError);
    throw new Error("Conversation not found");
  }

  const sentAt = new Date().toISOString();
  const { error: insertError } = await supabase.from("dm_messages").insert({
    conversation_id: conversationId,
    direction: "outbound" as DmMessageDirection,
    sender_type: "admin" as DmMessageSenderType,
    body,
    sent_at: sentAt,
  });

  if (insertError) {
    console.error("Error inserting outbound dm_message:", insertError);
    throw new Error("Failed to record reply");
  }

  await supabase
    .from("dm_conversations")
    .update({ last_message_at: sentAt, last_message_direction: "outbound" })
    .eq("id", conversationId);

  const { sendMetaMessage } = await import("@/lib/meta/graph");
  await sendMetaMessage(conversation.platform, conversation.platform_user_id, body);
}
