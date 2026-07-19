# Parent-Funded Financial Page Design

**Date:** 2026-07-19  
**Status:** Approved for implementation

## Goal

Create a simple founder-facing financial model at `/fi/financial` for PassionSeed's first urgent revenue path:

1. Students use Radar and their admission plan for free.
2. Parents pay ฿1,490 for a short PathLab Trial.
3. Trial families can upgrade to a ฿5,900 Admission Evidence Sprint, with the trial payment credited.
4. Successful families can buy another Sprint for ฿4,900.

The page should answer whether this model can reach positive contribution margin and founder-led break-even. It should not model sponsor bounties, school licenses, employer revenue, fundraising, or a general subscription.

## Audience and Theme

The page is an internal founder decision tool, so it uses PassionSeed's Dusk atmosphere. It should reuse `.ei-card` and the existing Dusk tokens from `app/globals.css`. Financial cards should use the static card variant so that a dense analytical page does not add distracting hover animation.

## Default Assumptions

| Assumption | Default |
|---|---:|
| Completed free plans per year | 20,000 |
| Free plan to paid Trial conversion | 3% |
| Trial to first Sprint conversion | 30% |
| First Sprint to repeat Sprint conversion | 30% |
| PathLab Trial price | ฿1,490 |
| Admission Evidence Sprint price | ฿5,900 |
| Returning Sprint price | ฿4,900 |
| Trial direct cost | ฿450 |
| Full Sprint direct cost, including Trial | ฿2,100 |
| CAC per paid Trial family | ฿600 |
| Monthly business fixed cost | ฿35,000 |
| Monthly founder draw | ฿40,000 |
| Sprint cohort size | 20 students |

The model treats the Trial as the first portion of the full Sprint for converting students. Their incremental first-Sprint direct cost is therefore the full Sprint direct cost minus the already-incurred Trial cost. This prevents double-counting.

## Calculations

The page derives:

- Paid Trial families.
- First Sprint seats.
- Repeat Sprint seats.
- Trial, upgrade, and repeat revenue.
- Direct delivery cost.
- Gross contribution and gross contribution margin.
- Acquisition spend.
- Contribution after acquisition.
- Annual fixed cost and founder draw.
- Operating result.
- Revenue per paid Trial family.
- Contribution per full Sprint seat.
- Monthly full-Sprint-seat break-even.
- One-cohort revenue, cost, and contribution.

All formulas live in a pure TypeScript module so they can be tested independently from the UI.

## Page Structure

### Header

- "Parent-funded engine" eyebrow.
- "Can one urgent admissions outcome fund PassionSeed?" headline.
- A short statement that Radar and Plan stay free while parents pay for execution.

### Funnel

A responsive four-step flow:

`Free plans → Paid Trials → First Sprints → Repeat Sprints`

Each step shows the derived annual count and the conversion into the next step.

### Core outcomes

Four summary cards:

- Annual revenue.
- Gross contribution margin.
- Operating result.
- Monthly Sprint seats required for break-even.

### Editable assumptions

An accessible grid of numeric fields. Changes recalculate the page immediately in the browser. A reset button restores the approved base case.

### Unit economics

Show Trial, single-student Sprint, and full-cohort economics. Clarify that mentor and facilitator delivery is included in direct costs and that unpaid founder labor is represented by the founder draw.

### Annual profit bridge

Show revenue, delivery costs, acquisition, fixed business costs, founder draw, and operating result in a compact table with proportional bars. This is a relationship where a visual is more useful than prose.

### Guardrails

Display the decisions that protect the model:

- Keep Radar and Plan free.
- Do not run a Sprint below the minimum viable cohort without repricing.
- Keep gross contribution margin at or above 60%.
- Keep paid Trial CAC below ฿800, with ฿1,200 as a hard ceiling.
- Hire only after two cohorts per month are sustained for three months.

## Components

- `app/fi/financial/page.tsx`: route metadata and page wrapper.
- `components/financial/FinancialModelDashboard.tsx`: client state and page composition.
- `components/financial/AssumptionsPanel.tsx`: accessible editable inputs and reset control.
- `components/financial/FinancialFunnel.tsx`: funnel visualization.
- `components/financial/FinancialSummary.tsx`: metric cards, unit economics, and annual bridge.
- `lib/financial-model/parent-funded.ts`: types, defaults, formatting helpers, and pure calculations.
- `lib/financial-model/parent-funded.test.ts`: calculation and edge-case tests.

## Error Handling

- Inputs are clamped to safe non-negative ranges.
- Conversion rates are constrained to 0–100%.
- Cohort size is at least one.
- Invalid or temporarily blank numeric inputs fall back to zero without crashing.
- Division-by-zero results render as zero instead of `NaN` or infinity.

## Testing

- Verify the approved base-case funnel and operating result.
- Verify that Trial credit is not double-counted in first-Sprint revenue or direct cost.
- Verify zero-conversion behavior.
- Verify break-even seat calculation.
- Verify assumption normalization.
- Run focused Jest tests, ESLint on new files, and a production build or TypeScript check as appropriate for the repository state.
- Visually inspect desktop and mobile layouts, including input accessibility and overflow.

## Future Scope

Only after the parent-funded model is validated should the page add:

- Sponsor-funded bounty PathLabs.
- School distribution economics.
- Multiple saved scenarios.
- Actual payment and cohort data from Supabase.
- Cash runway and hiring simulations.

These are deliberately excluded from the first page.
