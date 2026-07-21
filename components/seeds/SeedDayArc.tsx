export interface SeedDayArcItem {
  day_number: number;
  title: string | null;
  context_text: string | null;
}

interface SeedDayArcProps {
  days: SeedDayArcItem[];
  /** Days the path declares, which can exceed the days already authored */
  totalDays: number;
}

const TEASER_LENGTH = 96;

/**
 * Turns authored day context (markdown) into a short plain-text teaser.
 * Only the first paragraph is used — enough to signal the day's real work
 * without giving away the activity itself.
 */
function toTeaser(context: string | null): string | null {
  if (!context) return null;

  const firstParagraph = context.trim().split(/\n\s*\n/)[0] ?? "";
  const plain = firstParagraph
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "") // images
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1") // links → label
    .replace(/^[>\s]*[-*+]\s+/gm, "") // list bullets
    .replace(/^#{1,6}\s+/gm, "") // headings
    .replace(/[*_`~]/g, "") // emphasis marks
    .replace(/\s+/g, " ")
    .trim();

  if (!plain) return null;
  if (plain.length <= TEASER_LENGTH) return plain;
  return `${plain.slice(0, TEASER_LENGTH).trimEnd()}…`;
}

/**
 * The day arc of a PathLab, rendered as a numbered rail.
 *
 * A PathLab is a decision instrument, not a course, so this shows the shape of
 * the week — what each day asks of you — without revealing the activities.
 */
export function SeedDayArc({ days, totalDays }: SeedDayArcProps) {
  const authored = [...days].sort((a, b) => a.day_number - b.day_number);
  if (authored.length === 0) return null;

  const highestAuthoredDay = authored[authored.length - 1].day_number;
  const remaining = Math.max(0, totalDays - highestAuthoredDay);

  return (
    <section aria-labelledby="day-arc-heading">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-300/70">
        The week
      </p>
      <h2
        id="day-arc-heading"
        className="mt-2 text-2xl font-bold tracking-tight text-white"
      >
        {totalDays} days, one question each
      </h2>
      <p className="mt-2 max-w-prose text-sm leading-7 text-neutral-400">
        Real work from the job — including the parts practitioners find boring.
      </p>

      <ol className="mt-7 border-l border-white/10 pl-5 sm:pl-6">
        {authored.map((day) => {
          const teaser = toTeaser(day.context_text);

          return (
            <li
              key={day.day_number}
              className="relative pb-7 last:pb-0"
            >
              <span
                aria-hidden="true"
                className="absolute -left-[1.9rem] top-0.5 flex h-6 w-6 items-center justify-center rounded-full border border-amber-400/30 bg-[#141416] text-[11px] font-bold text-amber-300 sm:-left-[2.15rem]"
              >
                {day.day_number}
              </span>
              <h3 className="text-[15px] font-semibold leading-6 text-white sm:text-base">
                <span className="sr-only">Day {day.day_number}: </span>
                {day.title || `Day ${day.day_number}`}
              </h3>
              {teaser && (
                <p className="mt-1 text-sm leading-6 text-neutral-400">
                  {teaser}
                </p>
              )}
            </li>
          );
        })}

        {remaining > 0 && (
          <li className="relative pt-1">
            <span
              aria-hidden="true"
              className="absolute -left-[1.9rem] top-1 flex h-6 w-6 items-center justify-center rounded-full border border-white/10 bg-[#141416] text-[11px] font-bold text-neutral-500 sm:-left-[2.15rem]"
            >
              +{remaining}
            </span>
            <p className="text-sm text-neutral-500">
              {remaining} more {remaining === 1 ? "day" : "days"}, revealed as
              you go.
            </p>
          </li>
        )}
      </ol>
    </section>
  );
}
