import fs from "node:fs";
import path from "node:path";

import { fireEvent, render, screen, within } from "@testing-library/react";

import { MyPathDashboard } from "../MyPathDashboard";
import type { MyPathDashboardModel } from "@/lib/my-path/dashboard";
import type { ProjectSeedMeSummary } from "@/lib/projectseed/me-summary";

function model(
  overrides: Partial<MyPathDashboardModel> = {}
): MyPathDashboardModel {
  return {
    state: "planned",
    nextAction: {
      kind: "choose-pathlab",
      title: "เลือก PathLab ที่จะทดลองจริง",
      detail: "เปลี่ยนความสนใจจาก Radar ให้เป็นหลักฐานจากการลงมือทำ",
      href: "/plan?resume=1",
    },
    plan: {
      goal: "university",
      timelineMonths: 3,
      headline: "สร้างหลักฐานให้เห็นว่าฉันเหมาะกับเส้นทางนี้",
    },
    radarDirections: [
      {
        slug: "ux-designer",
        title: "นักออกแบบ UX",
        href: "/radar/ux-designer",
      },
    ],
    pathlabs: [],
    evidence: [],
    ...overrides,
  };
}

function projectSeed(
  overrides: Partial<ProjectSeedMeSummary> = {}
): ProjectSeedMeSummary {
  return {
    kind: "closed",
    title: "ทำโปรเจกต์จริงก่อนยื่นพอร์ต",
    detail: "ProjectSeed — โปรเจกต์ของตัวเอง มีผู้ใช้จริง มีพี่เลี้ยงศิษย์เก่า",
    href: "/projectseed",
    cta: "ดู ProjectSeed",
    ...overrides,
  };
}

function renderDashboard(
  dashboardModel: MyPathDashboardModel = model(),
  seed: ProjectSeedMeSummary = projectSeed()
) {
  return render(
    <MyPathDashboard model={dashboardModel} projectSeed={seed} />
  );
}

test("empty My Path leads with the next action and keeps reflection tools below it", () => {
  renderDashboard(
    model({
      state: "empty",
      nextAction: {
        kind: "create-plan",
        title: "สร้าง My Path ของฉัน",
        detail: "เริ่มจากเป้าหมายและสิ่งที่อยากลอง",
        href: "/plan",
      },
      plan: null,
      radarDirections: [],
    })
  );

  expect(screen.getAllByRole("heading")[0]).toHaveTextContent(
    "สร้าง My Path ของฉัน"
  );
  expect(
    screen.getByRole("link", { name: "สร้าง My Path ของฉัน" })
  ).toHaveAttribute("href", "/plan");
  expect(screen.getByRole("link", { name: /Journey Map/ })).toHaveAttribute(
    "href",
    "/me/journey"
  );
  expect(
    screen.getByRole("link", { name: /เขียน Reflection/ })
  ).toHaveAttribute("href", "/me/reflection");
});

test("planned My Path shows the plan editor and canonical Radar links", () => {
  renderDashboard();

  expect(screen.getAllByRole("heading")[0]).toHaveTextContent(
    "เลือก PathLab ที่จะทดลองจริง"
  );
  expect(screen.getByRole("link", { name: /แก้ไขแผน/ })).toHaveAttribute(
    "href",
    "/plan?resume=1"
  );
  expect(screen.getByRole("link", { name: /นักออกแบบ UX/ })).toHaveAttribute(
    "href",
    "/radar/ux-designer"
  );
});

test("journey regions take stable accessible names from their visible headings", () => {
  renderDashboard();

  for (const name of [
    "แผน 2–4 เดือนของฉัน",
    "ทิศที่กำลังอยากรู้จัก",
    "การทดลองทำงานจริง",
    "โปรเจกต์จริงในคอมมูนิตี้",
    "หลักฐานที่ได้จากการลงมือทำ",
  ]) {
    const region = screen.getByRole("region", { name });
    const heading = screen.getByRole("heading", { name });
    expect(heading).toHaveAttribute(
      "id",
      region.getAttribute("aria-labelledby")
    );
  }

  const supporting = screen.getByRole("navigation", {
    name: "ทบทวนเส้นทางและความคิดของฉัน",
  });
  const supportingHeading = screen.getByRole("heading", {
    name: "ทบทวนเส้นทางและความคิดของฉัน",
  });
  expect(supportingHeading).toHaveAttribute(
    "id",
    supporting.getAttribute("aria-labelledby")
  );
});

