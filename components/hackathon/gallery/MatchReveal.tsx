"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Sparkles } from "lucide-react";
import GalleryMascot from "./GalleryMascot";
import ProductCard from "./ProductCard";
import { useLang } from "@/lib/hackathon/gallery-lang";
import { composeWhyText, type ScoredProduct, type VisitorAnswers } from "@/lib/hackathon/gallery-match";

interface MatchRevealProps {
  answers: VisitorAnswers;
  results: ScoredProduct[];
  unmatched: ScoredProduct["product"][];
  onRetake: () => void;
}

type Phase = "thinking" | "revealing" | "revealed";

export default function MatchReveal({ answers, results, unmatched, onRetake }: MatchRevealProps) {
  const { lang } = useLang();
  const [phase, setPhase] = useState<Phase>("thinking");

  useEffect(() => {
    const t1 = setTimeout(() => setPhase("revealing"), 2000);
    const t2 = setTimeout(() => setPhase("revealed"), 2800);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  const topMatch = results[0] ?? null;
  const secondaryMatches = results.slice(1, 4);

  const whyText = topMatch
    ? composeWhyText(
        answers.who,
        answers.what,
        lang === "th" && topMatch.product.product_name_th
          ? topMatch.product.product_name_th
          : topMatch.product.product_name,
        lang === "th" && topMatch.product.problem_statement_th
          ? topMatch.product.problem_statement_th
          : topMatch.product.problem_statement,
        lang
      )
    : null;

  // No match — fallback
  if (!topMatch) {
    return (
      <div style={{
        display: "flex", flexDirection: "column", alignItems: "center",
        gap: "1.5rem", paddingTop: "2rem",
      }}>
        <div style={{ width: "120px", height: "120px", overflow: "hidden" }}>
          <div style={{ transform: "scale(0.5)", transformOrigin: "top left", width: "240px", height: "240px" }}>
            <GalleryMascot />
          </div>
        </div>
        <p style={{
          fontFamily: "var(--font-bai-jamjuree), sans-serif",
          fontSize: "1.125rem",
          color: "var(--bloom-text-primary)",
          textAlign: "center",
          maxWidth: "400px",
          lineHeight: 1.6,
        }}>
          {lang === "th"
            ? "คุณสนใจหลายเรื่องเลย! ลองดูผลงานทั้งหมดได้เลย"
            : "You're interested in everything! Go explore all the products."}
        </p>
        <Link
          href="/hackathon/gallery"
          className="bloom-button"
          style={{ fontSize: "0.9375rem" }}
        >
          <span className="bloom-button__grain" aria-hidden="true" />
          {lang === "th" ? "ดูผลงานทั้งหมด" : "Browse all products"}
        </Link>
      </div>
    );
  }

  return (
    <div
      className="match-reveal"
      style={{
        display: "flex", flexDirection: "column", alignItems: "center",
        gap: "1.5rem",
      }}
    >
      {/* Whale */}
      <div style={{
        width: "120px", height: "120px", flexShrink: 0,
        animation: phase === "thinking" ? "galleryMascotBob 1.5s ease-in-out infinite" : undefined,
      }}>
        <GalleryMascot />
      </div>

      {/* Thinking state */}
      {phase === "thinking" && (
        <p
          className="match-reveal__thinking"
          style={{
            fontFamily: "var(--font-bai-jamjuree), sans-serif",
            fontSize: "1rem",
            color: "var(--bloom-text-secondary)",
            textAlign: "center",
          }}
        >
          {lang === "th" ? "กำลังหาสิ่งที่เหมาะกับคุณ..." : "Finding your perfect match..."}
        </p>
      )}

      {/* Reveal */}
      {(phase === "revealing" || phase === "revealed") && (
        <div
          className="match-reveal__content"
          style={{
            maxWidth: "560px", width: "100%",
            opacity: phase === "revealed" ? 1 : 0,
            transform: phase === "revealed" ? "translateY(0)" : "translateY(16px)",
            transition: "all 600ms cubic-bezier(0.05, 0.7, 0.35, 0.99)",
            display: "flex", flexDirection: "column", gap: "1.5rem",
          }}
        >
          {/* "Built for you" badge */}
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem",
          }}>
            <Sparkles size={16} style={{ color: "var(--bloom-accent)" }} />
            <span style={{
              fontFamily: "var(--font-kodchasan), sans-serif",
              fontSize: "0.8125rem", fontWeight: 700,
              color: "var(--bloom-accent)",
              letterSpacing: "0.06em", textTransform: "uppercase",
            }}>
              {lang === "th" ? "สร้างมาเพื่อคุณ" : "Built for you"}
            </span>
            <Sparkles size={16} style={{ color: "var(--bloom-accent)" }} />
          </div>

          {/* Top match product card — with accent glow */}
          <div
            className="match-reveal__hero-card"
            style={{
              borderRadius: "16px",
              border: "1px solid var(--bloom-border-strong)",
              overflow: "hidden",
            }}
          >
            <ProductCard product={{
              ...topMatch.product,
              product_name_th: topMatch.product.product_name_th ?? undefined,
              problem_statement_th: topMatch.product.problem_statement_th ?? undefined,
            } as any} />
          </div>

          {/* Why text */}
          {whyText && (
            <div
              className="bloom-card"
              style={{
                padding: "1rem 1.25rem",
                borderRadius: "14px",
              }}
            >
              <p style={{
                fontFamily: "var(--font-bai-jamjuree), sans-serif",
                fontSize: "0.9375rem", lineHeight: 1.6,
                color: "var(--bloom-text-secondary)",
                margin: 0, textAlign: "center",
              }}>
                {whyText}
              </p>
            </div>
          )}

          {/* CTA buttons */}
          <div style={{
            display: "flex", gap: "0.75rem", justifyContent: "center", flexWrap: "wrap",
          }}>
            <a
              href={`/hackathon/gallery/${topMatch.product.team_id}`}
              className="bloom-button"
              style={{ fontSize: "0.9375rem", textDecoration: "none" }}
            >
              <span className="bloom-button__grain" aria-hidden="true" />
              {lang === "th" ? "ดูรายละเอียด" : "Learn more"}
            </a>
            <button
              onClick={onRetake}
              className="match-reveal__retake"
              style={{
                padding: "0.75rem 1.5rem",
                borderRadius: "12px",
                border: "1px solid var(--bloom-border-default)",
                background: "transparent",
                fontFamily: "var(--font-bai-jamjuree), sans-serif",
                fontSize: "0.875rem",
                fontWeight: 600,
                color: "var(--bloom-text-secondary)",
                cursor: "pointer",
                transition: "border-color 180ms ease-out, color 180ms ease-out",
              }}
            >
              {lang === "th" ? "ลองใหม่" : "Try again"}
            </button>
          </div>

          {/* Secondary matches */}
          {secondaryMatches.length > 0 && (
            <div style={{ marginTop: "0.5rem" }}>
              <p style={{
                fontFamily: "var(--font-bai-jamjuree), sans-serif",
                fontSize: "0.75rem", fontWeight: 700,
                color: "var(--bloom-text-muted)",
                letterSpacing: "0.06em", textTransform: "uppercase",
                marginBottom: "0.75rem", textAlign: "center",
              }}>
                {lang === "th" ? "คุณอาจสนใจ" : "You might also like"}
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
                {secondaryMatches.map((m) => (
                  <a
                    key={m.product.id}
                    href={`/hackathon/gallery/${m.product.team_id}`}
                    className="match-reveal__secondary bloom-card"
                    style={{
                      display: "block", textDecoration: "none",
                      padding: "0.875rem 1rem", borderRadius: "12px",
                    }}
                  >
                    <span style={{
                      fontFamily: "var(--font-kodchasan), sans-serif",
                      fontSize: "0.9375rem", fontWeight: 700,
                      color: "var(--bloom-text-primary)",
                      display: "block",
                    }}>
                      {lang === "th" && m.product.product_name_th ? m.product.product_name_th : m.product.product_name}
                    </span>
                    <span style={{
                      fontFamily: "var(--font-bai-jamjuree), sans-serif",
                      fontSize: "0.8125rem",
                      color: "var(--bloom-text-muted)",
                      display: "block", marginTop: "0.25rem",
                    }}>
                      {m.product.team_name}
                    </span>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* More to explore */}
          {unmatched.length > 0 && (
            <div style={{ textAlign: "center", marginTop: "0.25rem" }}>
              <a
                href="/hackathon/gallery"
                style={{
                  fontFamily: "var(--font-bai-jamjuree), sans-serif",
                  fontSize: "0.8125rem",
                  color: "var(--bloom-text-muted)",
                  textDecoration: "underline",
                  textUnderlineOffset: "3px",
                  transition: "color 180ms",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.color = "var(--bloom-accent)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = "var(--bloom-text-muted)"; }}
              >
                {lang === "th"
                  ? `ดูผลงานอื่นอีก ${unmatched.length} ผลงาน`
                  : `Explore ${unmatched.length} more products`}
              </a>
            </div>
          )}
        </div>
      )}

      <style>{`
        .match-reveal__thinking {
          animation: match-pulse 1.5s ease-in-out infinite;
        }
        @keyframes match-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        .match-reveal__hero-card {
          box-shadow:
            var(--bloom-shadow-card),
            0 0 40px rgba(120, 180, 216, 0.12);
        }
        .match-reveal__retake:hover {
          border-color: var(--bloom-border-strong) !important;
          color: var(--bloom-text-primary) !important;
        }
        .match-reveal__secondary:hover {
          border-color: var(--bloom-border-strong) !important;
          box-shadow: var(--bloom-shadow-hover) !important;
          transform: translateY(-1px);
        }
        @media (prefers-reduced-motion: reduce) {
          .match-reveal__thinking { animation: none !important; }
          .match-reveal__content { transition: opacity 0ms !important; transform: none !important; }
          .match-reveal__secondary { transition: none !important; }
          .match-reveal__hero-card { box-shadow: var(--bloom-shadow-card) !important; }
        }
      `}</style>
    </div>
  );
}
