"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ExternalLink, ArrowRight, Check } from "lucide-react";

// ── content shapes (one per radar_cards.kind) ────────────────────────────────

export interface CardBase {
  eyebrow?: string;
  title?: string;
}

export type HookContent = CardBase & { body?: string; stat?: string; statLabel?: string };
export type FantasyRealityContent = CardBase & { fantasy?: string; reality?: string };
export type TextContent = CardBase & { body?: string };
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
  levels?: Array<{ level: string; years?: string; salary?: string; note?: string }>;
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
};
export type MarketThailandContent = CardBase & {
  body?: string;
  openings?: string;
  companies?: string[];
};
export type DayInLifeContent = CardBase & { steps?: Array<{ time: string; label: string }> };
export type EntryRoutesContent = CardBase & {
  routes?: Array<{ tag?: string; route: string; subtitle?: string; cost?: string; time?: string; icon?: string }>;
};
export type RisksContent = CardBase & { risks?: string[] };
export type RealPeopleContent = CardBase & {
  people?: Array<{
    name?: string;
    role?: string;
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
export type SourcesContent = CardBase & {
  items?: Array<{ ref: number; title: string; publisher?: string; url: string }>;
};

// ── shared frame ─────────────────────────────────────────────────────────────

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
        <span
          className="text-xs font-semibold uppercase tracking-[0.18em]"
          style={{ color: accent }}
        >
          {eyebrow}
        </span>
      )}
      {title && (
        <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white leading-[1.1]">
          {title}
        </h2>
      )}
      {children}
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
            {c.stat}
          </span>
          {c.statLabel && <span className="text-sm text-neutral-400">{c.statLabel}</span>}
        </div>
      )}
      {c.body && <p className="text-neutral-300 text-base leading-relaxed">{c.body}</p>}
    </CardFrame>
  );
}

function FantasyRealityCard({ c, accent }: { c: FantasyRealityContent; accent: string }) {
  return (
    <CardFrame eyebrow={c.eyebrow} title={c.title} accent={accent}>
      <Panel className="border-amber-400/20 bg-amber-400/5">
        <p className="text-xs font-semibold uppercase tracking-wider text-amber-300/80 mb-1">
          Fantasy
        </p>
        <p className="text-neutral-200 text-sm leading-relaxed">{c.fantasy}</p>
      </Panel>
      <Panel className="border-emerald-400/20 bg-emerald-400/5">
        <p className="text-xs font-semibold uppercase tracking-wider text-emerald-300/80 mb-1">
          Reality
        </p>
        <p className="text-neutral-200 text-sm leading-relaxed">{c.reality}</p>
      </Panel>
    </CardFrame>
  );
}

function TextCard({ c, accent }: { c: TextContent; accent: string }) {
  return (
    <CardFrame eyebrow={c.eyebrow} title={c.title} accent={accent}>
      {c.body && (
        <p className="text-neutral-300 text-base leading-relaxed whitespace-pre-line">{c.body}</p>
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
            <span className="text-neutral-200 text-base">{item}</span>
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
              <span className="text-white font-semibold">{job.title}</span>
              {job.salary && (
                <span className="text-sm font-bold shrink-0" style={{ color: accent }}>
                  {job.salary}
                </span>
              )}
            </div>
            <div className="flex flex-wrap gap-2 mt-2 text-xs text-neutral-400">
              {job.demand && <span>Demand: {job.demand}</span>}
              {job.growth && <span style={{ color: accent }}>{job.growth} growth</span>}
            </div>
            {job.note && <p className="text-neutral-400 text-xs mt-2 leading-relaxed">{job.note}</p>}
          </Panel>
        ))}
      </div>
    </CardFrame>
  );
}