test("active PathLab keeps learning primary and payment status secondary", () => {
  renderDashboard(
    model({
      state: "active",
      nextAction: {
        kind: "resume-pathlab",
        title: "ทำ AI Builder ต่อวันนี้",
        detail: "กลับไปทำวันที่ 2 จากจุดที่ค้างไว้",
        href: "/seeds/pathlab/enrollment-a?day=2",
      },
      pathlabs: [
        {
          seedId: "seed-a",
          title: "AI Builder",
          enrollmentId: "enrollment-a",
          status: "active",
          currentDay: 2,
          completedActivities: 3,
          href: "/seeds/pathlab/enrollment-a?day=2",
          trial: {
            status: "active",
            label: "กำลังทดลอง",
            payHref: "/pay/pay-a",
            paymentDeadline: "2026-07-23T00:00:00.000Z",
          },
        },
      ],
    })
  );

  const learningAction = screen.getByRole("link", {
    name: "ทำ AI Builder ต่อวันนี้",
  });
  const experiment = screen.getByRole("article", { name: "AI Builder" });

  expect(learningAction).toHaveAttribute(
    "href",
    "/seeds/pathlab/enrollment-a?day=2"
  );
  expect(within(experiment).getByText("กำลังทดลอง")).toBeInTheDocument();
  expect(
    learningAction.compareDocumentPosition(experiment) &
      Node.DOCUMENT_POSITION_FOLLOWING
  ).toBeTruthy();
});

test("shows the verified parent contact and lets the student revoke updates", async () => {
  global.fetch = jest
    .fn()
    .mockResolvedValueOnce({
      ok: true,
      json: async () => ({ verified: true, maskedEmail: "p****@example.com" }),
    })
    .mockResolvedValueOnce({
      ok: true,
      json: async () => ({ status: "revoked" }),
    });

  renderDashboard(
    model({
      state: "active",
      pathlabs: [
        {
          seedId: "seed-a",
          title: "AI Builder",
          enrollmentId: "enrollment-a",
          status: "active",
          currentDay: 2,
          completedActivities: 3,
          href: "/seeds/pathlab/enrollment-a?day=2",
          trial: {
            status: "active",
            label: "กำลังทดลอง",
            payHref: "/pay/0123456789abcdef0123456789abcdef",
            paymentDeadline: "2026-07-23T00:00:00.000Z",
          },
        },
      ],
    })
  );

  expect(await screen.findByText(/p\*\*\*\*@example.com/)).toBeVisible();
  fireEvent.click(
    screen.getByRole("button", { name: "หยุดส่งอัปเดตให้ผู้ปกครอง" })
  );
  expect(await screen.findByRole("status")).toHaveTextContent(
    "หยุดส่งอัปเดตแล้ว"
  );
  expect(global.fetch).toHaveBeenNthCalledWith(
    2,
    "/api/trials/0123456789abcdef0123456789abcdef/parent-updates",
    { method: "DELETE" }
  );
});

test("keeps the verified contact visible and offers retry when revoke fails", async () => {
  global.fetch = jest
    .fn()
    .mockResolvedValueOnce({
      ok: true,
      json: async () => ({ verified: true, maskedEmail: "p****@example.com" }),
    })
    .mockRejectedValueOnce(new Error("network unavailable"));

  renderDashboard(
    model({
      state: "active",
      pathlabs: [
        {
          seedId: "seed-a",
          title: "AI Builder",
          enrollmentId: "enrollment-a",
          status: "active",
          currentDay: 2,
          completedActivities: 3,
          href: "/seeds/pathlab/enrollment-a?day=2",
          trial: {
            status: "active",
            label: "กำลังทดลอง",
            payHref: "/pay/0123456789abcdef0123456789abcdef",
            paymentDeadline: "2026-07-23T00:00:00.000Z",
          },
        },
      ],
    })
  );

  expect(await screen.findByText(/p\*\*\*\*@example.com/)).toBeVisible();
  fireEvent.click(
    screen.getByRole("button", { name: "หยุดส่งอัปเดตให้ผู้ปกครอง" })
  );

  expect(await screen.findByRole("alert")).toHaveTextContent(
    "ยังหยุดส่งอัปเดตไม่ได้"
  );
  expect(screen.getByText(/p\*\*\*\*@example.com/)).toBeVisible();
  expect(
    screen.getByRole("button", { name: "ลองหยุดส่งอีกครั้ง" })
  ).toBeEnabled();
});

test("expired access explains recovery without losing the saved plan", () => {
  renderDashboard(
    model({
      nextAction: {
        kind: "restore-pathlab-access",
        title: "ให้ผู้ปกครองช่วยเปิดการทดลองต่อ",
        detail: "แผนยังอยู่ ชำระเพื่อกลับไปทำ PathLab ที่เลือกไว้ต่อ",
        href: "/pay/pay-a",
      },
      pathlabs: [
        {
          seedId: "seed-a",
          title: "AI Builder",
          enrollmentId: "enrollment-a",
          status: "active",
          currentDay: 2,
          completedActivities: 3,
          href: "/seeds/pathlab/enrollment-a?day=2",
          trial: {
            status: "expired",
            label: "หมดเวลาทดลอง",
            payHref: "/pay/pay-a",
            paymentDeadline: "2026-07-21T00:00:00.000Z",
          },
        },
      ],
    })
  );

  expect(
    screen.getByRole("link", { name: "ให้ผู้ปกครองช่วยเปิดการทดลองต่อ" })
  ).toHaveAttribute("href", "/pay/pay-a");
  expect(screen.getByRole("link", { name: "เปิดการทดลองต่อ" })).toHaveClass(
    "inline-flex",
    "min-h-12"
  );
  expect(screen.getByText(/แผนยังอยู่/)).toBeInTheDocument();
  expect(screen.getByRole("link", { name: /แก้ไขแผน/ })).toHaveAttribute(
    "href",
    "/plan?resume=1"
  );
});

