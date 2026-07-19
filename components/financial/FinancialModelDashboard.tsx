"use client";

import {
  DEFAULT_PARENT_FUNDED_ASSUMPTIONS,
  calculateParentFundedModel,
  normalizeParentFundedAssumptions,
  type ParentFundedAssumptions,
} from "@/lib/financial-model/parent-funded";
import { ArrowDown, CircleDollarSign, LockKeyhole } from "lucide-react";
import { useMemo, useState } from "react";
import { AssumptionsPanel } from "./AssumptionsPanel";
import { FinancialFunnel } from "./FinancialFunnel";
import { FinancialSummary } from "./FinancialSummary";

export function FinancialModelDashboard() {
  const [assumptions, setAssumptions] = useState<ParentFundedAssumptions>(() => ({
    ...DEFAULT_PARENT_FUNDED_ASSUMPTIONS,
  }));
  const model = useMemo(() => calculateParentFundedModel(assumptions), [assumptions]);

  const updateAssumptions = (nextAssumptions: ParentFundedAssumptions) => {
    setAssumptions(normalizeParentFundedAssumptions(nextAssumptions));
  };

  const resetAssumptions = () => {
    setAssumptions({ ...DEFAULT_PARENT_FUNDED_ASSUMPTIONS });
  };

  return (
    <main className="dusk-theme relative min-h-screen overflow-hidden bg-[#06000f] text-white">
      <div className="pointer-events-none fixed inset-0" aria-hidden="true">
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, #06000f 0%, #150329 28%, #2d0750 58%, #3f102f 82%, #1b0814 100%)",
          }}
        />
        <div className="absolute -left-48 top-28 h-[34rem] w-[34rem] rounded-full bg-purple-700/15 blur-[110px]" />
        <div className="absolute -right-48 top-[34rem] h-[30rem] w-[30rem] rounded-full bg-rose-700/10 blur-[120px]" />
        <div className="absolute inset-x-0 bottom-0 h-96 bg-gradient-to-t from-amber-500/10 via-orange-500/5 to-transparent" />
        <div
          className="absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage: "radial-gradient(rgba(255,255,255,0.75) 0.7px, transparent 0.7px)",
            backgroundSize: "22px 22px",
          }}
        />
      </div>

      <div className="relative z-10 mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
        <header className="border-b border-white/10 pb-8 sm:pb-10">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-amber-300">
                <CircleDollarSign className="h-4 w-4" aria-hidden="true" />
                PassionSeed · Parent-funded engine
              </div>
              <h1 className="mt-4 max-w-3xl text-3xl font-semibold leading-tight tracking-tight text-white sm:text-4xl lg:text-5xl">
                Can one urgent admissions outcome fund PassionSeed?
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-slate-300 sm:text-lg">
                Radar and Plan stay free. Parents pay when a student needs help turning the next 2–4 months into credible admissions evidence.
              </p>
            </div>

            <div className="flex items-center gap-3 self-start rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-sm text-emerald-200 lg:self-auto">
              <span className="h-2 w-2 rounded-full bg-emerald-300" aria-hidden="true" />
              Base case · founder-led
            </div>
          </div>

          <div className="mt-7 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.16em] text-slate-500">
            <span>Clarity</span>
            <ArrowDown className="h-3 w-3 -rotate-90 text-amber-300" aria-hidden="true" />
            <span>Trial</span>
            <ArrowDown className="h-3 w-3 -rotate-90 text-amber-300" aria-hidden="true" />
            <span>Evidence</span>
            <ArrowDown className="h-3 w-3 -rotate-90 text-amber-300" aria-hidden="true" />
            <span>Repeat</span>
          </div>
        </header>

        <div className="mt-6 space-y-6 sm:mt-8 sm:space-y-8">
          <FinancialFunnel model={model} />
          <FinancialSummary model={model} />
          <AssumptionsPanel
            assumptions={assumptions}
            onChange={updateAssumptions}
            onReset={resetAssumptions}
          />
        </div>

        <footer className="mt-10 border-t border-white/10 pt-6 sm:mt-12">
          <div className="flex items-start gap-3 text-sm leading-6 text-slate-500">
            <LockKeyhole className="mt-1 h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
            <p>
              Model boundary: urgent parent-funded PathLabs only. Sponsor bounties, school licenses, fundraising, taxes, and actual cash collections are intentionally excluded until this loop is validated.
            </p>
          </div>
        </footer>
      </div>
    </main>
  );
}
