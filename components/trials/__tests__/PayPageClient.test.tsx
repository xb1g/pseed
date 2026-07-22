import fs from "node:fs";
import path from "node:path";

import { act, fireEvent, render, screen, within } from "@testing-library/react";

import { PayPageClient } from "../PayPageClient";

const props = {
  token: "0123456789abcdef0123456789abcdef",
  initialStatus: "active" as const,
  priceAmount: 1490,
  paymentDeadline: "2099-07-23T12:00:00.000Z",
  seedTitle: "AI Product Builder PathLab",
  seedDescription: "ทดลองออกแบบและสร้าง AI product จากโจทย์จริง",
  totalDays: 5,
  radarDirectionTitle: "AI Product Manager",
  outcomes: [
    "ผลงานจริงที่ใช้เป็นหลักฐานได้",
    "สัญญาณความเหมาะกับสายอาชีพที่ชัดขึ้น",
    "สรุปความคืบหน้าสำหรับครอบครัว",
  ],
};

beforeEach(() => {
  global.fetch = jest.fn();
  global.IntersectionObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof IntersectionObserver;
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    value: jest.fn().mockReturnValue({ matches: false }),
  });
  Object.defineProperty(URL, "createObjectURL", {
    configurable: true,
    value: jest.fn().mockReturnValue("blob:slip-preview"),
  });
  Object.defineProperty(URL, "revokeObjectURL", {
    configurable: true,
    value: jest.fn(),
  });
});

afterEach(() => {
  jest.useRealTimers();
});

test("leads with the child's choice, honest context, outcomes, and full price before payment mechanics", () => {
  const { container } = render(<PayPageClient {...props} />);

  const firstViewport = container.querySelector("[data-mobile-first-viewport]");
  expect(firstViewport).not.toBeNull();

  expect(
    within(firstViewport as HTMLElement).getByRole("heading", {
      name: "AI Product Builder PathLab",
    })
  ).toHaveClass("line-clamp-2");
  expect(
    within(firstViewport as HTMLElement).getByText(
      /ทดลองลงมือทำจริง ก่อนตัดสินใจเรื่องเส้นทางต่อไป/
    )
  ).toBeVisible();
  expect(firstViewport).not.toHaveTextContent("AI Product Manager");
  expect(
    within(firstViewport as HTMLElement).getByText(
      "ผลงานจริงที่ใช้เป็นหลักฐานได้"
    )
  ).toBeVisible();
  expect(
    within(firstViewport as HTMLElement).getByText(
      "สัญญาณความเหมาะกับสายอาชีพที่ชัดขึ้น"
    )
  ).toBeVisible();
  expect(
    within(firstViewport as HTMLElement).getByText(
      "สรุปความคืบหน้าสำหรับครอบครัว"
    )
  ).toBeVisible();
  expect(within(firstViewport as HTMLElement).getByText("฿1,490")).toBeVisible();
  expect(
    within(firstViewport as HTMLElement).getByRole("link", {
      name: "ดูวิธีชำระ",
    })
  ).toHaveAttribute("href", "#payment");
  expect(firstViewport).not.toHaveTextContent(props.seedDescription);
  expect(firstViewport).not.toHaveTextContent("Admission Evidence Sprint");
  expect(firstViewport!.querySelectorAll("li")).toHaveLength(3);
  for (const outcome of firstViewport!.querySelectorAll("li span")) {
    expect(outcome).toHaveClass("line-clamp-2");
  }
  expect(firstViewport!.textContent!.length).toBeLessThanOrEqual(430);

  expect(screen.getByText(/ลงมือทำจริง 5 วัน/)).toBeVisible();
  expect(
    screen.getByText(/เครดิตเต็มจำนวน.*Admission Evidence Sprint/)
  ).toBeVisible();

  const valueStory = container.querySelector("[data-parent-value-story]");
  const updates = container.querySelector("[data-parent-updates]");
  const payment = container.querySelector("#payment");
  expect(valueStory).not.toBeNull();
  expect(updates).not.toBeNull();
  expect(payment).not.toBeNull();
  expect(
    valueStory!.compareDocumentPosition(updates!) &
      Node.DOCUMENT_POSITION_FOLLOWING
  ).toBeTruthy();
  expect(
    updates!.compareDocumentPosition(payment!) &
      Node.DOCUMENT_POSITION_FOLLOWING
  ).toBeTruthy();
});

