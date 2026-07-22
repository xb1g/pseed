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

test("opens on the hook step and gates the interests step behind a saved career", async () => {
  renderWizard();

  expect(
    await screen.findByRole("heading", { name: /เข้ามหาวิทยาลัย/ })
  ).toBeVisible();

  fireEvent.click(screen.getByRole("button", { name: "เริ่มออกแบบชีวิต" }));
  expect(
    screen.getByRole("heading", { name: "อะไรที่จุดไฟให้คุณ?" })
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

test("walks through pathlabs and the goal lock to a sign-in-gated mission plan", async () => {
  renderWizard();

  fireEvent.click(
    await screen.findByRole("button", { name: "เริ่มออกแบบชีวิต" })
  );
  fireEvent.click(screen.getByRole("button", { name: /AI Engineer/ }));
  fireEvent.click(screen.getByRole("button", { name: "ถัดไป" }));

  expect(
    screen.getByRole("heading", { name: "ลองทำจริงใน PathLab" })
  ).toBeVisible();
  // The saved interest sorts its matching PathLab to the top.
  expect(screen.getAllByRole("heading", { level: 3 })[0]).toHaveTextContent(
    "AI Engineer PathLab"
  );

  fireEvent.click(screen.getAllByRole("button", { name: "เลือกอันนี้" })[0]);
  expect(screen.getByRole("button", { name: "เลือกแล้ว" })).toBeVisible();
  expect(global.fetch).toHaveBeenCalledWith(
    "/api/my-path/events",
    expect.objectContaining({
      body: expect.stringContaining('"eventType":"pathlab_selected"'),
    })
  );

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
      name: "แผน 4 เดือนสู่มหาวิทยาลัยในไทม์ไลน์ของคุณ",
    })
  ).toBeVisible();
  expect(
    screen.getByRole("link", { name: /เข้าสู่ระบบเพื่อบันทึกแผนนี้/ })
  ).toHaveAttribute("href", "/login?next=%2Fplan%3Fresume%3D1");
});

test("keeps every step in history so a swipe-back only moves one step", async () => {
  renderWizard();

  fireEvent.click(
    await screen.findByRole("button", { name: "เริ่มออกแบบชีวิต" })
  );
  fireEvent.click(screen.getByRole("button", { name: /AI Engineer/ }));
  fireEvent.click(screen.getByRole("button", { name: "ถัดไป" }));
  expect(
    screen.getByRole("heading", { name: "ลองทำจริงใน PathLab" })
  ).toBeVisible();

  // A mobile swipe-back gesture fires popstate — it must land on the
  // previous wizard step, not leave the page.
  act(() => {
    window.dispatchEvent(
      new PopStateEvent("popstate", { state: { wizardStep: 1 } })
    );
  });
  expect(
    screen.getByRole("heading", { name: "อะไรที่จุดไฟให้คุณ?" })
  ).toBeVisible();
});

test("resumes the furthest step reached after an accidental exit", async () => {
  window.localStorage.setItem("passionseed_my_path_wizard_step_v1", "3");
  renderWizard();

  expect(
    await screen.findByRole("heading", { name: "ล็อกเป้าหมายของคุณ" })
  ).toBeVisible();
});

test("links a persisted mission plan to the My Path dashboard", async () => {
  window.localStorage.setItem("passionseed_my_path_wizard_step_v1", "4");
  renderWizard(true, true);

  expect(
    await screen.findByRole("link", { name: "ไปดู My Path ของฉัน" })
  ).toHaveAttribute("href", "/me#my-path");
});

