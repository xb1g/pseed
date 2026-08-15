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

const STOP_SPRITE_PX = 64;

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
        if (!res.ok) throw new Error(`preview ${res.status}`);
        return res.json();
      })
      .then((data: JourneyPreview) => {
        if (!cancelled) setPreview(data);
      })
      .catch((err) => {
        console.error("journey preview failed:", err);
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

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
      </div>

      <p className="pathlab-journey-map__hint">
        <span className="pathlab-note">{JOURNEY_MAP.hint}</span>
      </p>

      <div className="pathlab-journey-map__detail" aria-live="polite">
        <p className="pathlab-journey-map__detail-heading">
          {selected ? selected.title : preview.map.title}
        </p>
        <p className="pathlab-journey-map__detail-doing">
          {selected
            ? (selected.snippet ?? preview.map.description ?? "")
            : (preview.map.description ?? "")}
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
