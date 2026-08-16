import { validateHumanized, buildHumanizeMessages } from "@/lib/dm-leads/humanize";

describe("validateHumanized", () => {
  it("accepts the shape the inbox's winning replies actually had", () => {
    expect(
      validateHumanized("ค่ายของคณะโดยตรง > open house เยอะมากครับ เพราะกรรมการดูว่าเราทำงานยาวได้ไหม")
    ).toEqual([]);
  });

  it("accepts exactly one emoji", () => {
    expect(validateHumanized("โทษที หายไปคุยกับน้องคนอื่นอยู่ 😅 กลับมาที่ของน้องนะ")).toEqual([]);
  });

  // The single biggest cringe source in the old quick-reply engine: every
  // message opened with a greeting even mid-conversation.
  it("rejects a greeting mid-thread", () => {
    expect(validateHumanized("สวัสดีครับน้องมิน ยินดีช่วยครับ")).toContain("greeting");
  });

  it("rejects emoji spam", () => {
    expect(
      validateHumanized("เยี่ยมเลยครับ 👏 สู้ๆ 🔥 ลองดูนะ 🌱")
    ).toContain("too_many_emoji");
  });

  it("rejects a wall of text", () => {
    const wall = ["บรรทัดหนึ่ง", "บรรทัดสอง", "บรรทัดสาม", "บรรทัดสี่", "บรรทัดห้า"].join("\n");
    expect(validateHumanized(wall)).toContain("too_many_sentences");
  });

  it("rejects brochure voice", () => {
    expect(
      validateHumanized("ลองดู PathLab (โปรแกรมลองทำโปรเจกต์จริงแบบสั้น) ได้ครับ")
    ).toContain("brochure_voice");
  });

  it("rejects an empty rewrite", () => {
    expect(validateHumanized("   ")).toEqual(["empty"]);
  });

  it("does not count Thai polite particles or ellipses as emoji", () => {
    expect(validateHumanized("อันนี้ก่อนนะครับ... แล้วค่อยว่ากัน")).toEqual([]);
  });
});

describe("buildHumanizeMessages", () => {
  const lead = { displayName: "มิน", gradeLevel: "ม.4", interests: ["แพทยศาสตร์"] };

  it("puts the recent thread in front of the model so it continues rather than restarts", () => {
    const [, user] = buildHumanizeMessages({
      template: "ถามหน่อยครับ",
      lead,
      variant: "ask",
      recentTurns: [
        { direction: "outbound", body: "น้องอยู่ ม.ไหนครับ" },
        { direction: "inbound", body: "ม.4 ครับ" },
      ],
    });
    expect(user.content).toContain("พี่: น้องอยู่ ม.ไหนครับ");
    expect(user.content).toContain("น้อง: ม.4 ครับ");
  });

  it("keeps only the last few turns", () => {
    const turns = Array.from({ length: 12 }, (_, i) => ({
      direction: "inbound" as const,
      body: `ข้อความ ${i}`,
    }));
    const [, user] = buildHumanizeMessages({
      template: "ต่อครับ",
      lead,
      variant: "ask",
      recentTurns: turns,
    });
    expect(user.content).not.toContain("ข้อความ 0");
    expect(user.content).toContain("ข้อความ 11");
  });

  it("instructs the two arms differently", () => {
    const askUser = buildHumanizeMessages({ template: "t", lead, variant: "ask", recentTurns: [] })[1];
    const noAskUser = buildHumanizeMessages({ template: "t", lead, variant: "no_ask", recentTurns: [] })[1];
    expect(askUser.content).not.toEqual(noAskUser.content);
    expect(noAskUser.content).toContain("ห้ามลงท้ายด้วยคำถาม");
  });

  it("skips blank turns instead of emitting empty speaker lines", () => {
    const [, user] = buildHumanizeMessages({
      template: "t",
      lead,
      variant: "ask",
      recentTurns: [{ direction: "inbound", body: "  " }, { direction: "inbound", body: "จริงเหรอครับ" }],
    });
    expect(user.content).not.toContain("น้อง:  \n");
    expect(user.content).toContain("น้อง: จริงเหรอครับ");
  });
});
