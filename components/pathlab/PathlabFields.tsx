import Image from "next/image";
import { FIELDS, FIELDS_HEADING } from "@/lib/content/pathlab-page";

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
          <li key={field.src} className="pathlab-fields__item">
            <div className="pathlab-fields__frame">
              <Image
                src={field.src}
                alt={field.alt}
                fill
                sizes="(max-width: 640px) 44vw, (max-width: 1024px) 30vw, 14rem"
              />
            </div>
            <p className="pathlab-fields__label">{field.label}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
