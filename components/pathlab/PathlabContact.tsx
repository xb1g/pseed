import { CONTACT, NOTES } from "@/lib/content/pathlab-page";

/**
 * Closing call to action.
 *
 * The handle is a real link rather than plain text: it is the only action on
 * the page, and asking someone to retype a handle they can see is friction for
 * no reason. `rel="noopener"` because it opens in a new tab.
 */
export function PathlabContact() {
  return (
    <section
      id="pathlab-contact"
      className="pathlab-contact"
      aria-labelledby="pathlab-contact-line"
    >
      <p id="pathlab-contact-line" className="pathlab-contact__line">
        {CONTACT.line}
      </p>
      {/* Two doors, same room: IG is where the audience already is, LINE OA
          answers instantly and is easier to book through. */}
      <div className="pathlab-contact__channels">
        <a
          className="pathlab-contact__handle"
          href={CONTACT.href}
          target="_blank"
          rel="noopener noreferrer"
        >
          IG: {CONTACT.handle}
        </a>
        <a
          className="pathlab-contact__handle"
          href={CONTACT.lineHref}
          target="_blank"
          rel="noopener noreferrer"
        >
          {CONTACT.lineLabel}
        </a>
      </div>
      <p className="pathlab-note-row">
        <span className="pathlab-note">{NOTES.contact}</span>
      </p>
    </section>
  );
}
