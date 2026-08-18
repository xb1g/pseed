import type { Metadata } from "next";
import {
  HERO,
  NOTES,
  POSTER,
  OFFER_CARDS,
  FIELDS,
  PRICE_TIERS,
  type PriceTier,
} from "@/lib/content/pathlab-page";
import { SocialCardDownload } from "@/components/pathlab/SocialCardDownload";

export const metadata: Metadata = {
  title: "Pathlab Poster — Passion Seed",
  /** A print artifact, not a landing page — keep it out of search results. */
  robots: { index: false, follow: false },
};

/**
 * A4 promotional poster for Pathlab. A print artifact with its own curated
 * copy (POSTER in lib/content/pathlab-page.ts): real round dates and
 * hand-picked comments. Amounts and field labels still come from the shared
 * data so the numbers never drift from the site.
 *
 * The sheet should read like a senior jotted on it, not a grid of boxes:
 * marker highlights and small casual tilts (.pathlab-note) do the talking.
 * One note per section, never more.
 *
 * Server component: a poster has nothing to hydrate, and the print path must
 * not depend on client JS.
 */

/* Four fields, four tilts: each marker swipe sits at its own angle so the
   row looks highlighted by hand, not stamped from a mould. "" keeps the base
   .pathlab-note tilt. */
const FIELD_TILTS = [
  "",
  "pathlab-note--tilt-r",
  "pathlab-note--tilt-l-sm",
  "pathlab-note--tilt-r-sm",
] as const;

/** A four-point sparkle tossed into the quiet corners of the sheet. Purely
    decorative, so hidden from assistive tech. Position comes from the
    modifier class; the sheet is a fixed A4 canvas, so mm coordinates are
    deterministic. */
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

export default function PathlabPosterPage() {
  /* The poster sells paid rounds only, so the free Micro Pathlab tier stays
     on the website. */
  const posterPrices = PRICE_TIERS.filter(
    (tier): tier is PriceTier & { tone: "solo" | "group" } =>
      tier.tone !== "free",
  );

  /* Picked by label so a renamed field in FIELDS shows up here too rather
     than forking the name. */
  const posterFields = POSTER.fieldLabels
    .map((label) => FIELDS.find((f) => f.label === label))
    .filter((f) => f !== undefined);

  return (
    <main className="pathlab-poster-stage">
      <article
        id="pathlab-poster-sheet"
        className="pathlab-poster"
        aria-label="โปสเตอร์ Pathlab"
      >
        <header className="pathlab-poster__top">
          {/* plain img, not next/image: keeps html-to-image export reliable */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/passion-seed-logo.png"
            alt="Passion Seed"
            className="pathlab-poster__logo"
          />
        </header>

        <section className="pathlab-poster__hero">
          <h1 className="pathlab-poster__title">{HERO.title}</h1>
          <p className="pathlab-poster__note">
            <span className="pathlab-note pathlab-note--tilt-r">
              {NOTES.hero}
            </span>
          </p>
          <h2 className="pathlab-poster__headline">{POSTER.headline}</h2>
          <p className="pathlab-poster__subline">{POSTER.subline}</p>
        </section>

        {/* The number-one worry, answered with a rubber stamp rather than a
            bullet point. */}
        <div className="pathlab-poster__stamp">
          <span>{POSTER.stamp}</span>
        </div>

        <Sparkle className="pathlab-poster__sparkle pathlab-poster__sparkle--hero-l" />
        <Sparkle className="pathlab-poster__sparkle pathlab-poster__sparkle--hero-r" />
        <Sparkle className="pathlab-poster__sparkle pathlab-poster__sparkle--fields-r" />
        <Sparkle className="pathlab-poster__sparkle pathlab-poster__sparkle--price-l" />

        <section className="pathlab-poster__offers">
          <ul className="pathlab-poster__offers-list">
            {OFFER_CARDS.map((card) => (
              <li key={card.title} className="pathlab-poster__offer">
                <h2 className="pathlab-poster__offer-title">{card.title}</h2>
                <p className="pathlab-poster__offer-body">{card.body}</p>
              </li>
            ))}
          </ul>
        </section>

        <section className="pathlab-poster__fields">
          <h2 className="pathlab-poster__fields-heading">สายที่เปิดตอนนี้</h2>
          <svg
            className="pathlab-poster__squiggle"
            viewBox="0 0 122 12"
            aria-hidden="true"
            focusable="false"
          >
            <path
              d="M3 8.5 Q 13 3.5, 23 7.5 T 43 7.5 T 63 7.5 T 83 7.5 T 103 7.5 T 119 7"
              fill="none"
              stroke="currentColor"
              strokeWidth="3.5"
              strokeLinecap="round"
            />
          </svg>
          <ul className="pathlab-poster__fields-list">
            {posterFields.map((field, i) => (
              <li key={field.label} className="pathlab-poster__field">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={field.src as string}
                  alt={field.alt ?? ""}
                  className="pathlab-poster__field-img"
                />
                <span
                  className={`pathlab-note ${FIELD_TILTS[i % FIELD_TILTS.length]}`}
                >
                  {field.label}
                </span>
              </li>
            ))}
          </ul>
          <p className="pathlab-poster__schedule">{POSTER.schedule}</p>
        </section>

        <section className="pathlab-poster__prices">
          <ul className="pathlab-poster__prices-list">
            {posterPrices.map((tier) => (
              <li
                key={tier.label}
                className={`pathlab-poster__price pathlab-poster__price--${tier.tone}`}
              >
                <span className="pathlab-poster__price-amount">
                  {tier.currency}
                  {tier.amount}
                </span>
                <span className="pathlab-poster__price-unit">
                  {POSTER.priceUnits[tier.tone]}
                </span>
              </li>
            ))}
          </ul>
          <p className="pathlab-poster__section-note">
            <span className="pathlab-note pathlab-note--tilt-r-sm">
              {POSTER.priceNote}
            </span>
          </p>
        </section>
      </article>

      {/* Captured at 2x so the A4 sheet is usable in print, not just on
          screen. Never inside the article, so it cannot leak into the PNG. */}
      <SocialCardDownload
        targetId="pathlab-poster-sheet"
        fileName="pathlab-poster-a4"
        scale={2}
        label="ดาวน์โหลด PNG (A4)"
      />
    </main>
  );
}
