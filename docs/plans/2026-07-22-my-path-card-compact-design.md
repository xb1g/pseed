# My Path Summary Card — Compact Layout Design

**Date:** 2026-07-22
**Component:** `components/my-path/MyPathSummaryCard.tsx` (rendered on `/me`)
**Scope:** Visual density pass only — no copy, data, or behavior changes.

## Problem

The saved-plan card (headline e.g. "แผน 4 เดือนสู่มหาวิทยาลัยในไทม์ไลน์ของคุณ") stacks
header → headline → chips → 5-row divided outcomes list → two stacked CTAs, consuming
excessive vertical space at the top of the `/me` page.

## Decisions

- **Approach:** Tighter static layout (chosen over collapsible card and slim-banner variants).
  Everything stays visible; no new interaction state.
- **Empty state** (`EmptyMyPathCard`) gets the same treatment for visual consistency.

## Design

### Saved-plan card
- Card padding `p-5 sm:p-6` → `p-4 sm:p-5`; section margin `mb-8` → `mb-6`.
- Headline `text-xl sm:text-2xl` → `text-lg sm:text-xl`, `mt-2` → `mt-1.5`.
- Chips: `text-[10px]`, `py-0.5`, `mt-2`.
- Outcomes: full-width divided list → `sm:grid-cols-2` grid of compact cells
  (icon + title on one line, `landsIn` as tiny amber note below the title).
  Section label shrinks to `text-xs`.
- CTAs: always one row, `min-h-12` → `min-h-11` (keeps 44px touch target), `mt-4`.

### Empty state card
- Padding `p-4 sm:p-5`, icon `h-12 w-12` → `h-10 w-10`, gap tightened, CTA `min-h-11`.

## Constraints

- Thai text never below 10px (`text-[10px]` floor respected).
- Touch targets stay ≥ 44px.
- Pure Tailwind class changes in one file; no new dependencies.
- Follows existing Dawn/dusk-amber styling already in the card.
