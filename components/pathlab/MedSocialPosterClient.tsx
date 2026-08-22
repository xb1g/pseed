"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { PosterScaler } from "@/components/plans/PosterScaler";
import { SocialCardDownload } from "@/components/pathlab/SocialCardDownload";
import {
  FALLBACK_SPRITE,
  TRAIL_X_PCT,
  toTrailStops,
  trailPathD,
  type JourneyPreview,
} from "@/components/pathlab/journey-map-utils";
import {
  POSTER_MED,
  type PriceTier,
} from "@/lib/content/pathlab-page";

/**
 * 1200x630 share card for the Med Path. Same vocabulary as the A4
 * sibling (marker frame, marker notes, sparkles, stamp, deal panel,
 * schedule) but in landscape: hero on the left, zigzag island trail
 * on the right. Mirrors the live /pathlab trail display — one
 * island per day, no day cards.
 */

const DEMO_MAP_ID = "00000000-0000-0000-0000-000000000020";
const STOP_SPRITE_PX = 60;
/** Tighter row pitch for the social card so five 60px sprites fit
 *  between hero and deal in 1200x630. */
const TRAIL_ROW_PX = 72;

function SocialIsland({
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
      className="pathlab-med-social__stop"
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
        className="pathlab-med-social__stop-sprite"
      />
      <span className="pathlab-med-social__stop-chip">
        วันที่ {dayNumber}
      </span>
      <span className="pathlab-med-social__stop-title">{title}</span>
    </button>
  );
}

interface MedSocialPosterClientProps {
  featured: PriceTier | null;
  posterSchedule: string;
}

export function MedSocialPosterClient({
  featured,
  posterSchedule,
}: MedSocialPosterClientProps) {
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
        console.error("med social preview failed:", err);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const stops = useMemo(
    () => (preview ? toTrailStops(preview) : []),
    [preview],
  );
  const fallbackStops = useMemo(
    () =>
      POSTER_MED.days.map((day, i) => ({
        id: `fallback-${i}`,
        title: day.title,
        spriteUrl: FALLBACK_SPRITE,
        snippet: null,
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
  const perks = (featured?.perks ?? []).slice(0, 3);

  return (
    <main className="pathlab-med-stage">
      <nav className="pathlab-ig-nav" aria-label="เลือกรูปแบบโปสเตอร์">
        <span className="pathlab-ig-nav__tab pathlab-ig-nav__tab--active">
          Med Social
        </span>
        <Link href="/pathlab/poster/med" className="pathlab-ig-nav__link">
          Med A4
        </Link>
        <Link href="/pathlab/poster/social" className="pathlab-ig-nav__link">
          Social เดิม
        </Link>
      </nav>

      <PosterScaler designWidth={1200} className="pathlab-med-social-scaler">
        <article
          id="pathlab-med-social"
          className="pathlab-med-social"
          aria-label="การ์ดแชร์ Pathlab Med ขนาด 1200x630"
        >
          <Sparkle className="pathlab-med-social__sparkle pathlab-med-social__sparkle--hero-l" />
          <Sparkle className="pathlab-med-social__sparkle pathlab-med-social__sparkle--hero-r" />
          <Sparkle className="pathlab-med-social__sparkle pathlab-med-social__sparkle--trail-r" />
          <Sparkle className="pathlab-med-social__sparkle pathlab-med-social__sparkle--deal-l" />

          <div className="pathlab-med-social__stamp">
            <span>{POSTER_MED.stamp}</span>
          </div>

          <section className="pathlab-med-social__hero">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/passion-seed-logo.png"
              alt="Passion Seed"
              className="pathlab-med-social__lockup-logo"
            />
            <p className="pathlab-med-social__kicker">
              PASSION SEED · PATHLAB · MED
            </p>
            <h1 className="pathlab-med-social__title">{POSTER_MED.title}</h1>
            <p className="pathlab-med-social__note">
              <span className="pathlab-note pathlab-note--tilt-r">
                {POSTER_MED.note}
              </span>
            </p>
            <p className="pathlab-med-social__lead">
              {POSTER_MED.promise}
            </p>
          </section>

          {/* Zigzag island trail on the right: same live-or-fallback
              pattern as the A4 sibling. Five rows, one island per day,
              connected by a dashed path. Matches the live /pathlab
              page's Learning journey display. */}
          <section
            className="pathlab-med-social__trail"
            aria-label="แผนที่ PathLab ตัวอย่าง 5 วันจากสายแพทย์"
          >
            <p className="pathlab-med-social__trail-eyebrow">
              <span className="pathlab-med-social__trail-chip">
                แผนที่จริง
              </span>{" "}
              {POSTER_MED.daysEyebrow}
            </p>
            <div
              className="pathlab-med-social__trail-canvas"
              style={{ height: displayStops.length * TRAIL_ROW_PX }}
              aria-label={
                preview?.map.title ?? "Med Path · เวิร์คโฟลว์แพทย์"
              }
            >
              <svg
                className="pathlab-med-social__trail-path"
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
                  <SocialIsland
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
            <p className="pathlab-med-social__trail-hint">
              <span className="pathlab-note pathlab-note--tilt-l-sm">
                {POSTER_MED.daysHint}
              </span>
            </p>
          </section>

          {featured ? (
            <section className="pathlab-med-social__deal">
              <div className="pathlab-med-social__deal-main">
                <div className="pathlab-med-social__deal-price">
                  {featured.originalAmount ? (
                    <span className="pathlab-med-social__deal-original">
                      <span className="pathlab-med-social__deal-currency">
                        {featured.currency}
                      </span>
                      {featured.originalAmount}
                    </span>
                  ) : null}
                  <span
                    className="pathlab-med-social__deal-arrow"
                    aria-hidden="true"
                  >
                    →
                  </span>
                  <span className="pathlab-med-social__deal-promo">
                    <span className="pathlab-med-social__deal-currency">
                      {featured.currency}
                    </span>
                    {featured.amount}
                  </span>
                </div>
                <div className="pathlab-med-social__deal-meta">
                  {discount !== null ? (
                    <span className="pathlab-med-social__deal-discount">
                      ลด {discount}%
                    </span>
                  ) : null}
                  <span className="pathlab-med-social__deal-unit">
                    ต่อคน · รอบ 4-6 วัน
                  </span>
                </div>
              </div>

              {perks.length > 0 ? (
                <ul className="pathlab-med-social__perks">
                  {perks.map((perk) => (
                    <li key={perk} className="pathlab-med-social__perk">
                      <CheckMark />
                      <span>{perk}</span>
                    </li>
                  ))}
                </ul>
              ) : null}

              <p className="pathlab-med-social__schedule">
                <span className="pathlab-med-social__schedule-lead">
                  รอบถัดไป
                </span>
                <span className="pathlab-med-social__schedule-dates">
                  {posterSchedule}
                </span>
              </p>
            </section>
          ) : null}

          <footer className="pathlab-med-social__footer">
            รับเพียง 4 คนต่อกลุ่ม · ทักมาจองรอบได้เลย
          </footer>
        </article>
      </PosterScaler>

      <SocialCardDownload
        targetId="pathlab-med-social"
        fileName="pathlab-med-social-1200x630"
        width={1200}
        height={630}
        label="ดาวน์โหลด PNG (Med Social)"
      />
    </main>
  );
}

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

function CheckMark() {
  return (
    <span className="pathlab-med-social__check" aria-hidden="true">
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
