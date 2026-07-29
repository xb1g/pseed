import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";

import { PlanWizard } from "../wizard/PlanWizard";
import type { SeedPathlab } from "@/lib/my-path/pathlab-match";
import type { CareerPreview } from "@/lib/my-path/radar-content";

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

function seed(
  id: string,
  title: string,
  description: string | null = null
): SeedPathlab {
  return {
    id,
    title,
    description,
    coverImageUrl: null,
    categoryName: null,
    totalDays: null,
  };
}

const careers = [
  preview("ai-engineer", "AI Engineer"),
  preview("data-scientist", "Data Scientist"),
  preview("software-engineer", "Software Engineer"),
];

const seeds = [
  seed("seed-ai", "AI Engineer PathLab", "Build a small neural project"),
  seed("seed-fashion", "Fashion Design Studio"),
];

function renderWizard(isSignedIn = false, hasPersistedPath = false) {
  return render(
    <PlanWizard
      careers={careers}
      seeds={seeds}
      isSignedIn={isSignedIn}
      initialDraft={null}
      hasPersistedPath={hasPersistedPath}
    />
  );
}

beforeEach(() => {
  window.localStorage.clear();
  global.fetch = jest.fn().mockResolvedValue({ ok: true });
  global.IntersectionObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof IntersectionObserver;
  Object.defineProperty(window, "scrollTo", {
    value: jest.fn(),
    writable: true,
  });
});

test("opens on the readiness step and gates the interests step behind a saved career", async () => {
  renderWizard();

  expect(
    await screen.findByRole("heading", {
      name: /ตอนนี้คุณอยู่ในช่วงไหนของการเรียนรู้\?/i,
    })
  ).toBeVisible();

  fireEvent.click(screen.getByRole("radio", { name: /พร้อมลงมือทำโปรเจกต์/i }));
  fireEvent.click(screen.getByRole("button", { name: "เริ่มออกแบบชีวิต" }));
  expect(
    screen.getByRole("heading", { name: "อะไรจุดไฟในตัวคุณ" })
  ).toBeVisible();
  expect(
    screen.getByRole("button", { name: "เลือกอย่างน้อย 1 อันเพื่อไปต่อ" })
  ).toBeDisabled();

  fireEvent.click(screen.getByRole("button", { name: /AI Engineer/ }));

  expect(screen.getByRole("button", { name: "ถัดไป" })).toBeEnabled();
  expect(global.fetch).toHaveBeenCalledWith(
    "/api/my-path/events",
    expect.objectContaining({
      method: "POST",
      body: expect.stringContaining('"eventType":"career_saved"'),
    })
  );
});

test("walks from interests through the goal lock to a plan summary step", async () => {
  renderWizard();

  fireEvent.click(
    await screen.findByRole("radio", { name: /พร้อมลงมือทำโปรเจกต์/i })
  );
  fireEvent.click(screen.getByRole("button", { name: "เริ่มออกแบบชีวิต" }));
  fireEvent.click(screen.getByRole("button", { name: /AI Engineer/ }));
  fireEvent.click(screen.getByRole("button", { name: "ถัดไป" }));

  expect(
    screen.getByRole("heading", { name: "ล็อกเป้าหมายของคุณ" })
  ).toBeVisible();
  expect(
    screen.getByRole("button", { name: "เลือกเป้าหมายเพื่อดูแผน" })
  ).toBeDisabled();

  fireEvent.click(screen.getByRole("radio", { name: /เข้ามหาวิทยาลัย/ }));
  expect(global.fetch).toHaveBeenCalledWith(
    "/api/my-path/events",
    expect.objectContaining({
      body: expect.stringContaining('"eventType":"goal_locked"'),
    })
  );

  fireEvent.click(screen.getByRole("button", { name: "ดูแผนของฉัน" }));
  expect(
    screen.getByRole("heading", {
      name: /พร้อมลุยสร้างโปรเจกต์ของคุณแล้ว!/i,
    })
  ).toBeVisible();
  expect(
    screen.getByRole("link", { name: /ส่ง Plan ให้พี่ๆ ช่วยดูฟรี บน LINE OA/i })
  ).toBeVisible();
});

test("folds interests flagged on Radar back into the plan", async () => {
  window.localStorage.setItem(
    "passionseed_plan_radar_interests_v1",
    JSON.stringify(["data-scientist", "unknown-field"])
  );
  renderWizard();

  fireEvent.click(
    await screen.findByRole("radio", { name: /พร้อมลงมือทำโปรเจกต์/i })
  );
  fireEvent.click(screen.getByRole("button", { name: "เริ่มออกแบบชีวิต" }));
  expect(
    screen.getByRole("button", { name: /Data Scientist/ })
  ).toHaveAttribute("aria-pressed", "true");
  expect(
    window.localStorage.getItem("passionseed_plan_radar_interests_v1")
  ).toBeNull();
});

test("keeps every step in history so a swipe-back only moves one step", async () => {
  renderWizard();

  fireEvent.click(
    await screen.findByRole("radio", { name: /พร้อมลงมือทำโปรเจกต์/i })
  );
  fireEvent.click(screen.getByRole("button", { name: "เริ่มออกแบบชีวิต" }));
  fireEvent.click(screen.getByRole("button", { name: /AI Engineer/ }));
  fireEvent.click(screen.getByRole("button", { name: "ถัดไป" }));
  expect(
    screen.getByRole("heading", { name: "ล็อกเป้าหมายของคุณ" })
  ).toBeVisible();

  act(() => {
    window.dispatchEvent(
      new PopStateEvent("popstate", { state: { wizardStep: 1 } })
    );
  });
  expect(
    screen.getByRole("heading", { name: "อะไรจุดไฟในตัวคุณ" })
  ).toBeVisible();
});

test("resumes the furthest step reached after an accidental exit", async () => {
  window.localStorage.setItem("passionseed_my_path_wizard_step_v1", "2");
  renderWizard();

  expect(
    await screen.findByRole("heading", { name: "ล็อกเป้าหมายของคุณ" })
  ).toBeVisible();
});

test("links a persisted mission plan to the summary step", async () => {
  window.localStorage.setItem("passionseed_my_path_wizard_step_v1", "3");
  renderWizard(true, true);

  expect(
    await screen.findByRole("heading", {
      name: /ค้นหาทิศทางที่เหมาะกับตัวคุณ|พร้อมลุยสร้างโปรเจกต์ของคุณแล้ว!/i,
    })
  ).toBeVisible();
});
