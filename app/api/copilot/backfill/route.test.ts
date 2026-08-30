/** @jest-environment node */

import { NextRequest } from "next/server";
import { POST } from "@/app/api/copilot/backfill/route";
import {
  findInstagramThreadTarget,
  syncInstagramThread,
} from "@/lib/meta/sync-instagram-thread";
import {
  touchCopilotToken,
  verifyCopilotToken,
} from "@/lib/supabase/dm-copilot-tokens";
import { invalidateDmLeadCache } from "@/lib/supabase/dm-leads";
import { createServiceRoleClient } from "@/utils/supabase/server";

jest.mock("@/lib/meta/sync-instagram-thread", () => ({
  findInstagramThreadTarget: jest.fn(),
  syncInstagramThread: jest.fn(),
}));

jest.mock("@/lib/supabase/dm-copilot-tokens", () => ({
  extractBearerFromHeader: (header: string | null) =>
    header?.startsWith("Bearer psdmlp_") ? header.slice("Bearer ".length) : null,
  touchCopilotToken: jest.fn(),
  verifyCopilotToken: jest.fn(),
}));

jest.mock("@/lib/supabase/dm-leads", () => ({
  invalidateDmLeadCache: jest.fn(),
}));

jest.mock("@/utils/supabase/server", () => ({
  createServiceRoleClient: jest.fn(),
}));

const mockFindInstagramThreadTarget = jest.mocked(findInstagramThreadTarget);
const mockSyncInstagramThread = jest.mocked(syncInstagramThread);
const mockTouchCopilotToken = jest.mocked(touchCopilotToken);
const mockVerifyCopilotToken = jest.mocked(verifyCopilotToken);
const mockInvalidateDmLeadCache = jest.mocked(invalidateDmLeadCache);
const mockCreateServiceRoleClient = jest.mocked(createServiceRoleClient);

function request(body: unknown): NextRequest {
  return new NextRequest("https://www.passionseed.org/api/copilot/backfill", {
    method: "POST",
    headers: {
      authorization: "Bearer psdmlp_test-token",
      "content-type": "application/json",
    },
    body: JSON.stringify(body),
  });
}

describe("POST /api/copilot/backfill", () => {
  const originalBusinessId = process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID;
  const originalMetaToken = process.env.META_PAGE_ACCESS_TOKEN;
  const auditInsert = jest.fn();

  beforeEach(() => {
    process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID = "business-1";
    process.env.META_PAGE_ACCESS_TOKEN = "meta-test-token";
    auditInsert.mockResolvedValue({ error: null });
    mockCreateServiceRoleClient.mockReturnValue({
      from: jest.fn((table: string) => {
        if (table === "dm_copilot_audit_log") return { insert: auditInsert };
        throw new Error(`Unexpected table: ${table}`);
      }),
    } as never);
    mockVerifyCopilotToken.mockResolvedValue({
      ok: true,
      token: { id: "token-1", user_id: "admin-1" },
    });
    mockTouchCopilotToken.mockResolvedValue();
    mockFindInstagramThreadTarget.mockResolvedValue({
      graphConversationId: "graph-thread-1",
      participantId: "lead-1",
      username: "portfolio_kid",
    });
    mockSyncInstagramThread.mockResolvedValue({
      conversationId: "conversation-1",
      username: "portfolio_kid",
      messagesFetched: 12,
      messagesImported: 10,
      duplicatesSkipped: 2,
      latestMessageAt: "2026-08-30T10:00:00.000Z",
    });
  });

  afterAll(() => {
    process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID = originalBusinessId;
    process.env.META_PAGE_ACCESS_TOKEN = originalMetaToken;
  });

  it("syncs an open unknown thread by its normalized visible handle", async () => {
    const response = await POST(request({ username: " @PORTFOLIO_KID " }));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      ok: true,
      conversationId: "conversation-1",
      messagesImported: 10,
      duplicatesSkipped: 2,
    });
    expect(mockFindInstagramThreadTarget).toHaveBeenCalledWith({
      businessAccountId: "business-1",
      participantId: null,
      username: "portfolio_kid",
    });
    expect(auditInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "backfill",
        conversation_id: "conversation-1",
        token_id: "token-1",
      })
    );
    expect(mockInvalidateDmLeadCache).toHaveBeenCalled();
  });

  it("rejects a request with no stable thread identity", async () => {
    const response = await POST(request({ username: " @ " }));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      ok: false,
      error: "missing_thread_identity",
    });
    expect(mockFindInstagramThreadTarget).not.toHaveBeenCalled();
  });

  it("rejects malformed identity fields before calling Meta", async () => {
    const response = await POST(request({ username: 123 }));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      ok: false,
      error: "invalid_thread_identity",
    });
    expect(mockFindInstagramThreadTarget).not.toHaveBeenCalled();
  });
});
