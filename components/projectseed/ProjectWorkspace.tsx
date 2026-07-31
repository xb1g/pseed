"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { saveProjectBrief, saveProjectPick } from "@/actions/projectseed";
import { TagInput } from "@/components/projectseed/TagInput";
import type {
  PseedProjectOption,
  PseedProjectPick,
  PseedTagCount,
} from "@/types/projectseed";

interface ProjectWorkspaceProps {
  options: PseedProjectOption[];
  pick: PseedProjectPick | null;
  /** Tags already in use across the cohort, offered as suggestions. */
  cohortTags?: PseedTagCount[];
}

const DEFAULT_GENRES: PseedProjectOption[] = [
  {
    id: "web-dev",
    slug: "web-dev",
    title: "Web & App Development",
    summary: "Web applications, mobile apps, developer tools, SaaS, APIs, browser extensions, and utility tools.",
    detail: null,
    difficulty: "starter",
    tags: ["web", "app"],
    sort_order: 10,
  },
  {
    id: "ai-tech",
    slug: "ai-tech",
    title: "AI & Automation",
    summary: "AI agents, LLM integrations, computer vision, smart assistants, and automated workflows.",
    detail: null,
    difficulty: "starter",
    tags: ["ai", "automation"],
    sort_order: 20,
  },
  {
    id: "game-dev",
    slug: "game-dev",
    title: "Games & Interactive Media",
    summary: "Indie games, game mods, interactive fiction, VR/AR, and 3D graphics.",
    detail: null,
    difficulty: "starter",
    tags: ["game", "interactive"],
    sort_order: 30,
  },
  {
    id: "hardware-iot",
    slug: "hardware-iot",
    title: "Hardware & Physical Tech",
    summary: "Arduino/Raspberry Pi, IoT sensors, robotics, microcontrollers, and physical devices.",
    detail: null,
    difficulty: "starter",
    tags: ["hardware", "iot"],
    sort_order: 40,
  },
  {
    id: "data-research",
    slug: "data-research",
    title: "Data, Scrapers & Analytics",
    summary: "Data visualization, web scraping, data stories, public statistics, and analytical tools.",
    detail: null,
    difficulty: "starter",
    tags: ["data", "analytics"],
    sort_order: 50,
  },
  {
    id: "edu-content",
    slug: "edu-content",
    title: "Education & Content Creation",
    summary: "Interactive learning tools, courses, technical writing, tutorials, and educational media.",
    detail: null,
    difficulty: "starter",
    tags: ["education", "content"],
    sort_order: 60,
  },
  {
    id: "creative-design",
    slug: "creative-design",
    title: "Design & Creative Arts",
    summary: "UI/UX design systems, generative art, digital media, 3D assets, and branding tools.",
    detail: null,
    difficulty: "starter",
    tags: ["design", "art"],
    sort_order: 70,
  },
  {
    id: "social-impact",
    slug: "social-impact",
    title: "Community & Social Impact",
    summary: "Local community tools, non-profit tech, environmental monitoring, and civic engagement.",
    detail: null,
    difficulty: "starter",
    tags: ["community", "impact"],
    sort_order: 80,
  },
];

