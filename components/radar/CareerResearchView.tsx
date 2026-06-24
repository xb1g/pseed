"use client";

import { useState } from "react";
import { ExternalLink, ChevronDown, ChevronUp, TrendingUp, Users, BarChart3, Zap, DollarSign } from "lucide-react";

// ── types ────────────────────────────────────────────────────────────────────

interface Metrics {
  demand_growth?: number | null;
  grad_employment_pct?: number | null;
  saturation_level?: number | null;
  progression_difficulty?: number | null;
  salary_floor?: number | null;
  salary_ceiling?: number | null;
}

interface MetricDetail {
  th?: string;
  en?: string;
  sources?: Array<{ title: string; url: string }>;
}

interface Source {
  title: string;
  url: string;
  author?: string;
  date?: string;
}

interface Insight {
  category: string;
  content: string;
  priority: number;
}

export interface CareerResearch {
  tier?: string;
  reasoning?: string;
  sources?: Source[];
  insights?: Insight[];
  metrics?: Metrics;
  global_metrics?: Metrics;
  metric_details?: Record<string, MetricDetail>;
  global_metric_details?: Record<string, MetricDetail>;
  escape_route_slug?: string;
  aliases?: string[];
}

// ── helpers ──────────────────────────────────────────────────────────────────

const TIER_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  growing: { label: "Growing", color: "text-emerald-300", bg: "bg-emerald-500/15 border-emerald-500/25" },
  shifting: { label: "Shifting", color: "text-amber-300", bg: "bg-amber-500/15 border-amber-500/25" },
  exposed: { label: "AI Exposed", color: "text-rose-300", bg: "bg-rose-500/15 border-rose-500/25" },
};

const METRIC_CONFIG: Array<{ key: keyof Metrics; label: string; icon: typeof TrendingUp; unit?: string; invert?: boolean }> = [
  { key: "demand_growth", label: "Demand Growth", icon: TrendingUp },
  { key: "grad_employment_pct", label: "Grad Employment", icon: Users, unit: "%" },
  { key: "saturation_level", label: "Market Saturation", icon: BarChart3, invert: true },
  { key: "progression_difficulty", label: "Progression Difficulty", icon: Zap, invert: true },
  { key: "salary_floor", label: "Entry Salary", icon: DollarSign, unit: " THB/mo" },
  { key: "salary_ceiling", label: "Senior Salary", icon: DollarSign, unit: " THB/mo" },
];

const INSIGHT_LABELS: Record<string, string> = {
  skills: "Key Skills",
  education: "Education",
  certifications: "Certifications",
  portfolio: "Portfolio",
  market: "Market",
  timeline: "Timeline",
  salary: "Salary",
  competition: "Competition",
};

function formatSalary(val: number): string {
  if (val >= 1000) return `${(val / 1000).toFixed(0)}k`;
  return val.toString();
}

function MetricBar({ value, max, accent, invert }: { value: number; max: number; accent: string; invert?: boolean }) {
  const pct = Math.min(100, (value / max) * 100);
  const barColor = invert
    ? value >= 7 ? "#ef4444" : value >= 4 ? "#f59e0b" : "#10b981"
    : value >= 7 ? "#10b981" : value >= 4 ? "#f59e0b" : "#ef4444";
  return (
    <div className="h-2 rounded-full bg-white/5 overflow-hidden flex-1">
      <div
        className="h-full rounded-full transition-all duration-700"
        style={{ width: `${pct}%`, background: barColor }}
      />
    </div>
  );
}

// ── main component ───────────────────────────────────────────────────────────

