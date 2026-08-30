import {
  findInstagramConversationForUser,
  getConversationMessages,
  getInstagramProfile,
  listInstagramConversations,
} from "@/lib/meta/graph";
import {
  applyClassification,
  recordBackfilledMessage,
} from "@/lib/supabase/dm-leads";
import {
  findInstagramThreadTarget,
  graphAttachmentsToInputs,
  graphMessageBody,
  syncInstagramThread,
} from "@/lib/meta/sync-instagram-thread";

jest.mock("@/lib/meta/graph", () => ({
  findInstagramConversationForUser: jest.fn(),
  getConversationMessages: jest.fn(),
  getInstagramProfile: jest.fn(),
  listInstagramConversations: jest.fn(),
}));

jest.mock("@/lib/supabase/dm-leads", () => ({
  applyClassification: jest.fn(),
  recordBackfilledMessage: jest.fn(),
}));

const mockGetConversationMessages = jest.mocked(getConversationMessages);
const mockFindInstagramConversationForUser = jest.mocked(findInstagramConversationForUser);
const mockGetInstagramProfile = jest.mocked(getInstagramProfile);
const mockListInstagramConversations = jest.mocked(listInstagramConversations);
const mockApplyClassification = jest.mocked(applyClassification);
const mockRecordBackfilledMessage = jest.mocked(recordBackfilledMessage);

describe("findInstagramThreadTarget", () => {
  beforeEach(() => {
    mockFindInstagramConversationForUser.mockResolvedValue(null);
    mockListInstagramConversations.mockResolvedValue([
      {
        id: "graph-thread-1",
        participants: {
          data: [
            { id: "business-1", username: "passionseed" },
            { id: "lead-1", username: "PortfolioKid" },
          ],
        },
      },
    ]);
  });

  it("matches an existing lead by stable participant ID", async () => {
    mockFindInstagramConversationForUser.mockResolvedValue("graph-thread-1");

    await expect(
      findInstagramThreadTarget({
        businessAccountId: "business-1",
        participantId: "lead-1",
        username: "wrong_handle",
      })
    ).resolves.toEqual({
      graphConversationId: "graph-thread-1",
      participantId: "lead-1",
      username: "wrong_handle",
    });
    expect(mockListInstagramConversations).not.toHaveBeenCalled();
  });

  it("matches a new lead by a normalized visible handle", async () => {
    await expect(
      findInstagramThreadTarget({
        businessAccountId: "business-1",
        username: " @PORTFOLIOKID ",
      })
    ).resolves.toMatchObject({ participantId: "lead-1" });
  });
});

describe("syncInstagramThread", () => {
  it("imports exact Graph messages, keeps attachments, and reports duplicates", async () => {
    mockGetInstagramProfile.mockResolvedValue({
      displayName: "Portfolio Kid",
      username: "portfolio_kid",
    });
    mockGetConversationMessages.mockResolvedValue([
      {
        id: "message-1",
        message: "  I need portfolio help  ",
        created_time: "2026-08-30T09:00:00.000Z",
        from: { id: "lead-1" },
      },
      {
        id: "message-2",
        message: "Let's plan the first step",
        created_time: "2026-08-30T09:01:00.000Z",
        from: { id: "business-1" },
      },
      {
        id: "message-3",
        created_time: "2026-08-30T09:02:00.000Z",
        from: { id: "lead-1" },
        attachments: {
          data: [{ id: "attachment-1", image_data: { url: "https://example.com/work.jpg" } }],
        },
      },
      {
        id: "message-4",
        created_time: "2026-08-30T09:03:00.000Z",
        from: { id: "lead-1" },
      },
    ]);
    mockRecordBackfilledMessage
      .mockResolvedValueOnce({ conversationId: "conversation-1", outcome: "created" })
      .mockResolvedValueOnce({ conversationId: "conversation-1", outcome: "duplicate" })
      .mockResolvedValueOnce({ conversationId: "conversation-1", outcome: "created" });

    const result = await syncInstagramThread({
      businessAccountId: "business-1",
      target: {
        graphConversationId: "graph-thread-1",
        participantId: "lead-1",
        username: "old_handle",
      },
    });

    expect(result).toEqual({
      conversationId: "conversation-1",
      username: "portfolio_kid",
      messagesFetched: 4,
      messagesImported: 2,
      duplicatesSkipped: 1,
      latestMessageAt: "2026-08-30T09:02:00.000Z",
    });
    expect(mockRecordBackfilledMessage).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        direction: "inbound",
        body: "I need portfolio help",
        platformMessageId: "message-1",
        sentAt: "2026-08-30T09:00:00.000Z",
      })
    );
    expect(mockRecordBackfilledMessage).toHaveBeenNthCalledWith(
      3,
      expect.objectContaining({
        direction: "inbound",
        body: "[Image]",
        messageType: "attachment",
        attachments: [
          expect.objectContaining({ type: "image", url: "https://example.com/work.jpg" }),
        ],
      })
    );
    expect(mockApplyClassification).toHaveBeenCalledWith(
      "conversation-1",
      expect.any(Object)
    );
  });
});

describe("Graph message normalization", () => {
  it("uses a safe placeholder for attachment-only messages", () => {
    const attachments = graphAttachmentsToInputs([
      { file_url: "https://example.com/brief.pdf", name: "brief.pdf" },
    ]);

    expect(graphMessageBody(undefined, attachments)).toBe("[Attachment]");
    expect(graphMessageBody(" hello ", attachments)).toBe("hello");
  });
});
