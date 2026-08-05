import {
  AppWindow,
  Briefcase,
  PencilRuler,
  ShieldPlus,
  Video,
  type LucideIcon,
} from "lucide-react";
import type { TalentProfile } from "@/lib/talent";

interface Category {
  label: string;
  Icon: LucideIcon;
  /** Track in `talent_profiles` this category counts, when there is one. */
  track?: TalentProfile["track"];
  /**
   * Nicknames to count for categories with no matching track. The `track` enum
   * predates these skills, so someone can be filed under `dev` and still be the
   * person who does the pen-testing.
   */
  nicknames?: readonly string[];
  blurb: string;
}

const CATEGORIES: readonly Category[] = [
  {
    label: "Design",
    Icon: PencilRuler,
    track: "design",
    blurb: "Illustration, UI, decks",
  },
  {
    label: "Software",
    Icon: AppWindow,
    track: "dev",
    blurb: "Next.js, Python, APIs",
  },
  {
    label: "Video",
    Icon: Video,
    track: "video",
    blurb: "Short-form, subtitles, sound",
  },
  {
    label: "Pen-Test",
    Icon: ShieldPlus,
    nicknames: ["Tiny"],
    blurb: "Recon, disclosure writeups",
  },
  {
    label: "Strategy",
    Icon: Briefcase,
    track: "strategy",
    blurb: "Research, hardware, planning",
  },
];

interface TalentCategoriesProps {
  profiles: TalentProfile[];
}

export function TalentCategories({ profiles }: TalentCategoriesProps) {
  return (
    <div className="talent-cats">
      {CATEGORIES.map(({ label, Icon, track, nicknames, blurb }) => {
        const count = profiles.filter(
          (p) =>
            (track !== undefined && p.track === track) ||
            (nicknames?.includes(p.nickname) ?? false),
        ).length;

        return (
          <article key={label} className="talent-cats__card">
            <Icon className="talent-cats__icon h-6 w-6" strokeWidth={1.75} aria-hidden="true" />
            <h3 className="talent-cats__label">{label}</h3>
            <p className="talent-cats__blurb">{blurb}</p>
            <p className="talent-cats__count">
              {count > 0 ? `${count} available` : "Open — recruiting"}
            </p>
          </article>
        );
      })}
    </div>
  );
}
