import Link from "next/link";
import { ArrowRight, ShieldCheck } from "lucide-react";

import {
  PARENTS_EMAIL,
  PARENTS_SAFETY,
  SAFEGUARDING_HREF,
} from "@/lib/content/pathlab-parents";
import { ParentsNote, ParentsSection, SectionHeading } from "./section";

/**
 * The load-bearing section of this page. Every rule listed already exists in
 * the written child-protection policy, which is linked in full so a parent
 * can check the claim rather than take it. Nothing aspirational goes here.
 */
export function ParentsSafety() {
  return (
    <ParentsSection labelledBy="parents-safety">
      <SectionHeading
        id="parents-safety"
        eyebrow={PARENTS_SAFETY.eyebrow}
        title={PARENTS_SAFETY.title}
        body={PARENTS_SAFETY.body}
      />

      <ul className="mt-8 grid gap-3 sm:grid-cols-2">
        {PARENTS_SAFETY.rules.map((rule) => (
          <li key={rule} className="ei-card ei-card--static flex gap-3 p-5">
            <ShieldCheck
              aria-hidden="true"
              className="mt-0.5 h-5 w-5 shrink-0 text-blue-300"
            />
            <span className="font-bai-jamjuree text-sm leading-7 text-slate-200">
              {rule}
            </span>
          </li>
        ))}
      </ul>

      <Link
        href={SAFEGUARDING_HREF}
        className="mt-7 inline-flex min-h-11 items-center gap-2 font-bai-jamjuree text-sm font-semibold text-blue-200 transition-colors hover:text-white"
      >
        {PARENTS_SAFETY.policyCta}
        <ArrowRight aria-hidden="true" className="h-4 w-4" />
      </Link>

      <p className="mt-4 font-bai-jamjuree text-sm leading-7 text-slate-400">
        {PARENTS_SAFETY.reportPrefix}{" "}
        <a
          href={`mailto:${PARENTS_EMAIL}`}
          className="text-blue-200 underline underline-offset-4 transition-colors hover:text-white"
        >
          {PARENTS_EMAIL}
        </a>{" "}
        {PARENTS_SAFETY.reportSuffix}
      </p>

      <ParentsNote tilt="pathlab-note--tilt-l-sm">
        {PARENTS_SAFETY.note}
      </ParentsNote>
    </ParentsSection>
  );
}
