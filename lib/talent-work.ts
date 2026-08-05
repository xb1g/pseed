import type { TalentProfile } from "@/lib/talent";

/**
 * Real, shipped work from the students in `talent_profiles`.
 *
 * Hand-curated rather than DB-driven: each entry points at a public artifact
 * (a file we host, an embeddable post, or a published writeup) and is only
 * added once that artifact exists. Keep the copy factual — these are other
 * people's portfolios.
 */

export type TalentWorkMedia =
  /** `fit` defaults to "contain" — use "cover" for photographs. */
  | { kind: "image"; src: string; alt: string; fit?: "contain" | "cover" }
  | { kind: "embed"; src: string; title: string }
  | {
      kind: "notes";
      /** Scale band above the notes — headline number plus what makes it up. */
      stats?: { headline: string; caption: string; breakdown: string };
      points: readonly string[];
    };

export interface TalentWork {
  /** Matches `nickname` in `talent_profiles` — the profile is the source of
   *  truth for the builder's name and school. */
  nickname: string;
  track: TalentProfile["track"];
  /** What the piece is. */
  title: string;
  /** One or two sentences on what it does / what shipped. */
  summary: string;
  /** Date + context line, e.g. "Apr 2026 · responsible disclosure". */
  meta: string;
  href: string;
  hrefLabel: string;
  media: TalentWorkMedia;
}

export const TRACK_LABEL: Record<TalentProfile["track"], string> = {
  dev: "Developer",
  video: "Video Editor",
  strategy: "Strategy",
  design: "Designer",
};

export const TALENT_WORKS: readonly TalentWork[] = [
  {
    nickname: "Gloya",
    track: "design",
    title: "Chibi developer mascot",
    summary:
      "Original character illustration — line art, flats and shading done in-house, delivered as a transparent-ready mascot for dev-facing branding.",
    meta: "Character illustration · digital",
    href: "https://gloya-profile.onrender.com/",
    hrefLabel: "gloya-profile.onrender.com",
    media: {
      kind: "image",
      src: "/talent/work/gloya-chibi-dev.webp",
      alt: "Chibi cat-eared developer character holding a laptop, drawn by Gloya",
    },
  },
  {
    nickname: "Bing",
    track: "video",
    title: "“วางแผนอนาคต ก่อนโดนมันเล่นงาน”",
    summary:
      "Short-form reel cut for @passion_seed.th — script-to-cut edit with Thai subtitles, pacing and sound design for a career-planning campaign.",
    meta: "Jul 2026 · Instagram Reel for @passion_seed.th",
    href: "https://www.instagram.com/p/DbGNcjcxAI3/",
    hrefLabel: "View on Instagram",
    media: {
      kind: "embed",
      src: "https://www.instagram.com/p/DbGNcjcxAI3/embed",
      title: "Instagram reel edited by Bing for @passion_seed.th",
    },
  },
  {
    nickname: "Nutt",
    track: "strategy",
    title: "Hand-built quadcopter",
    summary:
      "Self-assembled drone: F450-class frame with 3D-printed arms, brushless motors and ESCs wired by hand, and a Raspberry Pi stacked on the flight controller as the companion computer.",
    meta: "Hardware build · age 14",
    href: "https://itsnutt.me",
    hrefLabel: "itsnutt.me",
    media: {
      kind: "image",
      src: "/talent/student-drone.jpg",
      alt: "Quadcopter built by Nutt — F450-class frame with a Raspberry Pi on the flight controller stack",
      fit: "cover",
    },
  },
  {
    nickname: "Tiny",
    track: "dev",
    title: "how i could reset anyone's password on a school management platform",
    summary:
      "Security writeup on a platform used by international schools in Thailand: a password-reset flow that returned the auth token in the API response body chained into full staff-admin account takeover in four requests, no victim interaction.",
    meta: "Apr 2026 · reported 17 Apr, fixed 18 Apr, published with permission",
    href: "https://tinywifi.cc/posts/school-management-password-reset/",
    hrefLabel: "Read the writeup",
    media: {
      kind: "notes",
      stats: {
        headline: "1M+",
        caption: "users on the systems he broke into",
        breakdown: "StudentCare 600k · SchoolBright 519k",
      },
      points: [
        "Reset endpoint leaked the auth token in the response body",
        "Staff emails enumerable from an unauthenticated endpoint",
        "`callbackUrl` accepted arbitrary external domains",
        "Chain → full staff-admin takeover, zero interaction",
      ],
    },
  },
] as const;
