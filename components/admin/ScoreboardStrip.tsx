"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import {
  SCOREBOARD_DENOMINATOR_HELP,
  SCOREBOARD_METRICS,
  pct,
  type FunnelScoreboard,
} from "@/lib/dm-leads/playbook";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

/**
 * Dotted underline marks the parts of the strip that explain themselves. The
 * trigger is a `span` (not the default `button`) so the strip stays one line of
 * running text rather than a row of controls.
 */
function Explain({ children, title, body }: { children: ReactNode; title: string; body: ReactNode }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="cursor-help underline decoration-dotted decoration-muted-foreground/50 underline-offset-4">
          {children}
        </span>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="max-w-xs text-xs leading-relaxed">
        <p className="mb-1 font-semibold">{title}</p>
        {body}
      </TooltipContent>
    </Tooltip>
  );
}

/**
 * Funnel health for the whole inbox, one compact strip. Failing metrics are
 * red — the point of the strip is to be uncomfortable when we go quiet.
 *
 * Client component only because the tooltips are Radix. The numbers still come
 * from the server via props; nothing is fetched here.
 */
export function ScoreboardStrip({ scoreboard }: { scoreboard: FunnelScoreboard }) {
  return (
    <TooltipProvider delayDuration={150}>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-lg border bg-muted/30 px-3 py-1.5 text-xs">
        <span className="text-muted-foreground">
          <Explain
            title="คุยจริง"
            body={
              <>
                <p>{SCOREBOARD_DENOMINATOR_HELP}</p>
                <p className="mt-1 text-muted-foreground">
                  ตอนนี้ {scoreboard.engaged} แชท · ตัวเลขสดจากฐานข้อมูล อัปเดตช้าสุด 20 วินาที
                </p>
              </>
            }
          >
            สุขภาพกรวย · คุยจริง
          </Explain>{" "}
          <b className="text-foreground">{scoreboard.engaged}</b>
        </span>
        {SCOREBOARD_METRICS.map((metric) => {
          const count = scoreboard[metric.key];
          const value = pct(count, scoreboard.engaged);
          const passing = value >= metric.targetPct;
          return (
            <span key={metric.key} className="flex items-center gap-1">
              <Explain
                title={metric.label}
                body={
                  <>
                    <p>{metric.description}</p>
                    <p className="mt-1 text-muted-foreground">
                      ตอนนี้ {count} จาก {scoreboard.engaged} แชท ({value}%) · ฐาน{" "}
                      {metric.baselinePct}% · เป้า {metric.targetPct}%
                    </p>
                  </>
                }
              >
                <span className="text-muted-foreground">{metric.label}</span>
              </Explain>
              <b
                className={cn(
                  "tabular-nums",
                  passing
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-red-600 dark:text-red-400"
                )}
              >
                {value}%
              </b>
              <span className="text-muted-foreground/70">{passing ? "✓" : "✗"}</span>
            </span>
          );
        })}
      </div>
    </TooltipProvider>
  );
}
