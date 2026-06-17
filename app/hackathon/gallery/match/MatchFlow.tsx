"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import WhaleChat from "@/components/hackathon/gallery/WhaleChat";
import MatchReveal from "@/components/hackathon/gallery/MatchReveal";
import LangToggle from "@/components/hackathon/gallery/LangToggle";
import ThemeToggle from "@/components/hackathon/gallery/ThemeToggle";
import { useLang } from "@/lib/hackathon/gallery-lang";
import { scoreProducts, type VisitorAnswers, type ScoredProduct } from "@/lib/hackathon/gallery-match";
import type { GalleryProductSummary } from "@/lib/hackathon/gallery";

interface MatchFlowProps {
  products: GalleryProductSummary[];
}

type Stage = "quiz" | "reveal";

function getSessionId(): string {
  const KEY = "gallery-match-session";
  let id = sessionStorage.getItem(KEY);
  if (!id) {
    id = crypto.randomUUID();
    sessionStorage.setItem(KEY, id);
  }
  return id;
}

export default function MatchFlow({ products }: MatchFlowProps) {
  const router = useRouter();
  const { lang } = useLang();
  const [stage, setStage] = useState<Stage>("quiz");
  const [answers, setAnswers] = useState<VisitorAnswers>({ who: null, what: null });
  const [results, setResults] = useState<ScoredProduct[]>([]);
  const [unmatched, setUnmatched] = useState<ScoredProduct["product"][]>([]);

  const handleComplete = useCallback((ans: VisitorAnswers) => {
    setAnswers(ans);

    const scored = scoreProducts(ans, products as any);
    setResults(scored);

    const matchedIds = new Set(scored.map((s) => s.product.id));
    const notMatched = (products as any[]).filter((p: any) => !matchedIds.has(p.id));
    setUnmatched(notMatched);

    if (scored.length > 0) {
      const sessionId = getSessionId();
      fetch("/api/hackathon/gallery/match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product_id: scored[0].product.id,
          session_id: sessionId,
          match_score: scored[0].score,
          answers: ans,
        }),
      }).catch(() => {});
    }

    setStage("reveal");
  }, [products]);

  const handleExplore = useCallback(() => {
    router.push("/hackathon/gallery");
  }, [router]);

  const handleRetake = useCallback(() => {
    setStage("quiz");
    setAnswers({ who: null, what: null });
    setResults([]);
    setUnmatched([]);
  }, []);

  return (
    <>
      {/* Hero band — matches gallery page */}
      <div
        className="bloom-hero"
        style={{ paddingBottom: "clamp(1.5rem, 3vw, 2rem)" }}
      >
        <div className="bloom-hero__grain" aria-hidden="true" />

        {/* Nav — mirrors gallery: logo left, toggles right */}
        <nav
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 clamp(1.25rem, 5vw, 3rem)",
            height: "64px",
          }}
        >
          <a
            href="/hackathon/gallery"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.625rem",
              textDecoration: "none",
            }}
          >
            <img
              src="/hackathon/HackLogo.png"
              alt="The Next Decade Hackathon"
              style={{
                height: "36px",
                width: "auto",
                objectFit: "contain",
                filter: "drop-shadow(0 1px 8px rgba(20,40,80,0.30))",
              }}
            />
          </a>

          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <LangToggle onHero />
            <ThemeToggle />
          </div>
        </nav>

        {/* Hero copy — compact */}
        <header
          style={{
            padding: "clamp(0.75rem, 2vw, 1.5rem) clamp(1.25rem, 5vw, 3rem) 0",
            maxWidth: "1280px",
            margin: "0 auto",
          }}
        >
          <h1
            style={{
              fontFamily: "var(--font-kodchasan), var(--font-libre-franklin), sans-serif",
              fontSize: "clamp(1.5rem, 4vw, 2.25rem)",
              fontWeight: 700,
              lineHeight: 1.15,
              letterSpacing: "-0.025em",
              color: "#ffffff",
              margin: "0 0 0.5rem",
              textShadow: "0 2px 16px rgba(20,40,80,0.35)",
            } as React.CSSProperties}
          >
            {lang === "th" ? "หาสิ่งที่ใช่สำหรับคุณ" : "Find your match"}
          </h1>
          <p
            style={{
              fontFamily: "var(--font-bai-jamjuree), var(--font-libre-franklin), sans-serif",
              fontSize: "clamp(0.875rem, 1.6vw, 1rem)",
              color: "rgba(255,255,255,0.65)",
              lineHeight: 1.6,
              margin: 0,
              maxWidth: "48ch",
            } as React.CSSProperties}
          >
            {lang === "th"
              ? "ตอบคำถามสั้นๆ แล้วปลาวาฬจะช่วยหาผลิตภัณฑ์ที่เหมาะกับคุณ"
              : "Answer a few quick questions and our whale will find the product built for you."}
          </p>
        </header>
      </div>

      {/* Ambient bleed — same as gallery page */}
      <div
        aria-hidden="true"
        style={{
          position: "relative",
          height: 0,
          overflow: "visible",
          pointerEvents: "none",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: "-60px",
            left: "50%",
            transform: "translateX(-50%)",
            width: "70%",
            height: "280px",
            borderRadius: "50%",
            background: "radial-gradient(ellipse at 50% 0%, rgba(70, 120, 180, 0.18) 0%, transparent 70%)",
            filter: "blur(40px)",
            zIndex: 0,
          }}
        />
      </div>

      {/* Content area */}
      <main
        style={{
          position: "relative",
          zIndex: 1,
          maxWidth: "640px",
          margin: "0 auto",
          padding: "clamp(1.5rem, 3vw, 2.5rem) clamp(1.25rem, 5vw, 3rem) 5rem",
        }}
      >
        {stage === "quiz" && (
          <WhaleChat onComplete={handleComplete} onExplore={handleExplore} />
        )}

        {stage === "reveal" && (
          <MatchReveal
            answers={answers}
            results={results}
            unmatched={unmatched}
            onRetake={handleRetake}
          />
        )}
      </main>
    </>
  );
}
