import { fireEvent, render, screen } from "@testing-library/react";
import { FeedbackChoice } from "./FeedbackChoice";
import { FeedbackRating } from "./FeedbackRating";
import { FeedbackSection } from "./FeedbackSection";
import { FeedbackSuccessState } from "./FeedbackSuccessState";
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

  it("confirms a successful submission and gives clear next actions", () => {
    const onDashboard = jest.fn();
    const onEdit = jest.fn();

    render(
      <FeedbackSuccessState
        wantsContact
        hasFollowUpInterests
        onDashboard={onDashboard}
        onEdit={onEdit}
      />
    );

    expect(
      screen.getByRole("heading", { name: "ขอบคุณ เราได้รับฟีดแบ็กแล้ว" })
    ).toBeVisible();
    expect(screen.getByText(/ทีม PassionSeed จะติดต่อกลับ/)).toBeVisible();
    expect(screen.getByText(/โอกาสที่คุณสนใจ/)).toBeVisible();

    fireEvent.click(
      screen.getByRole("button", { name: "กลับไป Dashboard" })
    );
    fireEvent.click(screen.getByRole("button", { name: "แก้ไขคำตอบ" }));

    expect(onDashboard).toHaveBeenCalledTimes(1);
    expect(onEdit).toHaveBeenCalledTimes(1);
  });
});
