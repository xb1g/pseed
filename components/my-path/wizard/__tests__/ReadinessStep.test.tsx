import { fireEvent, render, screen } from "@testing-library/react";
import { ReadinessStep } from "../steps/ReadinessStep";

describe("ReadinessStep Component", () => {
  it("renders heading and both readiness level options", () => {
    render(<ReadinessStep onChange={() => {}} />);

    expect(
      screen.getByRole("heading", {
        name: /ตอนนี้คุณอยู่ในช่วงไหนของการเรียนรู้\?/i,
      })
    ).toBeInTheDocument();

    expect(screen.getByText("ค้นหาทิศทางก่อน")).toBeInTheDocument();
    expect(
      screen.getByText("ยังไม่แน่ใจ อยากลองค้นหาสำรวจสายอาชีพก่อน")
    ).toBeInTheDocument();

    expect(screen.getByText("พร้อมลงมือทำโปรเจกต์")).toBeInTheDocument();
    expect(
      screen.getByText(
        "มีเป้าหมายชัดเจน อยากทำโปรเจกต์จริงพร้อมส่งพอร์ต TCAS - ProjectSeed 2,990฿"
      )
    ).toBeInTheDocument();
  });

  it("calls onChange when an option is selected", () => {
    const handleChange = jest.fn();
    render(<ReadinessStep onChange={handleChange} />);

    const explorationRadio = screen.getByRole("radio", {
      name: /ค้นหาทิศทางก่อน/i,
    });
    fireEvent.click(explorationRadio);
    expect(handleChange).toHaveBeenCalledWith("exploration");

    const handsOnRadio = screen.getByRole("radio", {
      name: /พร้อมลงมือทำโปรเจกต์/i,
    });
    fireEvent.click(handsOnRadio);
    expect(handleChange).toHaveBeenCalledWith("hands_on");
  });

  it("marks the selected option correctly with aria-checked", () => {
    const { rerender } = render(
      <ReadinessStep value="exploration" onChange={() => {}} />
    );

    const explorationRadio = screen.getByRole("radio", {
      name: /ค้นหาทิศทางก่อน/i,
    });
    const handsOnRadio = screen.getByRole("radio", {
      name: /พร้อมลงมือทำโปรเจกต์/i,
    });

    expect(explorationRadio).toHaveAttribute("aria-checked", "true");
    expect(handsOnRadio).toHaveAttribute("aria-checked", "false");

    rerender(<ReadinessStep value="hands_on" onChange={() => {}} />);

    expect(explorationRadio).toHaveAttribute("aria-checked", "false");
    expect(handsOnRadio).toHaveAttribute("aria-checked", "true");
  });

  it("applies dawn-theme and ei-card CSS classes", () => {
    const { container } = render(<ReadinessStep onChange={() => {}} />);

    const section = container.querySelector("section");
    expect(section).toHaveClass("dawn-theme");

    const cards = container.querySelectorAll(".ei-card");
    expect(cards.length).toBeGreaterThanOrEqual(2);
  });
});
