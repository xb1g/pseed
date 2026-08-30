/**
 * Refreshes all Instagram DM conversation history from the Graph API.
 *
 * This is intentionally import-only: it never calls a Meta send endpoint.
 * Re-running it is safe because dm_messages.platform_message_id is unique and
 * recordBackfilledMessage reports duplicate rows without inserting them.
 *
 * Run: pnpm backfill:dm-conversations
 */
import {
  getConversationMessages,
  getInstagramProfile,
  listInstagramConversations,
  type GraphConversationSummary,
  type GraphDmAttachment,
} from "../lib/meta/graph";
import {
  applyClassification,
  recordBackfilledMessage,
  type InboundAttachmentInput,
} from "../lib/supabase/dm-leads";
import { classifyConversationText } from "../lib/meta/classify";
import { createAdminClient } from "../utils/supabase/admin";
import { sleep, withRetry } from "./lib/rate-limit-retry";

const IG_USER_ID = process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID;
if (!IG_USER_ID) {
  console.error("Missing INSTAGRAM_BUSINESS_ACCOUNT_ID env var");
  process.exit(1);
}

interface RefreshStats {
  conversationsScanned: number;
  conversationsSucceeded: number;
  conversationsFailed: number;
  messagesFound: number;
  messagesCreated: number;
  duplicatesSkipped: number;
  latestGraphMessageAt: string | null;
}

function normalizeAttachments(attachments: GraphDmAttachment[]): InboundAttachmentInput[] {
  return attachments.map((attachment) => ({
    type: attachment.image_data ? "image" : attachment.video_data ? "video" : "attachment",
    url: attachment.image_data?.url || attachment.file_url || attachment.video_data?.url || null,
    title: attachment.name || (attachment.image_data ? "Image" : "Attachment"),
    payload: {
      mime_type: attachment.mime_type,
      size: attachment.size,
      preview_url: attachment.image_data?.preview_url || attachment.video_data?.preview_url,
    },
  }));
}

function messageBody(message: string | undefined, attachments: InboundAttachmentInput[]): string {
  if (message) return message;
  if (attachments.some((attachment) => attachment.type === "image")) return "[Image]";
  return attachments.length > 0 ? "[Attachment]" : "";
}

function newestTimestamp(current: string | null, candidate: string): string {
  if (!current) return candidate;
  return Date.parse(candidate) > Date.parse(current) ? candidate : current;
}

function sameInstant(left: string | null, right: string | null): boolean {
  if (!left || !right) return left === right;
  return Date.parse(left) === Date.parse(right);
}

async function latestStoredInstagramMessageAt(): Promise<string | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("dm_conversations")
    .select("last_message_at")
    .eq("platform", "instagram")
    .order("last_message_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(`Failed to verify latest Instagram message: ${error.message}`);
  return data?.last_message_at ?? null;
}

async function refreshConversation(conversation: GraphConversationSummary, stats: RefreshStats): Promise<void> {
  const participant = conversation.participants?.data.find((person) => person.id !== IG_USER_ID);
  if (!participant) {
    throw new Error("conversation has no non-business participant");
  }

  const profile = await withRetry(() => getInstagramProfile(participant.id));
  await sleep(300);
  const messages = await withRetry(() => getConversationMessages(conversation.id));
  await sleep(300);

  let conversationId: string | null = null;
  const inboundBodies: string[] = [];

  for (const message of messages) {
    const attachments = normalizeAttachments(message.attachments?.data ?? []);
    const body = messageBody(message.message, attachments);
    if (!body) continue;

    const direction = message.from?.id === IG_USER_ID ? "outbound" : "inbound";
    const stored = await recordBackfilledMessage({
      platform: "instagram",
      platformThreadId: participant.id,
      platformUserId: participant.id,
      username: profile.username ?? participant.username ?? null,
      displayName: profile.displayName ?? undefined,
      direction,
      body,
      platformMessageId: message.id,
      sentAt: message.created_time,
      messageType: attachments.length > 0 ? "attachment" : "text",
      attachments,
    });

    conversationId = stored.conversationId;
    stats.messagesFound += 1;
    stats.latestGraphMessageAt = newestTimestamp(stats.latestGraphMessageAt, message.created_time);
    if (stored.outcome === "created") stats.messagesCreated += 1;
    else stats.duplicatesSkipped += 1;

    if (direction === "inbound") inboundBodies.push(body);
  }

  if (conversationId && inboundBodies.length > 0) {
    await applyClassification(conversationId, classifyConversationText(inboundBodies));
  }

  console.log(
    `  ${conversation.id} (${profile.username ?? participant.username ?? participant.id}): ${messages.length} messages`
  );
}

async function main() {
  const conversations = await withRetry(() => listInstagramConversations(IG_USER_ID!));
  const stats: RefreshStats = {
    conversationsScanned: conversations.length,
    conversationsSucceeded: 0,
    conversationsFailed: 0,
    messagesFound: 0,
    messagesCreated: 0,
    duplicatesSkipped: 0,
    latestGraphMessageAt: null,
  };

  console.log(`Refreshing ${conversations.length} Instagram conversations (import only; no messages will be sent).`);

  for (const conversation of conversations) {
    try {
      await refreshConversation(conversation, stats);
      stats.conversationsSucceeded += 1;
    } catch (error) {
      stats.conversationsFailed += 1;
      console.error(
        `  skipped conversation ${conversation.id}:`,
        error instanceof Error ? error.message : error
      );
    }
  }

  const latestStoredAt = await latestStoredInstagramMessageAt();
  const latestMatches = sameInstant(stats.latestGraphMessageAt, latestStoredAt);

  console.log("DM refresh summary:", {
    ...stats,
    latestStoredAt,
    latestMatches,
    outboundMessagesSent: 0,
  });

  if (stats.conversationsFailed > 0 || !latestMatches) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
