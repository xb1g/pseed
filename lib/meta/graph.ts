import crypto from "crypto";
import type { DmPlatform } from "@/types/dm-leads";

const GRAPH_API_VERSION = "v21.0";

// META_PAGE_ACCESS_TOKEN here is an Instagram-Login token (prefix "IGAA"),
// issued via the Instagram API with Instagram Login flow — NOT a Facebook
// Page token (prefix "EAA"). Those two token types are only valid against
// their matching host; an IGAA token against graph.facebook.com fails with
// "Cannot parse access token" (code 190).
const IG_GRAPH_HOST = "https://graph.instagram.com";

/**
 * Verifies Meta's X-Hub-Signature-256 header against the raw request body.
 * Meta signs webhook payloads with the app secret so we can trust the sender.
 */
export function verifyMetaSignature(rawBody: string, signatureHeader: string | null): boolean {
  if (!signatureHeader) return false;

  const appSecret = process.env.META_APP_SECRET;
  if (!appSecret) {
    throw new Error("META_APP_SECRET is not set");
  }

  const [algo, receivedSig] = signatureHeader.split("=");
  if (algo !== "sha256" || !receivedSig) return false;

  const expectedSig = crypto.createHmac("sha256", appSecret).update(rawBody).digest("hex");

  const receivedBuf = Buffer.from(receivedSig, "hex");
  const expectedBuf = Buffer.from(expectedSig, "hex");
  if (receivedBuf.length !== expectedBuf.length) return false;

  return crypto.timingSafeEqual(receivedBuf, expectedBuf);
}

/**
 * Sends a text message to a lead via the Messenger Platform Send API.
 * Same endpoint shape for both Facebook Page and Instagram threads.
 */
export async function sendMetaMessage(
  platform: DmPlatform,
  recipientPsid: string,
  text: string
): Promise<string> {
  const accessToken = process.env.META_PAGE_ACCESS_TOKEN;
  if (!accessToken) {
    throw new Error("META_PAGE_ACCESS_TOKEN is not set");
  }

  const url = `${IG_GRAPH_HOST}/${GRAPH_API_VERSION}/me/messages?access_token=${encodeURIComponent(accessToken)}`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      recipient: { id: recipientPsid },
      message: { text },
      messaging_type: "RESPONSE",
    }),
  });

  if (!res.ok) {
    throw new Error(`Meta Send API failed for ${platform} (${res.status})`);
  }

  const json: { message_id?: string } = await res.json();
  if (!json.message_id) {
    throw new Error(`Meta Send API returned no message_id for ${platform}`);
  }
  return json.message_id;
}

/**
 * Resolves an IGSID (the sender.id in a messaging webhook event, which is
 * NOT a username) to a display username. The messaging webhook payload
 * never includes username — this is the only way to get it.
 */
export async function getInstagramUsername(igsid: string): Promise<string | null> {
  const accessToken = requireAccessToken();

  const res = await fetch(
    `${IG_GRAPH_HOST}/${GRAPH_API_VERSION}/${igsid}?fields=username&access_token=${encodeURIComponent(accessToken)}`
  );

  if (!res.ok) {
    console.error(`Failed to resolve Meta username (${res.status})`);
    return null;
  }

  const json: { username?: string } = await res.json();
  return json.username ?? null;
}

function requireAccessToken(): string {
  const accessToken = process.env.META_PAGE_ACCESS_TOKEN;
  if (!accessToken) {
    throw new Error("META_PAGE_ACCESS_TOKEN is not set");
  }
  return accessToken;
}

export interface GraphMediaSummary {
  id: string;
  caption?: string;
  timestamp: string;
  permalink?: string;
}

export interface GraphComment {
  id: string;
  text: string;
  timestamp: string;
  username?: string;
  from?: { id: string; username?: string };
  parent_id?: string;
}

/**
 * Lists media for an IG business/creator account, newest first, following
 * pagination. Used to backfill comment history since the webhook only sees
 * comments posted after subscription.
 */
