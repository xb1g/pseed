import { Sparkles } from "lucide-react";
import { NOTES } from "@/lib/content/pathlab-page";
import { PARTNER_HERO, PARTNER_METRICS } from "@/lib/content/pathlab-partner";

/**
 * Partner hero: eyebrow chip, Kodchasan title with a terracotta accent, and
 * the two questions a forwarded expert arrives with ("ฉันแบ่งปันอะไรได้บ้าง?"
 * and "ต้องทำอะไรบ้าง เสียเวลาแค่ไหน?") answered by the CTAs and the metric
 * chips below.
 */
export function PartnerHero() {
  return (
    <section className="pathlab-partner__hero" aria-labelledby="partner-hero-title">
      <p className="pathlab-partner__eyebrow">
        <Sparkles className="pathlab-partner__eyebrow-icon" aria-hidden="true" />
        {PARTNER_HERO.eyebrow}
      </p>

      <h1 id="partner-hero-title" className="pathlab-partner__title">
        {PARTNER_HERO.titleLead}{" "}
        <span className="pathlab-partner__title-accent">
          {PARTNER_HERO.titleAccent}
        </span>{" "}
        {PARTNER_HERO.titleTail}
      </h1>

      <p className="pathlab-partner__subtitle">
        {PARTNER_HERO.subtitleLead}{" "}
        <strong>{PARTNER_HERO.subtitleStrong}</strong> {PARTNER_HERO.subtitleTail}
      </p>

      <div className="pathlab-hero__ctas pathlab-partner__ctas">
        <a
          className="pathlab-hero__cta pathlab-hero__cta--primary"
          href={PARTNER_HERO.ctas.primary.href}
        >
          {PARTNER_HERO.ctas.primary.label}
        </a>
        <a
          className="pathlab-hero__cta pathlab-hero__cta--secondary"
          href={PARTNER_HERO.ctas.secondary.href}
        >
          {PARTNER_HERO.ctas.secondary.label}
        </a>
      </div>

      {/* The quiet thing the pitch cannot say formally. */}
      <p className="pathlab-note-row">
        <span className="pathlab-note">{NOTES.partnerHero}</span>
      </p>

      <ul className="pathlab-partner__metrics">
        {PARTNER_METRICS.map((metric) => (
          <li key={metric.value} className="pathlab-partner__metric">
            <p className="pathlab-partner__metric-value">{metric.value}</p>
            <p className="pathlab-partner__metric-label">{metric.label}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
