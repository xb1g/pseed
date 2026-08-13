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

export async function getConversationsForAdmin(
  stage?: DmLeadStage
): Promise<DmConversation[]> {
  const supabase = createAdminClient();

  let query = supabase
    .from("dm_conversations")
    .select("*")
    .order("last_message_at", { ascending: false });

  if (stage) {
    query = query.eq("stage", stage);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching dm_conversations:", error);
    throw new Error("Failed to fetch conversations");
  }

  return data ?? [];
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
    .update({ last_message_at: sentAt })
    .eq("id", conversationId);

  const { sendMetaMessage } = await import("@/lib/meta/graph");
  await sendMetaMessage(conversation.platform, conversation.platform_user_id, body);
}
