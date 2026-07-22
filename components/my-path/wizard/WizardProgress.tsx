"use client";

import { Check } from "lucide-react";

const STEP_LABELS = ["เริ่ม", "จุดไฟ", "เป้าหมาย", "แผน"];

export function WizardProgress({
  step,
  totalSteps,
}: {
  step: number;
  totalSteps: number;
}) {
  return (
    <div className="mx-auto w-full max-w-2xl px-4 pt-5 sm:px-6">
      <div className="flex items-center gap-2" role="list" aria-label="ขั้นตอน">
        {STEP_LABELS.slice(0, totalSteps).map((label, index) => {
          const done = index < step;
          const active = index === step;
          return (
            <div key={label} className="flex flex-1 flex-col items-center gap-1.5" role="listitem">
              <div
                className={`flex h-7 w-7 items-center justify-center rounded-full border text-[11px] font-semibold transition-colors ${
                  done
                    ? "border-amber-200/50 bg-amber-200/15 text-amber-100"
                    : active
                      ? "border-indigo-200/60 bg-indigo-200/15 text-indigo-100"
                      : "border-white/10 bg-white/[0.03] text-slate-500"
                }`}
                aria-current={active ? "step" : undefined}
              >
                {done ? <Check className="h-3.5 w-3.5" aria-hidden="true" /> : index + 1}
              </div>
              <span
                className={`text-[10px] font-medium ${
                  active ? "text-indigo-100" : done ? "text-amber-100/70" : "text-slate-600"
                }`}
              >
                {label}
              </span>
            </div>
          );
        })}
      </div>
      <div className="mt-3 h-1 overflow-hidden rounded-full bg-white/[0.06]">
        <div
          className="h-full rounded-full bg-gradient-to-r from-blue-400 via-indigo-400 to-amber-200 transition-all duration-500"
          style={{ width: `${((step + 1) / totalSteps) * 100}%` }}
        />
      </div>
    </div>
  );
}
