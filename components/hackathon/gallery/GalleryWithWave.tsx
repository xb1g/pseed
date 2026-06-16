"use client";

import { useRef } from "react";
import GalleryView from "./GalleryView";
import GalleryWaveOverlay, { type GalleryWaveOverlayHandle } from "./GalleryWaveOverlay";
import GalleryMascot from "./GalleryMascot";
import type { GalleryProductSummary } from "@/lib/hackathon/gallery";

interface Props {
  products: GalleryProductSummary[];
  allTags: string[];
  initialTag?: string;
}

export default function GalleryWithWave({ products, allTags, initialTag }: Props) {
  const waveRef = useRef<GalleryWaveOverlayHandle>(null);

  return (
    <>
      {/* Wave overlay at top-level — same stacking context as mascot */}
      <GalleryWaveOverlay ref={waveRef} />

      <GalleryView products={products} allTags={allTags} initialTag={initialTag} waveRef={waveRef} />

      {/* Mascot — z-index below wave (200) */}
      <div
        style={{
          position: "fixed",
          bottom: 0,
          right: "clamp(1rem, 3vw, 2.5rem)",
          zIndex: 190,
          pointerEvents: "none",
          userSelect: "none",
        }}
      >
        <GalleryMascot />
      </div>
    </>
  );
}
