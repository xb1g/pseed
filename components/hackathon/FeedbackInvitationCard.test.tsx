import { render, screen } from "@testing-library/react";
import { FeedbackInvitationCard } from "./FeedbackInvitationCard";

describe("FeedbackInvitationCard", () => {
  it("makes the unfinished feedback request concrete and low-friction", () => {
    render(<FeedbackInvitationCard status="pending" />);

    expect(
      screen.getByRole("heading", {
        name: "ประสบการณ์ของคุณ ควรเปลี่ยนอะไรต่อ?",
      })
    ).toBeVisible();
    expect(screen.getByText("ใช้เวลา 3–5 นาที")).toBeVisible();
    expect(screen.getByText("เนื้อหาในแอป")).toBeVisible();
    expect(screen.getByText(/ไม่ต้องกรอกข้อมูลส่วนตัวซ้ำ/)).toBeVisible();
    expect(
      screen.getByRole("link", { name: /แชร์ฟีดแบ็ก/ })
    ).toHaveAttribute("href", "/hackathon/feedback");
  });

  it("shows a quieter completed state with an edit action", () => {
    render(<FeedbackInvitationCard status="complete" />);

    expect(
      screen.getByRole("heading", { name: "ขอบคุณสำหรับฟีดแบ็ก" })
    ).toBeVisible();
    expect(
      screen.getByRole("link", { name: "ดูหรือแก้ไขคำตอบ" })
    ).toHaveAttribute("href", "/hackathon/feedback");
  });
});
