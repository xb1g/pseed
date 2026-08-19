"use client";

import { useState, useCallback } from "react";
import { toCanvas } from "html-to-image";
import {
  Output,
  CanvasSource,
  Mp4OutputFormat,
  BufferTarget,
  Quality,
} from "mediabunny";
import {
  HERO,
  NOTES,
  POSTER,
  OFFER_CARDS,
  FIELDS,
  PRICE_TIERS,
  type PriceTier,
} from "@/lib/content/pathlab-page";
import styles from "./InstagramPosterVideo.module.css";

/* Constants from the spec motion table. */
const FPS = 24;
const DURATION_SEC = 12;
const TOTAL_FRAMES = FPS * DURATION_SEC; // 288
const WIDTH = 1080;
const HEIGHT = 1350;

const FIELD_TILTS = [
  "",
  "pathlab-note--tilt-r",
  "pathlab-note--tilt-l-sm",
  "pathlab-note--tilt-r-sm",
] as const;

/* Same SVG and discount helper as InstagramPosterClient — kept
   inline so this file does not import a client component. */
function Sparkle({ className }: { className: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" focusable="false">
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
  if (!Number.isFinite(o) || !Number.isFinite(p) || o <= 0 || p <= 0) return null;
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

/**
 * Pure capture loop. Exported so it can be unit-tested for frame math
 * without a DOM. The caller is responsible for awaiting
 * `document.fonts.ready` before invoking.
 */
export async function captureFramesToMp4Blob(
  targetId: string,
  onProgress?: (frame: number, total: number) => void,
): Promise<Blob> {
  const node = document.getElementById(targetId);
  if (!node) throw new Error(`Capture target #${targetId} not found`);

  const canvas = document.createElement("canvas");
  canvas.width = WIDTH;
  canvas.height = HEIGHT;

  const output = new Output({
    format: new Mp4OutputFormat(),
    target: new BufferTarget(),
  });
  const source = new CanvasSource(canvas, {
    codec: "avc",
    quality: new Quality("high"),
  });
  output.addVideoTrack(source);

  await output.start();
  onProgress?.(0, TOTAL_FRAMES);

  for (let frame = 0; frame < TOTAL_FRAMES; frame++) {
    const t = frame / FPS;
    // Render the live DOM into a snapshot canvas, then blit into our
    // persistent output canvas. toCanvas honours the node's
    // untransformed size because we never wrap it in PosterScaler
    // (per the Global Constraints in the plan).
    const snapshot = await toCanvas(node, {
      cacheBust: false,
      pixelRatio: 1,
      width: WIDTH,
      height: HEIGHT,
      canvasWidth: WIDTH,
      canvasHeight: HEIGHT,
    });
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("2D canvas context unavailable");
    ctx.clearRect(0, 0, WIDTH, HEIGHT);
    ctx.drawImage(snapshot, 0, 0, WIDTH, HEIGHT);

    // Yield so the browser can advance the CSS animation to the
    // next tick before the next capture. The math: we want frame
    // N to reflect the animation state at t = N/FPS. Since the
    // animation runs in real time (12s), we wait one rAF and the
    // animation engine lands on roughly the right tick. Drift is
    // acceptable; the loop seam hides it.
    await new Promise<void>((resolve) =>
      requestAnimationFrame(() => resolve()),
    );

    await source.add(t, 1 / FPS);
    onProgress?.(frame + 1, TOTAL_FRAMES);
  }

  await output.finalize();
  const buffer = output.target.buffer;
  if (!buffer) throw new Error("Mediabunny produced no output buffer");
  return new Blob([buffer], { type: "video/mp4" });
}

export default function InstagramPosterVideo() {
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<{ frame: number; total: number } | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);

  const posterPrices = PRICE_TIERS.filter(
    (tier): tier is PriceTier & { tone: "solo" | "featured" | "group" } =>
      tier.tone !== "free",
  );
  const posterFields = POSTER.fieldLabels
    .map((label) => FIELDS.find((f) => f.label === label))
    .filter((f): f is NonNullable<typeof f> => f !== undefined);
  const featured =
    posterPrices.find((tier) => tier.tone === "featured") ?? posterPrices[0];
  const discount = featured
    ? discountPercent(featured.originalAmount, featured.amount)
    : null;

  const onDownload = useCallback(async () => {
    if (busy) return;
    setBusy(true);
    setError(null);
    setProgress({ frame: 0, total: TOTAL_FRAMES });
    try {
      await document.fonts.ready;
      const blob = await captureFramesToMp4Blob(
        "pathlab-ig-video-card",
        (frame, total) => setProgress({ frame, total }),
      );
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "pathlab-instagram-feed-1080x1350.mp4";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      // Give the browser a tick to start the download before revoking.
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (err) {
      console.error("MP4 export failed:", err);
      setError("สร้าง MP4 ไม่สำเร็จ ลองอีกครั้ง หรือใช้ปุ่มดาวน์โหลด PNG แทน");
    } finally {
      setBusy(false);
      setProgress(null);
    }
  }, [busy]);

  return (
    <div
      className={`${styles["pathlab-ig-video-stage"]} ${
        busy ? styles["pathlab-ig-video-capturing"] : ""
      }`}
    >
      <article
        id="pathlab-ig-video-card"
        className={`pathlab-ig-card pathlab-ig-card--portrait pathlab-ig-video ${styles["pathlab-ig-video-card"]}`}
        aria-label="วิดีโอโปสเตอร์ Pathlab สำหรับ Instagram (4:5)"
      >
        {/* === JSX below mirrors InstagramPosterClient.tsx for the
               portrait card, with the addition of the .pathlab-ig-video
               class on the root for animation targeting. Selectors are
               identical so the keyframes in globals.css hit them. === */}
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
            <span className="pathlab-note pathlab-note--tilt-r">{NOTES.hero}</span>
          </p>
          <h2 className="pathlab-ig__headline">{POSTER.headline}</h2>
          <p className="pathlab-ig__subline">{POSTER.subline}</p>
        </section>

        <div className="pathlab-ig__stamp">
          <span>{POSTER.stamp}</span>
        </div>

        <Sparkle className="pathlab-ig__sparkle pathlab-ig__sparkle--hero-l" />
        <Sparkle className="pathlab-ig__sparkle pathlab-ig__sparkle--hero-r" />
        <Sparkle className="pathlab-ig__sparkle pathlab-ig__sparkle--fields-r" />
        <Sparkle className="pathlab-ig__sparkle pathlab-ig__sparkle--price-l" />

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
                <span className={`pathlab-note ${FIELD_TILTS[i % FIELD_TILTS.length]}`}>
                  {field.label}
                </span>
              </li>
            ))}
          </ul>
          <p className="pathlab-ig__schedule">{POSTER.schedule}</p>
        </section>

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
                  <span className="pathlab-ig__deal-arrow" aria-hidden="true">
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
                  <span className="pathlab-ig__deal-discount">ลด {discount}%</span>
                ) : null}
                <p className="pathlab-ig__deal-unit">{featured.unit}</p>
                {featured.blurb ? (
                  <p className="pathlab-ig__deal-blurb">{featured.blurb}</p>
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

        <footer className="pathlab-ig__footer">
          <span className="pathlab-ig__footer-handle">IG: @passion_seed.th</span>
          <span className="pathlab-ig__footer-cta">
            ทัก DM หรือ LINE OA เพื่อจองรอบและสอบถามเพิ่มเติม
          </span>
        </footer>
      </article>

      <div className={styles["pathlab-ig-video-actions"]}>
        <p
          style={{
            fontFamily: "var(--font-bai-jamjuree), sans-serif",
            fontSize: 14,
            color: "rgba(82, 71, 70, 0.75)",
            margin: 0,
          }}
        >
          วิดีโอสำหรับโพสต์ IG
        </p>
        <button
          type="button"
          className="pathlab-social__download"
          onClick={onDownload}
          disabled={busy}
        >
          {busy
            ? `กำลังสร้าง MP4… ${progress ? `(${progress.frame}/${progress.total})` : ""}`
            : "ดาวน์โหลด MP4 (1080×1350, 12s)"}
        </button>
        {progress && busy ? (
          <p className={styles["pathlab-ig-video-progress"]} aria-live="polite">
            {Math.round((progress.frame / progress.total) * 100)}%
          </p>
        ) : null}
        {error ? (
          <p className={styles["pathlab-ig-video-error"]} role="alert">
            {error}
          </p>
        ) : null}
      </div>
    </div>
  );
}