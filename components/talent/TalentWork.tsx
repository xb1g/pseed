import Image from "next/image";
import { ArrowUpRight, CheckCircle2 } from "lucide-react";
import type { TalentProfile } from "@/lib/talent";
import {
  TALENT_WORKS,
  TRACK_LABEL,
  type TalentWork,
  type TalentWorkMedia,
} from "@/lib/talent-work";

function WorkMedia({ media }: { media: TalentWorkMedia }) {
  if (media.kind === "image") {
    return (
      <div className="talent-work__media">
        <Image
          src={media.src}
          alt={media.alt}
          fill
          sizes="(max-width: 768px) 100vw, 33vw"
          className={media.fit === "cover" ? "object-cover" : "object-contain p-4"}
        />
      </div>
    );
  }

  if (media.kind === "embed") {
    return (
      <div className="talent-work__media talent-work__media--embed">
        <iframe
          src={media.src}
          title={media.title}
          loading="lazy"
          allow="encrypted-media; picture-in-picture"
          allowFullScreen
        />
      </div>
    );
  }

  return (
    <div className="talent-work__media talent-work__media--notes">
      {media.stats && (
        <div className="talent-work__stats">
          <span className="talent-work__stats-headline">{media.stats.headline}</span>
          <span className="talent-work__stats-caption">{media.stats.caption}</span>
          <span className="talent-work__stats-breakdown">{media.stats.breakdown}</span>
        </div>
      )}
      <ul>
        {media.points.map((point) => (
          <li key={point}>{point}</li>
        ))}
      </ul>
    </div>
  );
}

interface WorkCardProps {
  work: TalentWork;
  builder: string;
  school: string | null;
  verified: boolean;
}

function WorkCard({ work, builder, school, verified }: WorkCardProps) {
  return (
    <article className="talent-work__card">
      <WorkMedia media={work.media} />

      <div className="talent-work__body">
        <div className="talent-work__byline">
          <span className="talent-work__nickname">{work.nickname}</span>
          {verified && (
            <CheckCircle2
              className="talent-work__verified h-4 w-4"
              aria-label="Verified builder"
            />
          )}
          <span className="talent-work__track">{TRACK_LABEL[work.track]}</span>
        </div>
        <p className="talent-work__builder">
          {builder}
          {school ? ` · ${school}` : ""}
        </p>

        <h3 className="talent-work__title">{work.title}</h3>
        <p className="talent-work__summary">{work.summary}</p>
        <p className="talent-work__meta">{work.meta}</p>

        <a
          className="talent-work__link"
          href={work.href}
          target="_blank"
          rel="noopener noreferrer"
        >
          {work.hrefLabel}
          <ArrowUpRight className="h-4 w-4" />
        </a>
      </div>
    </article>
  );
}

interface TalentWorkShowcaseProps {
  profiles: TalentProfile[];
}

/** Real shipped work, joined to the live profile for name + school. */
export function TalentWorkShowcase({ profiles }: TalentWorkShowcaseProps) {
  const byNickname = new Map(profiles.map((p) => [p.nickname, p]));

  return (
    <div className="talent-work__grid">
      {TALENT_WORKS.map((work) => {
        const profile = byNickname.get(work.nickname);
        return (
          <WorkCard
            key={`${work.nickname}-${work.title}`}
            work={work}
            builder={profile?.full_name ?? work.nickname}
            school={profile?.school ?? null}
            verified={profile?.verified ?? false}
          />
        );
      })}
    </div>
  );
}
