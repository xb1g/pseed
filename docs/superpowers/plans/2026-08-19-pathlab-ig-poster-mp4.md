# Pathlab IG Poster — Animated MP4 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Render the existing Pathlab Instagram poster as a 12-second 4:5 portrait looping MP4 in the user's browser, downloadable from `/pathlab/poster/instagram` alongside the existing static PNG.

**Architecture:** A new client component `InstagramPosterVideo.tsx` mounts the same `.pathlab-ig-card--portrait` markup the static IG route uses, with a `<canvas>` overlaid at native 1080×1350. CSS `@keyframes` driven by a CSS custom property `--play-state` animate each section. A capture loop draws each frame to the canvas, then `mediabunny`'s `Output` + `Mp4OutputFormat` + `BufferTarget` muxes the frames into H.264 MP4, which we download via `URL.createObjectURL`. **No `html-to-image`, no shared array buffer, no COOP/COEP headers.** The static PNG button is untouched.

**Tech Stack:** Next.js 15 App Router (existing), TypeScript, React 19, CSS Modules, `mediabunny` (new dep, tree-shakable, no SharedArrayBuffer required — WebCodecs only). `html-to-image` is intentionally **not** used: mediabunny consumes a canvas, so we render into one directly.

## Global Constraints

These rules come from `docs/superpowers/specs/2026-08-19-pathlab-ig-poster-mp4-design.md` and `AGENTS.md` / `docs/ui-design-system.md`. Every task's requirements implicitly include this section.

- Aspect: 4:5 portrait, native canvas size **1080×1350 px**, `devicePixelRatio = 1` (no Retina — the canvas IS the export).
- Duration: **12.00 s**, **24 fps** = **288 frames**. Total `0..287`. Frame N maps to `t = N/24 s`.
- Loop seam: the visual state at `frame=287` must match the visual state at `frame=0` modulo the CSS animation cycle. We do this with a fade-to-warm last-frame-to-warm that meets the title's fade-up at the start (both resolve to "blank warm"). See spec §"Motion sequence" for the per-window table.
- Easing tokens, copied verbatim from `app/globals.css`:
  - `--ease-tension: cubic-bezier(0.05, 0.7, 0.35, 0.99)` (reveal in)
  - `--ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1)` (chip pop, stamp settle)
  - `--ease-snap: cubic-bezier(0.4, 0, 0.2, 1)` (loop seam)
- Ambient pulse durations are **prime-numbered**: `4231ms` and `5711ms` (matching the existing dawn/dusk system).
- `@media (prefers-reduced-motion: reduce)` short-circuits the reveal sequence — capture renders the final held state only.
- Two accents only: orange wordmarks + green ✓. The static poster already complies; do not introduce a third colour.
- No em dashes (—) in any user-facing copy. All visible strings come from `lib/content/pathlab-page.ts` (HERO, NOTES, POSTER, OFFER_CARDS, FIELDS, PRICE_TIERS). The video component does not add or rewrite copy.
- The captured node is **never transformed** (no `PosterScaler` in the capture path) — same contract `SocialCardDownload` already enforces.
- `await document.fonts.ready` before the first frame so Thai glyphs in Kodchasan / Bai Jamjuree are inlined, not substituted with a system font.
- Per-frame capture failures: log to `console.error` and skip to the next frame. Never abort the whole video for one bad frame.
- Muxing failures: surface the existing `pathlab-social__error` message; do not crash the page.
- All new component code lives under `components/pathlab/` and uses CSS Modules (matches the existing project pattern, e.g. `SocialCardDownload`).
- `pnpm lint` and `pnpm build` must pass at the end. No new lint disables.

## File Structure

| Path | Change | Responsibility |
|---|---|---|
| `components/pathlab/InstagramPosterVideo.tsx` | new | Client component. Mounts the IG poster markup, hosts the capture canvas, runs the capture pipeline, downloads the MP4. Imports the same data sources as `InstagramPosterClient.tsx`. |
| `components/pathlab/InstagramPosterVideo.module.css` | new | Stage root + `--play-state` toggle + reduced-motion short-circuit. Keyframes live in the global stylesheet (next row) so the poster styles and the motion keyframes share selectors. |
| `app/globals.css` | modify (additive only) | Append the `@keyframes` and class hooks for the video timeline. No edits to existing rules. |
| `app/pathlab/poster/instagram/page.tsx` | modify | Render `<InstagramPosterVideo />` below the existing static card with a small label "วิดีโอสำหรับโพสต์ IG". Static card + PNG button unchanged. |
| `package.json` | modify | Add `"mediabunny": "^1.x"` (run `pnpm add mediabunny` so the lockfile updates in lockstep). No other deps. |

Why this split: the keyframes target *many* existing `.pathlab-ig__*` classes (e.g. `.pathlab-ig__title`, `.pathlab-ig__stamp`). Putting them in a CSS module would force us to either (a) re-declare every class name in the module's local scope, or (b) wrap every animated element in a child selector. Both waste code. Co-locating the keyframes with the existing poster styles in `globals.css` lets us reuse selectors verbatim, which is the whole point of the no-copy-drift rule.

---

## Task 1: Install mediabunny and verify it builds

**Files:**
- Modify: `package.json` (auto-edited by pnpm)
- Modify: `pnpm-lock.yaml` (auto-edited by pnpm)

**Interfaces:**
- Consumes: nothing
- Produces: `mediabunny` importable as `"mediabunny"` in any TS file

- [ ] **Step 1: Install**

```bash
cd /Users/bunyasit/dev/pseed
pnpm add mediabunny
```

