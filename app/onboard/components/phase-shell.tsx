"use client";

import type { ReactNode } from "react";

import { BackButton } from "./back-button";

interface PhaseShellProps {
  eyebrow: string;
  title: string;
  subtitle?: string;
  backLabel: string;
  onBack: () => void;
  children: ReactNode;
  footer?: ReactNode;
  /** Wider content (interests). Default = reading width. */
  wide?: boolean;
}

/**
 * Mobile-first phase frame: back alone on top, title stacked, optional sticky footer CTA.
 * Avoids the desktop 3-column header that crushes titles on small screens.
 */
export function PhaseShell({
  eyebrow,
  title,
  subtitle,
  backLabel,
  onBack,
  children,
  footer,
  wide = false,
}: PhaseShellProps) {
  return (
    <section
      className={[
        "mx-auto flex w-full flex-col",
        wide ? "max-w-3xl" : "max-w-lg",
      ].join(" ")}
    >
      <div className="ei-card ei-card--static rounded-[22px] sm:rounded-[28px]">
        <div className="space-y-4 px-4 pb-4 pt-4 sm:space-y-5 sm:px-8 sm:pb-5 sm:pt-7">
          <BackButton label={backLabel} onClick={onBack} />
          <div className="space-y-2">
            <p className="dawn-eyebrow">{eyebrow}</p>
            <h2 className="text-[1.35rem] font-semibold leading-snug tracking-tight text-white sm:text-2xl sm:leading-tight">
              {title}
            </h2>
            {subtitle ? (
              <p className="text-sm leading-6 text-white/55">{subtitle}</p>
            ) : null}
          </div>
        </div>

        <div
          className={[
            "px-4 sm:px-8",
            footer ? "pb-4 sm:pb-6" : "pb-[max(1rem,env(safe-area-inset-bottom))] sm:pb-8",
          ].join(" ")}
        >
          {children}
        </div>
      </div>

      {footer ? (
        <div className="sticky bottom-0 z-20 -mx-1 mt-3 border-t border-white/[0.06] bg-[#020617]/92 px-3 py-3 backdrop-blur-md pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:static sm:mx-0 sm:mt-4 sm:border-0 sm:bg-transparent sm:px-0 sm:py-0 sm:pb-0 sm:backdrop-blur-none">
          {footer}
        </div>
      ) : null}
    </section>
  );
}
