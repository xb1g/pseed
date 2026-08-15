import { CheckCircle2 } from "lucide-react";

import { PARENTS_STANDARDS } from "@/lib/content/pathlab-parents";
import { ParentsNote, ParentsSection, SectionHeading } from "./section";

/**
 * How every round is run. The headline figure lives in the trust card above,
 * so this section carries only the commitments, without restating the number.
 */
export function ParentsStandards() {
  return (
    <ParentsSection labelledBy="parents-standards">
      <div className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
        <SectionHeading
          id="parents-standards"
          eyebrow={PARENTS_STANDARDS.eyebrow}
          title={PARENTS_STANDARDS.title}
        />

        <ul className="divide-y divide-white/10 border-y border-white/10">
          {PARENTS_STANDARDS.points.map((point) => (
            <li
              key={point}
              className="flex gap-4 py-5 font-bai-jamjuree text-base leading-7 text-slate-200"
            >
              <CheckCircle2
                aria-hidden="true"
                className="mt-1 h-5 w-5 shrink-0 text-blue-300"
              />
              <span>{point}</span>
            </li>
          ))}
        </ul>
      </div>

      <ParentsNote tilt="pathlab-note--tilt-r-sm">
        {PARENTS_STANDARDS.note}
      </ParentsNote>
    </ParentsSection>
  );
}
