import { PARENTS_STEPS, PARENTS_WHAT } from "@/lib/content/pathlab-parents";
import { ParentsNote } from "./section";

/** The two-minute summary the hero's secondary CTA jumps to. */
export function ParentsWhat() {
  return (
    <section
      id="parents-summary"
      aria-labelledby="parents-what"
      className="mx-auto grid w-full max-w-6xl scroll-mt-24 gap-10 px-5 py-16 sm:px-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-start lg:py-24"
    >
      <div>
        <p className="dawn-eyebrow">{PARENTS_WHAT.eyebrow}</p>
        <h2
          id="parents-what"
          className="mt-4 font-kodchasan text-3xl font-medium leading-tight text-white sm:text-4xl"
        >
          {PARENTS_WHAT.title}
        </h2>
        <p className="mt-5 font-bai-jamjuree text-base leading-8 text-slate-300">
          {PARENTS_WHAT.body}
        </p>
        <ParentsNote>{PARENTS_WHAT.note}</ParentsNote>
      </div>

      <div className="ei-card ei-card--static p-6 sm:p-8">
        <ol className="divide-y divide-white/10">
          {PARENTS_STEPS.map((step) => (
            <li
              key={step.number}
              className="grid gap-3 py-5 first:pt-0 last:pb-0 sm:grid-cols-[3rem_1fr]"
            >
              <span className="font-space-mono text-sm text-amber-200">
                {step.number}
              </span>
              <div>
                <h3 className="font-kodchasan text-lg font-medium text-white">
                  {step.title}
                </h3>
                <p className="mt-1 font-bai-jamjuree text-sm leading-7 text-slate-300">
                  {step.detail}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
