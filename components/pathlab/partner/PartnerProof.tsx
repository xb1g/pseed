import { NOTES } from "@/lib/content/pathlab-page";
import { PARTNER_PROOF } from "@/lib/content/pathlab-partner";

/**
 * "ความรู้ของคุณกลายเป็นแบบนี้" — the proof block. First the transformation
 * every contribution goes through (raw insight → real task → student output
 * → published PathLab), then examples from many fields so any expert can see
 * their own work in the pattern. One EE example may remain, but it sits
 * beside medicine, design, business, software, and media.
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

      <ol className="pathlab-partner__flow">
        {PARTNER_PROOF.flow.map((step, index) => (
          <li key={step} className="pathlab-partner__flow-step">
            <span className="pathlab-partner__day-num" aria-hidden="true">
              {index + 1}
            </span>
            <span className="pathlab-partner__flow-label">{step}</span>
          </li>
        ))}
      </ol>

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
