import type { ParentFundedModel } from "@/lib/financial-model/parent-funded";
import { formatCount, formatPercent } from "@/lib/financial-model/parent-funded";
import { ArrowRight, Compass, FlaskConical, Repeat2, Rocket } from "lucide-react";

type FinancialFunnelProps = {
  model: ParentFundedModel;
};

export function FinancialFunnel({ model }: FinancialFunnelProps) {
  const steps = [
    {
      label: "Free Radar + Plan",
      value: model.funnel.completedFreePlans,
      note: "Completed plans",
      conversion: `${formatPercent(model.assumptions.freeToTrialRate)} buy a Trial`,
      icon: Compass,
    },
    {
      label: "Paid PathLab Trial",
      value: model.funnel.paidTrials,
      note: "Parent-funded families",
      conversion: `${formatPercent(model.assumptions.trialToSprintRate)} upgrade`,
      icon: FlaskConical,
    },
    {
      label: "Evidence Sprint",
      value: model.funnel.firstSprintSeats,
      note: "First Sprint seats",
      conversion: `${formatPercent(model.assumptions.sprintRepeatRate)} return`,
      icon: Rocket,
    },
    {
      label: "Repeat Sprint",
      value: model.funnel.repeatSprintSeats,
      note: "Second outcomes",
      conversion: "",
      icon: Repeat2,
    },
  ];

  return (
    <section aria-labelledby="funnel-heading" className="ei-card ei-card--static overflow-hidden p-5 sm:p-7">
      <div className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-300">Annual parent funnel</p>
        <h2 id="funnel-heading" className="mt-2 text-xl font-semibold text-white sm:text-2xl">
          Free clarity earns the right to sell execution.
        </h2>
      </div>

      <ol className="grid gap-3 lg:grid-cols-4 lg:gap-0">
        {steps.map((step, index) => {
          const Icon = step.icon;
          return (
            <li key={step.label} className="relative flex min-w-0 items-stretch">
              <div className="flex w-full items-start gap-4 border-l border-white/10 py-3 pl-4 lg:block lg:border-l-0 lg:border-t lg:px-4 lg:pt-5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-amber-300/20 bg-amber-300/10 text-amber-300">
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </div>
                <div className="min-w-0 lg:mt-5">
                  <p className="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">{step.label}</p>
                  <p className="mt-1 text-3xl font-semibold tabular-nums text-white">{formatCount(step.value)}</p>
                  <p className="mt-1 text-sm text-slate-400">{step.note}</p>
                  {step.conversion ? (
                    <p className="mt-3 flex items-center gap-1.5 text-xs font-medium text-amber-200/80">
                      {step.conversion}
                      <ArrowRight className="h-3 w-3" aria-hidden="true" />
                    </p>
                  ) : null}
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
