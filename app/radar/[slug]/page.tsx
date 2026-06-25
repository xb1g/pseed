"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  getRadarField,
  getRadarCards,
  submitRadarReflection,
} from "@/lib/supabase/radar";
import { RadarCardView } from "@/components/radar/RadarCards";
import { CareerResearchView, type CareerResearch } from "@/components/radar/CareerResearchView";
import type { Database } from "@/lib/supabase/database.types";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ChevronDown } from "lucide-react";

type RadarField = Database["public"]["Tables"]["radar_fields"]["Row"];
type RadarCard = Database["public"]["Tables"]["radar_cards"]["Row"];

function pickContent(card: RadarCard): Record<string, unknown> {
  const th = card.content_th as Record<string, unknown> | null;
  const en = card.content_en as Record<string, unknown> | null;
  return th ?? en ?? {};
}

// Short human label for a card, used by the top-bar hover tooltips + current chapter readout.
function cardLabel(card: RadarCard): string {
  const c = pickContent(card);
  return (
    (c.eyebrow as string) ||
    (c.title as string) ||
    (typeof c.level === "string" ? (c.level as string) : "") ||
    card.kind
  );
}

// Field `color` is a dark brand/tile color (e.g. #0F172A). On a dark carousel it
// is unreadable as foreground, so lighten it to a guaranteed-legible accent.
function readableAccent(hex: string, fallback = "#60a5fa"): string {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return fallback;
  const n = parseInt(m[1], 16);
  let r = (n >> 16) / 255;
  let g = ((n >> 8) & 0xff) / 255;
  let b = (n & 0xff) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  const l = (max + min) / 2;
  const d = max - min;
  let s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
  if (d !== 0) {
    if (max === r) h = ((g - b) / d) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60;
    if (h < 0) h += 360;
  }
  // force a bright, vivid accent regardless of source darkness
  const L = 0.68;
  s = Math.max(s, 0.55);
  const c = (1 - Math.abs(2 * L - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const mm = L - c / 2;
  const seg = [
    [c, x, 0], [x, c, 0], [0, c, x], [0, x, c], [x, 0, c], [c, 0, x],
  ][Math.floor(h / 60) % 6];
  r = Math.round((seg[0] + mm) * 255);
  g = Math.round((seg[1] + mm) * 255);
  b = Math.round((seg[2] + mm) * 255);
  return `#${[r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("")}`;
}

export default function RadarFieldPage() {
  const params = useParams<{ slug: string }>();
  const slug = params?.slug;
  const router = useRouter();

  const [field, setField] = useState<RadarField | null>(null);
  const [cards, setCards] = useState<RadarCard[]>([]);
  const [research, setResearch] = useState<CareerResearch | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [current, setCurrent] = useState(0);
  const [submitted, setSubmitted] = useState<Set<string>>(new Set());

  const scrollRef = useRef<HTMLDivElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const followRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);

  // Pointer-follow glow (desktop only). rAF-throttled so mousemove never thrashes.
  const handlePointer = useCallback((e: React.MouseEvent) => {
    const root = rootRef.current;
    const glow = followRef.current;
    if (!root || !glow) return;
    const { left, top, width, height } = root.getBoundingClientRect();
    const x = e.clientX - left;
    const y = e.clientY - top;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      glow.style.transform = `translate(${x - width / 2}px, ${y - height / 2}px)`;
    });
  }, []);

  // jump straight to a card (top-bar segment click)
  const goTo = useCallback((i: number) => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ top: i * el.clientHeight, behavior: "smooth" });
  }, []);

  useEffect(() => {
    if (!slug) return;
    let active = true;
    (async () => {
      try {
        setIsLoading(true);
        setError(null);
        const f = await getRadarField(slug);
        if (!f) {
          if (active) setError("Field not found");
          return;
        }
        const cs = await getRadarCards(f.id);
        if (!active) return;
        setField(f);
        setCards(cs);
        setResearch((f.research as CareerResearch) ?? null);
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : "Failed to load");
      } finally {
        if (active) setIsLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [slug]);

  useEffect(() => () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
  }, []);

  // track which card is in view (scroll-snap sections)
  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const idx = Math.round(el.scrollTop / el.clientHeight);
    setCurrent((prev) => (prev === idx ? prev : idx));
  }, []);

  const accent = readableAccent(field?.color || "#3b82f6");
  const progressItems = [
    ...cards.map((card, i) => ({
      key: card.id,
      label: cardLabel(card),
      scrollIndex: i,
    })),
    ...(research
      ? [{
          key: "research",
          label: "Research brief",
          scrollIndex: cards.length,
        }]
      : []),
  ];
  const totalSlides = Math.max(progressItems.length, 1);
  const displayCurrent = Math.min(current + 1, totalSlides);
  const currentLabel =
    current < cards.length
      ? cardLabel(cards[current])
      : research
        ? "Research brief"
        : null;

  const handleReflect = useCallback(
    async (
      card: RadarCard,
      chapterKey: string,
      payload: { rating?: number; tags?: string[]; text?: string }
    ) => {
      if (!field?.slug) return;
      await submitRadarReflection({
        fieldSlug: field.slug,
        chapterKey,
        wantToTry: payload.rating ?? 0,
        tags: payload.tags,
        responseText: payload.text,
      });
      setSubmitted((prev) => new Set(prev).add(card.id));
      // Auto-advance to the next card so the "Continue" button behaves
      // like a real next step instead of leaving the user stranded on a
      // "Saved — keep going" screen. Small delay lets the saved state render
      // first so the user sees confirmation before the snap transition.
      const idx = cards.findIndex((c) => c.id === card.id);
      const nextIdx = idx + 1;
      if (nextIdx < cards.length) {
        setTimeout(() => {
          const el = scrollRef.current;
          if (!el) return;
          el.scrollTo({ top: nextIdx * el.clientHeight, behavior: "smooth" });
        }, 400);
      }
    },
    [field, cards]
  );

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-[100] bg-neutral-950 flex items-center justify-center">
        <div className="h-10 w-10 rounded-full border-2 border-white/20 border-t-white/80 animate-spin" />
      </div>
    );
  }

  if (error || !field) {
    return (
      <div className="fixed inset-0 z-[100] bg-neutral-950 flex flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="text-neutral-400">{error ?? "Something went wrong"}</p>
        <Button
          variant="outline"
          onClick={() => router.push("/radar")}
          className="border-white/10 text-white hover:bg-white/10"
        >
          Back to Radar
        </Button>
      </div>
    );
  }

  return (
    <div
      ref={rootRef}
      onMouseMove={handlePointer}
      className="fixed inset-0 z-[100] h-[100dvh] overflow-hidden bg-neutral-950"
    >
      {/* ambient field-colored glows — layered, drifting, pointer-reactive */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {/* primary top glow — drifts + brightens as you progress through cards */}
        <div
          className="radar-glow-a absolute top-0 left-1/2 w-[720px] h-[420px] rounded-full blur-[140px]"
          style={{
            background: accent,
            filter: `blur(140px) saturate(${1 + Math.min(current, 12) * 0.06})`,
          }}
        />
        {/* secondary drifting blobs */}
        <div
          className="radar-glow-b absolute bottom-[-10%] left-[-5%] w-[480px] h-[480px] rounded-full blur-[150px]"
          style={{ background: accent }}
        />
        <div
          className="radar-glow-c absolute top-[35%] right-[-8%] w-[420px] h-[420px] rounded-full blur-[150px]"
          style={{ background: accent }}
        />
        {/* pointer-follow glow (desktop) — centered, translated toward cursor via rAF */}
        <div
          ref={followRef}
          className="radar-glow-follow absolute top-1/2 left-1/2 -ml-[200px] -mt-[200px] w-[400px] h-[400px] rounded-full blur-[120px] opacity-[0.14]"
          style={{ background: accent }}
        />
      </div>

      {/* top bar: back + interactive progress + current-chapter readout */}
      <div className="absolute top-0 inset-x-0 z-30 px-4 pt-4">
        <div className="flex items-center gap-3 max-w-xl mx-auto">
          <button
            onClick={() => router.push("/radar")}
            className="shrink-0 rounded-full border border-white/10 bg-white/5 p-2 text-white/80 hover:bg-white/10 transition-colors"
            aria-label="Back to Radar"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          {/* progress segments — each hoverable (reveals chapter) + clickable (jumps) */}
          <div className="flex-1 flex gap-1">
            {progressItems.map((item, i) => (
              <button
                key={item.key}
                onClick={() => goTo(item.scrollIndex)}
                aria-label={`Go to: ${item.label}`}
                className="group relative h-3 flex-1 flex items-center"
              >
                <span
                  className="h-1 w-full rounded-full transition-all duration-300 group-hover:h-1.5"
                  style={{
                    background: i <= current ? accent : "rgba(255,255,255,0.12)",
                    boxShadow: i === current ? `0 0 8px ${accent}` : "none",
                  }}
                />
                {/* hover tooltip */}
                <span
                  className="pointer-events-none absolute left-1/2 -translate-x-1/2 top-full mt-2 whitespace-nowrap rounded-md border border-white/10 bg-neutral-900/95 px-2 py-1 text-[11px] text-white/90 opacity-0 translate-y-1 transition-all duration-150 group-hover:opacity-100 group-hover:translate-y-0 z-40 shadow-lg"
                >
                  <span className="text-white/40 tabular-nums mr-1.5">{i + 1}</span>
                  {item.label}
                </span>
              </button>
            ))}
          </div>
          <span className="shrink-0 text-xs tabular-nums text-white/40">
            {displayCurrent}/{totalSlides}
          </span>
          <span className="shrink-0 text-lg">{field.emoji}</span>
        </div>
        {/* always-on current-chapter readout */}
        {currentLabel && (
          <p
            key={currentLabel}
            className="max-w-xl mx-auto mt-2 text-[11px] font-medium uppercase tracking-[0.18em] truncate animate-[radar-fade_0.4s_ease]"
            style={{ color: accent }}
          >
            {currentLabel}
          </p>
        )}
      </div>

      {/* scroll-snap carousel (cards) + research fallback */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="h-full overflow-y-auto snap-y snap-mandatory scrollbar-hide scroll-smooth"
      >
        {cards.length > 0 ? (
          <>
            {cards.map((card, i) => {
              const content = pickContent(card);
              const chapterKey = (content.chapterKey as string) || card.id;
              return (
                <section
                  key={card.id}
                  className="snap-start h-[100dvh] flex items-center justify-center px-6 py-20"
                >
                  <RadarCardView
                    kind={card.kind}
                    content={content}
                    accent={accent}
                    squadUrl={field.squad_url}
                    reflectionSubmitted={submitted.has(card.id)}
                    onReflect={(payload) => handleReflect(card, chapterKey, payload)}
                  />
                  {i === 0 && cards.length > 1 && (
                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white/40 animate-bounce">
                      <ChevronDown className="h-6 w-6" />
                    </div>
                  )}
                </section>
              );
            })}
            {/* Research data after cards */}
            {research && (
              <section className="snap-start min-h-[100dvh] flex items-start justify-center px-6 py-20">
                <CareerResearchView research={research} accent={accent} />
              </section>
            )}
          </>
        ) : research ? (
          /* No cards — show research data as the main content */
          <section className="snap-start min-h-[100dvh] flex items-start justify-center px-6 py-20 overflow-y-auto">
            <CareerResearchView research={research} accent={accent} />
          </section>
        ) : (
          <section className="snap-start h-[100dvh] flex items-center justify-center px-6 text-center">
            <p className="text-neutral-400">No content yet for this field.</p>
          </section>
        )}
      </div>
    </div>
  );
}
