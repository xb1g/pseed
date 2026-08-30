/**
 * POST /api/copilot/backfill
 *
 * The extension identifies the open Instagram thread; this route fetches the
 * authoritative Graph API history and imports it into the canonical DM tables.
 * Scraped DOM message bodies are never accepted as database input.
 */
import { NextRequest, NextResponse } from "next/server";
import { MetaGraphApiError } from "@/lib/meta/graph";
import {
  findInstagramThreadTarget,
  syncInstagramThread,
} from "@/lib/meta/sync-instagram-thread";
import { invalidateDmLeadCache } from "@/lib/supabase/dm-leads";
import {
  extractBearerFromHeader,
  touchCopilotToken,
  verifyCopilotToken,
  type SupabaseLookupClient,
  type SupabaseUpdateClient,
} from "@/lib/supabase/dm-copilot-tokens";
import { createServiceRoleClient } from "@/utils/supabase/server";

export const maxDuration = 60;

interface BackfillBody {
  conversationId?: string | null;
  username?: string | null;
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function rejection(reason: string, status = 401) {
  console.warn(`[copilot backfill] rejected: ${reason}`);
  return NextResponse.json({ ok: false, error: reason }, { status });
}

function normalizedUsername(value: string | null | undefined): string | null {
  const normalized = value?.trim().replace(/^@+/, "").trim().toLowerCase();
  return normalized || null;
}

function metaFailure(error: MetaGraphApiError) {
  if (error.isRateLimited) return rejection("meta_rate_limited", 429);
  if (error.isTokenExpired) return rejection("meta_token_expired", 503);
  console.error("[copilot backfill] Meta Graph request failed", {
    statusCode: error.statusCode,
    code: error.code,
  });
  return NextResponse.json({ ok: false, error: "meta_request_failed" }, { status: 502 });
}

export async function POST(request: NextRequest) {
  const bearer = extractBearerFromHeader(request.headers.get("authorization"));
  if (!bearer) return rejection("missing_bearer");

  const supabase = createServiceRoleClient();
  const verified = await verifyCopilotToken({
    supabase: supabase as unknown as SupabaseLookupClient,
    raw: bearer,
  });
  if (!verified.ok) return rejection(verified.reason);

  let parsedBody: unknown;
  try {
    parsedBody = await request.json();
  } catch {
    return rejection("invalid_json", 400);
  }

  if (!parsedBody || typeof parsedBody !== "object" || Array.isArray(parsedBody)) {
    return rejection("invalid_body", 400);
  }
  const body = parsedBody as BackfillBody;
  if (
    (body.conversationId != null && typeof body.conversationId !== "string") ||
    (body.username != null && typeof body.username !== "string")
  ) {
    return rejection("invalid_thread_identity", 400);
  }

  const requestedConversationId = body.conversationId?.trim() || null;
  const requestedUsername = normalizedUsername(body.username);
  if (!requestedConversationId && !requestedUsername) {
    return rejection("missing_thread_identity", 400);
  }
  if (requestedConversationId && !UUID_PATTERN.test(requestedConversationId)) {
    return rejection("invalid_conversation_id", 400);
  }

  let participantId: string | null = null;
  let fallbackDisplayName: string | null = null;
  let storedUsername: string | null = null;

  if (requestedConversationId) {
    const { data: conversation, error } = await supabase
      .from("dm_conversations")
      .select("platform, platform_user_id, username, display_name")
      .eq("id", requestedConversationId)
      .maybeSingle();
    if (error) {
      console.error("[copilot backfill] conversation lookup failed", { code: error.code });
      return NextResponse.json({ ok: false, error: "lookup_failed" }, { status: 500 });
    }
    if (!conversation) return rejection("conversation_not_found", 404);
    if (conversation.platform !== "instagram") return rejection("unsupported_platform", 400);

    participantId = conversation.platform_user_id;
    storedUsername = conversation.username;
    fallbackDisplayName = conversation.display_name;
  }

  const businessAccountId = process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID;
  if (!businessAccountId || !process.env.META_PAGE_ACCESS_TOKEN) {
    return rejection("meta_not_configured", 503);
  }

  try {
    const target = await findInstagramThreadTarget({
      businessAccountId,
      participantId,
      username: storedUsername ?? requestedUsername,
    });
    if (!target) return rejection("instagram_thread_not_found", 404);

    const result = await syncInstagramThread({
      businessAccountId,
      target,
      fallbackDisplayName,
    });
    if (!result.conversationId) return rejection("thread_has_no_importable_messages", 422);

    await touchCopilotToken({
      supabase: supabase as unknown as SupabaseUpdateClient,
      tokenId: verified.token.id,
    });
    const { error: auditError } = await supabase.from("dm_copilot_audit_log").insert({
      token_id: verified.token.id,
      user_id: verified.token.user_id,
      action: "backfill",
      conversation_id: result.conversationId,
      remote_ip: request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || null,
      user_agent: request.headers.get("user-agent"),
    });
    if (auditError) {
      console.warn("[copilot backfill] audit insert failed", { code: auditError.code });
    }

    invalidateDmLeadCache();
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    if (error instanceof MetaGraphApiError) return metaFailure(error);
    console.error("[copilot backfill] sync failed", {
      error: error instanceof Error ? error.message : "unknown",
    });
    return NextResponse.json({ ok: false, error: "backfill_failed" }, { status: 500 });
  }
}
