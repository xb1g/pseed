"use client";

import { useEffect, useRef, useState } from "react";
import QRCode from "react-qr-code";

const SCHEDULE = [
  { time: "10:00 – 10:30 น.", label: "กล่าวเปิดงานและแนะนำการแข่งขัน" },
  { time: "10:30 – 12:00 น.", label: "รอบนำเสนอระดับมัธยมศึกษา" },
  { time: "12:00 – 13:00 น.", label: "พักรับประทานอาหารกลางวัน" },
  { time: "13:00 – 14:30 น.", label: "รอบนำเสนอระดับมหาวิทยาลัย" },
  { time: "14:30 – 15:00 น.", label: "ประกาศผล สรุปกิจกรรม และ Networking" },
];

const MAPS_URL = "https://maps.app.goo.gl/UdVwbXWhKDuPe9sf6";

function StarCanvas() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    for (let i = 0; i < 160; i++) {
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

function Creatures() {
  return (
    <>
      <div className="absolute top-[6%] -left-[5%] pointer-events-none z-0">
        <img src="/hackathon/Creature/Jellyfish 1.svg" alt=""
          style={{ width: "clamp(80px, 18%, 150px)", height: "auto", filter: "drop-shadow(0 0 30px rgba(145,196,227,0.3))", transform: "scaleX(-1)" }} />
      </div>
      <div className="absolute top-[30%] right-[-4%] pointer-events-none z-0">
        <img src="/hackathon/Creature/Jellyfish 1.svg" alt=""
          style={{ width: "clamp(90px, 20%, 170px)", height: "auto", filter: "drop-shadow(0 0 30px rgba(165,148,186,0.3))" }} />
      </div>
      <div className="absolute bottom-[4%] left-[55%] pointer-events-none z-0" style={{ transform: "rotate(-10deg)" }}>
        <img src="/hackathon/Creature/Small Jelly.svg" alt=""
          style={{ width: "clamp(50px, 10%, 90px)", height: "auto", filter: "drop-shadow(0 0 12px rgba(165,148,186,0.4))" }} />
      </div>
    </>
  );
}

function Divider() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "6px", width: "100%", flexShrink: 0 }}>
      <div style={{ flex: 1, height: "1px", background: "linear-gradient(to right, transparent, rgba(200,160,50,0.35))" }} />
      <span style={{ color: "rgba(200,160,50,0.5)", fontSize: "0.5rem" }}>✦</span>
      <div style={{ flex: 1, height: "1px", background: "linear-gradient(to left, transparent, rgba(200,160,50,0.35))" }} />
    </div>
  );
}

