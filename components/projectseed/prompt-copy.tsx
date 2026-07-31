"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Check, Copy, ExternalLink } from "lucide-react";

import type { GradeLevel } from "@/lib/ai/project-discovery-prompts";

const GRADE_LABELS: Record<GradeLevel, string> = {
  M4: "ม.4",
  M5: "ม.5",
  M6: "ม.6",
};

const GRADE_ORDER: GradeLevel[] = ["M4", "M5", "M6"];

/**
 * Where a student pastes the prompt. Deep links open a fresh chat so the prompt
 * lands as the first message rather than mid-conversation.
 */
const AI_TOOLS = [
  { label: "ChatGPT", href: "https://chatgpt.com/" },
  { label: "Claude", href: "https://claude.ai/new" },
  { label: "Gemini", href: "https://gemini.google.com/app" },
] as const;

const COPY_FEEDBACK_MS = 2200;

export interface PromptCopyProps {
  /** Prompt text per grade, rendered on the server so no API call is needed. */
  prompts: Record<GradeLevel, string>;
  greeting: string;
}

export function PromptCopy({ prompts, greeting }: PromptCopyProps) {
  const [grade, setGrade] = useState<GradeLevel>("M6");
  const [copied, setCopied] = useState(false);
  const [copyFailed, setCopyFailed] = useState(false);
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (resetTimer.current) clearTimeout(resetTimer.current);
    },
    []
  );

  const promptText = prompts[grade];

  const handleCopy = useCallback(async () => {
    if (resetTimer.current) clearTimeout(resetTimer.current);
    try {
      await navigator.clipboard.writeText(promptText);
      setCopied(true);
      setCopyFailed(false);
    } catch {
      // Older mobile browsers and non-secure contexts reject the clipboard API.
      // The textarea below stays selectable so copying by hand still works.
      setCopied(false);
      setCopyFailed(true);
    }
    resetTimer.current = setTimeout(() => {
      setCopied(false);
      setCopyFailed(false);
    }, COPY_FEEDBACK_MS);
  }, [promptText]);

  return (
    <div className="flex w-full flex-col gap-8">
      <GradePicker grade={grade} onChange={setGrade} />

      <section className="ei-card ei-card--static p-5 sm:p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-base font-semibold text-white sm:text-lg">
            พรอมป์ของเธอ ({GRADE_LABELS[grade]})
          </h2>
          <button
            type="button"
            onClick={handleCopy}
            className="ei-button-dawn min-h-[44px] !px-5 !py-2.5 !text-sm"
            aria-label={`คัดลอกพรอมป์สำหรับ ${GRADE_LABELS[grade]}`}
          >
            {copied ? (
              <>
                <Check aria-hidden="true" className="h-4 w-4" />
                คัดลอกแล้ว
              </>
            ) : (
              <>
                <Copy aria-hidden="true" className="h-4 w-4" />
                คัดลอก
              </>
            )}
          </button>
        </div>

        <p aria-live="polite" className="sr-only">
          {copied ? "คัดลอกพรอมป์แล้ว" : ""}
          {copyFailed ? "คัดลอกอัตโนมัติไม่สำเร็จ กรุณาเลือกข้อความแล้วคัดลอกเอง" : ""}
        </p>

        {copyFailed && (
          <p className="mb-3 text-sm text-amber-300">
            คัดลอกอัตโนมัติไม่ได้ — กดค้างที่ข้อความด้านล่างแล้วเลือกทั้งหมดเพื่อคัดลอกเอง
          </p>
        )}

        {/* The prompt body is English because models follow English instructions
            more reliably. Students see that wall of text and assume it is not
            for them unless we say otherwise. */}
        <p className="mb-3 text-sm leading-relaxed text-slate-400">
          ข้อความข้างล่างเป็นภาษาอังกฤษ เพราะ AI ทำตามได้แม่นกว่า —
          <span className="text-slate-300"> แต่ AI จะคุยกับเธอเป็นภาษาไทย</span> ไม่ต้องอ่านก็ได้ กดคัดลอกเลย
        </p>

        <textarea
          readOnly
          value={promptText}
          rows={14}
          aria-label="ข้อความพรอมป์"
          onFocus={(event) => event.currentTarget.select()}
          className="h-72 w-full resize-y rounded-xl border border-white/10 bg-slate-950/60 p-4 font-mono text-[13px] leading-relaxed text-slate-200 focus:border-blue-400/60 focus:outline-none focus:ring-2 focus:ring-blue-400/40"
        />
      </section>

      <PasteTargets />

      <HowToUse greeting={greeting} />
    </div>
  );
}

