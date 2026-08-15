import { PackageCheck } from "lucide-react";

import { PARENTS_TAKE_HOME } from "@/lib/content/pathlab-parents";
import { ParentsNote, ParentsSection, SectionHeading } from "./section";

/** The return on 299 baht, stated as four things a parent can hold or hear. */
export function ParentsTakeHome() {
  return (
    <ParentsSection labelledBy="parents-take-home">
      <SectionHeading
        id="parents-take-home"
        eyebrow={PARENTS_TAKE_HOME.eyebrow}
        title={PARENTS_TAKE_HOME.title}
      />

      <ul className="mt-10 grid gap-4 sm:grid-cols-2">
        {PARENTS_TAKE_HOME.items.map((item) => (
          <li key={item.title} className="ei-card ei-card--static p-6">
            <PackageCheck
              aria-hidden="true"
              className="h-6 w-6 text-blue-300"
            />
            <h3 className="mt-4 font-kodchasan text-lg font-medium leading-snug text-white">
              {item.title}
            </h3>
            <p className="mt-2 font-bai-jamjuree text-sm leading-7 text-slate-300">
              {item.detail}
            </p>
          </li>
        ))}
      </ul>

      <ParentsNote tilt="pathlab-note--tilt-r-sm">
        {PARENTS_TAKE_HOME.note}
      </ParentsNote>
    </ParentsSection>
  );
}
