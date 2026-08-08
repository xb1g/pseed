import Link from "next/link";
import {
  ArrowUpRight,
  Compass,
  FlaskConical,
  Quote,
  Sprout,
  Star,
} from "lucide-react";

import type { ProjectCard } from "@/lib/profile/portfolio";

export function ProjectCardBase({
  card,
  featured = false,
  actions,
}: {
  card: ProjectCard;
  featured?: boolean;
  actions?: React.ReactNode;
}) {
  const toneClass =
    card.statusTone === "active"
      ? "border-emerald-300/25 bg-emerald-400/10 text-emerald-200"
      : card.statusTone === "done"
        ? "border-blue-300/25 bg-blue-400/10 text-blue-200"
        : "border-white/10 bg-white/5 text-slate-300";

  const body = (
    <>
      <div className="flex items-start justify-between gap-3">
        <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
          {card.source === "pathlab" ? (
            <FlaskConical className="h-3.5 w-3.5" />
          ) : (
            <Sprout className="h-3.5 w-3.5" />
          )}
          {card.source === "pathlab" ? "PathLab" : "ProjectSeed"}
        </p>
        <div className="flex items-center gap-2">
          {card.isHero ? (
            <span className="inline-flex items-center gap-1 rounded-full border border-amber-300/30 bg-amber-400/15 px-2.5 py-0.5 text-xs font-semibold text-amber-200">
              <Star className="h-3 w-3 fill-current" />
              #1 piece
            </span>
          ) : null}
          <span
            className={`rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize ${toneClass}`}
          >
            {card.status.replace(/_/g, " ")}
          </span>
        </div>
      </div>

      <p
        className={`mt-3 font-[family-name:var(--font-libre-franklin)] font-semibold text-white ${
          featured ? "text-2xl" : "text-lg"
        }`}
      >
        {card.title}
      </p>
      <p className="mt-1 text-sm text-slate-400">{card.subtitle}</p>

      {card.detail ? (
        <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-300">
          {card.detail}
        </p>
      ) : null}

      {card.impact ? (
        <p className="mt-3 flex items-start gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-sm leading-6 text-slate-200">
          <Quote className="mt-1 h-3.5 w-3.5 shrink-0 text-amber-200/70" />
          {card.impact}
        </p>
      ) : null}

      <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-slate-300">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2.5 py-1">
          <Compass className="h-3 w-3" />
          {card.metric}
        </span>
        {card.tags.map((tag) => (
          <span
            key={tag}
            className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1"
          >
            {tag}
          </span>
        ))}
      </div>

      {card.evidenceHref ? (
        <p className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-blue-200">
          View journey report
          <ArrowUpRight className="h-4 w-4" />
        </p>
      ) : null}

      {actions ? <div className="mt-4 border-t border-white/10 pt-4">{actions}</div> : null}
    </>
  );

  const className = `block rounded-[24px] border bg-white/[0.03] transition-colors hover:bg-white/[0.06] ${
    featured ? "border-amber-300/20 p-6 sm:p-7" : "border-white/10 p-5"
  }`;

  return card.evidenceHref && !actions ? (
    <Link href={card.evidenceHref} className={className}>
      {body}
    </Link>
  ) : (
    <div className={className}>{body}</div>
  );
}
