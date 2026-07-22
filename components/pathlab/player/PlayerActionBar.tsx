"use client";

interface PlayerActionBarProps {
  primaryLabel: string;
  onPrimary: () => void;
  primaryDisabled?: boolean;
  /** Shown above the buttons — why the primary action is blocked, or what's next */
  hint?: string;
  /** Draws attention the moment the primary action becomes available */
  emphasis?: boolean;
  secondaryLabel?: string;
  onSecondary?: () => void;
}

/**
 * The one thing to do next, always within thumb reach.
 */
export function PlayerActionBar({
  primaryLabel,
  onPrimary,
  primaryDisabled = false,
  hint,
  emphasis = false,
  secondaryLabel,
  onSecondary,
}: PlayerActionBarProps) {
  return (
    <div>
      {hint && (
        <p
          className={`mb-2 text-center text-xs leading-5 sm:text-left ${
            emphasis ? "font-medium text-emerald-300" : "text-neutral-500"
          }`}
        >
          {hint}
        </p>
      )}
      <div className="flex items-center gap-2">
        {secondaryLabel && onSecondary && (
          <button
            type="button"
            onClick={onSecondary}
            className="inline-flex h-12 shrink-0 items-center rounded-xl px-3 text-sm font-medium text-neutral-400 transition-colors hover:text-white"
          >
            {secondaryLabel}
          </button>
        )}
        <button
          type="button"
          onClick={onPrimary}
          disabled={primaryDisabled}
          className={`ei-button-dusk min-h-12 flex-1 justify-center text-base ${
            emphasis
              ? "ring-2 ring-emerald-400/50 ring-offset-2 ring-offset-[#0a0a0b]"
              : ""
          }`}
        >
          <span>{primaryLabel}</span>
        </button>
      </div>
    </div>
  );
}
