import { render, screen } from "@testing-library/react";

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
});

test("leads with the child's choice, connection, outcomes, and full price before payment mechanics", () => {
  const { container } = render(<PayPageClient {...props} />);

  expect(
    screen.getByRole("heading", { name: "AI Product Builder PathLab" })
  ).toBeVisible();
  expect(screen.getByText(/เชื่อมกับทิศ AI Product Manager/)).toBeVisible();
  expect(screen.getByText(/ลงมือทำจริง 5 วัน/)).toBeVisible();
  expect(screen.getByText("ผลงานจริงที่ใช้เป็นหลักฐานได้")).toBeVisible();
  expect(
    screen.getByText("สัญญาณความเหมาะกับสายอาชีพที่ชัดขึ้น")
  ).toBeVisible();
  expect(screen.getByText("สรุปความคืบหน้าสำหรับครอบครัว")).toBeVisible();
  expect(
    screen.getByText(/เครดิตเต็มจำนวน.*Admission Evidence Sprint/)
  ).toBeVisible();
  expect(screen.getByText("฿1,490")).toBeVisible();
  expect(screen.getByRole("link", { name: "ดูวิธีชำระ" })).toHaveAttribute(
    "href",
    "#payment"
  );

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

test("uses an honest fallback when no Radar direction is available and protects private reflection content", () => {
  render(<PayPageClient {...props} radarDirectionTitle={null} />);

  expect(screen.getByText(/เลือกไว้เป็นส่วนหนึ่งของ My Path/)).toBeVisible();
  expect(
    screen.getByText(/ไม่ส่งคำตอบส่วนตัว บันทึกสะท้อนคิด แชต หรือโน้ต/)
  ).toBeVisible();
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
});
