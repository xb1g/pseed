# ProjectSeed Plan Page Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Update the `/plan` page ("My Path") wizard to incorporate the **ProjectSeed** strategic offer (2,990฿ flat rate, real user interview guarantee, alumni mentorship) and a 2-stage readiness diagnostic leading to free LINE OA consultation.

**Architecture:** Add a readiness selection step to `PlanWizard`, dynamically rendering either the Exploration (Radar) recommendation or the ProjectSeed (2,990฿) offer on `PlanSummaryStep`, complete with a pre-filled LINE OA deep link.

**Tech Stack:** Next.js 15 App Router, TypeScript, React, TailwindCSS, Shadcn UI (`components/ui`), Jest + React Testing Library.

---

### Task 1: Create ReadinessStep Component

**Files:**
- Create: `components/my-path/wizard/steps/ReadinessStep.tsx`
- Test: `components/my-path/wizard/__tests__/ReadinessStep.test.tsx`

**Step 1: Write the failing test**

```tsx
import { render, screen, fireEvent } from "@testing-library/react";
import { ReadinessStep } from "../steps/ReadinessStep";

describe("ReadinessStep", () => {
  it("renders readiness options and triggers onSelect", () => {
    const onSelect = jest.fn();
    render(<ReadinessStep selected={null} onSelect={onSelect} />);

    expect(screen.getByText(/ยังไม่แน่ใจ/i)).toBeInTheDocument();
    expect(screen.getByText(/พร้อมลงมือทำ/i)).toBeInTheDocument();

    fireEvent.click(screen.getByText(/พร้อมลงมือทำ/i));
    expect(onSelect).toHaveBeenCalledWith("hands_on");
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm test components/my-path/wizard/__tests__/ReadinessStep.test.tsx`  
Expected: FAIL (component missing)

**Step 3: Write minimal implementation**

```tsx
"use client";

import React from "react";
import { Compass, Rocket } from "lucide-react";

export type ReadinessLevel = "exploration" | "hands_on";

interface ReadinessStepProps {
  selected: ReadinessLevel | null;
  onSelect: (level: ReadinessLevel) => void;
}

export function ReadinessStep({ selected, onSelect }: ReadinessStepProps) {
  return (
    <div className="space-y-6 dawn-theme">
      <div className="text-center space-y-2">
        <h2 className="font-kodchasan text-2xl font-bold text-slate-100">
          ตอนนี้คุณอยู่ในช่วงไหนของการเรียนรู้?
        </h2>
        <p className="font-bai-jamjuree text-slate-400 text-sm">
          เลือกเพื่อให้ระบบแนะนำเส้นทางที่เหมาะสมที่สุดสำหรับคุณ
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <button
          type="button"
          onClick={() => onSelect("exploration")}
          className={`ei-card p-6 text-left transition-all cursor-pointer ${
            selected === "exploration" ? "ring-2 ring-indigo-500 bg-indigo-950/40" : ""
          }`}
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="p-3 rounded-lg bg-indigo-500/10 text-indigo-400">
              <Compass className="h-6 w-6" />
            </div>
            <h3 className="font-kodchasan font-bold text-lg text-slate-100">
              ค้นหาทิศทางก่อน
            </h3>
          </div>
          <p className="font-bai-jamjuree text-sm text-slate-300">
            ยังไม่แน่ใจว่าชอบอะไร อยากสำรวจสายอาชีพ อ่านวิเคราะห์ AI Impact และ Reality Check ฟรี
          </p>
        </button>

        <button
          type="button"
          onClick={() => onSelect("hands_on")}
          className={`ei-card p-6 text-left transition-all cursor-pointer ${
            selected === "hands_on" ? "ring-2 ring-amber-500 bg-amber-950/40" : ""
          }`}
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="p-3 rounded-lg bg-amber-500/10 text-amber-400">
              <Rocket className="h-6 w-6" />
            </div>
            <h3 className="font-kodchasan font-bold text-lg text-slate-100">
              พร้อมลงมือทำโปรเจกต์
            </h3>
          </div>
          <p className="font-bai-jamjuree text-sm text-slate-300">
            มีเป้าหมายชัดเจน อยากปั้นโปรเจกต์จริง สัมภาษณ์ผู้ใช้จริง พร้อมส่งพอร์ต TCAS Round 1 (ProjectSeed 2,990฿)
          </p>
        </button>
      </div>
    </div>
  );
}
```

**Step 4: Run test to verify it passes**

Run: `pnpm test components/my-path/wizard/__tests__/ReadinessStep.test.tsx`  
Expected: PASS

**Step 5: Commit**

```bash
git add components/my-path/wizard/steps/ReadinessStep.tsx components/my-path/wizard/__tests__/ReadinessStep.test.tsx
git commit -m "feat(plan): add ReadinessStep component for student diagnostic"
```

---

### Task 2: Update PlanSummaryStep with ProjectSeed 2,990฿ Offer & LINE OA Deep Link

**Files:**
- Modify: `components/my-path/wizard/steps/PlanSummaryStep.tsx`
- Test: `components/my-path/wizard/__tests__/PlanSummaryStep.test.tsx`

**Step 1: Write the failing test**

```tsx
import { render, screen } from "@testing-library/react";
import { PlanSummaryStep } from "../steps/PlanSummaryStep";

describe("PlanSummaryStep", () => {
  it("renders ProjectSeed offer card and LINE OA button for hands_on readiness", () => {
    render(
      <PlanSummaryStep
        readiness="hands_on"
        selectedCareer={{ titleTh: "ซอฟต์แวร์แรร์", slug: "tech" }}
        selectedSeed={{ title: "App Prototyping" }}
      />
    );

    expect(screen.getByText(/ProjectSeed/i)).toBeInTheDocument();
    expect(screen.getByText(/2,990฿/i)).toBeInTheDocument();
    expect(screen.getByText(/คุยกับพี่ๆ ช่วยดูฟรี บน LINE OA/i)).toBeInTheDocument();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm test components/my-path/wizard/__tests__/PlanSummaryStep.test.tsx`  
Expected: FAIL

**Step 3: Implement minimal code updates**

In `components/my-path/wizard/steps/PlanSummaryStep.tsx`:
- Render ProjectSeed Card when `readiness === 'hands_on'`.
- Format LINE OA link with pre-filled message text.
- Include `.ei-button-dawn` styling for LINE OA action.

**Step 4: Run test to verify it passes**

Run: `pnpm test components/my-path/wizard/__tests__/PlanSummaryStep.test.tsx`  
Expected: PASS

**Step 5: Commit**

```bash
git add components/my-path/wizard/steps/PlanSummaryStep.tsx components/my-path/wizard/__tests__/PlanSummaryStep.test.tsx
git commit -m "feat(plan): add ProjectSeed 2,990฿ offer and pre-filled LINE OA CTA to summary step"
```

---

### Task 3: Integrate Readiness Flow in PlanWizard State

**Files:**
- Modify: `components/my-path/wizard/PlanWizard.tsx`

**Step 1: Write test for PlanWizard flow**

Run existing tests / add integration check.

**Step 2: Update state machine in PlanWizard.tsx**

Add `readinessLevel` to state and incorporate `ReadinessStep` into wizard step navigation.

**Step 3: Run full test suite & linter**

Run: `pnpm lint && pnpm test`  
Expected: All clean and passing.

**Step 4: Commit**

```bash
git add components/my-path/wizard/PlanWizard.tsx
git commit -m "feat(plan): integrate readiness step into PlanWizard flow"
```
