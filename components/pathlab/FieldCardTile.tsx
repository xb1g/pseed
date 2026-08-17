import Image from "next/image";
import {
  CONTACT,
  FIELD_DETAIL_LABELS,
  type FieldCard,
} from "@/lib/content/pathlab-page";

const IMAGE_SIZES = "(max-width: 640px) 44vw, (max-width: 1024px) 30vw, 14rem";

interface FieldCardTileProps {
  field: FieldCard;
  /** Absent for fields with no detail — those tiles lead to the DM instead. */
  onOpen?: () => void;
  isOpen: boolean;
}

/**
 * One tile in the field grid. Three shapes: an openable path (a button), a
 * path whose five-day copy is not written yet (a link to DM — never a dead
 * end), and the closing "ask us" tile (a link).
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
      {/* Real text, not a pseudo-element: the cue has to reach screen
          readers, not just sighted users. */}
      {field.detail && (
        <span className="pathlab-fields__cue" aria-hidden="true">
          {FIELD_DETAIL_LABELS.cardCue}
        </span>
      )}
    </div>
  );

  // A field whose plan is not written yet still leads somewhere: tapping it
  // opens a DM asking for that field, so it is an invitation, not a wall.
  if (!field.detail) {
    return (
      <a
        className="pathlab-fields__button"
        href={CONTACT.href}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`${field.label}, ${FIELD_DETAIL_LABELS.ctaPrefix} ${field.label}`}
      >
        {frame}
      </a>
    );
  }

  if (!onOpen) return frame;

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