function SalaryProgressionCard({ c, accent }: { c: SalaryProgressionContent; accent: string }) {
  return (
    <CardFrame eyebrow={c.eyebrow} title={c.title} accent={accent}>
      <div className="flex flex-col gap-3">
        {(c.levels ?? []).map((lvl, i) => (
          <Panel key={i}>
            <div className="flex items-center justify-between gap-3">
              <div>
                <span className="text-white font-semibold">{lvl.level}</span>
                {lvl.years && <span className="text-neutral-500 text-xs ml-2">{lvl.years} yrs</span>}
              </div>
              {lvl.salary && (
                <span className="text-sm font-bold shrink-0" style={{ color: accent }}>
                  {lvl.salary}
                </span>
              )}
            </div>
            {lvl.note && <p className="text-neutral-400 text-xs mt-2 leading-relaxed">{lvl.note}</p>}
          </Panel>
        ))}
      </div>
    </CardFrame>
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
                {it.label}
              </span>
              <span className="text-neutral-300">
                +{it.growth}
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

function AiImpactCard({ c, accent }: { c: AiImpactContent; accent: string }) {
  return (
    <CardFrame eyebrow={c.eyebrow} title={c.title} accent={accent}>
      {c.verdict && (
        <Panel>
          <p className="text-neutral-100 text-sm leading-relaxed">{c.verdict}</p>
        </Panel>
      )}
      {c.augmented && c.augmented.length > 0 && (
        <Panel className="border-emerald-400/20 bg-emerald-400/5">
          <p className="text-xs font-semibold uppercase tracking-wider text-emerald-300/80 mb-2">
            AI helps you
          </p>
          <ul className="flex flex-col gap-1.5">
            {c.augmented.map((t, i) => (
              <li key={i} className="text-neutral-200 text-sm leading-relaxed">
                • {t}
              </li>
            ))}
          </ul>
        </Panel>
      )}
      {c.automated && c.automated.length > 0 && (
        <Panel className="border-rose-400/20 bg-rose-400/5">
          <p className="text-xs font-semibold uppercase tracking-wider text-rose-300/80 mb-2">
            AI may replace
          </p>
          <ul className="flex flex-col gap-1.5">
            {c.automated.map((t, i) => (
              <li key={i} className="text-neutral-200 text-sm leading-relaxed">
                • {t}
              </li>
            ))}
          </ul>
        </Panel>
      )}
    </CardFrame>
  );
}

function MarketThailandCard({ c, accent }: { c: MarketThailandContent; accent: string }) {
  return (
    <CardFrame eyebrow={c.eyebrow} title={c.title} accent={accent}>
      {c.openings && (
        <div className="text-xl font-bold" style={{ color: accent }}>
          {c.openings}
        </div>
      )}
      {c.body && <p className="text-neutral-300 text-base leading-relaxed">{c.body}</p>}
      {c.companies && c.companies.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {c.companies.map((co, i) => (
            <span
              key={i}
              className="text-xs rounded-full border border-white/10 bg-white/5 px-3 py-1 text-neutral-300"
            >
              {co}
            </span>
          ))}
        </div>
      )}
    </CardFrame>
  );
}

function DayInLifeCard({ c, accent }: { c: DayInLifeContent; accent: string }) {
  return (
    <CardFrame eyebrow={c.eyebrow} title={c.title} accent={accent}>
      <div className="flex flex-col">
        {(c.steps ?? []).map((s, i) => (
          <div key={i} className="flex gap-4 pb-4 last:pb-0">
            <div className="flex flex-col items-center">
              <span className="text-xs font-bold tabular-nums" style={{ color: accent }}>
                {s.time}
              </span>
              <span className="flex-1 w-px bg-white/10 mt-1" />
            </div>
            <p className="text-neutral-200 text-sm leading-relaxed pb-1">{s.label}</p>
          </div>
        ))}
      </div>
    </CardFrame>
  );
}

function EntryRoutesCard({ c, accent }: { c: EntryRoutesContent; accent: string }) {
  return (
    <CardFrame eyebrow={c.eyebrow} title={c.title} accent={accent}>
      <div className="flex flex-col gap-3">
        {(c.routes ?? []).map((r, i) => (
          <Panel key={i}>
            <div className="flex items-center gap-2">
              {r.icon && <span className="text-xl">{r.icon}</span>}
              {r.tag && <span className="text-white font-semibold">{r.tag}</span>}
            </div>
            {r.subtitle && <p className="text-xs text-neutral-500 mt-0.5">{r.subtitle}</p>}
            <p className="text-neutral-200 text-sm mt-2 leading-relaxed">{r.route}</p>
            <div className="flex gap-3 mt-2 text-xs text-neutral-400">
              {r.time && <span>⏱ {r.time}</span>}
              {r.cost && <span>{r.cost}</span>}
            </div>
          </Panel>
        ))}
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
            <span className="text-neutral-200 text-sm leading-relaxed">{r}</span>
          </li>
        ))}
      </ul>
    </CardFrame>
  );
}

