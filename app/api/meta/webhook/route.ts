import { createHash } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { verifyMetaSignature } from "@/lib/meta/graph";
import { parseMetaWebhook } from "@/lib/meta/webhook-events";
import { processMetaWebhookEvent } from "@/lib/meta/process-webhook-event";
import {
  createMetaWebhookReceipt,
  finalizeMetaWebhookReceipt,
  recordMetaWebhookEvent,
  type MetaWebhookEventResult,
  type MetaWebhookReceiptSummary,
} from "@/lib/supabase/meta-webhook-events";

/** Meta uses this challenge once when the webhook URL is configured. */
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

function requestId(request: NextRequest): string | null {
  return request.headers.get("x-request-id") ?? request.headers.get("x-vercel-id");
}

function emptySummary(): MetaWebhookReceiptSummary {
  return { processed: 0, duplicate: 0, ignored: 0, failed: 0 };
}

function countResult(summary: MetaWebhookReceiptSummary, result: MetaWebhookEventResult): void {
  summary[result.status] += 1;
}

/**
 * Signature-valid deliveries are normalized, processed idempotently, and then
 * given a durable receipt. Returning 500 on any failed event asks Meta to retry;
 * message IDs and event-specific dedupe keys keep those retries safe.
 */
export async function POST(request: NextRequest) {
  const startedAt = Date.now();
  const rawBody = await request.text();
  const signature = request.headers.get("x-hub-signature-256");

  if (!verifyMetaSignature(rawBody, signature)) {
    return new NextResponse("Invalid signature", { status: 401 });
  }

  let value: unknown;
  try {
    value = JSON.parse(rawBody);
  } catch {
    return new NextResponse("Invalid JSON", { status: 400 });
  }

  let parsed;
  try {
    parsed = parseMetaWebhook(value);
  } catch {
    return new NextResponse("Invalid webhook payload", { status: 400 });
  }

  const receiptId = await createMetaWebhookReceipt({
    providerRequestId: requestId(request),
    objectType: parsed.objectType,
    bodySha256: createHash("sha256").update(rawBody).digest("hex"),
    entryCount: parsed.entryCount,
    eventCount: parsed.events.length,
  });
  const summary = emptySummary();

  for (const event of parsed.events) {
    let result: MetaWebhookEventResult;
    try {
      result = await processMetaWebhookEvent(event);
    } catch (error) {
      console.error("Meta webhook event processing failed:", {
        receiptId,
        eventKind: event.kind,
        error: error instanceof Error ? error.message : "unknown",
      });
      result = {
        status: "failed",
        errorCode: "event_processing_failed",
      };
    }

    await recordMetaWebhookEvent({
      receiptId,
      dedupeKey: event.dedupeKey,
      eventKind: event.kind,
      sourceEventId: event.sourceEventId,
      occurredAt: event.occurredAt,
      result,
      safeMetadata: event.metadata,
      rawPayload: event.raw,
    });
    countResult(summary, result);
  }

  const status = await finalizeMetaWebhookReceipt(
    receiptId,
    summary,
    summary.failed > 0 ? "event_processing_failed" : null
  );
  console.info("Meta webhook receipt completed", {
    receiptId,
    status,
    eventCount: parsed.events.length,
    ...summary,
    durationMs: Date.now() - startedAt,
  });

  if (summary.failed > 0) {
    return NextResponse.json({ receiptId, status }, { status: 500 });
  }
  return NextResponse.json({ receiptId, status: "EVENT_RECEIVED" }, { status: 200 });
}
