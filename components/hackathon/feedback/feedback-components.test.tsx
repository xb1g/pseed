import { fireEvent, render, screen } from "@testing-library/react";
import { FeedbackChoice } from "./FeedbackChoice";
import { FeedbackRating } from "./FeedbackRating";
import { FeedbackSection } from "./FeedbackSection";
import { FollowUpOpportunity } from "./FollowUpOpportunity";

describe("hackathon feedback components", () => {
  it("exposes selected choices with aria-pressed", () => {
    render(
      <FeedbackChoice selected onClick={() => undefined}>
        ทักษะใหม่
      </FeedbackChoice>
    );

    expect(
      screen.getByRole("button", { name: "ทักษะใหม่" })
    ).toHaveAttribute("aria-pressed", "true");
  });

  it("renders five rating buttons and reports the chosen value", () => {
    const onChange = jest.fn();
    render(
      <FeedbackRating
        label="คะแนนโครงการ"
        value={0}
        onChange={onChange}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "5 ดีมาก" }));
    expect(onChange).toHaveBeenCalledWith(5);
  });

  it("renders section orientation and an opportunity's concrete benefits", () => {
    render(
      <FeedbackSection
        eyebrow="ช่วงที่ 3 จาก 3"
        title="ก้าวต่อไป"
        description="เลือกเฉพาะสิ่งที่มีประโยชน์กับคุณ"
      >
        <FollowUpOpportunity
          selected={false}
          title="พาโปรเจกต์ไปทดลองจริง"
          outcome="เปลี่ยนไอเดียให้เป็นการทดลองกับผู้ใช้"
          benefit="ได้แผนขั้นต่อไป + mentor checkpoint"
          onClick={() => undefined}
        />
      </FeedbackSection>
    );

    expect(screen.getByRole("heading", { name: "ก้าวต่อไป" })).toBeVisible();
    expect(
      screen.getByText("ได้แผนขั้นต่อไป + mentor checkpoint")
    ).toBeVisible();
  });
});
