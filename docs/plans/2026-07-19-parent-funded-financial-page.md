# Parent-Funded Financial Page Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build an editable `/fi/financial` dashboard that models PassionSeed's free Radar/Plan → paid Trial → paid Admission Evidence Sprint parent-funded business.

**Architecture:** Keep all formulas and assumption normalization in a pure TypeScript domain module, then render the results through small client components. The route is static and stores no data; editing an assumption recalculates the model in-browser. Use the existing Dusk theme and static `.ei-card` treatment so the page fits PassionSeed without introducing another design system.

**Tech Stack:** Next.js App Router, React 19, TypeScript, Tailwind CSS, Lucide React, Jest, React Testing Library.

**Relevant skills:** @superpowers:test-driven-development, @frontend-skill, @vercel-plugin:nextjs, @superpowers:verification-before-completion

---

### Task 1: Add the tested parent-funded financial model

**Files:**
- Create: `lib/financial-model/parent-funded.test.ts`
- Create: `lib/financial-model/parent-funded.ts`

**Step 1: Write the failing base-case test**

Create tests that import `DEFAULT_PARENT_FUNDED_ASSUMPTIONS`, `calculateParentFundedModel`, and `normalizeParentFundedAssumptions`.

The base case must assert:

```typescript
expect(result.funnel).toEqual({
  completedFreePlans: 20_000,
  paidTrials: 600,
  firstSprintSeats: 180,
  repeatSprintSeats: 54,
});
expect(result.revenue.total).toBe(1_952_400);
expect(result.costs.directDelivery).toBe(680_400);
expect(result.costs.acquisition).toBe(360_000);
expect(result.costs.annualFixedBusiness).toBe(420_000);
expect(result.costs.annualFounderDraw).toBe(480_000);
expect(result.operatingResult).toBe(12_000);
expect(result.unitEconomics.breakEvenSprintSeatsPerMonth).toBe(20);
```

Add tests proving:

- Trial credit produces only `sprintPrice - trialPrice` in upgrade revenue.
- Converting students add only `sprintDirectCost - trialDirectCost` in incremental delivery cost.
- Zero conversions return finite zeros, never `NaN` or `Infinity`.
- Percentages clamp to 0–100, monetary/count inputs clamp to zero or above, and cohort size clamps to at least one.

**Step 2: Run the test to verify it fails**

Run:

```bash
pnpm test -- --runInBand lib/financial-model/parent-funded.test.ts
```

Expected: FAIL because `parent-funded.ts` does not exist.

**Step 3: Implement the minimum financial domain module**

Define:

```typescript
export type ParentFundedAssumptions = {
  completedFreePlans: number;
  freeToTrialRate: number;
  trialToSprintRate: number;
  sprintRepeatRate: number;
  trialPrice: number;
  sprintPrice: number;
  returningSprintPrice: number;
  trialDirectCost: number;
  sprintDirectCost: number;
  paidTrialCac: number;
  monthlyFixedBusinessCost: number;
  monthlyFounderDraw: number;
  cohortSize: number;
};
```

Rates are percentages expressed as whole numbers (`3`, not `0.03`). Use `Math.round` for derived family counts. Calculate first-Sprint incremental revenue and cost after Trial credit. Return nested `funnel`, `revenue`, `costs`, `unitEconomics`, `grossContribution`, `grossContributionMargin`, `contributionAfterAcquisition`, and `operatingResult` objects.

Export currency, percent, and count formatting helpers using `Intl.NumberFormat("th-TH")`.

**Step 4: Run the tests to verify they pass**

Run:

```bash
pnpm test -- --runInBand lib/financial-model/parent-funded.test.ts
```

Expected: PASS.

**Step 5: Commit the domain model**

```bash
git add lib/financial-model/parent-funded.ts lib/financial-model/parent-funded.test.ts
git commit -m "feat(financial): add parent-funded unit economics model"
```

### Task 2: Build reusable financial dashboard sections

**Files:**
- Create: `components/financial/AssumptionsPanel.tsx`
- Create: `components/financial/FinancialFunnel.tsx`
- Create: `components/financial/FinancialSummary.tsx`
- Create: `components/financial/financial-dashboard.test.tsx`

**Step 1: Write a failing dashboard-sections test**

Render the three sections with the calculated base case. Assert that users can see:

```typescript
expect(screen.getByText("20,000")).toBeInTheDocument();
expect(screen.getByText("600")).toBeInTheDocument();
expect(screen.getByText("฿1,952,400")).toBeInTheDocument();
expect(screen.getByText("20 seats / month")).toBeInTheDocument();
expect(screen.getByLabelText("Completed free plans per year")).toHaveValue(20_000);
```

Also assert that invoking the reset control calls the supplied reset callback.

**Step 2: Run the component test to verify it fails**

Run:

```bash
pnpm test -- --runInBand components/financial/financial-dashboard.test.tsx
```

