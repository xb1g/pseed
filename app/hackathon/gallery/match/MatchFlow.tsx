"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import WhaleChat from "@/components/hackathon/gallery/WhaleChat";
import MatchReveal from "@/components/hackathon/gallery/MatchReveal";
import LangToggle from "@/components/hackathon/gallery/LangToggle";
import ThemeToggle from "@/components/hackathon/gallery/ThemeToggle";
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
      {/* Nav bar */}
      <nav style={{
        position: "sticky", top: 0, zIndex: 10,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 clamp(1.25rem, 5vw, 3rem)", height: "56px",
        background: "rgba(8,12,18,0.85)", backdropFilter: "blur(12px)",
        borderBottom: "1px solid var(--bloom-border-subtle)",
      }}>
        <a
          href="/hackathon/gallery"
          style={{
            fontFamily: "var(--font-bai-jamjuree), sans-serif",
            fontSize: "0.875rem", fontWeight: 600,
            color: "var(--bloom-text-muted)", textDecoration: "none",
          }}
        >
          &larr; Gallery
        </a>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <LangToggle />
          <ThemeToggle />
        </div>
      </nav>

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
    </>
  );
}
