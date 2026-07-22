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
        demand_growth: { th: "", sources: [{ title: "", url: "" }] },
        grad_employment_pct: { th: "", sources: [{ title: "", url: "" }] },
        saturation_level: { th: "", sources: [{ title: "", url: "" }] },
        progression_difficulty: { th: "", sources: [{ title: "", url: "" }] },
        salary_floor: { th: "", sources: [{ title: "", url: "" }] },
        salary_ceiling: { th: "", sources: [{ title: "", url: "" }] },
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
          { label: "", detail: "" },
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
        eyebrow: "เส้นทางเข้าสู่อาชีพ",
        title: "มีเส้นทางไหนเข้าสู่อาชีพนี้ได้บ้าง?",
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
        presentation: "skills",
        eyebrow: "ทักษะที่ใช้จริง",
        title: "งานนี้ต้องใช้ทักษะอะไรบ้าง?",
        skills: [
          { title: "[ทักษะเฉพาะสาย]", description: "ใช้ทำอะไรจริงในงาน" },
          { title: "[Workflow / artifact]", description: "สิ่งที่ต้องสร้าง ส่งมอบ หรือตรวจสอบ" },
          { title: "[การตัดสินใจ]", description: "judgment call ที่มืออาชีพต้องทำ" },
          { title: "[เครื่องมือ]", description: "ยกตัวอย่างตามบริบท ไม่ทำเป็นรายการยาว" },
        ],
        source_refs: [],
      },
    },
    {
      position: 130,
      kind: "text",
      content_th: {
        presentation: "startCarousel",
        eyebrow: "เริ่มลงมือ",
        title: "ไม่ต้องรอจบมหาวิทยาลัย",
        options: [
          { type: "YouTube", title: "", description: "", url: "", duration: "", cost: "ฟรี", cta: "สนใจวิธีนี้" },
          { type: "ลองทำ", title: "", description: "", duration: "30 นาที", cost: "ฟรี", cta: "อยากลองโจทย์นี้" },
          { type: "คอร์ส / PathLab", title: "", description: "", url: "", duration: "", cost: "", cta: "สนใจเส้นทางนี้" },
        ],
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