Expected: FAIL because the components do not exist.

**Step 3: Implement `AssumptionsPanel`**

Build a labeled numeric-input grid for every approved assumption. Each field must:

- Have an explicit `label` and `id`.
- Use a minimum 48px touch target.
- Show `%`, `฿`, `students`, or `families` context beside the input.
- Call `onChange({ ...assumptions, [key]: numericValue })`.
- Treat a blank or invalid value as zero; normalization remains in the domain module.

Use `.ei-card.ei-card--static` for the container and an existing button pattern for Reset. Do not define a new card or Dusk button class.

**Step 4: Implement `FinancialFunnel`**

Render four ordered steps with semantic list markup:

1. Free Radar + Plan completions.
2. Paid PathLab Trials.
3. First Admission Evidence Sprints.
4. Repeat Sprints.

Show the relevant conversion rate between steps. Keep the flow vertical on mobile and horizontal from `lg` upward.

**Step 5: Implement `FinancialSummary`**

Render:

- Four top-line metric cards.
- Trial, Sprint-seat, and cohort unit economics.
- An annual profit bridge with bars whose widths are bounded to 0–100% of revenue.
- Guardrail callouts for margin, CAC, cohort size, and hiring.

Use `aria-label` text on any visual-only bar and never communicate positive/negative status through color alone.

**Step 6: Run the component test to verify it passes**

Run:

```bash
pnpm test -- --runInBand components/financial/financial-dashboard.test.tsx
```

Expected: PASS.

**Step 7: Commit the dashboard sections**

```bash
git add components/financial
git commit -m "feat(financial): add financial dashboard sections"
```

### Task 3: Compose the interactive page

**Files:**
- Create: `components/financial/FinancialModelDashboard.tsx`
- Create: `app/fi/financial/page.tsx`
- Modify: `components/financial/financial-dashboard.test.tsx`

**Step 1: Add a failing interaction test**

Render `FinancialModelDashboard`, change "Completed free plans per year" from `20000` to `10000`, and assert the Paid Trials count changes from `600` to `300`. Click Reset and assert it returns to `600`.

**Step 2: Run the test to verify it fails**

Run:

```bash
pnpm test -- --runInBand components/financial/financial-dashboard.test.tsx
```

Expected: FAIL because `FinancialModelDashboard` does not exist.

**Step 3: Implement `FinancialModelDashboard`**

Use client state initialized from `DEFAULT_PARENT_FUNDED_ASSUMPTIONS`. Normalize and calculate with `useMemo`, then compose:

- Dusk atmospheric background.
- Header and urgent parent-funded positioning.
- Funnel.
- Summary.
- Assumptions panel.
- A small "Model boundaries" footer stating that sponsor, school, fundraising, and actual cash data are excluded.

Do not persist inputs or call Supabase.

**Step 4: Implement the route**

Create a static App Router page with metadata:

```typescript
export const metadata = {
  title: "Parent-funded Financial Model | PassionSeed",
  description: "PassionSeed founder dashboard for parent-funded PathLab unit economics.",
};
```

Return `<FinancialModelDashboard />`.

**Step 5: Run the component test to verify it passes**

Run:

```bash
pnpm test -- --runInBand components/financial/financial-dashboard.test.tsx
```

Expected: PASS.

**Step 6: Commit the page**

```bash
git add app/fi/financial/page.tsx components/financial/FinancialModelDashboard.tsx components/financial/financial-dashboard.test.tsx
git commit -m "feat(financial): add interactive founder dashboard"
```

### Task 4: Verify function, code quality, and responsive UI

**Files:**
- Modify only if verification finds a scoped defect in the new financial files.

**Step 1: Run focused tests**

```bash
pnpm test -- --runInBand lib/financial-model/parent-funded.test.ts components/financial/financial-dashboard.test.tsx
```

Expected: all tests PASS.

**Step 2: Run lint on the new files**

```bash
pnpm exec eslint app/fi/financial/page.tsx components/financial lib/financial-model
```

Expected: no errors.

**Step 3: Run a production build**

```bash
pnpm build
```

Expected: build succeeds. If an unrelated existing dirty-worktree error blocks the build, record the exact error and additionally run `pnpm exec tsc --noEmit` or the narrowest relevant verification available.

**Step 4: Inspect the page in a browser**

Run the development server and inspect `/fi/financial` at approximately 1440px and 390px widths. Verify:

- No horizontal overflow.
- Inputs remain labeled and usable on mobile.
- Funnel order is clear at both widths.
- Negative operating results include a text label, not color alone.
- Cards use existing `.ei-card` styling.
- Reduced-motion mode does not hide information.

**Step 5: Commit any verification fixes**

```bash
git add app/fi/financial components/financial lib/financial-model
git commit -m "fix(financial): address dashboard verification findings"
```

Skip this commit if no fixes were necessary.
