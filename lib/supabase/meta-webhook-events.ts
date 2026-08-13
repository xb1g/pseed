import { createAdminClient } from "@/utils/supabase/admin";
import type { MetaWebhookEventKind } from "@/lib/meta/webhook-events";

export type MetaWebhookProcessingStatus = "processed" | "duplicate" | "ignored" | "failed";
export type MetaWebhookReceiptStatus = "received" | "processed" | "partial" | "failed";

export interface MetaWebhookEventResult {
  status: MetaWebhookProcessingStatus;
  skipReason?: string | null;
  conversationId?: string | null;
  dmMessageId?: string | null;
  igCommentId?: string | null;
  metadata?: Record<string, unknown>;
  errorCode?: string | null;
}

export interface MetaWebhookReceiptSummary {
  processed: number;
  duplicate: number;
  ignored: number;
  failed: number;
}

export interface MetaWebhookReceiptRow {
  id: string;
  provider_request_id: string | null;
  object_type: string;
  body_sha256: string;
  entry_count: number;
  event_count: number;
  processed_count: number;
  duplicate_count: number;
  ignored_count: number;
  failed_count: number;
  status: MetaWebhookReceiptStatus;
  error_code: string | null;
  received_at: string;
  completed_at: string | null;
}

export interface MetaWebhookEventRow {
  id: string;
  receipt_id: string;
  dedupe_key: string;
  event_kind: MetaWebhookEventKind;
  processing_status: MetaWebhookProcessingStatus;
  skip_reason: string | null;
  source_event_id: string | null;
  conversation_id: string | null;
  dm_message_id: string | null;
  ig_comment_id: string | null;
  occurred_at: string | null;
  payload_metadata: Record<string, unknown>;
  raw_payload: Record<string, unknown> | null;
  created_at: string;
}

export interface MetaWebhookReceiptWithEvents extends MetaWebhookReceiptRow {
  meta_webhook_events: MetaWebhookEventRow[];
}

export async function createMetaWebhookReceipt(params: {
  providerRequestId?: string | null;
  objectType: string;
  bodySha256: string;
  entryCount: number;
  eventCount: number;
}): Promise<string> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("meta_webhook_receipts")
    .insert({
      provider_request_id: params.providerRequestId ?? null,
      object_type: params.objectType,
      body_sha256: params.bodySha256,
      entry_count: params.entryCount,
      event_count: params.eventCount,
    })
    .select("id")
    .single();

  if (error || !data) {
    console.error("Failed to create Meta webhook receipt:", error);
    throw new Error("Failed to persist webhook receipt");
  }
  return data.id;
}

export async function recordMetaWebhookEvent(params: {
  receiptId: string;
  dedupeKey: string;
  eventKind: MetaWebhookEventKind;
  sourceEventId: string | null;
  occurredAt: string | null;
  result: MetaWebhookEventResult;
  safeMetadata: Record<string, unknown>;
  rawPayload?: Record<string, unknown> | null;
}): Promise<void> {
  const supabase = createAdminClient();
  const retainRaw = params.result.status === "failed" || params.eventKind === "event.unknown";
  const { error } = await supabase.from("meta_webhook_events").insert({
    receipt_id: params.receiptId,
    dedupe_key: params.dedupeKey,
    event_kind: params.eventKind,
    processing_status: params.result.status,
    skip_reason: params.result.skipReason ?? params.result.errorCode ?? null,
    source_event_id: params.sourceEventId,
    conversation_id: params.result.conversationId ?? null,
    dm_message_id: params.result.dmMessageId ?? null,
    ig_comment_id: params.result.igCommentId ?? null,
    occurred_at: params.occurredAt,
    payload_metadata: {
      ...params.safeMetadata,
      ...(params.result.metadata ?? {}),
    },
    raw_payload: retainRaw ? (params.rawPayload ?? null) : null,
  });

  if (error) {
    console.error("Failed to record Meta webhook event outcome:", error);
    throw new Error("Failed to persist webhook event outcome");
  }
}

export async function finalizeMetaWebhookReceipt(
  receiptId: string,
  summary: MetaWebhookReceiptSummary,
  errorCode?: string | null
): Promise<MetaWebhookReceiptStatus> {
  const supabase = createAdminClient();
  const status: MetaWebhookReceiptStatus =
    summary.failed === 0
      ? "processed"
      : summary.failed === summary.processed + summary.duplicate + summary.ignored + summary.failed
        ? "failed"
        : "partial";

  const { error } = await supabase
    .from("meta_webhook_receipts")
    .update({
      processed_count: summary.processed,
      duplicate_count: summary.duplicate,
      ignored_count: summary.ignored,
      failed_count: summary.failed,
      status,
      error_code: errorCode ?? null,
      completed_at: new Date().toISOString(),
    })
    .eq("id", receiptId);

  if (error) {
    console.error("Failed to finalize Meta webhook receipt:", error);
    throw new Error("Failed to finalize webhook receipt");
  }
  return status;
}

export async function getRecentMetaWebhookReceipts(
  limit = 100
): Promise<MetaWebhookReceiptWithEvents[]> {
  const supabase = createAdminClient();
  const safeLimit = Math.max(1, Math.min(limit, 250));
  const { data, error } = await supabase
    .from("meta_webhook_receipts")
    .select("*, meta_webhook_events(*)")
    .order("received_at", { ascending: false })
    .order("created_at", { referencedTable: "meta_webhook_events", ascending: true })
    .limit(safeLimit);

  if (error) {
    console.error("Failed to fetch Meta webhook receipts:", error);
    throw new Error("Failed to fetch webhook diagnostics");
  }
  return (data ?? []) as MetaWebhookReceiptWithEvents[];
}
