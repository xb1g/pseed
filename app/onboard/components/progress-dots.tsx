"use client";

import type { OnboardingStep } from "@/types/onboarding";

const STEPS: OnboardingStep[] = [
  "welcome",
  "interest",
  "assessment",
  "results",
  "account",
];

interface ProgressDotsProps {
  currentStep: OnboardingStep;
  /** Compact for cramped mobile headers */
  compact?: boolean;
}

export function ProgressDots({
  currentStep,
  compact = false,
}: ProgressDotsProps) {
  const currentIndex = STEPS.indexOf(currentStep);

  return (
    <div
      className={[
        "flex items-center rounded-full border border-white/8 bg-white/[0.03]",
        compact ? "gap-1.5 px-2 py-1.5" : "gap-2 px-3 py-2",
      ].join(" ")}
      aria-label={`Onboarding step ${Math.max(currentIndex + 1, 1)} of ${STEPS.length}`}
    >
      {STEPS.map((step, index) => {
        const isCurrent = index === currentIndex;
        const isComplete = index < currentIndex;

        return (
          <span
            key={step}
            className={[
              "block rounded-full",
              isCurrent
                ? compact
                  ? "h-2 w-4 bg-blue-400"
                  : "h-2.5 w-6 bg-blue-400"
                : isComplete
                  ? compact
                    ? "h-1.5 w-1.5 bg-white/55"
                    : "h-2 w-2 bg-white/55"
                  : compact
                    ? "h-1.5 w-1.5 bg-white/20"
                    : "h-2 w-2 bg-white/20",
            ].join(" ")}
          />
        );
      })}
    </div>
  );
}
