import { NextRequest, NextResponse } from "next/server";
import { verifyMetaSignature } from "@/lib/meta/graph";
import { recordInboundMessage, applyClassification, getConversationWithMessages } from "@/lib/supabase/dm-leads";
import { upsertComment, applyCommentClassification } from "@/lib/supabase/ig-comments";
import { classifyConversationText } from "@/lib/meta/classify";
import type { DmPlatform } from "@/types/dm-leads";

/**
 * Meta calls this with hub.mode/hub.verify_token/hub.challenge once, when the
 * webhook URL is saved in the developer console, to prove we control it.
 */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const mode = params.get("hub.mode");
  const token = params.get("hub.verify_token");
  const challenge = params.get("hub.challenge");

  if (mode === "subscribe" && token === process.env.META_VERIFY_TOKEN && challenge) {
    return new NextResponse(challenge, { status: 200 });
  }

  return new NextResponse("Forbidden", { status: 403 });
}

interface MetaMessagingEvent {
  sender: { id: string };
  recipient: { id: string };
  timestamp: number;
  message?: { mid: string; text?: string; is_echo?: boolean };
}

interface MetaCommentChange {
  field: string;
  value: {
    id: string;
    text: string;
    media?: { id: string };
    from?: { id: string; username?: string };
    parent_id?: string;
  };
}

interface MetaWebhookBody {
  object: string;
  entry: {
    id: string;
    time?: number;
    messaging?: MetaMessagingEvent[];
    changes?: MetaCommentChange[];
  }[];
}

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-hub-signature-256");

  if (!verifyMetaSignature(rawBody, signature)) {
    return new NextResponse("Invalid signature", { status: 401 });
  }

  const body = JSON.parse(rawBody) as MetaWebhookBody;
  const platform: DmPlatform = body.object === "instagram" ? "instagram" : "facebook";

  for (const entry of body.entry ?? []) {
    for (const event of entry.messaging ?? []) {
      if (!event.message || event.message.is_echo || !event.message.text) continue;

      const conversation = await recordInboundMessage({
        platform,
        platformThreadId: event.sender.id,
        platformUserId: event.sender.id,
        body: event.message.text,
        platformMessageId: event.message.mid,
        sentAt: new Date(event.timestamp).toISOString(),
      });

      const withMessages = await getConversationWithMessages(conversation.id);
      const inboundText = (withMessages?.dm_messages ?? [])
        .filter((m) => m.direction === "inbound")
        .map((m) => m.body);

      const classification = classifyConversationText(inboundText);
      await applyClassification(conversation.id, classification);
    }

    for (const change of entry.changes ?? []) {
      if (change.field !== "comments") continue;

      const comment = await upsertComment({
        igCommentId: change.value.id,
        mediaId: change.value.media?.id ?? "",
        parentCommentId: change.value.parent_id ?? null,
        username: change.value.from?.username ?? null,
        igUserId: change.value.from?.id ?? null,
        text: change.value.text,
        commentedAt: new Date().toISOString(),
      });

      const classification = classifyConversationText([comment.text]);
      await applyCommentClassification(comment.id, classification);
    }
  }

  return new NextResponse("EVENT_RECEIVED", { status: 200 });
}
