# Map Welcome Experience + LaunchPad Story Rewrite Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the generic post-enrollment dialog with a full-screen cinematic Dawn welcome (with a story stage for LaunchPad), and rewrite the LaunchPad day stories in Supabase so students understand them.

**Architecture:** One new client component `components/map/MapWelcomeExperience.tsx` (portal, DawnScene, staged reveal, two variants) swapped into `MapEnrollmentTracker`; `MapWelcomeDialog.tsx` deleted. Story rewrite is pure DB content: per-day tsx scripts update `map_nodes.instructions` and `node_content.content_body` by deterministic row ID via `createAdminClient`.

**Tech Stack:** Next.js 15 App Router, React, Tailwind, Jest + React Testing Library, Supabase (`utils/supabase/admin`), tsx.

**Spec:** `docs/superpowers/specs/2026-08-16-map-welcome-experience-design.md`

## Global Constraints

- Student surfaces use the **Dawn** theme; render the sky via `components/projectseed/dawn-scene.tsx` (`<DawnScene />`), never hand-rolled.
- Pale gold `#fed95c` appears once per screen as the keynote statement (Dawn accent rule).
- Reveal animations animate `opacity` + `transform`/`filter` together, easing `cubic-bezier(0.05, 0.7, 0.35, 0.99)`; everything static under `prefers-reduced-motion`.
- No em dashes (—) in any user-facing copy.
- All DB scripts run with `npx tsx --env-file=.env.local <script>` (env is NOT auto-loaded).
- Never hardcode credentials; use `createAdminClient()` from `utils/supabase/admin`.
- Trigger logic in `MapEnrollmentTracker` (auto-enroll, `map-welcome-tour-seen:<id>` localStorage gate, referrer check) stays exactly as-is.
- Do not touch `image` node_content rows, `display_order`, or node titles.

## File Structure

| File | Responsibility |
|------|----------------|
| `components/map/MapWelcomeExperience.tsx` (create) | Full-screen welcome: staged reveal, LaunchPad + generic variants |
| `app/globals.css` (modify) | `.welcome-stage` reveal keyframes |
| `components/map/__tests__/MapWelcomeExperience.test.tsx` (create) | Component tests |
| `components/map/MapEnrollmentTracker.tsx` (modify) | Render new component |
| `components/map/MapWelcomeDialog.tsx` (delete) | Old wizard |
| `scripts/rewrite-launchpad-day-1-2.ts`, `-3-4.ts`, `-5-6.ts` (create) | Story content updates by row ID |

---

## Workstream A: Welcome Experience

### Task A1: Base component, generic variant, CSS

**Files:**
- Create: `components/map/MapWelcomeExperience.tsx`
- Modify: `app/globals.css` (append at end)
- Test: `components/map/__tests__/MapWelcomeExperience.test.tsx`

**Interfaces:**
- Produces: `MapWelcomeExperience({ isOpen, onOpenChange, map })`, `isLaunchpadMap(title: string): boolean`, `getDifficultyLabel(difficulty?: number): string`, `LAUNCHPAD_COPY` const, `FINAL_STAGE = 4`, `STAGE_AT_MS = [0, 800, 2200, 3600, 4800, 6500]`. Task A2 consumes these; A3 consumes the component.

- [ ] **Step 1: Write the failing test**

