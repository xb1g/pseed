import type { ReactNode } from "react";

/**
 * Layout primitives shared by the /pathlab/for-parents sections.
 *
 * Every section on that page is the same shape: a max-width column, an
 * eyebrow, a display heading, and optional lead copy. Keeping it here means a
 * spacing change lands once instead of in eleven files.
 */

interface ParentsSectionProps {
  id?: string;
  /** Wires aria-labelledby to the heading rendered by SectionHeading. */
  labelledBy?: string;
  className?: string;
  children: ReactNode;
}

export function ParentsSection({
  id,
  labelledBy,
  className = "",
  children,
}: ParentsSectionProps) {
  return (
    <section
      id={id}
      aria-labelledby={labelledBy}
      className={`mx-auto w-full max-w-6xl px-5 py-16 sm:px-8 lg:py-24 ${className}`}
    >
      {children}
    </section>
  );
}

interface SectionHeadingProps {
  id?: string;
  eyebrow: string;
  title: string;
  body?: string;
  /** Centred headings are used by the closing and pricing sections. */
  align?: "left" | "center";
}

export function SectionHeading({
  id,
  eyebrow,
  title,
  body,
  align = "left",
}: SectionHeadingProps) {
  const centered = align === "center";

  return (
    <div className={centered ? "mx-auto max-w-2xl text-center" : "max-w-2xl"}>
      <p className="dawn-eyebrow">{eyebrow}</p>
      <h2
        id={id}
        className="mt-4 font-kodchasan text-3xl font-medium leading-tight text-white sm:text-4xl"
      >
        {title}
      </h2>
      {body ? (
        <p className="mt-5 font-bai-jamjuree text-base leading-8 text-slate-300">
          {body}
        </p>
      ) : null}
    </div>
  );
}

/** A margin note in highlighter, positioned by the caller's alignment. */
export function ParentsNote({
  children,
  tilt = "",
  align = "left",
}: {
  children: ReactNode;
  tilt?: string;
  align?: "left" | "center";
}) {
  return (
    <p className={`mt-8 ${align === "center" ? "text-center" : ""}`}>
      <span className={`pathlab-note ${tilt}`}>{children}</span>
    </p>
  );
}
