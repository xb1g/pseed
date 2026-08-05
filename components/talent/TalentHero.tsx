"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { ArrowDown } from "lucide-react";

const TITLE = "/Talent";
const SUBTITLE = "Implement Student Passion in to your project";
const ACCENT = "Student Passion";
const ACCENT_START = SUBTITLE.indexOf(ACCENT);
const ACCENT_END = ACCENT_START + ACCENT.length;

const TITLE_CHAR_MS = 110;
const SUBTITLE_CHAR_MS = 35;

/** Real pieces from the Actual Work section — clicking any card jumps there. */
const FAN_CARDS = [
  {
    src: "/talent/student-drone.jpg",
    alt: "Quadcopter built by Nutt",
    caption: "Nutt · drone build",
    className: "talent-fan__card talent-fan__card--left",
  },
  {
    src: "/talent/student-video.jpg",
    alt: "Short-form video edited by Bing",
    caption: "Bing · reel edit",
    className: "talent-fan__card talent-fan__card--right",
  },
  {
    src: "/talent/work/gloya-chibi-dev.webp",
    alt: "Chibi developer mascot illustrated by Gloya",
    caption: "Gloya · mascot art",
    className: "talent-fan__card talent-fan__card--front",
  },
] as const;

function Caret() {
  return <span className="talent-caret" aria-hidden="true" />;
}

/** Typed subtitle preserving the red "Student Passion" accent. */
function TypedSubtitle({ length }: { length: number }) {
  const typed = SUBTITLE.slice(0, length);
  const before = typed.slice(0, Math.min(typed.length, ACCENT_START));
  const accent = typed.slice(ACCENT_START, Math.min(typed.length, ACCENT_END));
  const after = typed.length > ACCENT_END ? typed.slice(ACCENT_END) : "";

  return (
    <>
      {before}
      <span className="talent-hero__accent">{accent}</span>
      {after}
    </>
  );
}

export function TalentHero() {
  const [titleLen, setTitleLen] = useState(0);
  const [subLen, setSubLen] = useState(0);
  const [showRest, setShowRest] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setTitleLen(TITLE.length);
      setSubLen(SUBTITLE.length);
      setShowRest(true);
      return;
    }

    const timers: ReturnType<typeof setTimeout>[] = [];
    const titleDoneAt = 300 + TITLE.length * TITLE_CHAR_MS;
    const subDoneAt = titleDoneAt + 450 + SUBTITLE.length * SUBTITLE_CHAR_MS;

    for (let i = 1; i <= TITLE.length; i++) {
      timers.push(setTimeout(() => setTitleLen(i), 300 + i * TITLE_CHAR_MS));
    }
    for (let i = 1; i <= SUBTITLE.length; i++) {
      timers.push(
        setTimeout(() => setSubLen(i), titleDoneAt + 450 + i * SUBTITLE_CHAR_MS),
      );
    }
    timers.push(setTimeout(() => setShowRest(true), subDoneAt + 500));

    return () => timers.forEach(clearTimeout);
  }, []);

  // Lock page scroll while the intro animation is still playing.
  useEffect(() => {
    if (showRest) return;

    const html = document.documentElement;
    const prevHtmlOverflow = html.style.overflow;
    const prevBodyOverflow = document.body.style.overflow;
    html.style.overflow = "hidden";
    document.body.style.overflow = "hidden";

    return () => {
      html.style.overflow = prevHtmlOverflow;
      document.body.style.overflow = prevBodyOverflow;
    };
  }, [showRest]);

  const titleDone = titleLen === TITLE.length;
  const subDone = subLen === SUBTITLE.length;

  return (
    <div className="talent-hero relative flex min-h-[calc(100svh-3.4rem)] flex-col justify-center overflow-hidden">
      <div className="relative z-10 mx-auto grid w-full max-w-7xl grid-cols-1 items-center gap-12 px-4 py-16 sm:px-6 md:grid-cols-2 lg:px-8">
        {/* Left — typed headline */}
        <div>
          <h1 className="talent-hero__title relative font-radar-title" aria-label={TITLE}>
            {/* Invisible full text reserves layout space while typing */}
            <span aria-hidden="true" className="invisible">
              {TITLE}
            </span>
            <span aria-hidden="true" className="absolute inset-0">
              {TITLE.slice(0, titleLen)}
              {!titleDone && <Caret />}
            </span>
          </h1>
          <p
            className="talent-hero__subtitle relative"
            aria-label={SUBTITLE}
          >
            <span aria-hidden="true" className="invisible">
              {SUBTITLE}
            </span>
            <span aria-hidden="true" className="absolute inset-0">
              <TypedSubtitle length={subLen} />
              {titleDone && !subDone && <Caret />}
            </span>
          </p>
        </div>

        {/* Right — fanned example work, fades in after typing */}
        <div
          className={`flex flex-col items-center gap-6 transition-all duration-1000 ease-out ${
            showRest ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-4 opacity-0"
          }`}
        >
          <div className="talent-fan">
            {FAN_CARDS.map((card) => (
              <a
                key={card.src}
                href="#actual-work"
                className={card.className}
                aria-label={`${card.caption} — jump to Actual Work`}
              >
                <Image
                  src={card.src}
                  alt={card.alt}
                  fill
                  sizes="(max-width: 768px) 45vw, 240px"
                  className="object-cover"
                />
              </a>
            ))}
          </div>
          <a href="#actual-work" className="talent-fan__cta">
            <p className="talent-fan__label">View student work</p>
            <p className="talent-fan__hint">
              Real, shipped pieces — tap any card
            </p>
          </a>
        </div>
      </div>

      {/* Scroll cue */}
      <div
        className={`talent-scroll-cue transition-opacity duration-1000 ${
          showRest ? "opacity-100" : "opacity-0"
        }`}
        aria-hidden="true"
      >
        <span>[Scroll down]</span>
        <ArrowDown className="talent-scroll-cue__arrow h-7 w-7" strokeWidth={2.25} />
      </div>
    </div>
  );
}
