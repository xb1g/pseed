"use client";

import { cn } from "@/lib/utils";
import {
  PIRATE_STAGES,
  stageConversion,
  type PirateFunnel as PirateFunnelData,
} from "@/lib/dm-leads/pirate-funnel";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

/**
 * AARRR as proportional bars.
 *
 * Bars are scaled against the top stage so the collapse is visible rather than
 * inferred from digits — the point of the chart is that the shape is alarming.
 * The worst step-to-step drop is called out by name, because a funnel that does
 * not tell you where to work is decoration.
 */
export function PirateFunnel({ funnel }: { funnel: PirateFunnelData }) {
  const top = funnel.counts.acquisition ?? 0;

  return (
    <TooltipProvider delayDuration={150}>
      <div className="space-y-2 rounded-lg border p-3">
        <div className="flex items-baseline justify-between">
          <h3 className="text-sm font-semibold">Pirate funnel</h3>
          {funnel.worstDropoff && (
            <p className="text-xs text-muted-foreground">
              รั่วหนักสุดที่{" "}
              <b className="text-red-600 dark:text-red-400">
                {PIRATE_STAGES.find((s) => s.key === funnel.worstDropoff!.stage)?.label}
              </b>{" "}
              เสีย {funnel.worstDropoff.lostPct}%
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          {PIRATE_STAGES.map((stage) => {
            const count = funnel.counts[stage.key];
            const conversion = stageConversion(funnel, stage.key);
            const width =
              count === null || top === 0 ? 0 : Math.max(1, (count / top) * 100);
            const isWorst = funnel.worstDropoff?.stage === stage.key;

            return (
              <Tooltip key={stage.key}>
                <TooltipTrigger asChild>
                  <div className="flex cursor-help items-center gap-2">
                    <span className="w-24 shrink-0 text-xs text-muted-foreground">
                      {stage.label}
                    </span>
                    <div className="relative h-6 flex-1 overflow-hidden rounded bg-muted">
                      <div
                        className={cn(
                          "h-full rounded transition-all",
                          count === null
                            ? "bg-muted-foreground/20"
                            : isWorst
                              ? "bg-red-500/70"
                              : "bg-primary/60"
                        )}
                        style={{ width: `${width}%` }}
                      />
                      <span className="absolute inset-y-0 left-2 flex items-center text-xs font-medium tabular-nums">
                        {count === null ? "ยังไม่ได้วัด" : count}
                      </span>
                    </div>
                    <span className="w-12 shrink-0 text-right text-xs tabular-nums text-muted-foreground">
                      {conversion === null ? "" : `${conversion}%`}
                    </span>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="right" className="max-w-xs text-xs leading-relaxed">
                  <p className="mb-1 font-semibold">{stage.label}</p>
                  <p>{stage.definition}</p>
                  <p className="mt-1 text-muted-foreground">ที่มา: {stage.source}</p>
                  {conversion !== null && (
                    <p className="mt-1 text-muted-foreground">
                      ผ่านมาจากขั้นก่อนหน้า {conversion}%
                    </p>
                  )}
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>
      </div>
    </TooltipProvider>
  );
}
