"use client";

import { useEffect, useMemo, useRef } from "react";
import { Mesh, Program, Renderer, Triangle } from "ogl";

function hexToVec4(hex: string): [number, number, number, number] {
  const hexStr = hex.replace("#", "");
  let r = 0;
  let g = 0;
  let b = 0;
  let a = 1;

  if (hexStr.length === 6 || hexStr.length === 8) {
    r = parseInt(hexStr.slice(0, 2), 16) / 255;
    g = parseInt(hexStr.slice(2, 4), 16) / 255;
    b = parseInt(hexStr.slice(4, 6), 16) / 255;
    if (hexStr.length === 8) a = parseInt(hexStr.slice(6, 8), 16) / 255;
  }

  return [r, g, b, a];
}

function normalizeHex(hex: string, fallback = "#22c55e") {
  return /^#[0-9a-f]{6}$/i.test(hex) ? hex : fallback;
}

function mixHex(a: string, b: string, amount: number) {
  const left = hexToVec4(normalizeHex(a));
  const right = hexToVec4(normalizeHex(b));
  const mixed = left.slice(0, 3).map((channel, index) =>
    Math.round((channel * (1 - amount) + right[index] * amount) * 255)
  );
  return `#${mixed.map((value) => value.toString(16).padStart(2, "0")).join("")}`;
}

const vertexShader = `
attribute vec2 uv;
attribute vec2 position;
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position, 0, 1);
}
`;

const fragmentShader = `
precision highp float;

uniform float iTime;
uniform vec3 iResolution;
uniform float uSpinRotation;
uniform float uSpinSpeed;
uniform vec2 uOffset;
uniform vec4 uColor1;
uniform vec4 uColor2;
uniform vec4 uColor3;
uniform float uContrast;
uniform float uLighting;
uniform float uSpinAmount;
uniform float uPixelFilter;
uniform float uSpinEase;
uniform bool uIsRotate;
uniform vec2 uMouse;

varying vec2 vUv;

vec4 effect(vec2 screenSize, vec2 screen_coords) {
  float pixel_size = length(screenSize.xy) / uPixelFilter;
  vec2 uv = (floor(screen_coords.xy * (1.0 / pixel_size)) * pixel_size - 0.5 * screenSize.xy) / length(screenSize.xy) - uOffset;
  float uv_len = length(uv);

  float speed = uSpinRotation * uSpinEase * 0.2;
  if (uIsRotate) {
    speed = iTime * speed;
  }
  speed += 302.2;
  speed += (uMouse.x * 2.0 - 1.0) * 0.1;

  float new_pixel_angle = atan(uv.y, uv.x) + speed - uSpinEase * 20.0 * (uSpinAmount * uv_len + (1.0 - uSpinAmount));
  vec2 mid = (screenSize.xy / length(screenSize.xy)) / 2.0;
  uv = vec2(uv_len * cos(new_pixel_angle) + mid.x, uv_len * sin(new_pixel_angle) + mid.y) - mid;

  uv *= 30.0;
  speed = iTime * uSpinSpeed + (uMouse.x * 2.0 - 1.0) * 2.0;

  vec2 uv2 = vec2(uv.x + uv.y);

  for (int i = 0; i < 5; i++) {
    uv2 += sin(max(uv.x, uv.y)) + uv;
    uv += 0.5 * vec2(
      cos(5.1123314 + 0.353 * uv2.y + speed * 0.131121),
      sin(uv2.x - 0.113 * speed)
    );
    uv -= cos(uv.x + uv.y) - sin(uv.x * 0.711 - uv.y);
  }

  float contrast_mod = 0.25 * uContrast + 0.5 * uSpinAmount + 1.2;
  float paint_res = min(2.0, max(0.0, length(uv) * 0.035 * contrast_mod));
  float c1p = max(0.0, 1.0 - contrast_mod * abs(1.0 - paint_res));
  float c2p = max(0.0, 1.0 - contrast_mod * abs(paint_res));
  float c3p = 1.0 - min(1.0, c1p + c2p);
  float light = (uLighting - 0.2) * max(c1p * 5.0 - 4.0, 0.0) + uLighting * max(c2p * 5.0 - 4.0, 0.0);

  return (0.3 / uContrast) * uColor1 + (1.0 - 0.3 / uContrast) * (uColor1 * c1p + uColor2 * c2p + vec4(c3p * uColor3.rgb, c3p * uColor1.a)) + light;
}

void main() {
  gl_FragColor = effect(iResolution.xy, vUv * iResolution.xy);
}
`;

export function OglTrendBackground({
  accent,
  className = "",
}: {
  accent: string;
  className?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const colors = useMemo(() => {
    const base = normalizeHex(accent);
    return {
      color1: mixHex(base, "#f8fff0", 0.2),
      color2: mixHex(base, "#061014", 0.48),
      color3: mixHex(base, "#030405", 0.76),
    };
  }, [accent]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const renderer = new Renderer({
      dpr: Math.min(window.devicePixelRatio || 1, 2),
      alpha: true,
      antialias: false,
    });
    const gl = renderer.gl;
    gl.clearColor(0, 0, 0, 0);
    gl.canvas.className = "future-outlook-bg-canvas";

    const geometry = new Triangle(gl);
    const program = new Program(gl, {
      vertex: vertexShader,
      fragment: fragmentShader,
      uniforms: {
        iTime: { value: 0 },
        iResolution: {
          value: [1, 1, 1],
        },
        uSpinRotation: { value: -2.0 },
        uSpinSpeed: { value: 1.8 },
        uOffset: { value: [0.0, 0.0] },
        uColor1: { value: hexToVec4(colors.color1) },
        uColor2: { value: hexToVec4(colors.color2) },
        uColor3: { value: hexToVec4(colors.color3) },
        uContrast: { value: 3.2 },
        uLighting: { value: 0.32 },
        uSpinAmount: { value: 0.34 },
        uPixelFilter: { value: 620.0 },
        uSpinEase: { value: 0.95 },
        uIsRotate: { value: true },
        uMouse: { value: [0.5, 0.5] },
      },
    });
    const mesh = new Mesh(gl, { geometry, program });

    const resize = () => {
      const width = Math.max(1, container.offsetWidth);
      const height = Math.max(1, container.offsetHeight);
      renderer.setSize(width, height);
      program.uniforms.iResolution.value = [
        gl.canvas.width,
        gl.canvas.height,
        gl.canvas.width / gl.canvas.height,
      ];
    };

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(container);
    resize();

    let frame = 0;
    const update = (time: number) => {
      frame = requestAnimationFrame(update);
      program.uniforms.iTime.value = time * 0.001;
      renderer.render({ scene: mesh });
    };

    const handlePointerMove = (event: PointerEvent) => {
      const rect = container.getBoundingClientRect();
      program.uniforms.uMouse.value = [
        (event.clientX - rect.left) / Math.max(rect.width, 1),
        1 - (event.clientY - rect.top) / Math.max(rect.height, 1),
      ];
    };

    container.appendChild(gl.canvas);
    container.addEventListener("pointermove", handlePointerMove);
    frame = requestAnimationFrame(update);

    return () => {
      cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      container.removeEventListener("pointermove", handlePointerMove);
      gl.canvas.remove();
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    };
  }, [colors.color1, colors.color2, colors.color3]);

  return <div ref={containerRef} className={`future-outlook-bg ${className}`} aria-hidden="true" />;
}