test("ProjectSeed section links into the hub with the next step CTA", () => {
  renderDashboard(
    model(),
    projectSeed({
      kind: "active",
      cohortName: "Alumni MVP",
      title: "Alumni MVP",
      detail: "ก้าวถัดไป: เชื่อม Discord — ห้องอยู่บน Discord",
      href: "/projectseed/hub",
      cta: "เชื่อม Discord",
      doneCount: 0,
      totalCount: 4,
      complete: false,
    })
  );

  const region = screen.getByRole("region", { name: "โปรเจกต์จริงในคอมมูนิตี้" });
  expect(within(region).getByText("0/4 ข้อ")).toBeInTheDocument();
  expect(
    within(region).getByRole("link", { name: /เชื่อม Discord/ })
  ).toHaveAttribute("href", "/projectseed/hub");
});

test("completed My Path surfaces evidence before supporting journey tools", () => {
  renderDashboard(
    model({
      state: "completed",
      nextAction: {
        kind: "review-evidence",
        title: "ทบทวนหลักฐาน แล้วปรับแผนรอบถัดไป",
        detail: "ดูสิ่งที่ทำได้จริงก่อนเลือกก้าวต่อไป",
        href: "/plan?resume=1",
      },
      evidence: [
        {
          id: "fit-a",
          kind: "pathlab-fit",
          seedId: "seed-a",
          label: "สัญญาณความเหมาะสม · AI Builder",
          detail: "ทดลองจบพร้อมกิจกรรมที่ทำสำเร็จ 3 กิจกรรม",
          createdAt: "2026-07-22T00:00:00.000Z",
          href: "/seeds/pathlab/enrollment-a",
        },
      ],
    })
  );

  const evidence = screen.getByText("สัญญาณความเหมาะสม · AI Builder");
  const journey = screen.getByRole("link", { name: /Journey Map/ });
  expect(
    evidence.compareDocumentPosition(journey) & Node.DOCUMENT_POSITION_FOLLOWING
  ).toBeTruthy();
});

test("the dashboard uses shared Dawn controls and the global Dawn card modifier", () => {
  const { container } = renderDashboard();
  const css = fs.readFileSync(
    path.join(process.cwd(), "app/globals.css"),
    "utf8"
  );

  expect(container.firstElementChild).toHaveClass("dawn-theme");
  expect(container.querySelector(".ei-card")).toBeInTheDocument();
  expect(container.querySelector(".ei-button-dawn")).toBeInTheDocument();
  expect(css).toMatch(/\.dawn-theme\s+\.ei-card\s*\{/);
  expect(css).toMatch(/\.dawn-theme\s+\.ei-card::before\s*\{/);
  expect(css).toContain("var(--ease-snap, cubic-bezier(0.4, 0, 0.2, 1))");
  expect(css).toContain(
    "var(--focus-ring-color-dawn, rgba(254, 217, 92, 0.75))"
  );
});

test("the Dawn motion contract keeps skeletons static and stops button motion when reduced", () => {
  const css = fs.readFileSync(
    path.join(process.cwd(), "app/globals.css"),
    "utf8"
  );

  expect(css).toContain(
    ".dawn-theme .ei-card:not(.ei-card--static):not(.ei-card--lit):hover"
  );
  expect(css).toContain(
    ".dawn-theme .ei-card:not(.ei-card--static):not(.ei-card--lit).in-view"
  );
  expect(css).toMatch(
    /\.dawn-theme \.ei-card--static:hover,[\s\S]*?\.dawn-theme \.ei-card--static\.in-view\s*\{[\s\S]*?animation: none;[\s\S]*?transform: none;/
  );
  expect(css).toMatch(
    /@media \(prefers-reduced-motion: reduce\)[\s\S]*?\.dawn-theme \.ei-button-dawn::before,[\s\S]*?\.dawn-theme \.ei-button-dawn::after,[\s\S]*?animation: none !important;[\s\S]*?transform: none !important;/
  );
  expect(css).toMatch(
    /\.dawn-theme \.ei-card--lit,[\s\S]*?\.dawn-theme \.ei-card--lit:hover,[\s\S]*?\.dawn-theme \.ei-card--lit\.in-view\s*\{[\s\S]*?border-color: rgba\(255, 214, 140, 0\.68\);[\s\S]*?animation: none;/
  );
  expect(css).toMatch(
    /\.dawn-theme \.ei-card--lit::before,[\s\S]*?\.dawn-theme \.ei-card--lit:hover::before,[\s\S]*?\.dawn-theme \.ei-card--lit\.in-view::before\s*\{[\s\S]*?opacity: 1;[\s\S]*?filter: blur\(3px\);/
  );
});
