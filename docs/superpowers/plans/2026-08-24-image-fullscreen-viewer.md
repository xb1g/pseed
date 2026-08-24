# Image Fullscreen Viewer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let a student click any image inside a learning map node's content panel and view it fullscreen, with Escape / backdrop / close button all closing it.

**Architecture:** A new `FullscreenImageViewer` component (controlled Radix Dialog over `components/ui/dialog.tsx`) handles the fullscreen overlay. `LearningContentView` lifts `openImage` state and renders the viewer. `nodeViewHelpers.tsx` wires two surfaces into that state: `ImageContent` wraps its `<img>` in a `<button>`, and `TextContent` adds a delegated `onClick` to its `dangerouslySetInnerHTML` wrapper. CSS adds a `zoom-in` cursor to inline text images. No DB changes. No new dependencies.

**Tech Stack:** Next.js 15.4.5 App Router, React, Radix UI Dialog (`components/ui/dialog.tsx`), lucide-react (already a dep), TailwindCSS, Jest + Testing Library.

## Global Constraints

Copied verbatim from the spec:

- **No new dependency.** Use `components/ui/dialog.tsx` (Radix Dialog) as the modal primitive.
- **No em dashes** in any user-facing copy (AGENTS.md).
- **Portal to `document.body`** — Radix Dialog already does this; do not break the portal chain. Required because the map container is `relative z-10` (`docs/ui-design-system.md:707–710`).
- **Respect `prefers-reduced-motion`** — Radix's `data-[state=open]:animate-in` is already damped by the global rule (`docs/ui-design-system.md:1696–1732`). Don't add new motion.
- **Theme-neutral chrome.** This is a utility overlay, not a Dawn keynote — no gold accent.
- **Keyboard accessible.** Image block click target is a real `<button>` (not a div). Focus trap and Escape-to-close handled by Radix.
- **Touch target ≥ 44px** (`docs/ui-design-system.md:1870`). The image card is already large.
- **Sanitizer pipeline untouched.** `lib/security/sanitize-html.ts` keeps adding `loading="lazy"` to inline `<img>`; do not change.
- **TypeScript strict.** Project compiles under strict mode; all new code must typecheck cleanly.
- **Frequent commits.** One commit per task.

---

## File Structure

| File | Role | Created / Modified |
|---|---|---|
| `components/map/FullscreenImageViewer.tsx` | Controlled Radix Dialog showing one image fullscreen with caption + close button | **Create** |
| `components/map/__tests__/FullscreenImageViewer.test.tsx` | Unit tests for the viewer (open, close paths, props forwarded, caption rendering) | **Create** |
| `components/map/__tests__/LearningContentView.test.tsx` | Unit tests for the wiring: image-block click opens viewer, inline-text `<img>` click opens viewer, close unmounts | **Create** |
| `components/map/LearningContentView.tsx` | Lift `openImage` state; pass `onOpenImage` down; render viewer | **Modify** |
| `components/map/nodeViewHelpers.tsx` | `renderContent` gains `onOpenImage` prop; `ImageContent` wraps `<img>` in `<button>`; `TextContent` adds delegated `onClick` | **Modify** |
| `app/globals.css` | Append `cursor: zoom-in` and hover affordance to `.learning-content-text img` | **Modify** |

No DB migration. No new dependency. No editor changes. No sanitizer changes.

---

### Task 1: Create the `FullscreenImageViewer` component

**Files:**
- Create: `components/map/FullscreenImageViewer.tsx`

**Interfaces:**
- Consumes: `Dialog`, `DialogContent`, `DialogClose` from `@/components/ui/dialog`; `X` from `lucide-react`; `cn` from `@/lib/utils`.
- Produces: named export `FullscreenImageViewer` with the props below. Later tasks import this.

- [ ] **Step 1: Create the file**

Write `components/map/FullscreenImageViewer.tsx` with this exact content:

