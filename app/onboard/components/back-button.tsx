"use client";

interface BackButtonProps {
  label: string;
  onClick: () => void;
}

export function BackButton({ label, onClick }: BackButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex min-h-11 items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3.5 py-2 text-sm font-medium text-white/70 active:scale-[0.98] sm:min-h-0 sm:py-1.5 sm:text-xs sm:text-white/60"
    >
      <span aria-hidden="true">←</span>
      <span>{label}</span>
    </button>
  );
}
