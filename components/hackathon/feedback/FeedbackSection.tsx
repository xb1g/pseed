import type { ReactNode } from "react";

type FeedbackSectionProps = {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
};

export function FeedbackSection({
  eyebrow,
  title,
  description,
  children,
}: FeedbackSectionProps) {
  return (
    <section aria-labelledby="feedback-section-title" className="space-y-7">
      <header className="space-y-2">
        <p className="font-[family-name:var(--font-bai-jamjuree)] text-xs font-semibold tracking-[0.12em] text-indigo-300">
          {eyebrow}
        </p>
        <h2
          id="feedback-section-title"
          className="font-[family-name:var(--font-kodchasan)] text-2xl font-semibold leading-tight text-white sm:text-3xl"
        >
          {title}
        </h2>
        <p className="font-[family-name:var(--font-bai-jamjuree)] text-sm leading-6 text-slate-400">
          {description}
        </p>
      </header>
      {children}
    </section>
  );
}
