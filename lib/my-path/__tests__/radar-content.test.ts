import assert from "node:assert/strict";

import { buildCareerPreview } from "../radar-content";

test("career previews reuse selected Radar reality signals without copying whole profiles", () => {
  const preview = buildCareerPreview(
    {
      slug: "ux-designer",
      name_th: "Product Designer",
      name_en: "Product Designer",
      tagline_th: "ออกแบบจากความเข้าใจคน",
      emoji: "✦",
      color: "#6366f1",
      squad_url: null,
      research: { reasoning: "ตลาดต้องการคนที่เชื่อมปัญหาคนกับผลิตภัณฑ์" },
    },
    [
      {
        kind: "dayInLife",
        content_th: {
          steps: [
            { label: "คุยกับผู้ใช้", detail: "หาความต้องการที่ยังไม่ได้พูด" },
            { label: "ทำ prototype", detail: "ทดสอบแนวคิดกับทีม" },
          ],
        },
      },
      {
        kind: "fantasyReality",
        content_th: { reality: "ไม่ได้วาดหน้าจอทั้งวัน ต้องคุยและตัดสินใจร่วมกับทีม" },
      },
      {
        kind: "aiImpact",
        content_th: {
          verdict: "AI ช่วยทำ mockup แต่ยังแทนการเข้าใจบริบทมนุษย์ไม่ได้",
        },
      },
      {
        kind: "entryRoutes",
        content_th: { description: "เริ่มจากโปรเจกต์เล็กและ case study ได้" },
      },
    ]
  );

  assert.equal(preview.slug, "ux-designer");
  assert.match(preview.dailyWork, /คุยกับผู้ใช้/);
  assert.match(preview.tradeoff, /ไม่ได้วาดหน้าจอ/);
  assert.match(preview.aiSignal, /AI ช่วยทำ mockup/);
  assert.match(preview.entryRoute, /โปรเจกต์เล็ก/);
  assert.equal(preview.radarHref, "/radar/ux-designer");
  assert.equal(preview.pathLabHref, undefined);
});

test("PathLab links come only from reviewed planning registry destinations", () => {
  const preview = buildCareerPreview(
    {
      slug: "ai-engineer",
      name_th: "AI Engineer",
      name_en: "AI Engineer",
      tagline_th: "สร้างระบบ AI",
      emoji: "✦",
      color: "#06b6d4",
      squad_url: "/some-unreviewed-destination",
      research: null,
    },
    []
  );

  assert.equal(preview.pathLabHref, "/seeds/pathlab/ai-engineer");
});
