# Pathlab IG Poster — Animated MP4

**Status:** design approved, ready for plan
**Date:** 2026-08-19
**Owner:** pseed/web
**Aspect:** 4:5 portrait (1080×1350) — matches the existing `/pathlab/poster/instagram` route
**Duration:** 12 seconds, 24 fps, seamlessly looping

## Goal

Turn the existing Pathlab Instagram poster into a 12-second looping MP4 you can post to Instagram, without duplicating the poster's copy, layout, or accent palette.

The static PNG export button on `/pathlab/poster/instagram` stays exactly as it is. A new "ดาวน์โหลด MP4" button sits below it and renders the same canvas as an MP4 in the user's browser.

## Non-goals (YAGNI)

- Audio, voice-over, music bed. Marketing can add these in the IG app after export.
- Other aspect ratios (1:1, 9:16). Same component, different `cardClass` — follow-up if asked.
- Server-side rendering (Remotion Lambda, headless render). Local browser capture is enough for a weekly posting cadence.
- Reels text overlays ("Swipe →", "Link in bio"). Out of scope; the IG app handles these.
- Unit tests for the frame-capture pipeline. It's a DOM timing pipeline; a test would be flaky. The reviewer watches the output MP4.

## Architecture

A new client component `InstagramPosterVideo.tsx` mounts the same `.pathlab-ig-card--portrait` markup the static IG route already uses, wrapped in a controlled timeline driven by a CSS `--play-state` and `--frame` custom property. A button triggers a capture pipeline:

1. Mount the card once inside a non-transformed wrapper (same contract as `SocialCardDownload`).
2. Await `document.fonts.ready` (so Thai fonts are inlined, not substituted).
3. For `frame` in `0..N-1`:
   - Set `--frame` on the wrapper; CSS `@keyframes` advance the visible state.
   - Yield to `requestAnimationFrame` so the browser paints.
   - Call `html-to-image` `toPng()` against the captured node.
4. Feed PNG data URLs into `mediabunny` (preferred) or `@ffmpeg/ffmpeg` (fallback) to mux to H.264/MP4.
5. Trigger download via `URL.createObjectURL`.

The `PosterScaler` wrapper is **not** used in the capture pipeline — it would transform the captured node and break the "captured node is never transformed" contract that `SocialCardDownload` already enforces. The capture sees the node at its native 1080×1350.

The static PNG button (already in `InstagramPosterClient`) is reused unchanged: same `targetId`, same `SocialCardDownload`, same exports.

## Motion sequence (12s = 288 frames @ 24fps)

| Window | Frames | What moves | Easing |
|---|---|---|---|
| 0.00–0.50s | 0–12 | Logo + title fade up (`opacity 0→1`, `translateY 8px→0`) | `--ease-tension` |
| 0.50–1.20s | 12–28 | Hero `.pathlab-note` tilts into place (uses existing `--tilt-r`) | `--ease-spring` |
| 1.20–1.80s | 28–43 | Headline + subline rise | `--ease-tension` |
| 1.80–2.20s | 43–52 | Stamp drops in with `scale 1.15→1` settle | `--ease-spring` |
| 2.20–3.80s | 52–91 | Three offer cards stagger in (left, mid, right; ~80ms apart) | `--ease-tension` |
| 3.80–5.20s | 91–124 | Fields list rises; each label uses the existing `FIELD_TILTS` to feel handwritten | `--ease-tension` |
| 5.20–6.40s | 124–153 | Deal block scales up (`scale 0.96→1`, `opacity 0→1`) | `--ease-spring` |
| 6.40–7.20s | 153–172 | "→" arrow draws, original price strikes, promo price lands, `ลด %` chip pops | `--ease-tension` for travel, `--ease-spring` for chip |
| 7.20–10.00s | 172–240 | **Hold.** Sparkles keep their ambient drift (prime durations 4231ms / 5711ms). Deal chip keeps a slow `pulse-soft` (4231ms). Rest is static. This is the readable beat. | ambient loop |
| 10.00–11.50s | 240–275 | Footer handle + CTA rise from bottom | `--ease-tension` |
| 11.50–12.00s | 275–287 | Whole frame fades to dawn-warm white for a clean loop seam | `--ease-snap` |

The fade-to-warm at t=12s and the title's fade-up at t=0s both meet at "blank warm"; the loop wraps without a jump cut.

## Animation rules (locked from `docs/ui-design-system.md`)

