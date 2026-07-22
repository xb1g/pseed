"use client";

import { ChevronRight } from "lucide-react";

export type PathDecision = "continue_now" | "continue_tomorrow" | "pause" | "quit";

interface DecisionGateProps {
  submitting?: boolean;
  onChoose: (decision: PathDecision) => void;
}

const OPTIONS: Array<{
  decision: PathDecision;
  title: string;
  description: string;
}> = [
  {
    decision: "continue_now",
    title: "Next day",
    description: "Keep momentum and start the next day immediately.",
  },
  {
    decision: "continue_tomorrow",
    title: "Continue tomorrow",
    description: "Save progress and come back when you have energy again.",
  },
  {
    decision: "pause",
    title: "Explore something else first",
    description: "Pause this path and return to the PathLab gallery.",
  },
  {
    decision: "quit",
    title: "This isn’t for me",
    description: "Exit this path with a short reflection.",
  },
];

/**
 * The daily decision. Every option is presented with equal weight on purpose —
 * "this isn't for me" is a valid result of the instrument, not a failure, so it
 * does not get styled as the dangerous choice.
 */
export function DecisionGate({ submitting = false, onChoose }: DecisionGateProps) {
  return (
    <section aria-labelledby="decision-heading">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-300/70">
        Your call
      </p>
      <h2
        id="decision-heading"
        className="mt-2 text-2xl font-bold tracking-tight text-white sm:text-3xl"
      >
        What&apos;s next?
      </h2>
      <p className="mt-2 text-sm leading-6 text-neutral-400">
        Every option here is a real answer. Stopping counts as one.
      </p>

      <div className="mt-6 space-y-2.5">
        {OPTIONS.map((option) => (
          <button
            key={option.decision}
            type="button"
            disabled={submitting}
            onClick={() => onChoose(option.decision)}
            className="group flex w-full items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-4 text-left transition-colors hover:border-amber-400/30 hover:bg-white/[0.06] disabled:pointer-events-none disabled:opacity-50"
          >
            <span className="min-w-0 flex-1">
              <span className="block text-[15px] font-semibold text-white">
                {option.title}
              </span>
              <span className="mt-1 block text-sm leading-6 text-neutral-400">
                {option.description}
              </span>
            </span>
            <ChevronRight
              aria-hidden="true"
              className="h-5 w-5 shrink-0 text-neutral-600 transition-colors group-hover:text-amber-300"
            />
          </button>
        ))}
      </div>
    </section>
  );
}
