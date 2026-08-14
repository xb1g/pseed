import Image from "next/image";
import {
  COMING_SOON_LABEL,
  CONTACT,
  FIELD_DETAIL_LABELS,
  type FieldCard,
} from "@/lib/content/pathlab-page";

const IMAGE_SIZES = "(max-width: 640px) 44vw, (max-width: 1024px) 30vw, 14rem";

interface FieldCardTileProps {
  field: FieldCard;
  /** Absent for fields with no detail — those tiles are not actionable. */
  onOpen?: () => void;
  isOpen: boolean;
}

/**
 * One tile in the field grid. Three shapes: an openable path (a button), a
 * path not yet running (inert), and the closing "ask us" tile (a link).
 */
export function FieldCardTile({ field, onOpen, isOpen }: FieldCardTileProps) {
  if (field.ask) {
    return (
      <a
        className="pathlab-fields__frame pathlab-fields__ask"
        href={CONTACT.href}
        target="_blank"
        rel="noopener noreferrer"
      >
        <span aria-hidden="true">?</span>
        <span className="sr-only">{field.label}</span>
      </a>
    );
  }

  const frame = (
    <div className="pathlab-fields__frame">
      <Image
        src={field.src as string}
        alt={field.alt ?? ""}
        fill
        sizes={IMAGE_SIZES}
      />
      {/* Real text, not a pseudo-element: the status has to reach screen
          readers, not just sighted users. */}
      {field.comingSoon && (
        <span className="pathlab-fields__badge">{COMING_SOON_LABEL}</span>
      )}
      {field.detail && (
        <span className="pathlab-fields__cue" aria-hidden="true">
          {FIELD_DETAIL_LABELS.cardCue}
        </span>
      )}
    </div>
  );

  // Only a field with written copy can be opened; everything else stays inert
  // so "clickable" never promises something that is not there.
  if (!field.detail || !onOpen) return frame;

  return (
    <button
      type="button"
      className="pathlab-fields__button"
      onClick={onOpen}
      aria-expanded={isOpen}
      aria-label={`${field.label} ${FIELD_DETAIL_LABELS.cardAction}`}
    >
      {frame}
    </button>
  );
}
