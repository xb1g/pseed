/** @jest-environment node */

import type { NextRequest } from "next/server";
import { POST } from "@/app/api/meta/webhook/route";
import { verifyMetaSignature } from "@/lib/meta/graph";
import { processMetaWebhookEvent } from "@/lib/meta/process-webhook-event";
import {
  createMetaWebhookReceipt,
  finalizeMetaWebhookReceipt,
  recordMetaWebhookEvent,
} from "@/lib/supabase/meta-webhook-events";

jest.mock("@/lib/meta/graph", () => ({
  verifyMetaSignature: jest.fn(),
}));
jest.mock("@/lib/meta/process-webhook-event", () => ({
  processMetaWebhookEvent: jest.fn(),
}));
jest.mock("@/lib/supabase/meta-webhook-events", () => ({
  createMetaWebhookReceipt: jest.fn(),
  finalizeMetaWebhookReceipt: jest.fn(),
  recordMetaWebhookEvent: jest.fn(),
}));

const mockedVerify = jest.mocked(verifyMetaSignature);
const mockedProcess = jest.mocked(processMetaWebhookEvent);
const mockedCreateReceipt = jest.mocked(createMetaWebhookReceipt);
const mockedFinalize = jest.mocked(finalizeMetaWebhookReceipt);
const mockedRecordEvent = jest.mocked(recordMetaWebhookEvent);

function requestFor(body: unknown): NextRequest {
  const raw = JSON.stringify(body);
  return {
    text: jest.fn().mockResolvedValue(raw),
    headers: new Headers({
      "x-hub-signature-256": "sha256=valid",
      "x-request-id": "request-proof-1",
    }),
  } as unknown as NextRequest;
}

const attachmentPayload = {
  object: "instagram",
  entry: [
    {
      messaging: [
        {
          sender: { id: "lead-1" },
          recipient: { id: "page-1" },
          timestamp: 1_786_636_634_000,
          message: {
            mid: "message-proof-1",
            attachments: [{ type: "image", payload: { url: "https://example.com/proof.jpg" } }],
          },
        },
      ],
    },
  ],
};

describe("POST /api/meta/webhook", () => {
  beforeEach(() => {
    mockedVerify.mockReturnValue(true);
    mockedCreateReceipt.mockResolvedValue("receipt-proof-1");
    mockedProcess.mockResolvedValue({ status: "processed", dmMessageId: "dm-proof-1" });
    mockedRecordEvent.mockResolvedValue();
    mockedFinalize.mockResolvedValue("processed");
  });

  it("rejects invalid signatures without writing a receipt", async () => {
    mockedVerify.mockReturnValue(false);

    const response = await POST(requestFor(attachmentPayload));

    expect(response.status).toBe(401);
    expect(mockedCreateReceipt).not.toHaveBeenCalled();
  });

  it("records an explicit processing outcome for a non-text message", async () => {
    const response = await POST(requestFor(attachmentPayload));

    expect(response.status).toBe(200);
    expect(mockedCreateReceipt).toHaveBeenCalledWith(
      expect.objectContaining({
        providerRequestId: "request-proof-1",
        objectType: "instagram",
        entryCount: 1,
        eventCount: 1,
      })
    );
    expect(mockedProcess).toHaveBeenCalledWith(
      expect.objectContaining({ kind: "message.attachment", sourceEventId: "message-proof-1" })
    );
    expect(mockedRecordEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        receiptId: "receipt-proof-1",
        eventKind: "message.attachment",
        result: { status: "processed", dmMessageId: "dm-proof-1" },
      })
    );
    expect(mockedFinalize).toHaveBeenCalledWith(
      "receipt-proof-1",
      { processed: 1, duplicate: 0, ignored: 0, failed: 0 },
      null
    );
  });

  it("persists the failed outcome and returns 500 so Meta can retry", async () => {
    mockedProcess.mockRejectedValue(new Error("database unavailable"));
    mockedFinalize.mockResolvedValue("failed");

    const response = await POST(requestFor(attachmentPayload));

    expect(response.status).toBe(500);
    expect(mockedRecordEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        rawPayload: expect.any(Object),
        result: { status: "failed", errorCode: "event_processing_failed" },
      })
    );
    expect(mockedFinalize).toHaveBeenCalledWith(
      "receipt-proof-1",
      { processed: 0, duplicate: 0, ignored: 0, failed: 1 },
      "event_processing_failed"
    );
  });
});
