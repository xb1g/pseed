"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { HERO, HERO_CARDS } from "@/lib/content/pathlab-page";

/** Per-character cadence. The title is slower so it reads as deliberate. */
const TITLE_CHAR_MS = 90;
const SUBTITLE_CHAR_MS = 22;

const TITLE = HERO.title;
const SUBTITLE = HERO.subtitleLines.join("\n");

function Caret() {
  return <span className="pathlab-caret" aria-hidden="true" />;
}

/**
 * Hero: title and Thai subtitle on the left, a fan of three angled cards on
 * the right. On narrow screens the fan drops below the copy and shrinks rather
 * than being hidden, since the imagery is what says "these are real fields of
 * work".
 *
 * The intro types itself and holds page scroll until it finishes, matching
 * /talent. Reduced motion skips straight to the finished state and never locks
 * scroll, so the animation is never a barrier to reading the page.
 */
export function PathlabHero() {
  const [titleLen, setTitleLen] = useState(0);
  const [subLen, setSubLen] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setTitleLen(TITLE.length);
      setSubLen(SUBTITLE.length);
      setDone(true);
      return;
    }

    const timers: ReturnType<typeof setTimeout>[] = [];
    const titleDoneAt = 250 + TITLE.length * TITLE_CHAR_MS;
    const subDoneAt = titleDoneAt + 350 + SUBTITLE.length * SUBTITLE_CHAR_MS;

    for (let i = 1; i <= TITLE.length; i++) {
      timers.push(setTimeout(() => setTitleLen(i), 250 + i * TITLE_CHAR_MS));
    }
    for (let i = 1; i <= SUBTITLE.length; i++) {
      timers.push(
        setTimeout(() => setSubLen(i), titleDoneAt + 350 + i * SUBTITLE_CHAR_MS)
      );
    }
    timers.push(setTimeout(() => setDone(true), subDoneAt + 150));

    return () => timers.forEach(clearTimeout);
  }, []);

  // Hold scroll until the intro finishes. The cleanup restores whatever was
  // there before rather than assuming "visible", so this cannot strand the
  // page unscrollable if another component also sets overflow.
  useEffect(() => {
    if (done) return;

    const html = document.documentElement;
    const prevHtml = html.style.overflow;
    const prevBody = document.body.style.overflow;
    html.style.overflow = "hidden";
    document.body.style.overflow = "hidden";

    return () => {
      html.style.overflow = prevHtml;
      document.body.style.overflow = prevBody;
    };
  }, [done]);

  const titleDone = titleLen === TITLE.length;
  const typedSubtitle = SUBTITLE.slice(0, subLen).split("\n");

  return (
    <section className="pathlab-hero">
      <div className="pathlab-hero__inner">
        <div className="pathlab-hero__copy">
          {/* The invisible copy reserves the final layout, so nothing below
              shifts as characters land. */}
          <h1 className="pathlab-hero__title" aria-label={TITLE}>
            <span aria-hidden="true" className="invisible">
              {TITLE}
            </span>
            <span aria-hidden="true" className="pathlab-hero__typed">
              {TITLE.slice(0, titleLen)}
              {!titleDone && <Caret />}
            </span>
          </h1>

          <div className="pathlab-hero__sub-wrap" aria-label={SUBTITLE}>
            <div aria-hidden="true" className="invisible">
              {HERO.subtitleLines.map((line) => (
                <p key={line} className="pathlab-hero__subtitle">
                  {line}
                </p>
              ))}
            </div>
            <div aria-hidden="true" className="pathlab-hero__typed">
              {typedSubtitle.map((line, i) => (
                <p key={i} className="pathlab-hero__subtitle">
                  {line}
                  {titleDone && i === typedSubtitle.length - 1 && !done && (
                    <Caret />
                  )}
                </p>
              ))}
            </div>
          </div>
        </div>

        <div className={`pathlab-fan${done ? " is-ready" : ""}`}>
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

      {/* The cue only appears once scrolling is actually possible. */}
      <div
        className={`pathlab-scroll-cue${done ? " is-ready" : ""}`}
        aria-hidden={!done}
      >
        <span>{HERO.scrollCue}</span>
        <span className="pathlab-scroll-cue__line" aria-hidden="true" />
      </div>
    </section>
  );
}
