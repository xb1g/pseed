import Link from "next/link";
import { ArrowRight, Instagram, Mail, MessageCircle } from "lucide-react";

import { CONTACT } from "@/lib/content/pathlab-page";
import { PARENTS_CLOSE, PARENTS_EMAIL } from "@/lib/content/pathlab-parents";
import { ParentsNote, SectionHeading } from "./section";

/**
 * The close. Low-pressure on purpose: a parent who is still deciding needs a
 * door, not a deadline. Extra bottom padding on touch keeps the sticky bar
 * from covering the buttons.
 */
export function ParentsClose() {
  return (
    <section
      aria-labelledby="parents-close"
      className="mx-auto w-full max-w-4xl px-5 py-16 pb-40 sm:px-8 lg:py-24 lg:pb-28"
    >
      <div className="ei-card ei-card--static p-7 text-center sm:p-10">
        <SectionHeading
          id="parents-close"
          eyebrow={PARENTS_CLOSE.eyebrow}
          title={PARENTS_CLOSE.title}
          body={PARENTS_CLOSE.body}
          align="center"
        />

        <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
          <a
            href={CONTACT.href}
            target="_blank"
            rel="noopener noreferrer"
            className="ei-button-dusk min-h-12 justify-center"
          >
            <Instagram aria-hidden="true" className="h-5 w-5" />
            <span>{PARENTS_CLOSE.igCta}</span>
          </a>
          <a
            href={CONTACT.lineHref}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-emerald-300/30 bg-emerald-400/10 px-8 font-bai-jamjuree text-sm font-semibold text-emerald-100 transition-colors hover:border-emerald-200/60 hover:bg-emerald-400/15"
          >
            <MessageCircle aria-hidden="true" className="h-5 w-5" />
            <span>{PARENTS_CLOSE.lineCta}</span>
          </a>
          <a
            href={`mailto:${PARENTS_EMAIL}`}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-8 font-bai-jamjuree text-sm font-semibold text-slate-200 transition-colors hover:border-blue-300/40 hover:text-white"
          >
            <Mail aria-hidden="true" className="h-5 w-5" />
            <span>{PARENTS_CLOSE.emailCta}</span>
          </a>
        </div>

        <ParentsNote tilt="pathlab-note--tilt-r-sm" align="center">
          {PARENTS_CLOSE.note}
        </ParentsNote>

        <Link
          href="/pathlab"
          className="mt-8 inline-flex min-h-11 items-center gap-2 font-bai-jamjuree text-sm font-semibold text-slate-300 transition-colors hover:text-white"
        >
          {PARENTS_CLOSE.studentLink}
          <ArrowRight aria-hidden="true" className="h-4 w-4" />
        </Link>
      </div>
    </section>
  );
}
