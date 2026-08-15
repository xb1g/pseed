import { PARENTS_VOICES } from "@/lib/content/pathlab-parents";
import { ParentsNote, ParentsSection, SectionHeading } from "./section";

/**
 * Alumni quotes, attributed. A parent discounts an anonymous testimonial
 * instantly, so only reviews carrying a name and a faculty are shown here.
 */
export function ParentsVoices() {
  if (PARENTS_VOICES.reviews.length === 0) return null;

  return (
    <ParentsSection labelledBy="parents-voices">
      <SectionHeading
        id="parents-voices"
        eyebrow={PARENTS_VOICES.eyebrow}
        title={PARENTS_VOICES.title}
      />

      <ul className="mt-10 grid gap-4 lg:grid-cols-3">
        {PARENTS_VOICES.reviews.map((review) => (
          <li key={review.quote} className="ei-card ei-card--static flex flex-col p-6">
            <blockquote className="flex-1 font-bai-jamjuree text-base leading-8 text-slate-200">
              {review.quote}
            </blockquote>
            <footer className="mt-5 border-t border-white/10 pt-4">
              <p className="font-kodchasan text-sm font-medium text-white">
                {review.by}
              </p>
              <p className="mt-1 font-space-mono text-xs text-blue-200/80">
                {review.ig}
              </p>
            </footer>
          </li>
        ))}
      </ul>

      <ParentsNote>{PARENTS_VOICES.note}</ParentsNote>
    </ParentsSection>
  );
}