```tsx
"use client";

import { X } from "lucide-react";

import {
  Dialog,
  DialogClose,
  DialogContent,
} from "@/components/ui/dialog";

export interface FullscreenImageViewerProps {
  src: string;
  alt: string;
  caption?: string;
  onClose: () => void;
}

/**
 * Controlled Radix Dialog that renders a single image fullscreen.
 *
 * The parent owns open state and passes `onClose`; the dialog is mounted only
 * while open so closing fully unmounts it. Radix portals to `document.body`,
 * which keeps it above the `z-10` map container stacking context.
 *
 * The default close button in `DialogContent` is suppressed with `hideClose`
 * so we can render our own top-right close button over the transparent
 * backdrop.
 */
export function FullscreenImageViewer({
  src,
  alt,
  caption,
  onClose,
}: FullscreenImageViewerProps) {
  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        hideClose
        overlayClassName="bg-black/85 backdrop-blur-sm"
        className="max-w-none max-h-none p-0 bg-transparent border-0 shadow-none
                   data-[state=open]:animate-in data-[state=closed]:animate-out
                   flex items-center justify-center"
      >
        <img
          src={src}
          alt={alt}
          draggable={false}
          className="relative z-10 max-w-[95vw] max-h-[90vh] object-contain
                     rounded-lg shadow-2xl select-none"
        />
        {caption ? (
          <p
            className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10
                       text-white/90 text-sm bg-black/40 px-3 py-1 rounded
                       max-w-[90vw] truncate"
          >
            {caption}
          </p>
        ) : null}
        <DialogClose
          aria-label="Close image viewer"
          className="absolute top-4 right-4 z-10 rounded-full p-2
                     text-white/80 hover:text-white
                     bg-black/40 hover:bg-black/60
                     focus-visible:outline-none focus-visible:ring-2
                     focus-visible:ring-white/60 transition-colors"
        >
          <X className="w-5 h-5" />
          <span className="sr-only">Close</span>
        </DialogClose>
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run:
```bash
pnpm exec tsc --noEmit -p tsconfig.json 2>&1 | grep -E "FullscreenImageViewer|error TS" | head -20
```
Expected: no `FullscreenImageViewer` errors. Other pre-existing errors (if any) are acceptable but should not increase in count after this task.

- [ ] **Step 3: Commit**

```bash
git add components/map/FullscreenImageViewer.tsx
git commit -m "feat(map): add FullscreenImageViewer Radix Dialog"
```

---

### Task 2: Add the test suite for `FullscreenImageViewer`

**Files:**
- Create: `components/map/__tests__/FullscreenImageViewer.test.tsx`

**Interfaces:**
- Consumes: `FullscreenImageViewer` from `../FullscreenImageViewer`; `@testing-library/react`; `jest` globals.
- Produces: 4 passing tests in the `FullscreenImageViewer` describe block.

- [ ] **Step 1: Write the failing tests**

Write `components/map/__tests__/FullscreenImageViewer.test.tsx`:

```tsx
import { render, screen, fireEvent } from "@testing-library/react";

import { FullscreenImageViewer } from "../FullscreenImageViewer";