test("discloses the trial terms before launch and only links to the confirmed enrollment", async () => {
  (global.fetch as jest.Mock).mockImplementation(
    async (input: RequestInfo | URL) => {
      if (String(input) === "/api/trials") {
        return {
          ok: true,
          json: async () => ({
            payToken: "0123456789abcdef0123456789abcdef",
            payUrl: "/pay/0123456789abcdef0123456789abcdef",
            status: "active",
            paymentDeadline: "2099-07-23T12:00:00.000Z",
            enrollmentId: "enrollment-123",
            enrollmentUrl: "/seeds/pathlab/enrollment-123?day=1",
          }),
        };
      }
      return { ok: true, json: async () => ({}) };
    }
  );
  renderWizard(true);

  fireEvent.click(
    await screen.findByRole("button", { name: "เริ่มออกแบบชีวิต" })
  );
  fireEvent.click(screen.getByRole("button", { name: /AI Engineer/ }));
  fireEvent.click(screen.getByRole("button", { name: "ถัดไป" }));
  fireEvent.click(screen.getAllByRole("button", { name: "เลือกอันนี้" })[0]);
  fireEvent.click(screen.getByRole("button", { name: "ถัดไป" }));
  fireEvent.click(screen.getByRole("radio", { name: /เข้ามหาวิทยาลัย/ }));
  fireEvent.click(screen.getByRole("button", { name: "ดูแผนของฉัน" }));

  expect(
    screen.getByRole("button", {
      name: "เริ่มวันแรกก่อนได้ — ยังไม่ต้องจ่ายตอนนี้",
    })
  ).toBeVisible();
  expect(screen.getByText(/ทดลองครบ PathLab ฿1,490/)).toBeVisible();
  expect(screen.getByText(/ส่งให้ผู้ปกครองชำระภายใน 24 ชม/)).toBeVisible();
  expect(screen.getByText(/ไม่มีการตัดเงินอัตโนมัติ/)).toBeVisible();
  expect(
    screen.queryByText("ลิงก์ชำระเงินสำหรับผู้ปกครอง")
  ).not.toBeInTheDocument();

  fireEvent.click(
    screen.getByRole("button", {
      name: "เริ่มวันแรกก่อนได้ — ยังไม่ต้องจ่ายตอนนี้",
    })
  );

  expect(await screen.findByText("ลิงก์ชำระเงินสำหรับผู้ปกครอง")).toBeVisible();
  expect(screen.getByRole("dialog")).toHaveAccessibleDescription(
    /ไม่มีบัตรและไม่มีการตัดเงินอัตโนมัติ/
  );
  expect(screen.getByRole("button", { name: "ปิดหน้าต่าง" })).toHaveClass(
    "min-h-12",
    "min-w-12"
  );
  expect(screen.getByText(/แผน My Path ของคุณยังอยู่ครบ/)).toBeVisible();
  expect(
    screen.getByRole("link", { name: "เริ่ม PathLab เลย" })
  ).toHaveAttribute("href", "/seeds/pathlab/enrollment-123?day=1");
});

test("persists My Path before creating a trial and enrollment", async () => {
  (global.fetch as jest.Mock).mockImplementation(async (input: RequestInfo | URL) => {
    const url = String(input);
    if (url === "/api/trials") {
      return {
        ok: true,
        json: async () => ({
          payToken: "0123456789abcdef0123456789abcdef",
          payUrl: "/pay/0123456789abcdef0123456789abcdef",
          status: "active",
          paymentDeadline: "2099-07-23T12:00:00.000Z",
          enrollmentId: "enrollment-123",
          enrollmentUrl: "/seeds/pathlab/enrollment-123?day=1",
        }),
      };
    }
    return { ok: true, json: async () => ({}) };
  });
  renderWizard(true);
  fireEvent.click(await screen.findByRole("button", { name: "เริ่มออกแบบชีวิต" }));
  fireEvent.click(screen.getByRole("button", { name: /AI Engineer/ }));
  fireEvent.click(screen.getByRole("button", { name: "ถัดไป" }));
  fireEvent.click(screen.getAllByRole("button", { name: "เลือกอันนี้" })[0]);
  fireEvent.click(screen.getByRole("button", { name: "ถัดไป" }));
  fireEvent.click(screen.getByRole("radio", { name: /เข้ามหาวิทยาลัย/ }));
  fireEvent.click(screen.getByRole("button", { name: "ดูแผนของฉัน" }));
  (global.fetch as jest.Mock).mockClear();

  fireEvent.click(
    screen.getByRole("button", {
      name: "เริ่มวันแรกก่อนได้ — ยังไม่ต้องจ่ายตอนนี้",
    })
  );
  await screen.findByText("ลิงก์ชำระเงินสำหรับผู้ปกครอง");

  const urls = (global.fetch as jest.Mock).mock.calls.map(([url]) => String(url));
  const saveIndex = urls.indexOf("/api/my-path");
  const trialIndex = urls.indexOf("/api/trials");
  expect(saveIndex).toBeGreaterThanOrEqual(0);
  expect(trialIndex).toBeGreaterThan(saveIndex);
});

test("blocks trial launch when the durable My Path save fails", async () => {
  (global.fetch as jest.Mock).mockImplementation(async (input: RequestInfo | URL) => {
    if (String(input) === "/api/my-path") return { ok: false };
    return { ok: true, json: async () => ({}) };
  });
  renderWizard(true);
  fireEvent.click(await screen.findByRole("button", { name: "เริ่มออกแบบชีวิต" }));
  fireEvent.click(screen.getByRole("button", { name: /AI Engineer/ }));
  fireEvent.click(screen.getByRole("button", { name: "ถัดไป" }));
  fireEvent.click(screen.getAllByRole("button", { name: "เลือกอันนี้" })[0]);
  fireEvent.click(screen.getByRole("button", { name: "ถัดไป" }));
  fireEvent.click(screen.getByRole("radio", { name: /เข้ามหาวิทยาลัย/ }));
  fireEvent.click(screen.getByRole("button", { name: "ดูแผนของฉัน" }));
  (global.fetch as jest.Mock).mockClear();

  fireEvent.click(
    screen.getByRole("button", {
      name: "เริ่มวันแรกก่อนได้ — ยังไม่ต้องจ่ายตอนนี้",
    })
  );

  expect(await screen.findByRole("heading", { name: "เปิดการทดลองไม่สำเร็จ" })).toBeVisible();
  expect(global.fetch).not.toHaveBeenCalledWith(
    "/api/trials",
    expect.anything()
  );
});

