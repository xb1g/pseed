"use client";

import type { ContextualQuestion as Question } from "@/lib/my-path/types";

export function ContextualQuestion({
  question,
  onAnswer,
  onSkip,
}: {
  question: Question;
  onAnswer: (answerId: string) => void;
  onSkip: () => void;
}) {
  return (
    <section
      aria-labelledby={`question-${question.id}`}
      className="mx-auto max-w-3xl border-y border-indigo-200/10 py-7"
    >
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-indigo-200/70">
        คำถามสั้นๆ ถ้าช่วยให้คิดต่อ
      </p>
      <h3
        id={`question-${question.id}`}
        className="mt-2 font-kodchasan text-xl font-semibold text-slate-50"
      >
        {question.prompt}
      </h3>
      <div className="mt-4 flex flex-wrap gap-2">
        {question.options.map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() => onAnswer(option.id)}
            className="min-h-12 rounded-full border border-white/10 bg-white/[0.04] px-4 text-sm text-slate-200 transition-colors hover:border-indigo-200/30 hover:bg-indigo-200/[0.08] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200"
          >
            {option.label}
          </button>
        ))}
      </div>
      <button
        type="button"
        onClick={onSkip}
        className="mt-3 min-h-11 text-sm font-medium text-slate-500 underline-offset-4 hover:text-slate-300 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200"
      >
        ข้ามคำถามนี้
      </button>
    </section>
  );
}
