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
import { PosterScaler } from "@/components/plans/PosterScaler";
import { SocialCardDownload } from "@/components/pathlab/SocialCardDownload";

export const metadata: Metadata = {
  title: "Pathlab Social Card — Passion Seed",
  /** A shareable graphic tool, not a landing page — keep it out of search. */
  robots: { index: false, follow: false },
};

/**
 * The 1200×630 social-card sibling of /pathlab/poster: same copy, palette and
 * handmade decorations, recomposed for a landscape share format. Built for
 * export — the card is a fixed 1200×630 canvas and the download button
 * captures it at exactly that size.
 *
 * Server component: the card itself has nothing to hydrate. Only the
 * download button is a client component.
 */

/* Same four-tilt rotation set as the poster, so a field label never looks
   stamped from a mould. "" keeps the base .pathlab-note tilt. */
const FIELD_TILTS = [
  "",
  "pathlab-note--tilt-r",
  "pathlab-note--tilt-l-sm",
  "pathlab-note--tilt-r-sm",
] as const;

/** A wobbly marker arrow that curls up toward the group deal, drawn in the
    same hand as the frame and the tape. Decorative only. */
function DealArrow({ className }: { className: string }) {
  return (
    <svg
      viewBox="0 0 64 48"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M14 45c9.5-2.6 17.4-8.4 22.6-17.4 4.4-7.6 11.9-15 22.4-23.6"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      <path
        d="M48.6 5.2 59.4 4 57.6 14.8"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** A four-point sparkle tossed into the quiet corners of the card. Purely
    decorative, so hidden from assistive tech. */
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

export default function PathlabSocialCardPage() {
  /* The card sells paid rounds only, so the free Micro Pathlab tier stays on
     the website. */
  const cardPrices = PRICE_TIERS.filter(
    (tier): tier is PriceTier & { tone: "solo" | "group" } =>
      tier.tone !== "free",
  );

  /* The schedule stacks into three lines: "เจอกัน" as a quiet lead-in, the
     dates set large as the thing to catch, and the times quiet again beneath.
     The shared POSTER.schedule string stays one line for the A4 poster. */
  const [scheduleLead, ...scheduleRest] = POSTER.schedule.split(" ");
  const [scheduleDates, scheduleTime] = scheduleRest
    .join(" ")
    .split("·")
    .map((part) => part.trim());

  /* Same four promoted fields as the poster, matched by label. */
  const cardFields = POSTER.fieldLabels
    .map((label) => FIELDS.find((f) => f.label === label))
    .filter((f) => f !== undefined);

  return (
    <main className="pathlab-social-stage">
      <nav className="pathlab-ig-nav" aria-label="เลือกรูปแบบโปสเตอร์">
        <span className="pathlab-ig-nav__tab pathlab-ig-nav__tab--active">
          Social Card (1200×630)
        </span>
        <span className="pathlab-ig-nav__divider" aria-hidden="true" />
        <Link href="/pathlab/poster/how-we-learn" className="pathlab-ig-nav__link">
          How We Learn
        </Link>
        <Link href="/pathlab/poster/teachers" className="pathlab-ig-nav__link">
          Who Teaches
        </Link>
        <Link href="/pathlab/poster/instagram" className="pathlab-ig-nav__link">
          Instagram (4:5 · 1:1 · 9:16)
        </Link>
        <Link href="/pathlab/poster/instagram-hero" className="pathlab-ig-nav__link">
          IG Hero (10x)
        </Link>
        <Link href="/pathlab/poster" className="pathlab-ig-nav__link">
          A4 Print
        </Link>
        <Link href="/pathlab/poster/certificate" className="pathlab-ig-nav__link">
          Certificate
        </Link>
      </nav>

      <PosterScaler designWidth={1200} className="pathlab-social-scaler">
        <article
          id="pathlab-social-card"
          className="pathlab-social"
          aria-label="การ์ดแชร์ Pathlab ขนาด 1200x630"
        >
          {/* plain img, not next/image: keeps html-to-image export reliable */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/passion-seed-logo.png"
            alt="Passion Seed"
            className="pathlab-social__logo"
          />

          <div className="pathlab-social__stamp">
            <span>{POSTER.stamp}</span>
          </div>

          <Sparkle className="pathlab-social__sparkle pathlab-social__sparkle--hero-l" />
          <Sparkle className="pathlab-social__sparkle pathlab-social__sparkle--hero-r" />
          <Sparkle className="pathlab-social__sparkle pathlab-social__sparkle--price-r" />

          <div className="pathlab-social__content">
            <section className="pathlab-social__paths" aria-label="สายที่เปิดตอนนี้">
              <p className="pathlab-social__paths-heading">สายที่เปิดตอนนี้</p>
              <ul className="pathlab-social__fields">
                {cardFields.map((field, i) => (
                  <li key={field.label} className="pathlab-social__field">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={field.src as string}
                      alt={field.alt ?? ""}
                      className="pathlab-social__field-img"
                    />
                    <span
                      className={`pathlab-note ${FIELD_TILTS[i % FIELD_TILTS.length]}`}
                    >
                      {field.label}
                    </span>
                  </li>
                ))}
              </ul>
            </section>

            <section className="pathlab-social__details">
              <div className="pathlab-social__hero">
                <h1 className="pathlab-social__title">{HERO.title}</h1>
                <p className="pathlab-social__note">
                  <span className="pathlab-note pathlab-note--tilt-r">
                    {NOTES.hero}
                  </span>
                </p>
                <h2 className="pathlab-social__headline">{POSTER.headline}</h2>
                <p className="pathlab-social__subline">{POSTER.subline}</p>
              </div>

              <ul className="pathlab-social__offers">
                {OFFER_CARDS.map((card) => (
                  <li key={card.title} className="pathlab-social__offer">
                    <h3>{card.title}</h3>
                    <p>{card.body}</p>
                  </li>
                ))}
              </ul>

              <div className="pathlab-social__booking">
                <DealArrow className="pathlab-social__deal-arrow" />
                <p className="pathlab-social__schedule pathlab-social__booking-col">
                  <span className="pathlab-social__schedule-lead">
                    {scheduleLead}
                  </span>
                  <span className="pathlab-social__schedule-dates">
                    {scheduleDates}
                  </span>
                  <span className="pathlab-social__schedule-time">
                    {scheduleTime}
                  </span>
                </p>
                {/* Prices and their note travel together, so the whole group
                    can sit on one row with the schedule. */}
                <div className="pathlab-social__booking-col">
                  <ul className="pathlab-social__prices">
                    {cardPrices.map((tier) => (
                      <li
                        key={tier.label}
                        className={`pathlab-social__price pathlab-social__price--${tier.tone}`}
                      >
                        <span className="pathlab-social__price-amount">
                          {tier.currency}
                          {tier.amount}
                        </span>
                        <span className="pathlab-social__price-unit">
                          {POSTER.priceUnits[tier.tone]}
                        </span>
                      </li>
                    ))}
                  </ul>
                  <p className="pathlab-social__price-note">
                    <span className="pathlab-note pathlab-note--tilt-r-sm">
                      {POSTER.priceNote}
                    </span>
                  </p>
                </div>
              </div>
            </section>
          </div>
        </article>
      </PosterScaler>

      <SocialCardDownload
        targetId="pathlab-social-card"
        fileName="pathlab-social-1200x630"
        width={1200}
        height={630}
        label="ดาวน์โหลด PNG (1200×630)"
      />
    </main>
  );
}
