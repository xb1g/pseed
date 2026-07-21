import fs from "node:fs";
import path from "node:path";

import { render, screen, within } from "@testing-library/react";

import { MyPathDashboard } from "../MyPathDashboard";
import type { MyPathDashboardModel } from "@/lib/my-path/dashboard";

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

test("empty My Path leads with the next action and keeps reflection tools below it", () => {
  render(
    <MyPathDashboard
      model={model({
        state: "empty",
        nextAction: {
          kind: "create-plan",
          title: "สร้าง My Path ของฉัน",
          detail: "เริ่มจากเป้าหมายและสิ่งที่อยากลอง",
          href: "/plan",
        },
        plan: null,
        radarDirections: [],
      })}
    />
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
  expect(screen.getByRole("link", { name: /เขียน Reflection/ })).toHaveAttribute(
    "href",
    "/me/reflection"
  );
});

test("planned My Path shows the plan editor and canonical Radar links", () => {
  render(<MyPathDashboard model={model()} />);

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

test("active PathLab keeps learning primary and payment status secondary", () => {
  render(
    <MyPathDashboard
      model={model({
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
      })}
    />
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
    learningAction.compareDocumentPosition(experiment) & Node.DOCUMENT_POSITION_FOLLOWING
  ).toBeTruthy();
});

test("expired access explains recovery without losing the saved plan", () => {
  render(
    <MyPathDashboard
      model={model({
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
      })}
    />
  );

  expect(
    screen.getByRole("link", { name: "ให้ผู้ปกครองช่วยเปิดการทดลองต่อ" })
  ).toHaveAttribute(
    "href",
    "/pay/pay-a"
  );
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

test("completed My Path surfaces evidence before supporting journey tools", () => {
  render(
    <MyPathDashboard
      model={model({
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
      })}
    />
  );

  const evidence = screen.getByText("สัญญาณความเหมาะสม · AI Builder");
  const journey = screen.getByRole("link", { name: /Journey Map/ });
  expect(
    evidence.compareDocumentPosition(journey) & Node.DOCUMENT_POSITION_FOLLOWING
  ).toBeTruthy();
});

test("the dashboard uses shared Dawn controls and the global Dawn card modifier", () => {
  const { container } = render(<MyPathDashboard model={model()} />);
  const css = fs.readFileSync(path.join(process.cwd(), "app/globals.css"), "utf8");

  expect(container.firstElementChild).toHaveClass("dawn-theme");
  expect(container.querySelector(".ei-card")).toBeInTheDocument();
  expect(container.querySelector(".ei-button-dawn")).toBeInTheDocument();
  expect(css).toMatch(/\.dawn-theme\s+\.ei-card\s*\{/);
  expect(css).toMatch(/\.dawn-theme\s+\.ei-card::before\s*\{/);
  expect(css).toContain(
    "var(--ease-snap, cubic-bezier(0.4, 0, 0.2, 1))"
  );
  expect(css).toContain(
    "var(--focus-ring-color-dawn, rgba(254, 217, 92, 0.75))"
  );
});
