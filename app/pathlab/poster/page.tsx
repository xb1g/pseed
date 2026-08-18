import type { Metadata } from "next";
import Link from "next/link";
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

/**
 * Computes the percent discount between the original and the promo price so
 * the "ลด 57%" chip can never drift away from the actual numbers. Returns
 * null when the inputs are missing or malformed, so the chip disappears
 * rather than printing a lie like "ลด NaN%".
 */
function discountPercent(
  original: string | undefined,
  promo: string | undefined,
): number | null {
  if (!original || !promo) return null;
  const o = Number(original);
  const p = Number(promo);
  if (!Number.isFinite(o) || !Number.isFinite(p) || o <= 0 || p <= 0)
    return null;
  if (p >= o) return null;
  return Math.round(((o - p) / o) * 100);
}

/**
 * A tiny check chip rendered inline before each perk. Green was picked so
 * the ✓ reads as "included", distinct from the orange wordmarks; the same
 * green also lives in the field labels' tape so the whole sheet has two
 * accents, never three.
 */
function CheckMark() {
  return (
    <span className="pathlab-poster__check" aria-hidden="true">
      <svg viewBox="0 0 16 16" focusable="false">
        <path
          d="M3.5 8.4 6.6 11.5 12.5 4.8"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}

export default function PathlabPosterPage() {
  /* The poster sells paid rounds only, so the free Micro Pathlab tier stays
     on the website. */
  const posterPrices = PRICE_TIERS.filter(
    (tier): tier is PriceTier & { tone: "solo" | "featured" | "group" } =>
      tier.tone !== "free",
  );

  /* Picked by label so a renamed field in FIELDS shows up here too rather
     than forking the name. */
  const posterFields = POSTER.fieldLabels
    .map((label) => FIELDS.find((f) => f.label === label))
    .filter((f) => f !== undefined);

  /* The featured "Pathlab รอบเต็ม" tier carries the price block, the perks
     and the discount. If there is ever no featured tier, the block falls
     back to the first paid tier so the sheet never ends without a price. */
  const featured =
    posterPrices.find((tier) => tier.tone === "featured") ?? posterPrices[0];

  /* The discount lives next to the original/promo pair so it can never be
     printed without both numbers above it. */
  const discount = featured
    ? discountPercent(featured.originalAmount, featured.amount)
    : null;

  return (
    <main className="pathlab-poster-stage">
      <nav className="pathlab-ig-nav" aria-label="เลือกรูปแบบโปสเตอร์">
        <span className="pathlab-ig-nav__tab pathlab-ig-nav__tab--active">
          A4 Print
        </span>
        <span className="pathlab-ig-nav__divider" aria-hidden="true" />
        <Link href="/pathlab/poster/how-we-learn" className="pathlab-ig-nav__link">
          How We Learn
        </Link>
        <Link href="/pathlab/poster/instagram" className="pathlab-ig-nav__link">
          Instagram (4:5 · 1:1 · 9:16)
        </Link>
        <Link href="/pathlab/poster/social" className="pathlab-ig-nav__link">
          Social Card (1200×630)
        </Link>
      </nav>

      <article
        id="pathlab-poster-sheet"
        className="pathlab-poster"
        aria-label="โปสเตอร์ Pathlab"
      >
        <section className="pathlab-poster__hero">
          {/* Logo sits next to the big "Pathlab" wordmark so the title is
              the brand — the word carries the room, the logo confirms it.
              The plain <img> keeps the html-to-image export reliable. */}
          <div className="pathlab-poster__lockup">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/passion-seed-logo.png"
              alt="Passion Seed"
              className="pathlab-poster__lockup-logo"
            />
            <h1 className="pathlab-poster__title">{HERO.title}</h1>
          </div>
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

        {featured ? (
          <section className="pathlab-poster__deal">
            <div className="pathlab-poster__deal-head">
              <h2 className="pathlab-poster__deal-title">{featured.label}</h2>
              {featured.chip ? (
                <span className="pathlab-poster__deal-chip">{featured.chip}</span>
              ) : null}
            </div>

            {/* Price on the left, benefits on the right: the money question
                and the value answer sit side by side, separated by a dashed
                rule, instead of stacking into one tall wall. */}
            <div className="pathlab-poster__deal-body">
              <div className="pathlab-poster__deal-main">
                <div className="pathlab-poster__deal-price">
                  {featured.originalAmount ? (
                    <span className="pathlab-poster__deal-original">
                      <span className="pathlab-poster__deal-currency">
                        {featured.currency}
                      </span>
                      {featured.originalAmount}
                    </span>
                  ) : null}
                  <span
                    className="pathlab-poster__deal-arrow"
                    aria-hidden="true"
                  >
                    →
                  </span>
                  <span className="pathlab-poster__deal-promo">
                    <span className="pathlab-poster__deal-currency">
                      {featured.currency}
                    </span>
                    {featured.amount}
                  </span>
                </div>

                {discount !== null ? (
                  <span className="pathlab-poster__deal-discount">
                    ลด {discount}%
                  </span>
                ) : null}

                <p className="pathlab-poster__deal-unit">{featured.unit}</p>

                {featured.blurb ? (
                  <p className="pathlab-poster__deal-blurb">
                    {featured.blurb}
                  </p>
                ) : null}
              </div>

              {featured.perks && featured.perks.length > 0 ? (
                <ul className="pathlab-poster__perks">
                  {featured.perks.map((perk) => (
                    <li key={perk} className="pathlab-poster__perk">
                      <CheckMark />
                      <span>{perk}</span>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          </section>
        ) : null}
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
