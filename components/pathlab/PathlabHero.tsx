"use client";

import Image from "next/image";
import { HERO, HERO_CARDS } from "@/lib/content/pathlab-page";

/**
 * Hero: title and Thai subtitle on the left, a fan of three angled cards on
 * the right. On narrow screens the fan drops below the copy and shrinks
 * rather than being hidden, since the imagery is what says "these are real
 * fields of work".
 */
export function PathlabHero() {
  return (
    <section className="pathlab-hero">
      <div className="pathlab-hero__inner">
        <div className="pathlab-hero__copy">
          <h1 className="pathlab-hero__title">{HERO.title}</h1>
          {HERO.subtitleLines.map((line) => (
            <p key={line} className="pathlab-hero__subtitle">
              {line}
            </p>
          ))}
        </div>

        <div className="pathlab-fan" aria-hidden="false">
          {HERO_CARDS.map((card, i) => (
            <figure
              key={card.src}
              className={`pathlab-fan__card pathlab-fan__card--${card.variant}`}
            >
              <Image
                src={card.src}
                alt={card.alt}
                fill
                sizes="(max-width: 768px) 42vw, 15rem"
                className="object-cover"
                priority={i === 2}
              />
            </figure>
          ))}
        </div>
      </div>

      <div className="pathlab-scroll-cue">
        <span>{HERO.scrollCue}</span>
        <span className="pathlab-scroll-cue__line" aria-hidden="true" />
      </div>
    </section>
  );
}
