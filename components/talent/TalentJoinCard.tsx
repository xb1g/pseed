import { Plus } from "lucide-react";

/** Recruiting CTA — sits at the end of the profile grid. */
export const TALENT_SIGNUP_FORM_URL = "https://forms.gle/14EZbYpz9qqDXwTs5";

export function TalentJoinCard() {
  return (
    <a
      href={TALENT_SIGNUP_FORM_URL}
      target="_blank"
      rel="noopener noreferrer"
      className="talent-join talent-card"
    >
      <span className="talent-join__mark" aria-hidden="true">
        <Plus className="h-7 w-7" strokeWidth={2} />
      </span>
      <span className="talent-join__title">Join the roster</span>
      <span className="talent-join__body">
        Can build, design, edit or break things? Put your name in — we pay for
        real work.
      </span>
      <span className="talent-join__cta">Apply →</span>
    </a>
  );
}
