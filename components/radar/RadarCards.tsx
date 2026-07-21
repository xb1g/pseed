"use client";

import { createContext, useContext, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { Button } from "@/components/ui/button";
import {
  getAiImpactLabel,
  getEntryRouteLabel,
  getOutlookLabel,
  interpretRadarMetric,
  parseRadarListItems,
} from "@/lib/radar/presentation";
import { Textarea } from "@/components/ui/textarea";
import Image from "next/image";
import { ExternalLink, ArrowRight, Check, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, ArrowLeft } from "lucide-react";
import type { RadarIntentScope } from "@/lib/my-path/radar-sync";

type RadarIntentHandler = (
  pathSlug: string,
  buttonLabel: string | undefined,
  scope: RadarIntentScope
) => void;

// ── content shapes (one per radar_cards.kind) ────────────────────────────────

export interface CardBase {
  eyebrow?: string;
  title?: string;
}

export type HookContent = CardBase & { body?: string; stat?: string; statLabel?: string };
export type FantasyRealityContent = CardBase & { fantasy?: string; reality?: string };
export type TextContent = CardBase & {
  body?: string | string[];
  presentation?: "skills" | "startCarousel";
  skills?: Array<{ title: string; description?: string; level?: string }>;
  options?: Array<{
    title: string;
    description?: string;
    type?: string;
    url?: string;
    duration?: string;
    cost?: string;
    cta?: string;
  }>;
};
export type ReflectionContent = CardBase & {
  rating?: boolean;
  chips?: string[];
  allowText?: boolean;
  chapterKey: string;
  placeholder?: string;
};
export type JobsContent = CardBase & {
  jobs?: Array<{
    title: string;
    salary?: string;
    demand?: string;
    growth?: string;
    note?: string;
    listings?: Array<{ title: string; company?: string; url: string; source?: string }>;
  }>;
};
export type SalaryProgressionContent = CardBase & {
  currency?: string; // default currency code (e.g. 'USD')
  levels?: Array<{ level: string; years?: string; salary?: string; note?: string }>;
  // Optional Thai-Baht variant; UI shows a TH/USD toggle when present
  eyebrow_thb?: string;
  title_thb?: string;
  levels_thb?: Array<{ level: string; years?: string; salary?: string; note?: string }>;
};
export type GrowthCompareContent = CardBase & {
  unit?: string;
  items?: Array<{ label: string; growth: number; self?: boolean }>;
};
export type ListContent = CardBase & { items?: string[] };
export type AiImpactContent = CardBase & {
  verdict?: string;
  augmented?: string[];
  automated?: string[];
  ai_risk_score?: number;
};
export type MarketThailandContent = CardBase & {
  body?: string;
  openings?: string;
  companies?: string[];
};
export type DayInLifeContent = CardBase & { steps?: Array<{ time?: string; label: string; detail?: string }> };
export type EntryRoutesContent = CardBase & {
  description?: string;
  faculties?: Array<{
    name: string;
    tier: "direct" | "related" | "alternative";
    examples?: string;
    note?: string;
  }>;
};
export type RisksContent = CardBase & { risks?: string[] };
export type RealPeopleContent = CardBase & {
  // NOTE: If you change this shape, also update the prompt template in
  // app/admin/radar-interview/RadarInterviewClient.tsx so AI-generated
  // JSON stays compatible with the renderer below.
  people?: Array<{
    name?: string;
    role?: string;
    imageUrl?: string; // small headshot or sourced photo
    background: string; // short bio (kept for back-compat)
    salary?: string; // honest, only if the person shared it — never fabricated
    path?: Array<{ year?: string; label: string }>; // trajectory: started → pivots → now
    nowDoing?: string; // what they do daily + with whom
    whereHeading?: string; // where they think the role is going next
    advice?: string; // what they wish they'd known at the start
    publisher?: string;
    url?: string;
  }>;
};
export type CtaContent = CardBase & { body?: string; button?: string };
export type FutureOutlookContent = CardBase & {
  growthRate?: string;
  growthLabel?: string;
  timeline?: Array<{ year?: string; event: string }>;
  demandSignal?: string;
  risk?: string;
};
export type SourcesContent = CardBase & {
  items?: Array<{ ref: number; title: string; publisher?: string; url: string }>;
};
export type CareerSurvivalContent = CardBase & {
  metrics?: {
    demand_growth?: number | null;
    grad_employment_pct?: number | null;
    saturation_level?: number | null;
    progression_difficulty?: number | null;
    salary_floor?: number | null;
    salary_ceiling?: number | null;
  };
  global_metrics?: {
    demand_growth?: number | null;
    grad_employment_pct?: number | null;
    saturation_level?: number | null;
    progression_difficulty?: number | null;
    salary_floor?: number | null;
    salary_ceiling?: number | null;
  };
  metric_details?: Record<string, { th?: string; en?: string; source?: string; source_url?: string }>;
  global_metric_details?: Record<string, { th?: string; en?: string; source?: string; source_url?: string }>;
  tier?: string;
  reasoning?: string;
};

// ── shared frame ─────────────────────────────────────────────────────────────

type RadarInlineEditor = {
  onChange: (path: string[], value: unknown) => void;
};

export const RadarInlineEditorContext = createContext<RadarInlineEditor | null>(null);

function EditableText({
  value,
  field,
  className,
  style,
  valueType = "string",
  onValueChange,
}: {
  value: string;
  field: string | string[];
  className: string;
  style?: React.CSSProperties;
  valueType?: "string" | "number";
  onValueChange?: (value: string) => void;
}) {
  const editor = useContext(RadarInlineEditorContext);
  const path = Array.isArray(field) ? field : [field];
  const label = path.join(".");
  if (!editor) return <span className={className} style={style}>{value}</span>;

  return (
    <span
      className={`${className} radar-inline-edit`}
      style={style}
      contentEditable
      suppressContentEditableWarning
      role="textbox"
      aria-label={`Edit ${label}`}
      onMouseDown={(event) => event.stopPropagation()}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
      }}
      onKeyDown={(event) => event.stopPropagation()}
      onBlur={(event) => {
        const nextValue = event.currentTarget.textContent?.trim() ?? "";
        if (onValueChange) {
          onValueChange(nextValue);
          return;
        }
        editor.onChange(
          path,
          valueType === "number" ? Number(nextValue) : nextValue
        );
      }}
    >
      {value}
    </span>
  );
}

function CardFrame({
  eyebrow,
  title,
  accent,
  children,
}: {
  eyebrow?: string;
  title?: string;
  accent: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="w-full max-w-xl mx-auto flex flex-col gap-5">
      {eyebrow && (
        <EditableText
          value={eyebrow}
          field="eyebrow"
          className="rc-eyebrow text-xs font-semibold uppercase tracking-[0.18em]"
          style={{ color: accent }}
        />
      )}
      {title && (
        <h2>
          <EditableText
            value={title}
            field="title"
            className="rc-title block text-3xl sm:text-4xl font-extrabold tracking-tight text-white leading-[1.1]"
          />
        </h2>
      )}
      <div className="rc-content flex flex-col gap-5">
        {children}
      </div>
    </div>
  );
}

