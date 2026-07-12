import {
  createRadarDraftStore,
} from "@/lib/radar/admin-draft-store";
import { radarContentDraftSchema } from "@/lib/radar/admin-content";
import type { RadarContentDraft } from "@/lib/radar/admin-content";

const validDraft: RadarContentDraft = {
  field: {
    slug: "ai-engineer",
    name: { th: "วิศวกร AI", en: "AI Engineer" },
    tagline: { th: "สร้างระบบที่เรียนรู้", en: "Build systems that learn" },
    emoji: "🤖",
    color: "#3b82f6",
  },
  tags: ["AI", "software"],
  metrics: [
    {
      key: "salary",
      value: "฿80K–180K",
      label: { th: "เงินเดือนต่อเดือน", en: "Monthly salary" },
      explanation: {
        th: "ช่วงโดยประมาณในประเทศไทย",
        en: "Indicative range in Thailand",
      },
      unit: "บาท/เดือน",
      interpretation: {
        th: "เปรียบเทียบกับงานระดับเริ่มต้นในไทย",
        en: "Compare with entry-level roles in Thailand",
      },
      geography: "Thailand",
      observedAt: "2026-07-01",
      confidence: "medium",
      sourceUrl: "https://example.com/report",
    },
  ],
  cards: [
    {
      id: "overview",
      kind: "text",
      position: 0,
      title: { th: "งานนี้คืออะไร", en: "What is this work?" },
      body: {
        th: ["ออกแบบระบบ AI", "ทดสอบคุณภาพโมเดล"],
        en: ["Design AI systems", "Test model quality"],
      },
      hidden: false,
    },
  ],
  skills: [
    {
      id: "python",
      name: { th: "Python", en: "Python" },
      description: { th: "พื้นฐานการเขียนโปรแกรม", en: "Programming fundamentals" },
      level: "foundation",
    },
  ],
  startRecommendations: [
    {
      id: "intro-video",
      type: "youtube",
      title: { th: "เริ่มต้น AI", en: "Start with AI" },
      description: { th: "ดูภาพรวมก่อน", en: "See the big picture first" },
      url: "https://www.youtube.com/watch?v=abc123",
      intentCta: {
        th: "ฉันอยากลองสร้างโมเดลแรก",
        en: "I want to build my first model",
      },
    },
  ],
};

describe("radarContentDraftSchema", () => {
  it("accepts structured bilingual Radar content", () => {
    expect(radarContentDraftSchema.parse(validDraft)).toEqual(validDraft);
  });

  it("rejects missing Thai translations", () => {
    const draft = structuredClone(validDraft);
    draft.field.name.th = "";

    const result = radarContentDraftSchema.safeParse(draft);

    expect(result.success).toBe(false);
  });

  it("rejects a YouTube recommendation that is not a YouTube URL", () => {
    const draft = structuredClone(validDraft);
    draft.startRecommendations[0].url = "https://example.com/video";

    const result = radarContentDraftSchema.safeParse(draft);

    expect(result.success).toBe(false);
  });

  it("rejects duplicate stable IDs", () => {
    const draft = structuredClone(validDraft);
    draft.cards.push({ ...draft.cards[0] });

    const result = radarContentDraftSchema.safeParse(draft);

    expect(result.success).toBe(false);
  });
});

describe("createRadarDraftStore", () => {
  it("returns canonical content when no saved draft exists", async () => {
    const canonical = { id: "field-1", slug: "ai-engineer" };
    const store = createRadarDraftStore({
      loadCanonical: async () => canonical,
      loadDraft: async () => null,
      persistDraft: async () => ({ revision: 1, updated_at: "2026-07-12" }),
    });

    await expect(store.read("field-1")).resolves.toEqual({
      status: "canonical",
      draft: null,
      revision: null,
      updatedAt: null,
      canonical,
    });
  });

  it("persists a WYSIWYG draft and returns its revision", async () => {
    const persistDraft = jest.fn(async () => ({
      revision: 2,
      updated_at: "2026-07-12T12:00:00Z",
    }));
    const store = createRadarDraftStore({
      loadCanonical: async () => ({ id: "field-1" }),
      loadDraft: async () => null,
      persistDraft,
    });
    const wysiwygDraft = { field: {}, cards: [] };

    await expect(
      store.save("field-1", wysiwygDraft, "admin-1", 1)
    ).resolves.toEqual({
      revision: 2,
      updatedAt: "2026-07-12T12:00:00Z",
    });
    expect(persistDraft).toHaveBeenCalledWith({
      fieldId: "field-1",
      content: wysiwygDraft,
      actorId: "admin-1",
      expectedRevision: 1,
    });
  });
});
