import type { ReactNode } from "react";

/**
 * Glass panel for sections on /admin/talent. Reuses `.ei-card` (already
 * Dawn-themed via globals.css) and adds the eyebrow + rule combo so the
 * three sections feel like one continuous page rather than three tables.
 *
 * Server component — no interactivity needed.
 */
interface PanelProps {
  eyebrow: string;
  title: string;
  description?: string;
  children: ReactNode;
}

export function Panel({ eyebrow, title, description, children }: PanelProps) {
  return (
    <section className="ei-card relative overflow-hidden">
      <header className="space-y-2 border-b border-white/5 px-6 py-5">
        <p className="dawn-eyebrow">{eyebrow}</p>
        <h2 className="font-kodchasan text-xl font-semibold text-white">
          {title}
        </h2>
        {description && (
          <p className="text-sm text-stone-400">{description}</p>
        )}
        <div className="dawn-rule mt-3" aria-hidden="true" />
      </header>
      <div className="overflow-x-auto">{children}</div>
    </section>
  );
}
