import type { ParentFundedAssumptions } from "@/lib/financial-model/parent-funded";
import { RotateCcw, SlidersHorizontal } from "lucide-react";

type AssumptionsPanelProps = {
  assumptions: ParentFundedAssumptions;
  onChange: (assumptions: ParentFundedAssumptions) => void;
  onReset: () => void;
};

type AssumptionField = {
  key: keyof ParentFundedAssumptions;
  label: string;
  suffix: string;
  max?: number;
  step?: number;
};

const ASSUMPTION_FIELDS: AssumptionField[] = [
  { key: "completedFreePlans", label: "Completed free plans per year", suffix: "plans" },
  { key: "freeToTrialRate", label: "Free plan to paid Trial", suffix: "%", max: 100, step: 0.1 },
  { key: "trialToSprintRate", label: "Trial to first Sprint", suffix: "%", max: 100, step: 0.1 },
  { key: "sprintRepeatRate", label: "First Sprint to repeat Sprint", suffix: "%", max: 100, step: 0.1 },
  { key: "trialPrice", label: "PathLab Trial price", suffix: "THB" },
  { key: "sprintPrice", label: "Admission Evidence Sprint price", suffix: "THB" },
  { key: "returningSprintPrice", label: "Returning Sprint price", suffix: "THB" },
  { key: "trialDirectCost", label: "Trial direct cost", suffix: "THB" },
  { key: "sprintDirectCost", label: "Full Sprint direct cost", suffix: "THB" },
  { key: "paidTrialCac", label: "CAC per paid Trial family", suffix: "THB" },
  { key: "monthlyFixedBusinessCost", label: "Monthly business fixed cost", suffix: "THB" },
  { key: "monthlyFounderDraw", label: "Monthly founder draw", suffix: "THB" },
  { key: "cohortSize", label: "Students per Sprint cohort", suffix: "students", min: 1 } as AssumptionField & { min: number },
];

export function AssumptionsPanel({
  assumptions,
  onChange,
  onReset,
}: AssumptionsPanelProps) {
  const updateAssumption = (key: keyof ParentFundedAssumptions, rawValue: string) => {
    const value = rawValue === "" ? 0 : Number(rawValue);
    onChange({
      ...assumptions,
      [key]: Number.isFinite(value) ? value : 0,
    });
  };

  return (
    <section aria-labelledby="assumptions-heading" className="ei-card ei-card--static p-5 sm:p-7">
      <div className="flex flex-col gap-4 border-b border-white/10 pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-amber-300">
            <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
            Working assumptions
          </div>
          <h2 id="assumptions-heading" className="text-xl font-semibold text-white sm:text-2xl">
            Change one lever. See the whole model move.
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
            Rates use annual funnel totals. Trial credit is applied automatically to the first Sprint.
          </p>
        </div>
        <button type="button" onClick={onReset} className="ei-button-dusk self-start !px-4 !py-2 !text-sm sm:self-auto">
          <RotateCcw className="h-4 w-4" aria-hidden="true" />
          <span>Reset base case</span>
        </button>
      </div>

      <div className="mt-6 grid gap-x-5 gap-y-4 sm:grid-cols-2 xl:grid-cols-3">
        {ASSUMPTION_FIELDS.map((field) => {
          const id = `financial-${field.key}`;
          return (
            <div key={field.key} className="space-y-2">
              <label htmlFor={id} className="block min-h-10 text-sm font-medium leading-5 text-slate-300">
                {field.label}
              </label>
              <div className="relative">
                <input
                  id={id}
                  type="number"
                  min={field.key === "cohortSize" ? 1 : 0}
                  max={field.max}
                  step={field.step ?? 1}
                  value={assumptions[field.key]}
                  onChange={(event) => updateAssumption(field.key, event.target.value)}
                  className="ei-input min-h-12 pr-20 tabular-nums"
                />
                <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs font-medium uppercase tracking-wide text-slate-500">
                  {field.suffix}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
