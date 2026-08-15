import { Plus } from "lucide-react";

import { CONTACT } from "@/lib/content/pathlab-page";
import {
  PARENTS_EMAIL,
  PARENTS_FAQ,
  PARENTS_FAQ_SECTION,
} from "@/lib/content/pathlab-parents";
import { ParentsNote, ParentsSection, SectionHeading } from "./section";

/**
 * The objections that actually stop a purchase. Built on native
 * details/summary: it needs no JavaScript, stays keyboard accessible, and the
 * answers remain findable by search engines and by Cmd+F.
 */
export function ParentsFaq() {
  return (
    <ParentsSection
      id="parents-faq"
      labelledBy="parents-faq-heading"
      className="scroll-mt-24"
    >
      <SectionHeading
        id="parents-faq-heading"
        eyebrow={PARENTS_FAQ_SECTION.eyebrow}
        title={PARENTS_FAQ_SECTION.title}
      />

      <div className="mt-10 divide-y divide-white/10 border-y border-white/10">
        {PARENTS_FAQ.map((item) => (
          <details key={item.q} className="group py-2">
            <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 py-3 font-kodchasan text-base font-medium leading-snug text-white transition-colors hover:text-amber-200 [&::-webkit-details-marker]:hidden">
              {item.q}
              <Plus
                aria-hidden="true"
                className="h-5 w-5 shrink-0 text-blue-300 transition-transform duration-300 group-open:rotate-45"
              />
            </summary>
            <p className="pb-5 pr-9 font-bai-jamjuree text-sm leading-8 text-slate-300">
              {item.a}
            </p>
          </details>
        ))}
      </div>

      <p className="mt-8 font-bai-jamjuree text-sm leading-7 text-slate-300">
        {PARENTS_FAQ_SECTION.fallback}{" "}
        <a
          href={CONTACT.href}
          target="_blank"
          rel="noopener noreferrer"
          className="font-semibold text-blue-200 underline underline-offset-4 transition-colors hover:text-white"
        >
          {CONTACT.handle}
        </a>{" "}
        หรือ{" "}
        <a
          href={`mailto:${PARENTS_EMAIL}`}
          className="font-semibold text-blue-200 underline underline-offset-4 transition-colors hover:text-white"
        >
          {PARENTS_EMAIL}
        </a>
      </p>

      <ParentsNote tilt="pathlab-note--tilt-r-sm">
        {PARENTS_FAQ_SECTION.note}
      </ParentsNote>
    </ParentsSection>
  );
}
