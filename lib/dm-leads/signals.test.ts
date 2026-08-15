import { reduceMessagesToSignals, signalsFor } from "./signals";

describe("DM lead message signals", () => {
  it("keeps the latest inbound timestamp even when the thread ends outbound", () => {
    const signals = reduceMessagesToSignals([
      {
        conversation_id: "thread-1",
        direction: "inbound",
        body: "สวัสดีครับ",
        sent_at: "2026-08-14T08:00:00.000Z",
      },
      {
        conversation_id: "thread-1",
        direction: "outbound",
        body: "สวัสดีครับ",
        sent_at: "2026-08-14T09:00:00.000Z",
      },
      {
        conversation_id: "thread-1",
        direction: "inbound",
        body: "ขอรายละเอียดเพิ่มครับ",
        sent_at: "2026-08-15T07:30:00.000Z",
      },
      {
        conversation_id: "thread-1",
        direction: "outbound",
        body: "ราคา 299 บาทครับ",
        sent_at: "2026-08-15T08:00:00.000Z",
      },
    ]);

    expect(signalsFor(signals, "thread-1").lastInboundMessageAt).toBe(
      "2026-08-15T07:30:00.000Z"
    );
  });

  it("does not invent an inbound timestamp for an outbound-only thread", () => {
    const signals = reduceMessagesToSignals([
      {
        conversation_id: "thread-2",
        direction: "outbound",
        body: "สวัสดีครับ",
        sent_at: "2026-08-15T08:00:00.000Z",
      },
    ]);

    expect(signalsFor(signals, "thread-2").lastInboundMessageAt).toBeNull();
  });
});
