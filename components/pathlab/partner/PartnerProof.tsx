import { NOTES } from "@/lib/content/pathlab-page";
import { PARTNER_PROOF } from "@/lib/content/pathlab-partner";

/**
 * "สิ่งที่คุณรู้ กลายเป็นโจทย์แบบนี้" — the proof block: real examples from
 * many fields so any expert can see their own work in the pattern. The
 * transformation narrative lives in the exchange cards and contact steps;
 * stacking a third proof device here only made the page longer. One EE
 * example remains, but it sits beside medicine, design, business, software,
 * and media.
 */
export function PartnerProof() {
  return (
    <section
      id="partner-proof"
      className="pathlab-partner__section"
      aria-labelledby="partner-proof-heading"
    >
      <p className="pathlab-partner__kicker">{PARTNER_PROOF.kicker}</p>
      <h2 id="partner-proof-heading" className="pathlab-partner__heading">
        {PARTNER_PROOF.heading}
      </h2>

      <ul className="pathlab-partner__examples">
        {PARTNER_PROOF.examples.map((example) => (
          <li key={example.field} className="pathlab-partner__example">
            <span className="pathlab-partner__example-field">
              {example.field}
            </span>
            <p className="pathlab-partner__example-row">
              <span className="pathlab-partner__example-label">
                {PARTNER_PROOF.insightLabel}
              </span>
              {example.insight}
            </p>
            <p className="pathlab-partner__example-row">
              <span className="pathlab-partner__example-label">
                {PARTNER_PROOF.taskLabel}
              </span>
              {example.task}
            </p>
          </li>
        ))}
      </ul>

      <p className="pathlab-note-row">
        <span className="pathlab-note pathlab-note--tilt-r">
          {NOTES.partnerProof}
        </span>
      </p>
    </section>
  );
}