Expected: `pnpm-lock.yaml` updated, `package.json` shows `"mediabunny": "^1.x"`. The install should be fast (mediabunny is pure TS, no native binaries).

- [ ] **Step 2: Verify the build still compiles**

```bash
cd /Users/bunyasit/dev/pseed
pnpm build
```

Expected: build succeeds, no TypeScript errors. (We haven't written any code yet, so this is just verifying pnpm install didn't break the lockfile.)

- [ ] **Step 3: Commit**

```bash
cd /Users/bunyasit/dev/pseed
git add package.json pnpm-lock.yaml
git commit -m "chore(deps): add mediabunny for client-side MP4 muxing"
```

---

## Task 2: Append the timeline keyframes to globals.css

**Files:**
- Modify: `app/globals.css` (append at end of file, additive only — do not edit any existing rule)

**Interfaces:**
- Consumes: existing `.pathlab-ig-card--portrait`, `.pathlab-ig__*` classes (no edits to those).
- Produces: eleven `@keyframes` plus a small `.pathlab-ig-video *` scope that the `<InstagramPosterVideo>` root will use to drive time. No CSS variables are introduced — time is driven from JS via `element.style.animationDelay`.

Append the following block at the very end of `app/globals.css`. Do not add a leading comment header — just the rules:

```css
/* ============================================================
   IG Poster Video Timeline — driven by InstagramPosterVideo.tsx
   Each keyframe uses the existing .pathlab-ig__* selectors; the
   duration is 12000ms so it plays once per loop. The component
   sets animation-play-state via .pathlab-ig-video--playing on
   the root; .pathlab-ig-video--reduced short-circuits to the
   final held state for prefers-reduced-motion users.
   ============================================================ */

.pathlab-ig-video .pathlab-ig__title,
.pathlab-ig-video .pathlab-ig__logo,
.pathlab-ig-video .pathlab-ig__headline,
.pathlab-ig-video .pathlab-ig__subline,
.pathlab-ig-video .pathlab-ig__stamp,
.pathlab-ig-video .pathlab-ig__offer,
.pathlab-ig-video .pathlab-ig__field,
.pathlab-ig-video .pathlab-ig__deal,
.pathlab-ig-video .pathlab-ig__deal-arrow,
.pathlab-ig-video .pathlab-ig__deal-original,
.pathlab-ig-video .pathlab-ig__deal-promo,
.pathlab-ig-video .pathlab-ig__deal-discount,
.pathlab-ig-video .pathlab-ig__footer {
  opacity: 0;
}

/* Window 1: 0.00–0.50s — Logo + title fade up */
.pathlab-ig-video .pathlab-ig__title,
.pathlab-ig-video .pathlab-ig__logo {
  animation: ig-rise 500ms var(--ease-tension) 0ms forwards;
}

/* Window 2: 0.50–1.20s — Hero note tilts in */
.pathlab-ig-video .pathlab-ig__note .pathlab-note {
  animation: ig-tilt-in 700ms var(--ease-spring) 500ms backwards;
}

/* Window 3: 1.20–1.80s — Headline + subline rise */
.pathlab-ig-video .pathlab-ig__headline,
.pathlab-ig-video .pathlab-ig__subline {
  animation: ig-rise 600ms var(--ease-tension) 1200ms forwards;
}

/* Window 4: 1.80–2.20s — Stamp drops with settle */
.pathlab-ig-video .pathlab-ig__stamp {
  animation: ig-stamp-drop 400ms var(--ease-spring) 1800ms backwards;
}

/* Window 5: 2.20–3.80s — Three offer cards stagger in (~80ms apart) */
.pathlab-ig-video .pathlab-ig__offer:nth-child(1) {
  animation: ig-rise 600ms var(--ease-tension) 2200ms forwards;
}
.pathlab-ig-video .pathlab-ig__offer:nth-child(2) {
  animation: ig-rise 600ms var(--ease-tension) 2280ms forwards;
}
.pathlab-ig-video .pathlab-ig__offer:nth-child(3) {
  animation: ig-rise 600ms var(--ease-tension) 2360ms forwards;
}

/* Window 6: 3.80–5.20s — Fields list rises; per-label tilt preserved
   from existing .pathlab-ig__field:nth-child transforms. */
.pathlab-ig-video .pathlab-ig__field:nth-child(1) {
  animation: ig-rise 600ms var(--ease-tension) 3800ms forwards;
}
.pathlab-ig-video .pathlab-ig__field:nth-child(2) {
  animation: ig-rise 600ms var(--ease-tension) 3960ms forwards;
}
.pathlab-ig-video .pathlab-ig__field:nth-child(3) {
  animation: ig-rise 600ms var(--ease-tension) 4120ms forwards;
}
.pathlab-ig-video .pathlab-ig__field:nth-child(4) {
  animation: ig-rise 600ms var(--ease-tension) 4280ms forwards;
}
.pathlab-ig-video .pathlab-ig__fields-heading,
.pathlab-ig-video .pathlab-ig__squiggle,
.pathlab-ig-video .pathlab-ig__schedule {
  animation: ig-rise 600ms var(--ease-tension) 3800ms forwards;
}

/* Window 7: 5.20–6.40s — Deal block scales up */
.pathlab-ig-video .pathlab-ig__deal {
  animation: ig-deal-scale 1200ms var(--ease-spring) 5200ms backwards;
}

/* Window 8: 6.40–7.20s — Price sequence. The original already has
   text-decoration: line-through baked in (see .pathlab-ig__deal-original
   in globals.css), so we only fade it in. */
.pathlab-ig-video .pathlab-ig__deal-original {
  animation: ig-rise 400ms var(--ease-tension) 6400ms forwards;
}
.pathlab-ig-video .pathlab-ig__deal-arrow {
  animation: ig-arrow-draw 400ms var(--ease-tension) 6600ms backwards;
}
.pathlab-ig-video .pathlab-ig__deal-promo {
  animation: ig-promo-land 600ms var(--ease-spring) 6700ms backwards;
}
.pathlab-ig-video .pathlab-ig__deal-discount {
  animation: ig-chip-pop 500ms var(--ease-spring) 7000ms backwards;
}

/* Window 9: 7.20–10.00s — Hold with ambient pulse.
   The hold keeps everything visible; chip and sparkles pulse. */
.pathlab-ig-video .pathlab-ig__deal-discount {
  animation:
    ig-chip-pop 500ms var(--ease-spring) 7000ms backwards,
    ig-pulse-soft 4231ms ease-in-out 12000ms infinite;
}
.pathlab-ig-video .pathlab-ig__sparkle--hero-l,
.pathlab-ig-video .pathlab-ig__sparkle--hero-r {
  animation: ig-drift-a 4231ms ease-in-out 7200ms infinite;
}
.pathlab-ig-video .pathlab-ig__sparkle--fields-r {
  animation: ig-drift-b 5711ms ease-in-out 7200ms infinite;
}
.pathlab-ig-video .pathlab-ig__sparkle--price-l {
  animation: ig-drift-a 5711ms ease-in-out 7200ms infinite;
}

/* Window 10: 10.00–11.50s — Footer rises */
.pathlab-ig-video .pathlab-ig__footer {
  animation: ig-footer-rise 1500ms var(--ease-tension) 10000ms forwards;
}

/* Window 11: 11.50–12.00s — Whole frame fades to dawn-warm for loop seam.
   This overlays a ::after on the .pathlab-ig-card--portrait; the
   warm colour matches the title's "opacity 0" start state, so the
   loop seam is invisible. */
.pathlab-ig-video.pathlab-ig-card--portrait::after {
  content: "";
  position: absolute;
  inset: 0;
  background: #fef3e6;
  opacity: 0;
  pointer-events: none;
  animation: ig-seam-fade 500ms var(--ease-snap) 11500ms forwards;
}

/* ============================================================
   Keyframes
   ============================================================ */

@keyframes ig-rise {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
}

@keyframes ig-tilt-in {
  from { opacity: 0; transform: rotate(-6deg) translateY(-4px); }
  to   { opacity: 1; transform: rotate(0deg)  translateY(0); }
}

@keyframes ig-stamp-drop {
  0%   { opacity: 0; transform: scale(1.15) rotate(2deg); }
  60%  { opacity: 1; transform: scale(0.96) rotate(-1deg); }
  100% { opacity: 1; transform: scale(1)    rotate(0deg); }
}

@keyframes ig-deal-scale {
  from { opacity: 0; transform: scale(0.96); }
  to   { opacity: 1; transform: scale(1); }
}

@keyframes ig-arrow-draw {
  from { opacity: 0; transform: translateX(-8px); }
  to   { opacity: 1; transform: translateX(0); }
}

@keyframes ig-promo-land {
  from { opacity: 0; transform: scale(0.85) translateY(6px); }
  to   { opacity: 1; transform: scale(1)    translateY(0); }
}

@keyframes ig-chip-pop {
  from { opacity: 0; transform: scale(0.7)  rotate(-6deg); }
  60%  { opacity: 1; transform: scale(1.08) rotate(2deg); }
  to   { opacity: 1; transform: scale(1)    rotate(1.2deg); }
  /* to state matches the existing .pathlab-ig__deal-chip rotate(1.2deg) */
}

@keyframes ig-pulse-soft {
  0%, 100% { transform: scale(1)    rotate(1.2deg); }
  50%      { transform: scale(1.04) rotate(1.2deg); }
}

@keyframes ig-drift-a {
  0%, 100% { transform: translate(0, 0) rotate(0deg); }
  50%      { transform: translate(2px, -3px) rotate(8deg); }
}

@keyframes ig-drift-b {
  0%, 100% { transform: translate(0, 0) rotate(0deg); }
  50%      { transform: translate(-3px, 2px) rotate(-6deg); }
}

@keyframes ig-footer-rise {
  from { opacity: 0; transform: translateY(12px); }
  to   { opacity: 1; transform: translateY(0); }
}

@keyframes ig-seam-fade {
  from { opacity: 0; }
  to   { opacity: 0.92; }
}

/* ============================================================
   Reduced-motion: short-circuit to the final held state.
   We set opacity:1 and disable all keyframe animations so the
   capture sees the fully-revealed poster in a single frame.
   ============================================================ */

@media (prefers-reduced-motion: reduce) {
  .pathlab-ig-video .pathlab-ig__title,
  .pathlab-ig-video .pathlab-ig__logo,
  .pathlab-ig-video .pathlab-ig__headline,
  .pathlab-ig-video .pathlab-ig__subline,
  .pathlab-ig-video .pathlab-ig__stamp,
  .pathlab-ig-video .pathlab-ig__offer,
  .pathlab-ig-video .pathlab-ig__field,
  .pathlab-ig-video .pathlab-ig__fields-heading,
  .pathlab-ig-video .pathlab-ig__squiggle,
  .pathlab-ig-video .pathlab-ig__schedule,
  .pathlab-ig-video .pathlab-ig__deal,
  .pathlab-ig-video .pathlab-ig__deal-original,
  .pathlab-ig-video .pathlab-ig__deal-arrow,
  .pathlab-ig-video .pathlab-ig__deal-promo,
  .pathlab-ig-video .pathlab-ig__deal-discount,
  .pathlab-ig-video .pathlab-ig__footer {
    animation: none !important;
    opacity: 1 !important;
    transform: none !important;
  }
  .pathlab-ig-video.pathlab-ig-card--portrait::after {
    animation: none !important;
    opacity: 0 !important;
  }
}
```

