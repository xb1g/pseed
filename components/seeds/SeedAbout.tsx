"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";

interface SeedAboutProps {
  /** Sanitized HTML produced by markdownToSafeHtml */
  html: string;
}

const COLLAPSED_HEIGHT = 168;

/**
 * Seed description with a collapsed default height.
 *
 * Authored descriptions run long, and a full-height dump is the main reason
 * the detail page reads as a wall of text. Collapsed by default; the toggle
 * only appears when there is actually more to see.
 */
export function SeedAbout({ html }: SeedAboutProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [expanded, setExpanded] = useState(false);
  const [overflows, setOverflows] = useState(false);

  useEffect(() => {
    const element = contentRef.current;
    if (!element) return;

    const measure = () =>
      setOverflows(element.scrollHeight > COLLAPSED_HEIGHT + 24);

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, [html]);

  const collapsed = overflows && !expanded;

  return (
    <div>
      <div
        ref={contentRef}
        id="seed-about-body"
        style={
          collapsed
            ? {
                maxHeight: COLLAPSED_HEIGHT,
                overflow: "hidden",
                maskImage:
                  "linear-gradient(to bottom, black 55%, transparent 100%)",
                WebkitMaskImage:
                  "linear-gradient(to bottom, black 55%, transparent 100%)",
              }
            : undefined
        }
        className="prose prose-invert prose-sm max-w-none text-neutral-300 prose-headings:text-white prose-headings:text-base prose-p:leading-7 prose-a:text-amber-300 hover:prose-a:text-amber-200 prose-strong:text-white sm:prose-base"
        dangerouslySetInnerHTML={{ __html: html }}
      />

      {overflows && (
        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          aria-expanded={expanded}
          aria-controls="seed-about-body"
          className="mt-3 inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-amber-300 transition-colors hover:text-amber-200"
        >
          {expanded ? "Show less" : "Read more"}
          <ChevronDown
            aria-hidden="true"
            className={`h-4 w-4 transition-transform duration-200 ${
              expanded ? "rotate-180" : ""
            }`}
          />
        </button>
      )}
    </div>
  );
}
