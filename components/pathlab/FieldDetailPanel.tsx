import Image from "next/image";
import {
  CONTACT,
  FIELD_DETAIL_LABELS,
  type FieldCard,
} from "@/lib/content/pathlab-page";

interface FieldDetailPanelProps {
  /** Always a field carrying a `detail`; the caller guarantees it. */
  field: FieldCard;
  onBack: () => void;
  /** Focused on open so the keyboard lands inside the panel. */
  backRef: React.RefObject<HTMLButtonElement | null>;
}

/**
 * The expanded view of one path. Presentational: the parent owns which field
 * is open and the height choreography, so this renders content and reports
 * the one interaction it has.
 */
export function FieldDetailPanel({
  field,
  onBack,
  backRef,
}: FieldDetailPanelProps) {
  const detail = field.detail;
  if (!detail) return null;

  return (
    <>
      <button
        type="button"
        ref={backRef}
        className="pathlab-detail__back"
        onClick={onBack}
      >
        {FIELD_DETAIL_LABELS.back}
      </button>

      <div className="pathlab-detail__head">
        {/* The card they clicked, kept as an anchor so the expansion reads as
            the same object rather than a new page. */}
        <div className="pathlab-detail__chip">
          <Image
            src={field.src as string}
            alt=""
            fill
            sizes="(max-width: 640px) 7rem, 9.5rem"
          />
        </div>
        <div>
          <h3 className="pathlab-detail__title">{field.label}</h3>
          <p className="pathlab-detail__tagline">{detail.tagline}</p>
        </div>
      </div>

      <div className="pathlab-detail__block">
        <h4 className="pathlab-detail__block-title">
          {FIELD_DETAIL_LABELS.reality}
        </h4>
        <ul className="pathlab-detail__reality">
          {detail.reality.map((line) => (
            <li key={line}>
              <span>{line}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="pathlab-detail__block">
        <h4 className="pathlab-detail__block-title">
          {FIELD_DETAIL_LABELS.brief}
        </h4>
        <div className="pathlab-detail__brief">
          <p className="pathlab-detail__brief-name">{detail.brief}</p>
          <p className="pathlab-detail__brief-text">{detail.briefDetail}</p>
          <p className="pathlab-detail__brief-by">{detail.briefBy}</p>
        </div>
      </div>

      <div className="pathlab-detail__block">
        {/* The count comes from the data: paths do not all run the same
            number of days, and the heading must not claim otherwise. */}
        <h4 className="pathlab-detail__block-title">
          {detail.days.length} {FIELD_DETAIL_LABELS.daysPrefix}
        </h4>
        <ol
          className="pathlab-detail__days"
          style={
            { "--day-count": detail.days.length } as React.CSSProperties
          }
        >
          {detail.days.map((day, index) => (
            <li
              key={day.title}
              // The last day carries the payoff, so it takes the dark card.
              className={`pathlab-detail__day${
                index === detail.days.length - 1 ? " is-final" : ""
              }`}
            >
              <span className="pathlab-detail__day-num" aria-hidden="true">
                {index + 1}
              </span>
              <div>
                <p className="pathlab-detail__day-title">{day.title}</p>
                <p className="pathlab-detail__day-doing">{day.doing}</p>
                <span className="pathlab-detail__day-gets">→ {day.gets}</span>
              </div>
            </li>
          ))}
        </ol>
      </div>

      <div className="pathlab-detail__block">
        <h4 className="pathlab-detail__block-title">
          {FIELD_DETAIL_LABELS.outcomes}
        </h4>
        <ul className="pathlab-detail__outcomes">
          {detail.outcomes.map((outcome, index) => (
            <li
              key={outcome}
              // The self-discovery outcome is the one being sold, so it leads.
              className={`pathlab-detail__outcome${
                index === 0 ? " is-primary" : ""
              }`}
            >
              <span className="pathlab-detail__tick" aria-hidden="true">
                ✓
              </span>
              <span>{outcome}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="pathlab-detail__block">
        <h4 className="pathlab-detail__block-title">
          {FIELD_DETAIL_LABELS.basis}
        </h4>
        <div className="pathlab-detail__unblock">
          {/* The most reassuring sentence on the page gets the marker. */}
          <p className="pathlab-detail__unblock-answer">
            <span className="pathlab-note pathlab-note--tilt-r-sm">
              {FIELD_DETAIL_LABELS.basisAnswer}
            </span>
          </p>
          <blockquote className="pathlab-detail__quote">
            {detail.quote}
            <cite className="pathlab-detail__cite">{detail.cite}</cite>
          </blockquote>
        </div>
      </div>

      <div className="pathlab-detail__cta">
        {/* Naming the field means the DM starts with context attached. */}
        <a
          className="pathlab-detail__cta-button"
          href={CONTACT.href}
          target="_blank"
          rel="noopener noreferrer"
        >
          {FIELD_DETAIL_LABELS.ctaPrefix} {field.label}
        </a>
        <p className="pathlab-detail__cta-price">{FIELD_DETAIL_LABELS.price}</p>
      </div>
    </>
  );
}
