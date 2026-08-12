import Image from "next/image";
import { JOURNEY } from "@/lib/content/pathlab-page";

/**
 * Shows what a Pathlab learning journey looks like in the product — the day
 * map + activity panel, so visitors see the experience before enrolling.
 */
export function PathlabJourney() {
  return (
    <section
      id="pathlab-journey"
      className="pathlab-journey"
      aria-labelledby="pathlab-journey-heading"
    >
      <div className="pathlab-journey__copy">
        <h2 id="pathlab-journey-heading" className="pathlab-journey__heading">
          {JOURNEY.heading}
        </h2>
        <p className="pathlab-journey__body">{JOURNEY.body}</p>
      </div>

      <figure className="pathlab-journey__frame">
        <Image
          src={JOURNEY.src}
          alt={JOURNEY.alt}
          width={2538}
          height={1342}
          sizes="(max-width: 900px) 94vw, 72rem"
          className="pathlab-journey__img"
          priority={false}
        />
      </figure>
    </section>
  );
}