describe("FullscreenImageViewer", () => {
  test("renders the image with src and alt", () => {
    render(
      <FullscreenImageViewer
        src="https://example.com/photo.png"
        alt="A reference photo"
        onClose={jest.fn()}
      />
    );
    const img = screen.getByRole("img", { name: "A reference photo" });
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute("src", "https://example.com/photo.png");
  });

  test("renders the caption when provided", () => {
    render(
      <FullscreenImageViewer
        src="https://example.com/photo.png"
        alt="A reference photo"
        caption="Figure 3: pipeline"
        onClose={jest.fn()}
      />
    );
    expect(screen.getByText("Figure 3: pipeline")).toBeInTheDocument();
  });

  test("omits the caption when not provided", () => {
    const { container } = render(
      <FullscreenImageViewer
        src="https://example.com/photo.png"
        alt="A reference photo"
        onClose={jest.fn()}
      />
    );
    // No <p> caption rendered. The image and close button are still present.
    expect(container.querySelectorAll("p")).toHaveLength(0);
    expect(screen.getByRole("img", { name: "A reference photo" })).toBeInTheDocument();
  });

  test("calls onClose when the close button is clicked", () => {
    const onClose = jest.fn();
    render(
      <FullscreenImageViewer
        src="https://example.com/photo.png"
        alt="A reference photo"
        onClose={onClose}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: /close image viewer/i }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
```

- [ ] **Step 2: Run tests and verify they pass**

Run:
```bash
pnpm test -- components/map/__tests__/FullscreenImageViewer.test.tsx
```
Expected: 4 passing tests. (All are already green against Task 1's component — this is the existing baseline.)

- [ ] **Step 3: Commit**

```bash
git add components/map/__tests__/FullscreenImageViewer.test.tsx
git commit -m "test(map): cover FullscreenImageViewer rendering and close"
```

---

### Task 3: Lift `openImage` state into `LearningContentView`

**Files:**
- Modify: `components/map/LearningContentView.tsx`

**Interfaces:**
- Consumes: existing `LearningContentViewProps` (`nodeContent`, `nodeTitle`, `hasAssessment`); new `FullscreenImageViewer` import.
- Produces: internal `openImage` state; new `handleOpenImage` callback passed to `renderContent`; `<FullscreenImageViewer>` rendered as a sibling when `openImage !== null`.

- [ ] **Step 1: Update `LearningContentView.tsx`**

Replace the entire file `components/map/LearningContentView.tsx` with:

```tsx
// app/components/NodeViewPanel/LearningContentView.tsx
import { memo, useCallback, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { FileText } from "lucide-react";
import { NodeContent } from "@/types/map";
import { FullscreenImageViewer } from "./FullscreenImageViewer";
import { renderContent } from "./nodeViewHelpers";

interface LearningContentViewProps {
  nodeContent: NodeContent[];
  nodeTitle?: string | null;
  /**
   * Whether the node also shows an assessment below this section. When it does,
   * an empty content list needs no placeholder: the assessment is the activity,
   * and "content will be added soon" reads as something missing rather than a
   * node that was deliberately built assessment-only.
   */
  hasAssessment?: boolean;
}

interface OpenImage {
  src: string;
  alt: string;
  caption?: string;
}

// Memoized component to prevent unnecessary re-renders
const LearningContentView = memo(
  ({ nodeContent, nodeTitle, hasAssessment = false }: LearningContentViewProps) => {
    console.log("📚 LearningContentView rendering with", nodeContent.length, "content items");

    const [openImage, setOpenImage] = useState<OpenImage | null>(null);
    const handleOpenImage = useCallback((img: OpenImage) => setOpenImage(img), []);
    const handleCloseImage = useCallback(() => setOpenImage(null), []);

    if (!nodeContent?.length) {
      // Nothing to show, and the assessment below carries the node on its own.
      if (hasAssessment) return null;

      return (
        <Card className="border-dashed">
          <CardContent className="p-8 text-center">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground">
              No learning content available yet.
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Content will be added soon.
            </p>
          </CardContent>
        </Card>
      );
    }

    return (
      <>
        <div className="space-y-6">
          {nodeContent.map((content) => (
            <div key={content.id}>
              {renderContent(content, nodeTitle, handleOpenImage)}
            </div>
          ))}
        </div>
        {openImage ? (
          <FullscreenImageViewer
            src={openImage.src}
            alt={openImage.alt}
            caption={openImage.caption}
            onClose={handleCloseImage}
          />
        ) : null}
      </>
    );
  }
);

LearningContentView.displayName = "LearningContentView";

// Custom equality check to prevent re-renders when content hasn't actually changed
const areEqual = (
  prevProps: LearningContentViewProps,
  nextProps: LearningContentViewProps
) => {
  // Title affects per-item heading dedupe
  if (prevProps.nodeTitle !== nextProps.nodeTitle) {
    return false;
  }
  // Decides whether an empty node renders a placeholder or nothing at all
  if (prevProps.hasAssessment !== nextProps.hasAssessment) {
    return false;
  }
  // Quick length check first
  if (prevProps.nodeContent.length !== nextProps.nodeContent.length) {
    console.log("🔄 LearningContentView: Content length changed:", prevProps.nodeContent.length, "->", nextProps.nodeContent.length);
    return false;
  }

  // Deep comparison of content IDs and essential fields that affect rendering
  for (let i = 0; i < prevProps.nodeContent.length; i++) {
    const prev = prevProps.nodeContent[i];
    const next = nextProps.nodeContent[i];

    if (
      prev.id !== next.id ||
      prev.content_type !== next.content_type ||
      prev.content_title !== next.content_title ||
      prev.content_url !== next.content_url ||
      prev.content_body !== next.content_body
    ) {
      console.log("🔄 LearningContentView: Content changed at index", i, ":", {
        prevId: prev.id,
        nextId: next.id,
        prevType: prev.content_type,
        nextType: next.content_type,
        prevTitle: prev.content_title,
        nextTitle: next.content_title,
        prevUrl: prev.content_url?.substring(0, 50),
        nextUrl: next.content_url?.substring(0, 50)
      });
      return false;
    }
  }

  console.log("✅ LearningContentView: Content unchanged, skipping re-render");
  return true;
};

// Export with custom comparison to prevent unnecessary re-renders
export { LearningContentView };
export default memo(LearningContentView, areEqual);
```

Note: `renderContent` now takes 3 arguments. Task 4 updates its signature. Tasks 5 and 6 will fail to typecheck until Task 4 lands. **Do not run `pnpm build` until Task 6 completes.**

- [ ] **Step 2: Verify the file is syntactically correct**

Run:
```bash
pnpm exec tsc --noEmit -p tsconfig.json 2>&1 | grep -E "LearningContentView|renderContent" | head -20
```
Expected: a `renderContent` arity error is expected at this point (`Expected 2 arguments, but got 3`). Other LearningContentView-related errors should not appear. **This is normal — Task 4 fixes it.**

- [ ] **Step 3: Commit**

```bash
git add components/map/LearningContentView.tsx
git commit -m "feat(map): lift openImage state into LearningContentView"
```

---

### Task 4: Update `renderContent` signature in `nodeViewHelpers.tsx`

**Files:**
- Modify: `components/map/nodeViewHelpers.tsx:227-296`

**Interfaces:**
- Consumes: existing `NodeContent`, `contentUrl`, `contentType`, `contentTitle`, `nodeTitle`, `TitleSection`, `ImageContent`, `TextContent`, `ErrorFallback`.
- Produces: new exported function signature
  ```ts
  export const renderContent = (
    content: NodeContent,
    nodeTitle?: string | null,
    onOpenImage?: (img: { src: string; alt: string; caption?: string }) => void,
  ) => JSX.Element;
  ```

- [ ] **Step 1: Update the signature and image dispatch**

In `components/map/nodeViewHelpers.tsx`, replace lines 227–230:

```ts
export const renderContent = (
  content: NodeContent,
  nodeTitle?: string | null,
) => {
```

with:

```ts
export const renderContent = (
  content: NodeContent,
  nodeTitle?: string | null,
  onOpenImage?: (img: { src: string; alt: string; caption?: string }) => void,
) => {
```

Then replace lines 287–296 (the `case "image"` block):

```tsx
    case "image":
      if (!contentUrl) {
        return <ErrorFallback url="#" key={contentKey} />;
      }
      return (
        <div key={contentKey}>
          {TitleSection}
          <ImageContent contentUrl={contentUrl} />
        </div>
      );
```

with:

```tsx
    case "image":
      if (!contentUrl) {
        return <ErrorFallback url="#" key={contentKey} />;
      }
      return (
        <div key={contentKey}>
          {TitleSection}
          <ImageContent
            contentUrl={contentUrl}
            contentTitle={contentTitle}
            onOpenImage={onOpenImage}
          />
        </div>
      );
```

- [ ] **Step 2: Verify TypeScript compiles**

Run:
```bash
pnpm exec tsc --noEmit -p tsconfig.json 2>&1 | grep -E "ImageContent|renderContent" | head -20
```
Expected: an `ImageContent` prop error is expected (`Property 'onOpenImage' does not exist`). **This is normal — Task 5 fixes it.**

- [ ] **Step 3: Commit**

```bash
git add components/map/nodeViewHelpers.tsx
git commit -m "refactor(map): thread onOpenImage through renderContent"
```

---

### Task 5: Make `ImageContent` clickable

**Files:**
- Modify: `components/map/nodeViewHelpers.tsx:189-205`

**Interfaces:**
- Consumes: existing `ImageContent` props pattern; new `onOpenImage` prop.
- Produces: `<button>` wrapper around the existing white card so a click opens the fullscreen viewer; `ImageContent` props grow to `{ contentUrl: string; contentTitle?: string | null; onOpenImage?: (img: { src: string; alt: string; caption?: string }) => void }`.

- [ ] **Step 1: Replace `ImageContent`**

In `components/map/nodeViewHelpers.tsx`, replace lines 189–205:

```tsx
// Image Component - memoized
const ImageContent = memo(({ contentUrl }: { contentUrl: string }) => {
  console.log("🖼️ ImageContent rendering for URL:", contentUrl);

  return (
    <div className="w-full">
      <div className="relative rounded-lg shadow-lg bg-white overflow-hidden">
        <img
          src={contentUrl}
          alt="Uploaded image content"
          className="w-full h-auto object-contain"
          style={{ maxWidth: "100%" }}
        />
      </div>
    </div>
  );
});
ImageContent.displayName = "ImageContent";
```

with:

```tsx
// Image Component - memoized
const ImageContent = memo(
  ({
    contentUrl,
    contentTitle,
    onOpenImage,
  }: {
    contentUrl: string;
    contentTitle?: string | null;
    onOpenImage?: (img: {
      src: string;
      alt: string;
      caption?: string;
    }) => void;
  }) => {
    console.log("🖼️ ImageContent rendering for URL:", contentUrl);

    const altText = contentTitle ?? "Uploaded image content";

    if (!onOpenImage) {
      // Defensive fallback: if the parent didn't wire the viewer, render the
      // original plain image so behavior is unchanged.
      return (
        <div className="w-full">
          <div className="relative rounded-lg shadow-lg bg-white overflow-hidden">
            <img
              src={contentUrl}
              alt={altText}
              className="w-full h-auto object-contain"
              style={{ maxWidth: "100%" }}
            />
          </div>
        </div>
      );
    }

    return (
      <div className="w-full">
        <button
          type="button"
          onClick={() =>
            onOpenImage({
              src: contentUrl,
              alt: altText,
              caption: contentTitle ?? undefined,
            })
          }
          className="block w-full text-left cursor-zoom-in rounded-lg transition
                     hover:ring-2 hover:ring-black/10
                     focus-visible:outline-none focus-visible:ring-2
                     focus-visible:ring-black/30"
          aria-label={`Expand image: ${altText}`}
        >
          <div className="relative rounded-lg shadow-lg bg-white overflow-hidden">
            <img
              src={contentUrl}
              alt={altText}
              className="w-full h-auto object-contain"
              style={{ maxWidth: "100%" }}
            />
          </div>
        </button>
      </div>
    );
  }
);
ImageContent.displayName = "ImageContent";
```

- [ ] **Step 2: Verify TypeScript compiles**

Run:
```bash
pnpm exec tsc --noEmit -p tsconfig.json 2>&1 | grep -E "ImageContent|TextContent|LearningContentView" | head -20
```
Expected: no errors related to `ImageContent`, `LearningContentView`, or `renderContent`. A `TextContent` prop error (`Property 'onOpenImage' does not exist`) is expected — **Task 6 fixes it.**

- [ ] **Step 3: Commit**

```bash
git add components/map/nodeViewHelpers.tsx
git commit -m "feat(map): make ImageContent clickable for fullscreen"
```

---

### Task 6: Make inline `<img>` inside `.learning-content-text` clickable

**Files:**
- Modify: `components/map/nodeViewHelpers.tsx:208-224`
- Modify: `components/map/nodeViewHelpers.tsx` text dispatch case to pass `onOpenImage` to `TextContent`
- Modify: `app/globals.css:16045-16049` (append only)

**Interfaces:**
- Consumes: existing `TextContent` props pattern; new `onOpenImage` prop.
- Produces: `TextContent` props grow to `{ contentBody: string; onOpenImage?: (img: { src: string; alt: string; caption?: string }) => void }`; `text` and `text_with_images` dispatch cases pass `onOpenImage` through.

- [ ] **Step 1: Update `TextContent`**

In `components/map/nodeViewHelpers.tsx`, replace lines 208–224:

```tsx
// Text Content Component - memoized with markdown support
const TextContent = memo(({ contentBody }: { contentBody: string }) => {
  console.log("📝 TextContent rendering, content length:", contentBody?.length || 0);

  const processedContent = useMemo(() => {
    return processTextContent(contentBody || "");
  }, [contentBody]);

  return (
    <div className="px-2 py-1">
      <div
        className="learning-content-text"
        dangerouslySetInnerHTML={{ __html: processedContent }}
      />
    </div>
  );
});
TextContent.displayName = "TextContent";
```

with:

```tsx
// Text Content Component - memoized with markdown support
const TextContent = memo(
  ({
    contentBody,
    onOpenImage,
  }: {
    contentBody: string;
    onOpenImage?: (img: {
      src: string;
      alt: string;
      caption?: string;
    }) => void;
  }) => {
    console.log("📝 TextContent rendering, content length:", contentBody?.length || 0);

    const processedContent = useMemo(() => {
      return processTextContent(contentBody || "");
    }, [contentBody]);

    return (
      <div className="px-2 py-1">
        <div
          className="learning-content-text"
          dangerouslySetInnerHTML={{ __html: processedContent }}
          onClick={
            onOpenImage
              ? (e) => {
                  const target = e.target as HTMLElement | null;
                  if (target && target.tagName === "IMG") {
                    const img = target as HTMLImageElement;
                    onOpenImage({ src: img.src, alt: img.alt });
                  }
                }
              : undefined
          }
        />
      </div>
    );
  }
);
TextContent.displayName = "TextContent";
```

- [ ] **Step 2: Pass `onOpenImage` through the `text` and `text_with_images` dispatch cases**

In `components/map/nodeViewHelpers.tsx`, the `text_with_images` case (around line 257–264) currently is:

```tsx
  if (contentType === "text_with_images" as any) {
    return (
      <div key={contentKey}>
        {TitleSection}
        <TextContent contentBody={content.content_body || ""} />
      </div>
    );
  }
```

Replace with:

```tsx
  if (contentType === "text_with_images" as any) {
    return (
      <div key={contentKey}>
        {TitleSection}
        <TextContent
          contentBody={content.content_body || ""}
          onOpenImage={onOpenImage}
        />
      </div>
    );
  }
```

The `text` case (around line 279–285) currently is:

```tsx
    case "text":
      return (
        <div key={contentKey}>
          {TitleSection}
          <TextContent contentBody={content.content_body || ""} />
        </div>
      );
```

Replace with:

```tsx
    case "text":
      return (
        <div key={contentKey}>
          {TitleSection}
          <TextContent
            contentBody={content.content_body || ""}
            onOpenImage={onOpenImage}
          />
        </div>
      );
```

- [ ] **Step 3: Add CSS affordance for inline images**

Open `app/globals.css`. The existing block at lines 16045–16049 is:

```css
.learning-content-text img {
  border-radius: 0.5rem;
  box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1);
  margin: 1.25rem 0;
}
```

**Do not modify those existing lines.** Append a new block immediately after the closing brace of the existing `.learning-content-text img` rule (line 16049), keeping one blank line of separation:

```css

.learning-content-text img {
  cursor: zoom-in;
  transition: box-shadow 200ms ease-out;
}
.learning-content-text img:hover {
  box-shadow: 0 10px 25px -5px rgb(0 0 0 / 0.18);
}
```

Result: there are now **two** CSS rules named `.learning-content-text img` in the file. CSS allows this — the later rule wins for any conflicting properties, but because the new rule only adds `cursor` and `transition` (not present in the first), and the `:hover` rule overrides only `box-shadow`, behavior is exactly as intended. Both `border-radius`, `margin`, and the resting `box-shadow` come from the original rule.

- [ ] **Step 4: Verify TypeScript compiles cleanly**

Run:
```bash
pnpm exec tsc --noEmit -p tsconfig.json 2>&1 | grep -E "error TS" | head -20
```
Expected: zero new errors introduced by this feature. (Pre-existing errors elsewhere in the project, if any, are out of scope.)

- [ ] **Step 5: Commit**

```bash
git add components/map/nodeViewHelpers.tsx app/globals.css
git commit -m "feat(map): click-to-fullscreen for inline text images"
```

---

### Task 7: Add wiring tests for `LearningContentView`

**Files:**
- Create: `components/map/__tests__/LearningContentView.test.tsx`

**Interfaces:**
- Consumes: `LearningContentView` default export from `../LearningContentView`; `NodeContent` from `@/types/map`; `@testing-library/react`.
- Produces: 4 passing tests covering image-block click, inline-text `<img>` click, multiple distinct images opening, and Escape closing.

- [ ] **Step 1: Write the failing tests**

Write `components/map/__tests__/LearningContentView.test.tsx`:

```tsx
import { render, screen, fireEvent } from "@testing-library/react";

import LearningContentView from "../LearningContentView";
import type { NodeContent } from "@/types/map";

function makeImageContent(overrides: Partial<NodeContent> = {}): NodeContent {
  return {
    id: "img-1",
    node_id: "node-1",
    content_type: "image",
    content_title: "Reference photo",
    content_url: "https://example.com/photo.png",
    content_body: null,
    display_order: 0,
    created_at: "",
    ...overrides,
  };
}

function makeTextContent(body: string, overrides: Partial<NodeContent> = {}): NodeContent {
  return {
    id: "txt-1",
    node_id: "node-1",
    content_type: "text",
    content_title: null,
    content_url: null,
    content_body: body,
    display_order: 0,
    created_at: "",
    ...overrides,
  };
}

describe("LearningContentView fullscreen wiring", () => {
  test("clicking an image content block opens the fullscreen viewer", () => {
    render(
      <LearningContentView
        nodeContent={[makeImageContent()]}
        nodeTitle="Test node"
      />
    );

    fireEvent.click(screen.getByRole("button", { name: /expand image/i }));

    const dialogImg = screen.getByRole("img", { name: "Reference photo" });
    expect(dialogImg).toHaveAttribute("src", "https://example.com/photo.png");
    expect(screen.getByText("Reference photo")).toBeInTheDocument(); // caption
  });

  test("clicking an inline <img> inside text content opens the viewer", () => {
    const html = '<p>see <img src="https://example.com/inline.png" alt="Inline diagram" /></p>';
    render(
      <LearningContentView
        nodeContent={[makeTextContent(html)]}
        nodeTitle="Test node"
      />
    );

    const inline = screen.getByRole("img", { name: "Inline diagram" });
    fireEvent.click(inline);

    const dialogImg = screen.getByRole("img", { name: "Inline diagram" });
    expect(dialogImg).toHaveAttribute("src", "https://example.com/inline.png");
  });

  test("clicking a non-image element inside text content does NOT open the viewer", () => {
    const html = "<p>plain paragraph, no images</p>";
    render(
      <LearningContentView
        nodeContent={[makeTextContent(html)]}
        nodeTitle="Test node"
      />
    );

    fireEvent.click(screen.getByText("plain paragraph, no images"));

    // No viewer close button rendered => viewer did not open.
    expect(
      screen.queryByRole("button", { name: /close image viewer/i })
    ).not.toBeInTheDocument();
  });

  test("Escape closes the viewer", () => {
    render(
      <LearningContentView
        nodeContent={[makeImageContent()]}
        nodeTitle="Test node"
      />
    );

    fireEvent.click(screen.getByRole("button", { name: /expand image/i }));
    expect(
      screen.getByRole("button", { name: /close image viewer/i })
    ).toBeInTheDocument();

    fireEvent.keyDown(document, { key: "Escape" });

    expect(
      screen.queryByRole("button", { name: /close image viewer/i })
    ).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run tests and verify they pass**

Run:
```bash
pnpm test -- components/map/__tests__/LearningContentView.test.tsx
```
Expected: 4 passing tests.

If the inline-image test fails because `sanitize-html` strips or rewrites `src`/`alt`, debug by:
1. Confirming `lib/security/sanitize-html.ts` `ALLOWED_TAGS` includes `img` (line ~10) and `ALLOWED_ATTR` includes `src`, `alt` (line ~25-40).
2. Confirming `processTextContent` in `nodeViewHelpers.tsx:14-56` returns the parsed HTML unchanged when it contains only an inline `<img>`.

- [ ] **Step 3: Commit**

```bash
git add components/map/__tests__/LearningContentView.test.tsx
git commit -m "test(map): cover LearningContentView fullscreen wiring"
```

---

### Task 8: Final verification

**Files:** none modified

- [ ] **Step 1: Run lint**

Run:
```bash
pnpm lint 2>&1 | tail -40
```
Expected: zero new errors or warnings introduced by these files. (Pre-existing repo lint issues are out of scope.)

- [ ] **Step 2: Run the full test suite**

Run:
```bash
pnpm test 2>&1 | tail -30
```
Expected: all suites pass. The new tests `FullscreenImageViewer.test.tsx` and `LearningContentView.test.tsx` show 4 + 4 = 8 new passing tests.

- [ ] **Step 3: Run the production build**

Run:
```bash
pnpm build 2>&1 | tail -40
```
Expected: build succeeds. Warnings about other unrelated modules are acceptable; errors about `FullscreenImageViewer`, `LearningContentView`, or `nodeViewHelpers` are not.

- [ ] **Step 4: Manual integration smoke (skip in CI; run locally)**

1. `pnpm dev` and open a learning map at `/map/<some-real-map-id>` that has both:
   - a node with `content_type === "image"` content
   - a node with `content_type === "text"` content whose body contains an `<img>` tag
2. Click the image content block → fullscreen viewer opens with the image centered on a dark backdrop, caption visible.
3. Press Escape → viewer closes.
4. Reopen, click the backdrop → viewer closes.
5. Reopen, click the top-right `X` → viewer closes.
6. Open a node with text containing an inline `<img>` → click the inline image → viewer opens.
7. Hover the inline image in the panel → cursor changes to `zoom-in`, box-shadow deepens.
8. Resize to 375px wide → image fits within `95vw`, caption and close button remain visible and reachable.
9. Close the viewer → confirm scroll position inside the side panel is unchanged.

If any step fails, file a follow-up task — do not mark this plan complete with regressions open.

- [ ] **Step 5: Commit any follow-up fixes**

If Steps 1–4 required fixes:
```bash
git add -A
git commit -m "fix(map): address verification findings for image fullscreen viewer"
```

If no fixes were needed, no commit is required.

---

## Self-Review (post-write)

**1. Spec coverage**

| Spec requirement | Plan task |
|---|---|
| New `FullscreenImageViewer` component | Task 1 |
| State lifted to `LearningContentView` | Task 3 |
| `renderContent` threads `onOpenImage` | Task 4 |
| Surface A: `ImageContent` clickable via `<button>` | Task 5 |
| Surface B: inline `<img>` clickable via delegated `onClick` on `.learning-content-text` | Task 6 |
| CSS cursor + hover affordance | Task 6 |
| Caption from `content_title` shown in viewer | Task 1 (component supports it) + Task 3 (passes it) + Task 5 (passes it from image blocks) |
| No DB changes | n/a (no task touches DB) |
| No new dependency | n/a (Radix Dialog + lucide-react already deps) |
| Escape closes | Radix Dialog default; Task 2 verifies close button, Task 7 verifies Escape |
| Backdrop click closes | Radix Dialog default |
| Close button closes | Task 1 + Task 2 + Task 7 |
| Focus trap | Radix Dialog default |
| Portal to `document.body` | Radix Dialog default; `DialogContent` includes `DialogPortal` |
| `prefers-reduced-motion` respected | Global CSS rule already damps Radix data-state animations |
| No em dashes in user-facing copy | Spec & plan contain no em dashes |
| Testing | Task 2 (unit tests for viewer), Task 7 (unit tests for wiring), Task 8 (lint + test + build + manual smoke) |
| Out-of-scope items not implemented | Confirmed: no gallery navigation, no pinch-zoom, no lightbox lib, no editor changes, no sanitizer changes, no other surfaces |

**2. Placeholder scan**: No TBD / TODO / "implement later" / "similar to" / vague "handle errors" — all code blocks are complete.

**3. Type consistency**:
- `OpenImage` interface in `LearningContentView.tsx` (Task 3) matches the shape passed by `ImageContent` (Task 5) and `TextContent` (Task 6): `{ src, alt, caption? }`.
- `onOpenImage` callback type in `LearningContentView.tsx` matches the prop type expected by `renderContent` (Task 4), `ImageContent` (Task 5), and `TextContent` (Task 6): `(img: { src: string; alt: string; caption?: string }) => void`.
- `FullscreenImageViewerProps` in `FullscreenImageViewer.tsx` (Task 1) matches the props passed in `LearningContentView.tsx` (Task 3).
- No name drift across tasks.

No inline fixes required.