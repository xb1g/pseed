import { fireEvent, render, screen } from "@testing-library/react";
import { PlanWizard } from "../PlanWizard";
import type { SeedPathlab } from "@/lib/my-path/pathlab-match";
import type { CareerPreview } from "@/lib/my-path/radar-content";

function preview(slug: string, title: string): CareerPreview {
  return {
    slug,
    titleTh: title,
    titleEn: title,
    tagline: `สิ่งที่น่าสนใจใน ${title}`,
    emoji: "✦",
    color: "#6366f1",
    dailyWork: "คุยกับคน ทำงานกับทีม และสร้างคำตอบจากข้อมูลจริง",
    enjoySignal: "เหมาะกับคนที่อยากเรียนรู้จากการลงมือทำ",
    tradeoff: "ต้องรับมือกับความไม่แน่นอนและปรับงานจาก feedback",
    aiSignal: "AI ช่วยงานซ้ำ แต่การตัดสินใจยังต้องใช้บริบทมนุษย์",
    entryRoute: "เริ่มจากโปรเจกต์เล็กและ case study ได้",
    marketSignal: "ตลาดต้องการคนที่เชื่อมความเข้าใจกับการลงมือทำ",
    radarHref: `/radar/${slug}`,
  };
}

function seed(id: string, title: string): SeedPathlab {
  return {
    id,
    title,
    description: "Description",
    coverImageUrl: null,
    categoryName: null,
    totalDays: null,
  };
}

const mockCareers = [
  preview("ai-engineer", "AI Engineer"),
  preview("software-engineer", "Software Engineer"),
];

const mockSeeds = [seed("seed-ai", "AI Engineer PathLab")];

function renderWizard() {
  return render(
    <PlanWizard
      careers={mockCareers}
      seeds={mockSeeds}
      isSignedIn={false}
      initialDraft={null}
    />
  );
}

beforeEach(() => {
  window.localStorage.clear();
  global.fetch = jest.fn().mockResolvedValue({ ok: true });
  Object.defineProperty(window, "scrollTo", {
    value: jest.fn(),
    writable: true,
  });
});

describe("PlanWizard Integration", () => {
  it("starts at step 0 displaying ReadinessStep", async () => {
    renderWizard();

    expect(
      await screen.findByRole("heading", {
        name: /ตอนนี้คุณอยู่ในช่วงไหนของการเรียนรู้\?/i,
      })
    ).toBeInTheDocument();

    expect(screen.getByText("ค้นหาทิศทางก่อน")).toBeInTheDocument();
    expect(screen.getByText("พร้อมลงมือทำโปรเจกต์")).toBeInTheDocument();
  });

  it("disables progression until a readiness option is selected, then enables proceeding", async () => {
    renderWizard();

    await screen.findByRole("heading", {
      name: /ตอนนี้คุณอยู่ในช่วงไหนของการเรียนรู้\?/i,
    });

    const nextButton = screen.getByRole("button", {
      name: /เลือกสถานะเพื่อไปต่อ|เริ่มออกแบบชีวิต/i,
    });
    expect(nextButton).toBeDisabled();

    const handsOnOption = screen.getByRole("radio", {
      name: /พร้อมลงมือทำโปรเจกต์/i,
    });
    fireEvent.click(handsOnOption);

    expect(nextButton).toBeEnabled();
    fireEvent.click(nextButton);

    expect(
      screen.getByRole("heading", { name: /อะไรจุดไฟในตัวคุณ/i })
    ).toBeInTheDocument();
  });

  it("passes readiness='hands_on' to PlanSummaryStep at final step, displaying ProjectSeed offer card", async () => {
    renderWizard();

    await screen.findByRole("heading", {
      name: /ตอนนี้คุณอยู่ในช่วงไหนของการเรียนรู้\?/i,
    });

    // Step 0: Select hands_on
    fireEvent.click(screen.getByRole("radio", { name: /พร้อมลงมือทำโปรเจกต์/i }));
    fireEvent.click(screen.getByRole("button", { name: /เริ่มออกแบบชีวิต|ถัดไป/i }));

    // Step 1: Select career
    fireEvent.click(screen.getByRole("button", { name: /AI Engineer/i }));
    fireEvent.click(screen.getByRole("button", { name: "ถัดไป" }));

    // Step 2: Select goal
    fireEvent.click(screen.getByRole("radio", { name: /เข้ามหาวิทยาลัย/i }));
    fireEvent.click(screen.getByRole("button", { name: "ดูแผนของฉัน" }));

    // Step 3: PlanSummaryStep with ProjectSeed 2,990฿ offer
    expect(screen.getByText(/ProjectSeed Program|ProjectSeed/i)).toBeInTheDocument();
    expect(screen.getByText(/2,990฿/i)).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /ส่ง Plan ให้พี่ๆ ช่วยดูฟรี บน LINE OA/i })
    ).toBeInTheDocument();
  });

  it("passes readiness='exploration' to PlanSummaryStep at final step, displaying Exploration card", async () => {
    renderWizard();

    await screen.findByRole("heading", {
      name: /ตอนนี้คุณอยู่ในช่วงไหนของการเรียนรู้\?/i,
    });

    // Step 0: Select exploration
    fireEvent.click(screen.getByRole("radio", { name: /ค้นหาทิศทางก่อน/i }));
    fireEvent.click(screen.getByRole("button", { name: /เริ่มออกแบบชีวิต|ถัดไป/i }));

    // Step 1: Select career
    fireEvent.click(screen.getByRole("button", { name: /AI Engineer/i }));
    fireEvent.click(screen.getByRole("button", { name: "ถัดไป" }));

    // Step 2: Select goal
    fireEvent.click(screen.getByRole("radio", { name: /เข้ามหาวิทยาลัย/i }));
    fireEvent.click(screen.getByRole("button", { name: "ดูแผนของฉัน" }));

    // Step 3: PlanSummaryStep with Exploration card
    expect(
      screen.getByRole("link", { name: /คุยกับพี่ๆ ช่วยค้นหาทิศทางฟรี บน LINE OA/i })
    ).toBeInTheDocument();
  });
});