test("uses honest generic PathLab context and protects private reflection content", () => {
  render(<PayPageClient {...props} />);

  expect(
    screen.getByText(/ทดลองลงมือทำจริง ก่อนตัดสินใจเรื่องเส้นทางต่อไป/)
  ).toBeVisible();
  expect(
    screen.getAllByText(/ไม่ส่งคำตอบส่วนตัว บันทึกสะท้อนคิด แชต หรือโน้ต/)
  ).not.toHaveLength(0);
});

test("preserves the PromptPay and slip upload flow below the value story", () => {
  render(<PayPageClient {...props} />);

  expect(
    screen.getByRole("heading", { name: "สแกนเพื่อชำระผ่าน PromptPay" })
  ).toBeVisible();
  expect(screen.getByLabelText("เลือกรูปสลิปการโอน")).toBeInTheDocument();
  expect(
    screen.getByRole("button", { name: /แตะเพื่อเลือกรูปสลิป/ })
  ).toBeVisible();
  expect(screen.getByRole("heading", { name: "คำถามที่ผู้ปกครองมักถาม" })).toBeVisible();
  expect(screen.getByText(/ใช้เวลาเท่าไร/)).toBeVisible();
  expect(screen.getByText(/ข้อมูลอะไรที่ครอบครัวจะได้รับ/)).toBeVisible();
  expect(screen.getByText(/ถ้าเลย 24 ชั่วโมง/)).toBeVisible();
  expect(screen.getByText(/หลังทำจบจะเกิดอะไรขึ้น/)).toBeVisible();
});

test("applies and removes Dawn in-view states on touch devices", () => {
  let callback: IntersectionObserverCallback = () => undefined;
  const observe = jest.fn();
  const disconnect = jest.fn();
  global.IntersectionObserver = jest.fn((nextCallback) => {
    callback = nextCallback;
    return { observe, disconnect, unobserve: jest.fn(), takeRecords: jest.fn(), root: null, rootMargin: "", thresholds: [] };
  }) as unknown as typeof IntersectionObserver;
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    value: jest.fn().mockReturnValue({ matches: true }),
  });

  const { container, unmount } = render(<PayPageClient {...props} />);
  const card = container.querySelector(".ei-card") as HTMLElement;
  expect(observe).toHaveBeenCalledWith(card);

  callback(
    [
      { target: card, isIntersecting: true } as unknown as IntersectionObserverEntry,
    ],
    {} as IntersectionObserver
  );
  expect(card).toHaveClass("in-view");
  callback(
    [
      { target: card, isIntersecting: false } as unknown as IntersectionObserverEntry,
    ],
    {} as IntersectionObserver
  );
  expect(card).not.toHaveClass("in-view");

  unmount();
  expect(disconnect).toHaveBeenCalled();
});

test("the parent-page logo link is a 48px touch target", () => {
  const source = fs.readFileSync(
    path.join(process.cwd(), "app/pay/[token]/page.tsx"),
    "utf8"
  );
  expect(source).toMatch(/href="\/"[\s\S]{0,120}min-h-12[\s\S]{0,80}min-w-12/);
});

