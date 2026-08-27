"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  FALLBACK_SPRITE,
  TRAIL_X_PCT,
  toTrailStops,
  trailPathD,
  type JourneyPreview,
} from "@/components/pathlab/journey-map-utils";
import { SocialCardDownload } from "@/components/pathlab/SocialCardDownload";
import {
  POSTER_MED,
  type PriceTier,
} from "@/lib/content/pathlab-page";

/**
 * Med A4 print sheet, "เรียนยังไง?" for the Med path.
 *
 * Centerpiece is the same zigzag island trail the main /pathlab page
 * uses under "Learning journey เป็นยังไง" — 5 island sprites in a
 * wandering dashed connector. Medical is still a "coming soon" path,
 * so the trail reuses the allowlisted demo map as a sample of how a
 * Med learner's journey will be laid out. Each island pairs with the
 * matching POSTER_MED day by index, so the island's title in the
 * canvas is the day's title.
 *
 * Numbers still come from PRICE_TIERS so the promo can't drift from
 * the site.
 *
 * Client component: the trail needs `fetch` and `useState`, and the
 * download button is a client component anyway.
 */

const DEMO_MAP_ID = "00000000-0000-0000-0000-000000000020";
const STOP_SPRITE_PX = 96;
/** A4-tuned trail row pitch: tighter than the live /pathlab page
 *  (160) so the five islands fit between the hero and the deal panel. */
const TRAIL_ROW_PX = 100;

/** One island in the trail: sprite + day title, matching the
 *  PathlabJourneyMap vocabulary exactly. */
function Island({
  xPct,
  row,
  spriteUrl,
  title,
  dayNumber,
}: {
  xPct: number;
  row: number;
  spriteUrl: string;
  title: string;
  dayNumber: number;
}) {
  return (
    <button
      type="button"
      className="pathlab-med-poster__stop"
      style={{
        left: `${xPct}%`,
        top: row * TRAIL_ROW_PX + (TRAIL_ROW_PX - STOP_SPRITE_PX) / 2,
      }}
      aria-label={`วันที่ ${dayNumber}: ${title}`}
    >
      <Image
        src={spriteUrl || FALLBACK_SPRITE}
        alt=""
        width={STOP_SPRITE_PX}
        height={STOP_SPRITE_PX}
        className="pathlab-med-poster__stop-sprite"
      />
      <span className="pathlab-med-poster__stop-chip">
        วันที่ {dayNumber}
      </span>
      <span className="pathlab-med-poster__stop-title">{title}</span>
    </button>
  );
}

interface MedPosterClientProps {
  featured: PriceTier | null;
  posterSchedule: string;
}