function Panel({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border border-white/10 bg-white/5 p-4 ${className}`}>
      {children}
    </div>
  );
}

// ── per-kind renderers ───────────────────────────────────────────────────────

function HookCard({ c, accent }: { c: HookContent; accent: string }) {
  return (
    <CardFrame eyebrow={c.eyebrow} title={c.title} accent={accent}>
      {c.stat && (
        <div className="flex items-baseline gap-3">
          <span className="text-4xl sm:text-5xl font-extrabold" style={{ color: accent }}>
            <EditableText value={c.stat} field="stat" className="inline" />
          </span>
          {c.statLabel && (
            <EditableText value={c.statLabel} field="statLabel" className="text-sm text-neutral-400" />
          )}
        </div>
      )}
      {c.body && (
        <p>
          <EditableText value={c.body} field="body" className="block text-neutral-300 text-base leading-relaxed" />
        </p>
      )}
    </CardFrame>
  );
}

function FantasyRealityCard({ c, accent }: { c: FantasyRealityContent; accent: string }) {
  return (
    <CardFrame eyebrow={c.eyebrow} title={c.title} accent={accent}>
      <div className="rc-panel-left">
        <Panel className="border-amber-400/20 bg-amber-400/5">
          <p className="text-xs font-semibold uppercase tracking-wider text-amber-300/80 mb-1">
            Fantasy
          </p>
          {c.fantasy && (
            <p>
              <EditableText value={c.fantasy} field="fantasy" className="block text-neutral-200 text-base leading-relaxed" />
            </p>
          )}
        </Panel>
      </div>
      <div className="rc-panel-right">
        <Panel className="border-emerald-400/20 bg-emerald-400/5">
          <p className="text-xs font-semibold uppercase tracking-wider text-emerald-300/80 mb-1">
            Reality
          </p>
          {c.reality && (
            <p>
              <EditableText value={c.reality} field="reality" className="block text-neutral-200 text-base leading-relaxed" />
            </p>
          )}
        </Panel>
      </div>
    </CardFrame>
  );
}

function isSkillsText(c: TextContent): boolean {
  return c.presentation === "skills" || /ทักษะ|skill/i.test(`${c.eyebrow ?? ""} ${c.title ?? ""}`);
}

function isStartText(c: TextContent): boolean {
  return c.presentation === "startCarousel" || /เริ่ม|start|มหาวิทยาลัย/i.test(`${c.eyebrow ?? ""} ${c.title ?? ""}`);
}

function SkillsTextCard({ c, accent }: { c: TextContent; accent: string }) {
  const editor = useContext(RadarInlineEditorContext);
  const items = c.skills?.map(({ title, description = "" }) => ({ title, description }))
    ?? parseRadarListItems(c.body);
  const updateLegacyItem = (
    index: number,
    key: "title" | "description",
    value: string
  ) => {
    const next = items.map((item, itemIndex) =>
      itemIndex === index ? { ...item, [key]: value } : item
    );
    editor?.onChange(
      ["body"],
      next
        .map((item) =>
          item.description ? `${item.title}: ${item.description}` : item.title
        )
        .join("\n")
    );
  };

  return (
    <CardFrame eyebrow={c.eyebrow} title={c.title} accent={accent}>
      <p className="text-sm leading-relaxed text-neutral-400">
        แตะดูทีละทักษะ แทนการอ่านรายการยาวๆ
      </p>
      <div className="grid gap-2 sm:grid-cols-2">
        {items.map((item, index) => (
          <details
            key={`${item.title}-${index}`}
            open={editor ? true : undefined}
            className="group rounded-xl border border-white/10 bg-white/[0.03]"
          >
            <summary className="flex min-h-14 cursor-pointer list-none items-center gap-3 px-4 py-3 focus-visible:outline-none focus-visible:ring-2">
              <span
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-neutral-950"
                style={{ background: accent }}
              >
                {index + 1}
              </span>
              {c.skills ? (
                <EditableText
                  value={item.title}
                  field={["skills", String(index), "title"]}
                  className="min-w-0 flex-1 font-semibold text-white"
                />
              ) : (
                <EditableText
                  value={item.title}
                  field="body"
                  className="min-w-0 flex-1 font-semibold text-white"
                  onValueChange={(value) => updateLegacyItem(index, "title", value)}
                />
              )}
              <ChevronDown className="h-4 w-4 shrink-0 text-neutral-500 transition-transform group-open:rotate-180" />
            </summary>
            {item.description && (
              <p className="px-4 pb-4 pl-16 text-sm leading-relaxed text-neutral-400">
                {c.skills ? (
                  <EditableText
                    value={item.description}
                    field={["skills", String(index), "description"]}
                    className="block"
                  />
                ) : (
                  <EditableText
                    value={item.description}
                    field="body"
                    className="block"
                    onValueChange={(value) =>
                      updateLegacyItem(index, "description", value)
                    }
                  />
                )}
              </p>
            )}
          </details>
        ))}
      </div>
    </CardFrame>
  );
}

function StartCarouselTextCard({
  c,
  accent,
  onIntent,
}: {
  c: TextContent;
  accent: string;
  onIntent?: RadarIntentHandler;
}) {
  const editor = useContext(RadarInlineEditorContext);
  const trackRef = useRef<HTMLDivElement>(null);
  const [interestedRecorded, setInterestedRecorded] = useState<Set<number>>(new Set());
  const [notInterestedRecorded, setNotInterestedRecorded] = useState<Set<number>>(new Set());
  const parsed = parseRadarListItems(c.body);
  const options: NonNullable<TextContent["options"]> = c.options ?? parsed.map((item) => ({
    title: item.title,
    description: item.description,
    type: "ลองทำ",
    cta: "สนใจวิธีนี้",
  }));
  const updateLegacyOption = (
    index: number,
    key: "title" | "description",
    value: string
  ) => {
    const next = parsed.map((item, itemIndex) =>
      itemIndex === index ? { ...item, [key]: value } : item
    );
    editor?.onChange(
      ["body"],
      next
        .map((item) =>
          item.description ? `${item.title}: ${item.description}` : item.title
        )
        .join("\n")
    );
  };

  const move = (direction: -1 | 1) => {
    const track = trackRef.current;
    if (!track) return;
    track.scrollBy({
      left: direction * Math.min(track.clientWidth * 0.82, 360),
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
    });
  };

  const recordInterested = (index: number) => {
    onIntent?.(`start-option-${index + 1}`, "interested", "start-option");
    setInterestedRecorded((current) => new Set(current).add(index));
  };

  const recordNotInterested = (index: number) => {
    onIntent?.(`start-option-${index + 1}`, "not-interested", "start-option");
    setNotInterestedRecorded((current) => new Set(current).add(index));
  };

  return (
    <CardFrame eyebrow={c.eyebrow} title={c.title} accent={accent}>
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-neutral-400">ปัดซ้ายเพื่อดูวิธีเริ่มแบบอื่น</p>
        <div className="hidden gap-1 sm:flex">
          <button type="button" onClick={() => move(-1)} aria-label="ตัวเลือกก่อนหน้า" className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 text-white hover:bg-white/5">
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button type="button" onClick={() => move(1)} aria-label="ตัวเลือกถัดไป" className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 text-white hover:bg-white/5">
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>
      <div ref={trackRef} className="radar-horizontal-carousel -mx-6 flex gap-3 overflow-x-auto px-6 pb-3">
        {options.map((option, index) => {
          const isInterested = interestedRecorded.has(index);
          const isNotInterested = notInterestedRecorded.has(index);
          const anyRecorded = isInterested || isNotInterested;
          return (
            <article key={`${option.title}-${index}`} className="w-[82vw] max-w-[320px] shrink-0 snap-center rounded-2xl border border-white/10 bg-white/[0.04] p-5">
              <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: accent }}>
                {c.options && option.type ? (
                  <EditableText
                    value={option.type}
                    field={["options", String(index), "type"]}
                    className="inline"
                  />
                ) : (
                  option.type ?? `ทางเลือก ${index + 1}`
                )}
              </span>
              <h3 className="mt-2">
                {c.options ? (
                  <EditableText
                    value={option.title}
                    field={["options", String(index), "title"]}
                    className="block text-xl font-bold text-white"
                  />
                ) : (
                  <EditableText
                    value={option.title}
                    field="body"
                    className="block text-xl font-bold text-white"
                    onValueChange={(value) => updateLegacyOption(index, "title", value)}
                  />
                )}
              </h3>
              {option.description && (
                <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-neutral-400">
                  {c.options ? (
                    <EditableText
                      value={option.description}
                      field={["options", String(index), "description"]}
                      className="block"
                    />
                  ) : (
                    <EditableText
                      value={option.description}
                      field="body"
                      className="block"
                      onValueChange={(value) =>
                        updateLegacyOption(index, "description", value)
                      }
                    />
                  )}
                </p>
              )}
              <div className="mt-4 flex flex-wrap gap-2 text-xs text-neutral-500">
                {option.duration && (
                  <EditableText
                    value={option.duration}
                    field={["options", String(index), "duration"]}
                    className="inline"
                  />
                )}
                {option.cost && (
                  <span>
                    ·{" "}
                    <EditableText
                      value={option.cost}
                      field={["options", String(index), "cost"]}
                      className="inline"
                    />
                  </span>
                )}
              </div>
              <div className="mt-5 grid gap-2">
                {option.url && (
                  <a href={option.url} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border border-white/10 text-sm font-semibold text-white">
                    เปิดดู <ExternalLink className="h-4 w-4" />
                  </a>
                )}
                <div className="flex flex-col gap-2">
                  <button
                    type="button"
                    disabled={anyRecorded}
                    onClick={() => recordInterested(index)}
                    className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg px-4 text-sm font-semibold text-neutral-950 disabled:bg-white/10 disabled:text-white/60"
                    style={isInterested ? undefined : { background: accent }}
                  >
                    {isInterested ? (
                      <><Check className="h-4 w-4" /> สนใจแล้ว</>
                    ) : c.options && option.cta ? (
                      <EditableText
                        value={option.cta}
                        field={["options", String(index), "cta"]}
                        className="inline"
                      />
                    ) : (
                      option.cta ?? "สนใจวิธีนี้"
                    )}
                  </button>
                  <button
                    type="button"
                    disabled={anyRecorded}
                    onClick={() => recordNotInterested(index)}
                    className="inline-flex min-h-9 items-center justify-center gap-2 rounded-lg border border-white/10 px-3 text-xs font-medium text-neutral-400 hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isNotInterested ? "บันทึกแล้ว" : "ไม่สนใจลอง"}
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </div>
      <div className="flex justify-center gap-1.5" aria-hidden="true">
        {options.map((_, index) => (
          <span key={index} className="h-1.5 w-5 rounded-full bg-white/15" />
        ))}
      </div>
    </CardFrame>
  );
}

function TextCard({
  c,
  accent,
  onIntent,
}: {
  c: TextContent;
  accent: string;
  onIntent?: RadarIntentHandler;
}) {
  if (isSkillsText(c)) return <SkillsTextCard c={c} accent={accent} />;
  if (isStartText(c)) return <StartCarouselTextCard c={c} accent={accent} onIntent={onIntent} />;

  return (
    <CardFrame eyebrow={c.eyebrow} title={c.title} accent={accent}>
      {c.body && (
        <p>
          <EditableText
            value={Array.isArray(c.body) ? c.body.join("\n") : c.body}
            field="body"
            className="block text-neutral-300 text-base leading-relaxed whitespace-pre-line"
          />
        </p>
      )}
    </CardFrame>
  );
}

function ListCard({ c, accent }: { c: ListContent; accent: string }) {
  return (
    <CardFrame eyebrow={c.eyebrow} title={c.title} accent={accent}>
      <ul className="flex flex-col gap-2">
        {(c.items ?? []).map((item, i) => (
          <li key={i} className="flex items-start gap-3">
            <Check className="h-4 w-4 mt-1 shrink-0" style={{ color: accent }} />
            <EditableText
              value={item}
              field={["items", String(i)]}
              className="text-neutral-200 text-base"
            />
          </li>
        ))}
      </ul>
    </CardFrame>
  );
}

function JobsCard({ c, accent }: { c: JobsContent; accent: string }) {
  return (
    <CardFrame eyebrow={c.eyebrow} title={c.title ?? "Jobs"} accent={accent}>
      <div className="flex flex-col gap-3">
        {(c.jobs ?? []).map((job, i) => (
          <Panel key={i}>
            <div className="flex items-start justify-between gap-3">
              <EditableText
                value={job.title}
                field={["jobs", String(i), "title"]}
                className="text-white font-semibold"
              />
              {job.salary && (
                <span className="text-sm font-bold shrink-0" style={{ color: accent }}>
                  <EditableText value={job.salary} field={["jobs", String(i), "salary"]} className="inline" />
                </span>
              )}
            </div>
            <div className="flex flex-wrap gap-2 mt-2 text-xs text-neutral-400">
              {job.demand && (
                <span>
                  Demand:{" "}
                  <EditableText value={job.demand} field={["jobs", String(i), "demand"]} className="inline" />
                </span>
              )}
              {job.growth && (
                <span style={{ color: accent }}>
                  <EditableText value={job.growth} field={["jobs", String(i), "growth"]} className="inline" /> growth
                </span>
              )}
            </div>
            {job.note && (
              <p className="mt-2">
                <EditableText
                  value={job.note}
                  field={["jobs", String(i), "note"]}
                  className="block text-neutral-400 text-sm leading-relaxed"
                />
              </p>
            )}
          </Panel>
        ))}
      </div>
    </CardFrame>
  );
}

function SalaryProgressionCard({ c, accent }: { c: SalaryProgressionContent; accent: string }) {
  const [currency, setCurrency] = useState<"USD" | "THB">("USD");
  const [selectedLevel, setSelectedLevel] = useState<number | null>(null);
  const [introComplete, setIntroComplete] = useState(false);
  const [hasOpenedDetail, setHasOpenedDetail] = useState(false);
  const hasThb = Array.isArray(c.levels_thb) && c.levels_thb.length > 0;
  const activeLevels = currency === "THB" && hasThb ? c.levels_thb : c.levels;
  const levels = activeLevels ?? [];
  const fieldRoot = currency === "THB" && hasThb ? "levels_thb" : "levels";
  const displayedLevels = levels.slice(0, 4);
  const selected = selectedLevel === null ? null : displayedLevels[selectedLevel] ?? null;
  const selectedIndex = selectedLevel ?? 0;
  const chessPieces =
    displayedLevels.length === 3
      ? SALARY_CHESS_PIECES.filter((piece) => piece.key !== "rook")
      : SALARY_CHESS_PIECES;
  const completionAnimationName = chessPieces.some((piece) => piece.key === "queen")
    ? "salary-queen-image-reveal"
    : chessPieces.some((piece) => piece.key === "knight")
      ? "salary-knight-l-image"
      : chessPieces.some((piece) => piece.key === "rook")
        ? "salary-rook-crash-image"
        : null;

  const changeCurrency = (nextCurrency: "USD" | "THB") => {
    setCurrency(nextCurrency);
    setSelectedLevel(null);
    setIntroComplete(false);
    setHasOpenedDetail(false);
  };

  const handleBoardAnimationEnd = (event: React.AnimationEvent<HTMLDivElement>) => {
    if (event.animationName === completionAnimationName) {
      setIntroComplete(true);
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-4">
      {hasThb && (
        <div className="flex rounded-full border border-white/10 bg-white/5 overflow-hidden self-start">
          <button
            onClick={() => changeCurrency("USD")}
            className={`text-[11px] font-medium px-2.5 py-0.5 transition-colors inline-flex items-center gap-1 ${
              currency === "USD" ? "bg-white/15 text-white" : "text-neutral-400 hover:text-white"
            }`}
          >
            🇺🇸 USD
          </button>
          <button
            onClick={() => changeCurrency("THB")}
            className={`text-[11px] font-medium px-2.5 py-0.5 transition-colors inline-flex items-center gap-1 ${
              currency === "THB" ? "bg-white/15 text-white" : "text-neutral-400 hover:text-white"
            }`}
          >
            🇹🇭 THB
          </button>
        </div>
      )}
      <div className="salary-chess-scene" style={{ "--salary-chess-accent": accent } as CSSProperties}>
          {selected ? (
            <div className="salary-chess-detail">
              <button
                type="button"
                className="salary-chess-back"
                onClick={() => setSelectedLevel(null)}
                aria-label="Back to salary levels"
              >
                <ArrowLeft className="h-6 w-6" />
              </button>
              <div className="salary-chess-detail-copy">
                <EditableText
                  value={selected.level}
                  field={[fieldRoot, String(selectedIndex), "level"]}
                  className="salary-chess-detail-title"
                />
                <div className="salary-chess-detail-meta">
                  {selected.salary && (
                    <EditableText
                      value={formatSalaryDisplay(selected.salary)}
                      field={[fieldRoot, String(selectedIndex), "salary"]}
                      className="salary-chess-detail-salary"
                    />
                  )}
                  {selected.years && (
                    <span className="salary-chess-detail-years">
                      <EditableText
                        value={selected.years}
                        field={[fieldRoot, String(selectedIndex), "years"]}
                        className="inline"
                      />
                      {needsYearSuffix(selected.years) ? " years" : ""}
                    </span>
                  )}
                </div>
                <EditableText
                  value={selected.note || "Tap to add more details for this level."}
                  field={[fieldRoot, String(selectedIndex), "note"]}
                  className="salary-chess-detail-note"
                />
              </div>
              <SalaryChessPieceImage
                className={`salary-chess-detail-piece salary-chess-detail-piece--${chessPieces[selectedIndex]?.key ?? "pawn"}`}
                src={chessPieces[selectedIndex]?.src ?? SALARY_CHESS_PIECES[0].src}
              />
            </div>
          ) : (
            <div
              className={`salary-chess-board salary-chess-board--${displayedLevels.length || 0} ${
                introComplete ? "salary-chess-board--intro-complete" : ""
              } ${hasOpenedDetail ? "salary-chess-board--visited-detail" : ""}`}
              aria-label="Salary progression chess pieces"
              onAnimationEnd={handleBoardAnimationEnd}
            >
              <div className="salary-chess-head" aria-label="Salary">
                <div className="salary-chess-head-title">
                  Salary
                </div>
                <div className="salary-chess-head-eyebrow">
                  ฐานเงินเดือน
                </div>
              </div>
              {displayedLevels.map((lvl, i) => {
                const piece = chessPieces[i] ?? SALARY_CHESS_PIECES[SALARY_CHESS_PIECES.length - 1];
                return (
                  <button
                    type="button"
                    key={`${lvl.level}-${i}`}
                    className={`salary-chess-level salary-chess-level--${piece.key}`}
                    onClick={() => {
                      setIntroComplete(true);
                      setHasOpenedDetail(true);
                      setSelectedLevel(i);
                    }}
                    aria-label={`View details for ${lvl.level}`}
                  >
                    <SalaryChessPieceImage
                      className="salary-chess-piece"
                      src={piece.src}
                    />
                    <span className="salary-chess-label">
                      <EditableText
                        value={lvl.level}
                        field={[fieldRoot, String(i), "level"]}
                        className="salary-chess-title"
                      />
                      {lvl.salary && (
                        <EditableText
                          value={formatSalaryDisplay(lvl.salary)}
                          field={[fieldRoot, String(i), "salary"]}
                          className="salary-chess-salary"
                        />
                      )}
                      {lvl.years && (
                        <span className="salary-chess-years">
                          <EditableText
                            value={lvl.years}
                            field={[fieldRoot, String(i), "years"]}
                            className="inline"
                          />
                          {needsYearSuffix(lvl.years) ? " years" : ""}
                        </span>
                      )}
                    </span>
                  </button>
                );
              })}
              {displayedLevels.length === 0 && (
                <div className="salary-chess-empty">
                  No salary levels yet.
                </div>
              )}
            </div>
          )}
      </div>
      {!selected && displayedLevels.length > 0 && (
        <p className="salary-chess-hint">
          กดตัวหมากเพื่ออ่านข้อมูลเพิ่มเติมได้
        </p>
      )}
    </div>
  );
}

const SALARY_CHESS_PIECES = [
  { key: "pawn", src: "/images/experimental-pawn.svg" },
  { key: "rook", src: "/images/experimental-piece-130.png" },
  { key: "knight", src: "/images/experimental-piece-131.svg" },
  { key: "queen", src: "/images/experimental-piece-129.svg" },
] as const;

function needsYearSuffix(value: string) {
  return !/(yr|year|ปี)/i.test(value);
}

function formatSalaryDisplay(value: string) {
  return value.replace(/^ประมาณ\s*/i, "");
}

function SalaryChessPieceImage({ className, src }: { className: string; src: string }) {
  return (
    <span
      className={className}
      style={{ "--salary-chess-piece-src": `url(${src})` } as CSSProperties}
      aria-hidden="true"
    >
      <span className="salary-chess-intro-pawn" aria-hidden="true">
        <img src={SALARY_CHESS_PIECES[0].src} alt="" draggable={false} />
      </span>
      <img className="salary-chess-piece-image" src={src} alt="" draggable={false} />
    </span>
  );
}

function GrowthCompareCard({ c, accent }: { c: GrowthCompareContent; accent: string }) {
  const items = c.items ?? [];
  const max = Math.max(1, ...items.map((it) => it.growth));
  return (
    <CardFrame eyebrow={c.eyebrow} title={c.title} accent={accent}>
      <div className="flex flex-col gap-3">
        {items.map((it, i) => (
          <div key={i} className="flex flex-col gap-1">
            <div className="flex justify-between text-sm">
              <span className={it.self ? "text-white font-semibold" : "text-neutral-400"}>
                <EditableText value={it.label} field={["items", String(i), "label"]} className="inline" />
              </span>
              <span className="text-neutral-300">
                +<EditableText
                  value={String(it.growth)}
                  field={["items", String(i), "growth"]}
                  className="inline"
                  valueType="number"
                />
                {c.unit ? ` ${c.unit}` : "%"}
              </span>
            </div>
            <div className="h-2 rounded-full bg-white/5 overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${(it.growth / max) * 100}%`,
                  background: it.self ? accent : "rgba(255,255,255,0.25)",
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </CardFrame>
  );
}

