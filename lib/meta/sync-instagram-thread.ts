import {
  findInstagramConversationForUser,
  getConversationMessages,
  getInstagramProfile,
  listInstagramConversations,
  type GraphConversationSummary,
  type GraphDmAttachment,
} from "@/lib/meta/graph";
import { classifyConversationText } from "@/lib/meta/classify";
import {
  applyClassification,
  recordBackfilledMessage,
  type InboundAttachmentInput,
} from "@/lib/supabase/dm-leads";

export interface InstagramThreadTarget {
  graphConversationId: string;
  participantId: string;
  username: string | null;
}

export interface InstagramThreadSyncResult {
  conversationId: string | null;
  username: string | null;
  messagesFetched: number;
  messagesImported: number;
  duplicatesSkipped: number;
  latestMessageAt: string | null;
}

function normalizedUsername(value: string | null | undefined): string | null {
  const normalized = value?.trim().replace(/^@+/, "").trim().toLowerCase();
  return normalized || null;
}

export function graphAttachmentsToInputs(
  attachments: GraphDmAttachment[]
): InboundAttachmentInput[] {
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

export function graphMessageBody(
  message: string | undefined,
  attachments: InboundAttachmentInput[]
): string {
  if (message?.trim()) return message.trim();
  if (attachments.some((attachment) => attachment.type === "image")) return "[Image]";
  return attachments.length > 0 ? "[Attachment]" : "";
}

function participantFor(
  conversation: GraphConversationSummary,
  businessAccountId: string
): { id: string; username?: string } | undefined {
  return conversation.participants?.data.find(
    (participant) => participant.id !== businessAccountId
  );
}

/**
 * Resolves the open Instagram thread against authoritative Graph participants.
 * Participant ID wins when the lead already exists; username supports a new
 * lead that has not reached dm_conversations yet.
 */
export async function findInstagramThreadTarget(params: {
  businessAccountId: string;
  participantId?: string | null;
  username?: string | null;
}): Promise<InstagramThreadTarget | null> {
  const requestedUsername = normalizedUsername(params.username);

  if (params.participantId) {
    const graphConversationId = await findInstagramConversationForUser(
      params.businessAccountId,
      params.participantId
    );
    if (graphConversationId) {
      return {
        graphConversationId,
        participantId: params.participantId,
        username: requestedUsername,
      };
    }
  }

  if (!requestedUsername) return null;

  const conversations = await listInstagramConversations(params.businessAccountId);

  for (const conversation of conversations) {
    const participant = participantFor(conversation, params.businessAccountId);
    if (!participant) continue;

    if (normalizedUsername(participant.username) !== requestedUsername) continue;

    return {
      graphConversationId: conversation.id,
      participantId: participant.id,
      username: participant.username ?? requestedUsername,
    };
  }

  return null;
}

/** Imports one Graph thread into the canonical DM tables without sending. */
export async function syncInstagramThread(params: {
  businessAccountId: string;
  target: InstagramThreadTarget;
  fallbackDisplayName?: string | null;
}): Promise<InstagramThreadSyncResult> {
  const [profile, messages] = await Promise.all([
    getInstagramProfile(params.target.participantId),
    getConversationMessages(params.target.graphConversationId),
  ]);

  let conversationId: string | null = null;
  let messagesImported = 0;
  let duplicatesSkipped = 0;
  let latestMessageAt: string | null = null;
  const inboundBodies: string[] = [];

  for (const message of messages) {
    const attachments = graphAttachmentsToInputs(message.attachments?.data ?? []);
    const body = graphMessageBody(message.message, attachments);
    if (!body) continue;

    const direction = message.from?.id === params.businessAccountId ? "outbound" : "inbound";
    const stored = await recordBackfilledMessage({
      platform: "instagram",
      platformThreadId: params.target.participantId,
      platformUserId: params.target.participantId,
      username: profile.username ?? params.target.username,
      displayName: profile.displayName ?? params.fallbackDisplayName,
      direction,
      body,
      platformMessageId: message.id,
      sentAt: message.created_time,
      messageType: attachments.length > 0 ? "attachment" : "text",
      attachments,
    });

    conversationId = stored.conversationId;
    latestMessageAt = message.created_time;
    if (stored.outcome === "created") messagesImported += 1;
    else duplicatesSkipped += 1;
    if (direction === "inbound") inboundBodies.push(body);
  }

  if (conversationId && inboundBodies.length > 0) {
    await applyClassification(conversationId, classifyConversationText(inboundBodies));
  }

  return {
    conversationId,
    username: profile.username ?? params.target.username,
    messagesFetched: messages.length,
    messagesImported,
    duplicatesSkipped,
    latestMessageAt,
  };
}