export function MedPosterClient({
  featured,
  posterSchedule,
}: MedPosterClientProps) {
  const [preview, setPreview] = useState<JourneyPreview | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/maps/public-preview/${DEMO_MAP_ID}`)
      .then((res) => {
        if (res.status === 404) return null;
        if (!res.ok) throw new Error(`preview ${res.status}`);
        return res.json();
      })
      .then((data: JourneyPreview | null) => {
        if (data && !cancelled) setPreview(data);
      })
      .catch((err) => {
        // Don't surface the error: the trail falls back to the 5-day
        // preview stops rendered from POSTER_MED below, so the print
        // sheet always shows islands regardless of fetch outcome.
        console.error("med poster preview failed:", err);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  /* The trail uses the same toTrailStops helper as PathlabJourneyMap so the
     islands shown on the print sheet match the live product. Each stop
     pairs with a day from POSTER_MED by index. When the live fetch
     returns nothing (404 in local dev, etc.), we fall back to a 5-row
     trail of the fallback sprite so the sheet always renders islands,
     never a static screenshot. */
  const stops = useMemo(
    () => (preview ? toTrailStops(preview) : []),
    [preview],
  );

  /* Fallback trail when the demo map can't be fetched: one island per
     Med day, cycling x position like the live zigzag. */
  const fallbackStops = useMemo(
    () =>
      POSTER_MED.days.map((day, i) => ({
        id: `fallback-${i}`,
        title: day.title,
        spriteUrl: FALLBACK_SPRITE,
        snippet: day.doing,
        xPct: TRAIL_X_PCT[i % TRAIL_X_PCT.length],
        row: i,
      })),
    [],
  );
  const displayStops = stops.length > 0 ? stops : fallbackStops;
  const displayPathD =
    displayStops.length > 0 ? trailPathD(displayStops) : "";

  const discount =
    featured && featured.originalAmount && featured.amount
      ? discountPercent(featured.originalAmount, featured.amount)
      : null;

  return (
    <main className="pathlab-med-stage">
      <nav className="pathlab-ig-nav" aria-label="เลือกรูปแบบโปสเตอร์">
        <span className="pathlab-ig-nav__tab pathlab-ig-nav__tab--active">
          Med A4
        </span>
        <Link href="/pathlab/poster" className="pathlab-ig-nav__link">
          โปสเตอร์เดิม
        </Link>
        <Link
          href="/pathlab/poster/social/med"
          className="pathlab-ig-nav__link"
        >
          Med Social
        </Link>
        <Link href="/pathlab/poster/certificate" className="pathlab-ig-nav__link">
          Certificate
        </Link>
      </nav>

      <article
        id="pathlab-med-poster"
        className="pathlab-med-poster"
        aria-label="โปสเตอร์ Pathlab Med"
      >
        {/* Logo + big wordmark sit on a single centred lockup so the title
            IS the brand. */}
        <header className="pathlab-med-poster__lockup">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/passion-seed-logo.png"
            alt="Passion Seed"
            className="pathlab-med-poster__lockup-logo"
          />
          <h1 className="pathlab-med-poster__title">{POSTER_MED.title}</h1>
        </header>

        <p className="pathlab-med-poster__kicker">
          PASSION SEED · PATHLAB · MED
        </p>

        {/* Hero aside reuses the global .pathlab-note marker look. */}
        <p className="pathlab-med-poster__note">
          <span className="pathlab-note pathlab-note--tilt-r">
            {POSTER_MED.note}
          </span>
        </p>

        <h2 className="pathlab-med-poster__headline">
          {POSTER_MED.headline}
        </h2>
        <p className="pathlab-med-poster__subline">
          {POSTER_MED.subline}
        </p>

        {/* Rubber-stamp badge beside the hero: the number-one worry,
            answered. */}
        <div className="pathlab-med-poster__stamp">
          <span>{POSTER_MED.stamp}</span>
        </div>

        <Sparkle className="pathlab-med-poster__sparkle pathlab-med-poster__sparkle--hero-l" />
        <Sparkle className="pathlab-med-poster__sparkle pathlab-med-poster__sparkle--hero-r" />
        <Sparkle className="pathlab-med-poster__sparkle pathlab-med-poster__sparkle--island-r" />
        <Sparkle className="pathlab-med-poster__sparkle pathlab-med-poster__sparkle--deal-l" />

        {/* Tier 3: the live zigzag island trail, the same display the
            /pathlab page uses under "Learning journey เป็นยังไง". Each
            island pairs with a POSTER_MED day so the island's title is
            the day's title. */}
        <section
          className="pathlab-med-poster__trail"
          aria-label="แผนที่ PathLab ตัวอย่าง 5 วันจากสายแพทย์"
        >
          <p className="pathlab-med-poster__trail-eyebrow">
            <span className="pathlab-med-poster__trail-chip">
              แผนที่จริง
            </span>{" "}
            {preview?.map.title ?? "Med Path · เวิร์คโฟลว์แพทย์"}
          </p>
          {/* Hand-drawn wavy underline under the eyebrow, matching the
            base poster's vocabulary. */}
          <svg
            className="pathlab-med-poster__squiggle"
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
          <p className="pathlab-med-poster__trail-hint">
            <span className="pathlab-note pathlab-note--tilt-l-sm">
              {POSTER_MED.daysHint}
            </span>
          </p>

          {/* Always render the live-or-fallback zigzag island trail. Even
              when the demo map can't be fetched (local dev / 404), the
              trail falls back to 5 fallback-sprite islands — one per
              day — so a reader always sees the live product's map
              shape, never a static screenshot. */}
          <div
            className="pathlab-med-poster__trail-canvas"
            style={{ height: displayStops.length * TRAIL_ROW_PX }}
            aria-label={
              preview?.map.title ?? "Med Path · เวิร์คโฟลว์แพทย์"
            }
          >
            <svg
              className="pathlab-med-poster__trail-path"
              viewBox={`0 0 100 ${displayStops.length * 12}`}
              preserveAspectRatio="none"
              aria-hidden="true"
              focusable="false"
            >
              <path
                d={displayPathD}
                fill="none"
                stroke="rgba(196, 62, 29, 0.45)"
                strokeWidth={2.2}
                strokeDasharray="8 8"
                vectorEffect="non-scaling-stroke"
              />
            </svg>
            {displayStops.map((stop, i) => {
              const day = POSTER_MED.days[i];
              return (
                <Island
                  key={stop.id}
                  xPct={stop.xPct}
                  row={stop.row}
                  spriteUrl={stop.spriteUrl}
                  title={day?.title ?? stop.title}
                  dayNumber={i + 1}
                />
              );
            })}
          </div>
        </section>

        {featured ? (
          <section className="pathlab-med-poster__deal">
            <div className="pathlab-med-poster__deal-head">
              <h2 className="pathlab-med-poster__deal-title">
                {featured.label}
              </h2>
              {featured.chip ? (
                <span className="pathlab-med-poster__deal-chip">
                  {featured.chip}
                </span>
              ) : null}
            </div>

            <div className="pathlab-med-poster__deal-body">
              <div className="pathlab-med-poster__deal-main">
                <div className="pathlab-med-poster__deal-price">
                  {featured.originalAmount ? (
                    <span className="pathlab-med-poster__deal-original">
                      <span className="pathlab-med-poster__deal-currency">
                        {featured.currency}
                      </span>
                      {featured.originalAmount}
                    </span>
                  ) : null}
                  <span
                    className="pathlab-med-poster__deal-arrow"
                    aria-hidden="true"
                  >
                    →
                  </span>
                  <span className="pathlab-med-poster__deal-promo">
                    <span className="pathlab-med-poster__deal-currency">
                      {featured.currency}
                    </span>
                    {featured.amount}
                  </span>
                </div>

                {discount !== null ? (
                  <span className="pathlab-med-poster__deal-discount">
                    ลด {discount}%
                  </span>
                ) : null}

                <p className="pathlab-med-poster__deal-unit">
                  {featured.unit}
                </p>

                {featured.blurb ? (
                  <p className="pathlab-med-poster__deal-blurb">
                    {featured.blurb}
                  </p>
                ) : null}
              </div>

              {featured.perks && featured.perks.length > 0 ? (
                <ul className="pathlab-med-poster__perks">
                  {featured.perks.map((perk) => (
                    <li
                      key={perk}
                      className="pathlab-med-poster__perk"
                    >
                      <CheckMark />
                      <span>{perk}</span>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>

            <p className="pathlab-med-poster__schedule">
              {posterSchedule}
            </p>
          </section>
        ) : null}

        <footer className="pathlab-med-poster__footer">
          รับเพียง 4 คนต่อกลุ่ม · ทักมาจองรอบได้เลย
        </footer>
      </article>

      <SocialCardDownload
        targetId="pathlab-med-poster"
        fileName="pathlab-med-poster-a4"
        scale={2}
        label="ดาวน์โหลด PNG (Med A4)"
      />
    </main>
  );
}

/**
 * A four-point sparkle tossed into the quiet corners of the sheet.
 * Purely decorative, so hidden from assistive tech.
 */
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

/** A tiny check chip rendered inline before each perk. */
function CheckMark() {
  return (
    <span className="pathlab-med-poster__check" aria-hidden="true">
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

/**
 * Computes the percent discount between the original and the promo price.
 */
function discountPercent(
  original: string,
  promo: string,
): number | null {
  const o = Number(original);
  const p = Number(promo);
  if (!Number.isFinite(o) || !Number.isFinite(p) || o <= 0 || p <= 0)
    return null;
  if (p >= o) return null;
  return Math.round(((o - p) / o) * 100);
}
