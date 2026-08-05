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
      {CATEGORIES.map(({ label, Icon, track, blurb }) => {
        const count = track
          ? profiles.filter((p) => p.track === track).length
          : 0;

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