export default function FinalistOnsitePage() {
  const posterRef = useRef<HTMLDivElement>(null);
  const [posterH, setPosterH] = useState<string>("min(calc(90vw * 5/4), 90vh)");

  useEffect(() => {
    function measure() {
      const el = posterRef.current;
      if (!el) return;
      setPosterH(`${Math.round(el.offsetWidth * 5 / 4)}px`);
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
    link.download = "finalist-onsite.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
  }

  const posterW = "min(90vw, calc(90vh * 4 / 5))";

  return (
    <div className="min-h-screen flex items-center justify-center py-6" style={{ background: "#f5f5f5" }}>
      <div className="flex flex-col items-center gap-3">
        <button
          onClick={handleDownload}
          className="flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold"
          style={{
            background: "#03050a",
            border: "1px solid rgba(200,160,50,0.4)",
            color: "#f0c040",
            fontFamily: "var(--font-poppins), sans-serif",
            cursor: "pointer",
            transition: "border-color 0.15s ease, background 0.15s ease",
          }}
          onMouseEnter={e => (e.currentTarget.style.borderColor = "rgba(200,160,50,0.8)")}
          onMouseLeave={e => (e.currentTarget.style.borderColor = "rgba(200,160,50,0.4)")}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
          Download PNG
        </button>

        <div
          ref={posterRef}
          className="relative overflow-hidden"
          style={{ width: posterW, height: posterH, background: "#03050a" }}
        >
          <StarCanvas />

          {/* Ambient glows */}
          <div className="absolute pointer-events-none z-0" style={{
            top: "15%", left: "50%", transform: "translateX(-50%)",
            width: "80%", height: "45%",
            background: "radial-gradient(ellipse, rgba(200,160,50,0.09) 0%, transparent 70%)",
            filter: "blur(50px)",
          }} />
          <div className="absolute pointer-events-none z-0" style={{
            bottom: "10%", left: "50%", transform: "translateX(-50%)",
            width: "60%", height: "30%",
            background: "radial-gradient(ellipse, rgba(145,196,227,0.05) 0%, transparent 70%)",
            filter: "blur(40px)",
          }} />

          <Creatures />

          {/* Content */}
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-start"
            style={{ padding: "19% 10% 5%" }}>

            {/* Logo */}
            <img src="/hackathon/HackLogo.png" alt="The Next Decade"
              style={{ width: "clamp(110px, 38%, 220px)", height: "auto", marginBottom: "2.5%", filter: "drop-shadow(0 0 24px rgba(145,196,227,0.35))", flexShrink: 0 }} />

            {/* Title block */}
            <div className="flex flex-col items-center text-center" style={{ marginBottom: "2.5%", flexShrink: 0 }}>
              <p style={{
                fontFamily: "var(--font-poppins), sans-serif",
                fontWeight: 600,
                fontSize: "clamp(0.5rem, 1.4vw, 0.85rem)",
                letterSpacing: "0.3em",
                color: "rgba(200,160,50,0.8)",
                textTransform: "uppercase",
                marginBottom: "0.2em",
              }}>The Next Decade Hackathon 2026</p>
              <h1 style={{
                fontFamily: "var(--font-poppins), sans-serif",
                fontWeight: 900,
                fontSize: "clamp(1.6rem, 6vw, 3.8rem)",
                lineHeight: 0.95,
                color: "#f0c040",
                letterSpacing: "-0.02em",
                marginBottom: "0.12em",
                textWrap: "balance",
              }}>ONSITE</h1>
              <h2 style={{
                fontFamily: "var(--font-poppins), sans-serif",
                fontWeight: 700,
                fontSize: "clamp(0.7rem, 2.2vw, 1.3rem)",
                color: "rgba(255,255,255,0.88)",
                letterSpacing: "0.1em",
              }}>FINALIST PITCHING DAY</h2>
              <p style={{
                fontFamily: "var(--font-poppins), sans-serif",
                fontSize: "clamp(0.5rem, 1.2vw, 0.75rem)",
                color: "rgba(255,255,255,0.9)",
                marginTop: "0.45em",
              }}>20 / 6 / 2026</p>
            </div>

            <Divider />

            {/* Schedule + Location */}
            <div style={{
              display: "grid",
              gridTemplateColumns: "1fr auto",
              gap: "6%",
              marginTop: "2.5%",
              width: "100%",
              alignItems: "start",
              flexShrink: 0,
            }}>
              {/* Schedule */}
              <div>
                <p style={{
                  fontFamily: "var(--font-poppins), sans-serif",
                  fontWeight: 700,
                  fontSize: "clamp(0.42rem, 1.1vw, 0.65rem)",
                  letterSpacing: "0.22em",
                  color: "rgba(200,160,50,0.75)",
                  textTransform: "uppercase",
                  marginBottom: "0.9em",
                }}>กำหนดการ</p>
                {SCHEDULE.map((item, i) => (
                  <div key={i} style={{ display: "flex", gap: "10px", marginBottom: "0.45em", alignItems: "baseline" }}>
                    <span style={{
                      fontFamily: "var(--font-poppins), sans-serif",
                      fontSize: "clamp(0.5rem, 1.1vw, 0.72rem)",
                      fontWeight: 600,
                      color: "rgba(200,160,50,0.7)",
                      whiteSpace: "nowrap",
                      flexShrink: 0,
                      minWidth: "clamp(70px, 13vw, 92px)",
                    }}>{item.time}</span>
                    <span style={{
                      display: "inline-block",
                      width: "1px",
                      height: "0.75em",
                      background: "rgba(200,160,50,0.2)",
                      flexShrink: 0,
                      alignSelf: "center",
                    }} />
                    <p style={{
                      fontFamily: "var(--font-poppins), sans-serif",
                      fontSize: "clamp(0.62rem, 1.4vw, 0.9rem)",
                      color: "rgba(255,255,255,0.8)",
                      lineHeight: 1.5,
                      margin: 0,
                    }}>{item.label}</p>
                  </div>
                ))}
              </div>

              {/* Location QR */}
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "5px" }}>
                <p style={{
                  fontFamily: "var(--font-poppins), sans-serif",
                  fontWeight: 700,
                  fontSize: "clamp(0.38rem, 0.9vw, 0.58rem)",
                  letterSpacing: "0.2em",
                  color: "rgba(200,160,50,0.75)",
                  textTransform: "uppercase",
                  textAlign: "center",
                }}>Location</p>

                {/* QR code */}
                <div style={{
                  background: "#ffffff",
                  borderRadius: "6px",
                  padding: "6px",
                  width: "clamp(72px, 14vw, 104px)",
                  height: "clamp(72px, 14vw, 104px)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}>
                  <QRCode
                    value={MAPS_URL}
                    style={{ width: "100%", height: "100%" }}
                    fgColor="#03050a"
                    bgColor="transparent"
                  />
                </div>

                {/* Venue logo */}
                <div style={{
                  background: "#ffffff",
                  borderRadius: "6px",
                  padding: "5px 8px",
                  width: "clamp(72px, 14vw, 104px)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}>
                  <img
                    src="/hackathon/ZenicHub.png"
                    alt="ZenicHub"
                    style={{ width: "100%", height: "auto", objectFit: "contain" }}
                  />
                </div>

                <p style={{
                  fontFamily: "var(--font-poppins), sans-serif",
                  fontSize: "clamp(0.33rem, 0.75vw, 0.48rem)",
                  color: "rgba(255,255,255,0.38)",
                  textAlign: "center",
                  lineHeight: 1.4,
                }}>สแกนเพื่อดูสถานที่</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
