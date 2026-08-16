import type { Metadata } from "next";
import {
  HERO,
  OFFER_CARDS,
  FIELDS,
  REVIEWS,
  PRICE_TIERS,
  CONTACT,
} from "@/lib/content/pathlab-page";

export const metadata: Metadata = {
  title: "Pathlab Poster — Passion Seed",
  /** A print artifact, not a landing page — keep it out of search results. */
  robots: { index: false, follow: false },
};

/**
 * A4 promotional poster for Pathlab, built from the same copy and palette as
 * the /pathlab page so the two never drift apart. One sheet, portrait,
 * print-ready: `@page` and the mm sizing live in globals.css next to the
 * other pathlab styles.
 *
 * Server component: a poster has nothing to hydrate, and the print path must
 * not depend on client JS.
 */
export default function PathlabPosterPage() {
  /* The two quotes that fit a poster: one short punch, one that answers the
     "but I have no background" worry. Picked by handle so reordering the
     REVIEWS array does not silently swap the poster's picks. */
  const posterReviews = ["IG:_ppangkorn", "IG:xn_z96x"]
    .map((handle) => REVIEWS.find((r) => r.ig === handle))
    .filter((r) => r !== undefined);

  /* The poster pushes only the two fields being promoted right now, not the
     full open list — picked by label so data edits elsewhere do not silently
     change the poster. */
  const posterFields = ["Web Dev", "Business Innovation"]
    .map((label) => FIELDS.find((f) => f.label === label))
    .filter((f) => f !== undefined);

  return (
    <main className="pathlab-poster-stage">
      <article className="pathlab-poster" aria-label="โปสเตอร์ Pathlab">
        <header className="pathlab-poster__top">
          <span className="pathlab-poster__brand">Passion Seed</span>
          <span className="pathlab-poster__brand-tag">
            ทำ Project จริงกับผู้เชี่ยวชาญ
          </span>
        </header>

        <section className="pathlab-poster__hero">
          <h1 className="pathlab-poster__title">{HERO.title}</h1>
          <p className="pathlab-poster__subtitle">
            {HERO.subtitleLines.map((line) => (
              <span key={line}>{line}</span>
            ))}
          </p>
        </section>

        <ul className="pathlab-poster__offers">
          {OFFER_CARDS.map((card) => (
            <li key={card.title} className="pathlab-poster__offer">
              <h2 className="pathlab-poster__offer-title">{card.title}</h2>
              <p className="pathlab-poster__offer-body">{card.body}</p>
            </li>
          ))}
        </ul>

        <section className="pathlab-poster__fields">
          <h2 className="pathlab-poster__fields-heading">สายที่เปิดตอนนี้</h2>
          <ul className="pathlab-poster__fields-list">
            {posterFields.map((field) => (
              <li key={field.label} className="pathlab-poster__field">
                {field.label}
              </li>
            ))}
          </ul>
        </section>

        <section className="pathlab-poster__reviews">
          <h2 className="pathlab-poster__reviews-heading">Review จากรุ่นพี่</h2>
          <ul className="pathlab-poster__reviews-list">
            {posterReviews.map((review) => (
              <li key={review.ig} className="pathlab-poster__review">
                <span
                  className="pathlab-poster__review-mark pathlab-poster__review-mark--open"
                  aria-hidden="true"
                >
                  “
                </span>
                <blockquote className="pathlab-poster__review-quote">
                  {review.quote}
                </blockquote>
                <p className="pathlab-poster__review-ig">{review.ig}</p>
                {review.by && (
                  <p className="pathlab-poster__review-by">{review.by}</p>
                )}
              </li>
            ))}
          </ul>
        </section>

        <ul className="pathlab-poster__prices">
          {PRICE_TIERS.map((tier) => (
            <li
              key={tier.label}
              className={`pathlab-poster__price pathlab-poster__price--${tier.tone}`}
            >
              <span className="pathlab-poster__price-label">{tier.label}</span>
              <span className="pathlab-poster__price-amount">
                {tier.currency}
                {tier.amount}
              </span>
              <span className="pathlab-poster__price-unit">{tier.unit}</span>
            </li>
          ))}
        </ul>

        <footer className="pathlab-poster__cta">
          <p className="pathlab-poster__cta-line">{CONTACT.line}</p>
          <p className="pathlab-poster__cta-handle">
            IG: <strong>{CONTACT.handle}</strong>
          </p>
        </footer>
      </article>
    </main>
  );
}
