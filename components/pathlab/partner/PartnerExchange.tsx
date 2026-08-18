import { Backpack, HandCoins, ShieldCheck, Wrench } from "lucide-react";
import { NOTES } from "@/lib/content/pathlab-page";
import { PARTNER_EXCHANGE } from "@/lib/content/pathlab-partner";

/* Icons pair with PARTNER_EXCHANGE.cards by index; copy stays in the content
   file so the Thai can be edited without touching layout. */
const CARD_ICONS = [Backpack, Wrench, ShieldCheck, HandCoins];

/**
 * "แลกกันอย่างตรงไปตรงมา" — what the expert brings, what we handle, what
 * they control, what they receive. Four brown cards, the same dark inversion
 * as .pathlab-offer__card so the terms read as one distinct block on the
 * cream page. No revenue terms are promised here beyond "ตามที่ตกลงร่วมกัน"
 * until the actual model exists.
 */
export function PartnerExchange() {
  return (
    <section
      id="partner-exchange"
      className="pathlab-partner__section"
      aria-labelledby="partner-exchange-heading"
    >
      <h2 id="partner-exchange-heading" className="pathlab-partner__heading">
        {PARTNER_EXCHANGE.heading}
      </h2>

      <ul className="pathlab-partner__values">
        {PARTNER_EXCHANGE.cards.map((card, i) => {
          const Icon = CARD_ICONS[i];
          return (
            <li key={card.title} className="pathlab-partner__value">
              <span className="pathlab-partner__value-icon" aria-hidden="true">
                <Icon className="pathlab-partner__value-icon-svg" />
              </span>
              <h3 className="pathlab-partner__value-title">{card.title}</h3>
              <p className="pathlab-partner__value-body">{card.body}</p>
            </li>
          );
        })}
      </ul>

      <p className="pathlab-note-row">
        <span className="pathlab-note pathlab-note--tilt-r-sm">
          {NOTES.partnerExchange}
        </span>
      </p>
    </section>
  );
}
