import Image from "next/image";
import { ArrowRight, Instagram, MessageCircle } from "lucide-react";

import { CONTACT, JOURNEY } from "@/lib/content/pathlab-page";
import { PARENTS_HERO } from "@/lib/content/pathlab-parents";

/**
 * First screen. A parent decides here whether to keep reading, so the four
 * facts they would otherwise scroll for (length, supervision, prerequisites,
 * price) sit above the fold as a strip under the CTAs.
 */
export function ParentsHero() {
  return (
    <section
      data-parents-hero
      className="mx-auto grid w-full max-w-6xl items-center gap-12 px-5 pb-16 pt-10 sm:px-8 lg:grid-cols-[minmax(0,0.95fr)_minmax(26rem,1.05fr)] lg:gap-16 lg:py-20"
    >
      <div className="max-w-xl">
        <p className="dawn-eyebrow">{PARENTS_HERO.eyebrow}</p>
        <h1 className="mt-5 font-kodchasan text-4xl font-medium leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl">
          {PARENTS_HERO.title}
        </h1>
        <div className="dawn-rule mt-7" aria-hidden="true" />
        <p className="mt-7 max-w-lg font-bai-jamjuree text-base leading-8 text-slate-300 sm:text-lg">
          {PARENTS_HERO.lead}
        </p>

        <div className="mt-9 flex flex-col items-start gap-3 sm:flex-row sm:items-center">
          <a
            href={CONTACT.href}
            target="_blank"
            rel="noopener noreferrer"
            className="ei-button-dusk min-h-12 w-full justify-center sm:w-auto"
          >
            <Instagram aria-hidden="true" className="h-5 w-5" />
            <span>{PARENTS_HERO.primaryCta}</span>
          </a>
          <a
            href={CONTACT.lineHref}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-emerald-300/30 bg-emerald-400/10 px-6 font-bai-jamjuree text-sm font-semibold text-emerald-100 transition-colors hover:border-emerald-200/60 hover:bg-emerald-400/15 sm:w-auto"
          >
            <MessageCircle aria-hidden="true" className="h-5 w-5" />
            <span>{CONTACT.lineLabel}</span>
          </a>
          <a
            href="#parents-summary"
            className="inline-flex min-h-12 items-center gap-2 px-1 font-bai-jamjuree text-sm font-semibold text-slate-300 transition-colors hover:text-white"
          >
            {PARENTS_HERO.secondaryCta}
            <ArrowRight aria-hidden="true" className="h-4 w-4" />
          </a>
        </div>

        <p className="mt-7">
          <span className="pathlab-note">{PARENTS_HERO.note}</span>
        </p>

        <dl className="mt-8 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/10 sm:grid-cols-4">
          {PARENTS_HERO.facts.map((fact) => (
            <div key={fact.label} className="bg-slate-950/70 px-4 py-4">
              <dt className="font-space-mono text-[0.65rem] uppercase tracking-[0.18em] text-blue-200/70">
                {fact.label}
              </dt>
              <dd className="mt-2 font-bai-jamjuree text-sm font-semibold leading-6 text-white">
                {fact.value}
              </dd>
            </div>
          ))}
        </dl>
      </div>

      <figure className="relative overflow-hidden rounded-[1.75rem] border border-blue-200/20 bg-slate-950/60 p-2 shadow-2xl shadow-blue-950/30 backdrop-blur-xl">
        <div className="relative aspect-[1.5/1] overflow-hidden rounded-[1.35rem]">
          <Image
            src={JOURNEY.src}
            alt={JOURNEY.alt}
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 560px"
            className="object-cover"
          />
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-transparent to-blue-950/10"
          />
          <figcaption className="absolute inset-x-0 bottom-0 p-5 font-bai-jamjuree text-sm leading-6 text-slate-200 sm:p-6">
            {PARENTS_HERO.caption}
          </figcaption>
        </div>
      </figure>
    </section>
  );
}