export function ProjectWorkspace({
  options,
  pick,
  cohortTags = [],
}: ProjectWorkspaceProps) {
  const router = useRouter();

  const [selectedGenre, setSelectedGenre] = useState<string | null>(
    pick?.project_option_id ?? null
  );
  const [customTitle, setCustomTitle] = useState(pick?.custom_title ?? "");
  const [tags, setTags] = useState<string[]>(pick?.tags ?? []);
  const [pickError, setPickError] = useState<string | null>(null);
  const [pickSaved, setPickSaved] = useState(false);
  const [savingPick, startPickSave] = useTransition();

  const hasPick = Boolean(pick?.custom_title || pick?.project_option_id);
  const genreList = options.length > 0 ? options : DEFAULT_GENRES;

  function handleSavePick() {
    setPickError(null);
    setPickSaved(false);

    if (!customTitle.trim()) {
      setPickError("Please enter your project name or idea");
      return;
    }

    startPickSave(async () => {
      const result = await saveProjectPick({
        projectOptionId: selectedGenre,
        customTitle,
        tags,
      });

      if (result.ok) {
        setPickSaved(true);
        router.refresh();
      } else {
        setPickError(result.error ?? "Failed to save");
      }
    });
  }

  return (
    <div className="flex flex-col gap-12">
      {/* Header */}
      <header className="flex flex-col gap-3 border-b border-white/10 pb-6">
        <Link
          href="/projectseed/hub"
          className="group inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400 transition-colors hover:text-white"
        >
          ← Back to Hub
        </Link>
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold text-white sm:text-3xl">
            Your Project
          </h1>
          <p className="text-sm leading-relaxed text-slate-300">
            Pick a track domain, type your project idea, and describe it for your mentor.
          </p>
        </div>
      </header>

      {/* Part 1: Genre Selection & Typed Idea */}
      <section id="pick" className="flex flex-col gap-6 scroll-mt-8" aria-labelledby="pick-heading">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/20 text-amber-300">
              <LightbulbIcon className="h-4 w-4" />
            </div>
            <div className="flex flex-col gap-0.5">
              <h2 id="pick-heading" className="text-lg font-bold text-white">
                1. Project Domain & Name
              </h2>
              <p className="text-xs text-slate-400">
                Choose a track domain and type your project title
              </p>
            </div>
          </div>

          <Link
            href="/projectseed/prompt"
            className="group flex items-center gap-1.5 text-xs font-medium text-indigo-300 transition-colors hover:text-indigo-200"
          >
            <span>💡 Spend 10 mins with AI to brainstorm (Get Prompt)</span>
            <span className="transition-transform group-hover:translate-x-0.5">→</span>
          </Link>
        </div>

        {/* Genre Selection Grid */}
        <div className="flex flex-col gap-2.5">
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
            Track / Genre
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            {genreList.map((option) => {
              const isSelected = selectedGenre === option.id;
              const GenreIcon = getGenreIcon(option.slug || option.id);

              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => {
                    setSelectedGenre(isSelected ? null : option.id);
                    setPickSaved(false);
                  }}
                  className={`flex flex-col gap-2.5 rounded-2xl border p-4 text-left transition-all ${
                    isSelected
                      ? "border-blue-400/80 bg-blue-500/15 ring-1 ring-blue-400/50 shadow-md shadow-blue-500/10"
                      : "border-white/10 bg-slate-900/40 hover:border-white/20 hover:bg-slate-900/60"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-colors ${
                          isSelected
                            ? "bg-blue-500/30 text-blue-200"
                            : "bg-white/10 text-slate-400"
                        }`}
                      >
                        <GenreIcon className="h-4 w-4" />
                      </div>
                      <span className="font-bold text-white text-sm leading-snug">
                        {option.title}
                      </span>
                    </div>

                    {isSelected ? (
                      <span className="shrink-0 rounded-full bg-blue-500/20 px-2 py-0.5 text-[11px] font-bold text-blue-300">
                        ✓ Selected
                      </span>
                    ) : null}
                  </div>

                  <span className="text-xs leading-relaxed text-slate-300">
                    {option.summary}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Typed Project Idea Field */}
        <div className="flex flex-col gap-2">
          <label htmlFor="custom-title" className="text-xs font-semibold uppercase tracking-wider text-slate-300">
            Project Name or Idea <span className="text-rose-400">*</span>
          </label>
          <input
            id="custom-title"
            className="w-full rounded-xl border border-white/15 bg-slate-950/70 px-4 py-3 text-sm text-white placeholder-slate-500 transition-colors focus:border-blue-400 focus:outline-none"
            value={customTitle}
            onChange={(e) => {
              setCustomTitle(e.target.value);
              setPickSaved(false);
            }}
            placeholder="e.g. Discord bot for assignment reminders & voice logs..."
          />
        </div>

        {/* Tags — how the room finds each other */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
            Tags
          </label>
          <TagInput
            value={tags}
            onChange={(next) => {
              setTags(next);
              setPickSaved(false);
            }}
            suggestions={cohortTags}
            disabled={savingPick}
          />
        </div>

        {/* Action Button */}
        <div className="flex items-center gap-4 pt-1">
          <button
            type="button"
            onClick={handleSavePick}
            className="ei-button-dawn"
            disabled={savingPick || !customTitle.trim()}
          >
            <span>{savingPick ? "Saving…" : "Save Project"}</span>
          </button>

          {pickSaved ? (
            <span className="text-sm font-medium text-emerald-300">✓ Saved</span>
          ) : null}

          {pickError ? (
            <span className="text-sm font-medium text-rose-300">{pickError}</span>
          ) : null}
        </div>
      </section>

      {/* Part 2: Brief Form */}
      <BriefForm pick={pick} enabled={hasPick} />
    </div>
  );
}

interface BriefFormProps {
  pick: PseedProjectPick | null;
  enabled: boolean;
}

const BRIEF_FIELDS = [
  {
    key: "whatBuild" as const,
    label: "What are you building?",
    hint: "Describe what you're making in 2–3 short sentences so anyone can understand.",
    icon: RocketIcon,
  },
  {
    key: "whyThis" as const,
    label: "Why this project?",
    hint: "Why does this specific topic excite you personally, rather than why it matters to the world?",
    icon: HeartIcon,
  },
  {
    key: "whoFor" as const,
    label: "Who is it for?",
    hint: "Real people you can actually talk to or test with, not just 'everyone'.",
    icon: UsersIcon,
  },
  {
    key: "firstStep" as const,
    label: "First step this week",
    hint: "The smallest achievable action you can complete within 7 days (optional).",
    icon: FlagIcon,
  },
];

function BriefForm({ pick, enabled }: BriefFormProps) {
  const router = useRouter();
  const [values, setValues] = useState({
    whatBuild: pick?.what_build ?? "",
    whyThis: pick?.why_this ?? "",
    whoFor: pick?.who_for ?? "",
    firstStep: pick?.first_step ?? "",
  });
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [saving, startSave] = useTransition();

  function save(submit: boolean) {
    setError(null);
    setNotice(null);

    startSave(async () => {
      const result = await saveProjectBrief({ ...values, submit });
      if (result.ok) {
        setNotice(submit ? "Submitted successfully!" : "Draft saved");
        router.refresh();
      } else {
        setError(result.error ?? "Failed to save");
      }
    });
  }

  return (
    <section
      id="brief"
      className="flex flex-col gap-6 scroll-mt-8 border-t border-white/10 pt-8"
      aria-labelledby="brief-heading"
    >
      <div className="flex items-center gap-2.5">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-500/20 text-indigo-300">
          <CompassIcon className="h-4 w-4" />
        </div>
        <div className="flex flex-col gap-0.5">
          <h2 id="brief-heading" className="text-lg font-bold text-white">
            2. Project Brief
          </h2>
          <p className="text-sm leading-relaxed text-slate-300">
            {enabled
              ? "Answer these core questions so your mentor understands your concept before you meet."
              : "Select a project domain and type your project name above first to unlock."}
          </p>
        </div>
      </div>

      <fieldset
        disabled={!enabled || saving}
        className="flex flex-col gap-5 disabled:opacity-40"
      >
        {BRIEF_FIELDS.map((field) => {
          const Icon = field.icon;
          return (
            <div key={field.key} className="flex flex-col gap-2">
              <label htmlFor={field.key} className="flex items-center gap-2 text-sm font-semibold text-white">
                <Icon className="h-4 w-4 text-indigo-400 shrink-0" />
                <span>{field.label}</span>
              </label>
              <span className="text-xs text-slate-400">{field.hint}</span>
              <textarea
                id={field.key}
                className="w-full min-h-[96px] rounded-xl border border-white/15 bg-slate-950/60 px-4 py-3 text-sm text-white focus:border-blue-400 focus:outline-none transition-colors"
                value={values[field.key]}
                onChange={(e) =>
                  setValues((prev) => ({ ...prev, [field.key]: e.target.value }))
                }
              />
            </div>
          );
        })}
      </fieldset>

      {error ? (
        <p role="alert" className="text-sm font-medium text-rose-300">
          {error}
        </p>
      ) : null}
      {notice ? (
        <span className="text-sm font-medium text-emerald-300">{notice}</span>
      ) : null}

      <div className="flex flex-wrap items-center gap-3 pt-2">
        <button
          type="button"
          onClick={() => save(true)}
          className="ei-button-dawn"
          disabled={!enabled || saving}
        >
          <span>{saving ? "Saving…" : "Submit Brief"}</span>
        </button>

        <button
          type="button"
          onClick={() => save(false)}
          className="rounded-xl border border-white/15 px-5 py-3 text-sm font-semibold text-slate-200 transition-colors hover:border-white/30 disabled:opacity-50"
          disabled={!enabled || saving}
        >
          Save Draft
        </button>

        {pick?.status === "submitted" && !notice ? (
          <span className="text-sm text-emerald-300">
            Submitted on {formatDate(pick.submitted_at)}
          </span>
        ) : null}
      </div>
    </section>
  );
}

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
  });
}

