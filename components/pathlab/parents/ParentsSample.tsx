import { PARENTS_SAMPLE } from "@/lib/content/pathlab-parents";
import { ParentsNote, ParentsSection, SectionHeading } from "./section";

/**
 * A real round laid out day by day. "โปรเจกต์จริง" is a claim; a schedule
 * with a named artefact at the end of every day is evidence, and evidence is
 * what a parent is shopping for. Days come from the Web Dev path in FIELDS,
 * so this can never promise a day the student page does not run.
 */
export function ParentsSample() {
  if (PARENTS_SAMPLE.days.length === 0) return null;

  return (
    <ParentsSection labelledBy="parents-sample">
      <SectionHeading
        id="parents-sample"
        eyebrow={PARENTS_SAMPLE.eyebrow}
        title={PARENTS_SAMPLE.title}
        body={PARENTS_SAMPLE.brief}
      />

      <p className="mt-3 font-bai-jamjuree text-sm text-blue-200/80">
        {PARENTS_SAMPLE.briefBy}
      </p>

      <ol className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {PARENTS_SAMPLE.days.map((day, index) => (
          <li key={day.title} className="ei-card ei-card--static flex flex-col p-5">
            <p className="font-space-mono text-xs uppercase tracking-[0.16em] text-amber-200">
              {PARENTS_SAMPLE.dayPrefix} {index + 1}
            </p>
            <h3 className="mt-3 font-kodchasan text-base font-medium leading-snug text-white">
              {day.title}
            </h3>
            <p className="mt-2 flex-1 font-bai-jamjuree text-sm leading-7 text-slate-300">
              {day.doing}
            </p>
            <p className="mt-4 border-t border-white/10 pt-3 font-bai-jamjuree text-xs leading-6 text-blue-200">
              <span className="text-slate-400">
                {PARENTS_SAMPLE.getsLabel}:{" "}
              </span>
              {day.gets}
            </p>
          </li>
        ))}
      </ol>

      <p className="mt-6 font-bai-jamjuree text-sm leading-7 text-slate-400">
        {PARENTS_SAMPLE.footnote}
      </p>

      <ParentsNote tilt="pathlab-note--tilt-r">{PARENTS_SAMPLE.note}</ParentsNote>
    </ParentsSection>
  );
}
