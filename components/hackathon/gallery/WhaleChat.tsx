"use client";

import { useState, useCallback } from "react";
import GalleryMascot from "./GalleryMascot";
import { QUESTION_MAP, FIRST_QUESTION_ID, type QuizOption, type VisitorAnswers } from "@/lib/hackathon/gallery-match";
import { useLang } from "@/lib/hackathon/gallery-lang";

interface WhaleChatProps {
  onComplete: (answers: VisitorAnswers) => void;
  onExplore: () => void;
}

type Phase = "asking" | "transitioning";

export default function WhaleChat({ onComplete, onExplore }: WhaleChatProps) {
  const { lang } = useLang();
  const [questionId, setQuestionId] = useState(FIRST_QUESTION_ID);
  const [phase, setPhase] = useState<Phase>("asking");
  const [who, setWho] = useState<string | null>(null);
  const [what, setWhat] = useState<string | null>(null);
  const [step, setStep] = useState(0);

  const question = QUESTION_MAP[questionId];

  const handleOption = useCallback((option: QuizOption) => {
    if (questionId === "q1_who") {
      if (!option.tag) {
        onExplore();
        return;
      }
      setWho(option.tag);
    } else if (option.tag && !option.tag.startsWith("area_")) {
      setWhat(option.tag);
    }

    if (option.next === null) {
      setPhase("transitioning");
      const finalWhat = option.tag && !option.tag.startsWith("area_") ? option.tag : what;
      setTimeout(() => {
        onComplete({
          who: (questionId === "q1_who" ? option.tag : who) as any,
          what: finalWhat as any,
        });
      }, 600);
      return;
    }

    setPhase("transitioning");
    setTimeout(() => {
      setQuestionId(option.next!);
      setStep((s) => s + 1);
      setPhase("asking");
    }, 400);
  }, [questionId, who, what, onComplete, onExplore]);

  if (!question) return null;

  const whaleText = lang === "th" ? question.whale_th : question.whale_en;

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      minHeight: "100dvh",
      padding: "2rem 1.25rem",
      gap: "1.5rem",
      opacity: phase === "transitioning" ? 0.5 : 1,
      transition: "opacity 300ms ease",
    }}>
      {/* Progress dots */}
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.5rem" }}>
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            style={{
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              background: i <= step
                ? "var(--bloom-accent, #619AD2)"
                : "var(--bloom-border-default, rgba(74,107,130,0.3))",
              transition: "background 300ms",
            }}
          />
        ))}
      </div>

      {/* Whale */}
      <div style={{ width: "120px", height: "120px", flexShrink: 0 }}>
        <GalleryMascot />
      </div>

      {/* Speech bubble */}
      <div style={{
        maxWidth: "520px",
        width: "100%",
        padding: "1.25rem 1.5rem",
        borderRadius: "20px",
        background: "var(--bloom-bg-surface, rgba(15,22,36,0.85))",
        border: "1px solid var(--bloom-border-default, rgba(74,107,130,0.25))",
        boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
      }}>
        <p style={{
          fontFamily: "var(--font-bai-jamjuree), sans-serif",
          fontSize: "1rem",
          lineHeight: 1.6,
          color: "var(--bloom-text-primary, #C0D8F0)",
          margin: 0,
          textAlign: "center",
        }}>
          {whaleText}
        </p>
      </div>

      {/* Options */}
      <div style={{
        maxWidth: "520px",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        gap: "0.625rem",
        overflowY: "auto",
        flex: 1,
      }}>
        {question.options.map((opt, i) => (
          <button
            key={i}
            onClick={() => handleOption(opt)}
            disabled={phase === "transitioning"}
            style={{
              padding: "0.875rem 1.25rem",
              borderRadius: "14px",
              border: "1px solid var(--bloom-border-default, rgba(74,107,130,0.3))",
              background: "var(--bloom-bg-raised, rgba(10,15,22,0.6))",
              cursor: phase === "transitioning" ? "not-allowed" : "pointer",
              textAlign: "left",
              transition: "all 180ms",
              minHeight: "48px",
            }}
            onMouseEnter={(e) => {
              if (phase !== "transitioning") {
                e.currentTarget.style.borderColor = "rgba(97,154,210,0.5)";
                e.currentTarget.style.background = "rgba(97,154,210,0.08)";
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "var(--bloom-border-default, rgba(74,107,130,0.3))";
              e.currentTarget.style.background = "var(--bloom-bg-raised, rgba(10,15,22,0.6))";
            }}
          >
            <span style={{
              fontFamily: "var(--font-bai-jamjuree), sans-serif",
              fontSize: "0.9375rem",
              fontWeight: 600,
              color: "var(--bloom-text-primary, #C0D8F0)",
              display: "block",
            }}>
              {lang === "th" ? opt.th : opt.en}
            </span>
            {lang === "en" && (
              <span style={{
                fontFamily: "var(--font-bai-jamjuree), sans-serif",
                fontSize: "0.75rem",
                color: "var(--bloom-text-muted, rgba(145,196,227,0.45))",
                display: "block",
                marginTop: "0.125rem",
              }}>
                {opt.th}
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