function RealPeopleCard({ c, accent }: { c: RealPeopleContent; accent: string }) {
  return (
    <CardFrame eyebrow={c.eyebrow} title={c.title} accent={accent}>
      <div className="flex flex-col gap-3">
        {(c.people ?? []).map((p, i) => (
          <Panel key={i}>
            {/* header: name / role + honest salary chip */}
            {(p.name || p.role || p.salary) && (
              <div className="flex items-start justify-between gap-3 mb-2">
                <div>
                  {p.name && <span className="text-white font-semibold">{p.name}</span>}
                  {p.role && (
                    <p className="text-xs text-neutral-400 mt-0.5">{p.role}</p>
                  )}
                </div>
                {p.salary && (
                  <span
                    className="shrink-0 text-xs font-bold rounded-full px-2.5 py-1"
                    style={{ color: accent, background: `${accent}1a` }}
                  >
                    {p.salary}
                  </span>
                )}
              </div>
            )}

            <p className="text-neutral-200 text-sm leading-relaxed">{p.background}</p>

            {/* trajectory: started → pivots → now */}
            {p.path && p.path.length > 0 && (
              <div className="mt-3 flex flex-col">
                {p.path.map((step, j) => (
                  <div key={j} className="flex gap-3 pb-2.5 last:pb-0">
                    <div className="flex flex-col items-center">
                      <span className="h-1.5 w-1.5 rounded-full mt-1.5 shrink-0" style={{ background: accent }} />
                      {j < p.path!.length - 1 && <span className="flex-1 w-px bg-white/10 mt-1" />}
                    </div>
                    <p className="text-neutral-300 text-xs leading-relaxed">
                      {step.year && (
                        <span className="font-semibold tabular-nums mr-1.5" style={{ color: accent }}>
                          {step.year}
                        </span>
                      )}
                      {step.label}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {p.nowDoing && (
              <p className="mt-3 text-neutral-300 text-xs leading-relaxed">
                <span className="text-neutral-500">Now · </span>
                {p.nowDoing}
              </p>
            )}
            {p.whereHeading && (
              <p className="mt-1.5 text-neutral-300 text-xs leading-relaxed">
                <span className="text-neutral-500">Heading · </span>
                {p.whereHeading}
              </p>
            )}
            {p.advice && (
              <p
                className="mt-3 text-sm italic leading-relaxed border-l-2 pl-3"
                style={{ borderColor: accent, color: "rgb(229 229 229)" }}
              >
                “{p.advice}”
              </p>
            )}

            <div className="flex items-center gap-2 mt-3 text-xs text-neutral-500">
              {p.publisher && <span>{p.publisher}</span>}
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
          </Panel>
        ))}
      </div>
    </CardFrame>
  );
}

function SourcesCard({ c, accent }: { c: SourcesContent; accent: string }) {
  return (
    <CardFrame eyebrow={c.eyebrow ?? "Sources"} title={c.title ?? "Where this comes from"} accent={accent}>
      <ol className="flex flex-col gap-2">
        {(c.items ?? []).map((s) => (
          <li key={s.ref} className="flex gap-2 text-sm">
            <span className="text-neutral-500 tabular-nums">[{s.ref}]</span>
            <a
              href={s.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-neutral-300 hover:text-white inline-flex items-center gap-1"
            >
              {s.title}
              {s.publisher && <span className="text-neutral-600">· {s.publisher}</span>}
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
}: {
  c: CtaContent;
  accent: string;
  squadUrl?: string | null;
}) {
  return (
    <CardFrame eyebrow={c.eyebrow} title={c.title} accent={accent}>
      {c.body && <p className="text-neutral-300 text-base leading-relaxed">{c.body}</p>}
      {c.button && (
        <Button
          asChild={!!squadUrl}
          className="mt-2 w-full font-semibold text-white"
          style={{ background: accent }}
        >
          {squadUrl ? (
            <a href={squadUrl} target="_blank" rel="noopener noreferrer">
              {c.button} <ArrowRight className="h-4 w-4 ml-1" />
            </a>
          ) : (
            <span>{c.button}</span>
          )}
        </Button>
      )}
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
  onSubmit: (payload: { rating?: number; tags?: string[]; text?: string }) => void;
}) {
  const [rating, setRating] = useState<number | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);

  const toggleChip = (chip: string) =>
    setSelected((prev) =>
      prev.includes(chip) ? prev.filter((x) => x !== chip) : [...prev, chip]
    );

  const canSubmit = c.rating ? rating !== null : selected.length > 0 || text.trim().length > 0;

  const handle = async () => {
    if (!canSubmit || busy) return;
    setBusy(true);
    try {
      await onSubmit({
        rating: rating ?? undefined,
        tags: selected.length ? selected : undefined,
        text: text.trim() || undefined,
      });
    } finally {
      setBusy(false);
    }
  };

  if (submitted) {
    return (
      <CardFrame eyebrow={c.eyebrow} title={c.title} accent={accent}>
        <div className="flex items-center gap-2 text-emerald-300">
          <Check className="h-5 w-5" /> <span>Saved — keep going</span>
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
          {c.chips.map((chip) => {
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
                {chip}
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
    </CardFrame>
  );
}

// ── dispatch ─────────────────────────────────────────────────────────────────

export interface RadarCardViewProps {
  kind: string;
  content: Record<string, unknown>;
  accent: string;
  squadUrl?: string | null;
  reflectionSubmitted?: boolean;
  onReflect?: (payload: { rating?: number; tags?: string[]; text?: string }) => void;
}

export function RadarCardView({
  kind,
  content,
  accent,
  squadUrl,
  reflectionSubmitted = false,
  onReflect,
}: RadarCardViewProps) {
  const c = content as never;
  switch (kind) {
    case "hook":
      return <HookCard c={c} accent={accent} />;
    case "fantasyReality":
      return <FantasyRealityCard c={c} accent={accent} />;
    case "text":
      return <TextCard c={c} accent={accent} />;
    case "list":
      return <ListCard c={c} accent={accent} />;
    case "jobs":
      return <JobsCard c={c} accent={accent} />;
    case "salaryProgression":
      return <SalaryProgressionCard c={c} accent={accent} />;
    case "growthCompare":
      return <GrowthCompareCard c={c} accent={accent} />;
    case "aiImpact":
      return <AiImpactCard c={c} accent={accent} />;
    case "marketThailand":
      return <MarketThailandCard c={c} accent={accent} />;
    case "dayInLife":
      return <DayInLifeCard c={c} accent={accent} />;
    case "entryRoutes":
      return <EntryRoutesCard c={c} accent={accent} />;
    case "risks":
      return <RisksCard c={c} accent={accent} />;
    case "realPeople":
      return <RealPeopleCard c={c} accent={accent} />;
    case "sources":
      return <SourcesCard c={c} accent={accent} />;
    case "cta":
      return <CtaCard c={c} accent={accent} squadUrl={squadUrl} />;
    case "reflection":
      return (
        <ReflectionCard
          c={c}
          accent={accent}
          submitted={reflectionSubmitted}
          onSubmit={onReflect ?? (() => {})}
        />
      );
    default:
      return <TextCard c={c} accent={accent} />;
  }
}
