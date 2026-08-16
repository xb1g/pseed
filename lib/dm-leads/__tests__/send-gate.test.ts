import { gateDraft, consecutiveOutboundTail } from "@/lib/dm-leads/send-gate";

const base = {
  body: "น้องอยู่ ม.ไหน แล้วสนใจคณะไหนอยู่ครับ บอกมาหมดเลยก็ได้",
  rung: 1 as const,
  bucket: "never_pitched" as const,
  windowMode: "standard" as const,
  consecutiveOutbound: 0,
};

describe("gateDraft", () => {
  it("auto-sends a plain rung-1 question inside the 24h window", () => {
    expect(gateDraft(base)).toEqual({ decision: "auto", reasons: [] });
  });

  it("blocks outright once the 7-day window has closed", () => {
    const result = gateDraft({ ...base, windowMode: "closed" });
    expect(result.decision).toBe("block");
    expect(result.reasons).toEqual(["window_closed"]);
  });

  // Meta grants HUMAN_AGENT for a human answering a user, not for automation.
  // This is the rule that keeps ~93% of the reachable inbox under review.
  it("forces review in the HUMAN_AGENT window even for otherwise safe copy", () => {
    const result = gateDraft({ ...base, windowMode: "human_agent" });
    expect(result.decision).toBe("review");
    expect(result.reasons).toContain("human_agent_window");
  });

  it("forces review when the rewrite introduced a price the template lacked", () => {
    const result = gateDraft({ ...base, body: "เริ่มที่ 299 ครับ" });
    expect(result.decision).toBe("review");
    expect(result.reasons).toContain("mentions_price");
  });

  it("forces review when the rewrite introduced a link", () => {
    const result = gateDraft({
      ...base,
      body: "ลองดูที่ passionseed.org/pathlab ได้ครับ",
    });
    expect(result.reasons).toContain("sends_link");
  });

  it("never auto-sends rung 3 or 4", () => {
    expect(gateDraft({ ...base, rung: 3 }).reasons).toContain("rung_states_price");
    expect(gateDraft({ ...base, rung: 4 }).reasons).toContain("rung_states_price");
  });

  it("forces review on buckets that need the thread read first", () => {
    expect(gateDraft({ ...base, bucket: "hot" }).reasons).toContain(
      "bucket_needs_judgment"
    );
  });

  it("refuses to auto-send an unfilled placeholder", () => {
    const result = gateDraft({ ...base, body: "รอบหน้าเริ่ม [วันที่] ครับ" });
    expect(result.reasons).toContain("unfilled_placeholder");
  });

  it("stops after one unanswered follow-up", () => {
    const result = gateDraft({ ...base, consecutiveOutbound: 1 });
    expect(result.reasons).toContain("already_followed_up");
  });

  it("reports every failing rule, not just the first", () => {
    const result = gateDraft({
      ...base,
      body: "สวัสดีครับ ราคา 299 ดูที่ /pathlab [วันที่]",
      rung: 4,
      bucket: "hot",
      windowMode: "human_agent",
      consecutiveOutbound: 2,
    });
    expect(result.decision).toBe("review");
    expect(new Set(result.reasons)).toEqual(
      new Set([
        "human_agent_window",
        "rung_states_price",
        "bucket_needs_judgment",
        "mentions_price",
        "sends_link",
        "makes_offer",
        "unfilled_placeholder",
        "already_followed_up",
      ])
    );
  });
});

describe("consecutiveOutboundTail", () => {
  it("counts only the unanswered tail", () => {
    expect(
      consecutiveOutboundTail([
        { direction: "outbound" },
        { direction: "inbound" },
        { direction: "outbound" },
        { direction: "outbound" },
      ])
    ).toBe(2);
  });

  it("is zero when the lead spoke last", () => {
    expect(
      consecutiveOutboundTail([{ direction: "outbound" }, { direction: "inbound" }])
    ).toBe(0);
  });

  it("handles an empty thread", () => {
    expect(consecutiveOutboundTail([])).toBe(0);
  });
});
