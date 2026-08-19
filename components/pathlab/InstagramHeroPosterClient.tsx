"use client";

import { useState } from "react";
import Link from "next/link";
import { POSTER_HERO } from "@/lib/content/pathlab-page";
import { PosterScaler } from "@/components/plans/PosterScaler";
import { SocialCardDownload } from "@/components/pathlab/SocialCardDownload";

/**
 * IG Feed poster — the "Pathlab × Passion Seed" hero sheet.
 *
 * A 10x rebuild of the A4 markered poster, refitted for an Instagram feed
 * thumb-stop. Three formats share the same word bank (POSTER_HERO):
 *   • 4:5 portrait (1080×1350) — primary feed slot
 *   • 1:1 square (1080×1080)   — feed fallback
 *   • 9:16 story (1080×1920)   — story / reel cover
 *
 * The art direction is intentionally different from the A4 markered sheet:
 * the A4 sheet is paper-and-pen and reads at arm's length. The IG sheet
 * must read at thumb's length, so the headline is huge, the proof is one
 * short breath, and the alumni quotes are the warm-up to the CTA. The
 * paper feel stays as a corner stamp and a single margin note, not the
 * full sheet treatment.
 *
 * Dark stage with the same hand-markered frame so the existing poster nav
 * stays coherent. Server component would have been fine, but the download
 * button is a client component anyway, so the whole file ships as one.
 */

type IgFormat = "portrait" | "square" | "story";

interface FormatConfig {
  label: string;
  width: number;
  height: number;
  aspect: string;
  fileName: string;
  cardClass: string;
}

const FORMATS: Record<IgFormat, FormatConfig> = {
  portrait: {
    label: "IG Feed 4:5 (1080×1350)",
    width: 1080,
    height: 1350,
    aspect: "4:5 Portrait",
    fileName: "pathlab-ig-hero-feed-1080x1350",
    cardClass: "pathlab-ig-hero--portrait",
  },
  square: {
    label: "IG Square 1:1 (1080×1080)",
    width: 1080,
    height: 1080,
    aspect: "1:1 Square",
    fileName: "pathlab-ig-hero-square-1080x1080",
    cardClass: "pathlab-ig-hero--square",
  },
  story: {
    label: "IG Story 9:16 (1080×1920)",
    width: 1080,
    height: 1920,
    aspect: "9:16 Story",
    fileName: "pathlab-ig-hero-story-1080x1920",
    cardClass: "pathlab-ig-hero--story",
  },
};

/** A four-point sparkle, hand-drawn weight. Decorative only. */
function Sparkle({ className }: { className: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M12 1.5c.9 6.1 4 9.4 10.5 10.5-6.5 1.1-9.6 4.4-10.5 10.5-.9-6.1-4-9.4-10.5-10.5C8 10.9 11.1 7.6 12 1.5Z"
        fill="currentColor"
      />
    </svg>
  );
}

/** A rubber stamp seal in the top-right corner — same family as the A4
    poster, hand-pressed -9deg so it never looks machined. */
function Stamp({ children }: { children: React.ReactNode }) {
  return (
    <div className="pathlab-ig-hero__stamp" aria-hidden="true">
      <span>{children}</span>
    </div>
  );
}

