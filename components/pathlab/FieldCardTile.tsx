import Image from "next/image";
import {
  COMING_SOON_CUE,
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
 * path not yet running (a link to DM — never a dead end), and the closing
 * "ask us" tile (a link).
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
          readers, not just sighted users. A path whose plan is written
          carries no badge: it has something to show, and the panel states
          plainly that the round is not open yet. */}
      {field.comingSoon && !field.detail && (
        <span className="pathlab-fields__badge">{COMING_SOON_LABEL}</span>
      )}
      {field.detail && (
        <span className="pathlab-fields__cue" aria-hidden="true">
          {field.comingSoon
            ? FIELD_DETAIL_LABELS.soonCardCue
            : FIELD_DETAIL_LABELS.cardCue}
        </span>
      )}
    </div>
  );

  // A field that is not open yet still leads somewhere: tapping it opens a
  // DM asking for that field, so "Coming soon" is an invitation, not a wall.
  // Unless its copy is written — then it opens like any other path, because
  // reading the days is what makes someone want to ask for it.
  if (field.comingSoon && !field.detail) {
    return (
      <a
        className="pathlab-fields__button pathlab-fields__button--soon"
        href={CONTACT.href}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`${field.label}, ${COMING_SOON_LABEL}, ${COMING_SOON_CUE}`}
      >
        {frame}
      </a>
    );
  }

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
