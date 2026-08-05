import { Github, Linkedin, Globe, ExternalLink, CheckCircle2 } from "lucide-react";
import type { TalentProfile } from "@/lib/talent";

const TRACK_STYLE: Record<
  TalentProfile["track"],
  { label: string; gradient: string; ink: "light" | "dark" }
> = {
  dev: {
    label: "Developer",
    gradient:
      "radial-gradient(circle at 86% 14%, #9a8467 0%, transparent 38%), radial-gradient(circle at 45% 90%, #ffe0bd 0%, transparent 38%), linear-gradient(180deg, #15130f 0%, #39342c 56%, #17120d 100%)",
    ink: "light",
  },
  video: {
    label: "Video Editor",
    gradient:
      "radial-gradient(circle at 12% 12%, #ca0b4d 0%, transparent 36%), radial-gradient(circle at 88% 18%, #ffd3e9 0%, transparent 40%), linear-gradient(180deg, #c50d58 0%, #f2d5ff 46%, #e4bfff 100%)",
    ink: "dark",
  },
  strategy: {
    label: "Strategy",
    gradient:
      "radial-gradient(circle at 86% 100%, #a7ac63 0%, transparent 38%), radial-gradient(circle at 78% 0%, #1b3f9e 0%, transparent 44%), linear-gradient(180deg, #172a35 0%, #07142f 54%, #33431f 100%)",
    ink: "light",
  },
  design: {
    label: "Designer",
    gradient:
      "radial-gradient(circle at 92% 14%, #fff36a 0%, transparent 40%), linear-gradient(180deg, #e8932a 0%, #ffc900 74%, #f5b300 100%)",
    ink: "dark",
  },
};

function linkIcon(url: string) {
  if (url.includes("github.com")) return <Github className="h-3.5 w-3.5" />;
  if (url.includes("linkedin.com")) return <Linkedin className="h-3.5 w-3.5" />;
  if (url.includes("tiktok.com"))
    return <span className="text-[10px] font-bold leading-none">TT</span>;
  return <Globe className="h-3.5 w-3.5" />;
}

function linkLabel(url: string) {
  if (url.includes("github.com")) return "GitHub";
  if (url.includes("linkedin.com")) return "LinkedIn";
  if (url.includes("tiktok.com")) return "TikTok";
  try {
    return new URL(url).hostname.replace("www.", "");
  } catch {
    return "Link";
  }
}

interface TalentCardProps {
  profile: TalentProfile;
}

export function TalentCard({ profile }: TalentCardProps) {
  const { full_name, nickname, age, school, track, tools, portfolio_links, verified } =
    profile;
  const ts = TRACK_STYLE[track];
  const textColor = ts.ink === "light" ? "#ffffff" : "#1a1a1a";
  const subtextColor =
    ts.ink === "light" ? "rgba(255,255,255,0.70)" : "rgba(0,0,0,0.55)";
  const tagBg =
    ts.ink === "light" ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.10)";
  const tagBorder =
    ts.ink === "light" ? "rgba(255,255,255,0.18)" : "rgba(0,0,0,0.15)";
  const scrim =
    ts.ink === "light"
      ? "linear-gradient(to top, rgb(0 0 0 / 0.82) 0%, rgb(0 0 0 / 0.52) 40%, transparent 70%)"
      : "linear-gradient(to top, rgb(255 255 255 / 0.60) 0%, rgb(255 255 255 / 0.20) 40%, transparent 70%)";

  return (
    <div
      className="talent-card group relative isolate flex aspect-[4/5] w-full flex-col overflow-hidden rounded-lg shadow-[0_18px_50px_rgba(0,0,0,0.28)] sm:aspect-[3/5]"
      style={{ background: ts.gradient, color: textColor }}
    >
      {/* Grain overlay */}
      <span
        className="pointer-events-none absolute inset-0 z-[1] rounded-[inherit]"
        style={{
          backgroundImage:
            "radial-gradient(circle, rgba(255,255,255,0.14) 0 0.6px, transparent 0.9px), radial-gradient(circle, rgba(0,0,0,0.10) 0 0.7px, transparent 1px)",
          backgroundPosition: "0 0, 4px 5px",
          backgroundSize: "9px 9px, 12px 12px",
          mixBlendMode: "overlay",
          opacity: 0.6,
        }}
        aria-hidden="true"
      />

      {/* Top area — nickname large */}
      <div className="relative z-10 flex flex-1 flex-col justify-center px-4 pt-5 sm:px-5">
        <span
          className="font-radar-title text-3xl font-normal italic leading-none sm:text-4xl"
          style={{ textShadow: ts.ink === "light" ? "0 2px 12px rgb(0 0 0 / 0.5)" : "none" }}
        >
          {nickname}
        </span>
        {verified && (
          <CheckCircle2
            className="mt-2 h-4 w-4"
            style={{ color: "#C43E1D" }}
            aria-label="Verified"
          />
        )}
      </div>

      {/* Bottom scrim */}
      <span
        className="pointer-events-none absolute inset-x-0 bottom-0 z-[2] h-[55%]"
        style={{ background: scrim }}
        aria-hidden="true"
      />

      {/* Bottom content */}
      <div
        className="relative z-10 mt-auto flex flex-col gap-2 p-4 sm:p-5"
        style={{
          textShadow:
            ts.ink === "light" ? "0 1px 8px rgb(0 0 0 / 0.6)" : "none",
        }}
      >
        <p className="text-sm font-semibold leading-tight opacity-90">
          {full_name}
        </p>
        {(age !== null || school) && (
          <p className="text-xs leading-tight" style={{ color: subtextColor }}>
            {[age !== null ? `${age} yrs` : null, school].filter(Boolean).join(" · ")}
          </p>
        )}

        {/* Track tag + tools */}
        <div className="mt-1 flex flex-wrap gap-1.5">
          <span
            className="rounded-md border px-2 py-0.5 text-center font-mono text-xs font-bold"
            style={{
              borderColor: "currentColor",
              backgroundColor: tagBg,
            }}
          >
            {ts.label}
          </span>
          {tools.slice(0, 2).map((tool) => (
            <span
              key={tool}
              className="truncate rounded-md border px-2 py-0.5 text-xs"
              style={{
                borderColor: tagBorder,
                backgroundColor: tagBg,
              }}
            >
              {tool}
            </span>
          ))}
        </div>

        {/* Portfolio links */}
        {portfolio_links.length > 0 && (
          <div className="mt-1 flex flex-wrap gap-1.5">
            {portfolio_links.slice(0, 2).map((url) => (
              <a
                key={url}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 rounded-md px-2 py-0.5 text-xs transition-opacity hover:opacity-80"
                style={{
                  backgroundColor: tagBg,
                  borderColor: tagBorder,
                  border: `1px solid ${tagBorder}`,
                }}
              >
                {linkIcon(url)}
                <span className="truncate max-w-[5rem]">{linkLabel(url)}</span>
                <ExternalLink className="h-2.5 w-2.5 opacity-50" />
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
