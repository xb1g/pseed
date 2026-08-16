# Map Welcome Experience — 10x Redesign

**Date:** 2026-08-16
**Status:** Approved direction (goal, scope, format, choreography chosen by user)
**Component:** `components/map/MapWelcomeDialog.tsx` (replaced), `components/map/MapEnrollmentTracker.tsx` (trigger, unchanged)

## Problem

After a student auto-enrolls in a learning map, `MapWelcomeDialog` shows a 3-step
generic wizard ("Welcome to Your Adventure!" / "How It Works" / "Ready to Begin?").
The copy is filler that knows nothing about the map, the final CTA only closes the
dialog, and the moment of joining LaunchPad: Startup Sprint — the product's flagship
experience — feels useless instead of like an arrival.

## Goal

Make the post-enrollment moment an **emotional wow** (user's chosen direction):
a full-screen cinematic takeover that makes "you just joined a 6-day startup
accelerator" feel real. Success = the moment feels screenshot-worthy, not a modal
to skip.

## Decisions (from user)

- **Job of the screen:** emotional wow moment (not first-action funnel, not data/stakes)
- **Scope:** both — rebuild the generic dialog for all maps AND add a LaunchPad-specific cinematic variant
- **Format:** full-screen takeover, not a modal
- **Choreography:** staged reveal (option A) — one continuous Dawn scene, timed stages, no wizard steps

## Architecture

### New component: `components/map/MapWelcomeExperience.tsx`

Full-screen takeover, portaled to `document.body` (`position: fixed; inset: 0`),
stacked above the sticky app navbar (z-50). Renders the **Dawn scene** via
`components/projectseed/dawn-scene.tsx` — the design system mandates this component
for student surfaces; do not hand-roll the five sky layers.

### Variant selection

`map.title.toLowerCase().includes("launchpad")` selects the LaunchPad cinematic
variant. This matches the existing filter in `app/map/client-page.tsx:41`.
All other maps get the rebuilt generic variant driven by map data.

### Trigger (unchanged)

`MapEnrollmentTracker` keeps all existing logic: auto-enroll check, the
`map-welcome-tour-seen:<map.id>` localStorage gate, the referrer check that
suppresses the dialog when arriving from `/map` (to avoid double dialogs).
Only the rendered component changes: `MapWelcomeDialog` → `MapWelcomeExperience`.
`MapWelcomeDialog.tsx` is deleted once the swap is verified.

## LaunchPad Variant — Staged Reveal

One continuous scene. Copy is English, matching the map's own English DB content
(title, description). No invented Thai copy. All copy lives in a `LAUNCHPAD_COPY`
constants block at the top of the file, editable without touching animation logic.
No em dashes anywhere (project convention).

| Stage | Time | Content |
|-------|------|---------|
| 1 | 0–0.8s | Pure black; the gold horizon line ignites at the bottom of the Dawn scene |
| 2 | 0.8s | `"You're in."` — Kodchasan display, pale gold `#fed95c` (the one keynote statement per the Dawn accent rules; nothing else on screen) |
| 3 | 2.2s | Map title `LaunchPad: Startup Sprint` rises in slate/white, eyebrow label `6-DAY STARTUP ACCELERATOR` in gold micro-caps (`.dawn-eyebrow`) |
| 4 | 3.6s | **The story** (added per user feedback: today the sprint drops students on island 1 with zero narrative context, and "SeniorPass" appears on Day 1 unexplained). A 3-line story card: `For the next 6 days, you're a founder.` / `Build your own idea, or follow SeniorPass: the story of Fah, an M.4 student panicking before midterms, and P'Beam, the senior whose notes could save her.` / `Either way, you ship a real pitch by Day 6.` |
| 5 | 4.8s | The six days draw left-to-right as a horizon path of dots + labels, staggered ~250ms: Spot the Problem → Find Your Customer → Napkin Economics → Ship the MVP → First 50 Users → **Pitch Day** (final node glows gold) |
| 6 | 6.5s | Supporting line from `map.description` (trimmed to first sentence) + CTA `Begin Day 1` (`.ei-button-dawn`) + quiet text link "Look around first" (closes) |

Total choreography ≈ 7.5s. **Clicking anywhere skips all pending stages** and renders
the final state immediately. The day labels come from the sprint arc in the map's
own description (spot problems, customer pains, napkin unit economics, 2-hour MVP,
first 50 users, 60-second pitch); "First 50 Users" follows the map copy, not the
Thai marketing page's 100.

## Workstream B: Story Rewrite (DB content)

The LaunchPad map (`learning_maps.id = 00000000-0000-0000-0000-000000000020`) uses
the legacy `map_nodes` + `node_content` system: 6 day nodes, each with
`instructions` and 3–5 `node_content` rows (`text` bodies rendered as raw HTML via
`dangerouslySetInnerHTML` in `components/map/nodeViewHelpers.tsx`, plus working
`image` rows on B2 — keep image rows untouched).

**Problems found in the dump (`artifacts/launchpad-content-dump.json`):**

- No narrative onboarding: Day 1 opens with "Track B (SeniorPass Default Story)"
  but nothing has ever explained what SeniorPass is, who Fah and P'Beam are, or
  what Track A vs Track B means.
- Register is MBA-jargon-first ("Value Proposition Canvas", "AARRR Pirate Funnel",
  "Concierge MVP") with the story buried under terminology.
- Inconsistent numbering style (`1 to 5`, `0 to 10`), filler phrasing, and a stray
  LaTeX artifact on Day 3 (`$	imes$` in the Track A mission).

**Rewrite rules for every day's `instructions` + `text` content bodies:**

1. Story-first: open with the Fah / P'Beam / SeniorPass narrative beat for that
   day, then teach the concept in plain student language, then the mission.
2. Define every term in-line on first use, in one breath (e.g. "MVP: the smallest
   thing you can build that proves someone wants it"). Jargon never appears
   undefined.
3. Day 1 explicitly introduces the two tracks: Track A = your own idea,
   Track B = the SeniorPass default story, and says you can switch any day.
4. Continuity: each day's opening references what the student did the day before.
5. Voice: English (the map's language), short sentences, Thai student context
   (LINE groups, PromptPay, midterms, M.4–M.6) kept; no em dashes (project rule).
6. Missions keep their current asks (same deliverables) but get rewritten for
   clarity. Day 3's `$	imes$` becomes `x`.
7. HTML stays simple (`<p>`, `<ul>`, `<li>`, `<ol>`, `<strong>`, `<em>`,
   `<blockquote>`, `<pre><code>`) — the renderer injects raw HTML with panel CSS.
8. Do not touch `image` content rows, `display_order`, or node titles.

Content IDs are deterministic (e.g. Day 1 texts are
`00000000-0000-0000-0013-000000000001..003`); the rewrite scripts target rows by
ID. Verification: re-run `scripts/dump-launchpad-content.ts` and diff.

## Generic Variant (all other maps)

Same full-screen Dawn shell and staged choreography, content from the map record:

1. `"You're in."` keynote (same)
2. Map title + category eyebrow
3. One stats row of real values only: `N islands` from `node_count`, difficulty
   label from the existing `getDifficultyInfo` thresholds. Omit any stat that is
   missing; never render "multiple islands"-style filler.
4. `map.description` as the supporting line (fallback sentence retained), CTA
   `Start Exploring`

The old wizard steps ("How It Works", "Pro Tip", community/leaderboard filler)
are deleted, not ported.

## Behavior, A11y, Mobile

- **Close paths:** CTA, "Look around first" / "Start Exploring", `Esc`, backdrop
  click. All write `map-welcome-tour-seen:<map.id>` = `"true"` exactly as today,
  so the experience never replays.
- **CTA behavior:** closes the overlay only (the map is already underneath). No
  new API calls, no navigation. (Deliberate: first-action routing was not the
  chosen goal.)
- **A11y:** `role="dialog"`, `aria-modal="true"`, focus trapped while open, focus
  returned to the map on close, stage text announced via visually-hidden live
  region.
- **Reduced motion:** under `prefers-reduced-motion`, all stages render
  immediately in final state — same content, zero choreography. Follows the Dawn
  scene's own motion contract.
- **Mobile:** day path becomes a vertical stack on narrow viewports; all touch
  targets ≥ 44px.
- **Type:** Kodchasan display for the keynote/title, Bai Jamjuree for body and
  labels, per the design-system type rules.

## Testing

- Jest/RTL tests in `components/map/__tests__/MapWelcomeExperience.test.tsx`:
  - LaunchPad map (title contains "launchpad") renders the cinematic copy and
    all six day labels (after skip/reduced-motion path).
  - Non-LaunchPad map renders generic copy with `node_count` and difficulty.
  - Any close path writes the `map-welcome-tour-seen:<id>` localStorage key.
  - `prefers-reduced-motion` renders the final state immediately.
- Manual pass in dev on desktop and a mobile viewport.

## Out of Scope

- Navigating to or highlighting the first node (CTA only closes the overlay)
- Cohort/streak/live data
- Changes to `MapEnrollmentTracker` enrollment logic
- Thai-language variant of the stage copy