function GradePicker({
  grade,
  onChange,
}: {
  grade: GradeLevel;
  onChange: (next: GradeLevel) => void;
}) {
  return (
    <section aria-labelledby="grade-picker-label">
      <h2 id="grade-picker-label" className="dawn-eyebrow mb-3">
        เธออยู่ชั้นไหน
      </h2>
      <div role="radiogroup" aria-labelledby="grade-picker-label" className="flex gap-2">
        {GRADE_ORDER.map((option) => {
          const selected = option === grade;
          return (
            <button
              key={option}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onChange(option)}
              className={`min-h-[44px] flex-1 rounded-xl border px-4 py-2.5 text-base font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400/60 ${
                selected
                  ? "border-blue-400/70 bg-blue-500/20 text-white"
                  : "border-white/10 bg-white/[0.02] text-slate-300 hover:border-white/25 hover:text-white"
              }`}
            >
              {GRADE_LABELS[option]}
            </button>
          );
        })}
      </div>
      <p className="mt-2 text-sm text-slate-400">
        คำถามชุดเดียวกัน ต่างกันแค่กรอบเวลา — ม.6 มีเดดไลน์พอร์ตจริง ม.4 ยังมีเวลาคิด
      </p>
    </section>
  );
}

function PasteTargets() {
  return (
    <section aria-labelledby="paste-targets-label">
      <h2 id="paste-targets-label" className="dawn-eyebrow mb-3">
        เอาไปวางที่ไหนก็ได้
      </h2>
      <div className="flex flex-wrap gap-2">
        {AI_TOOLS.map((tool) => (
          <a
            key={tool.label}
            href={tool.href}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-white/10 bg-white/[0.02] px-4 py-2.5 text-base text-slate-200 transition-colors hover:border-white/25 hover:text-white focus:outline-none focus:ring-2 focus:ring-blue-400/60"
          >
            {tool.label}
            <ExternalLink aria-hidden="true" className="h-4 w-4 opacity-60" />
          </a>
        ))}
      </div>
      <p className="mt-2 text-sm text-slate-400">
        ตัวไหนก็ได้ที่เธอใช้อยู่แล้ว ไม่ต้องเสียเงินเพิ่ม
      </p>
    </section>
  );
}

function HowToUse({ greeting }: { greeting: string }) {
  return (
    <section aria-labelledby="how-to-label" className="ei-card ei-card--static p-5 sm:p-6">
      <h2 id="how-to-label" className="mb-4 text-base font-semibold text-white sm:text-lg">
        ใช้ยังไง
      </h2>
      <ol className="flex flex-col gap-3 text-[15px] leading-relaxed text-slate-300">
        <li>
          <span className="font-semibold text-amber-200/90">1.</span> คัดลอกพรอมป์ด้านบน
        </li>
        <li>
          <span className="font-semibold text-amber-200/90">2.</span> เปิดแชท AI ใหม่ แล้ววางเป็นข้อความแรก
        </li>
        <li>
          <span className="font-semibold text-amber-200/90">3.</span> ตอบคำถามไปเรื่อย ๆ ตอบว่า
          &ldquo;ยังไม่รู้&rdquo; ได้ ใช้เวลาประมาณ 20 นาที
        </li>
        <li>
          <span className="font-semibold text-amber-200/90">4.</span> จบแล้วได้โปรเจกต์ 1 อัน
          + สิ่งที่ต้องทำภายในสัปดาห์นี้ 1 อย่าง — เซฟไว้ เอาไปคุยกับพี่ ๆ หรือครูแนะแนวได้
        </li>
      </ol>

      <div className="mt-5 rounded-xl border border-amber-200/15 bg-slate-950/50 p-4">
        <p className="dawn-eyebrow mb-2 opacity-70">AI จะเริ่มประมาณนี้</p>
        <p className="whitespace-pre-line text-sm leading-relaxed text-slate-300">
          {greeting}
        </p>
      </div>
    </section>
  );
}
