"use client";

import { useLang } from "@/lib/hackathon/gallery-lang";

export default function LangToggle({ onHero }: { onHero?: boolean }) {
  const { lang, setLang } = useLang();

  const bg = onHero ? "rgba(255,255,255,0.1)" : "var(--bloom-bg-raised)";
  const border = onHero ? "rgba(255,255,255,0.2)" : "var(--bloom-border-default)";

  return (
    <button
      onClick={() => setLang(lang === "en" ? "th" : "en")}
      aria-label={lang === "en" ? "Switch to Thai" : "Switch to English"}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "0.25rem",
        padding: "0.3rem 0.625rem",
        borderRadius: "8px",
        border: `1px solid ${border}`,
        background: bg,
        cursor: "pointer",
        transition: "background 160ms",
        backdropFilter: "blur(4px)",
      }}
      onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.background = onHero ? "rgba(255,255,255,0.18)" : "var(--bloom-accent-subtle)")}
      onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.background = bg)}
    >
      <span style={{
        fontFamily: "var(--font-bai-jamjuree), sans-serif",
        fontSize: "0.8rem", fontWeight: 700,
        color: lang === "en" ? (onHero ? "#fff" : "var(--bloom-accent)") : (onHero ? "rgba(255,255,255,0.5)" : "var(--bloom-text-muted)"),
        transition: "color 160ms",
      }}>EN</span>
      <span style={{ color: onHero ? "rgba(255,255,255,0.3)" : "var(--bloom-border-default)", fontSize: "0.7rem" }}>|</span>
      <span style={{
        fontFamily: "var(--font-bai-jamjuree), sans-serif",
        fontSize: "0.8rem", fontWeight: 700,
        color: lang === "th" ? (onHero ? "#fff" : "var(--bloom-accent)") : (onHero ? "rgba(255,255,255,0.5)" : "var(--bloom-text-muted)"),
        transition: "color 160ms",
      }}>TH</span>
    </button>
  );
}
