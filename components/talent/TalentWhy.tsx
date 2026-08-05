import { Briefcase, Sprout, Trophy } from "lucide-react";

const REASONS = [
  {
    Icon: Sprout,
    heading: "A part-time job pays this month.",
    line: "Building pays for years.",
  },
  {
    Icon: Briefcase,
    heading: "They ask for internships.",
    line: "Real work on the profile, and a paycheck.",
  },
  {
    Icon: Trophy,
    heading: "They ask for competitions.",
    line: "Skills, a portfolio, and the nerve to bet on themselves.",
  },
] as const;

/** The rationale behind hiring students for real, paid project work. */
export function TalentWhy() {
  return (
    <div className="talent-why__grid">
      {REASONS.map(({ Icon, heading, line }) => (
        <article key={heading} className="talent-why__card">
          <Icon className="talent-why__icon h-7 w-7" strokeWidth={1.75} aria-hidden="true" />
          <h3 className="talent-why__heading">{heading}</h3>
          <p className="talent-why__body">{line}</p>
        </article>
      ))}
    </div>
  );
}
