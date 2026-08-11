import { fireEvent, render, screen } from "@testing-library/react";
import { PlanSummaryStep } from "../steps/PlanSummaryStep";

describe("PlanSummaryStep Component", () => {
  const defaultHandsOnProps = {
    readiness: "hands_on" as const,
    selectedCareer: { titleTh: "ซอฟต์แวร์แรร์", slug: "tech" },
    selectedSeed: { title: "App Prototyping" },
    timeline: "3 เดือน",
  };

  it("renders ProjectSeed offer card and Calendly free consult button for hands_on readiness", () => {
    render(<PlanSummaryStep {...defaultHandsOnProps} />);

    // Renders ProjectSeed heading & free consult messaging (no price shown)
    expect(
      screen.getByRole("heading", { name: "ProjectSeed Program" })
    ).toBeInTheDocument();
    expect(screen.getByText("ปรึกษาฟรี")).toBeInTheDocument();
    expect(screen.queryByText(/2,990฿/i)).not.toBeInTheDocument();

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
      name: /จองคิวปรึกษาฟรี 30 นาที/i,
    });
    expect(ctaButton).toBeInTheDocument();
  });

  it("links the hands_on CTA to the Calendly free consult booking page", () => {
    render(<PlanSummaryStep {...defaultHandsOnProps} />);

    const ctaLink = screen.getByRole("link", {
      name: /จองคิวปรึกษาฟรี 30 นาที/i,
    });

    expect(ctaLink.getAttribute("href")).toBe(
      "https://calendly.com/seedpassion/30min"
    );
  });

  it("renders Talent signup card for talent readiness", () => {
    render(
      <PlanSummaryStep
        readiness="talent"
        selectedCareer={{ titleTh: "ซอฟต์แวร์แรร์", slug: "tech" }}
        selectedSeed={{ title: "App Prototyping" }}
      />
    );

    expect(
      screen.getByRole("heading", { name: "สร้างโปรไฟล์ Talent ของคุณ" })
    ).toBeInTheDocument();
    expect(screen.getByText("สมัครฟรี")).toBeInTheDocument();
    expect(screen.queryByText(/2,990฿/i)).not.toBeInTheDocument();

    const ctaLink = screen.getByRole("link", {
      name: /สมัครเป็น Talent สร้างโปรไฟล์/i,
    });
    expect(ctaLink).toHaveAttribute(
      "href",
      "https://forms.gle/14EZbYpz9qqDXwTs5"
    );
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
      name: /จองคิวปรึกษาฟรี 30 นาที/i,
    });
    fireEvent.click(ctaLink);

    expect(onBook).toHaveBeenCalled();
  });

  it("defaults safely to hands_on when readiness is null and uses clean button styling without ei-button-dawn", () => {
    render(<PlanSummaryStep {...defaultHandsOnProps} readiness={null} />);

    const ctaButton = screen.getByRole("link", {
      name: /จองคิวปรึกษาฟรี 30 นาที/i,
    });
    expect(ctaButton).toBeInTheDocument();
    expect(ctaButton).not.toHaveClass("ei-button-dawn");
    expect(ctaButton).toHaveClass("bg-amber-400");
  });
});