export async function listInstagramMedia(igUserId: string): Promise<GraphMediaSummary[]> {
  const accessToken = requireAccessToken();
  const media: GraphMediaSummary[] = [];

  let url: string | null =
    `${IG_GRAPH_HOST}/${GRAPH_API_VERSION}/${igUserId}/media` +
    `?fields=id,caption,timestamp,permalink&limit=50&access_token=${encodeURIComponent(accessToken)}`;

  while (url) {
    const res = await fetch(url);
    if (!res.ok) {
      const errBody = await res.text();
      throw new Error(`Failed to list IG media (${res.status}): ${errBody}`);
    }
    const json: { data: GraphMediaSummary[]; paging?: { next?: string } } = await res.json();
    media.push(...json.data);
    url = json.paging?.next ?? null;
  }

  return media;
}

/**
 * Fetches all top-level comments (and their replies) for a single media item.
 */
export async function getMediaComments(mediaId: string): Promise<GraphComment[]> {
  const accessToken = requireAccessToken();
  const comments: GraphComment[] = [];

  let url: string | null =
    `${IG_GRAPH_HOST}/${GRAPH_API_VERSION}/${mediaId}/comments` +
    `?fields=id,text,timestamp,username,from,replies{id,text,timestamp,username,from}` +
    `&limit=50&access_token=${encodeURIComponent(accessToken)}`;

  while (url) {
    const res = await fetch(url);
    if (!res.ok) {
      const errBody = await res.text();
      throw new Error(`Failed to fetch comments for media ${mediaId} (${res.status}): ${errBody}`);
    }
    const json: {
      data: (GraphComment & { replies?: { data: GraphComment[] } })[];
      paging?: { next?: string };
    } = await res.json();

    for (const comment of json.data) {
      comments.push(comment);
      for (const reply of comment.replies?.data ?? []) {
        comments.push({ ...reply, parent_id: comment.id });
      }
    }

    url = json.paging?.next ?? null;
  }

  return comments;
}

/**
 * Posts a reply to an IG comment. Replying via this endpoint (rather than
 * the Send API) keeps the reply visible on the public thread.
 */
export async function replyToComment(commentId: string, message: string): Promise<void> {
  const accessToken = requireAccessToken();

  const res = await fetch(
    `${IG_GRAPH_HOST}/${GRAPH_API_VERSION}/${commentId}/replies`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, access_token: accessToken }),
    }
  );

  if (!res.ok) {
    const errBody = await res.text();
    throw new Error(`Failed to reply to comment ${commentId} (${res.status}): ${errBody}`);
  }
}

export interface GraphConversationSummary {
  id: string;
  participants?: { data: { id: string; username?: string }[] };
}

export interface GraphDmAttachment {
  id?: string;
  mime_type?: string;
  name?: string;
  size?: number;
  file_url?: string;
  image_data?: { url?: string; preview_url?: string; max_width?: number; max_height?: number };
  video_data?: { url?: string; preview_url?: string };
}

export interface GraphDmMessage {
  id: string;
  message?: string;
  created_time: string;
  from?: { id: string; username?: string };
  attachments?: { data: GraphDmAttachment[] };
}

export class MetaGraphApiError extends Error {
  isRateLimited: boolean;
  isTokenExpired: boolean;
  code?: number;
  statusCode: number;

  constructor(message: string, statusCode: number = 500, isRateLimited: boolean = false, isTokenExpired: boolean = false, code?: number) {
    super(message);
    this.name = "MetaGraphApiError";
    this.statusCode = statusCode;
    this.isRateLimited = isRateLimited;
    this.isTokenExpired = isTokenExpired;
    this.code = code;
  }
}

function parseMetaErrorBody(errBody: string, status: number): MetaGraphApiError {
  try {
    const parsed = JSON.parse(errBody) as { error?: { message?: string; code?: number; error_subcode?: number; type?: string } };
    const err = parsed.error;
    const code = err?.code;
    const message = err?.message || errBody;
    const isRateLimited = code === 4 || code === 17 || code === 32 || code === 613 || status === 429 || /rate limit|request limit/i.test(message);
    const isTokenExpired = code === 190;
    return new MetaGraphApiError(message, status, isRateLimited, isTokenExpired, code);
  } catch {
    const isRateLimited = status === 429 || /rate limit|request limit/i.test(errBody);
    return new MetaGraphApiError(errBody, status, isRateLimited, false);
  }
}

