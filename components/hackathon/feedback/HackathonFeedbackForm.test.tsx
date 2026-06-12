import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { HackathonFeedbackForm } from "./HackathonFeedbackForm";

class IntersectionObserverMock {
  observe() {}
  disconnect() {}
}

describe("HackathonFeedbackForm", () => {
  beforeEach(() => {
    Object.defineProperty(window, "IntersectionObserver", {
      writable: true,
      value: IntersectionObserverMock,
    });
    Object.defineProperty(window, "scrollTo", {
      writable: true,
      value: jest.fn(),
    });
  });

  function renderForm() {
    return render(
      <HackathonFeedbackForm
        participantName="แพรว"
        participantGrade="ปริญญาตรี"
        alreadySubmitted={false}
        isSubmitting={false}
        onSubmit={jest.fn()}
      />
    );
  }

  function renderFuturePathForm() {
    return render(
      <HackathonFeedbackForm
        participantName="มิน"
        participantGrade="ม.5"
        alreadySubmitted={false}
        isSubmitting={false}
        onSubmit={jest.fn()}
      />
    );
  }

  it("opens a text field when a participant selects other", () => {
    renderForm();

    fireEvent.click(screen.getByRole("button", { name: "อื่น ๆ" }));

    expect(
      screen.getByPlaceholderText("พิมพ์สิ่งที่คุณได้รับ...")
    ).toBeVisible();
  });

  it("does not ask for a mentorship rating when mentorship was not received", async () => {
    renderForm();

    fireEvent.click(screen.getByRole("button", { name: "5 ดีมาก" }));
    fireEvent.click(screen.getByRole("button", { name: "ทักษะใหม่" }));
    fireEvent.click(screen.getByRole("button", { name: "มากขึ้น" }));
    fireEvent.click(screen.getByRole("button", { name: "ต่อไป" }));

    fireEvent.click(
      await screen.findByRole("button", {
        name: "ไม่ได้คุย หรือไม่มี Mentorship",
      })
    );

    expect(
      screen.queryByText("Mentorship ที่ได้รับมีประโยชน์แค่ไหน?")
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", {
        name: "ไม่ได้คุย หรือไม่มี Mentorship",
      })
    ).toHaveAttribute("aria-pressed", "true");
  });

  it("asks younger students which product experience they want first", async () => {
    renderFuturePathForm();

    fireEvent.click(screen.getByRole("button", { name: "5 ดีมาก" }));
    fireEvent.click(screen.getByRole("button", { name: "ทักษะใหม่" }));
    fireEvent.click(screen.getByRole("button", { name: "มากขึ้น" }));
    fireEvent.click(screen.getByRole("button", { name: "ต่อไป" }));

    fireEvent.click(
      await screen.findByRole("button", {
        name: "ไม่ได้คุย หรือไม่มี Mentorship",
      })
    );
    fireEvent.click(screen.getByRole("button", { name: "ยังเป็นไอเดีย" }));
    fireEvent.click(screen.getByRole("button", { name: "ใช่ อยากไปต่อ" }));
    fireEvent.click(screen.getByRole("button", { name: "5 ดีมาก" }));
    fireEvent.click(
      screen.getByRole("button", { name: "ดีและใช้งานง่ายอยู่แล้ว" })
    );
    fireEvent.click(screen.getByRole("button", { name: "ต่อไป" }));

    await waitFor(() => {
      expect(
        screen.getByText("ถ้าเลือกได้ 1 อย่าง คุณอยากลองอะไรก่อน?")
      ).toBeVisible();
    });
    expect(
      screen.getByRole("button", { name: /ลองทำโปรเจกต์ 7 วัน/ })
    ).toBeVisible();

    fireEvent.click(
      screen.getByRole("button", { name: /ลองทำโปรเจกต์ 7 วัน/ })
    );

    await waitFor(() => {
      expect(
        screen.getByPlaceholderText(
          "เพราะอะไรตัวเลือกนี้ถึงน่าสนใจสำหรับคุณ?"
        )
      ).toBeVisible();
    });
  });

  it("does not add the product-priority question to the university version", async () => {
    renderForm();

    fireEvent.click(screen.getByRole("button", { name: "5 ดีมาก" }));
    fireEvent.click(screen.getByRole("button", { name: "ทักษะใหม่" }));
    fireEvent.click(screen.getByRole("button", { name: "มากขึ้น" }));
    fireEvent.click(screen.getByRole("button", { name: "ต่อไป" }));
    fireEvent.click(
      await screen.findByRole("button", {
        name: "ไม่ได้คุย หรือไม่มี Mentorship",
      })
    );
    fireEvent.click(screen.getByRole("button", { name: "ยังเป็นไอเดีย" }));
    fireEvent.click(screen.getByRole("button", { name: "ใช่ อยากไปต่อ" }));
    fireEvent.click(screen.getByRole("button", { name: "5 ดีมาก" }));
    fireEvent.click(
      screen.getByRole("button", { name: "ดีและใช้งานง่ายอยู่แล้ว" })
    );
    fireEvent.click(screen.getByRole("button", { name: "ต่อไป" }));

    expect(
      screen.queryByText("ถ้าเลือกได้ 1 อย่าง คุณอยากลองอะไรก่อน?")
    ).not.toBeInTheDocument();
  });
});
