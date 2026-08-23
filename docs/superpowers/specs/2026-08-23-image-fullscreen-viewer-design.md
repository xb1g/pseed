# Image Fullscreen Viewer for Learning Map Content

**Date:** 2026-08-23
**Status:** Approved for implementation planning

## Problem

Students viewing a learning map node (`app/map/[id]`) can see images inside node content, but there is no way to expand an image for closer inspection. Images arrive through two surfaces:

1. Dedicated `image` content blocks on a `node_content` row (`content_type = "image"`), rendered by `ImageContent` in `components/map/nodeViewHelpers.tsx:189–205` as a plain `<img>` inside a white rounded card.
2. Inline `<img>` tags inside Markdown/HTML text blocks (`content_type = "text"`), parsed by `marked`, sanitized by `lib/security/sanitize-html.ts`, and injected via `dangerouslySetInnerHTML` into `.learning-content-text` (`nodeViewHelpers.tsx:215–223`).

Neither surface has any zoom or lightbox affordance. The map page is the student's primary reading surface, so detail loss on diagrams, screenshots, and reference photos is a real friction point.

## Goal

A student can click any image inside a learning map node's content panel and view it fullscreen. Closing the fullscreen view returns the student to the same content panel in the same scroll position.

## Non-Goals

- Pinch-to-zoom, swipe-between-images, or any gallery navigation. Each click opens one image.
- A new lightbox dependency. Radix Dialog (already in the project) is sufficient.
- Authoring-side changes. The editor already produces both surface types.
- Captions beyond `node_content.content_title` for image blocks. Inline text images inherit their existing `alt` attribute.

## Constraints

These come from existing project docs and must not be violated:

- **No new dependency.** `components/ui/dialog.tsx` (Radix Dialog) is the modal primitive.
- **No em dashes** in user-facing copy (`AGENTS.md`).
- **Portal to `document.body`** — Radix Dialog already does this, which is required because the map container is `relative z-10` (`docs/ui-design-system.md:707–710`) and un-portaled overlays stack under the navbar.
- **Respect `prefers-reduced-motion`** — Radix's `data-[state=open]:animate-in` is already damped by the global rule (`docs/ui-design-system.md:1696–1732`).
- **Theme-neutral chrome.** This is a utility overlay, not a Dawn keynote — no gold accent.
- **Keyboard accessible.** Image block click target is a real `<button>`, not a div. Focus trap and Escape-to-close are handled by Radix.
- **Touch target ≥ 44px** (`docs/ui-design-system.md:1870`) — image cards are already large enough.
- **Sanitizer pipeline untouched.** `lib/security/sanitize-html.ts` keeps adding `loading="lazy"` to inline `<img>`; do not change that behavior.

## Design

### New component: `components/map/FullscreenImageViewer.tsx`

A controlled Radix Dialog. Props: `{ src: string; alt: string; caption?: string; onClose: () => void }`.

Visual:

- Backdrop: `bg-black/85 backdrop-blur-sm` (replaces Radix default overlay).
- Image: `max-w-[95vw] max-h-[90vh] object-contain rounded-lg shadow-2xl select-none`, centered in the viewport.
- Caption: optional; rendered as `text-white/90 text-sm bg-black/40 px-3 py-1 rounded` anchored to the bottom-center of the overlay.
- Close button: `X` icon top-right, `text-white/80 hover:text-white`.
- Drag disabled (`draggable={false}`) so accidental drags don't break the close affordance.

The component is a thin wrapper over the existing Radix primitives in `components/ui/dialog.tsx` — it overrides `DialogContent`'s default `max-w-lg p-6 bg-background` classes with full-bleed utility classes, and replaces `DialogOverlay`'s default with the dark backdrop above.

### State lift to `LearningContentView`

`components/map/LearningContentView.tsx` holds a single piece of state:

```tsx
const [openImage, setOpenImage] = useState<{
  src: string;
  alt: string;
  caption?: string;
} | null>(null);
```

Both child surfaces call `setOpenImage(...)` to open, and pass `onClose={() => setOpenImage(null)}` to the viewer. The viewer renders as a sibling of the iterated content blocks, only when `openImage !== null`. Radix portals it to `document.body` so it escapes the side panel's `z-10` stacking context.

### Surface A: dedicated `image` content blocks

In `components/map/nodeViewHelpers.tsx`, change `ImageContent` so the existing white card wrapper becomes the click target:

```tsx
<button
  type="button"
  onClick={() => onOpen({
    src: contentUrl,
    alt: contentTitle ?? "Uploaded image content",
    caption: contentTitle ?? undefined,
  })}
  className="block w-full text-left cursor-zoom-in rounded-lg transition
             hover:ring-2 hover:ring-black/10 focus-visible:outline-none
             focus-visible:ring-2 focus-visible:ring-black/30"
>
  <div className="relative rounded-lg shadow-lg bg-white overflow-hidden">
    <img
      src={contentUrl}
      alt={contentTitle ?? "Uploaded image content"}
      className="w-full h-auto object-contain"
      style={{ maxWidth: "100%" }}
    />
  </div>
</button>
```

