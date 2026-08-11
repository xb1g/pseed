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

    expect(screen.getByText("เริ่มทำโปรเจคลงลึก")).toBeInTheDocument();
    expect(
      screen.getByText(
        "มีเป้าหมายชัดเจน อยากทำโปรเจกต์จริงลงลึก พร้อมส่งพอร์ต TCAS"
      )
    ).toBeInTheDocument();

    expect(screen.getByText("รับงานจริงจากพาร์ตเนอร์")).toBeInTheDocument();
    expect(
      screen.getByText(
        "สมัครเป็น Talent สร้างโปรไฟล์ รับงานฟรีแลนซ์/งานจริงจากพาร์ตเนอร์ในอุตสาหกรรม"
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
      name: /เริ่มทำโปรเจคลงลึก/i,
    });
    fireEvent.click(handsOnRadio);
    expect(handleChange).toHaveBeenCalledWith("hands_on");

    const talentRadio = screen.getByRole("radio", {
      name: /รับงานจริงจากพาร์ตเนอร์/i,
    });
    fireEvent.click(talentRadio);
    expect(handleChange).toHaveBeenCalledWith("talent");
  });

  it("marks the selected option correctly with aria-checked", () => {
    const { rerender } = render(
      <ReadinessStep value="exploration" onChange={() => {}} />
    );

    const explorationRadio = screen.getByRole("radio", {
      name: /ค้นหาทิศทางก่อน/i,
    });
    const handsOnRadio = screen.getByRole("radio", {
      name: /เริ่มทำโปรเจคลงลึก/i,
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
