import type { ReactNode } from "react";

interface PlayerShellProps {
  /** Fixed chrome at the top — day, progress, navigation */
  header: ReactNode;
  children: ReactNode;
  /** Sticky primary action. Omit for phases that carry their own choices. */
  actionBar?: ReactNode;
}

/**
 * Layout frame for the PathLab player.
 *
 * The player is a task surface, not a document: chrome stays put, the work
 * scrolls between it. Header sticks below the app navbar (h-16), the action
 * bar sticks to the bottom edge above the home indicator.
 */
export function PlayerShell({ header, children, actionBar }: PlayerShellProps) {
  return (
    <div className="flex min-h-[100dvh] flex-col bg-[#0a0a0b]">
      <div className="sticky top-16 z-30 border-b border-white/10 bg-[#0a0a0b]/90 backdrop-blur-xl">
        {header}
      </div>

      <main className="flex-1 px-4 pb-10 pt-5 sm:px-6">
        <div className="mx-auto w-full max-w-3xl">{children}</div>
      </main>

      {actionBar && (
        <div className="sticky bottom-0 z-30 border-t border-white/10 bg-[#0a0a0b]/92 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur-xl sm:px-6">
          <div className="mx-auto w-full max-w-3xl">{actionBar}</div>
        </div>
      )}
    </div>
  );
}