```tsx
// components/map/__tests__/MapWelcomeExperience.test.tsx
import { render, screen, fireEvent, act } from "@testing-library/react";
import {
  MapWelcomeExperience,
  isLaunchpadMap,
  getDifficultyLabel,
} from "../MapWelcomeExperience";

const genericMap = {
  id: "map-2",
  title: "3D Game Worlds",
  description: "Build your first 3D island. Then keep going.",
  creator_id: null,
  created_at: "",
  updated_at: "",
  node_count: 12,
  avg_difficulty: 5,
};

function mockMatchMedia(matches: boolean) {
  window.matchMedia = jest.fn().mockImplementation((query: string) => ({
    matches,
    media: query,
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    addListener: jest.fn(),
    removeListener: jest.fn(),
    onchange: null,
    dispatchEvent: jest.fn(),
  }));
}

describe("helpers", () => {
  test("isLaunchpadMap is case-insensitive", () => {
    expect(isLaunchpadMap("LaunchPad: Startup Sprint")).toBe(true);
    expect(isLaunchpadMap("launchpad trial")).toBe(true);
    expect(isLaunchpadMap("3D Game Worlds")).toBe(false);
  });

  test("getDifficultyLabel thresholds", () => {
    expect(getDifficultyLabel(2)).toBe("Beginner");
    expect(getDifficultyLabel(5)).toBe("Intermediate");
    expect(getDifficultyLabel(7)).toBe("Advanced");
    expect(getDifficultyLabel(9)).toBe("Expert");
    expect(getDifficultyLabel(undefined)).toBe("Intermediate");
  });
});

describe("generic variant (reduced motion = final state immediately)", () => {
  beforeEach(() => mockMatchMedia(true));

  test("renders keynote, title, real stats, and generic CTA", () => {
    render(
      <MapWelcomeExperience isOpen onOpenChange={jest.fn()} map={genericMap} />
    );
    expect(screen.getByText("You're in.")).toBeVisible();
    expect(screen.getByText("3D Game Worlds")).toBeVisible();
    expect(screen.getByText("12 islands")).toBeVisible();
    expect(screen.getByText(/Intermediate level/)).toBeVisible();
    expect(screen.getByText("Build your first 3D island.")).toBeVisible();
    expect(screen.getByRole("button", { name: "Start Exploring" })).toBeVisible();
    expect(screen.queryByText("Pitch Day")).not.toBeInTheDocument();
  });

  test("CTA, skip link, and Escape all close", () => {
    const onOpenChange = jest.fn();
    render(
      <MapWelcomeExperience isOpen onOpenChange={onOpenChange} map={genericMap} />
    );
    fireEvent.click(screen.getByRole("button", { name: "Start Exploring" }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
    fireEvent.click(screen.getByRole("button", { name: "Skip" }));
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onOpenChange).toHaveBeenCalledTimes(3);
  });

  test("renders nothing when closed", () => {
    const { container } = render(
      <MapWelcomeExperience
        isOpen={false}
        onOpenChange={jest.fn()}
        map={genericMap}
      />
    );
    expect(container).toBeEmptyDOMElement();
  });
});

describe("staged reveal (motion allowed)", () => {
  beforeEach(() => {
    mockMatchMedia(false);
    jest.useFakeTimers();
  });
  afterEach(() => jest.useRealTimers());

  test("stages advance on timers; clicking anywhere skips to final", () => {
    render(
      <MapWelcomeExperience isOpen onOpenChange={jest.fn()} map={genericMap} />
    );
    expect(screen.queryByText("You're in.")).not.toBeInTheDocument();
    act(() => jest.advanceTimersByTime(900));
    expect(screen.getByText("You're in.")).toBeVisible();
    expect(screen.queryByText("Start Exploring")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("dialog"));
    expect(screen.getByRole("button", { name: "Start Exploring" })).toBeVisible();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest components/map/__tests__/MapWelcomeExperience.test.tsx --coverage=false`
Expected: FAIL — `MapWelcomeExperience` does not exist.

- [ ] **Step 3: Append reveal CSS to `app/globals.css`**

```css
/* === Map Welcome Experience: staged reveal === */
@keyframes welcome-stage-in {
  from {
    opacity: 0;
    transform: translateY(14px);
    filter: blur(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
    filter: blur(0);
  }
}

.welcome-stage {
  animation: welcome-stage-in 900ms
    var(--ease-tension, cubic-bezier(0.05, 0.7, 0.35, 0.99)) both;
}

@media (prefers-reduced-motion: reduce) {
  .welcome-stage {
    animation: none;
  }
}
```

- [ ] **Step 4: Write the component (generic variant only for now)**

