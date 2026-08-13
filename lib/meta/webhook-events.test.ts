import { parseMetaWebhook } from "@/lib/meta/webhook-events";

describe("parseMetaWebhook", () => {
  it("normalizes text, attachments, quick replies, echoes, reactions, delivery and read events", () => {
    const parsed = parseMetaWebhook({
      object: "instagram",
      entry: [
        {
          id: "page-1",
          time: 1_786_636_634,
          messaging: [
            {
              sender: { id: "lead-1" },
              recipient: { id: "page-1" },
              timestamp: 1_786_636_634_000,
              message: { mid: "m-text", text: "hello" },
            },
            {
              sender: { id: "lead-1" },
              recipient: { id: "page-1" },
              timestamp: 1_786_636_635_000,
              message: {
                mid: "m-file",
                attachments: [{ type: "image", payload: { url: "https://example.com/a.jpg" } }],
              },
            },
            {
              sender: { id: "lead-1" },
              recipient: { id: "page-1" },
              timestamp: 1_786_636_636_000,
              message: { mid: "m-quick", text: "Yes", quick_reply: { payload: "YES" } },
            },
            {
              sender: { id: "page-1" },
              recipient: { id: "lead-1" },
              timestamp: 1_786_636_637_000,
              message: { mid: "m-echo", text: "sent", is_echo: true },
            },
            {
              sender: { id: "lead-1" },
              recipient: { id: "page-1" },
              timestamp: 1_786_636_638_000,
              reaction: { mid: "m-echo", action: "react", reaction: "love" },
            },
            {
              sender: { id: "lead-1" },
              recipient: { id: "page-1" },
              timestamp: 1_786_636_639_000,
              delivery: { mids: ["m-echo"], watermark: 1_786_636_639_000 },
            },
            {
              sender: { id: "lead-1" },
              recipient: { id: "page-1" },
              timestamp: 1_786_636_640_000,
              read: { watermark: 1_786_636_640_000 },
            },
          ],
        },
      ],
    });

    expect(parsed.objectType).toBe("instagram");
    expect(parsed.entryCount).toBe(1);
    expect(parsed.events.map((event) => event.kind)).toEqual([
      "message.text",
      "message.attachment",
      "message.quick_reply",
      "message.echo",
      "message.reaction",
      "messaging.delivery",
      "messaging.read",
    ]);
    const attachment = parsed.events[1];
    expect(attachment.kind === "message.attachment" && attachment.attachments[0]).toMatchObject({
      type: "image",
      url: "https://example.com/a.jpg",
    });
    expect(parsed.events[0].occurredAt).toBe("2026-08-13T15:57:14.000Z");
  });

  it("keeps unsupported top-level objects unassigned instead of calling them Facebook", () => {
    const parsed = parseMetaWebhook({
      object: "unsupported_product",
      entry: [{ messaging: [{ sender: { id: "lead-1" }, message: { mid: "m-1", text: "hi" } }] }],
    });

    expect(parsed.events[0].platform).toBeNull();
    expect(parsed.events[0].kind).toBe("message.text");
  });

  it("turns unsupported messaging shapes and changes into explicit audit events", () => {
    const parsed = parseMetaWebhook({
      object: "instagram",
      entry: [
        {
          messaging: [{ sender: { id: "lead-1" }, timestamp: 1_786_636_634_000, mystery: {} }],
          changes: [{ field: "mentions", value: { id: "change-1" } }],
          standby: [{ sender: { id: "lead-2" }, timestamp: 1_786_636_635_000 }],
        },
      ],
    });

    expect(parsed.events.map((event) => event.kind)).toEqual([
      "event.unknown",
      "messaging.standby",
      "change.unsupported",
    ]);
    expect(parsed.events.every((event) => event.dedupeKey.length > 20)).toBe(true);
  });

  it("normalizes comment timestamps expressed in Unix seconds", () => {
    const parsed = parseMetaWebhook({
      object: "instagram",
      entry: [
        {
          time: 1_786_636_634,
          changes: [
            {
              field: "comments",
              value: {
                id: "comment-1",
                text: "Interested",
                timestamp: "1786636634",
                media: { id: "media-1" },
                from: { id: "lead-1", username: "proof_name" },
              },
            },
          ],
        },
      ],
    });

    expect(parsed.events[0]).toMatchObject({
      kind: "comment.created_or_updated",
      sourceEventId: "comment-1",
      occurredAt: "2026-08-13T15:57:14.000Z",
      senderId: "lead-1",
    });
  });
});