function aiRiskChartColor(percent: number): string {
  if (percent >= 80) return "#ef4444";
  if (percent >= 60) return "#f97316";
  if (percent >= 50) return "#facc15";
  if (percent >= 40) return "#a3e635";
  if (percent >= 30) return "#22c55e";
  if (percent >= 20) return "#14b8a6";
  return "#38bdf8";
}

function aiRiskLabel(score: number): string {
  return getAiImpactLabel(score);
}

function AiImpactCard({ c, accent }: { c: AiImpactContent; accent: string }) {
  const [activePanel, setActivePanel] = useState<"augmented" | "automated" | null>(null);
  const score = c.ai_risk_score ?? null;
  const percent = score === null ? 0 : Math.round(Math.max(0, Math.min(score, 10)) * 10);
  const chartColor = aiRiskChartColor(percent);
  const chartStyle = {
    "--ai-impact-color": chartColor,
    "--ai-impact-percent": `${percent}%`,
    "--ai-impact-accent": accent,
    "--ai-impact-vector-green": accent,
  } as CSSProperties;
  const augmented = c.augmented ?? [];
  const automated = c.automated ?? [];
  const visibleItems = activePanel === "augmented" ? augmented : activePanel === "automated" ? automated : [];
  const activeTitle = activePanel === "augmented" ? "AI ช่วยไรได้บ้าง?" : "AI แทนไรได้บ้าง?";

  return (
    <div className="ai-pixel-page" style={chartStyle}>
      <header className="ai-pixel-heading">
        <h2 className="ai-pixel-title" aria-label="AI Impact">
          <span className="ai-pixel-title-ai" data-text="AI">AI</span>
          <span> Impact</span>
        </h2>
        <EditableText
          value="โดน AI กระทบเยอะแค่ไหน"
          field="eyebrow"
          className="ai-pixel-subtitle"
        />
      </header>

      <div className="ai-pixel-meter" aria-label={`AI replace risk ${score ?? 0} out of 10`}>
        {score !== null && (
          <p className="ai-pixel-score">
            {score}/10 {aiRiskLabel(score)}
          </p>
        )}
        <PixelHelperIcon className="ai-pixel-vector ai-pixel-vector--helper" />
        <div className="ai-pixel-bar" aria-hidden="true">
          <span className="ai-pixel-bar-fill" />
        </div>
        <PixelMonsterIcon className="ai-pixel-vector ai-pixel-vector--monster" />
      </div>

      {c.verdict && (
        <p className="ai-pixel-verdict">
          <EditableText value={c.verdict} field="verdict" className="block" />
        </p>
      )}

      <div className="ai-pixel-actions">
        <button
          type="button"
          className="ai-pixel-toggle"
          aria-expanded={activePanel === "augmented"}
          onClick={() => setActivePanel(activePanel === "augmented" ? null : "augmented")}
        >
          AI ช่วยไรได้บ้าง?
        </button>
        <button
          type="button"
          className="ai-pixel-toggle"
          aria-expanded={activePanel === "automated"}
          onClick={() => setActivePanel(activePanel === "automated" ? null : "automated")}
        >
          AI แทนไรได้บ้าง?
        </button>
      </div>

      {activePanel && (
        <section className="ai-pixel-panel" aria-label={activeTitle}>
          <h3>{activeTitle}</h3>
          <ul>
            {visibleItems.map((t, i) => (
              <li key={i}>
                <EditableText
                  value={t}
                  field={[activePanel, String(i)]}
                  className="inline"
                />
              </li>
            ))}
          </ul>
        </section>
      )}
      </div>
  );
}

