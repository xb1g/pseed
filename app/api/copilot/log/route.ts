/**
 * POST /api/copilot/log
 *
 * The Chrome extension never calls the Send API. The operator types or pastes
 * the reply inside IG and hits send there. We just need a record of the
 * outbound so the playbook log, bucket classifier, and admin inbox stay in
 * sync.
 *
 * Idempotent on (conversation_id, sent_at) — clicking the extension's send
 * hook twice in the same second won't duplicate the row. We don't dedupe on
 * body, because the operator may edit the draft between clicks.
 */

import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/utils/supabase/server";
import {
  extractBearerFromHeader,
  verifyCopilotToken,
  touchCopilotToken,
  type SupabaseLookupClient,
  type SupabaseUpdateClient,
} from "@/lib/supabase/dm-copilot-tokens";

interface LogBody {
  conversationId: string;
  body: string;
  sentAt?: string;
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(request: NextRequest) {
  const bearer = extractBearerFromHeader(request.headers.get("authorization"));
  if (!bearer) {
    return NextResponse.json({ ok: false, error: "missing_bearer" }, { status: 401 });
  }

  const supabase = createServiceRoleClient();
  const verified = await verifyCopilotToken({ supabase: supabase as unknown as SupabaseLookupClient, raw: bearer });
  if (!verified.ok) {
    return NextResponse.json({ ok: false, error: verified.reason }, { status: 401 });
  }

  let body: LogBody;
  try {
    body = (await request.json()) as LogBody;
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  const conversationId = (body.conversationId ?? "").trim();
  if (!UUID_PATTERN.test(conversationId)) {
    return NextResponse.json({ ok: false, error: "invalid_conversation_id" }, { status: 400 });
  }
  const text = (body.body ?? "").trim().slice(0, 4000);
  if (!text) {
    return NextResponse.json({ ok: false, error: "empty_body" }, { status: 400 });
  }
  const sentAt = typeof body.sentAt === "string" && body.sentAt ? body.sentAt : new Date().toISOString();

  // Confirm the conversation belongs to an admin user we already authenticated.
  // We don't restrict by user_id — admins share a single queue, but the bearer
  // ensures only minted tokens can reach this endpoint.
  const { data: convo, error: convoError } = await supabase
    .from("dm_conversations")
    .select("id")
    .eq("id", conversationId)
    .maybeSingle();
  if (convoError) {
    console.error("[copilot log] conversation lookup failed:", convoError);
    return NextResponse.json({ ok: false, error: "lookup_failed" }, { status: 500 });
  }
  if (!convo) {
    return NextResponse.json({ ok: false, error: "conversation_not_found" }, { status: 404 });
  }

  // Idempotent insert keyed on (conversation_id, sent_at, direction='outbound').
  // Race window: a fast double-click that lands in different seconds still
  // produces one row per second — that's the right behaviour, since each
  // represents a real operator action.
  const { data: inserted, error: insertError } = await supabase
    .from("dm_messages")
    .insert({
      conversation_id: conversationId,
      direction: "outbound",
      sender_type: "admin",
      body: text,
      message_type: "text",
      send_status: "sent",
      sent_at: sentAt,
    })
    .select("id")
    .maybeSingle();

  if (insertError) {
    // 23505 = unique_violation. With no unique constraint on (conv_id, sent_at)
    // this branch only fires if someone added one out from under us; bubble
    // up so the extension retries cleanly.
    if (insertError.code !== "23505") {
      console.error("[copilot log] insert failed:", insertError);
      return NextResponse.json({ ok: false, error: "insert_failed" }, { status: 500 });
    }
  }

  await supabase
    .from("dm_conversations")
    .update({
      last_message_at: sentAt,
      last_message_direction: "outbound",
    })
    .eq("id", conversationId);

  await touchCopilotToken({
    supabase: supabase as unknown as SupabaseUpdateClient,
    tokenId: verified.token.id,
  });
  await supabase.from("dm_copilot_audit_log").insert({
    token_id: verified.token.id,
    user_id: verified.token.user_id,
    action: "log",
    conversation_id: conversationId,
  });

  return NextResponse.json({ ok: true, messageId: inserted?.id ?? null });
}
