import { createHash } from "node:crypto";
import type { DmPlatform } from "@/types/dm-leads";

type UnknownRecord = Record<string, unknown>;

export type MetaWebhookEventKind =
  | "message.text"
  | "message.attachment"
  | "message.quick_reply"
  | "message.echo"
  | "message.reaction"
  | "messaging.postback"
  | "messaging.delivery"
  | "messaging.read"
  | "messaging.referral"
  | "messaging.optin"
  | "messaging.account_linking"
  | "messaging.standby"
  | "comment.created_or_updated"
  | "change.unsupported"
  | "event.unknown";

export interface NormalizedAttachment {
  type: string;
  url: string | null;
  title: string | null;
  payload: UnknownRecord;
}

interface MetaEventBase {
  kind: MetaWebhookEventKind;
  platform: DmPlatform | null;
  senderId: string | null;
  recipientId: string | null;
  occurredAt: string | null;
  sourceEventId: string | null;
  dedupeKey: string;
  raw: UnknownRecord;
  metadata: UnknownRecord;
}

export interface NormalizedMessageEvent extends MetaEventBase {
  kind: "message.text" | "message.attachment" | "message.quick_reply" | "message.echo";
  messageId: string | null;
  text: string | null;
  attachments: NormalizedAttachment[];
  quickReplyPayload: string | null;
  isEcho: boolean;
}

export interface NormalizedReactionEvent extends MetaEventBase {
  kind: "message.reaction";
  targetMessageId: string;
  action: "react" | "unreact";
  reaction: string | null;
}

export interface NormalizedPostbackEvent extends MetaEventBase {
  kind: "messaging.postback";
  title: string | null;
  payload: string | null;
}

export interface NormalizedDeliveryEvent extends MetaEventBase {
  kind: "messaging.delivery";
  messageIds: string[];
  watermark: string | null;
}

export interface NormalizedReadEvent extends MetaEventBase {
  kind: "messaging.read";
  watermark: string | null;
}

export interface NormalizedCommentEvent extends MetaEventBase {
  kind: "comment.created_or_updated";
  commentId: string;
  text: string;
  mediaId: string;
  parentCommentId: string | null;
  username: string | null;
  platformUserId: string | null;
}

export interface NormalizedIgnoredEvent extends MetaEventBase {
  kind:
    | "messaging.referral"
    | "messaging.optin"
    | "messaging.account_linking"
    | "messaging.standby"
    | "change.unsupported"
    | "event.unknown";
  reason: string;
}

export type NormalizedMetaEvent =
  | NormalizedMessageEvent
  | NormalizedReactionEvent
  | NormalizedPostbackEvent
  | NormalizedDeliveryEvent
  | NormalizedReadEvent
  | NormalizedCommentEvent
  | NormalizedIgnoredEvent;