function PixelHelperIcon({ className }: { className: string }) {
  return (
    <svg className={className} viewBox="0 0 102 117" fill="none" aria-hidden="true">
      <path d="M21.8438 65.5312H29.125V72.8125H72.8125V65.5312H80.0938V58.25H94.6562V72.8125H80.0938V87.375H94.6562V94.6562H87.375V109.219H80.0938V116.5H58.25V109.219H43.6875V116.5H21.8438V109.219H14.5625V94.6562H7.28125V87.375H21.8438V72.8125H7.28125V58.25H21.8438V65.5312ZM7.28125 87.375H0V72.8125H7.28125V87.375ZM101.938 87.375H94.6562V72.8125H101.938V87.375ZM7.28125 58.25H0V43.6875H7.28125V58.25ZM101.938 58.25H94.6562V43.6875H101.938V58.25ZM72.8125 7.28125H80.0938V14.5625H87.375V29.125H94.6562V43.6875H87.375V50.9688H80.0938V36.4062H72.8125V43.6875H29.125V36.4062H21.8438V50.9688H14.5625V43.6875H7.28125V29.125H14.5625V14.5625H21.8438V7.28125H29.125V0H72.8125V7.28125Z" fill="black" />
      <path d="M29.125 7.28125C43.5419 7.28125 57.9588 7.28125 72.8125 7.28125C72.8125 9.68406 72.8125 12.0869 72.8125 14.5625C75.2153 14.5625 77.6181 14.5625 80.0938 14.5625C80.0938 19.3681 80.0938 24.1737 80.0938 29.125C77.6909 29.125 75.2881 29.125 72.8125 29.125C72.8125 31.5278 72.8125 33.9306 72.8125 36.4062C58.3956 36.4062 43.9787 36.4062 29.125 36.4062C29.125 34.0034 29.125 31.6006 29.125 29.125C26.7222 29.125 24.3194 29.125 21.8438 29.125C21.8438 24.3194 21.8438 19.5138 21.8438 14.5625C24.2466 14.5625 26.6494 14.5625 29.125 14.5625C29.125 12.1597 29.125 9.75688 29.125 7.28125Z" fill="var(--ai-impact-vector-green, #487B47)" />
      <path d="M29.125 87.375C33.9306 87.375 38.7362 87.375 43.6875 87.375C43.6875 89.7778 43.6875 92.1806 43.6875 94.6562C38.8819 94.6562 34.0763 94.6562 29.125 94.6562C29.125 92.2534 29.125 89.8506 29.125 87.375ZM58.25 87.375C63.0556 87.375 67.8612 87.375 72.8125 87.375C72.8125 89.7778 72.8125 92.1806 72.8125 94.6562C68.0069 94.6562 63.2013 94.6562 58.25 94.6562C58.25 92.2534 58.25 89.8506 58.25 87.375ZM21.8438 94.6562C24.2466 94.6562 26.6494 94.6562 29.125 94.6562C29.125 97.0591 29.125 99.4619 29.125 101.938C33.9306 101.938 38.7362 101.938 43.6875 101.938C43.6875 104.34 43.6875 106.743 43.6875 109.219C36.4791 109.219 29.2706 109.219 21.8438 109.219C21.8438 104.413 21.8438 99.6075 21.8438 94.6562ZM43.6875 94.6562C48.4931 94.6562 53.2987 94.6562 58.25 94.6562C58.25 97.0591 58.25 99.4619 58.25 101.938C53.4444 101.938 48.6388 101.938 43.6875 101.938C43.6875 99.5347 43.6875 97.1319 43.6875 94.6562ZM72.8125 94.6562C75.2153 94.6562 77.6181 94.6562 80.0938 94.6562C80.0938 99.4619 80.0938 104.267 80.0938 109.219C72.8853 109.219 65.6769 109.219 58.25 109.219C58.25 106.816 58.25 104.413 58.25 101.938C63.0556 101.938 67.8612 101.938 72.8125 101.938C72.8125 99.5347 72.8125 97.1319 72.8125 94.6562Z" fill="var(--ai-impact-vector-green, #487B47)" />
      <path d="M36.4062 29.125C46.0175 29.125 55.6287 29.125 65.5312 29.125C65.5312 31.5278 65.5312 33.9306 65.5312 36.4062C55.92 36.4062 46.3088 36.4062 36.4062 36.4062C36.4062 34.0034 36.4062 31.6006 36.4062 29.125Z" fill="#FEFEFE" />
      <path d="M43.6875 65.5312C48.4931 65.5312 53.2987 65.5312 58.25 65.5312C58.25 67.9341 58.25 70.3369 58.25 72.8125C53.4444 72.8125 48.6388 72.8125 43.6875 72.8125C43.6875 70.4097 43.6875 68.0069 43.6875 65.5312Z" fill="#BA5F61" />
      <path d="M72.8125 72.8125H58.25V65.5312H65.5312V50.9688H58.25V65.5312H43.6875V50.9688H36.4062V65.5312H43.6875V72.8125H29.125V65.5312H21.8438V58.25H7.28125V43.6875H14.5625V50.9688H21.8438V36.4062H29.125V43.6875H72.8125V36.4062H80.0938V50.9688H87.375V43.6875H94.6562V58.25H80.0938V65.5312H72.8125V72.8125Z" fill="white" />
      <path d="M7.28125 72.8125H21.8438V87.375H7.28125V72.8125Z" fill="white" />
      <path d="M80.0938 72.8125H94.6562V87.375H80.0938V72.8125Z" fill="white" />
      <path d="M58.25 50.9688C60.6528 50.9688 63.0556 50.9688 65.5312 50.9688C65.5312 55.7744 65.5312 60.58 65.5312 65.5312C63.1284 65.5312 60.7256 65.5312 58.25 65.5312C58.25 60.7256 58.25 55.92 58.25 50.9688Z" fill="black" />
      <path d="M36.4062 50.9688C38.8091 50.9688 41.2119 50.9688 43.6875 50.9688C43.6875 55.7744 43.6875 60.58 43.6875 65.5312C41.2847 65.5312 38.8819 65.5312 36.4062 65.5312C36.4062 60.7256 36.4062 55.92 36.4062 50.9688Z" fill="black" />
    </svg>
  );
}

