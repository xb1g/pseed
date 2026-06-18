"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import GalleryMascot from "./GalleryMascot";
import { QUESTION_MAP, FIRST_QUESTION_ID, type QuizOption, type VisitorAnswers } from "@/lib/hackathon/gallery-match";
import { useLang } from "@/lib/hackathon/gallery-lang";

interface WhaleChatProps {
  onComplete: (answers: VisitorAnswers) => void;
  onExplore: () => void;
}

// Typing speed: ~30ms per char, scaled so longer text doesn't take forever
function getTypingDuration(text: string): number {
  const len = text.length;
  if (len <= 40) return len * 30;
  if (len <= 80) return 40 * 30 + (len - 40) * 18;
  return 40 * 30 + 40 * 18 + (len - 80) * 10;
}

function TypewriterText({ text, onDone }: { text: string; onDone: () => void }) {
  const [displayLen, setDisplayLen] = useState(0);
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  useEffect(() => {
    setDisplayLen(0);
    const totalDuration = getTypingDuration(text);
    const interval = totalDuration / text.length;
    let frame = 0;
    let raf: number;
    let start: number | null = null;

    const tick = (now: number) => {
      if (start === null) start = now;
      const elapsed = now - start;
      const chars = Math.min(Math.floor(elapsed / interval) + 1, text.length);
      if (chars !== frame) {
        frame = chars;
        setDisplayLen(chars);
      }
      if (chars < text.length) {
        raf = requestAnimationFrame(tick);
      } else {
        onDoneRef.current();
      }
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [text]);

  return (
    <>
      {text.slice(0, displayLen)}
      {displayLen < text.length && (
        <span
          className="typewriter-cursor"
          aria-hidden="true"
          style={{
            display: "inline-block",
            width: "2px",
            height: "1.1em",
            background: "var(--bloom-accent)",
            marginLeft: "1px",
            verticalAlign: "text-bottom",
            animation: "cursor-blink 600ms step-end infinite",
          }}
        />
      )}
    </>
  );
}

export default function WhaleChat({ onComplete, onExplore }: WhaleChatProps) {
  const { lang } = useLang();
  const [questionId, setQuestionId] = useState(FIRST_QUESTION_ID);
  const [who, setWho] = useState<string | null>(null);
  const [what, setWhat] = useState<string | null>(null);
  const [step, setStep] = useState(0);
  const [speaking, setSpeaking] = useState(true);
  const [showOptions, setShowOptions] = useState(false);
  // Controls fade of speech bubble + options only (not whale/dots)
  const [contentVisible, setContentVisible] = useState(true);

  const question = QUESTION_MAP[questionId];

  // Reset speaking state when question changes
  useEffect(() => {
    setSpeaking(true);
    setShowOptions(false);
  }, [questionId]);

  const handleTypingDone = useCallback(() => {
    setSpeaking(false);
    setTimeout(() => setShowOptions(true), 200);
  }, []);

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
      // Final answer — fade content, then complete
      setContentVisible(false);
      const finalWhat = option.tag && !option.tag.startsWith("area_") ? option.tag : what;
      setTimeout(() => {
        onComplete({
          who: (questionId === "q1_who" ? option.tag : who) as any,
          what: finalWhat as any,
        });
      }, 500);
      return;
    }

    // Fade out content only, then swap question, then fade back in
    setContentVisible(false);
    setTimeout(() => {
      setQuestionId(option.next!);
      setStep((s) => s + 1);
      // Small delay so the new content renders before fading in
      requestAnimationFrame(() => {
        setContentVisible(true);
      });
    }, 350);
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
      }}
    >
      {/* Progress dots — always visible */}
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

      {/* Whale — always visible, speaking prop controls animation */}
      <div style={{ width: "120px", height: "120px", flexShrink: 0, overflow: "hidden" }}>
        <div style={{ transform: "scale(0.5)", transformOrigin: "top left", width: "240px", height: "240px" }}>
          <GalleryMascot speaking={speaking} />
        </div>
      </div>

      {/* Speech bubble + options — these fade on transition */}
      <div
        className="whale-chat__content"
        style={{
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "1.5rem",
          opacity: contentVisible ? 1 : 0,
          transform: contentVisible ? "translateY(0)" : "translateY(8px)",
          transition: "opacity 300ms ease, transform 300ms ease",
        }}
      >
        {/* Speech bubble */}
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
            minHeight: "2.6em",
          }}>
            <TypewriterText
              key={questionId}
              text={whaleText}
              onDone={handleTypingDone}
            />
          </p>
        </div>

        {/* Options — 2-column grid, fade in after typing */}
        <div
          className="whale-chat__options"
          style={{
            maxWidth: "520px",
            width: "100%",
            display: "grid",
            gridTemplateColumns: "repeat(2, 1fr)",
            gap: "0.625rem",
            opacity: showOptions ? 1 : 0,
            transform: showOptions ? "translateY(0)" : "translateY(8px)",
            transition: "opacity 300ms ease, transform 300ms ease",
            pointerEvents: showOptions ? "auto" : "none",
          }}
        >
          {question.options.map((opt, i) => (
            <button
              key={`${questionId}-${i}`}
              onClick={() => handleOption(opt)}
              disabled={!showOptions}
              className="whale-chat__option"
              style={{
                padding: "0.75rem 1rem",
                borderRadius: "14px",
                border: "1px solid var(--bloom-border-default)",
                background: "var(--bloom-bg-surface)",
                cursor: !showOptions ? "not-allowed" : "pointer",
                textAlign: "left",
                transition: "border-color 180ms ease-out, box-shadow 180ms ease-out, transform 180ms ease-out",
                minHeight: "48px",
                boxShadow: "var(--bloom-shadow-card)",
                ...(question.options.length % 2 === 1 && i === question.options.length - 1
                  ? { gridColumn: "1 / -1" }
                  : {}),
              }}
            >
              <span style={{
                fontFamily: "var(--font-bai-jamjuree), sans-serif",
                fontSize: "0.875rem",
                fontWeight: 600,
                color: "var(--bloom-text-primary)",
                display: "block",
                lineHeight: 1.4,
              }}>
                {lang === "th" ? opt.th : opt.en}
              </span>
              {lang === "en" && (
                <span style={{
                  fontFamily: "var(--font-bai-jamjuree), sans-serif",
                  fontSize: "0.6875rem",
                  color: "var(--bloom-text-muted)",
                  display: "block",
                  marginTop: "0.125rem",
                  lineHeight: 1.3,
                }}>
                  {opt.th}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes cursor-blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
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
          .whale-chat__content {
            transition: none !important;
            opacity: 1 !important;
            transform: none !important;
          }
          .whale-chat__option {
            transition: none !important;
          }
          .whale-chat__options {
            transition: none !important;
            opacity: 1 !important;
            transform: none !important;
          }
          .typewriter-cursor {
            animation: none !important;
          }
        }
      `}</style>
    </div>
  );
}
