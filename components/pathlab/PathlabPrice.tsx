import {
  PRICE_HEADING,
  PRICE_NOTES,
  PRICE_ROWS,
} from "@/lib/content/pathlab-page";

/**
 * Pricing, and how the rounds are formed.
 *
 * Server component: static copy with nothing to hydrate. A definition list
 * rather than a table, since this is two label/value pairs and not tabular
 * data with meaningful columns.
 */
export function PathlabPrice() {
  return (
    <section className="pathlab-price" aria-labelledby="pathlab-price-heading">
      <h2 id="pathlab-price-heading" className="pathlab-price__heading">
        {PRICE_HEADING}
      </h2>

      <dl className="pathlab-price__rows">
        {PRICE_ROWS.map((row) => (
          <div key={row.label} className="pathlab-price__row">
            <dt className="pathlab-price__label">{row.label}</dt>
            <dd className="pathlab-price__value">
              <span className="pathlab-price__amount">{row.amount}</span>{" "}
              {row.unit}
            </dd>
          </div>
        ))}
      </dl>

      <div className="pathlab-price__notes">
        {PRICE_NOTES.map((note) => (
          <p key={note}>{note}</p>
        ))}
      </div>
    </section>
  );
}
