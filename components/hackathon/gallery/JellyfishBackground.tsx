"use client";

import { useEffect, useRef } from "react";

interface JellyfishConfig {
  src: string;
  size: number;
  opacity: number;
  flip?: boolean;
}

const JELLIES: JellyfishConfig[] = [
  { src: "/hackathon/Creature/Small Jelly.svg", size: 120, opacity: 0.18 },
  { src: "/hackathon/Creature/Small Jelly.svg", size: 90, opacity: 0.15, flip: true },
  { src: "/hackathon/Creature/Small Jelly.svg", size: 65, opacity: 0.13 },
  { src: "/hackathon/Creature/Small Jelly.svg", size: 45, opacity: 0.11, flip: true },
  { src: "/hackathon/Creature/Small Jelly.svg", size: 35, opacity: 0.09 },
];

function easeInOutQuad(t: number) {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

function randomTarget(w: number, h: number, margin: number) {
  return {
    x: margin + Math.random() * (w - 2 * margin),
    y: margin + Math.random() * (h - 2 * margin),
  };
}

interface JellyState {
  el: HTMLDivElement;
  size: number;
  // Current animated position
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  // Timing
  startTime: number;
  duration: number;
  // Rotation (smoothly interpolated toward movement direction)
  angle: number;
  // Pulse phase
  pulsePhase: number;
  pulseSpeed: number;
  seed: number;
}

export default function JellyfishBackground() {
  const containerRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Respect reduced motion
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mq.matches) return;

    const w = container.clientWidth;
    const h = container.clientHeight;

    const jellies: JellyState[] = JELLIES.map((cfg) => {
      const el = document.createElement("div");
      el.style.cssText = `position:absolute;pointer-events:none;will-change:transform;`;
      el.innerHTML = `<img src="${cfg.src}" alt="" style="
        width:${cfg.size}px;height:${cfg.size}px;opacity:${cfg.opacity};
        filter:drop-shadow(0 0 16px rgba(145,196,227,0.3));
        ${cfg.flip ? "transform:scaleX(-1);" : ""}
      " loading="lazy" decoding="async" />`;
      container.appendChild(el);

      const margin = cfg.size * 0.5;
      const start = randomTarget(w, h, margin);
      const target = randomTarget(w, h, margin);
      const dist = Math.hypot(target.x - start.x, target.y - start.y);
      const duration = (dist / 30) * 1000 + Math.random() * 2000 + 3000;

      return {
        el,
        size: cfg.size,
        fromX: start.x,
        fromY: start.y,
        toX: target.x,
        toY: target.y,
        startTime: performance.now() + Math.random() * 1000,
        duration,
        angle: 0,
        pulsePhase: Math.random() * Math.PI * 2,
        pulseSpeed: 0.6 + Math.random() * 0.5,
        seed: Math.random() * 10,
      };
    });

    let prevTime = performance.now();

    function animate(now: number) {
      const dt = Math.min((now - prevTime) / 1000, 0.1);
      prevTime = now;

      const cw = container!.clientWidth;
      const ch = container!.clientHeight;

      for (const j of jellies) {
        // Progress along current swim leg
        let t = (now - j.startTime) / j.duration;
        if (t >= 1) {
          // Arrived — pick new target
          j.fromX = j.toX;
          j.fromY = j.toY;
          const margin = j.size * 0.5;
          const next = randomTarget(cw, ch, margin);
          j.toX = next.x;
          j.toY = next.y;
          const dist = Math.hypot(j.toX - j.fromX, j.toY - j.fromY);
          j.duration = (dist / 30) * 1000 + Math.random() * 2000 + 3000;
          j.startTime = now;
          t = 0;
        }

        const eased = easeInOutQuad(Math.min(t, 1));
        const x = j.fromX + (j.toX - j.fromX) * eased;
        const y = j.fromY + (j.toY - j.fromY) * eased;

        // Rotate toward movement direction (smooth interpolation)
        const dx = j.toX - j.fromX;
        const dy = j.toY - j.fromY;
        if (dx * dx + dy * dy > 1) {
          const targetAngle = Math.atan2(dy, dx) * (180 / Math.PI) + 90;
          // Shortest-path rotation
          let diff = targetAngle - j.angle;
          if (diff > 180) diff -= 360;
          if (diff < -180) diff += 360;
          j.angle += diff * 0.03;
        }

        // Bell pulsing — like a real jellyfish contracting
        j.pulsePhase += j.pulseSpeed * dt;
        const scaleX = 1 + Math.sin(j.pulsePhase) * 0.04;
        const scaleY = 1 - Math.sin(j.pulsePhase) * 0.06;

        // Gentle sway overlay
        const sway = Math.sin(now * 0.0008 + j.seed) * 3;

        j.el.style.transform = `translate3d(${x - j.size / 2}px,${y - j.size / 2}px,0) rotate(${j.angle + sway}deg) scaleX(${scaleX}) scaleY(${scaleY})`;
      }

      rafRef.current = requestAnimationFrame(animate);
    }

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(rafRef.current);
      for (const j of jellies) j.el.remove();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      style={{
        position: "fixed",
        inset: 0,
        overflow: "hidden",
        pointerEvents: "none",
        zIndex: 1,
      }}
    />
  );
}
