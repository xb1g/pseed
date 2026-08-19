import { parseDrafts } from "@/lib/dm-leads/thread-advisor";

describe("parseDrafts", () => {
  it("reads a plain JSON object", () => {
    const drafts = parseDrafts('{"drafts":[{"label":"ตอบราคา","body":"2,990 ครับ"}]}');
    expect(drafts).toEqual([{ id: "ai-1", label: "ตอบราคา", body: "2,990 ครับ" }]);
  });

  it("strips a markdown fence", () => {
    const drafts = parseDrafts('```json\n{"drafts":[{"label":"a","body":"b"}]}\n```');
    expect(drafts).toHaveLength(1);
  });

  it("tolerates prose around the object", () => {
    const drafts = parseDrafts('นี่คือคำตอบครับ {"drafts":[{"label":"a","body":"b"}]} หวังว่าจะช่วยได้');
    expect(drafts).toHaveLength(1);
  });

  it("returns nothing for non-JSON, so the tray keeps its playbook chips", () => {
    expect(parseDrafts("sorry, I cannot help with that")).toEqual([]);
    expect(parseDrafts("")).toEqual([]);
  });

  it("drops entries with no body and caps the list at three", () => {
    const drafts = parseDrafts(
      JSON.stringify({
        drafts: [
          { label: "1", body: "one" },
          { label: "2", body: "" },
          { label: "3", body: "three" },
          { label: "4", body: "four" },
          { label: "5", body: "five" },
        ],
      })
    );
    expect(drafts.map((d) => d.body)).toEqual(["one", "three", "four"]);
  });

  it("falls back to a generated label when the model omits one", () => {
    const drafts = parseDrafts('{"drafts":[{"body":"hello"}]}');
    expect(drafts[0].label).toBe("AI 1");
  });

  it("ignores a drafts field that is not an array", () => {
    expect(parseDrafts('{"drafts":"nope"}')).toEqual([]);
  });
});
