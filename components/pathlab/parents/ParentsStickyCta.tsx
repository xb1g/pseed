"use client";

import { useEffect, useState } from "react";

import { CONTACT } from "@/lib/content/pathlab-page";
import { PARENTS_STICKY } from "@/lib/content/pathlab-parents";

/**
 * Sticky bottom bar for touch devices, styled for Dawn rather than reusing
 * the cream `.pathlab-mobile-cta` bar from the student page. It appears only
 * once the hero has mostly left the viewport, so the first screen keeps its
 * own CTAs, and it never renders on pointer devices (gated on hover
 * capability, not width).
 */
export function ParentsStickyCta() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const hero = document.querySelector("[data-parents-hero]");
    if (!hero || !("IntersectionObserver" in window)) {
      setVisible(true);
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) setVisible(!entry.isIntersecting);
      },
      { rootMargin: "-45% 0px 0px 0px" }
    );

    io.observe(hero);
    return () => io.disconnect();
  }, []);

  return (
    <div
      aria-hidden={!visible}
      className={`fixed inset-x-0 bottom-0 z-40 flex gap-2 border-t border-white/10 bg-slate-950/90 px-4 pb-[calc(0.7rem+env(safe-area-inset-bottom,0px))] pt-3 backdrop-blur-xl transition-transform duration-300 [transition-timing-function:cubic-bezier(0.05,0.7,0.35,0.99)] motion-reduce:transition-none lg:hidden ${
        visible ? "translate-y-0" : "translate-y-full"
      }`}
    >
      <a
        href={CONTACT.lineHref}
        target="_blank"
        rel="noopener noreferrer"
        tabIndex={visible ? 0 : -1}
        className="flex min-h-11 flex-1 items-center justify-center rounded-full bg-amber-200 px-4 font-bai-jamjuree text-sm font-semibold text-slate-900"
      >
        {PARENTS_STICKY.chat}
      </a>
      <a
        href="#parents-price"
        tabIndex={visible ? 0 : -1}
        className="flex min-h-11 flex-1 items-center justify-center rounded-full border border-white/20 bg-white/5 px-4 font-bai-jamjuree text-sm font-semibold text-slate-100"
      >
        {PARENTS_STICKY.price}
      </a>
    </div>
  );
}
