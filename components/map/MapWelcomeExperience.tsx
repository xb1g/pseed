"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { DawnScene } from "@/components/projectseed/dawn-scene";
import { LearningMap } from "@/types/map";

export interface MapWelcomeExperienceProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  map: LearningMap & {
    node_count?: number;
    avg_difficulty?: number;
  };
}

/** Stage indices: 0 bare scene → FINAL fully revealed. */
export const FINAL_STAGE = 5;

/** ms after open at which each stage appears. */
export const STAGE_AT_MS = [0, 800, 2200, 3600, 4800, 6500] as const;

export const LAUNCHPAD_COPY = {
  keynote: "You're in.",
  eyebrow: "6-Day Startup Accelerator",
  story: [
    "For the next 6 days, you're a founder.",
    "Build your own idea, or follow SeniorPass: the story of Fah, an M.4 student panicking before midterms, and P'Beam, the senior whose notes could save her.",
    "Either way, you ship a real pitch by Day 6.",
  ],
  days: [
    "Spot the Problem",
    "Find Your Customer",
    "Napkin Economics",
    "Ship the MVP",
    "First 50 Users",
    "Pitch Day",
  ],
  cta: "Begin Day 1",
  dismiss: "Look around first",
} as const;

export function isLaunchpadMap(title: string): boolean {
  return title.toLowerCase().includes("launchpad");
}

export function getDifficultyLabel(difficulty: number = 5): string {
  if (difficulty <= 3) return "Beginner";
  if (difficulty <= 6) return "Intermediate";
  if (difficulty <= 8) return "Advanced";
  return "Expert";
}

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(query.matches);
    const onChange = (event: MediaQueryListEvent) => setReduced(event.matches);
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);
  return reduced;
}

export function MapWelcomeExperience({
  isOpen,
  onOpenChange,
  map,
}: MapWelcomeExperienceProps) {
  const reducedMotion = usePrefersReducedMotion();
  const [stage, setStage] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const ctaRef = useRef<HTMLButtonElement>(null);
  const previouslyFocused = useRef<Element | null>(null);

  const close = useCallback(() => onOpenChange(false), [onOpenChange]);

  // Schedule the staged reveal whenever the experience opens.
  useEffect(() => {
    if (!isOpen) return;
    previouslyFocused.current = document.activeElement;
    if (reducedMotion) {
      setStage(FINAL_STAGE);
      return;
    }
    setStage(0);
    const timers = STAGE_AT_MS.slice(1).map((delay, i) =>
      window.setTimeout(() => setStage(i + 1), delay)
    );
    return () => timers.forEach((t) => window.clearTimeout(t));
  }, [isOpen, reducedMotion]);

  // Focus the overlay on open; restore focus on close.
  useEffect(() => {
    if (!isOpen) return;
    rootRef.current?.focus();
    return () => {
      (previouslyFocused.current as HTMLElement | null)?.focus?.();
    };
  }, [isOpen]);

  // Move focus to the CTA once the final stage renders it.
  useEffect(() => {
    if (isOpen && stage >= FINAL_STAGE) ctaRef.current?.focus();
  }, [isOpen, stage]);

  // Esc closes; Tab is trapped inside the overlay.
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        close();
        return;
      }
      if (event.key !== "Tab" || !rootRef.current) return;
      const focusables = Array.from(
        rootRef.current.querySelectorAll<HTMLElement>("button, a[href]")
      );
      if (focusables.length === 0) {
        event.preventDefault();
        return;
      }
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      } else if (!rootRef.current.contains(document.activeElement)) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [isOpen, close]);

  if (!isOpen) return null;

  const revealAll = () => setStage(FINAL_STAGE);
  const launchpad = isLaunchpadMap(map.title);
  const supportingLine =
    map.description?.split(/(?<=[.!?])\s/)[0] ??
    "Get ready for an exciting learning journey.";

  return createPortal(
    <div
      ref={rootRef}
      role="dialog"
      aria-modal="true"
      aria-label={`Welcome to ${map.title}`}
      tabIndex={-1}
      className="dawn-theme fixed inset-0 z-[60] overflow-hidden outline-none"
      onClick={stage < FINAL_STAGE ? revealAll : undefined}
    >
      <DawnScene />
      <p aria-live="polite" className="sr-only">
        {stage >= 1 ? `You're in. Welcome to ${map.title}.` : ""}
      </p>

      <div className="relative z-10 flex min-h-full flex-col items-center justify-center px-6 text-center">
        {stage >= 1 && (
          <h2 className="welcome-stage font-kodchasan text-5xl font-bold text-[#fed95c] md:text-6xl">
            {LAUNCHPAD_COPY.keynote}
          </h2>
        )}

        {stage >= 2 && (
          <div className="welcome-stage mt-6 space-y-2">
            {launchpad && (
              <p className="dawn-eyebrow">{LAUNCHPAD_COPY.eyebrow}</p>
            )}
            <h3 className="text-2xl font-semibold text-slate-100 md:text-3xl">
              {map.title}
            </h3>
          </div>
        )}

        {stage >= 3 && launchpad && (
          <div className="welcome-stage mt-8 max-w-lg space-y-2">
            {LAUNCHPAD_COPY.story.map((line) => (
              <p key={line} className="text-base text-slate-300 md:text-lg">
                {line}
              </p>
            ))}
          </div>
        )}

        {stage >= 3 && !launchpad && (
          <div className="welcome-stage mt-10 flex items-center gap-4 text-sm text-slate-300">
            {map.node_count != null && <span>{map.node_count} islands</span>}
            <span>{getDifficultyLabel(map.avg_difficulty)} level</span>
          </div>
        )}

        {stage >= 4 && launchpad && (
          <ol className="welcome-stage mt-10 flex flex-col items-center gap-3 md:flex-row md:gap-5">
            {LAUNCHPAD_COPY.days.map((day, i) => (
              <li
                key={day}
                className="welcome-stage flex items-center gap-2"
                style={{ animationDelay: `${i * 250}ms` }}
              >
                <span
                  className={`h-2 w-2 rounded-full ${
                    i === LAUNCHPAD_COPY.days.length - 1
                      ? "bg-[#fed95c] shadow-[0_0_12px_rgba(254,217,92,0.8)]"
                      : "bg-blue-400"
                  }`}
                />
                <span className="text-sm text-slate-300">{day}</span>
              </li>
            ))}
          </ol>
        )}

        {stage >= FINAL_STAGE && (
          <div className="welcome-stage mt-12 flex flex-col items-center gap-4">
            <p className="max-w-md text-slate-400">{supportingLine}</p>
            <button ref={ctaRef} onClick={close} className="ei-button-dawn">
              {launchpad ? LAUNCHPAD_COPY.cta : "Start Exploring"}
            </button>
            <button
              onClick={close}
              className="text-sm text-slate-500 transition-colors hover:text-slate-300"
            >
              {launchpad ? LAUNCHPAD_COPY.dismiss : "Skip"}
            </button>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
