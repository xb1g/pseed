import { FileSearch, Handshake, ShieldCheck, Timer } from "lucide-react";
import { TALENT_SIGNUP_FORM_URL } from "./TalentJoinCard";

const VETTING_STEPS = [
  {
    Icon: FileSearch,
    heading: "We look at shipped work",
    line: "Not a CV. A thing that exists, with a link you can open.",
  },
  {
    Icon: Handshake,
    heading: "We put them on a real brief",
    line: "A paid piece for an actual client before we vouch for anyone.",
  },
  {
    Icon: ShieldCheck,
    heading: "Only then do they go public",
    line: "Every profile on this page cleared both steps.",
  },
  {
    Icon: Timer,
    heading: "You skip the screening",
    line: "Tell us the brief; we send the two or three who fit.",
  },
] as const;

/** Pitch to companies hiring interns: the vetting is the product. */
export function TalentHiring() {
  return (
    <div className="talent-hiring">
      <div className="talent-hiring__intro">
        <p className="talent-hiring__lead">
          Hiring an intern is a bet on a CV. Ours have already shipped work for
          paying clients — and we checked it ourselves.
        </p>
        <a href="#interest" className="talent-hiring__cta">
          Tell us what you need →
        </a>
      </div>

      <div className="talent-hiring__grid">
        {VETTING_STEPS.map(({ Icon, heading, line }) => (
          <article key={heading} className="talent-hiring__card">
            <Icon
              className="talent-hiring__icon h-6 w-6"
              strokeWidth={1.75}
              aria-hidden="true"
            />
            <h3 className="talent-hiring__heading">{heading}</h3>
            <p className="talent-hiring__line">{line}</p>
          </article>
        ))}
      </div>

      <p className="talent-hiring__note">
        Looking for an internship instead?{" "}
        <a
          href={TALENT_SIGNUP_FORM_URL}
          target="_blank"
          rel="noopener noreferrer"
        >
          Put your name in
        </a>
        .
      </p>
    </div>
  );
}
