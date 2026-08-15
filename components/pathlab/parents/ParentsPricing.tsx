import { Instagram, MessageCircle } from "lucide-react";

import { CONTACT } from "@/lib/content/pathlab-page";
import { PARENTS_PRICE } from "@/lib/content/pathlab-parents";
import { ParentsNote, ParentsSection, SectionHeading } from "./section";

/**
 * Both ways to pay, side by side, with the round mechanics underneath. The
 * free Micro Pathlab tier is deliberately absent: it is a hook for the
 * student, and on this page it only muddies the one number a parent is here
 * to check.
 */
export function ParentsPricing() {
  return (
    <ParentsSection
      id="parents-price"
      labelledBy="parents-price-heading"
      className="scroll-mt-24"
    >
      <SectionHeading
        id="parents-price-heading"
        eyebrow={PARENTS_PRICE.eyebrow}
        title={PARENTS_PRICE.title}
        align="center"
      />

      <ul className="mx-auto mt-10 grid max-w-3xl gap-4 sm:grid-cols-2">
        {PARENTS_PRICE.tiers.map((tier) => (
          <li
            key={tier.label}
            className={`ei-card ei-card--static p-7 text-center ${
              tier.featured ? "ring-1 ring-amber-200/40" : ""
            }`}
          >
            <p className="font-space-mono text-xs uppercase tracking-[0.18em] text-blue-200/80">
              {tier.label}
            </p>
            <p className="mt-4 font-kodchasan text-5xl font-medium text-amber-200">
              {tier.amount}
              <span className="ml-1 text-2xl">฿</span>
            </p>
            <p className="mt-3 font-bai-jamjuree text-sm text-slate-400">
              {tier.unit}
            </p>
            <p className="mt-4 font-bai-jamjuree text-sm leading-7 text-slate-300">
              {tier.blurb}
            </p>
          </li>
        ))}
      </ul>

      <ul className="mx-auto mt-8 max-w-3xl space-y-2">
        {PARENTS_PRICE.notes.map((note) => (
          <li
            key={note}
            className="font-bai-jamjuree text-sm leading-7 text-slate-400"
          >
            {note}
          </li>
        ))}
      </ul>

      <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
        <a
          href={CONTACT.href}
          target="_blank"
          rel="noopener noreferrer"
          className="ei-button-dusk min-h-12 justify-center"
        >
          <Instagram aria-hidden="true" className="h-5 w-5" />
          <span>จองรอบผ่าน Instagram</span>
        </a>
        <a
          href={CONTACT.lineHref}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-emerald-300/30 bg-emerald-400/10 px-8 font-bai-jamjuree text-sm font-semibold text-emerald-100 transition-colors hover:border-emerald-200/60 hover:bg-emerald-400/15"
        >
          <MessageCircle aria-hidden="true" className="h-5 w-5" />
          <span>ทัก {CONTACT.lineLabel}</span>
        </a>
      </div>

      <ParentsNote tilt="pathlab-note--tilt-l-sm" align="center">
        {PARENTS_PRICE.note}
      </ParentsNote>
    </ParentsSection>
  );
}