function PixelMonsterIcon({ className }: { className: string }) {
  return (
    <svg className={className} viewBox="0 0 137 103" fill="none" aria-hidden="true">
      <path d="M44.1328 3.5V14.5889H55.2793V25.6787H81.7207V14.5889H92.8672V3.5H111.206V21.6846H99.9629V25.6787H111.206V36.8633H115.257V14.5889H133.5V66.1367H122.354V77.3213H111.206V81.3154H122.354V99.5H104.11V88.4111H92.8672V77.3213H44.1328V88.4111H32.8896V99.5H14.6465V81.3154H25.7939V77.3213H14.6465V66.1367H3.5V14.5889H21.7432V36.8633H25.7939V25.6787H37.0371V21.6846H25.7939V3.5H44.1328ZM88.8164 47.9521H92.8672V43.959H88.8164V47.9521ZM44.1328 47.9521H48.1836V43.959H44.1328V47.9521Z" fill="var(--ai-impact-vector-green, #487B47)" stroke="black" strokeWidth="7" />
    </svg>
  );
}

function MarketThailandCard({ c, accent }: { c: MarketThailandContent; accent: string }) {
  return (
    <CardFrame eyebrow={c.eyebrow} title={c.title} accent={accent}>
      {c.openings && (
        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <p className="text-xs font-medium text-neutral-400">
            ประกาศงานที่พบในไทย
          </p>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-xl font-bold" style={{ color: accent }}>
              <EditableText value={c.openings} field="openings" className="inline" />
            </span>
            <span className="text-sm text-neutral-300">ตำแหน่ง</span>
          </div>
          <p className="mt-2 text-xs leading-relaxed text-neutral-500">
            จำนวนประกาศรับสมัครโดยประมาณ ณ เวลาที่เก็บข้อมูล
            จากแหล่งอ้างอิงของหน้านี้ ไม่ใช่จำนวนงานทั้งหมดในตลาด
          </p>
          <p className="mt-2 text-xs font-medium leading-relaxed text-neutral-300">
            แปลว่า: มีความต้องการจ้างงานให้เห็นชัด แต่ตัวเลขนี้เพียงอย่างเดียว
            ยังบอกไม่ได้ว่าสมัครง่ายหรือการแข่งขันสูงแค่ไหน
          </p>
        </div>
      )}
      {c.body && (
        <p>
          <EditableText value={c.body} field="body" className="block text-neutral-300 text-base leading-relaxed" />
        </p>
      )}
      {c.companies && c.companies.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {c.companies.map((co, i) => (
            <span
              key={i}
              className="text-xs rounded-full border border-white/10 bg-white/5 px-3 py-1 text-neutral-300"
            >
              <EditableText value={co} field={["companies", String(i)]} className="inline" />
            </span>
          ))}
        </div>
      )}
    </CardFrame>
  );
}