// In-memory cache for participant -> IG Graph conversation ID to eliminate redundant API calls
const userToGraphConvoCache = new Map<string, string>();

/**
 * Lists DM conversations for the IG account. The underlying inbox is shared
 * by whatever sent through it — our webhook, a third-party automation, the
 * app itself — so this is how we see messages we never received a webhook
 * event for (e.g. a Send API call made by another tool on the same account).
 */
export async function listInstagramConversations(igUserId: string): Promise<GraphConversationSummary[]> {
  const accessToken = requireAccessToken();
  const conversations: GraphConversationSummary[] = [];

  let url: string | null =
    `${IG_GRAPH_HOST}/${GRAPH_API_VERSION}/${igUserId}/conversations` +
    `?platform=instagram&fields=participants&limit=50&access_token=${encodeURIComponent(accessToken)}`;

  while (url) {
    const res = await fetch(url);
    if (!res.ok) {
      const errBody = await res.text();
      throw parseMetaErrorBody(errBody, res.status);
    }
    const json: { data: GraphConversationSummary[]; paging?: { next?: string } } = await res.json();
    for (const convo of json.data) {
      conversations.push(convo);
      for (const p of convo.participants?.data ?? []) {
        userToGraphConvoCache.set(p.id, convo.id);
      }
    }
    url = json.paging?.next ?? null;
  }

  return conversations;
}

/**
 * Finds the IG conversation ID corresponding to a given participant ID
 * by searching through recent conversations.
 */
export async function findInstagramConversationForUser(
  igUserId: string,
  targetUserId: string
): Promise<string | null> {
  const cached = userToGraphConvoCache.get(targetUserId);
  if (cached) return cached;

  const accessToken = requireAccessToken();
  let url: string | null =
    `${IG_GRAPH_HOST}/${GRAPH_API_VERSION}/${igUserId}/conversations` +
    `?platform=instagram&fields=participants&limit=50&access_token=${encodeURIComponent(accessToken)}`;

  let pages = 0;
  while (url && pages < 3) {
    pages++;
    const res = await fetch(url);
    if (!res.ok) {
      const errBody = await res.text();
      throw parseMetaErrorBody(errBody, res.status);
    }
    const json: { data: GraphConversationSummary[]; paging?: { next?: string } } = await res.json();
    for (const convo of json.data) {
      for (const p of convo.participants?.data ?? []) {
        userToGraphConvoCache.set(p.id, convo.id);
      }
      const match = convo.participants?.data.some((p) => p.id === targetUserId);
      if (match) return convo.id;
    }
    url = json.paging?.next ?? null;
  }

  return null;
}

/** Fetches full message history for one conversation, oldest first. */
export async function getConversationMessages(conversationId: string): Promise<GraphDmMessage[]> {
  const accessToken = requireAccessToken();
  const messages: GraphDmMessage[] = [];

  let url: string | null =
    `${IG_GRAPH_HOST}/${GRAPH_API_VERSION}/${conversationId}/messages` +
    `?fields=id,message,created_time,from,attachments{id,mime_type,name,size,file_url,image_data,video_data}&limit=50&access_token=${encodeURIComponent(accessToken)}`;

  while (url) {
    const res = await fetch(url);
    if (!res.ok) {
      const errBody = await res.text();
      throw parseMetaErrorBody(errBody, res.status);
    }
    const json: { data: GraphDmMessage[]; paging?: { next?: string } } = await res.json();
    messages.push(...json.data);
    url = json.paging?.next ?? null;
  }

  return messages.reverse();
}

/**
 * Sends a DM triggered by a comment, via the private-reply endpoint. This is
 * the ONLY way to message someone who hasn't DM'd us first — the regular
 * Send API (sendMetaMessage) rejects that with "not opted in" style errors.
 * Only valid within 7 days of the comment, and only once per comment.
 */
export async function privateReplyToComment(commentId: string, message: string): Promise<void> {
  const accessToken = requireAccessToken();

  const res = await fetch(
    `${IG_GRAPH_HOST}/${GRAPH_API_VERSION}/${commentId}/private_replies`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, access_token: accessToken }),
    }
  );

  if (!res.ok) {
    const errBody = await res.text();
    throw new Error(`Failed to private-reply to comment ${commentId} (${res.status}): ${errBody}`);
  }
}
