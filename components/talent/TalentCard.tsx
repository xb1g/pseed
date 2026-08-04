import { Github, Linkedin, Globe, ExternalLink, CheckCircle2 } from "lucide-react";
import type { TalentProfile } from "@/lib/talent";

const TRACK_STYLE: Record<TalentProfile["track"], { label: string; classes: string }> = {
  dev: { label: "Developer", classes: "bg-blue-500/20 text-blue-300 ring-blue-500/30" },
  video: { label: "Video Editor", classes: "bg-pink-500/20 text-pink-300 ring-pink-500/30" },
  strategy: { label: "Strategy", classes: "bg-amber-500/20 text-amber-300 ring-amber-500/30" },
  design: { label: "Designer", classes: "bg-purple-500/20 text-purple-300 ring-purple-500/30" },
};

function linkIcon(url: string) {
  if (url.includes("github.com")) return <Github className="h-4 w-4" />;
  if (url.includes("linkedin.com")) return <Linkedin className="h-4 w-4" />;
  if (url.includes("tiktok.com")) return <span className="text-xs font-bold leading-none">TT</span>;
  return <Globe className="h-4 w-4" />;
}

function linkLabel(url: string) {
  if (url.includes("github.com")) return "GitHub";
  if (url.includes("linkedin.com")) return "LinkedIn";
  if (url.includes("tiktok.com")) return "TikTok";
  try { return new URL(url).hostname.replace("www.", ""); } catch { return "Link"; }
}

interface TalentCardProps {
  profile: TalentProfile;
}

export function TalentCard({ profile }: TalentCardProps) {
  const { full_name, nickname, age, school, track, tools, portfolio_links, verified } = profile;
  const trackStyle = TRACK_STYLE[track];

  return (
    <div className="ei-card flex flex-col gap-3 p-5">
      {/* Header row */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="text-xl font-bold text-white">{nickname}</h3>
          <p className="text-sm text-slate-400">{full_name}</p>
        </div>
        {verified && (
          <CheckCircle2 className="h-5 w-5 shrink-0 text-amber-400" aria-label="Verified" />
        )}
      </div>

      {/* Track badge */}
      <span
        className={`inline-self-start w-fit rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ${trackStyle.classes}`}
      >
        {trackStyle.label}
      </span>

      {/* Age + school */}
      {(age !== null || school) && (
        <p className="text-sm text-slate-400">
          {[age !== null ? `${age} yrs` : null, school].filter(Boolean).join(" · ")}
        </p>
      )}

      {/* Tools */}
      {tools.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {tools.map((tool) => (
            <span
              key={tool}
              className="rounded-md bg-white/5 px-2 py-0.5 text-xs text-slate-300 ring-1 ring-white/10"
            >
              {tool}
            </span>
          ))}
        </div>
      )}

      {/* Portfolio links */}
      {portfolio_links.length > 0 && (
        <div className="mt-auto flex flex-wrap gap-1.5 border-t border-white/8 pt-3">
          {portfolio_links.map((url) => (
            <a
              key={url}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 rounded-md bg-white/5 px-2.5 py-1 text-xs text-slate-300 ring-1 ring-white/10 transition-colors duration-150 hover:bg-white/10 hover:text-white"
            >
              {linkIcon(url)}
              <span>{linkLabel(url)}</span>
              <ExternalLink className="h-3 w-3 opacity-60" />
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
