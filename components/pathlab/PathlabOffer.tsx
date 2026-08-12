import { OFFER_CARDS, OFFER_HEADING } from "@/lib/content/pathlab-page";

/**
 * "Pathlab เลยจะช่วยเริ่มต้นให้?" — the three things a Pathlab gives you.
 *
 * Server component: static copy with no interaction, so there is nothing to
 * hydrate. The brown cards invert the page's cream ground, which is what
 * separates this answer from the problem stated in the section above.
 */
export function PathlabOffer() {
  return (
    <section className="pathlab-offer" aria-labelledby="pathlab-offer-heading">
      <h2 id="pathlab-offer-heading" className="pathlab-offer__heading">
        {OFFER_HEADING}
      </h2>

      <ul className="pathlab-offer__grid">
        {OFFER_CARDS.map((card) => (
          <li key={card.title} className="pathlab-offer__card">
            <h3 className="pathlab-offer__card-title">{card.title}</h3>
            <p className="pathlab-offer__card-body">{card.body}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
