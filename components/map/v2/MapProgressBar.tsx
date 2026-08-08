"use client";

import { cn } from "@/lib/utils";

interface MapProgressBarProps {
  totalNodes: number;
  passedNodes: number;
  inProgressNodes: number;
  submittedNodes: number;
  className?: string;
}

export function MapProgressBar({
  totalNodes,
  passedNodes,
  inProgressNodes,
  submittedNodes,
  className,
}: MapProgressBarProps) {
  const pct = (value: number) => (totalNodes > 0 ? (value / totalNodes) * 100 : 0);
  const notStarted = Math.max(0, totalNodes - passedNodes - submittedNodes - inProgressNodes);
  const completedPct = Math.round(pct(passedNodes));
  const isComplete = totalNodes > 0 && passedNodes === totalNodes;
  const segments = [
    { count: passedNodes, color: "bg-emerald-500" },
    { count: submittedNodes, color: "bg-blue-500" },
    { count: inProgressNodes, color: "bg-amber-500" },
    { count: notStarted, color: "bg-slate-600" },
  ];

  return (
    <div className={cn("w-full", className)}>
      <div
        className={cn(
          "flex h-2 w-full overflow-hidden rounded-full bg-slate-800 transition-all duration-500",
          isComplete && "animate-pulse shadow-[0_0_16px_rgba(16,185,129,0.5)]"
        )}
      >
        {segments.map(({ count, color }, i) => (
          <div key={i} className={cn("h-full transition-all duration-500", color)} style={{ width: `${pct(count)}%` }} />
        ))}
      </div>
      <div className="mt-2 flex items-center justify-between text-sm text-slate-400">
        <span>{passedNodes} / {totalNodes} completed</span>
        {isComplete ? <span className="font-medium text-emerald-400">Complete!</span> : <span>{completedPct}%</span>}
      </div>
    </div>
  );
}
