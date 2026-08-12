import Image from "next/image";
import {
  COMING_SOON_LABEL,
  CONTACT,
  FIELDS,
  FIELDS_HEADING,
} from "@/lib/content/pathlab-page";

/**
 * "สายที่เปิดในตอนนี้" — the paths currently open.
 *
 * Server component: static imagery and labels with nothing to hydrate. The
 * artwork is pre-cut to a shared 876x1171 frame, so the cards need no fit
 * correction; they simply fill.
 */
export function PathlabFields() {
  return (
    <section className="pathlab-fields" aria-labelledby="pathlab-fields-heading">
      <h2 id="pathlab-fields-heading" className="pathlab-fields__heading">
        {FIELDS_HEADING}
      </h2>

      <ul className="pathlab-fields__grid">
        {FIELDS.map((field) => (
          <li
            key={field.label}
            className={`pathlab-fields__item${
              field.comingSoon ? " is-coming-soon" : ""
            }${field.ask ? " is-ask" : ""}`}
          >
            {field.ask ? (
              // A link, not a decorative tile: it asks the reader to get in
              // touch, so it has to be actionable.
              <a
                className="pathlab-fields__frame pathlab-fields__ask"
                href={CONTACT.href}
                target="_blank"
                rel="noopener noreferrer"
              >
                <span aria-hidden="true">?</span>
                <span className="sr-only">{field.label}</span>
              </a>
            ) : (
              <div className="pathlab-fields__frame">
                <Image
                  src={field.src as string}
                  alt={field.alt ?? ""}
                  fill
                  sizes="(max-width: 640px) 44vw, (max-width: 1024px) 30vw, 14rem"
                />
                {/* Real text, not a pseudo-element: the status has to reach
                    screen readers, not just sighted users. */}
                {field.comingSoon && (
                  <span className="pathlab-fields__badge">
                    {COMING_SOON_LABEL}
                  </span>
                )}
              </div>
            )}
            {/* The ask tile authors its own line break, so it is rendered as
                separate lines rather than relying on where the text wraps. */}
            <p className="pathlab-fields__label">
              {field.ask
                ? field.label.split("\n").map((line) => (
                    <span key={line} className="pathlab-fields__label-line">
                      {line}
                    </span>
                  ))
                : field.label}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}
