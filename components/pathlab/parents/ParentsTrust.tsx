import { Mail } from "lucide-react";

import { CONTACT, PROOF } from "@/lib/content/pathlab-page";
import { PARENTS_EMAIL, PARENTS_TRUST } from "@/lib/content/pathlab-parents";
import { ParentsNote, ParentsSection, SectionHeading } from "./section";

/**
 * Identity, before anything about the programme. A parent's first question is
 * who these people are and whether there is a real name attached, so the
 * safeguarding lead and two non-DM contact routes lead the page.
 */
export function ParentsTrust() {
  return (
    <ParentsSection labelledBy="parents-trust">
      <SectionHeading
        id="parents-trust"
        eyebrow={PARENTS_TRUST.eyebrow}
        title={PARENTS_TRUST.title}
      />

      <div className="ei-card ei-card--static mt-8 p-6 sm:p-8">
        <dl className="grid gap-6 sm:grid-cols-2">
          <div>
            <dt className="font-bai-jamjuree text-xs uppercase tracking-wider text-slate-400">
              {PARENTS_TRUST.leadLabel}
            </dt>
            <dd className="mt-2 font-kodchasan text-lg font-medium text-white">
              {PARENTS_TRUST.leadName}
            </dd>
            <dd className="mt-1 font-bai-jamjuree text-sm leading-7 text-slate-300">
              {PARENTS_TRUST.leadRole}
            </dd>
          </div>

          <div>
            <dt className="font-bai-jamjuree text-xs uppercase tracking-wider text-slate-400">
              {PARENTS_TRUST.channelsLabel}
            </dt>
            <dd className="mt-2 font-bai-jamjuree text-sm leading-7 text-slate-300">
              Instagram{" "}
              <a
                href={CONTACT.href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-200 underline underline-offset-4 transition-colors hover:text-white"
              >
                @{CONTACT.handle}
              </a>
            </dd>
            <dd className="font-bai-jamjuree text-sm leading-7 text-slate-300">
              <Mail
                aria-hidden="true"
                className="mr-1 inline h-4 w-4 align-[-0.15em] text-slate-400"
              />
              <a
                href={`mailto:${PARENTS_EMAIL}`}
                className="text-blue-200 underline underline-offset-4 transition-colors hover:text-white"
              >
                {PARENTS_EMAIL}
              </a>
            </dd>
          </div>
        </dl>

        <p className="mt-7 border-t border-white/10 pt-6 font-bai-jamjuree text-sm leading-7 text-slate-300">
          <span className="font-semibold text-amber-200">{PROOF.figure}</span>{" "}
          {PROOF.sub}
        </p>
      </div>

      <ParentsNote tilt="pathlab-note--tilt-r">{PARENTS_TRUST.note}</ParentsNote>
    </ParentsSection>
  );
}
