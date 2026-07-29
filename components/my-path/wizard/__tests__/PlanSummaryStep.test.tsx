import { fireEvent, render, screen } from "@testing-library/react";
import { PlanSummaryStep } from "../steps/PlanSummaryStep";

describe("PlanSummaryStep Component", () => {
  const defaultHandsOnProps = {
    readiness: "hands_on" as const,
    selectedCareer: { titleTh: "ซอฟต์แวร์แรร์", slug: "tech" },
    selectedSeed: { title: "App Prototyping" },
    timeline: "3 เดือน",
  };

  it("renders ProjectSeed offer card and LINE OA button for hands_on readiness", () => {
    render(<PlanSummaryStep {...defaultHandsOnProps} />);

    // Renders ProjectSeed heading & price
    expect(screen.getByText(/ProjectSeed/i)).toBeInTheDocument();
    expect(screen.getByText(/2,990฿/i)).toBeInTheDocument();

    // Renders key features
    expect(
      screen.getByText(/Shipped TCAS portfolio project|ผลงาน TCAS Round 1 ส่งได้จริง/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Real user interviews guarantee|การันตีสัมภาษณ์ผู้ใช้จริง/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Alumni mentors|เมนทอร์รุ่นพี่/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Community access|คอมมูนิตี้ผู้สร้าง/i)
    ).toBeInTheDocument();

    // Primary CTA button text
    const ctaButton = screen.getByRole("link", {
      name: /ส่ง Plan ให้พี่ๆ ช่วยดูฟรี บน LINE OA/i,
    });
    expect(ctaButton).toBeInTheDocument();
  });

  it("generates correct pre-filled LINE OA deep link for hands_on readiness", () => {
    render(<PlanSummaryStep {...defaultHandsOnProps} />);

    const ctaLink = screen.getByRole("link", {
      name: /ส่ง Plan ให้พี่ๆ ช่วยดูฟรี บน LINE OA/i,
    });
    const href = ctaLink.getAttribute("href");

    expect(href).toContain("https://line.me/R/oaMessage/@passionseed/?");
    
    // Decoded message assertions
    const decodedMessage = decodeURIComponent(href || "");
    expect(decodedMessage).toContain("สวัสดีครับ/ค่ะ!");
    expect(decodedMessage).toContain("🎯 สายงาน: ซอฟต์แวร์แรร์");
    expect(decodedMessage).toContain("🚀 โปรเจกต์: App Prototyping");
    expect(decodedMessage).toContain("⏱️ ไทม์ไลน์: 3 เดือน");
    expect(decodedMessage).toContain("อยากสอบถามเรื่องเข้าร่วม ProjectSeed (2,990฿) ครับ");
  });

  it("renders Career Exploration CTA card for exploration readiness", () => {
    render(
      <PlanSummaryStep
        readiness="exploration"
        selectedCareer={{ titleTh: "ซอฟต์แวร์แรร์", slug: "tech" }}
      />
    );

    expect(
      screen.getByText(/คุยกับพี่ๆ ช่วยค้นหาทิศทางฟรี บน LINE OA/i)
    ).toBeInTheDocument();

    const ctaLink = screen.getByRole("link", {
      name: /คุยกับพี่ๆ ช่วยค้นหาทิศทางฟรี บน LINE OA/i,
    });
    const href = ctaLink.getAttribute("href");

    expect(href).toContain("https://line.me/R/oaMessage/@passionseed/?");
    const decodedMessage = decodeURIComponent(href || "");
    expect(decodedMessage).toContain("Career Exploration");
  });

  it("applies dawn-theme container and ei-card styles", () => {
    const { container } = render(<PlanSummaryStep {...defaultHandsOnProps} />);

    const mainContainer = container.firstChild as HTMLElement;
    expect(mainContainer).toHaveClass("dawn-theme");

    const cards = container.querySelectorAll(".ei-card");
    expect(cards.length).toBeGreaterThanOrEqual(1);
  });

  it("triggers onBook callback when CTA is clicked", () => {
    const onBook = jest.fn();
    render(<PlanSummaryStep {...defaultHandsOnProps} onBook={onBook} />);

    const ctaLink = screen.getByRole("link", {
      name: /ส่ง Plan ให้พี่ๆ ช่วยดูฟรี บน LINE OA/i,
    });
    fireEvent.click(ctaLink);

    expect(onBook).toHaveBeenCalled();
  });
});
