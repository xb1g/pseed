"use client";

import { useEffect, useLayoutEffect, useRef } from "react";

/**
 * Wave overlay that recedes on mount, completing the transition from the gallery.
 * Reads sessionStorage flag set by GalleryWaveOverlay to show immediately.
 */
export default function WaveEntry() {
  const overlayRef = useRef<HTMLDivElement>(null);

  // useLayoutEffect runs synchronously after DOM paint — shows overlay before user sees content
  useLayoutEffect(() => {
    const overlay = overlayRef.current;
    if (!overlay) return;
    try {
      if (sessionStorage.getItem("gallery-wave-entry") === "1") {
        overlay.style.display = "block";
        overlay.style.transform = "translateY(0)";
        overlay.style.transition = "none";
      }
    } catch {}
  }, []);

  useEffect(() => {
    const overlay = overlayRef.current;
    if (!overlay) return;

    let fromWave = false;
    try {
      fromWave = sessionStorage.getItem("gallery-wave-entry") === "1";
      if (fromWave) sessionStorage.removeItem("gallery-wave-entry");
    } catch {}

    if (!fromWave) return;

    // Force reflow then animate down
    void overlay.offsetHeight;
    overlay.style.transition = "transform 0.7s cubic-bezier(0.87, 0, 0.13, 1)";
    overlay.style.transform = "translateY(110%)";

    const onEnd = () => { overlay.style.display = "none"; };
    overlay.addEventListener("transitionend", onEnd, { once: true });

    const failsafe = setTimeout(() => { overlay.style.display = "none"; }, 1500);
    return () => { clearTimeout(failsafe); overlay.removeEventListener("transitionend", onEnd); };
  }, []);

  return (
    <>
      <div
        ref={overlayRef}
        aria-hidden="true"
        style={{
          display: "none",
          position: "fixed",
          inset: 0,
          zIndex: 200,
          background:
            "linear-gradient(to bottom, #0d1f35 0%, #12284a 20%, #1a3d6e 45%, #2358a0 70%, #3474bc 88%, #619AD2 100%)",
          willChange: "transform",
          pointerEvents: "none",
        }}
      >
        {/* Grain overlay */}
        <div style={{
          position: "absolute",
          inset: 0,
          backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='g'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.72' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23g)' opacity='1'/%3E%3C/svg%3E\")",
          backgroundRepeat: "repeat",
          opacity: 0.08,
          mixBlendMode: "overlay",
          pointerEvents: "none",
        }} />
        {/* Shore glow line */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "1px",
            background: "#C2DFF5",
            boxShadow: "0 0 18px 4px rgba(145, 196, 227, 0.55)",
          }}
        />

        {/* Wave layer 1 */}
        <svg
          viewBox="0 0 1440 80"
          preserveAspectRatio="none"
          aria-hidden="true"
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "200%",
            height: "80px",
            transform: "translateY(-70%)",
            animation: "galleryWave1 11s linear infinite",
          }}
        >
          <path
            d="M0,40 C180,10 360,70 540,40 C720,10 900,70 1080,40 C1260,10 1350,60 1440,40 L1440,80 L0,80 Z"
            fill="rgba(42, 90, 138, 0.35)"
          />
        </svg>

        {/* Wave layer 2 */}
        <svg
          viewBox="0 0 1440 80"
          preserveAspectRatio="none"
          aria-hidden="true"
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "200%",
            height: "80px",
            transform: "translateY(-55%)",
            animation: "galleryWave2 7s linear infinite",
          }}
        >
          <path
            d="M0,50 C200,20 400,70 600,45 C800,20 1000,65 1200,42 C1350,25 1400,55 1440,50 L1440,80 L0,80 Z"
            fill="rgba(97, 154, 210, 0.45)"
          />
        </svg>

        {/* Wave layer 3 */}
        <svg
          viewBox="0 0 1440 80"
          preserveAspectRatio="none"
          aria-hidden="true"
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "200%",
            height: "80px",
            transform: "translateY(-40%)",
            animation: "galleryWave3 4.8s linear infinite",
          }}
        >
          <path
            d="M0,35 C150,60 300,20 480,45 C640,65 820,25 1000,48 C1160,68 1320,30 1440,35 L1440,80 L0,80 Z"
            fill="rgba(194, 223, 245, 0.55)"
          />
        </svg>
      </div>

      <style>{`
        @keyframes galleryWave1 {
          0%   { transform: translateX(0)    translateY(-70%); }
          100% { transform: translateX(-50%) translateY(-70%); }
        }
        @keyframes galleryWave2 {
          0%   { transform: translateX(0)    translateY(-55%); }
          100% { transform: translateX(-50%) translateY(-55%); }
        }
        @keyframes galleryWave3 {
          0%   { transform: translateX(-50%) translateY(-40%); }
          100% { transform: translateX(0)    translateY(-40%); }
        }
        @media (prefers-reduced-motion: reduce) {
          @keyframes galleryWave1 { 0%, 100% { transform: translateY(-70%); } }
          @keyframes galleryWave2 { 0%, 100% { transform: translateY(-55%); } }
          @keyframes galleryWave3 { 0%, 100% { transform: translateY(-40%); } }
        }
      `}</style>
    </>
  );
}
