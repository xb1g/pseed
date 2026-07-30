import Link from "next/link";

import type { PseedStep } from "@/types/projectseed";

interface StepListProps {
  steps: PseedStep[];
}

/**
 * The whole flow on one screen. Done steps stay visible and clickable — a
 * participant who wants to change their project two weeks in should not have to
 * find a settings page to do it.
 */
export function StepList({ steps }: StepListProps) {
  const doneCount = steps.filter((s) => s.done).length;

  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-baseline justify-between">
        <h2 className="text-lg font-bold text-white">สิ่งที่ต้องทำ</h2>
        <p className="text-sm text-slate-400">
          {doneCount}/{steps.length} เสร็จแล้ว
        </p>
      </div>

      <ol className="flex flex-col gap-3">
        {steps.map((step, index) => (
          <li key={step.id}>
            <Link
              href={step.href}
              className="ei-card flex items-center gap-4 p-4 transition-transform hover:translate-x-0.5"
            >
              <span
                aria-hidden="true"
                className={
                  step.done
                    ? "flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-sm font-bold text-emerald-300"
                    : "flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-500/15 text-sm font-bold text-blue-200"
                }
              >
                {step.done ? "✓" : index + 1}
              </span>

              <span className="flex min-w-0 flex-col gap-0.5">
                <span className="font-semibold text-white">{step.label}</span>
                <span className="text-sm text-slate-400">{step.hint}</span>
              </span>
            </Link>
          </li>
        ))}
      </ol>
    </section>
  );
}
