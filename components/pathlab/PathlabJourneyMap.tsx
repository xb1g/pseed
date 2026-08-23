"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  JOURNEY,
  JOURNEY_MAP,
} from "@/lib/content/pathlab-page";
import {
  toTrailStops,
  trailPathD,
  TRAIL_ROW_PX,
  type JourneyPreview,
} from "@/components/pathlab/journey-map-utils";

/**
 * "Learning journey เป็นยังไง": a live, read-only preview of a real PathLab
 * map fetched from /api/maps/public-preview, rendered as a plain-DOM zigzag
 * trail of island sprites so it always matches the product without any
 * React Flow chrome.
 *
 * Loaded via next/dynamic (ssr: false) from PathlabJourney: this section is
 * below the fold, so it stays out of the landing bundle and the static
 * screenshot shows while the chunk loads. The same screenshot covers the
 * in-component loading and error states.
 */

const DEMO_MAP_ID = "00000000-0000-0000-0000-000000000020";

const STOP_SPRITE_PX = 112;

function ScreenshotFallback() {
  return (
    <Image
      src={JOURNEY.src}
      alt={JOURNEY.alt}
      width={2538}
      height={1342}
      className="pathlab-journey-map__screenshot"
    />
  );
}

export default function PathlabJourneyMap() {
  const [preview, setPreview] = useState<JourneyPreview | null>(null);
  const [failed, setFailed] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/maps/public-preview/${DEMO_MAP_ID}`)
      .then((res) => {
        // The live preview is optional: local/dev databases may not have the
        // allowlisted demo map yet. In that case keep the authored screenshot
        // fallback without turning an expected 404 into a console error.
        if (res.status === 404) {
          if (!cancelled) setFailed(true);
          return null;
        }
        if (!res.ok) throw new Error(`preview ${res.status}`);
        return res.json();
      })
      .then((data: JourneyPreview | null) => {
        if (data && !cancelled) setPreview(data);
      })
      .catch((err) => {
        console.error("journey preview failed:", err);
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Escape dismisses the anchored popup while one is open.
  useEffect(() => {
    if (!selectedId) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSelectedId(null);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [selectedId]);

  const stops = useMemo(
    () => (preview ? toTrailStops(preview) : []),
    [preview]
  );
  const pathD = useMemo(() => trailPathD(stops), [stops]);

  if (failed) {
    return (
      <div className="pathlab-journey-map">
        <div className="pathlab-journey-map__canvas is-fallback">
          <ScreenshotFallback />
        </div>
      </div>
    );
  }

  if (!preview) {
    return (
      <div className="pathlab-journey-map" aria-busy="true">
        <div className="pathlab-journey-map__canvas is-fallback">
          <ScreenshotFallback />
        </div>
      </div>
    );
  }

  const selected = stops.find((s) => s.id === selectedId) ?? null;

  return (
    <div className="pathlab-journey-map">
      <p className="pathlab-journey-map__map-title">
        <span className="pathlab-journey-map__map-chip">
          {JOURNEY_MAP.mapLabel}
        </span>{" "}
        {preview.map.title}
      </p>

      <div
        className="pathlab-journey-map__trail"
        style={{ height: stops.length * TRAIL_ROW_PX }}
      >
        <svg
          className="pathlab-journey-map__trail-path"
          viewBox={`0 0 100 ${stops.length * 12}`}
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path
            d={pathD}
            fill="none"
            stroke="rgba(196, 62, 29, 0.4)"
            strokeWidth={2}
            strokeDasharray="7 7"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
        {stops.map((stop) => {
          const isSelected = stop.id === selectedId;
          return (
            <button
              key={stop.id}
              type="button"
              aria-pressed={isSelected}
              className={`pathlab-journey-map__stop${
                isSelected ? " is-selected" : ""
              }`}
              style={{
                left: `${stop.xPct}%`,
                /* Sprite centre lands on the row's midpoint, matching the
                   connector path's stop centres (row * 12 + 6 viewBox). */
                top:
                  stop.row * TRAIL_ROW_PX +
                  (TRAIL_ROW_PX - STOP_SPRITE_PX) / 2,
              }}
              onClick={() => setSelectedId(stop.id)}
            >
              <Image
                src={stop.spriteUrl}
                alt=""
                width={STOP_SPRITE_PX}
                height={STOP_SPRITE_PX}
                className="pathlab-journey-map__stop-sprite"
              />
              <span className="pathlab-journey-map__stop-title">
                {stop.title}
              </span>
            </button>
          );
        })}
        {selected && (
          <>
            <div
              className="pathlab-journey-map__popup-backdrop"
              aria-hidden="true"
              onClick={() => setSelectedId(null)}
            />
            <div
              role="dialog"
              aria-label={selected.title}
              className="pathlab-journey-map__popup"
              style={{
                top: selected.row * TRAIL_ROW_PX + 130,
                left: `clamp(9.5rem, ${selected.xPct}%, calc(100% - 9.5rem))`,
              }}
            >
              <button
                type="button"
                aria-label="ปิด"
                className="pathlab-journey-map__popup-close"
                onClick={() => setSelectedId(null)}
              >
                ×
              </button>
              <p className="pathlab-journey-map__popup-title">
                {selected.title}
              </p>
              {selected.snippet && (
                <p className="pathlab-journey-map__popup-body">
                  {selected.snippet}
                </p>
              )}
              <Link
                href={`/map/${preview.map.id}`}
                className="pathlab-journey-map__cta"
              >
                {JOURNEY_MAP.ctaLabel}
              </Link>
            </div>
          </>
        )}
      </div>

      <p className="pathlab-journey-map__hint">
        <span className="pathlab-note">{JOURNEY_MAP.hint}</span>
      </p>

      <div className="pathlab-journey-map__detail">
        <p className="pathlab-journey-map__detail-heading">
          {preview.map.title}
        </p>
        <p className="pathlab-journey-map__detail-doing">
          {preview.map.description ?? ""}
        </p>
        <Link
          href={`/map/${preview.map.id}`}
          className="pathlab-journey-map__cta"
        >
          {JOURNEY_MAP.ctaLabel}
        </Link>
      </div>
    </div>
  );
}