/* -------------------------------------------------------------------------- */
/* Icons                                                                      */
/* -------------------------------------------------------------------------- */

function LightbulbIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
    </svg>
  );
}

function CompassIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9 9 0 100-18 9 9 0 000 18z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 13.5L9 15l1.5-1.5m3-3L15 9l-1.5 1.5m-3-3L15 15l-4.5-4.5z" />
    </svg>
  );
}

function RocketIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.59 14.37a6 6 0 01-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 006.16-12.12A14.98 14.98 0 009.63 8.41m5.96 5.96a14.926 14.926 0 01-5.841 2.58m-.119-8.54a6 6 0 00-7.381 5.84h4.8m2.581-5.84a14.927 14.927 0 00-2.58 5.84m2.58-5.84l4.137 4.137" />
    </svg>
  );
}

function HeartIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
    </svg>
  );
}

function UsersIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  );
}

function FlagIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
    </svg>
  );
}

function CodeWindowIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
    </svg>
  );
}

function BrainCpuIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
    </svg>
  );
}

function GamepadIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
    </svg>
  );
}

function CircuitBoardIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 3v2m6-2v2M9 19v2m6-2v2M3 9h2m-2 6h2m14-6h2m-2 6h2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
    </svg>
  );
}

function BarChartIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  );
}

function GraduationCapIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l9-5-9-5-9 5 9 5z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
    </svg>
  );
}

function PaletteIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343a2 2 0 01-1.414-.586l-1.414-1.414A2 2 0 009.828 8H7" />
    </svg>
  );
}

function GlobeHeartIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 002 2h1.5a2.5 2.5 0 002.5-2.5V7a2 2 0 00-2-2h-2c-.5 0-1-.5-1-1V3.5M12 21a9 9 0 100-18 9 9 0 000 18z" />
    </svg>
  );
}

function getGenreIcon(slugOrId: string) {
  switch (slugOrId) {
    case "web-dev":
      return CodeWindowIcon;
    case "ai-tech":
      return BrainCpuIcon;
    case "game-dev":
      return GamepadIcon;
    case "hardware-iot":
      return CircuitBoardIcon;
    case "data-research":
      return BarChartIcon;
    case "edu-content":
      return GraduationCapIcon;
    case "creative-design":
      return PaletteIcon;
    case "social-impact":
      return GlobeHeartIcon;
    default:
      return LightbulbIcon;
  }
}

