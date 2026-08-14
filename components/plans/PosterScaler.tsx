"use client";

import React, { useEffect, useRef, useState } from "react";

/**
 * PosterScaler — previews a fixed-design-width poster (1080px, unbounded
 * height) inside any container by scaling it down with a CSS transform.
 *
 * The child node itself is never transformed, so html-to-image export still
 * captures it at full 1080px width. The wrapper reserves exactly the scaled
 * height, so nothing overlaps the content below and nothing is clipped.
 */
interface PosterScalerProps {
  children: React.ReactNode;
  designWidth?: number;
  className?: string;
}

export function PosterScaler({
  children,
  designWidth = 1080,
  className = "",
}: PosterScalerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0);
  const [scaledHeight, setScaledHeight] = useState(0);

  useEffect(() => {
    const container = containerRef.current;
    const stage = stageRef.current;
    if (!container || !stage) return;

    const update = () => {
      const width = container.clientWidth;
      if (width === 0) return;
      const nextScale = width / designWidth;
      // offsetHeight ignores transforms, so this is the natural design height.
      setScale(nextScale);
      setScaledHeight(stage.offsetHeight * nextScale);
    };

    const observer = new ResizeObserver(update);
    observer.observe(container);
    observer.observe(stage);
    update();

    return () => observer.disconnect();
  }, [designWidth]);

  const ready = scale > 0 && scaledHeight > 0;

  return (
    <div
      ref={containerRef}
      className={className}
      style={{
        position: "relative",
        width: "100%",
        height: ready ? scaledHeight : 480,
        overflow: "hidden",
      }}
    >
      <div
        ref={stageRef}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: designWidth,
          transform: `scale(${ready ? scale : 1})`,
          transformOrigin: "top left",
          visibility: ready ? "visible" : "hidden",
        }}
      >
        {children}
      </div>
    </div>
  );
}
