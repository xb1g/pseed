"use client";

import { useMemo } from "react";
import { markdownToSafeHtml } from "@/lib/security/sanitize-html";

interface ContextPhaseProps {
  dayNumber: number;
  dayTitle?: string | null;
  contextText: string;
}

function ContextHtml({ markdown }: { markdown: string }) {
  const html = useMemo(() => markdownToSafeHtml(markdown), [markdown]);
  return (
    <div
      className="prose prose-invert prose-sm max-w-none text-neutral-300 prose-headings:text-white prose-p:leading-7 prose-a:text-amber-300 prose-strong:text-white sm:prose-base"
      // Content is sanitized through markdownToSafeHtml which strips
      // unsafe tags/attributes via lib/security/sanitize-html.ts
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

/**
 * Why today matters. Content only — the player shell owns the actions, so the
 * student always finds "continue" in the same place.
 */
export function ContextPhase({
  dayNumber,
  dayTitle,
  contextText,
}: ContextPhaseProps) {
  return (
    <section>
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-300/70">
        Before you start
      </p>
      <h2 className="mt-2 text-2xl font-bold tracking-tight text-white sm:text-3xl">
        {dayTitle || `Day ${dayNumber}`}
      </h2>
      <div className="mt-5">
        <ContextHtml markdown={contextText} />
      </div>
    </section>
  );
}