function DayInLifeCard({ c, accent }: { c: DayInLifeContent; accent: string }) {
  const [expanded, setExpanded] = useState<number | null>(null);
  const hasAnyTime = (c.steps ?? []).some((s) => s.time);

  return (
    <CardFrame eyebrow={c.eyebrow} title={c.title} accent={accent}>
      {hasAnyTime ? (
        /* Legacy time-based layout */
        <div className="flex flex-col">
          {(c.steps ?? []).map((s, i) => (
            <div key={i} className="flex gap-4 pb-4 last:pb-0">
              <div className="flex flex-col items-center">
                <span className="text-xs font-bold tabular-nums" style={{ color: accent }}>
                  <EditableText value={s.time ?? ""} field={["steps", String(i), "time"]} className="inline" />
                </span>
                <span className="flex-1 w-px bg-white/10 mt-1" />
              </div>
              <p className="pb-1">
                <EditableText
                  value={s.label}
                  field={["steps", String(i), "label"]}
                  className="block text-neutral-200 text-base leading-relaxed"
                />
              </p>
            </div>
          ))}
        </div>
      ) : (
        /* Activity cards layout */
        <div className="flex flex-col gap-2.5">
          {(c.steps ?? []).map((s, i) => {
            const isOpen = expanded === i;
            return (
              <button
                key={i}
                type="button"
                onClick={() => setExpanded(isOpen ? null : i)}
                className="text-left w-full rounded-xl border border-white/8 bg-white/[0.03] px-4 py-3 transition-all duration-200 hover:bg-white/[0.06] hover:border-white/15"
              >
                <div className="flex items-start gap-3">
                  <span
                    className="mt-1.5 h-2 w-2 rounded-full shrink-0"
                    style={{ background: accent }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-neutral-200 text-[15px] leading-relaxed">{s.label}</p>
                    {s.detail && (
                      <div
                        className={`overflow-hidden transition-all duration-200 ${
                          isOpen ? "max-h-40 opacity-100 mt-2" : "max-h-0 opacity-0"
                        }`}
                      >
                        <p className="text-neutral-400 text-sm leading-relaxed border-t border-white/5 pt-2">
                          {s.detail}
                        </p>
                      </div>
                    )}
                  </div>
                  {s.detail && (
                    <ChevronDown
                      className={`h-4 w-4 shrink-0 text-neutral-500 mt-1 transition-transform duration-200 ${
                        isOpen ? "rotate-180" : ""
                      }`}
                    />
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </CardFrame>
  );
}

const TIER_STYLES: Record<string, { label: string; bg: string; text: string }> = {
  direct: { label: getEntryRouteLabel("direct"), bg: "bg-emerald-500/20", text: "text-emerald-400" },
  related: { label: getEntryRouteLabel("related"), bg: "bg-amber-500/20", text: "text-amber-400" },
  alternative: { label: getEntryRouteLabel("alternative"), bg: "bg-sky-500/20", text: "text-sky-400" },
};

function EntryRoutesCard({ c, accent }: { c: EntryRoutesContent; accent: string }) {
  return (
    <CardFrame eyebrow={c.eyebrow} title={c.title ?? "มีเส้นทางไหนเข้าสู่อาชีพนี้ได้บ้าง?"} accent={accent}>
      {c.description && (
        <p className="mb-4">
          <EditableText value={c.description} field="description" className="block text-neutral-400 text-sm leading-relaxed" />
        </p>
      )}
      <div className="flex flex-col gap-3">
        {(c.faculties ?? []).map((f, i) => {
          const style = TIER_STYLES[f.tier] ?? TIER_STYLES.related;
          return (
            <Panel key={i}>
              <div className="flex items-center gap-2 mb-1">
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${style.bg} ${style.text}`}>
                  {style.label}
                </span>
                <EditableText
                  value={f.name}
                  field={["faculties", String(i), "name"]}
                  className="text-white font-semibold text-base"
                />
              </div>
              {f.examples && (
                <p className="mt-1">
                  <EditableText
                    value={f.examples}
                    field={["faculties", String(i), "examples"]}
                    className="block text-neutral-400 text-sm"
                  />
                </p>
              )}
              {f.note && (
                <p className="mt-1">
                  <EditableText
                    value={f.note}
                    field={["faculties", String(i), "note"]}
                    className="block text-neutral-500 text-xs italic"
                  />
                </p>
              )}
            </Panel>
          );
        })}
      </div>
    </CardFrame>
  );
}

function RisksCard({ c, accent }: { c: RisksContent; accent: string }) {
  return (
    <CardFrame eyebrow={c.eyebrow} title={c.title ?? "Real talk"} accent={accent}>
      <ul className="flex flex-col gap-3">
        {(c.risks ?? []).map((r, i) => (
          <li key={i} className="flex items-start gap-3">
            <span className="text-rose-400 mt-0.5 shrink-0">⚠</span>
            <EditableText
              value={r}
              field={["risks", String(i)]}
              className="text-neutral-200 text-base leading-relaxed"
            />
          </li>
        ))}
      </ul>
    </CardFrame>
  );
}

function RealPeopleCard({ c, accent }: { c: RealPeopleContent; accent: string }) {
  const [expanded, setExpanded] = useState<Set<number>>(new Set());

  const toggle = (i: number) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });

  return (
    <CardFrame eyebrow={c.eyebrow} title={c.title} accent={accent}>
      <div className="flex flex-col gap-3">
        {(c.people ?? []).map((p, i) => {
          const isExpanded = expanded.has(i);
          const hasMore =
            (p.path && p.path.length > 0) ||
            p.nowDoing ||
            p.whereHeading ||
            p.advice ||
            p.publisher ||
            p.url;

          return (
            <Panel key={i}>
              {/* header: image + name / role + salary chip */}
              <div className="flex items-start gap-3 mb-2">
                {p.imageUrl && (
                  <Image
                    src={p.imageUrl}
                    alt={p.name || "profile"}
                    width={48}
                    height={48}
                    className="h-12 w-12 rounded-full object-cover border border-white/10 shrink-0 bg-white/5"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      {p.name && (
                        <EditableText
                          value={p.name}
                          field={["people", String(i), "name"]}
                          className="font-semibold text-white"
                        />
                      )}
                      {p.role && (
                        <p className="mt-0.5">
                          <EditableText
                            value={p.role}
                            field={["people", String(i), "role"]}
                            className="block text-xs text-neutral-400"
                          />
                        </p>
                      )}
                    </div>
                    {p.salary && (
                      <span
                        className="shrink-0 text-xs font-bold rounded-full px-2.5 py-1"
                        style={{ color: accent, background: `${accent}1a` }}
                      >
                        <EditableText
                          value={p.salary}
                          field={["people", String(i), "salary"]}
                          className="inline"
                        />
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <p>
                <EditableText
                  value={p.background}
                  field={["people", String(i), "background"]}
                  className="block text-neutral-200 text-base leading-relaxed"
                />
              </p>

              {/* expanded detail */}
              {isExpanded && (
                <div className="mt-3 flex flex-col gap-3">
                  {/* trajectory: started → pivots → now */}
                  {p.path && p.path.length > 0 && (
                    <div className="flex flex-col">
                      {p.path.map((step, j) => (
                        <div key={j} className="flex gap-3 pb-2.5 last:pb-0">
                          <div className="flex flex-col items-center">
                            <span
                              className="h-1.5 w-1.5 rounded-full mt-1.5 shrink-0"
                              style={{ background: accent }}
                            />
                            {j < p.path!.length - 1 && <span className="flex-1 w-px bg-white/10 mt-1" />}
                          </div>
                          <p className="text-neutral-300 text-sm leading-relaxed">
                            {step.year && (
                              <EditableText
                                value={step.year}
                                field={["people", String(i), "path", String(j), "year"]}
                                className="font-semibold tabular-nums mr-1.5"
                                style={{ color: accent }}
                              />
                            )}
                            <EditableText
                              value={step.label}
                              field={["people", String(i), "path", String(j), "label"]}
                              className="inline"
                            />
                          </p>
                        </div>
                      ))}
                    </div>
                  )}

                  {p.nowDoing && (
                    <p className="text-neutral-300 text-sm leading-relaxed">
                      <span className="text-neutral-500">Now · </span>
                      <EditableText
                        value={p.nowDoing}
                        field={["people", String(i), "nowDoing"]}
                        className="inline"
                      />
                    </p>
                  )}
                  {p.whereHeading && (
                    <p className="text-neutral-300 text-sm leading-relaxed">
                      <span className="text-neutral-500">Heading · </span>
                      <EditableText
                        value={p.whereHeading}
                        field={["people", String(i), "whereHeading"]}
                        className="inline"
                      />
                    </p>
                  )}
                  {p.advice && (
                    <p
                      className="text-sm italic leading-relaxed border-l-2 pl-3"
                      style={{ borderColor: accent, color: "rgb(229 229 229)" }}
                    >
                      “
                      <EditableText
                        value={p.advice}
                        field={["people", String(i), "advice"]}
                        className="inline"
                      />
                      ”
                    </p>
                  )}

                  <div className="flex items-center gap-2 text-xs text-neutral-500">
                    {p.publisher && (
                      <EditableText
                        value={p.publisher}
                        field={["people", String(i), "publisher"]}
                        className="inline"
                      />
                    )}
                    {p.url && (
                      <a
                        href={p.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ml-auto inline-flex items-center gap-1 hover:text-neutral-300"
                      >
                        source <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                </div>
              )}

              {hasMore && (
                <button
                  onClick={() => toggle(i)}
                  className="mt-3 inline-flex items-center gap-1 text-xs font-medium transition-colors hover:text-white"
                  style={{ color: accent }}
                >
                  {isExpanded ? (
                    <>
                      Show less <ChevronUp className="h-3.5 w-3.5" />
                    </>
                  ) : (
                    <>
                      Read more <ChevronDown className="h-3.5 w-3.5" />
                    </>
                  )}
                </button>
              )}
            </Panel>
          );
        })}
      </div>
    </CardFrame>
  );
}

function FutureOutlookCard({ c, accent }: { c: FutureOutlookContent; accent: string }) {
  return (
    <CardFrame eyebrow={c.eyebrow} title={c.title} accent={accent}>
      {c.growthRate && (
        <div className="mb-6">
          <div className="text-5xl font-bold tracking-tight" style={{ color: accent }}>
            <EditableText value={c.growthRate} field="growthRate" className="inline" />
          </div>
          {c.growthLabel && (
            <p className="mt-1">
              <EditableText value={c.growthLabel} field="growthLabel" className="block text-sm text-neutral-400" />
            </p>
          )}
        </div>
      )}

      {c.timeline && c.timeline.length > 0 && (
        <div className="space-y-3 mb-6">
          {c.timeline.map((t, i) => (
            <div key={i} className="flex gap-3">
              <span className="shrink-0 w-14 text-sm font-semibold tabular-nums" style={{ color: accent }}>
                {t.year && (
                  <EditableText
                    value={t.year}
                    field={["timeline", String(i), "year"]}
                    className="inline"
                  />
                )}
              </span>
              <p>
                <EditableText
                  value={t.event}
                  field={["timeline", String(i), "event"]}
                  className="block text-neutral-200 text-base leading-relaxed"
                />
              </p>
            </div>
          ))}
        </div>
      )}

      {c.demandSignal && (
        <Panel className="border-emerald-400/20 bg-emerald-400/5 mb-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-emerald-300/80 mb-2">
            Demand Signal
          </p>
          <p>
            <EditableText value={c.demandSignal} field="demandSignal" className="block text-neutral-200 text-base leading-relaxed" />
          </p>
        </Panel>
      )}

      {c.risk && (
        <Panel className="border-amber-400/20 bg-amber-400/5">
          <p className="text-xs font-semibold uppercase tracking-wider text-amber-300/80 mb-2">
            Risk
          </p>
          <p>
            <EditableText value={c.risk} field="risk" className="block text-neutral-200 text-base leading-relaxed" />
          </p>
        </Panel>
      )}
    </CardFrame>
  );
}

function SourcesCard({ c, accent }: { c: SourcesContent; accent: string }) {
  return (
    <CardFrame eyebrow={c.eyebrow ?? "Sources"} title={c.title ?? "Where this comes from"} accent={accent}>
      <ol className="flex flex-col gap-2">
        {(c.items ?? []).map((s, index) => (
          <li key={s.ref} className="flex gap-2 text-sm">
            <span className="text-neutral-500 tabular-nums">[{s.ref}]</span>
            <a
              href={s.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-neutral-300 hover:text-white inline-flex items-center gap-1"
            >
              <EditableText
                value={s.title}
                field={["items", String(index), "title"]}
                className="inline"
              />
              {s.publisher && (
                <span className="text-neutral-600">
                  ·{" "}
                  <EditableText
                    value={s.publisher}
                    field={["items", String(index), "publisher"]}
                    className="inline"
                  />
                </span>
              )}
              <ExternalLink className="h-3 w-3 shrink-0" />
            </a>
          </li>
        ))}
      </ol>
    </CardFrame>
  );
}

function CtaCard({
  c,
  accent,
  squadUrl,
  onIntent,
}: {
  c: CtaContent;
  accent: string;
  squadUrl?: string | null;
  onIntent?: RadarIntentHandler;
}) {
  const [interestedRecorded, setInterestedRecorded] = useState(false);
  const [notInterestedRecorded, setNotInterestedRecorded] = useState(false);
  const anyRecorded = interestedRecorded || notInterestedRecorded;

  const recordInterested = () => {
    if (!onIntent) return;
    if (squadUrl) {
      try {
        const url = new URL(squadUrl, window.location.origin);
        const pathSlug = url.pathname.split("/").filter(Boolean).pop();
        if (pathSlug) onIntent(pathSlug, "interested", "field");
      } catch {
        onIntent("interested", "interested", "field");
      }
    } else {
      onIntent("interested", "interested", "field");
    }
    setInterestedRecorded(true);
  };

  const recordNotInterested = () => {
    onIntent?.("interested", "not-interested", "field");
    setNotInterestedRecorded(true);
  };

  return (
    <CardFrame eyebrow={c.eyebrow} title={c.title} accent={accent}>
      {c.body && (
        <p>
          <EditableText value={c.body} field="body" className="block text-neutral-300 text-base leading-relaxed" />
        </p>
      )}
      {c.button && (
        <div className="flex flex-col gap-2">
          <Button
            asChild={!!squadUrl && !anyRecorded}
            className="mt-2 w-full font-semibold text-white transition-all"
            style={{ background: interestedRecorded ? undefined : accent }}
            variant={interestedRecorded ? "outline" : "default"}
            onClick={squadUrl ? undefined : recordInterested}
            disabled={anyRecorded}
          >
            {squadUrl && !anyRecorded ? (
              <a
                href={squadUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={recordInterested}
              >
                <EditableText value={c.button} field="button" className="inline" /> <ArrowRight className="h-4 w-4 ml-1" />
              </a>
            ) : (
              <span className="inline-flex items-center gap-2">
                {interestedRecorded ? (
                  <><Check className="h-4 w-4" /> บันทึกแล้ว!</>
                ) : (
                  <EditableText value={c.button} field="button" className="inline" />
                )}
              </span>
            )}
          </Button>
          <button
            type="button"
            disabled={anyRecorded}
            onClick={recordNotInterested}
            className="inline-flex min-h-9 items-center justify-center gap-2 rounded-lg border border-white/10 px-3 text-xs font-medium text-neutral-400 hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {notInterestedRecorded ? "บันทึกแล้ว" : "ไม่สนใจลอง"}
          </button>
        </div>
      )}
    </CardFrame>
  );
}

// ── career survival indicators ──────────────────────────────────────────────

const SURVIVAL_METRICS: Array<{
  key: string;
  emoji: string;
  label: string;
  labelEn: string;
  unit?: string;
  max: number;
  invert?: boolean;
  isSalary?: boolean;
}> = [
  { key: "demand_growth", emoji: "📈", label: "ความต้องการตลาด", labelEn: "Market Demand", max: 10 },
  { key: "grad_employment_pct", emoji: "🚀", label: "อัตราการจ้างจบใหม่", labelEn: "New Grad Employment", unit: "%", max: 100 },
  { key: "saturation_level", emoji: "🧃", label: "ความอิ่มตัว", labelEn: "Market Saturation", max: 10, invert: true },
  { key: "progression_difficulty", emoji: "🗼", label: "ความยากในการเติบโต", labelEn: "Growth Difficulty", max: 10, invert: true },
  { key: "salary_floor", emoji: "💰", label: "เงินเดือนเริ่มต้น", labelEn: "Entry Salary", max: 1, isSalary: true },
  { key: "salary_ceiling", emoji: "🚀", label: "เงินเดือนสูงสุด", labelEn: "Max Salary", max: 1, isSalary: true },
];

function survivalBarColor(value: number, max: number, invert?: boolean): string {
  const ratio = value / max;
  if (invert) {
    return ratio >= 0.7 ? "#f59e0b" : ratio >= 0.4 ? "#f59e0b" : "#10b981";
  }
  return ratio >= 0.7 ? "#10b981" : ratio >= 0.4 ? "#f59e0b" : "#ef4444";
}

function formatSurvivalSalary(val: number): string {
  if (val >= 1000) return `${(val / 1000).toFixed(0)},000`;
  return val.toLocaleString();
}

function CareerSurvivalCard({ c, accent }: { c: CareerSurvivalContent; accent: string }) {
  const [showGlobal, setShowGlobal] = useState(false);
  const [expandedKey, setExpandedKey] = useState<string | null>(null);

  const metrics = showGlobal ? c.global_metrics : c.metrics;
  const details = showGlobal ? c.global_metric_details : c.metric_details;
  if (!metrics) return null;

  const tierConfig = {
    growing: { emoji: "🟢", label: "Growing", labelTh: getOutlookLabel("growing"), color: "#10b981" },
    shifting: { emoji: "🟡", label: "Shifting", labelTh: getOutlookLabel("shifting"), color: "#f59e0b" },
    exposed: { emoji: "🔴", label: "Exposed", labelTh: getOutlookLabel("exposed"), color: "#ef4444" },
  } as const;
  const tier = c.tier ? tierConfig[c.tier as keyof typeof tierConfig] : null;

  const scoreMetrics = SURVIVAL_METRICS.filter((m) => !m.isSalary);
  const vals = scoreMetrics
    .map(({ key, max, invert }) => {
      const v = (metrics as Record<string, number | null | undefined>)[key];
      if (v == null) return null;
      const ratio = v / max;
      return invert ? 1 - ratio : ratio;
    })
    .filter((v): v is number => v !== null);
  const overallScore = vals.length > 0 ? Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) : null;

  return (
    <CardFrame eyebrow={c.eyebrow} title={c.title} accent={accent}>
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 flex flex-col gap-0">
        {/* Header row: tier + score + toggle */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            {tier && (
              <span className="rc-tier-badge text-lg">{tier.emoji}</span>
            )}
            {overallScore !== null && (
              <span className="rc-score-value text-xl font-black tabular-nums" style={{ color: tier?.color ?? accent }}>
                {overallScore}<span className="text-xs font-medium text-neutral-400">/10</span>
              </span>
            )}
            {tier && (
              <span className="text-xs text-neutral-400">{tier.labelTh}</span>
            )}
          </div>
          {c.global_metrics && (
            <div className="flex rounded-full border border-white/10 bg-white/5 overflow-hidden">
              <button
                onClick={() => setShowGlobal(false)}
                className={`text-[11px] font-medium px-2.5 py-0.5 transition-colors ${
                  !showGlobal ? "bg-white/15 text-white" : "text-neutral-400 hover:text-white"
                }`}
              >
                🇹🇭 TH
              </button>
              <button
                onClick={() => setShowGlobal(true)}
                className={`text-[11px] font-medium px-2.5 py-0.5 transition-colors ${
                  showGlobal ? "bg-white/15 text-white" : "text-neutral-400 hover:text-white"
                }`}
              >
                🌐 Global
              </button>
            </div>
          )}
        </div>

        {SURVIVAL_METRICS.map(({ key, emoji, label, max, invert, isSalary }, idx) => {
          const val = (metrics as Record<string, number | null | undefined>)[key];
          if (val == null) return null;
          const detail = details?.[key];
          const isExpanded = expandedKey === key;
          const interpretation = interpretRadarMetric(key, val, max);

          return (
            <button
              key={key}
              onClick={() => detail ? setExpandedKey(isExpanded ? null : key) : undefined}
              className={`rc-stagger text-left py-2 border-b border-white/5 last:border-b-0 rounded-lg transition-colors ${
                detail ? "cursor-pointer hover:bg-white/[0.04] active:bg-white/[0.06] -mx-2 px-2" : ""
              }`}
              style={{ transitionDelay: `${0.3 + idx * 0.07}s` }}
            >
              {isSalary ? (
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-base shrink-0">{emoji}</span>
                    <span className="text-xs text-neutral-400 flex-1">{label}</span>
                    <span className="text-white font-bold text-sm tabular-nums">
                      {formatSurvivalSalary(val)}฿/mo
                    </span>
                    {detail && (
                      <span className={`text-[10px] text-neutral-500 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}>
                        ▾
                      </span>
                    )}
                  </div>
                  {detail && !isExpanded && (
                    <p className="text-[10px] text-neutral-500 ml-7 mt-0.5">แตะเพื่อดูรายละเอียด</p>
                  )}
                  <p className="ml-7 mt-1 text-[11px] text-neutral-400">{interpretation}</p>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-2">
                    <span className="text-base shrink-0">{emoji}</span>
                    <span className="text-xs text-neutral-300 flex-1">{label}</span>
                    <span className="text-white font-bold text-xs tabular-nums w-10 text-right">
                      {val}{key === "grad_employment_pct" ? "%" : "/10"}
                    </span>
                    {detail && (
                      <span className={`text-[10px] text-neutral-500 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}>
                        ▾
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-1 ml-7">
                    <div className="h-2 rounded-full bg-white/5 overflow-hidden flex-1">
                      <div
                        className="rc-bar-fill h-full rounded-full"
                        style={{
                          width: `${Math.min(100, (val / max) * 100)}%`,
                          background: survivalBarColor(val, max, invert),
                          transitionDelay: `${0.35 + idx * 0.1}s`,
                        }}
                      />
                    </div>
                  </div>
                  <p className="ml-7 mt-1 text-[11px] text-neutral-400">{interpretation}</p>
                </>
              )}

              {isExpanded && detail && (
                <div className="mt-1.5 ml-7 text-xs text-neutral-400 leading-relaxed">
                  {detail.th && <p>{detail.th}</p>}
                  {detail.en && <p className="text-neutral-500 mt-0.5">{detail.en}</p>}
                  {detail.source && (
                    <p className="mt-1 text-[10px] text-neutral-500">
                      📎{" "}
                      {detail.source_url ? (
                        <a
                          href={detail.source_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline underline-offset-2 hover:text-neutral-300 transition-colors"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {detail.source}
                        </a>
                      ) : (
                        detail.source
                      )}
                    </p>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </CardFrame>
  );
}

// ── reflection (interactive) ─────────────────────────────────────────────────

function ReflectionCard({
  c,
  accent,
  submitted,
  onSubmit,
}: {
  c: ReflectionContent;
  accent: string;
  submitted: boolean;
  onSubmit: (payload: { rating?: number; tags?: string[]; text?: string }) => Promise<void> | void;
}) {
  const [rating, setRating] = useState<number | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleChip = (chip: string) =>
    setSelected((prev) =>
      prev.includes(chip) ? prev.filter((x) => x !== chip) : [...prev, chip]
    );

  const canSubmit = c.rating ? rating !== null : selected.length > 0 || text.trim().length > 0;

  const handle = async () => {
    if (!canSubmit || busy) return;
    setBusy(true);
    setError(null);
    try {
      await onSubmit({
        rating: rating ?? undefined,
        tags: selected.length ? selected : undefined,
        text: text.trim() || undefined,
      });
    } catch {
      setError("Could not save this answer. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  if (submitted) {
    return (
      <CardFrame eyebrow={c.eyebrow} title={c.title} accent={accent}>
        <div className="flex items-center gap-2 text-emerald-300">
          <Check className="h-5 w-5" /> <span>Saved - keep going</span>
        </div>
      </CardFrame>
    );
  }

  return (
    <CardFrame eyebrow={c.eyebrow} title={c.title} accent={accent}>
      {c.rating && (
        <div className="flex justify-between gap-2">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              onClick={() => setRating(n)}
              className="flex-1 aspect-square rounded-xl border text-lg font-bold transition-all"
              style={{
                borderColor: rating === n ? accent : "rgba(255,255,255,0.1)",
                background: rating === n ? `${accent}22` : "rgba(255,255,255,0.05)",
                color: rating === n ? accent : "#a3a3a3",
              }}
            >
              {n}
            </button>
          ))}
        </div>
      )}

      {c.chips && c.chips.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {c.chips.map((chip, index) => {
            const on = selected.includes(chip);
            return (
              <button
                key={chip}
                onClick={() => toggleChip(chip)}
                className="rounded-full border px-4 py-2 text-sm font-medium transition-all"
                style={{
                  borderColor: on ? accent : "rgba(255,255,255,0.1)",
                  background: on ? `${accent}22` : "rgba(255,255,255,0.05)",
                  color: on ? accent : "#a3a3a3",
                }}
              >
                <EditableText
                  value={chip}
                  field={["chips", String(index)]}
                  className="inline"
                />
              </button>
            );
          })}
        </div>
      )}

      {c.allowText && (
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={c.placeholder ?? "Optional — a sentence is fine..."}
          className="bg-white/5 border-white/10 text-white placeholder:text-neutral-500 resize-none"
          rows={3}
        />
      )}

      <Button
        onClick={handle}
        disabled={!canSubmit || busy}
        className="w-full font-semibold text-white disabled:opacity-40"
        style={{ background: accent }}
      >
        {busy ? "Saving..." : "Continue"}
      </Button>
      {error && <p className="text-sm text-rose-300">{error}</p>}
    </CardFrame>
  );
}

// ── dispatch ─────────────────────────────────────────────────────────────────

export type FieldSource = { ref: number; title: string; publisher?: string | null; url: string };

export interface RadarCardViewProps {
  kind: string;
  content: Record<string, unknown>;
  accent: string;
  squadUrl?: string | null;
  fieldSources?: FieldSource[];
  reflectionSubmitted?: boolean;
  showSignupPrompt?: boolean;
  signupHref?: string;
  onReflect?: (payload: { rating?: number; tags?: string[]; text?: string }) => Promise<void> | void;
  onIntent?: RadarIntentHandler;
}

export function SourceRefs({ refs, sources }: { refs: number[]; sources: FieldSource[] }) {
  const matched = refs
    .map((r) => sources.find((s) => s.ref === r))
    .filter((s): s is FieldSource => !!s);
  if (matched.length === 0) return null;
  return (
    <div className="mt-4 pt-3 border-t border-white/10 flex flex-wrap gap-x-4 gap-y-1">
      {matched.map((s) => (
        <a
          key={s.ref}
          href={s.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[11px] text-neutral-500 hover:text-neutral-300 transition-colors inline-flex items-center gap-1"
        >
          <span className="tabular-nums">[{s.ref}]</span>
          <span className="truncate max-w-[200px]">{s.title}</span>
          <ExternalLink className="h-2.5 w-2.5 shrink-0" />
        </a>
      ))}
    </div>
  );
}

export function RadarCardView({
  kind,
  content,
  accent,
  squadUrl,
  fieldSources = [],
  reflectionSubmitted = false,
  onReflect,
  onIntent,
}: RadarCardViewProps) {
  const c = content as never;
  const sourceRefs = (content.source_refs as number[] | undefined) ?? [];

  let cardNode: React.ReactNode;
  switch (kind) {
    case "hook":
      cardNode = <HookCard c={c} accent={accent} />;
      break;
    case "careerSurvival":
      cardNode = <CareerSurvivalCard c={c} accent={accent} />;
      break;
    case "fantasyReality":
      cardNode = <FantasyRealityCard c={c} accent={accent} />;
      break;
    case "text":
      cardNode = <TextCard c={c} accent={accent} onIntent={onIntent} />;
      break;
    case "list":
      cardNode = <ListCard c={c} accent={accent} />;
      break;
    case "jobs":
      cardNode = <JobsCard c={c} accent={accent} />;
      break;
    case "salaryProgression":
      cardNode = <SalaryProgressionCard c={c} accent={accent} />;
      break;
    case "growthCompare":
      cardNode = <GrowthCompareCard c={c} accent={accent} />;
      break;
    case "aiImpact":
      cardNode = <AiImpactCard c={c} accent={accent} />;
      break;
    case "marketThailand":
      cardNode = <MarketThailandCard c={c} accent={accent} />;
      break;
    case "dayInLife":
      cardNode = <DayInLifeCard c={c} accent={accent} />;
      break;
    case "entryRoutes":
      cardNode = <EntryRoutesCard c={c} accent={accent} />;
      break;
    case "risks":
      cardNode = <RisksCard c={c} accent={accent} />;
      break;
    case "realPeople":
      cardNode = <RealPeopleCard c={c} accent={accent} />;
      break;
    case "futureOutlook":
      cardNode = <FutureOutlookCard c={c} accent={accent} />;
      break;
    case "sources":
      cardNode = <SourcesCard c={c} accent={accent} />;
      break;
    case "cta":
      cardNode = <CtaCard c={c} accent={accent} squadUrl={squadUrl} onIntent={onIntent} />;
      break;
    case "reflection":
      cardNode = (
        <ReflectionCard
          c={c}
          accent={accent}
          submitted={reflectionSubmitted}
          onSubmit={onReflect ?? (() => {})}
        />
      );
      break;
    default:
      cardNode = <TextCard c={c} accent={accent} />;
  }

  return cardNode;
}