export function InstagramHeroPosterClient() {
  const [format, setFormat] = useState<IgFormat>("portrait");
  const current = FORMATS[format];

  return (
    <main className="pathlab-ig-hero-stage">
      <nav className="pathlab-ig-nav" aria-label="เลือกขนาดโปสเตอร์สำหรับ Instagram">
        {(Object.keys(FORMATS) as IgFormat[]).map((f) => (
          <button
            key={f}
            type="button"
            className={`pathlab-ig-nav__tab ${
              format === f ? "pathlab-ig-nav__tab--active" : ""
            }`}
            onClick={() => setFormat(f)}
          >
            {FORMATS[f].label}
          </button>
        ))}

        <span className="pathlab-ig-nav__divider" aria-hidden="true" />

        <Link href="/pathlab/poster" className="pathlab-ig-nav__link">
          A4 Print
        </Link>
        <Link href="/pathlab/poster/how-we-learn" className="pathlab-ig-nav__link">
          How We Learn
        </Link>
        <Link
          href="/pathlab/poster/instagram"
          className="pathlab-ig-nav__link"
        >
          IG Poster
        </Link>
        <Link href="/pathlab/poster/social" className="pathlab-ig-nav__link">
          Social Card
        </Link>
      </nav>

      <PosterScaler designWidth={1080} className="pathlab-ig-hero-scaler">
        <article
          id="pathlab-ig-hero-poster"
          className={`pathlab-ig-hero ${current.cardClass}`}
          aria-label={`โปสเตอร์ Pathlab สำหรับ Instagram (${current.aspect})`}
        >
          <Stamp>{POSTER_HERO.stamp}</Stamp>

          <Sparkle className="pathlab-ig-hero__sparkle pathlab-ig-hero__sparkle--hero-l" />
          <Sparkle className="pathlab-ig-hero__sparkle pathlab-ig-hero__sparkle--hero-r" />
          <Sparkle className="pathlab-ig-hero__sparkle pathlab-ig-hero__sparkle--proof-r" />
          <Sparkle className="pathlab-ig-hero__sparkle pathlab-ig-hero__sparkle--cta-l" />

          <header className="pathlab-ig-hero__brand">
            <span className="pathlab-ig-hero__eyebrow">
              {POSTER_HERO.eyebrow}
            </span>
            <h1 className="pathlab-ig-hero__title">{POSTER_HERO.name}</h1>
            <p className="pathlab-ig-hero__promise">
              <span className="pathlab-ig-hero__promise-strong">
                {POSTER_HERO.promise}
              </span>
              <span className="pathlab-ig-hero__promise-soft">
                {POSTER_HERO.consequence}
              </span>
            </p>
          </header>

          <section className="pathlab-ig-hero__proof" aria-label="สิ่งที่จะได้">
            <ul className="pathlab-ig-hero__proof-list">
              {POSTER_HERO.proofLines.map((line, i) => (
                <li
                  key={line}
                  className={`pathlab-ig-hero__proof-item pathlab-ig-hero__proof-item--${i + 1}`}
                >
                  <span className="pathlab-ig-hero__proof-bullet" aria-hidden="true">
                    {i + 1}
                  </span>
                  <span className="pathlab-ig-hero__proof-text">{line}</span>
                </li>
              ))}
            </ul>
          </section>

          <section
            className="pathlab-ig-hero__alumni"
            aria-label="เสียงจากรุ่นพี่"
          >
            <p className="pathlab-ig-hero__alumni-eyebrow">
              รุ่นพี่ที่ผ่านไปแล้ว
            </p>
            <ul className="pathlab-ig-hero__alumni-list">
              {POSTER_HERO.alumni.map((q) => (
                <li key={q.ig} className="pathlab-ig-hero__alumni-item">
                  <p className="pathlab-ig-hero__alumni-quote">
                    “{q.quote}”
                  </p>
                  <p className="pathlab-ig-hero__alumni-ig">{q.ig}</p>
                </li>
              ))}
            </ul>
          </section>

          <section className="pathlab-ig-hero__schedule" aria-label="วันเรียน">
            <p className="pathlab-ig-hero__schedule-eyebrow">รอบถัดไป</p>
            <p className="pathlab-ig-hero__schedule-dates">
              {POSTER_HERO.schedule}
            </p>
          </section>

          <footer className="pathlab-ig-hero__cta">
            <p className="pathlab-ig-hero__cta-eyebrow">
              {POSTER_HERO.ctaEyebrow}
            </p>
            <p className="pathlab-ig-hero__cta-handle">
              {POSTER_HERO.ctaHandle}
            </p>
            <p className="pathlab-ig-hero__note">
              <span className="pathlab-note pathlab-note--tilt-r-sm">
                {POSTER_HERO.note}
              </span>
            </p>
          </footer>
        </article>
      </PosterScaler>

      <SocialCardDownload
        key={`${format}-${current.width}x${current.height}`}
        targetId="pathlab-ig-hero-poster"
        fileName={current.fileName}
        width={current.width}
        height={current.height}
        scale={1}
        label={`ดาวน์โหลด PNG (${current.width}×${current.height})`}
      />
    </main>
  );
}