export function CareerResearchView({ research, accent }: { research: CareerResearch; accent: string }) {
  const [expandedMetric, setExpandedMetric] = useState<string | null>(null);
  const [showGlobal, setShowGlobal] = useState(false);

  const tier = TIER_CONFIG[research.tier ?? ""] ?? null;
  const metrics = showGlobal ? research.global_metrics : research.metrics;
  const details = showGlobal ? research.global_metric_details : research.metric_details;
  const insights = (research.insights ?? []).sort((a, b) => a.priority - b.priority);

  return (
    <div className="w-full max-w-xl mx-auto flex flex-col gap-6">
      {/* Tier badge + reasoning */}
      {tier && (
        <div className={`rounded-2xl border p-4 ${tier.bg}`}>
          <span className={`text-xs font-bold uppercase tracking-[0.15em] ${tier.color}`}>
            {tier.label}
          </span>
          {research.reasoning && (
            <p className="text-neutral-300 text-sm leading-relaxed mt-2">{research.reasoning}</p>
          )}
        </div>
      )}

      {/* Metrics */}
      {metrics && Object.values(metrics).some(v => v != null) && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h3 className="text-white font-bold text-lg">Career Metrics</h3>
            {research.global_metrics && (
              <button
                onClick={() => setShowGlobal(!showGlobal)}
                className="text-xs font-medium px-3 py-1 rounded-full border border-white/10 bg-white/5 text-neutral-400 hover:text-white hover:bg-white/10 transition-colors"
              >
                {showGlobal ? "🇹🇭 Thai" : "🌏 Global"}
              </button>
            )}
          </div>

          {METRIC_CONFIG.map(({ key, label, icon: Icon, unit, invert }) => {
            const val = metrics[key];
            if (val == null) return null;
            const isSalary = key === "salary_floor" || key === "salary_ceiling";
            const detail = details?.[key];
            const isExpanded = expandedMetric === key;

            return (
              <button
                key={key}
                onClick={() => detail && setExpandedMetric(isExpanded ? null : key)}
                className="rounded-xl border border-white/10 bg-white/5 p-3 text-left transition-colors hover:bg-white/[0.07]"
              >
                <div className="flex items-center gap-3">
                  <Icon className="h-4 w-4 shrink-0 text-neutral-500" />
                  <span className="text-sm text-neutral-300 flex-1">{label}</span>
                  <span className="text-sm font-bold text-white tabular-nums">
                    {isSalary ? formatSalary(val) : val}
                    {isSalary ? " THB/mo" : unit === "%" ? "%" : "/10"}
                  </span>
                  {detail && (
                    isExpanded
                      ? <ChevronUp className="h-3.5 w-3.5 text-neutral-500" />
                      : <ChevronDown className="h-3.5 w-3.5 text-neutral-500" />
                  )}
                </div>
                {!isSalary && (
                  <div className="mt-2">
                    <MetricBar value={val} max={key === "grad_employment_pct" ? 100 : 10} accent={accent} invert={invert} />
                  </div>
                )}
                {isExpanded && detail && (
                  <div className="mt-3 pt-3 border-t border-white/10">
                    {detail.th && <p className="text-neutral-300 text-xs leading-relaxed">{detail.th}</p>}
                    {detail.en && <p className="text-neutral-500 text-xs leading-relaxed mt-1">{detail.en}</p>}
                    {detail.sources && detail.sources.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {detail.sources.map((s, i) => (
                          <a
                            key={i}
                            href={s.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={e => e.stopPropagation()}
                            className="text-[10px] text-neutral-500 hover:text-neutral-300 inline-flex items-center gap-1"
                          >
                            {s.title} <ExternalLink className="h-2.5 w-2.5" />
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Insights */}
      {insights.length > 0 && (
        <div className="flex flex-col gap-3">
          <h3 className="text-white font-bold text-lg">Insights</h3>
          {insights.map((insight, i) => (
            <div key={i} className="rounded-xl border border-white/10 bg-white/5 p-3">
              <span
                className="text-[10px] font-semibold uppercase tracking-[0.15em]"
                style={{ color: accent }}
              >
                {INSIGHT_LABELS[insight.category] ?? insight.category}
              </span>
              <p className="text-neutral-300 text-sm leading-relaxed mt-1">{insight.content}</p>
            </div>
          ))}
        </div>
      )}

      {/* Sources */}
      {research.sources && research.sources.length > 0 && (
        <div className="flex flex-col gap-2">
          <h3 className="text-white font-bold text-lg">Sources</h3>
          {research.sources.map((s, i) => (
            <a
              key={i}
              href={s.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-start gap-2 text-sm text-neutral-400 hover:text-neutral-200 transition-colors"
            >
              <ExternalLink className="h-3.5 w-3.5 mt-0.5 shrink-0" />
              <span>
                {s.title}
                {s.author && <span className="text-neutral-600"> — {s.author}</span>}
              </span>
            </a>
          ))}
        </div>
      )}

      {/* Escape route */}
      {research.escape_route_slug && (
        <a
          href={`/radar/${research.escape_route_slug}`}
          className="rounded-xl border border-white/10 bg-white/5 p-4 flex items-center gap-3 hover:bg-white/[0.07] transition-colors"
        >
          <span className="text-lg">🔀</span>
          <div className="flex-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500">Escape route</span>
            <p className="text-white text-sm font-medium mt-0.5">
              {research.escape_route_slug.replace(/-/g, " ").replace(/\b\w/g, l => l.toUpperCase())}
            </p>
          </div>
        </a>
      )}
    </div>
  );
}