export interface ParsedMetaWebhook {
  objectType: string;
  entryCount: number;
  events: NormalizedMetaEvent[];
}

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function stringValue(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function numberValue(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function eventTime(value: unknown): string | null {
  const numeric = numberValue(value);
  const timestamp = numeric === null
    ? typeof value === "string" && value.trim() !== ""
      ? Number(value)
      : null
    : numeric;
  const date = timestamp !== null && Number.isFinite(timestamp)
    ? new Date(timestamp < 1_000_000_000_000 ? timestamp * 1000 : timestamp)
    : typeof value === "string"
      ? new Date(value)
      : null;
  if (!date) return null;
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function stableValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stableValue);
  if (!isRecord(value)) return value;
  return Object.fromEntries(
    Object.keys(value)
      .sort()
      .map((key) => [key, stableValue(value[key])])
  );
}

export function hashMetaValue(value: unknown): string {
  return createHash("sha256").update(JSON.stringify(stableValue(value))).digest("hex");
}

function platformForObject(objectType: string): DmPlatform | null {
  if (objectType === "instagram") return "instagram";
  if (objectType === "page" || objectType === "facebook") return "facebook";
  return null;
}

function endpointId(value: unknown): string | null {
  return isRecord(value) ? stringValue(value.id) : null;
}

function normalizedAttachments(value: unknown): NormalizedAttachment[] {
  if (!Array.isArray(value)) return [];

  return value.filter(isRecord).map((attachment) => {
    const payload = isRecord(attachment.payload) ? attachment.payload : {};
    return {
      type: stringValue(attachment.type) ?? "unknown",
      url: stringValue(payload.url),
      title: stringValue(attachment.title) ?? stringValue(payload.title),
      payload,
    };
  });
}

function messageEvent(
  raw: UnknownRecord,
  platform: DmPlatform | null
): NormalizedMessageEvent | null {
  if (!isRecord(raw.message)) return null;

  const message = raw.message;
  const messageId = stringValue(message.mid);
  const text = stringValue(message.text);
  const attachments = normalizedAttachments(message.attachments);
  const quickReplyPayload = isRecord(message.quick_reply)
    ? stringValue(message.quick_reply.payload)
    : null;
  const isEcho = message.is_echo === true;

  let kind: NormalizedMessageEvent["kind"];
  if (isEcho) kind = "message.echo";
  else if (quickReplyPayload) kind = "message.quick_reply";
  else if (text) kind = "message.text";
  else if (attachments.length > 0) kind = "message.attachment";
  else return null;

  const senderId = endpointId(raw.sender);
  const occurredAt = eventTime(raw.timestamp);
  return {
    kind,
    platform,
    senderId,
    recipientId: endpointId(raw.recipient),
    occurredAt,
    sourceEventId: messageId,
    dedupeKey: messageId
      ? `message:${platform ?? "unknown"}:${messageId}`
      : `message-hash:${hashMetaValue(raw)}`,
    raw,
    metadata: {
      attachment_types: attachments.map((attachment) => attachment.type),
      has_text: Boolean(text),
      has_quick_reply: Boolean(quickReplyPayload),
      is_echo: isEcho,
    },
    messageId,
    text,
    attachments,
    quickReplyPayload,
    isEcho,
  };
}

function reactionEvent(
  raw: UnknownRecord,
  platform: DmPlatform | null
): NormalizedReactionEvent | null {
  const reaction = isRecord(raw.reaction)
    ? raw.reaction
    : isRecord(raw.message) && isRecord(raw.message.reaction)
      ? raw.message.reaction
      : null;
  if (!reaction) return null;

  const targetMessageId = stringValue(reaction.mid) ?? stringValue(reaction.message_id);
  if (!targetMessageId) return null;
  const rawAction = stringValue(reaction.action);
  const action: "react" | "unreact" = rawAction === "unreact" || rawAction === "remove"
    ? "unreact"
    : "react";
  const senderId = endpointId(raw.sender);

  return {
    kind: "message.reaction",
    platform,
    senderId,
    recipientId: endpointId(raw.recipient),
    occurredAt: eventTime(raw.timestamp),
    sourceEventId: targetMessageId,
    dedupeKey: `reaction:${platform ?? "unknown"}:${targetMessageId}:${senderId ?? "unknown"}:${action}:${stringValue(reaction.reaction) ?? stringValue(reaction.emoji) ?? "none"}`,
    raw,
    metadata: { action },
    targetMessageId,
    action,
    reaction: stringValue(reaction.reaction) ?? stringValue(reaction.emoji),
  };
}

function postbackEvent(
  raw: UnknownRecord,
  platform: DmPlatform | null
): NormalizedPostbackEvent | null {
  if (!isRecord(raw.postback)) return null;
  const postback = raw.postback;
  const senderId = endpointId(raw.sender);
  const occurredAt = eventTime(raw.timestamp);
  return {
    kind: "messaging.postback",
    platform,
    senderId,
    recipientId: endpointId(raw.recipient),
    occurredAt,
    sourceEventId: null,
    dedupeKey: `postback:${hashMetaValue({ senderId, occurredAt, postback })}`,
    raw,
    metadata: {},
    title: stringValue(postback.title),
    payload: stringValue(postback.payload),
  };
}

function deliveryEvent(
  raw: UnknownRecord,
  platform: DmPlatform | null
): NormalizedDeliveryEvent | null {
  if (!isRecord(raw.delivery)) return null;
  const mids = Array.isArray(raw.delivery.mids)
    ? raw.delivery.mids.map(stringValue).filter((value): value is string => Boolean(value))
    : [];
  const watermark = raw.delivery.watermark == null ? null : String(raw.delivery.watermark);
  return {
    kind: "messaging.delivery",
    platform,
    senderId: endpointId(raw.sender),
    recipientId: endpointId(raw.recipient),
    occurredAt: eventTime(raw.timestamp),
    sourceEventId: mids[0] ?? null,
    dedupeKey: `delivery:${hashMetaValue({ mids, watermark, sender: raw.sender })}`,
    raw,
    metadata: { message_count: mids.length, watermark },
    messageIds: mids,
    watermark,
  };
}

function readEvent(
  raw: UnknownRecord,
  platform: DmPlatform | null
): NormalizedReadEvent | null {
  if (!isRecord(raw.read)) return null;
  const watermark = raw.read.watermark == null ? null : String(raw.read.watermark);
  return {
    kind: "messaging.read",
    platform,
    senderId: endpointId(raw.sender),
    recipientId: endpointId(raw.recipient),
    occurredAt: eventTime(raw.timestamp),
    sourceEventId: null,
    dedupeKey: `read:${hashMetaValue({ watermark, sender: raw.sender, recipient: raw.recipient })}`,
    raw,
    metadata: { watermark },
    watermark,
  };
}

function ignoredMessagingEvent(
  raw: UnknownRecord,
  platform: DmPlatform | null
): NormalizedIgnoredEvent {
  const knownIgnored: Array<[string, NormalizedIgnoredEvent["kind"]]> = [
    ["referral", "messaging.referral"],
    ["optin", "messaging.optin"],
    ["account_linking", "messaging.account_linking"],
  ];
  const matched = knownIgnored.find(([key]) => key in raw);
  const kind = matched?.[1] ?? "event.unknown";
  return {
    kind,
    platform,
    senderId: endpointId(raw.sender),
    recipientId: endpointId(raw.recipient),
    occurredAt: eventTime(raw.timestamp),
    sourceEventId: null,
    dedupeKey: `${kind}:${hashMetaValue(raw)}`,
    raw,
    metadata: { keys: Object.keys(raw).sort() },
    reason: matched ? `${matched[0]}_not_transcript_content` : "unsupported_messaging_shape",
  };
}

function normalizeMessaging(raw: UnknownRecord, platform: DmPlatform | null): NormalizedMetaEvent {
  return (
    messageEvent(raw, platform) ??
    reactionEvent(raw, platform) ??
    postbackEvent(raw, platform) ??
    deliveryEvent(raw, platform) ??
    readEvent(raw, platform) ??
    ignoredMessagingEvent(raw, platform)
  );
}

function normalizeCommentChange(
  change: UnknownRecord,
  platform: DmPlatform | null,
  entryTime: unknown
): NormalizedMetaEvent {
  const field = stringValue(change.field);
  const value = isRecord(change.value) ? change.value : {};
  if (field !== "comments") {
    return {
      kind: "change.unsupported",
      platform,
      senderId: null,
      recipientId: null,
      occurredAt: eventTime(entryTime),
      sourceEventId: stringValue(value.id),
      dedupeKey: `change:${field ?? "unknown"}:${hashMetaValue(change)}`,
      raw: change,
      metadata: { field },
      reason: field ? `unsupported_change_field:${field}` : "change_field_missing",
    };
  }

  const commentId = stringValue(value.id);
  const text = stringValue(value.text);
  if (!commentId || text === null) {
    return {
      kind: "event.unknown",
      platform,
      senderId: null,
      recipientId: null,
      occurredAt: eventTime(entryTime),
      sourceEventId: commentId,
      dedupeKey: `comment-invalid:${hashMetaValue(change)}`,
      raw: change,
      metadata: { field },
      reason: "comment_id_or_text_missing",
    };
  }

  const from = isRecord(value.from) ? value.from : {};
  const media = isRecord(value.media) ? value.media : {};
  return {
    kind: "comment.created_or_updated",
    platform,
    senderId: stringValue(from.id),
    recipientId: null,
    occurredAt: eventTime(value.timestamp) ?? eventTime(entryTime),
    sourceEventId: commentId,
    dedupeKey: `comment:${commentId}`,
    raw: change,
    metadata: {},
    commentId,
    text,
    mediaId: stringValue(media.id) ?? "",
    parentCommentId: stringValue(value.parent_id),
    username: stringValue(from.username),
    platformUserId: stringValue(from.id),
  };
}

export function parseMetaWebhook(value: unknown): ParsedMetaWebhook {
  if (!isRecord(value)) throw new Error("Webhook body must be an object");
  const objectType = stringValue(value.object) ?? "unknown";
  const platform = platformForObject(objectType);
  const entries = Array.isArray(value.entry) ? value.entry.filter(isRecord) : [];
  const events: NormalizedMetaEvent[] = [];

  for (const entry of entries) {
    const messaging = Array.isArray(entry.messaging) ? entry.messaging.filter(isRecord) : [];
    for (const event of messaging) events.push(normalizeMessaging(event, platform));

    const standby = Array.isArray(entry.standby) ? entry.standby.filter(isRecord) : [];
    for (const event of standby) {
      events.push({
        ...ignoredMessagingEvent(event, platform),
        kind: "messaging.standby",
        dedupeKey: `standby:${hashMetaValue(event)}`,
        reason: "standby_event_not_transcript_content",
      });
    }

    const changes = Array.isArray(entry.changes) ? entry.changes.filter(isRecord) : [];
    for (const change of changes) {
      events.push(normalizeCommentChange(change, platform, entry.time));
    }
  }

  return { objectType, entryCount: entries.length, events };
}