`ImageContent` gains a second prop `onOpen: (img: { src; alt; caption? }) => void`, passed in by the `image` case in the `renderContent` dispatcher at `nodeViewHelpers.tsx:287–296`. The dispatcher reads `onOpen` from a new prop on `renderContent(content, nodeTitle, onOpen)`, which `LearningContentView` passes down from its own `setOpenImage`.

The caption passed to the viewer comes from `contentTitle` (the row's `content_title`), which is currently shown above the image via `TitleSection` at `nodeViewHelpers.tsx:248–254` — the lightbox caption is the same source.

### Surface B: inline `<img>` inside `.learning-content-text`

`TextContent` in `nodeViewHelpers.tsx:208–224` keeps `dangerouslySetInnerHTML` (so we do not rewrite the markdown→HTML pipeline), but the wrapper `<div>` gains a single delegated `onClick` listener:

```tsx
<div
  className="learning-content-text"
  dangerouslySetInnerHTML={{ __html: processedContent }}
  onClick={(e) => {
    const target = e.target as HTMLElement;
    if (target.tagName === "IMG") {
      const img = target as HTMLImageElement;
      onOpen({ src: img.src, alt: img.alt });
    }
  }}
/>
```

CSS additions in `app/globals.css` for `.learning-content-text img`:

```css
.learning-content-text img {
  cursor: zoom-in;
  transition: box-shadow 200ms var(--ease-spring, cubic-bezier(0.05, 0.7, 0.35, 0.99));
}
.learning-content-text img:hover {
  box-shadow: 0 10px 25px -5px rgb(0 0 0 / 0.18);
}
```

This appends to the existing `.learning-content-text img` rules at `app/globals.css:15895–16053`. The new properties do not duplicate `border-radius`, `box-shadow`, or `margin` already declared there — they only add cursor + hover affordance.

Why delegation: inline images arrive as raw DOM nodes injected by `dangerouslySetInnerHTML`. React's synthetic event system does not see them, so a listener on the parent wrapper is the cleanest hook.

### Files changed

| File | Change |
|---|---|
| `components/map/FullscreenImageViewer.tsx` | **New.** Controlled Radix Dialog for one image. |
| `components/map/LearningContentView.tsx` | Hold `openImage` state; pass `onOpen` to children; render `<FullscreenImageViewer />` when open. |
| `components/map/nodeViewHelpers.tsx` | `renderContent` gains an `onOpen` prop. `ImageContent` wraps `<img>` in a `<button>`. `TextContent` adds delegated `onClick` to the wrapper. |
| `app/globals.css` | Append cursor + hover rules to `.learning-content-text img`. |

No DB changes. No migrations. No new dependencies. No changes to `lib/security/sanitize-html.ts`. No changes to the editor (`components/map/ContentEditor.tsx`).

### Component contract

```ts
// FullscreenImageViewer.tsx
export interface FullscreenImageViewerProps {
  src: string;
  alt: string;
  caption?: string;
  onClose: () => void;
}
export function FullscreenImageViewer(props: FullscreenImageViewerProps): JSX.Element;
```

```ts
// In LearningContentView
const [openImage, setOpenImage] = useState<
  { src: string; alt: string; caption?: string } | null
>(null);
const handleOpen = useCallback((img) => setOpenImage(img), []);
const handleClose = useCallback(() => setOpenImage(null), []);
```

```ts
// renderContent signature change
function renderContent(
  content: NodeContent,
  nodeTitle: string,
  onOpen: (img: { src: string; alt: string; caption?: string }) => void,
): JSX.Element;
```

## Error Handling

- Image fails to load inside the viewer: the `<img>` shows the browser's native broken-image indicator. This is acceptable because the same image already loaded once in the panel; if the URL is broken, the panel would have shown a broken image already. No special fallback is added.
- Clicking an `<img>` inside `.learning-content-text` whose `src` is empty (possible from a misconfigured sanitizer edge case) opens the viewer with an empty `src` and shows the broken-image indicator. This matches current behavior — we are not introducing new failure modes.
- The viewer is mounted only when `openImage !== null`, so an unclosed viewer never accumulates state across node switches (Radix unmounts on close; we also clear state in `handleClose`).

## Testing

- **Manual integration** against a learning map with at least one node that has both a dedicated `image` block and a text block with embedded `<img>`. Verify:
  - Click image block → opens fullscreen.
  - Click inline `<img>` in text → opens fullscreen.
  - Escape closes.
  - Backdrop click closes.
  - Close button closes.
  - Closing returns to the same scroll position in the side panel.
  - Tab cycles within the viewer (focus trap).
  - Mobile (375px viewport): image scales within `95vw`, caption visible, close button reachable.
- **Lint:** `pnpm lint` clean.
- **Build:** `pnpm build` clean.
- **Existing tests:** no DB or library changes, so `lib/supabase/__tests__/` and any other Jest suites are unaffected; rerun `pnpm test` to confirm.

## Out of Scope (explicit)

- Pinch-to-zoom, swipe-between-images, gallery navigation.
- New lightbox dependencies (`yet-another-react-lightbox`, `photoswipe`, etc.).
- Authoring UI changes for captioning.
- Inline image `<img>` rotation handling or exif stripping (the sanitizer already strips event handlers and unknown attributes).
- Lightbox support for other surfaces outside learning map node content (cover images on `learning_maps`, annotation pin images on the canvas, student-uploaded submission images) — those render in unrelated components and are intentionally untouched.