test("dismissal invalidates an in-flight launch and rapid clicks do not duplicate it", async () => {
  let resolveTrial!: (value: {
    ok: boolean;
    json: () => Promise<Record<string, string>>;
  }) => void;
  const trialResponse = new Promise<{
    ok: boolean;
    json: () => Promise<Record<string, string>>;
  }>((resolve) => {
    resolveTrial = resolve;
  });
  (global.fetch as jest.Mock).mockImplementation((input: RequestInfo | URL) => {
    if (String(input) === "/api/trials") return trialResponse;
    return Promise.resolve({ ok: true, json: async () => ({}) });
  });

  renderWizard(true);
  fireEvent.click(await screen.findByRole("button", { name: "เริ่มออกแบบชีวิต" }));
  fireEvent.click(screen.getByRole("button", { name: /AI Engineer/ }));
  fireEvent.click(screen.getByRole("button", { name: "ถัดไป" }));
  fireEvent.click(screen.getAllByRole("button", { name: "เลือกอันนี้" })[0]);
  fireEvent.click(screen.getByRole("button", { name: "ถัดไป" }));
  fireEvent.click(screen.getByRole("radio", { name: /เข้ามหาวิทยาลัย/ }));
  fireEvent.click(screen.getByRole("button", { name: "ดูแผนของฉัน" }));
  (global.fetch as jest.Mock).mockClear();

  const launchButton = screen.getByRole("button", {
    name: "เริ่มวันแรกก่อนได้ — ยังไม่ต้องจ่ายตอนนี้",
  });
  fireEvent.click(launchButton);
  fireEvent.click(launchButton);

  await waitFor(() => {
    expect(
      (global.fetch as jest.Mock).mock.calls.filter(
        ([url]) => String(url) === "/api/trials"
      )
    ).toHaveLength(1);
  });
  fireEvent.click(screen.getByRole("button", { name: "ปิดหน้าต่าง" }));
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

  await act(async () => {
    resolveTrial({
      ok: true,
      json: async () => ({
        payToken: "0123456789abcdef0123456789abcdef",
        payUrl: "/pay/0123456789abcdef0123456789abcdef",
        status: "active",
        paymentDeadline: "2099-07-23T12:00:00.000Z",
        enrollmentId: "enrollment-123",
        enrollmentUrl: "/seeds/pathlab/enrollment-123?day=1",
      }),
    });
    await trialResponse;
  });

  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
});

test("routes a reused expired trial to payment recovery instead of locked enrollment", async () => {
  (global.fetch as jest.Mock).mockImplementation(
    async (input: RequestInfo | URL) => {
      if (String(input) === "/api/trials") {
        return {
          ok: true,
          json: async () => ({
            payToken: "0123456789abcdef0123456789abcdef",
            payUrl: "/pay/0123456789abcdef0123456789abcdef",
            status: "expired",
            paymentDeadline: "2026-07-21T12:00:00.000Z",
            enrollmentId: "enrollment-123",
            enrollmentUrl: "/seeds/pathlab/enrollment-123?day=1",
          }),
        };
      }
      return { ok: true, json: async () => ({}) };
    }
  );
  renderWizard(true);
  fireEvent.click(await screen.findByRole("button", { name: "เริ่มออกแบบชีวิต" }));
  fireEvent.click(screen.getByRole("button", { name: /AI Engineer/ }));
  fireEvent.click(screen.getByRole("button", { name: "ถัดไป" }));
  fireEvent.click(screen.getAllByRole("button", { name: "เลือกอันนี้" })[0]);
  fireEvent.click(screen.getByRole("button", { name: "ถัดไป" }));
  fireEvent.click(screen.getByRole("radio", { name: /เข้ามหาวิทยาลัย/ }));
  fireEvent.click(screen.getByRole("button", { name: "ดูแผนของฉัน" }));
  fireEvent.click(
    screen.getByRole("button", {
      name: "เริ่มวันแรกก่อนได้ — ยังไม่ต้องจ่ายตอนนี้",
    })
  );

  expect(
    await screen.findByRole("heading", { name: "ช่วงทดลอง 24 ชั่วโมงครบแล้ว" })
  ).toBeVisible();
  expect(
    screen.getByRole("link", { name: "ดูหน้าชำระเพื่อเปิดสิทธิ์ต่อ" })
  ).toHaveAttribute("href", "/pay/0123456789abcdef0123456789abcdef");
  expect(
    screen.queryByRole("link", { name: "เริ่ม PathLab เลย" })
  ).not.toBeInTheDocument();
});