test("moves the live page into expired recovery when its deadline passes", () => {
  jest.useFakeTimers();
  jest.setSystemTime(new Date("2026-07-22T12:00:00.000Z"));
  render(
    <PayPageClient
      {...props}
      paymentDeadline="2026-07-22T12:00:01.000Z"
    />
  );

  expect(screen.getByText("ภายใน 24 ชม.")).toBeVisible();
  act(() => jest.advanceTimersByTime(1_100));

  expect(screen.getByText(/เลยกำหนด 24 ชม. แล้ว/)).toBeVisible();
  expect(screen.queryByText("ภายใน 24 ชม.")).not.toBeInTheDocument();
});

test("validates slip type and size before upload", () => {
  render(<PayPageClient {...props} />);
  const input = screen.getByLabelText("เลือกรูปสลิปการโอน");

  fireEvent.change(input, {
    target: { files: [new File(["not an image"], "slip.txt", { type: "text/plain" })] },
  });
  expect(screen.getByRole("alert")).toHaveTextContent("ไฟล์รูปภาพ");

  const oversized = new File(["image"], "large.png", { type: "image/png" });
  Object.defineProperty(oversized, "size", { value: 5 * 1024 * 1024 + 1 });
  fireEvent.change(input, { target: { files: [oversized] } });
  expect(screen.getByRole("alert")).toHaveTextContent("ไฟล์ใหญ่เกิน 5MB");
  expect(global.fetch).not.toHaveBeenCalled();
});

test("shows upload failure and allows a successful retry into pending", async () => {
  (global.fetch as jest.Mock)
    .mockResolvedValueOnce({ ok: false, status: 500 })
    .mockResolvedValueOnce({ ok: true, status: 200 });
  render(<PayPageClient {...props} />);
  fireEvent.change(screen.getByLabelText("เลือกรูปสลิปการโอน"), {
    target: {
      files: [new File(["image"], "slip.png", { type: "image/png" })],
    },
  });

  fireEvent.click(screen.getByRole("button", { name: "ส่งสลิปยืนยันการชำระ" }));
  expect(await screen.findByRole("alert")).toHaveTextContent(
    "อัปโหลดสลิปไม่สำเร็จ"
  );
  fireEvent.click(screen.getByRole("button", { name: "ส่งสลิปยืนยันการชำระ" }));

  expect(
    await screen.findByRole("heading", { name: "ได้รับสลิปแล้ว กำลังตรวจสอบ" })
  ).toBeVisible();
  expect(
    screen.getByRole("heading", {
      name: "รับอัปเดตความคืบหน้าแบบสั้น ๆ",
    })
  ).toBeVisible();
  expect(global.fetch).toHaveBeenCalledTimes(2);
});

test("treats an already-paid slip response as paid", async () => {
  (global.fetch as jest.Mock).mockResolvedValue({ ok: false, status: 409 });
  render(<PayPageClient {...props} />);
  fireEvent.change(screen.getByLabelText("เลือกรูปสลิปการโอน"), {
    target: {
      files: [new File(["image"], "slip.png", { type: "image/png" })],
    },
  });
  fireEvent.click(screen.getByRole("button", { name: "ส่งสลิปยืนยันการชำระ" }));

  expect(
    await screen.findByRole("heading", { name: "ชำระเรียบร้อย ขอบคุณครับ/ค่ะ" })
  ).toBeVisible();
  expect(
    screen.getByRole("heading", {
      name: "รับอัปเดตความคืบหน้าแบบสั้น ๆ",
    })
  ).toBeVisible();
});

test.each([
  ["pending", "ได้รับสลิปแล้ว กำลังตรวจสอบ"],
  ["paid", "ชำระเรียบร้อย ขอบคุณครับ/ค่ะ"],
] as const)(
  "keeps parent update opt-in available for %s trials",
  (initialStatus, heading) => {
    render(<PayPageClient {...props} initialStatus={initialStatus} />);

    expect(screen.getByRole("heading", { name: heading })).toBeVisible();
    expect(
      screen.getByRole("heading", {
        name: "รับอัปเดตความคืบหน้าแบบสั้น ๆ",
      })
    ).toBeVisible();
  }
);
