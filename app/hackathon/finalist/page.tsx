"use client";

import { useEffect, useRef, useState } from "react";

const HS_FINALISTS = [
  "Popipo",
  "แล้วแต่จะคิด ชีวิตคนละแบบ",
  "Scrooge",
  "ผัดเห็ดใส่บลอกคอลี่",
  "Lizard 🦎",
];

const UNI_FINALISTS = [
  "ParaChoose Me",
  "SamoiAdventure",
  "BB",
  "Heart4you",
  "123.tungtung67",
];

function StarCanvas() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    for (let i = 0; i < 140; i++) {
      const x = Math.random() * canvas.width;
      const y = Math.random() * canvas.height;
      const r = Math.random() * 1.4 + 0.3;
      const alpha = Math.random() * 0.7 + 0.3;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,255,255,${alpha})`;
      ctx.fill();
    }
  }, []);
  return <canvas ref={ref} className="absolute inset-0 w-full h-full pointer-events-none z-0" />;
}

function SvgCanvas({ src, style }: { src: string; style?: React.CSSProperties }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = ref.current;
      if (!canvas) return;
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d");
      ctx?.drawImage(img, 0, 0);
    };
    img.src = src;
  }, [src]);
  return <canvas ref={ref} style={style} />;
}

function Creatures() {
  return (
    <>
      <div className="absolute top-[10%] -left-[7%] pointer-events-none z-0">
        <img src="/hackathon/Creature/Jellyfish 1.svg" alt=""
          style={{ width: "clamp(100px, 22%, 180px)", height: "auto", filter: "drop-shadow(0 0 40px rgba(145,196,227,0.3))", transform: "scaleX(-1)" }} />
      </div>
      <div className="absolute top-[30%] left-[80%] pointer-events-none z-0">
        <img src="/hackathon/Creature/Jellyfish 1.svg" alt=""
          style={{ width: "clamp(120px, 26%, 210px)", height: "auto", filter: "drop-shadow(0 0 40px rgba(165,148,186,0.3))" }} />
      </div>
      <div className="absolute bottom-[4%] right-[60%] pointer-events-none z-0" style={{ transform: "rotate(-10deg)" }}>
        <SvgCanvas src="/hackathon/Creature/Small Jelly.svg"
          style={{ width: "clamp(60px, 14%, 110px)", height: "auto", filter: "drop-shadow(0 0 12px rgba(165,148,186,0.4))" }} />
      </div>
      <div className="absolute bottom-[8%] right-[4%] pointer-events-none z-0" style={{ transform: "scaleX(-1) rotate(25deg)" }}>
        <SvgCanvas src="/hackathon/Creature/Clione.svg"
          style={{ width: "clamp(50px, 11%, 90px)", height: "auto", filter: "drop-shadow(0 0 16px rgba(145,196,227,0.4))" }} />
      </div>
    </>
  );
}

// Slide 1 — Grand title
function Slide0() {
  return (
    <div className="relative overflow-hidden w-full h-full" style={{ background: "#03050a" }}>
      <StarCanvas />
      {/* Gold radial glow behind title */}
      <div className="absolute pointer-events-none z-0" style={{
        top: "30%", left: "50%", transform: "translate(-50%, -50%)",
        width: "80%", height: "50%",
        background: "radial-gradient(ellipse, rgba(200,160,50,0.12) 0%, transparent 70%)",
        filter: "blur(40px)",
      }} />
      <Creatures />
      {/* Logo — top 12% */}
      <div className="absolute left-0 right-0 flex justify-center z-10" style={{ top: "12%", padding: "0 8%", filter: "drop-shadow(0 0 30px rgba(145,196,227,0.4))" }}>
        <img src="/hackathon/HackLogo.png" alt="The Next Decade"
          style={{ width: "clamp(180px, 70%, 420px)", height: "auto", objectFit: "contain" }} />
      </div>

      {/* Grand title — top 36% */}
      <div className="absolute left-0 right-0 flex flex-col items-center text-center z-10" style={{ top: "36%" }}>
        <p style={{
          fontFamily: "var(--font-poppins), sans-serif",
          fontWeight: 600,
          fontSize: "clamp(0.7rem, 2vw, 1.2rem)",
          letterSpacing: "0.35em",
          color: "rgba(200,160,50,0.85)",
          textTransform: "uppercase",
          marginBottom: "0.3em",
        }}>
          Announcing the
        </p>
        <h1 style={{
          fontFamily: "var(--font-poppins), sans-serif",
          fontWeight: 900,
          fontSize: "clamp(2rem, 8vw, 5.5rem)",
          lineHeight: 0.95,
          letterSpacing: "-0.02em",
          color: "#f0c040",
          marginBottom: "0.1em",
        }}>
          FINALIST
        </h1>
        <h2 style={{
          fontFamily: "var(--font-poppins), sans-serif",
          fontWeight: 700,
          fontSize: "clamp(1rem, 3.5vw, 2.2rem)",
          color: "rgba(255,255,255,0.95)",
          letterSpacing: "0.05em",
        }}>
          TEAMS
        </h2>
      </div>

      {/* Decorative line — top 62% */}
      <div className="absolute left-0 right-0 flex items-center justify-center gap-3 z-10" style={{ top: "62%", padding: "0 15%" }}>
        <div style={{ flex: 1, height: "1px", background: "linear-gradient(to right, transparent, rgba(200,160,50,0.5))" }} />
        <span style={{ color: "rgba(200,160,50,0.7)", fontSize: "clamp(0.6rem, 1.5vw, 0.9rem)" }}>✦</span>
        <span style={{ color: "rgba(200,160,50,0.9)", fontSize: "clamp(0.8rem, 2vw, 1.1rem)" }}>✦</span>
        <span style={{ color: "rgba(200,160,50,0.7)", fontSize: "clamp(0.6rem, 1.5vw, 0.9rem)" }}>✦</span>
        <div style={{ flex: 1, height: "1px", background: "linear-gradient(to left, transparent, rgba(200,160,50,0.5))" }} />
      </div>

      {/* Thai text — top 68% */}
      <div className="absolute left-0 right-0 text-center z-10" style={{ top: "68%" }}>
        <p style={{
          fontFamily: "var(--font-noto-sans-thai), sans-serif",
          fontSize: "clamp(0.7rem, 1.8vw, 1.1rem)",
          color: "rgba(255,255,255,0.6)",
          lineHeight: 1.8,
        }}>
          ทีมที่ผ่านเข้าสู่รอบสุดท้าย<br />
          The Next Decade Hackathon 2026
        </p>
      </div>
    </div>
  );
}

// Slide 2 — Team list (HS + Uni in one poster)
function Slide1() {
  return (
    <div className="relative overflow-hidden w-full h-full" style={{ background: "#03050a" }}>
      <StarCanvas />
      <div className="absolute pointer-events-none z-0" style={{
        top: "20%", left: "50%", transform: "translateX(-50%)",
        width: "80%", height: "40%",
        background: "radial-gradient(ellipse, rgba(200,160,50,0.07) 0%, transparent 70%)",
        filter: "blur(50px)",
      }} />
      <Creatures />

      {/* Header — top 10% */}
      <div className="absolute left-0 right-0 text-center z-10" style={{ top: "10%", padding: "0 10%" }}>
        <p style={{
          fontFamily: "var(--font-poppins), sans-serif",
          fontWeight: 600,
          fontSize: "clamp(0.6rem, 1.6vw, 1rem)",
          letterSpacing: "0.3em",
          color: "rgba(200,160,50,0.8)",
          textTransform: "uppercase",
          marginBottom: "0.3em",
        }}>The Next Decade 2026</p>
        <h1 style={{
          fontFamily: "var(--font-poppins), sans-serif",
          fontWeight: 900,
          fontSize: "clamp(1.4rem, 5vw, 3rem)",
          lineHeight: 1,
          color: "#f0c040",
        }}>FINALIST TEAMS</h1>
        <div className="flex items-center gap-2 justify-center" style={{ marginTop: "0.5em" }}>
          <div style={{ width: "30%", height: "1px", background: "linear-gradient(to right, transparent, rgba(200,160,50,0.4))" }} />
          <span style={{ color: "rgba(200,160,50,0.6)", fontSize: "0.6rem" }}>✦</span>
          <div style={{ width: "30%", height: "1px", background: "linear-gradient(to left, transparent, rgba(200,160,50,0.4))" }} />
        </div>
      </div>

      {/* Two sections side by side — top 28% */}
      <div className="absolute z-10" style={{ top: "28%", left: "10%", right: "10%", bottom: "8%" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6%", height: "100%" }}>
          {/* Highschool */}
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6%" }}>
              <span style={{
                fontFamily: "var(--font-poppins), sans-serif",
                fontWeight: 700,
                fontSize: "clamp(0.55rem, 1.3vw, 0.8rem)",
                letterSpacing: "0.2em",
                color: "rgba(145,196,227,0.7)",
                textTransform: "uppercase",
                whiteSpace: "nowrap",
              }}>Highschool</span>
              <div style={{ flex: 1, height: "1px", background: "rgba(145,196,227,0.2)" }} />
            </div>
            {HS_FINALISTS.map((t) => (
              <div key={t} style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "5%" }}>
                <span style={{ color: "rgba(200,160,50,0.6)", fontSize: "clamp(0.5rem, 1vw, 0.65rem)", flexShrink: 0 }}>✦</span>
                <p style={{
                  fontFamily: "var(--font-noto-sans-thai), var(--font-poppins), sans-serif",
                  fontSize: "clamp(0.75rem, 2vw, 1.15rem)",
                  fontWeight: 700,
                  color: "rgba(255,255,255,0.92)",
                  lineHeight: 1.4,
                  margin: 0,
                }}>{t}</p>
              </div>
            ))}
          </div>

          {/* University */}
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6%" }}>
              <span style={{
                fontFamily: "var(--font-poppins), sans-serif",
                fontWeight: 700,
                fontSize: "clamp(0.55rem, 1.3vw, 0.8rem)",
                letterSpacing: "0.2em",
                color: "rgba(145,196,227,0.7)",
                textTransform: "uppercase",
                whiteSpace: "nowrap",
              }}>University</span>
              <div style={{ flex: 1, height: "1px", background: "rgba(145,196,227,0.2)" }} />
            </div>
            {UNI_FINALISTS.map((t) => (
              <div key={t} style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "5%" }}>
                <span style={{ color: "rgba(200,160,50,0.6)", fontSize: "clamp(0.5rem, 1vw, 0.65rem)", flexShrink: 0 }}>✦</span>
                <p style={{
                  fontFamily: "var(--font-noto-sans-thai), var(--font-poppins), sans-serif",
                  fontSize: "clamp(0.75rem, 2vw, 1.15rem)",
                  fontWeight: 700,
                  color: "rgba(255,255,255,0.92)",
                  lineHeight: 1.4,
                  margin: 0,
                }}>{t}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

const SLIDES = [Slide0, Slide1];
const SLIDE_NAMES = ["finalist-title", "finalist-teams"];

export default function FinalistPage() {
  const [page, setPage] = useState(0);
  const posterRef = useRef<HTMLDivElement>(null);
  const [posterSize, setPosterSize] = useState({ w: 0, h: 0 });

  // Compute explicit pixel dimensions from the wrapper so html2canvas sees correct size
  useEffect(() => {
    function measure() {
      const el = posterRef.current;
      if (!el) return;
      const w = el.offsetWidth;
      const h = Math.round(w * 5 / 4);
      setPosterSize({ w, h });
    }
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  async function handleDownload() {
    if (!posterRef.current) return;
    const html2canvas = (await import("html2canvas")).default;
    const el = posterRef.current;
    const w = el.offsetWidth;
    const h = Math.round(w * 5 / 4);
    const canvas = await html2canvas(el, {
      scale: 3,
      useCORS: true,
      allowTaint: true,
      backgroundColor: "#03050a",
      logging: false,
      imageTimeout: 0,
      width: w,
      height: h,
    });
    const link = document.createElement("a");
    link.download = `${SLIDE_NAMES[page]}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  }

  const posterW = "min(90vw, calc(90vh * 4 / 5))";
  const posterH = posterSize.h > 0 ? `${posterSize.h}px` : "min(calc(90vw * 5/4), 90vh)";

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "#ffffff" }}>
      <style jsx global>{`
        @keyframes twinkle {
          0%, 100% { opacity: 0.2; transform: scale(0.8); }
          50%       { opacity: 1;   transform: scale(1);   }
        }
      `}</style>

      <div className="flex flex-col items-center gap-3">
        {/* Download button */}
        <button
          onClick={handleDownload}
          className="flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-all"
          style={{
            background: "#03050a",
            border: "1px solid rgba(200,160,50,0.4)",
            color: "#f0c040",
            fontFamily: "var(--font-poppins), sans-serif",
            cursor: "pointer",
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
          Download PNG
        </button>

        {/* Poster + nav */}
        <div className="flex items-center gap-4">
          {/* Prev */}
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            className="flex items-center justify-center rounded-full transition-all"
            style={{
              width: "clamp(36px, 4vw, 52px)", height: "clamp(36px, 4vw, 52px)",
              background: page === 0 ? "rgba(0,0,0,0.05)" : "rgba(200,160,50,0.12)",
              border: `1px solid ${page === 0 ? "rgba(0,0,0,0.1)" : "rgba(200,160,50,0.3)"}`,
              color: page === 0 ? "rgba(0,0,0,0.2)" : "#f0c040",
              cursor: page === 0 ? "default" : "pointer", flexShrink: 0,
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>

          {/* Poster — explicit width + height so html2canvas matches */}
          <div
            ref={posterRef}
            className="relative overflow-hidden"
            style={{ width: posterW, height: posterH }}
          >
            {SLIDES.map((Slide, i) => (
              <div key={i} className="absolute inset-0 transition-opacity duration-500"
                style={{ opacity: page === i ? 1 : 0, pointerEvents: page === i ? "auto" : "none" }}>
                <Slide />
              </div>
            ))}
            {/* Dots */}
            <div className="absolute bottom-[2.5%] left-1/2 -translate-x-1/2 flex gap-2 z-20">
              {SLIDES.map((_, i) => (
                <button key={i} onClick={() => setPage(i)} style={{
                  width: page === i ? "20px" : "6px", height: "6px", borderRadius: "3px",
                  background: page === i ? "#f0c040" : "rgba(255,255,255,0.25)",
                  border: "none", cursor: "pointer", transition: "all 0.3s ease", padding: 0,
                }} />
              ))}
            </div>
          </div>

          {/* Next */}
          <button
            onClick={() => setPage((p) => Math.min(SLIDES.length - 1, p + 1))}
            disabled={page === SLIDES.length - 1}
            className="flex items-center justify-center rounded-full transition-all"
            style={{
              width: "clamp(36px, 4vw, 52px)", height: "clamp(36px, 4vw, 52px)",
              background: page === SLIDES.length - 1 ? "rgba(0,0,0,0.05)" : "rgba(200,160,50,0.12)",
              border: `1px solid ${page === SLIDES.length - 1 ? "rgba(0,0,0,0.1)" : "rgba(200,160,50,0.3)"}`,
              color: page === SLIDES.length - 1 ? "rgba(0,0,0,0.2)" : "#f0c040",
              cursor: page === SLIDES.length - 1 ? "default" : "pointer", flexShrink: 0,
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
