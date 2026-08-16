import {
  CONTACT,
  NOTES,
  PRICE_CTAS,
  PRICE_HEADING,
  PRICE_NOTES,
  PRICE_TIERS,
} from "@/lib/content/pathlab-page";

/**
 * Pricing: free daily micro Pathlab, solo, and group — as three clear tiers
 * rather than a flat label/value list.
 */
export function PathlabPrice() {
  return (
    <section
      id="pathlab-price"
      className="pathlab-price"
      aria-labelledby="pathlab-price-heading"
    >
      <h2 id="pathlab-price-heading" className="pathlab-price__heading">
        {PRICE_HEADING}
      </h2>
      <p className="pathlab-note-row">
        <span className="pathlab-note pathlab-note--tilt-l-sm">
          {NOTES.price}
        </span>
      </p>

      <ul className="pathlab-price__tiers">
        {PRICE_TIERS.map((tier) => (
          <li
            key={tier.label}
            className={`pathlab-price__tier pathlab-price__tier--${tier.tone}`}
          >
            {tier.chip && (
              <span className="pathlab-price__chip">{tier.chip}</span>
            )}
            <h3 className="pathlab-price__tier-label">{tier.label}</h3>
            <p className="pathlab-price__tier-amount">
              {tier.currency && (
                <span className="pathlab-price__currency">{tier.currency}</span>
              )}
              <span className="pathlab-price__figure">{tier.amount}</span>
            </p>
            <p className="pathlab-price__tier-unit">{tier.unit}</p>
            <p className="pathlab-price__tier-blurb">{tier.blurb}</p>
            {tier.cta && (
              <a
                className="pathlab-price__tier-cta"
                href={tier.cta.href}
                /* The LINE OA fallback leaves the site; the map link does not. */
                {...(tier.cta.href.startsWith("http")
                  ? { target: "_blank", rel: "noopener noreferrer" }
                  : {})}
              >
                {tier.cta.label}
              </a>
            )}
          </li>
        ))}
      </ul>

      <div className="pathlab-price__notes">
        {PRICE_NOTES.map((note) => (
          <p key={note}>{note}</p>
        ))}
        <div className="pathlab-price__ctas">
          <a
            className="pathlab-price__cta"
            href={CONTACT.href}
            target="_blank"
            rel="noopener noreferrer"
          >
            {PRICE_CTAS.ig}
          </a>
          <a
            className="pathlab-price__cta pathlab-price__cta--line"
            href={CONTACT.lineHref}
            target="_blank"
            rel="noopener noreferrer"
          >
            {PRICE_CTAS.line}
          </a>
        </div>
      </div>
    </section>
  );
}
