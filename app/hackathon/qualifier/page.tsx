"use client";

import { useEffect, useRef, useState } from "react";

const HIGHSCHOOL_TEAMS = [
  "แล้วแต่จะคิด",
  "Med Hack",
  "มะลิผัดเผ็ด",
  "polcasan",
  "ABCDerma",
  "Popipo",
  "ShineBright",
  "nosleepdev",
  "Lizard 🦎",
  "เจ๋งๆมาดึงหน่อย",
  "หมูหย็อง",
  "ไอเลิฟเก",
  "mm to the ns",
  "ทีมนี้ดีมากคับ",
  "Beginnixxs",
  "ผัดเห็ดใส่บลอกคอลี่",
  "sushi",
  "ไม่หมูอาบูดาบี",
  "Scrooge",
  "Care-khun",
];

const UNI_TEAMS = [
  "หมอมาแล้วครับ",
  "Honkatack",
  "123.tungtung67",
  "Heart4you",
  "SamoiAdventure",
  "BB",
  "No limits",
  "GoodDoctor",
  "ParaChoose Me",
  "Raksa Jai",
];

// Draw stars on a canvas so html2canvas captures them correctly
function StarCanvas() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    for (let i = 0; i < 120; i++) {
      const x = Math.random() * canvas.width;
      const y = Math.random() * canvas.height;
      const r = Math.random() * 1.2 + 0.3;
      const alpha = Math.random() * 0.7 + 0.3;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,255,255,${alpha})`;
      ctx.fill();
    }
  }, []);
  return <canvas ref={ref} className="absolute inset-0 w-full h-full pointer-events-none z-0" />;
}

// Renders an SVG that contains embedded raster images via a canvas,
// so html2canvas can capture it correctly.
function SvgCanvas({ src, style, className }: { src: string; style?: React.CSSProperties; className?: string }) {
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
  return <canvas ref={ref} className={className} style={style} />;
}

function Creatures() {
  return (
    <>
      {/* Jellyfish top-left */}
      <div className="absolute top-[10%] -left-[7%] pointer-events-none z-0">
        <img src="/hackathon/Creature/Jellyfish 1.svg" alt=""
          style={{ width: "clamp(100px, 22%, 180px)", height: "auto", filter: "drop-shadow(0 0 40px rgba(145,196,227,0.3))", transform: "scaleX(-1)" }} />
      </div>
      {/* Jellyfish top-right */}
      <div className="absolute top-[30%] left-[80%] pointer-events-none z-0">
        <img src="/hackathon/Creature/Jellyfish 1.svg" alt=""
          style={{ width: "clamp(120px, 26%, 210px)", height: "auto", filter: "drop-shadow(0 0 40px rgba(165,148,186,0.3))" }} />
      </div>
      {/* Small Jelly bottom-left — rendered via canvas for html2canvas compat */}
      <div className="absolute bottom-[4%] right-[60%] pointer-events-none z-0" style={{ transform: "rotate(-10deg)" }}>
        <SvgCanvas
          src="/hackathon/Creature/Small Jelly.svg"
          style={{ width: "clamp(60px, 14%, 110px)", height: "auto", filter: "drop-shadow(0 0 12px rgba(165,148,186,0.4))" }}
        />
      </div>
      {/* Clione bottom-right — rendered via canvas for html2canvas compat */}
      <div className="absolute bottom-[8%] right-[4%] pointer-events-none z-0" style={{ transform: "scaleX(-1) rotate(25deg)" }}>
        <SvgCanvas
          src="/hackathon/Creature/Clione.svg"
          style={{ width: "clamp(50px, 11%, 90px)", height: "auto", filter: "drop-shadow(0 0 16px rgba(145,196,227,0.4))" }}
        />
      </div>
    </>
  );
}

// Team list — numbered rows, two columns
function TeamGrid({ teams, large }: { teams: string[]; large?: boolean }) {
  const half = Math.ceil(teams.length / 2);
  const left = teams.slice(0, half);
  const right = teams.slice(half);

  const TeamItem = ({ name }: { name: string }) => (
    <p style={{
      fontFamily: "var(--font-noto-sans-thai), var(--font-poppins), sans-serif",
      fontSize: large ? "clamp(0.9rem, 2.4vw, 1.4rem)" : "clamp(0.65rem, 1.7vw, 1rem)",
      fontWeight: 600,
      color: "rgba(255,255,255,0.92)",
      lineHeight: large ? 2.6 : 2.2,
    }}>{name}</p>
  );

  return (
    <div className="grid grid-cols-2 gap-x-[8%] w-full h-full">
      <div>
        {left.map((t) => <TeamItem key={t} name={t} />)}
      </div>
      <div>
        {right.map((t) => <TeamItem key={t} name={t} />)}
      </div>
    </div>
  );
}

function Slide0() {
  return (
    <div className="relative overflow-hidden w-full h-full" style={{ background: "#03050a" }}>
      <StarCanvas />
      <Creatures />
      <div className="absolute inset-0 flex flex-col items-center justify-center px-[8%] text-center z-10 gap-[3%]">
        <div className="logo-glow flex justify-center w-full">
          <img src={`${typeof window !== "undefined" ? window.location.origin : ""}/hackathon/HackLogo.png`} alt="The Next Decade" style={{ width: "80%", height: "auto", objectFit: "contain" }} />
        </div>
        <div>
          <h1 style={{
            fontFamily: "var(--font-poppins), sans-serif",
            fontWeight: 800,
            fontSize: "clamp(1.4rem, 5vw, 3.2rem)",
            color: "#ffffff",
            textShadow: "0 0 40px rgba(145,196,227,0.5), 0 0 80px rgba(145,196,227,0.2)",
            lineHeight: 1.2,
          }}>
            CONGRATULATIONS
          </h1>
          <h2 style={{
            fontFamily: "var(--font-poppins), sans-serif",
            fontWeight: 700,
            fontSize: "clamp(1rem, 3.2vw, 2rem)",
            color: "rgba(145,196,227,0.9)",
            textShadow: "0 0 20px rgba(145,196,227,0.4)",
            marginTop: "0.3em",
          }}>
            TO ALL QUALIFIED TEAMS
          </h2>
        </div>
        <p style={{
          fontFamily: "var(--font-noto-sans-thai), sans-serif",
          fontSize: "clamp(0.75rem, 2vw, 1.2rem)",
          color: "rgba(255,255,255,0.65)",
          lineHeight: 1.7,
        }}>
          ยินดีกับทุกทีมที่ผ่านเข้ารอบ<br />
          พร้อมก้าวสู่การเดินทางครั้งต่อไป
        </p>
      </div>
    </div>
  );
}

function Slide1() {
  return (
    <div className="relative overflow-hidden w-full h-full" style={{ background: "#03050a" }}>
      <StarCanvas />
      <Creatures />
      <div className="absolute inset-0 flex flex-col items-center px-[10%] pt-[16%] pb-[5%] z-10 gap-[7%]">
        {/* Title */}
        <div className="text-center">
          <p style={{ fontFamily: "var(--font-poppins), sans-serif", fontWeight: 600, fontSize: "clamp(0.8rem, 2.2vw, 1.3rem)", color: "rgba(145,196,227,0.8)" }}>
            Greeting to
          </p>
          <h1 style={{ fontFamily: "var(--font-poppins), sans-serif", fontWeight: 800, fontSize: "clamp(1.3rem, 4.5vw, 2.8rem)", color: "#ffffff", textShadow: "0 0 40px rgba(145,196,227,0.5)", lineHeight: 1.1 }}>
            HIGHSCHOOL<br />qualifiers
          </h1>
          <div style={{ width: "40%", height: "1px", background: "rgba(145,196,227,0.2)", margin: "0.6em auto 0" }} />
        </div>

        {/* Team list */}
        <div className="w-full flex-1 pl-[18%] pr-[2%] flex items-center">
          <TeamGrid teams={HIGHSCHOOL_TEAMS} />
        </div>
      </div>
    </div>
  );
}

function Slide2() {
  return (
    <div className="relative overflow-hidden w-full h-full" style={{ background: "#03050a" }}>
      <StarCanvas />
      <Creatures />
      <div className="absolute inset-0 flex flex-col items-center px-[10%] pt-[16%] pb-[5%] z-10 gap-[7%]">
        {/* Title */}
        <div className="text-center">
          <p style={{ fontFamily: "var(--font-poppins), sans-serif", fontWeight: 600, fontSize: "clamp(0.8rem, 2.2vw, 1.3rem)", color: "rgba(145,196,227,0.8)" }}>
            Greeting to
          </p>
          <h1 style={{ fontFamily: "var(--font-poppins), sans-serif", fontWeight: 800, fontSize: "clamp(1.3rem, 4.5vw, 2.8rem)", color: "#ffffff", textShadow: "0 0 40px rgba(145,196,227,0.5)", lineHeight: 1.1 }}>
            UNIVERSITY<br />qualifiers
          </h1>
          <div style={{ width: "40%", height: "1px", background: "rgba(145,196,227,0.2)", margin: "0.6em auto 0" }} />
        </div>

        {/* Team list */}
        <div className="w-full flex-1 pl-[18%] pr-[2%] flex items-center">
          <TeamGrid teams={UNI_TEAMS} large />
        </div>
      </div>
    </div>
  );
}

const SLIDES = [Slide0, Slide1, Slide2];

const SLIDE_NAMES = ["congrats", "highschool", "university"];

export default function QualifierPage() {
  const [page, setPage] = useState(0);
  const posterRef = useRef<HTMLDivElement>(null);

  async function handleDownload() {
    if (!posterRef.current) return;
    const html2canvas = (await import("html2canvas")).default;
    const canvas = await html2canvas(posterRef.current, {
      scale: 3,
      useCORS: true,
      allowTaint: true,
      backgroundColor: "#03050a",
      logging: false,
      imageTimeout: 0,
    });
    const link = document.createElement("a");
    link.download = `qualifier-${SLIDE_NAMES[page]}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  }

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "#ffffff" }}>
      <style jsx global>{`
        @keyframes twinkle {
          0%, 100% { opacity: 0.2; transform: scale(0.8); }
          50%       { opacity: 1;   transform: scale(1);   }
        }
        @keyframes logoGlow {
          0%, 100% { filter: drop-shadow(0 0 30px rgba(145,196,227,0.3)); }
          50%       { filter: drop-shadow(0 0 60px rgba(145,196,227,0.6)); }
        }
        .logo-glow { animation: logoGlow 3s ease-in-out infinite; }
      `}</style>

      {/* Outer wrapper */}
      <div className="flex flex-col items-center gap-3">

      {/* Download button */}
      <button
        onClick={handleDownload}
        className="flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-all"
        style={{
          background: "#03050a",
          border: "1px solid rgba(101,171,252,0.3)",
          color: "#91C4E3",
          fontFamily: "var(--font-poppins), sans-serif",
          cursor: "pointer",
        }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
        </svg>
        Download PNG
      </button>

      {/* poster + nav buttons */}
      <div className="flex items-center gap-4">

        {/* Prev button */}
        <button
          onClick={() => setPage((p) => Math.max(0, p - 1))}
          disabled={page === 0}
          className="flex items-center justify-center rounded-full transition-all"
          style={{
            width: "clamp(36px, 4vw, 52px)",
            height: "clamp(36px, 4vw, 52px)",
            background: page === 0 ? "rgba(255,255,255,0.05)" : "rgba(101,171,252,0.15)",
            border: "1px solid rgba(101,171,252,0.25)",
            color: page === 0 ? "rgba(255,255,255,0.2)" : "#91C4E3",
            cursor: page === 0 ? "default" : "pointer",
            flexShrink: 0,
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>

        {/* Poster */}
        <div
          ref={posterRef}
          className="relative overflow-hidden"
          style={{
            width: "min(90vw, calc(90vh * 4/5))",
            aspectRatio: "4 / 5",
          }}
        >
          {SLIDES.map((Slide, i) => (
            <div
              key={i}
              className="absolute inset-0 transition-opacity duration-500"
              style={{ opacity: page === i ? 1 : 0, pointerEvents: page === i ? "auto" : "none" }}
            >
              <Slide />
            </div>
          ))}

          {/* Dot indicators */}
          <div className="absolute bottom-[2.5%] left-1/2 -translate-x-1/2 flex gap-2 z-20">
            {SLIDES.map((_, i) => (
              <button
                key={i}
                onClick={() => setPage(i)}
                style={{
                  width: page === i ? "20px" : "6px",
                  height: "6px",
                  borderRadius: "3px",
                  background: page === i ? "#91C4E3" : "rgba(255,255,255,0.25)",
                  border: "none",
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                  padding: 0,
                }}
              />
            ))}
          </div>
        </div>

        {/* Next button */}
        <button
          onClick={() => setPage((p) => Math.min(SLIDES.length - 1, p + 1))}
          disabled={page === SLIDES.length - 1}
          className="flex items-center justify-center rounded-full transition-all"
          style={{
            width: "clamp(36px, 4vw, 52px)",
            height: "clamp(36px, 4vw, 52px)",
            background: page === SLIDES.length - 1 ? "rgba(255,255,255,0.05)" : "rgba(101,171,252,0.15)",
            border: "1px solid rgba(101,171,252,0.25)",
            color: page === SLIDES.length - 1 ? "rgba(255,255,255,0.2)" : "#91C4E3",
            cursor: page === SLIDES.length - 1 ? "default" : "pointer",
            flexShrink: 0,
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
