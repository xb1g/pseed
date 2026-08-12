"use client";

import { useMemo, useState } from "react";

import type { CollectedData, OnboardingStep } from "@/types/onboarding";

interface WelcomePhaseProps {
  data: CollectedData;
  oauthName: string | null;
  advance: (
    step: OnboardingStep,
    updates: Partial<CollectedData>
  ) => void | Promise<void>;
  goBack: () => void | Promise<void>;
}

const CONTENT = {
  en: {
    eyebrow: "Onboarding",
    intro: "A short setup before we shape your direction.",
    nameLabel: "What's your first name?",
    namePlaceholder: "Your name",
    greeting: (name: string) =>
      `Hey ${name}, let’s figure out what excites you.`,
    helper: "We’ll walk through a few focused questions.",
    continue: "Continue",
  },
  th: {
    eyebrow: "เริ่มต้น",
    intro: "ตั้งค่าสั้น ๆ ก่อน เราจะช่วยหาทิศทางที่เหมาะกับคุณ",
    nameLabel: "ชื่อของคุณคืออะไร?",
    namePlaceholder: "ชื่อของคุณ",
    greeting: (name: string) =>
      `สวัสดี ${name} เรามาหาสิ่งที่ทำให้คุณรู้สึกอยากไปต่อกัน`,
    helper: "เราจะพาตอบทีละคำถามอย่างมีโครงสร้าง",
    continue: "ไปต่อ",
  },
} as const;

export function WelcomePhase({ data, oauthName, advance }: WelcomePhaseProps) {
  const language = (data.language ?? "th") as "en" | "th";
  const [name, setName] = useState(data.name ?? oauthName ?? "");

  const content = useMemo(() => CONTENT[language], [language]);
  const trimmedName = name.trim();
  const canContinue = trimmedName.length > 0;
  const isOauthUser = Boolean(oauthName);
  const showContinue = canContinue || isOauthUser;

  return (
    <section className="mx-auto w-full max-w-lg">
      <div className="ei-card ei-card--static relative overflow-hidden rounded-[22px] px-4 py-5 sm:rounded-[28px] sm:px-10 sm:py-8">
        <div className="relative flex flex-col gap-6 sm:gap-8">
          <div className="space-y-2">
            <p className="dawn-eyebrow">{content.eyebrow}</p>
            <h1 className="text-[1.6rem] font-semibold leading-snug tracking-tight text-white sm:text-4xl sm:leading-tight">
              {isOauthUser
                ? content.greeting(trimmedName || oauthName || "")
                : content.nameLabel}
            </h1>
            <p className="text-sm leading-6 text-white/60 sm:text-base">
              {isOauthUser ? content.helper : content.intro}
            </p>
          </div>

          {!isOauthUser ? (
            <label className="flex flex-col gap-2.5">
              <span className="text-xs font-semibold uppercase tracking-[0.16em] text-white/45">
                {content.nameLabel}
              </span>
              <input
                autoFocus
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder={content.namePlaceholder}
                autoComplete="given-name"
                enterKeyHint="done"
                className="min-h-14 rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-base text-white placeholder:text-white/25 focus:border-blue-400/50 focus:outline-none sm:h-14 sm:px-5 sm:text-lg"
              />
            </label>
          ) : null}

          {showContinue ? (
            <button
              type="button"
              disabled={!canContinue}
              onClick={() =>
                advance("interest", {
                  language,
                  name: trimmedName,
                  mode: "wizard",
                })
              }
              className="ei-button-dawn min-h-12 w-full justify-center py-3.5 text-base font-semibold disabled:cursor-not-allowed disabled:opacity-40 sm:min-h-0 sm:py-3 sm:text-sm"
            >
              {content.continue}
            </button>
          ) : null}
        </div>
      </div>
    </section>
  );
}
