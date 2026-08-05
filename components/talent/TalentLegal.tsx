import { Scale, Gift, Wallet, ShieldCheck } from "lucide-react";

const LEGAL_POINTS = [
  {
    Icon: Scale,
    line: "Prize awards, not employment — the age-15 floor is for work contracts.",
    ref: "LPA B.E. 2541",
  },
  {
    Icon: Gift,
    line: "A minor of any age can legally accept a prize.",
    ref: "CCC s.22",
  },
  {
    Icon: Wallet,
    line: "Paid by PromptPay or TrueMoney — 12+ can hold their own account.",
    ref: "Payout",
  },
  {
    Icon: ShieldCheck,
    line: "Under 15 join with a guardian-consent tick at signup.",
    ref: "PDPA B.E. 2562",
  },
] as const;

/** How student work is structured under Thai law: prize awards, not employment. */
export function TalentLegal() {
  return (
    <div className="talent-legal">
      <p className="talent-legal__lead">
        We run this as skill competitions and prize awards
        (การประกวดชิงรางวัล) — which is what lets a 13-year-old ship real work and
        get paid.
      </p>

      <div className="talent-legal__grid">
        {LEGAL_POINTS.map(({ Icon, line, ref }) => (
          <article key={ref} className="talent-legal__card">
            <Icon className="talent-legal__icon h-6 w-6" strokeWidth={1.75} aria-hidden="true" />
            <p className="talent-legal__line">{line}</p>
            <p className="talent-legal__ref">{ref}</p>
          </article>
        ))}
      </div>

      <p className="talent-legal__note">How we structure it. Not legal advice.</p>
    </div>
  );
}
