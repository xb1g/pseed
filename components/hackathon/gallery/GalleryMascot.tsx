"use client";

import { useEffect, useRef, useState } from "react";

interface MascotManifest {
  fps: number;
  width: number;
  height: number;
  frames: string[];
  frameCount: number;
}

const MANIFEST_URL = "/hackathon/gallery/mascot-frames/manifest.json";
const FRAMES_BASE = "/hackathon/gallery/mascot-frames/";

export default function GalleryMascot() {
  const [manifest, setManifest] = useState<MascotManifest | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);

  const isHoveredRef = useRef(false);
  const activeIndexRef = useRef(0);
  const rafRef = useRef<number | null>(null);

  // Load manifest and detect reduced motion preference
  useEffect(() => {
    let cancelled = false;

    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(media.matches);

    const handleChange = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    media.addEventListener("change", handleChange);

    fetch(MANIFEST_URL)
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error("manifest missing"))))
      .then((data: MascotManifest) => {
        if (cancelled) return;
        setManifest(data);
      })
      .catch((err) => {
        console.error("Gallery mascot manifest failed to load:", err);
      });

    return () => {
      cancelled = true;
      media.removeEventListener("change", handleChange);
    };
  }, []);

  // Preload and decode all frames in the background
  useEffect(() => {
    if (!manifest || reducedMotion) return;

    let cancelled = false;
    const urls = manifest.frames.map((f) => `${FRAMES_BASE}${f}`);
    let completed = 0;

    if (urls.length === 0) return;

    urls.forEach((src) => {
      const img = new Image();
      img.onload = img.onerror = () => {
        if (cancelled) return;
        completed += 1;
        if (completed === urls.length) {
          setLoaded(true);
        }
      };
      img.src = src;
    });

    // Show after a short timeout even if some frames are slow
    const fallback = setTimeout(() => setLoaded(true), 2000);

    return () => {
      cancelled = true;
      clearTimeout(fallback);
    };
  }, [manifest, reducedMotion]);

  // Smooth requestAnimationFrame playback loop.
  // - Loops continuously while hovered.
  // - Finishes the current loop and stops at frame 0 on mouse leave.
  useEffect(() => {
    if (!manifest || !loaded || reducedMotion) return;

    const frameInterval = 1000 / manifest.fps;
    let lastTime = 0;
    let accumulator = 0;

    const tick = (now: number) => {
      rafRef.current = requestAnimationFrame(tick);
      if (!lastTime) {
        lastTime = now;
        return;
      }
      const dt = now - lastTime;
      lastTime = now;

      const shouldAdvance = isHoveredRef.current || activeIndexRef.current !== 0;
      if (!shouldAdvance) {
        accumulator = 0;
        return;
      }

      accumulator += dt;

      while (accumulator >= frameInterval) {
        accumulator -= frameInterval;

        const next = (activeIndexRef.current + 1) % manifest.frames.length;

        // If we're finishing a loop and would wrap, freeze at frame 0.
        if (!isHoveredRef.current && next === 0) {
          activeIndexRef.current = 0;
          setActiveIndex(0);
          accumulator = 0;
          break;
        }

        activeIndexRef.current = next;
        setActiveIndex(next);
      }
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [manifest, loaded, reducedMotion]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  if (!manifest) return null;

  const wrapperSize = Math.max(manifest.width, manifest.height);

  const handleMouseEnter = () => {
    isHoveredRef.current = true;
  };

  const handleMouseLeave = () => {
    isHoveredRef.current = false;
  };

  return (
    <div
      aria-hidden="true"
      className="gallery-mascot-wrapper"
      style={{
        position: "relative",
        width: wrapperSize,
        height: wrapperSize,
        pointerEvents: "none",
        userSelect: "none",
        animation: reducedMotion ? "none" : "galleryMascotBob 4s ease-in-out infinite",
      }}
    >
      {/* Soft grounded glow */}
      <div
        style={{
          position: "absolute",
          bottom: "-8px",
          left: "50%",
          transform: "translateX(-50%)",
          width: "70%",
          height: "16px",
          borderRadius: "50%",
          background: "rgba(97, 154, 210, 0.25)",
          filter: "blur(8px)",
          zIndex: 0,
        }}
      />

      {/* Frame stack */}
      <div
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        style={{
          position: "relative",
          width: manifest.width,
          height: manifest.height,
          margin: "0 auto",
          zIndex: 1,
          pointerEvents: "auto",
          cursor: "pointer",
        }}
      >
        {manifest.frames.map((frame, i) => (
          <img
            key={frame}
            src={`${FRAMES_BASE}${frame}`}
            alt=""
            aria-hidden="true"
            loading="eager"
            decoding="async"
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "contain",
              opacity: i === activeIndex ? 1 : 0,
              transition: "none",
              willChange: "opacity",
              pointerEvents: "none",
            }}
          />
        ))}
      </div>

      <style>{`
        @keyframes galleryMascotBob {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }
        @media (prefers-reduced-motion: reduce) {
          .gallery-mascot-wrapper {
            animation: none !important;
          }
        }
      `}</style>
    </div>
  );
}