```tsx
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { DawnScene } from "@/components/projectseed/dawn-scene";
import { LearningMap } from "@/types/map";

export interface MapWelcomeExperienceProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  map: LearningMap & {
    node_count?: number;
    avg_difficulty?: number;
  };
}

/** Stage indices: 0 bare scene → FINAL fully revealed. */
export const FINAL_STAGE = 5;

/** ms after open at which each stage appears. */
export const STAGE_AT_MS = [0, 800, 2200, 3600, 4800, 6500] as const;

export const LAUNCHPAD_COPY = {
  keynote: "You're in.",
  eyebrow: "6-Day Startup Accelerator",
  story: [
    "For the next 6 days, you're a founder.",
    "Build your own idea, or follow SeniorPass: the story of Fah, an M.4 student panicking before midterms, and P'Beam, the senior whose notes could save her.",
    "Either way, you ship a real pitch by Day 6.",
  ],
  days: [
    "Spot the Problem",
    "Find Your Customer",
    "Napkin Economics",
    "Ship the MVP",
    "First 50 Users",
    "Pitch Day",
  ],
  cta: "Begin Day 1",
  dismiss: "Look around first",
} as const;

export function isLaunchpadMap(title: string): boolean {
  return title.toLowerCase().includes("launchpad");
}

export function getDifficultyLabel(difficulty: number = 5): string {
  if (difficulty <= 3) return "Beginner";
  if (difficulty <= 6) return "Intermediate";
  if (difficulty <= 8) return "Advanced";
  return "Expert";
}

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(query.matches);
    const onChange = (event: MediaQueryListEvent) => setReduced(event.matches);
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);
  return reduced;
}

export function MapWelcomeExperience({
  isOpen,
  onOpenChange,
  map,
}: MapWelcomeExperienceProps) {
  const reducedMotion = usePrefersReducedMotion();
  const [stage, setStage] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const ctaRef = useRef<HTMLButtonElement>(null);
  const previouslyFocused = useRef<Element | null>(null);

  const close = useCallback(() => onOpenChange(false), [onOpenChange]);

  // Schedule the staged reveal whenever the experience opens.
  useEffect(() => {
    if (!isOpen) return;
    previouslyFocused.current = document.activeElement;
    if (reducedMotion) {
      setStage(FINAL_STAGE);
      return;
    }
    setStage(0);
    const timers = STAGE_AT_MS.slice(1).map((delay, i) =>
      window.setTimeout(() => setStage(i + 1), delay)
    );
    return () => timers.forEach((t) => window.clearTimeout(t));
  }, [isOpen, reducedMotion]);

  // Focus the overlay on open; restore focus on close.
  useEffect(() => {
    if (!isOpen) return;
    rootRef.current?.focus();
    return () => {
      (previouslyFocused.current as HTMLElement | null)?.focus?.();
    };
  }, [isOpen]);

  // Move focus to the CTA once the final stage renders it.
  useEffect(() => {
    if (isOpen && stage >= FINAL_STAGE) ctaRef.current?.focus();
  }, [isOpen, stage]);

  // Esc closes; Tab is trapped inside the overlay.
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        close();
        return;
      }
      if (event.key !== "Tab" || !rootRef.current) return;
      const focusables = Array.from(
        rootRef.current.querySelectorAll<HTMLElement>("button, a[href]")
      );
      if (focusables.length === 0) {
        event.preventDefault();
        return;
      }
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      } else if (!rootRef.current.contains(document.activeElement)) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [isOpen, close]);

  if (!isOpen) return null;

  const revealAll = () => setStage(FINAL_STAGE);
  const launchpad = isLaunchpadMap(map.title);
  const supportingLine =
    map.description?.split(/(?<=[.!?])\s/)[0] ??
    "Get ready for an exciting learning journey.";

  return createPortal(
    <div
      ref={rootRef}
      role="dialog"
      aria-modal="true"
      aria-label={`Welcome to ${map.title}`}
      tabIndex={-1}
      className="dawn-theme fixed inset-0 z-[60] overflow-hidden outline-none"
      onClick={stage < FINAL_STAGE ? revealAll : undefined}
    >
      <DawnScene />
      <p aria-live="polite" className="sr-only">
        {stage >= 1 ? `You're in. Welcome to ${map.title}.` : ""}
      </p>

      <div className="relative z-10 flex min-h-full flex-col items-center justify-center px-6 text-center">
        {stage >= 1 && (
          <h2 className="welcome-stage font-kodchasan text-5xl font-bold text-[#fed95c] md:text-6xl">
            {LAUNCHPAD_COPY.keynote}
          </h2>
        )}

        {stage >= 2 && (
          <div className="welcome-stage mt-6 space-y-2">
            {launchpad && (
              <p className="dawn-eyebrow">{LAUNCHPAD_COPY.eyebrow}</p>
            )}
            <h3 className="text-2xl font-semibold text-slate-100 md:text-3xl">
              {map.title}
            </h3>
          </div>
        )}

        {/* Task A2 inserts the LaunchPad story (stage 3) and day path
            (stage 4) here. Generic stats render at stage 3. */}
        {stage >= 3 && !launchpad && (
          <div className="welcome-stage mt-10 flex items-center gap-4 text-sm text-slate-300">
            {map.node_count != null && <span>{map.node_count} islands</span>}
            <span>{getDifficultyLabel(map.avg_difficulty)} level</span>
          </div>
        )}

        {stage >= FINAL_STAGE && (
          <div className="welcome-stage mt-12 flex flex-col items-center gap-4">
            <p className="max-w-md text-slate-400">{supportingLine}</p>
            <button ref={ctaRef} onClick={close} className="ei-button-dawn">
              {launchpad ? LAUNCHPAD_COPY.cta : "Start Exploring"}
            </button>
            <button
              onClick={close}
              className="text-sm text-slate-500 transition-colors hover:text-slate-300"
            >
              {launchpad ? LAUNCHPAD_COPY.dismiss : "Skip"}
            </button>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
```

- [ ] **Step 5: Run tests, verify pass**

Run: `npx jest components/map/__tests__/MapWelcomeExperience.test.tsx --coverage=false`
Expected: all tests PASS.

- [ ] **Step 6: Commit**

```bash
git add components/map/MapWelcomeExperience.tsx components/map/__tests__/MapWelcomeExperience.test.tsx app/globals.css
git commit -m "feat: full-screen map welcome experience (base + generic variant)"
```

### Task A2: LaunchPad cinematic variant (story stage + day path)

**Files:**
- Modify: `components/map/MapWelcomeExperience.tsx`
- Test: `components/map/__tests__/MapWelcomeExperience.test.tsx`

**Interfaces:**
- Consumes: everything from Task A1.
- Produces: unchanged exports; LaunchPad branch renders `LAUNCHPAD_COPY.story` at stage 3 and the six-day path at stage 4.

- [ ] **Step 1: Add the failing test**

```tsx
const launchpadMap = {
  id: "map-1",
  title: "LaunchPad: Startup Sprint",
  description:
    "A 6-day startup accelerator for high school builders. Spot real problems.",
  creator_id: null,
  created_at: "",
  updated_at: "",
  node_count: 6,
  avg_difficulty: 5,
};

describe("LaunchPad variant (reduced motion)", () => {
  beforeEach(() => mockMatchMedia(true));

  test("renders story, all six day labels, eyebrow, and CTA", () => {
    render(
      <MapWelcomeExperience isOpen onOpenChange={jest.fn()} map={launchpadMap} />
    );
    expect(screen.getByText("You're in.")).toBeVisible();
    expect(screen.getByText("6-Day Startup Accelerator")).toBeVisible();
    expect(
      screen.getByText(/For the next 6 days, you're a founder\./)
    ).toBeVisible();
    expect(screen.getByText(/SeniorPass/)).toBeInTheDocument();
    for (const day of [
      "Spot the Problem",
      "Find Your Customer",
      "Napkin Economics",
      "Ship the MVP",
      "First 50 Users",
      "Pitch Day",
    ]) {
      expect(screen.getByText(day)).toBeVisible();
    }
    expect(screen.getByRole("button", { name: "Begin Day 1" })).toBeVisible();
    expect(screen.queryByText(/islands/)).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test, verify it fails** (`SeniorPass` not found)

Run: `npx jest components/map/__tests__/MapWelcomeExperience.test.tsx --coverage=false`

- [ ] **Step 3: Replace the stage 3/4 placeholder block in the component**

Replace the block marked `{/* Task A2 inserts ... */}` with:

```tsx
        {stage >= 3 && launchpad && (
          <div className="welcome-stage mt-8 max-w-lg space-y-2">
            {LAUNCHPAD_COPY.story.map((line) => (
              <p key={line} className="text-base text-slate-300 md:text-lg">
                {line}
              </p>
            ))}
          </div>
        )}

        {stage >= 3 && !launchpad && (
          <div className="welcome-stage mt-10 flex items-center gap-4 text-sm text-slate-300">
            {map.node_count != null && <span>{map.node_count} islands</span>}
            <span>{getDifficultyLabel(map.avg_difficulty)} level</span>
          </div>
        )}

        {stage >= 4 && launchpad && (
          <ol className="welcome-stage mt-10 flex flex-col items-center gap-3 md:flex-row md:gap-5">
            {LAUNCHPAD_COPY.days.map((day, i) => (
              <li
                key={day}
                className="welcome-stage flex items-center gap-2"
                style={{ animationDelay: `${i * 250}ms` }}
              >
                <span
                  className={`h-2 w-2 rounded-full ${
                    i === LAUNCHPAD_COPY.days.length - 1
                      ? "bg-[#fed95c] shadow-[0_0_12px_rgba(254,217,92,0.8)]"
                      : "bg-blue-400"
                  }`}
                />
                <span className="text-sm text-slate-300">{day}</span>
              </li>
            ))}
          </ol>
        )}
```

- [ ] **Step 4: Run tests, verify pass**

Run: `npx jest components/map/__tests__/MapWelcomeExperience.test.tsx --coverage=false`

- [ ] **Step 5: Commit**

```bash
git add components/map/MapWelcomeExperience.tsx components/map/__tests__/MapWelcomeExperience.test.tsx
git commit -m "feat: LaunchPad cinematic welcome with story stage and day path"
```

### Task A3: Wire into tracker, delete old dialog, verify

**Files:**
- Modify: `components/map/MapEnrollmentTracker.tsx`
- Delete: `components/map/MapWelcomeDialog.tsx`

**Interfaces:**
- Consumes: `MapWelcomeExperience` from Task A1/A2.

- [ ] **Step 1: Swap the component**

In `components/map/MapEnrollmentTracker.tsx`:
- Replace `import { MapWelcomeDialog } from "./MapWelcomeDialog";` with `import { MapWelcomeExperience } from "./MapWelcomeExperience";`
- Replace the `<MapWelcomeDialog ... />` JSX with `<MapWelcomeExperience ... />` (same props: `isOpen={showWelcomeDialog}`, `onOpenChange={...}` unchanged, `map={map}`).

- [ ] **Step 2: Check for other importers of the old dialog**

Run: `grep -rn "MapWelcomeDialog" --include="*.tsx" --include="*.ts" . | grep -v node_modules`
Expected: only `components/map/MapWelcomeDialog.tsx` itself.

- [ ] **Step 3: Delete `components/map/MapWelcomeDialog.tsx`**

- [ ] **Step 4: Verify**

Run: `npx jest components/map --coverage=false && pnpm lint && pnpm build`
Expected: tests pass, lint clean, build succeeds.

- [ ] **Step 5: Manual check in dev**

`pnpm dev`, open a LaunchPad map in an incognito window with a fresh account (or clear `localStorage` key `map-welcome-tour-seen:<id>`), confirm: staged reveal plays, click skips, CTA closes, second visit does not replay. Check a mobile viewport.

- [ ] **Step 6: Commit**

```bash
git add components/map/MapEnrollmentTracker.tsx components/map/MapWelcomeDialog.tsx
git commit -m "feat: swap enrollment welcome dialog for cinematic experience"
```

---

## Workstream B: Story Rewrite (DB)

Each task updates that day's `map_nodes.instructions` and its `text`
`node_content.content_body` rows by ID. Map ID: `00000000-0000-0000-0000-000000000020`.

Rewrite rules (from spec, apply to every day):
1. Story-first: open with the Fah / P'Beam / SeniorPass narrative beat, then teach, then mission.
2. Define every term inline on first use in one breath; jargon never undefined.
3. Day 1 explicitly introduces Track A (your own idea) vs Track B (SeniorPass default story) and says you can switch any day.
4. Each day's opening references the previous day's work.
5. English, short sentences, Thai student context (LINE, PromptPay, midterms) kept; no em dashes.
6. Missions keep the same deliverables; Day 3 `$	imes$` becomes `x`.
7. Simple HTML only: `<p> <ul> <li> <ol> <strong> <em> <blockquote> <pre><code>`.
8. Do not touch image rows, display_order, or node titles.

Script pattern (per task, adjust IDs):

```ts
// scripts/rewrite-launchpad-day-X.ts
import { createAdminClient } from "../utils/supabase/admin";

const UPDATES: { table: "map_nodes" | "node_content"; id: string; field: "instructions" | "content_body"; value: string }[] = [
  // ... rows for this day
];

async function main() {
  const supabase = createAdminClient();
  for (const u of UPDATES) {
    const { error } = await supabase
      .from(u.table)
      .update({ [u.field]: u.value })
      .eq("id", u.id);
    if (error) throw error;
    console.log("updated", u.table, u.id);
  }
}

main();
```

### Task B1: Rewrite Day 1 + Day 2

**Row IDs:**
- Day 1 node (`Day 1: Spot the Problem`): instructions. Text rows:
  `...001` The 11:30 PM Midterm Panic, `...002` The Pain vs. Frequency Matrix, `...003` Today's Mission: Hunt the Pain.
- Day 2 node (`Day 2: Who is Your Customer?`): instructions. Text rows:
  `...004` The Senior with the A+ Notes, `...005` Value Proposition Canvas & The Mom Test, `...006` Today's Mission: Map Your Customer.

(All `node_content` IDs are `00000000-0000-0000-0013-0000000000XX`; node IDs for
`map_nodes` must be selected first: `SELECT id, title FROM map_nodes WHERE map_id = '00000000-0000-0000-0000-000000000020'`.)

**Specific requirements:**
- Day 1 story beat: Fah's 11:30 PM panic IS the SeniorPass origin. Introduce: "In this sprint you follow one startup story, SeniorPass" + explain Track A / Track B choice in the mission content.
- Day 2 introduces Fah and P'Beam as the two sides of the marketplace, continuing from Day 1.

- [ ] Step 1: Write `scripts/rewrite-launchpad-day-1-2.ts` with the new copy (current copy: `artifacts/launchpad-content-dump.json`).
- [ ] Step 2: Run `npx tsx --env-file=.env.local scripts/rewrite-launchpad-day-1-2.ts`. Expected: "updated ..." per row, no errors.
- [ ] Step 3: Verify: re-run `npx tsx --env-file=.env.local scripts/dump-launchpad-content.ts` and read Day 1–2 in the fresh dump. Copy must match, images untouched, order unchanged.
- [ ] Step 4: Commit script + updated dump.

### Task B2: Rewrite Day 3 + Day 4

**Row IDs:**
- Day 3 (`Day 3: The Business Model`): texts `...007` The Cafeteria Napkin Math, `...008` The 9-Box Lean Canvas, `...009` Today's Mission: Build the Model.
- Day 4 (`Day 4: Build Something Real`): texts `...010` The 2-Hour Google Form MVP, `...011` The 5 MVP Archetypes, `...012` Today's Mission: Ship Your MVP Spec.

**Specific requirements:**
- Fix the `$	imes$` LaTeX artifact in Day 3's mission (`x`).
- Day 3 opening references the persona from Day 2. Day 4 references the model from Day 3.
- Keep the concrete numbers (59 / 45 / 14 baht, 50 bookings).

Same 4 steps as B1 with `scripts/rewrite-launchpad-day-3-4.ts`.

### Task B3: Rewrite Day 5 + Day 6

**Row IDs:**
- Day 5 (`Day 5: Get Your First Users`): texts `...013` The 0-Baht Grassroots Launch, `...014` The AARRR Pirate Funnel, `...015` Today's Mission: Launch Plan & Decision Scenario.
- Day 6 (`Day 6: Pitch Day`): texts `...016` 60 Seconds in the Spotlight, `...017` The 7-Slide YC Pitch Blueprint, `...018` Today's Mission: Pitch & Self-Reflection.

**Specific requirements:**
- Day 5 keeps the Decision Scenario game but frames it as a story beat ("It is Week 2 of SeniorPass...").
- Day 6 closing ties the 60-second pitch back to Fah's 11:30 PM panic from Day 1 (full-circle ending).
- Keep the Founder Self-Reflection questions.

Same 4 steps as B1 with `scripts/rewrite-launchpad-day-5-6.ts`.

---

## Execution Order

Workstreams A and B are independent: run A1→A2→A3 sequentially (shared files),
B1, B2, B3 in parallel (disjoint row IDs, one shared dump artifact: each B task
re-runs the dump after its own update; final combined review reads the last dump).
