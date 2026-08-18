import { ArrowRight } from "lucide-react";
import { NOTES } from "@/lib/content/pathlab-page";
import {
  PARTNER_CONTACT,
  PARTNER_IG_DM_URL,
} from "@/lib/content/pathlab-partner";

/**
 * Closing call to action. The only door is a DM thread with the team on
 * Instagram: no account, no form, and inbound messages land in the existing
 * DM lead funnel. The steps mirror the post-submit "what happens next" copy
 * so the promise and the flow match.
 */
export function PartnerContact() {
  return (
    <section
      id="partner-start"
      className="pathlab-partner__contact"
      aria-labelledby="partner-start-heading"
    >
      <h2 id="partner-start-heading" className="pathlab-partner__heading">
        {PARTNER_CONTACT.heading}
      </h2>
      <p className="pathlab-partner__body">{PARTNER_CONTACT.body}</p>

      <ol className="pathlab-partner__steps">
        {PARTNER_CONTACT.steps.map((step, index) => (
          <li key={step} className="pathlab-partner__step">
            <span className="pathlab-partner__day-num" aria-hidden="true">
              {index + 1}
            </span>
            <span>{step}</span>
          </li>
        ))}
      </ol>

      <div className="pathlab-hero__ctas pathlab-partner__ctas">
        <a
          href={PARTNER_IG_DM_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="pathlab-hero__cta pathlab-hero__cta--primary"
        >
          <span>{PARTNER_CONTACT.primaryLabel}</span>
          <ArrowRight className="pathlab-partner__cta-icon" aria-hidden="true" />
        </a>
        <a
          href={PARTNER_CONTACT.secondaryHref}
          className="pathlab-hero__cta pathlab-hero__cta--secondary"
        >
          {PARTNER_CONTACT.secondaryLabel}
        </a>
      </div>

      <p className="pathlab-partner__contact-small">{PARTNER_CONTACT.small}</p>

      <p className="pathlab-note-row">
        <span className="pathlab-note">{NOTES.partnerContact}</span>
      </p>
    </section>
  );
}
