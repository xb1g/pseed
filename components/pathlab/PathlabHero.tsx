"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { HERO, HERO_CARDS, MICRO_PATHLAB, NOTES } from "@/lib/content/pathlab-page";

/**
 * Hero: title + Thai subtitle left, interactive fan of field cards right.
 *
 * Copy is in the HTML from first paint (no typewriter) so LCP is the real
 * title/subtitle. Brand mark lives in PathlabNav (home link), not here.
 * Fan cards tilt toward the pointer on hover-capable devices.
 */
export function PathlabHero() {
  const fanRef = useRef<HTMLDivElement | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setReady(true);
      return;
    }
    const id = requestAnimationFrame(() => {
      requestAnimationFrame(() => setReady(true));
    });
    return () => cancelAnimationFrame(id);
  }, []);

  useEffect(() => {
    const node = fanRef.current;
    if (!node) return;
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
      return;
    }
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    const onMove = (event: PointerEvent) => {
      const rect = node.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - 0.5;
      const y = (event.clientY - rect.top) / rect.height - 0.5;
      node.style.setProperty("--fan-x", x.toFixed(3));
      node.style.setProperty("--fan-y", y.toFixed(3));
    };

    const onLeave = () => {
      node.style.setProperty("--fan-x", "0");
      node.style.setProperty("--fan-y", "0");
    };

    node.addEventListener("pointermove", onMove);
    node.addEventListener("pointerleave", onLeave);
    return () => {
      node.removeEventListener("pointermove", onMove);
      node.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  return (
    <section className={`pathlab-hero${ready ? " is-ready" : ""}`}>
      <div className="pathlab-hero__inner">
        <div className="pathlab-hero__copy">
          <h1 className="pathlab-hero__title">{HERO.title}</h1>

          <div className="pathlab-hero__sub-wrap">
            {HERO.subtitleLines.map((line) => (
              <p key={line} className="pathlab-hero__subtitle">
                {line}
              </p>
            ))}
          </div>

          {/* Above the fold on every device: the two questions a visitor
              arrives with are "มีสายที่เราอยากเรียนไหม?" and "ลองก่อนได้ไหม?" */}
          <div className="pathlab-hero__ctas">
            <a
              className="pathlab-hero__cta pathlab-hero__cta--primary"
              href={HERO.ctas.primary.href}
            >
              {HERO.ctas.primary.label}
            </a>
            <a
              className="pathlab-hero__cta pathlab-hero__cta--secondary"
              href={MICRO_PATHLAB.mapHref ?? MICRO_PATHLAB.fallbackHref}
            >
              {HERO.ctas.secondary.label}
            </a>
          </div>

          {/* The quiet thing the value prop cannot say formally. */}
          <p className="pathlab-note-row pathlab-note-row--left">
            <span className="pathlab-note">{NOTES.hero}</span>
          </p>
        </div>

        <div
          ref={fanRef}
          className="pathlab-fan"
          style={{ ["--fan-x" as string]: "0", ["--fan-y" as string]: "0" }}
        >
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
              <figcaption className="pathlab-fan__label">{card.label}</figcaption>
            </figure>
          ))}
        </div>
      </div>

      <div className="pathlab-scroll-cue" aria-hidden="true">
        <span>{HERO.scrollCue}</span>
        <span className="pathlab-scroll-cue__line" />
      </div>
    </section>
  );
}
