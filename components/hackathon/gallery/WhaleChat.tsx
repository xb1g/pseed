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
    <div
      className="whale-chat"
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "1.5rem",
        opacity: phase === "transitioning" ? 0 : 1,
        transform: phase === "transitioning" ? "translateY(8px)" : "translateY(0)",
        transition: "opacity 300ms ease, transform 300ms ease",
      }}
    >
      {/* Progress dots */}
      <div style={{ display: "flex", gap: "0.5rem" }}>
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            style={{
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              background: i <= step
                ? "var(--bloom-accent)"
                : "var(--bloom-border-default)",
              transition: "background 300ms",
            }}
          />
        ))}
      </div>

      {/* Whale */}
      <div style={{ width: "120px", height: "120px", flexShrink: 0 }}>
        <GalleryMascot />
      </div>

      {/* Speech bubble — bloom-card style */}
      <div
        className="bloom-card"
        style={{
          maxWidth: "520px",
          width: "100%",
          padding: "1.25rem 1.5rem",
          borderRadius: "20px",
        }}
      >
        <p style={{
          fontFamily: "var(--font-bai-jamjuree), sans-serif",
          fontSize: "1rem",
          lineHeight: 1.6,
          color: "var(--bloom-text-primary)",
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
      }}>
        {question.options.map((opt, i) => (
          <button
            key={`${questionId}-${i}`}
            onClick={() => handleOption(opt)}
            disabled={phase === "transitioning"}
            className="whale-chat__option"
            style={{
              padding: "0.875rem 1.25rem",
              borderRadius: "14px",
              border: "1px solid var(--bloom-border-default)",
              background: "var(--bloom-bg-surface)",
              cursor: phase === "transitioning" ? "not-allowed" : "pointer",
              textAlign: "left",
              transition: "border-color 180ms ease-out, box-shadow 180ms ease-out, transform 180ms ease-out",
              minHeight: "48px",
              boxShadow: "var(--bloom-shadow-card)",
            }}
          >
            <span style={{
              fontFamily: "var(--font-bai-jamjuree), sans-serif",
              fontSize: "0.9375rem",
              fontWeight: 600,
              color: "var(--bloom-text-primary)",
              display: "block",
            }}>
              {lang === "th" ? opt.th : opt.en}
            </span>
            {lang === "en" && (
              <span style={{
                fontFamily: "var(--font-bai-jamjuree), sans-serif",
                fontSize: "0.75rem",
                color: "var(--bloom-text-muted)",
                display: "block",
                marginTop: "0.125rem",
              }}>
                {opt.th}
              </span>
            )}
          </button>
        ))}
      </div>

      <style>{`
        .whale-chat__option:hover:not(:disabled) {
          border-color: var(--bloom-border-strong) !important;
          box-shadow: var(--bloom-shadow-hover) !important;
          transform: translateY(-2px);
        }
        .whale-chat__option:focus-visible {
          outline: none;
          box-shadow: 0 0 0 2px var(--bloom-focus-ring) !important;
        }
        @media (prefers-reduced-motion: reduce) {
          .whale-chat {
            transition: opacity 0ms !important;
            transform: none !important;
          }
          .whale-chat__option {
            transition: none !important;
          }
        }
      `}</style>
    </div>
  );
}