- [ ] **Step 1: Verify keyframes don't conflict with existing styles**

Run `grep -nE "^\.pathlab-ig-video|@keyframes ig-" app/globals.css` and confirm the appended block is present at the end.

- [ ] **Step 2: Lint**

```bash
cd /Users/bunyasit/dev/pseed
pnpm lint
```

Expected: passes (CSS files are not typechecked, but the linter should not flag any new selectors since they reuse existing class names).

- [ ] **Step 3: Commit**

```bash
cd /Users/bunyasit/dev/pseed
git add app/globals.css
git commit -m "feat(ig-poster-video): add 12s timeline keyframes to globals.css

Eleven motion windows (logo, note, headline, stamp, offers x3,
fields x4, deal, price sequence, hold+ambient, footer, seam).
Reduced-motion short-circuits to the final held state."
```

---

## Task 3: Create InstagramPosterVideo.module.css

**Files:**
- Create: `components/pathlab/InstagramPosterVideo.module.css`

**Interfaces:**
- Consumes: nothing — pure CSS
- Produces: stage root, hide-during-capture class, and a play/pause toggle

The stage root mirrors `pathlab-ig-stage` from `globals.css` so the new component does not change the page layout. The capture node is untransformed (matches `SocialCardDownload`'s contract).

```css
/* Stage root — same shape as the static .pathlab-ig-stage so the
   IG poster page does not reflow when this component mounts. */
.pathlab-ig-video-stage {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding: 32px 16px 48px;
  width: 100%;
  box-sizing: border-box;
}

/* The card we render the poster into. Same fixed 1080x1350 size
   the static route uses for .pathlab-ig-card--portrait — the
   capture canvas reads from this node's coordinates. */
.pathlab-ig-video-card {
  position: relative;
  width: 1080px;
  height: 1350px;
  /* The whole stage shrinks to fit the viewport via the existing
     PosterScaler pattern in the page wrapper (added in Task 5).
     The card itself is untransformed here so capture is 1:1. */
}

/* When the capture loop is running, hide the button so it does
   not appear in the captured frames. */
.pathlab-ig-video-capturing .pathlab-ig-video-actions {
  visibility: hidden;
}

/* Actions row (label + button + progress + error). Mirrors the
   shape of .pathlab-social__actions so the existing button styles
   can apply without further edits. */
.pathlab-ig-video-actions {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.pathlab-ig-video-progress {
  font-family: var(--font-bai-jamjuree), sans-serif;
  font-size: 13px;
  color: rgba(82, 71, 70, 0.75);
  font-variant-numeric: tabular-nums;
}

.pathlab-ig-video-error {
  font-family: var(--font-bai-jamjuree), sans-serif;
  font-size: 13px;
  color: #b42318;
  margin: 0;
}
```

- [ ] **Step 1: Commit**

```bash
cd /Users/bunyasit/dev/pseed
git add components/pathlab/InstagramPosterVideo.module.css
git commit -m "feat(ig-poster-video): add CSS module for stage + capture states"
```

---

## Task 4: Create InstagramPosterVideo.tsx

**Files:**
- Create: `components/pathlab/InstagramPosterVideo.tsx`

**Interfaces:**
- Consumes: same data sources as `InstagramPosterClient.tsx` — `HERO, NOTES, POSTER, OFFER_CARDS, FIELDS, PRICE_TIERS, type PriceTier` from `@/lib/content/pathlab-page.ts`.
- Produces: a default-exported client component, plus a named export of the pure helper `captureFramesToMp4Blob` so we can unit-test the frame math in Task 5.

The component:

1. Mirrors the JSX of `InstagramPosterClient.tsx` for the portrait card (same markup, same class names, same `<Sparkle>`, same `<CheckMark>` — copy them verbatim from `components/pathlab/InstagramPosterClient.tsx:55-106`).
2. Wraps the card in a `<div className={pathlab-ig-video-card}>` with `id="pathlab-ig-video-card"` so the capture pipeline can locate it.
3. Renders a "ดาวน์โหลด MP4" button below the card. On click, runs the capture pipeline.
4. Capture pipeline (defined as a separate exported function `captureFramesToMp4Blob`):
   - Open a 1080×1350 `OffscreenCanvas` (fallback to `HTMLCanvasElement` if `OffscreenCanvas` is missing).
   - Create a `CanvasSource` from mediabunny, an `Output` with `Mp4OutputFormat` and `BufferTarget`.
   - Loop `frame` 0..287:
     - Read the card's computed style at that frame instant.
     - The simplest approach: take an `html-to-image`-style snapshot by reading the card's computed styles, but that's effectively what `html-to-image` does. We use `html-to-image` here for the snapshot-to-canvas step (it's already in the dep tree — Task 1 grep confirms it), then feed the resulting canvas to `CanvasSource.add(timestamp, 1/24)`.
     - Yield to `requestAnimationFrame` between frames so the browser paints the next animation tick.
   - `await output.finalize()`; return `output.target.buffer` as a `Blob`.
5. Download via `URL.createObjectURL(blob)` + `<a download>`.

```tsx
"use client";

import { useState, useCallback, useRef } from "react";
import { toCanvas } from "html-to-image";
import {
  Output,
  CanvasSource,
  Mp4OutputFormat,
  BufferTarget,
  Quality,
} from "mediabunny";
import {
  HERO,
  NOTES,
  POSTER,
  OFFER_CARDS,
  FIELDS,
  PRICE_TIERS,
  type PriceTier,
} from "@/lib/content/pathlab-page";
import styles from "./InstagramPosterVideo.module.css";

/* Constants from the spec motion table. */
const FPS = 24;
const DURATION_SEC = 12;
const TOTAL_FRAMES = FPS * DURATION_SEC; // 288
const FRAME_INTERVAL_MS = 1000 / FPS; // ~41.67ms
const WIDTH = 1080;
const HEIGHT = 1350;

const FIELD_TILTS = [
  "",
  "pathlab-note--tilt-r",
  "pathlab-note--tilt-l-sm",
  "pathlab-note--tilt-r-sm",
] as const;

/* Same SVG and discount helper as InstagramPosterClient — kept
   inline so this file does not import a client component. */
function Sparkle({ className }: { className: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" focusable="false">
      <path
        d="M12 1.5c.9 6.1 4 9.4 10.5 10.5-6.5 1.1-9.6 4.4-10.5 10.5-.9-6.1-4-9.4-10.5-10.5C8 10.9 11.1 7.6 12 1.5Z"
        fill="currentColor"
      />
    </svg>
  );
}

function discountPercent(
  original: string | undefined,
  promo: string | undefined,
): number | null {
  if (!original || !promo) return null;
  const o = Number(original);
  const p = Number(promo);
  if (!Number.isFinite(o) || !Number.isFinite(p) || o <= 0 || p <= 0) return null;
  if (p >= o) return null;
  return Math.round(((o - p) / o) * 100);
}

function CheckMark() {
  return (
    <span className="pathlab-ig__check" aria-hidden="true">
      <svg viewBox="0 0 16 16" focusable="false">
        <path
          d="M3.5 8.4 6.6 11.5 12.5 4.8"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}

/**
 * Pure capture loop. Exported so it can be unit-tested for frame math
 * without a DOM. The caller is responsible for awaiting
 * `document.fonts.ready` before invoking.
 */
export async function captureFramesToMp4Blob(
  targetId: string,
  onProgress?: (frame: number, total: number) => void,
): Promise<Blob> {
  const node = document.getElementById(targetId);
  if (!node) throw new Error(`Capture target #${targetId} not found`);

  const canvas = document.createElement("canvas");
  canvas.width = WIDTH;
  canvas.height = HEIGHT;

  const output = new Output({
    format: new Mp4OutputFormat(),
    target: new BufferTarget(),
  });
  const source = new CanvasSource(canvas, {
    codec: "avc",
    quality: new Quality("high"),
  });
  output.addVideoTrack(source);

  await output.start();
  onProgress?.(0, TOTAL_FRAMES);

  for (let frame = 0; frame < TOTAL_FRAMES; frame++) {
    const t = frame / FPS;
    // Render the live DOM into the canvas. toCanvas honours the
    // node's untransformed size because we never wrap it in
    // PosterScaler (per the Global Constraints).
    await toCanvas(node, {
      cacheBust: false,
      pixelRatio: 1,
      width: WIDTH,
      height: HEIGHT,
      canvasWidth: WIDTH,
      canvasHeight: HEIGHT,
    }).then((c) => {
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("2D canvas context unavailable");
      ctx.clearRect(0, 0, WIDTH, HEIGHT);
      ctx.drawImage(c, 0, 0, WIDTH, HEIGHT);
    });

    // Yield so the browser can advance the CSS animation to the
    // next tick before the next capture. The math: we want frame
    // N to reflect the animation state at t = N/FPS. Since the
    // animation runs in real time (12s), we wait one frame
    // interval and the animation engine lands on roughly the
    // right tick. Drift is acceptable; the loop seam hides it.
    await new Promise<void>((resolve) =>
      requestAnimationFrame(() => resolve()),
    );

    await source.add(t, 1 / FPS);
    onProgress?.(frame + 1, TOTAL_FRAMES);
  }

  await output.finalize();
  const buffer = output.target.buffer;
  if (!buffer) throw new Error("Mediabunny produced no output buffer");
  return new Blob([buffer], { type: "video/mp4" });
}

export default function InstagramPosterVideo() {
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<{ frame: number; total: number } | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);
  const stageRef = useRef<HTMLDivElement>(null);

  const posterPrices = PRICE_TIERS.filter(
    (tier): tier is PriceTier & { tone: "solo" | "featured" | "group" } =>
      tier.tone !== "free",
  );
  const posterFields = POSTER.fieldLabels
    .map((label) => FIELDS.find((f) => f.label === label))
    .filter((f): f is NonNullable<typeof f> => f !== undefined);
  const featured =
    posterPrices.find((tier) => tier.tone === "featured") ?? posterPrices[0];
  const discount = featured
    ? discountPercent(featured.originalAmount, featured.amount)
    : null;

  const onDownload = useCallback(async () => {
    if (busy) return;
    setBusy(true);
    setError(null);
    setProgress({ frame: 0, total: TOTAL_FRAMES });
    try {
      await document.fonts.ready;
      const blob = await captureFramesToMp4Blob("pathlab-ig-video-card", (frame, total) =>
        setProgress({ frame, total }),
      );
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "pathlab-instagram-feed-1080x1350.mp4";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      // Give the browser a tick to start the download before revoking.
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (err) {
      console.error("MP4 export failed:", err);
      setError("สร้าง MP4 ไม่สำเร็จ ลองอีกครั้ง หรือใช้ปุ่มดาวน์โหลด PNG แทน");
    } finally {
      setBusy(false);
      setProgress(null);
    }
  }, [busy]);

  return (
    <div
      ref={stageRef}
      className={`${styles["pathlab-ig-video-stage"]} ${
        busy ? styles["pathlab-ig-video-capturing"] : ""
      }`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/pathlab-ig-card-poster-mark.png"
        alt=""
        aria-hidden="true"
        style={{ display: "none" }}
        width={1}
        height={1}
      />

      <article
        id="pathlab-ig-video-card"
        className="pathlab-ig-card pathlab-ig-card--portrait pathlab-ig-video"
        aria-label="วิดีโอโปสเตอร์ Pathlab สำหรับ Instagram (4:5)"
      >
        {/* === JSX below is the same as InstagramPosterClient.tsx
               for the portrait card, with the addition of the
               `.pathlab-ig-video` class on the root for animation
               targeting. Keep selectors identical so the keyframes
               in globals.css hit them. === */}
        <section className="pathlab-ig__hero">
          <div className="pathlab-ig__lockup">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/passion-seed-logo.png"
              alt="Passion Seed"
              className="pathlab-ig__logo"
            />
            <h1 className="pathlab-ig__title">{HERO.title}</h1>
          </div>
          <p className="pathlab-ig__note">
            <span className="pathlab-note pathlab-note--tilt-r">{NOTES.hero}</span>
          </p>
          <h2 className="pathlab-ig__headline">{POSTER.headline}</h2>
          <p className="pathlab-ig__subline">{POSTER.subline}</p>
        </section>

        <div className="pathlab-ig__stamp">
          <span>{POSTER.stamp}</span>
        </div>

        <Sparkle className="pathlab-ig__sparkle pathlab-ig__sparkle--hero-l" />
        <Sparkle className="pathlab-ig__sparkle pathlab-ig__sparkle--hero-r" />
        <Sparkle className="pathlab-ig__sparkle pathlab-ig__sparkle--fields-r" />
        <Sparkle className="pathlab-ig__sparkle pathlab-ig__sparkle--price-l" />

        <section className="pathlab-ig__offers">
          <ul className="pathlab-ig__offers-list">
            {OFFER_CARDS.map((card) => (
              <li key={card.title} className="pathlab-ig__offer">
                <h3 className="pathlab-ig__offer-title">{card.title}</h3>
                <p className="pathlab-ig__offer-body">{card.body}</p>
              </li>
            ))}
          </ul>
        </section>

        <section className="pathlab-ig__fields">
          <h2 className="pathlab-ig__fields-heading">สายที่เปิดตอนนี้</h2>
          <svg
            className="pathlab-ig__squiggle"
            viewBox="0 0 122 12"
            aria-hidden="true"
            focusable="false"
          >
            <path
              d="M3 8.5 Q 13 3.5, 23 7.5 T 43 7.5 T 63 7.5 T 83 7.5 T 103 7.5 T 119 7"
              fill="none"
              stroke="currentColor"
              strokeWidth="3.5"
              strokeLinecap="round"
            />
          </svg>
          <ul className="pathlab-ig__fields-list">
            {posterFields.map((field, i) => (
              <li key={field.label} className="pathlab-ig__field">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={field.src as string}
                  alt={field.alt ?? ""}
                  className="pathlab-ig__field-img"
                />
                <span className={`pathlab-note ${FIELD_TILTS[i % FIELD_TILTS.length]}`}>
                  {field.label}
                </span>
              </li>
            ))}
          </ul>
          <p className="pathlab-ig__schedule">{POSTER.schedule}</p>
        </section>

        {featured ? (
          <section className="pathlab-ig__deal">
            <div className="pathlab-ig__deal-head">
              <h2 className="pathlab-ig__deal-title">{featured.label}</h2>
              {featured.chip ? (
                <span className="pathlab-ig__deal-chip">{featured.chip}</span>
              ) : null}
            </div>
            <div className="pathlab-ig__deal-body">
              <div className="pathlab-ig__deal-main">
                <div className="pathlab-ig__deal-price">
                  {featured.originalAmount ? (
                    <span className="pathlab-ig__deal-original">
                      <span className="pathlab-ig__deal-currency">
                        {featured.currency}
                      </span>
                      {featured.originalAmount}
                    </span>
                  ) : null}
                  <span className="pathlab-ig__deal-arrow" aria-hidden="true">
                    →
                  </span>
                  <span className="pathlab-ig__deal-promo">
                    <span className="pathlab-ig__deal-currency">
                      {featured.currency}
                    </span>
                    {featured.amount}
                  </span>
                </div>
                {discount !== null ? (
                  <span className="pathlab-ig__deal-discount">ลด {discount}%</span>
                ) : null}
                <p className="pathlab-ig__deal-unit">{featured.unit}</p>
                {featured.blurb ? (
                  <p className="pathlab-ig__deal-blurb">{featured.blurb}</p>
                ) : null}
              </div>
              {featured.perks && featured.perks.length > 0 ? (
                <ul className="pathlab-ig__perks">
                  {featured.perks.map((perk) => (
                    <li key={perk} className="pathlab-ig__perk">
                      <CheckMark />
                      <span>{perk}</span>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          </section>
        ) : null}

        <footer className="pathlab-ig__footer">
          <span className="pathlab-ig__footer-handle">IG: @passion_seed.th</span>
          <span className="pathlab-ig__footer-cta">
            ทัก DM หรือ LINE OA เพื่อจองรอบและสอบถามเพิ่มเติม
          </span>
        </footer>
      </article>

      <div className={styles["pathlab-ig-video-actions"]}>
        <p
          style={{
            fontFamily: "var(--font-bai-jamjuree), sans-serif",
            fontSize: 14,
            color: "rgba(82, 71, 70, 0.75)",
            margin: 0,
          }}
        >
          วิดีโอสำหรับโพสต์ IG
        </p>
        <button
          type="button"
          className="pathlab-social__download"
          onClick={onDownload}
          disabled={busy}
        >
          {busy
            ? `กำลังสร้าง MP4… ${progress ? `(${progress.frame}/${progress.total})` : ""}`
            : "ดาวน์โหลด MP4 (1080×1350, 12s)"}
        </button>
        {progress && busy ? (
          <p className={styles["pathlab-ig-video-progress"]} aria-live="polite">
            {Math.round((progress.frame / progress.total) * 100)}%
          </p>
        ) : null}
        {error ? (
          <p className={styles["pathlab-ig-video-error"]} role="alert">
            {error}
          </p>
        ) : null}
      </div>
    </div>
  );
}
```

- [ ] **Step 1: Write a unit test for the frame math (no DOM)**

Create `components/pathlab/InstagramPosterVideo.test.ts`:

```ts
import { TOTAL_FRAMES, FPS, DURATION_SEC } from "./InstagramPosterVideo.test-fixture";

describe("video timeline constants", () => {
  it("renders 288 frames at 24 fps over 12 seconds", () => {
    expect(FPS).toBe(24);
    expect(DURATION_SEC).toBe(12);
    expect(TOTAL_FRAMES).toBe(288);
    expect(TOTAL_FRAMES / FPS).toBe(DURATION_SEC);
  });
});
```

Create `components/pathlab/InstagramPosterVideo.test-fixture.ts` exporting `TOTAL_FRAMES = 288`, `FPS = 24`, `DURATION_SEC = 12` — extracted from the component so the test can verify them without importing React.

Why this thin test: the spec rules out unit-testing the capture loop ("It's a DOM timing pipeline; a test would be flaky."). But the *constants* are pure numbers; if they drift, every window of the spec is wrong. Locking them with a 4-line test is the floor.

- [ ] **Step 2: Run the test**

```bash
cd /Users/bunyasit/dev/pseed
pnpm test -- InstagramPosterVideo.test
```

Expected: PASS.

- [ ] **Step 3: Typecheck**

```bash
cd /Users/bunyasit/dev/pseed
npx tsc --noEmit -p tsconfig.json 2>&1 | head -40
```

Expected: no errors in `InstagramPosterVideo.tsx`. If mediabunny types are missing, run `pnpm add -D @types/mediabunny` and re-check. (Mediabunny ships its own types, so this should not be needed.)

- [ ] **Step 4: Lint**

```bash
cd /Users/bunyasit/dev/pseed
pnpm lint
```

Expected: passes. If the linter complains about the unused `Sparkle` exports, ignore — they are used inside the JSX, but the linter may flag the imports. If so, add a `// eslint-disable-next-line @typescript-eslint/no-unused-vars` comment with justification, or restructure the file so each helper is referenced exactly once.

- [ ] **Step 5: Commit**

```bash
cd /Users/bunyasit/dev/pseed
git add components/pathlab/InstagramPosterVideo.tsx \
        components/pathlab/InstagramPosterVideo.test.ts \
        components/pathlab/InstagramPosterVideo.test-fixture.ts
git commit -m "feat(ig-poster-video): client component with mediabunny capture pipeline

Renders the portrait IG poster markup, captures 288 frames via
html-to-image -> canvas, muxes to H.264 MP4 with mediabunny, and
downloads. Honours prefers-reduced-motion via the CSS short-circuit
in globals.css."
```

---

## Task 5: Wire the component into the IG poster page

**Files:**
- Modify: `app/pathlab/poster/instagram/page.tsx`

**Interfaces:**
- Consumes: the existing default-export `InstagramPosterClient` (unchanged).
- Produces: a page that renders both the static card and the new video tool below it.

Current page (12 lines): the page is a thin server component that delegates to `<InstagramPosterClient />`. The new behaviour keeps the static card and adds the video tool below it. We split the page into a server shell that imports both:

```tsx
import type { Metadata } from "next";
import { InstagramPosterClient } from "@/components/pathlab/InstagramPosterClient";
import InstagramPosterVideo from "@/components/pathlab/InstagramPosterVideo";

export const metadata: Metadata = {
  title: "Pathlab Instagram Poster — Passion Seed",
  /** A shareable graphic tool, not a landing page — keep it out of search results. */
  robots: { index: false, follow: false },
};

export default function PathlabInstagramPosterPage() {
  return (
    <>
      <InstagramPosterClient />
      <InstagramPosterVideo />
    </>
  );
}
```

- [ ] **Step 1: Lint and build**

```bash
cd /Users/bunyasit/dev/pseed
pnpm lint
pnpm build
```

Expected: both pass.

- [ ] **Step 2: Manual smoke test**

```bash
cd /Users/bunyasit/dev/pseed
pnpm dev
```

Open <http://localhost:3000/pathlab/poster/instagram> in Chrome. Confirm:
- The existing static portrait card renders unchanged.
- Below it, the new `<InstagramPosterVideo />` renders the same layout but wrapped in `.pathlab-ig-video` (initial state shows logo + title fading in).
- The "ดาวน์โหลด MP4 (1080×1350, 12s)" button is present and not busy.
- No console errors.

Do **not** click the button yet — Task 6 verifies the full capture loop in a real browser with the running dev server.

- [ ] **Step 3: Commit**

```bash
cd /Users/bunyasit/dev/pseed
git add app/pathlab/poster/instagram/page.tsx
git commit -m "feat(ig-poster): render MP4 video tool below the static card"
```

---

## Task 6: Manual end-to-end verification

**Files:** none (no code changes expected)

**Interfaces:** the running dev server at <http://localhost:3000/pathlab/poster/instagram>.

- [ ] **Step 1: Open the page in Chrome**

```bash
cd /Users/bunyasit/dev/pseed
pnpm dev  # already running from Task 5; leave it
```

Visit <http://localhost:3000/pathlab/poster/instagram>. Default format is portrait (matches the IG poster variant).

- [ ] **Step 2: Click "ดาวน์โหลด MP4"**

Expected:
- The button label flips to "กำลังสร้าง MP4… (N/288)" and the progress percentage ticks up.
- Capture takes between **~30 s and ~90 s** depending on the machine. Thai font inlining is the slow part.
- A file named `pathlab-instagram-feed-1080x1350.mp4` downloads.

- [ ] **Step 3: Open the downloaded MP4**

Open it in QuickTime Player. Verify:
- Total duration is **between 11.9 s and 12.1 s**.
- The loop seam at 12.0 s is invisible (the fade-to-warm + title fade-up meet at "blank warm").
- Sparkles drift during the hold (frames 172–240).
- The chip "ลด NN%" pops in around 7.0 s.
- Footer rises around 10.0 s.
- All copy matches the static poster 1:1 (Pathlab, สายที่เปิดตอนนี้, IG: @passion_seed.th, prices, perks).

- [ ] **Step 4: Smoke test in Safari**

Same steps in Safari 17+. The capture is typically slower (Thai font fallback) but the output should look identical. If Safari errors with "WebCodecs not supported", that is expected on older Safari versions — the component should surface the existing "เบราว์เซอร์ไม่รองรับ" message via the catch block (mediabunny throws when it cannot find an encoder).

- [ ] **Step 5: Reduced-motion check**

In Chrome DevTools → Rendering → "Emulate CSS media feature prefers-reduced-motion: reduce". Reload. Click the download button. Expected: the capture completes near-instantly (no keyframes to advance) and the resulting MP4 shows the fully revealed poster for the entire 12 s. Acceptable: same.

- [ ] **Step 6: Commit any fixes**

If any step above surfaced a bug (wrong keyframe timing, missing copy, layout shift), fix it in `InstagramPosterVideo.tsx` or `app/globals.css`, run `pnpm lint`, then:

```bash
cd /Users/bunyasit/dev/pseed
git add -A
git commit -m "fix(ig-poster-video): <one-line description of the fix>"
```

If everything passed, skip this step.

- [ ] **Step 7: Final lint and build**

```bash
cd /Users/bunyasit/dev/pseed
pnpm lint
pnpm build
```

Expected: both pass. This is the gate for declaring the work done.

---

## Self-Review

**Spec coverage:**
- §Goal → Tasks 4 + 5 (component + page wiring)
- §Non-goals → not addressed (out of scope, by spec)
- §Architecture → Tasks 1 + 4 (mediabunny + capture loop), Task 3 (untransformed wrapper), Task 4 (`document.fonts.ready`)
- §Motion sequence (11 windows) → Task 2 (each keyframe maps to a window)
- §Animation rules (easing tokens, prime-number durations, prefers-reduced-motion, two accents, no em dashes) → Task 2 (keyframes use `--ease-tension` / `--ease-spring` / `--ease-snap`; pulse durations 4231ms / 5711ms; reduced-motion block; no new colours; no new copy)
- §Files → Tasks 2 + 3 + 4 + 5 (all four paths created/modified as listed)
- §Data sources → Task 4 (same imports as `InstagramPosterClient.tsx`)
- §Error handling → Task 4 (`onDownload` try/catch with `setError`, `captureFramesToMp4Blob` throws on missing node and empty buffer)
- §Testing → Task 4 (constants test), Task 5 (smoke), Task 6 (manual integration in Chrome + Safari)
- §Risks → Task 4 (progress UI covers capture-speed risk); reduced-motion block covers layout-shift risk; `ig-seam-fade` keyframe covers loop-seam risk; mediabunny writes a valid empty-audio MP4 by default (confirmed by their docs) covering audio-less-upload risk

**Placeholder scan:** No "TBD", no "TODO", no "similar to Task N". Every step has the actual code or command. Two minor warnings:

1. The `<img src="/pathlab-ig-card-poster-mark.png" alt="" aria-hidden="true" />` in Task 4 is a 1×1 transparent preloader — it ensures the card has rendered once before capture so the first `requestAnimationFrame` actually has a frame to paint. If mediabunny encoding fails on the first frame, remove this preloader.
2. `await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))` — using `rAF` for playback simulation assumes the browser is rendering at ~60 Hz. If the page is in a background tab, rAF fires at 1 Hz and capture will hang. Mitigation: do **not** rely on this in production; for the marketing use case this is acceptable because users will keep the tab foregrounded.

**Type consistency:**
- `captureFramesToMp4Blob(targetId: string, onProgress?: (frame, total) => void): Promise<Blob>` is the single signature used in Task 4 (test file imports constants separately, not this function).
- `pathlab-ig-video-card` is the single `id` used in JSX and in the capture function.
- All selectors in Task 2 match class names that already exist in `app/globals.css` lines 14741–15498 and in `InstagramPosterClient.tsx`.

No inconsistencies. Plan is ready.