- Hover-in / reveal animations use `--ease-tension` (`cubic-bezier(0.05, 0.7, 0.35, 0.99)`) as a keyframe animation. Hover-out / exit uses a short `--ease-snap` (160ms) base transition. The capture pipeline only triggers reveal, so the exit side never runs — but the rule stays for parity with the design system.
- Glow reveals animate **clip-path + opacity + filter together**. Never just one.
- Infinite ambient pulses use **prime-number durations** (4231ms / 5711ms), matching the existing dawn/dusk system tokens.
- `@media (prefers-reduced-motion: reduce)` short-circuits the sequence: the capture renders the final held state only, so reduced-motion users still get a usable static frame.
- Two accents only (orange wordmarks + green ✓). Never introduce a third colour. The static poster already complies.
- No em dashes in any copy additions. All visible strings come from `lib/content/pathlab-page.ts` (HERO, NOTES, POSTER, OFFER_CARDS, FIELDS, PRICE_TIERS). The video component does not add or rewrite copy.

## Files

| Path | Change | Purpose |
|---|---|---|
| `components/pathlab/InstagramPosterVideo.tsx` | new | Client component: mounts the IG poster markup inside a `--frame` timeline wrapper, runs the capture pipeline, downloads MP4. Imports the same data sources as `InstagramPosterClient.tsx`. |
| `components/pathlab/InstagramPosterVideo.module.css` | new | Per-step `@keyframes` (one per motion row in the table above), `--frame` driven state, `.pathlab-ig-video-stage` root that toggles `animation-play-state: paused` / `running`. |
| `app/pathlab/poster/instagram/page.tsx` | modify | Render `<InstagramPosterVideo />` below the existing static card with a small label "วิดีโอสำหรับโพสต์ IG" so the on-page tool now exports both PNG and MP4 from the same canvas. The static card + PNG button are unchanged. |

No new server route. No new package is required if `mediabunny` is present in `node_modules`; if not, add `@ffmpeg/ffmpeg` (WebAssembly, ~30MB) and load it via `await import(...)` so it does not ship in the initial JS bundle.

## Data sources (no drift)

The video component imports the same constants as `InstagramPosterClient.tsx`:

- `HERO`, `NOTES`, `POSTER`, `OFFER_CARDS`, `FIELDS`, `PRICE_TIERS`, `type PriceTier` from `@/lib/content/pathlab-page.ts`.

Numbers and copy are never duplicated. If a marketing change updates `POSTER.headline` or a `PRICE_TIERS[i].amount`, the static poster, the IG poster, and the MP4 all reflect it on the next render.

## Error handling

- `await document.fonts.ready` before the first capture (Thai fonts must be inlined or PNG/MP4 falls back to a system font). Same rule as `SocialCardDownload`.
- Per-frame capture failure: log to `console.error` and skip to the next frame. Never abort the whole video for one bad frame.
- MP4 muxing failure: wrap in try/catch and surface a `pathlab-social__error` message styled like the existing one.
- Browser without `OffscreenCanvas` or `MediaRecorder`: fall back to a clear "เบราว์เซอร์ไม่รองรับการสร้าง MP4" notice with a link back to the static PNG download.
- Web-Assembly load failure (`@ffmpeg/ffmpeg` blocked by COOP/COEP): same fallback notice.

## Testing

- Manual integration test in Chrome and Safari: render `/pathlab/poster/instagram`, click "ดาวน์โหลด MP4", verify the resulting MP4 plays in QuickTime, loops without a visible seam, and matches the static poster copy 1:1.
- Lint: `pnpm lint` (script already exists).
- No unit test for the frame-capture pipeline. It's a DOM timing pipeline, not pure logic; a unit test would be flaky. The reviewer watches the output.

## Risks

- **Capture speed.** 288 frames × `html-to-image` capture latency. If average capture is ~80ms, total is ~23s, fine for a one-off. If average is ~200ms+ (likely on Safari with large Thai fonts), total is ~60s+. Mitigation: warn the user with a progress bar; document that the first render is slow because the browser is inlining Thai glyphs.
- **Layout shift during capture.** Thai glyphs can render slightly differently between captures if the font fallback fires. Mitigation: `await document.fonts.ready` before each capture, not just the first.
- **Loop seam.** A wrong final frame would show a visible cut. Mitigation: fade-to-warm last frame is the same colour as the start state, eliminating the seam.
- **Audio-less upload.** MP4 with no audio is allowed by IG but may be flagged by some uploaders. Mitigation: ensure the muxer writes an empty AAC track so IG sees a valid audio-less MP4.

## Approval log

- 2026-08-19: design approved by user (Approach A, 12s loop, 4:5 portrait, in-app button).