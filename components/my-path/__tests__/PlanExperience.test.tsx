import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import { JSDOM } from "jsdom";

import { resolvePlanEntry } from "../../../lib/my-path/entries";
import type { CareerPreview } from "../../../lib/my-path/radar-content";

function preview(slug: string, title: string): CareerPreview {
  return {
    slug,
    titleTh: title,
    titleEn: title,
    tagline: `สิ่งที่น่าสนใจใน ${title}`,
    emoji: "✦",
    color: "#6366f1",
    dailyWork: "คุยกับคน ทำงานกับทีม และสร้างคำตอบจากข้อมูลจริง",
    enjoySignal: "เหมาะกับคนที่อยากเรียนรู้จากการลงมือทำ",
    tradeoff: "ต้องรับมือกับความไม่แน่นอนและปรับงานจาก feedback",
    aiSignal: "AI ช่วยงานซ้ำ แต่การตัดสินใจยังต้องใช้บริบทมนุษย์",
    entryRoute: "เริ่มจากโปรเจกต์เล็กและ case study ได้",
    marketSignal: "ตลาดต้องการคนที่เชื่อมความเข้าใจกับการลงมือทำ",
    radarHref: `/radar/${slug}`,
  };
}

test("the journey opens careers immediately and keeps micro-questions skippable", async () => {
  const dom = new JSDOM("<!doctype html><html><body></body></html>", {
    url: "https://passionseed.org/plan?entry=tech-beyond-software",
  });
  Object.assign(globalThis, {
    window: dom.window,
    document: dom.window.document,
    HTMLElement: dom.window.HTMLElement,
    Element: dom.window.Element,
    Node: dom.window.Node,
    localStorage: dom.window.localStorage,
    getComputedStyle: dom.window.getComputedStyle,
    MutationObserver: dom.window.MutationObserver,
    IntersectionObserver: class {
      observe() {}
      unobserve() {}
      disconnect() {}
      takeRecords() { return []; }
    },
  });
  Object.defineProperty(globalThis, "navigator", {
    value: dom.window.navigator,
    configurable: true,
  });
  Object.defineProperty(dom.window, "matchMedia", {
    value: () => ({
      matches: false,
      addEventListener() {},
      removeEventListener() {},
    }),
  });
  Object.defineProperty(dom.window.HTMLElement.prototype, "scrollIntoView", {
    value() {},
  });

  const { fireEvent, render, screen, waitFor, cleanup } = await import(
    "@testing-library/react"
  );
  const { PlanExperience } = await import("../PlanExperience");
  render(
    <PlanExperience
      entry={resolvePlanEntry("tech-beyond-software")}
      careers={[
        preview("ai-engineer", "AI Engineer"),
        preview("data-scientist", "Data Scientist"),
        preview("software-engineer", "Software Engineer"),
        preview("cybersecurity", "Cybersecurity"),
        preview("devops-sre", "DevOps / SRE"),
        preview("qa-engineer", "QA Engineer"),
      ]}
      isSignedIn={false}
      initialDraft={null}
      resumeRequested={false}
    />
  );

  assert.ok(
    screen.getByRole("heading", {
      name: "ชอบเทคโนโลยี ไม่ได้แปลว่าต้องเป็น Software Engineer",
    })
  );

  fireEvent.click(
    screen.getByRole("button", { name: "เปิดดู AI Engineer" })
  );
  assert.ok(screen.getByText("อะไรทำให้เส้นทางนี้น่าสนใจสำหรับคุณ?"));
  assert.ok(screen.getByText(/คุยกับคน ทำงานกับทีม/));

  fireEvent.click(screen.getByRole("button", { name: "ข้ามคำถามนี้" }));
  await waitFor(() => {
    assert.equal(
      screen.queryByText("อะไรทำให้เส้นทางนี้น่าสนใจสำหรับคุณ?"),
      null
    );
  });
  assert.ok(screen.getByText(/คุยกับคน ทำงานกับทีม/));

  fireEvent.click(
    screen.getByRole("button", { name: "บันทึก AI Engineer" })
  );
  fireEvent.click(screen.getByRole("button", { name: "บันทึก Cybersecurity" }));
  assert.ok(screen.getByText(/จากสิ่งที่คุณกำลังสำรวจ/));
  assert.ok(screen.getByRole("link", { name: "สร้าง My Path ของฉัน" }));

  cleanup();
  dom.window.close();
});
