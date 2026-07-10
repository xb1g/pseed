#!/usr/bin/env node
/**
 * Generate a blank radar field data template JSON.
 * Usage: node seed-template.mjs <slug>
 * Output: writes to /tmp/radar-<slug>.json
 */

const slug = process.argv[2];
if (!slug) {
  console.error("Usage: node seed-template.mjs <slug>");
  process.exit(1);
}

const template = {
  field: {
    slug,
    name_th: "",
    name_en: "",
    emoji: "",
    color: "#4ade80",
    tile_size: "md",
    tags: [],
    is_published: true,
    has_content: true,
    research: {
      tier: "growing",
      reasoning: "",
      metrics: {
        demand_growth: null,
        grad_employment_pct: null,
        saturation_level: null,
        progression_difficulty: null,
        salary_floor: null,
        salary_ceiling: null,
      },
      global_metrics: {
        demand_growth: null,
        grad_employment_pct: null,
        saturation_level: null,
        progression_difficulty: null,
        salary_floor: null,
        salary_ceiling: null,
      },
      metric_details: {
        demand_growth: { th: "", source: "", source_url: "" },
        grad_employment_pct: { th: "", source: "", source_url: "" },
        saturation_level: { th: "", source: "", source_url: "" },
        progression_difficulty: { th: "", source: "", source_url: "" },
        salary_floor: { th: "", source: "", source_url: "" },
        salary_ceiling: { th: "", source: "", source_url: "" },
      },
      global_metric_details: {},
      sources: [],
      insights: [],
      aliases: [],
    },
    score: null,
    tier: "growing",
  },

  sources: [
    {
      ref: 1,
      title: "",
      publisher: "",
      url: "",
      tier: "primary",
      quote_th: "",
      quote_en: "",
    },
  ],

  cards: [
    {
      position: 0,
      kind: "hook",
      content_th: {
        eyebrow: "",
        title: "",
        body: "",
        stat: "",
        statLabel: "",
      },
    },
    {
      position: 10,
      kind: "fantasyReality",
      content_th: {
        eyebrow: "Fantasy vs Reality",
        title: "",
        fantasy: "",
        reality: "",
        source_refs: [],
      },
    },
    {
      position: 40,
      kind: "salaryProgression",
      content_th: {
        eyebrow: "",
        title: "",
        eyebrow_thb: "",
        title_thb: "",
        currency: "USD",
        levels: [
          { level: "", years: "", salary: "", note: "" },
        ],
        levels_thb: [
          { level: "", years: "", salary: "", note: "" },
        ],
        source_refs: [],
      },
    },
    {
      position: 70,
      kind: "aiImpact",
      content_th: {
        eyebrow: "AI Impact",
        title: "จะโดน AI แย่งงานไหม?",
        verdict: "",
        augmented: [],
        automated: [],
        ai_risk_score: 5,
        source_refs: [],
      },
    },
    {
      position: 80,
      kind: "marketThailand",
      content_th: {
        eyebrow: "",
        title: "",
        body: "",
        openings: "",
        companies: [],
        source_refs: [],
      },
    },
    {
      position: 90,
      kind: "dayInLife",
      content_th: {
        eyebrow: "",
        title: "",
        steps: [
          { time: "09:00", label: "" },
        ],
        source_refs: [],
      },
    },
    {
      position: 100,
      kind: "realPeople",
      content_th: {
        eyebrow: "คนจริง",
        title: "",
        people: [
          {
            name: "",
            role: "",
            imageUrl: "",
            background: "",
            salary: "",
            path: [{ year: "", label: "" }],
            nowDoing: "",
            whereHeading: "",
            advice: "",
            publisher: "",
            url: "",
          },
        ],
        source_refs: [],
      },
    },
    {
      position: 110,
      kind: "risks",
      content_th: {
        eyebrow: "",
        title: "",
        risks: [],
        source_refs: [],
      },
    },
    {
      position: 120,
      kind: "entryRoutes",
      content_th: {
        eyebrow: "เรียนอะไรดี?",
        title: "เรียนคณะไหนทำงานนี้ได้?",
        description: "",
        faculties: [
          { name: "", tier: "direct", examples: "", note: "" },
          { name: "", tier: "related", examples: "", note: "" },
          { name: "", tier: "alternative", examples: "", note: "" },
        ],
        source_refs: [],
      },
    },
    {
      position: 125,
      kind: "text",
      content_th: {
        eyebrow: "Skill ที่สายนี้ใช้",
        title: "ต้องเก่งอะไรถึงทำงานสายนี้ได้จริง?",
        body: [
          "• [Field-specific fundamental]: อธิบายว่าใช้จริงในงานอย่างไร พร้อมคำศัพท์/สิ่งที่คนในสายนี้ทำจริง",
          "• [Workflow or artifact]: ระบุ workflow, artifact, tool category, evidence, model, report, system, protocol, หรือ decision ที่สำคัญ",
          "• [Judgment call]: อธิบายการตัดสินใจที่มืออาชีพต้องทำ ไม่ใช่แค่บอกว่า 'คิดวิเคราะห์' หรือ 'ละเอียด'",
          "• [Tools by context]: ใส่เครื่องมือเป็นตัวอย่างตาม sub-role/context ไม่เขียนเหมือนทุกคนต้องใช้ทุก tool",
          "• [Communication/collaboration]: ผูกกับผู้มีส่วนเกี่ยวข้องจริงและสิ่งที่ต้องอธิบาย/ส่งมอบ",
          "• [Ethics/risk/quality]: ระบุความรับผิดชอบ ความเสี่ยง หรือ quality bar เฉพาะสายนี้",
          "• [AI/digital fluency]: อธิบายว่าเครื่องมือใหม่ช่วยตรงไหน และมนุษย์ยังต้องตรวจอะไร",
        ].join("\n"),
        source_refs: [],
      },
    },
    {
      position: 130,
      kind: "text",
      content_th: {
        eyebrow: "เริ่มยังไง",
        title: "",
        body: "",
        source_refs: [],
      },
    },
    {
      position: 140,
      kind: "cta",
      content_th: {
        eyebrow: "สนใจไหม?",
        title: "",
        body: "",
        button: "สนใจสายนี้",
      },
      content_en: {
        eyebrow: "Interested?",
        title: "",
        body: "",
        button: "Interested",
      },
    },
    {
      position: 150,
      kind: "sources",
      content_th: {
        eyebrow: "Sources",
        title: "Where this comes from",
        items: [],
      },
    },
  ],
};

const outPath = `/tmp/radar-${slug}.json`;
const fs = await import("fs");
fs.writeFileSync(outPath, JSON.stringify(template, null, 2));
console.log(`Template written to ${outPath}`);
console.log("Fill in the data, then run: node .claude/skills/radar-research/scripts/seed-radar.mjs " + outPath);
