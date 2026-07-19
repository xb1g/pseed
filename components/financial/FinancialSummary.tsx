import type { ParentFundedModel } from "@/lib/financial-model/parent-funded";
import {
  formatCount,
  formatPercent,
  formatThaiCurrency,
} from "@/lib/financial-model/parent-funded";
import { AlertTriangle, CheckCircle2, Minus, TrendingUp } from "lucide-react";

type FinancialSummaryProps = {
  model: ParentFundedModel;
};

type BridgeRow = {
  label: string;
  value: number;
  tone: "revenue" | "cost" | "result";
};

function boundedWidth(value: number, revenue: number): string {
  if (revenue <= 0) return "0%";
  return `${Math.min(100, Math.abs(value / revenue) * 100)}%`;
}

function formatBridgeValue(value: number, tone: BridgeRow["tone"]): string {
  const formatted = formatThaiCurrency(value);
  return tone === "revenue" && value > 0 ? `+${formatted}` : formatted;
}

export function FinancialSummary({ model }: FinancialSummaryProps) {
  const isOperatingPositive = model.operatingResult >= 0;
  const metricItems = [
    { label: "Annual revenue", value: formatThaiCurrency(model.revenue.total), note: "Trial + upgrades + repeat" },
    { label: "Gross contribution", value: formatPercent(model.grossContributionMargin), note: "After direct delivery" },
    {
      label: "Operating result",
      value: formatThaiCurrency(model.operatingResult),
      note: isOperatingPositive ? "Founder draw included · positive" : "Founder draw included · negative",
    },
    {
      label: "Fully loaded break-even",
      value: `${formatCount(model.unitEconomics.breakEvenSprintSeatsPerMonth)} seats / month`,
      note: `${formatCount(model.assumptions.cohortSize)} seats = one cohort`,
    },
  ];

  const bridgeRows: BridgeRow[] = [
    { label: "Revenue", value: model.revenue.total, tone: "revenue" },
    { label: "Direct delivery", value: -model.costs.directDelivery, tone: "cost" },
    { label: "Paid acquisition", value: -model.costs.acquisition, tone: "cost" },
    { label: "Fixed business costs", value: -model.costs.annualFixedBusiness, tone: "cost" },
    { label: "Founder draw", value: -model.costs.annualFounderDraw, tone: "cost" },
    { label: "Operating result", value: model.operatingResult, tone: "result" },
  ];

  return (
    <div className="space-y-5">
      <section aria-label="Financial model outcomes" className="ei-card ei-card--static p-5 sm:p-7">
        <div className="grid gap-x-6 gap-y-6 sm:grid-cols-2 xl:grid-cols-4">
          {metricItems.map((item, index) => (
            <div key={item.label} className={index === 0 ? "" : "border-t border-white/10 pt-5 sm:border-l sm:border-t-0 sm:pl-6 sm:pt-0"}>
              <p className="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">{item.label}</p>
              <p className="mt-2 text-2xl font-semibold tabular-nums text-white">{item.value}</p>
              <p className="mt-2 text-xs leading-5 text-slate-400">{item.note}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
        <section aria-labelledby="unit-economics-heading" className="ei-card ei-card--static p-5 sm:p-7">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-300">Unit economics</p>
          <h2 id="unit-economics-heading" className="mt-2 text-xl font-semibold text-white">One seat must carry its own weight.</h2>

          <dl className="mt-6 divide-y divide-white/10">
            <div className="grid grid-cols-[1fr_auto] gap-4 py-4 first:pt-0">
              <div>
                <dt className="font-medium text-slate-200">PathLab Trial</dt>
                <dd className="mt-1 text-xs leading-5 text-slate-500">
                  {formatThaiCurrency(model.assumptions.trialPrice)} price · {formatThaiCurrency(model.assumptions.trialDirectCost)} direct cost
                </dd>
              </div>
              <dd className="text-right text-lg font-semibold tabular-nums text-emerald-300">
                {formatThaiCurrency(model.unitEconomics.trialContribution)}
              </dd>
            </div>
            <div className="grid grid-cols-[1fr_auto] gap-4 py-4">
              <div>
                <dt className="font-medium text-slate-200">Evidence Sprint seat</dt>
                <dd className="mt-1 text-xs leading-5 text-slate-500">
                  {formatThaiCurrency(model.assumptions.sprintPrice)} price · {formatThaiCurrency(model.assumptions.sprintDirectCost)} direct cost
                </dd>
              </div>
              <dd className="text-right text-lg font-semibold tabular-nums text-emerald-300">
                {formatThaiCurrency(model.unitEconomics.sprintContribution)}
              </dd>
            </div>
            <div className="grid grid-cols-[1fr_auto] gap-4 py-4 last:pb-0">
              <div>
                <dt className="font-medium text-slate-200">Full cohort</dt>
                <dd className="mt-1 text-xs leading-5 text-slate-500">
                  {formatCount(model.assumptions.cohortSize)} students · {formatThaiCurrency(model.unitEconomics.cohortRevenue)} revenue
                </dd>
              </div>
              <dd className="text-right text-lg font-semibold tabular-nums text-emerald-300">
                {formatThaiCurrency(model.unitEconomics.cohortContribution)}
              </dd>
            </div>
          </dl>
        </section>

        <section aria-labelledby="profit-bridge-heading" className="ei-card ei-card--static p-5 sm:p-7">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-300">Annual profit bridge</p>
          <h2 id="profit-bridge-heading" className="mt-2 text-xl font-semibold text-white">Where the first ฿1.95M goes.</h2>

          <div className="mt-6 space-y-4">
            {bridgeRows.map((row) => {
              const barClass = row.tone === "revenue"
                ? "bg-gradient-to-r from-amber-400 to-orange-500"
                : row.tone === "result"
                  ? isOperatingPositive
                    ? "bg-emerald-400"
                    : "bg-rose-400"
                  : "bg-slate-500";
              return (
                <div key={row.label}>
                  <div className="mb-1.5 flex items-center justify-between gap-4 text-sm">
                    <span className="text-slate-300">{row.label}</span>
                    <span className="font-medium tabular-nums text-white">{formatBridgeValue(row.value, row.tone)}</span>
                  </div>
                  <div
                    className="h-1.5 overflow-hidden rounded-full bg-white/5"
                    aria-label={`${row.label}: ${formatBridgeValue(row.value, row.tone)}`}
                  >
                    <div className={`h-full rounded-full ${barClass}`} style={{ width: boundedWidth(row.value, model.revenue.total) }} />
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      <section aria-labelledby="guardrails-heading" className="border-y border-white/10 py-6">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-amber-300" aria-hidden="true" />
          <h2 id="guardrails-heading" className="text-sm font-semibold uppercase tracking-[0.16em] text-white">Decision guardrails</h2>
        </div>
        <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            { ok: model.grossContributionMargin >= 60, text: "Keep gross contribution at or above 60%." },
            { ok: model.assumptions.paidTrialCac <= 800, text: "Target Trial CAC below ฿800; stop at ฿1,200." },
            { ok: model.assumptions.cohortSize >= 15, text: "Reprice or postpone cohorts below 15 students." },
            { ok: false, text: "Hire only after two monthly cohorts hold for three months.", neutral: true },
          ].map((guardrail) => {
            const Icon = guardrail.neutral ? Minus : guardrail.ok ? CheckCircle2 : AlertTriangle;
            const status = guardrail.neutral ? "Policy" : guardrail.ok ? "On track" : "Needs attention";
            return (
              <div key={guardrail.text} className="flex items-start gap-3">
                <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${guardrail.neutral ? "text-slate-400" : guardrail.ok ? "text-emerald-300" : "text-rose-300"}`} aria-hidden="true" />
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{status}</p>
                  <p className="mt-1 text-sm leading-6 text-slate-300">{guardrail.text}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
