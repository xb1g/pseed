"use client";

import { useState } from "react";
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
    fileName: "pathlab-instagram-feed-1080x1350",
    cardClass: "pathlab-ig-card--portrait",
  },
  square: {
    label: "IG Square 1:1 (1080×1080)",
    width: 1080,
    height: 1080,
    aspect: "1:1 Square",
    fileName: "pathlab-instagram-square-1080x1080",
    cardClass: "pathlab-ig-card--square",
  },
  story: {
    label: "IG Story 9:16 (1080×1920)",
    width: 1080,
    height: 1920,
    aspect: "9:16 Story",
    fileName: "pathlab-instagram-story-1080x1920",
    cardClass: "pathlab-ig-card--story",
  },
};

const FIELD_TILTS = [
  "",
  "pathlab-note--tilt-r",
  "pathlab-note--tilt-l-sm",
  "pathlab-note--tilt-r-sm",
] as const;

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

function CheckMark() {
  return (
    <span className="pathlab-ig__check" aria-hidden="true">
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

export function InstagramPosterClient() {
  const [format, setFormat] = useState<IgFormat>("portrait");
  const current = FORMATS[format];

  const posterPrices = PRICE_TIERS.filter(
    (tier): tier is PriceTier & { tone: "solo" | "featured" | "group" } =>
      tier.tone !== "free",
  );

  const posterFields = POSTER.fieldLabels
    .map((label) => FIELDS.find((f) => f.label === label))
    .filter((f) => f !== undefined);

  const featured =
    posterPrices.find((tier) => tier.tone === "featured") ?? posterPrices[0];

  const discount = featured
    ? discountPercent(featured.originalAmount, featured.amount)
    : null;

  return (
    <main className="pathlab-ig-stage">
      {/* Format Switcher Header */}
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

        <Link href="/pathlab/poster/how-we-learn" className="pathlab-ig-nav__link">
          How We Learn
        </Link>
        <Link href="/pathlab/poster" className="pathlab-ig-nav__link">
          A4 Print
        </Link>
        <Link href="/pathlab/poster/social" className="pathlab-ig-nav__link">
          1200×630
        </Link>
      </nav>

      {/* Canvas Wrapper */}
      <PosterScaler designWidth={1080} className="pathlab-ig-scaler">
        <article
          id="pathlab-instagram-poster"
          className={`pathlab-ig-card ${current.cardClass}`}
          aria-label={`โปสเตอร์ Pathlab สำหรับ Instagram (${current.aspect})`}
        >
          {/* Header section */}
          <section className="pathlab-ig__hero">
            <div className="pathlab-ig__lockup">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/passion-seed-logo.png"
                alt="Passion Seed"
                className="pathlab-ig__logo"
              />
              <h1 className="pathlab-ig__title">{HERO.title}</h1>
            </div>

            <p className="pathlab-ig__note">
              <span className="pathlab-note pathlab-note--tilt-r">
                {NOTES.hero}
              </span>
            </p>

            <h2 className="pathlab-ig__headline">{POSTER.headline}</h2>
            <p className="pathlab-ig__subline">{POSTER.subline}</p>
          </section>

          {/* Stamp Badge */}
          <div className="pathlab-ig__stamp">
            <span>{POSTER.stamp}</span>
          </div>

          {/* Sparkles */}
          <Sparkle className="pathlab-ig__sparkle pathlab-ig__sparkle--hero-l" />
          <Sparkle className="pathlab-ig__sparkle pathlab-ig__sparkle--hero-r" />
          <Sparkle className="pathlab-ig__sparkle pathlab-ig__sparkle--fields-r" />
          <Sparkle className="pathlab-ig__sparkle pathlab-ig__sparkle--price-l" />

          {/* Offers 3 Cards */}
          <section className="pathlab-ig__offers">
            <ul className="pathlab-ig__offers-list">
              {OFFER_CARDS.map((card) => (
                <li key={card.title} className="pathlab-ig__offer">
                  <h3 className="pathlab-ig__offer-title">{card.title}</h3>
                  <p className="pathlab-ig__offer-body">{card.body}</p>
                </li>
              ))}
            </ul>
          </section>

          {/* 4 Open Fields */}
          <section className="pathlab-ig__fields">
            <h2 className="pathlab-ig__fields-heading">สายที่เปิดตอนนี้</h2>
            <svg
              className="pathlab-ig__squiggle"
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

            <ul className="pathlab-ig__fields-list">
              {posterFields.map((field, i) => (
                <li key={field.label} className="pathlab-ig__field">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={field.src as string}
                    alt={field.alt ?? ""}
                    className="pathlab-ig__field-img"
                  />
                  <span
                    className={`pathlab-note ${FIELD_TILTS[i % FIELD_TILTS.length]}`}
                  >
                    {field.label}
                  </span>
                </li>
              ))}
            </ul>

            <p className="pathlab-ig__schedule">{POSTER.schedule}</p>
          </section>

          {/* Featured Deal Card */}
          {featured ? (
            <section className="pathlab-ig__deal">
              <div className="pathlab-ig__deal-head">
                <h2 className="pathlab-ig__deal-title">{featured.label}</h2>
                {featured.chip ? (
                  <span className="pathlab-ig__deal-chip">{featured.chip}</span>
                ) : null}
              </div>

              <div className="pathlab-ig__deal-body">
                <div className="pathlab-ig__deal-main">
                  <div className="pathlab-ig__deal-price">
                    {featured.originalAmount ? (
                      <span className="pathlab-ig__deal-original">
                        <span className="pathlab-ig__deal-currency">
                          {featured.currency}
                        </span>
                        {featured.originalAmount}
                      </span>
                    ) : null}
                    <span
                      className="pathlab-ig__deal-arrow"
                      aria-hidden="true"
                    >
                      →
                    </span>
                    <span className="pathlab-ig__deal-promo">
                      <span className="pathlab-ig__deal-currency">
                        {featured.currency}
                      </span>
                      {featured.amount}
                    </span>
                  </div>

                  {discount !== null ? (
                    <span className="pathlab-ig__deal-discount">
                      ลด {discount}%
                    </span>
                  ) : null}

                  <p className="pathlab-ig__deal-unit">{featured.unit}</p>

                  {featured.blurb ? (
                    <p className="pathlab-ig__deal-blurb">
                      {featured.blurb}
                    </p>
                  ) : null}
                </div>

                {featured.perks && featured.perks.length > 0 ? (
                  <ul className="pathlab-ig__perks">
                    {featured.perks.map((perk) => (
                      <li key={perk} className="pathlab-ig__perk">
                        <CheckMark />
                        <span>{perk}</span>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            </section>
          ) : null}

          {/* Footer Instagram CTA */}
          <footer className="pathlab-ig__footer">
            <span className="pathlab-ig__footer-handle">IG: @passion_seed.th</span>
            <span className="pathlab-ig__footer-cta">
              ทัก DM หรือ LINE OA เพื่อจองรอบและสอบถามเพิ่มเติม
            </span>
          </footer>
        </article>
      </PosterScaler>

      {/* Download Action */}
      <SocialCardDownload
        key={`${format}-${current.width}x${current.height}`}
        targetId="pathlab-instagram-poster"
        fileName={current.fileName}
        width={current.width}
        height={current.height}
        scale={1}
        label={`ดาวน์โหลด PNG (${current.width}×${current.height})`}
      />
    </main>
  );
}
