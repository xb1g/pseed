"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  getSavedRadarReflectionChapterKeys,
  submitRadarReflection,
  syncPendingRadarReflections,
  recordRadarFieldView,
  recordRadarPathIntent,
} from "@/lib/supabase/radar";
import { RadarCardView, SourceRefs } from "@/components/radar/RadarCards";
import {
  RadarSkillExperience,
  type RadarSkillSummary,
} from "@/components/radar/RadarSkillExperience";
import type { Database } from "@/lib/supabase/database.types";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, X } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { isAnonymousUser } from "@/lib/supabase/auth";

type RadarField = Database["public"]["Tables"]["radar_fields"]["Row"];
type RadarCard = Database["public"]["Tables"]["radar_cards"]["Row"];

function pickContent(card: RadarCard): Record<string, unknown> {
  const th = card.content_th as Record<string, unknown> | null;
  const en = card.content_en as Record<string, unknown> | null;
  return th ?? en ?? {};
}

function cardLabel(card: RadarCard): string {
  const c = pickContent(card);
  return (
    (c.eyebrow as string) ||
    (c.title as string) ||
    (typeof c.level === "string" ? (c.level as string) : "") ||
    card.kind
  );
}

function cardChapterKey(card: RadarCard): string {
  const content = pickContent(card);
  return (content.chapterKey as string) || card.id;
}

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
  const lightness = 0.68;
  s = Math.max(s, 0.55);
  const c = (1 - Math.abs(2 * lightness - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const mm = lightness - c / 2;
  const seg = [
    [c, x, 0],
    [x, c, 0],
    [0, c, x],
    [0, x, c],
    [x, 0, c],
    [c, 0, x],
  ][Math.floor(h / 60) % 6];
  r = Math.round((seg[0] + mm) * 255);
  g = Math.round((seg[1] + mm) * 255);
  b = Math.round((seg[2] + mm) * 255);
  return `#${[r, g, b]
    .map((v) => v.toString(16).padStart(2, "0"))
    .join("")}`;
}

export type FieldSource = { ref: number; title: string; publisher?: string | null; url: string };

export function RadarFieldPageClient({
  initialField,
  initialCards,
  fieldSources = [],
  initialSkills = [],
}: {
  initialField: RadarField;
  initialCards: RadarCard[];
  fieldSources?: FieldSource[];
  initialSkills?: RadarSkillSummary[];
}) {
  const router = useRouter();
  const field = initialField;
  const fieldSlug = field.slug ?? "";
  const HIDDEN_KINDS = new Set(["jobs", "growthCompare", "list", "reflection"]);
  const cards = initialCards.filter((c) => {
    if (HIDDEN_KINDS.has(c.kind)) return false;
    if (c.kind === "text" && (c.content_th as Record<string, string>)?.title === "ทางนี้คืออะไร") return false;
    return true;
  });
  const [current, setCurrent] = useState(0);
  const [submitted, setSubmitted] = useState<Set<string>>(new Set());
  const [showSignupPrompt, setShowSignupPrompt] = useState(true);
  const [hasGuestReflection, setHasGuestReflection] = useState(false);
  const [signupToastVisible, setSignupToastVisible] = useState(false);
  const [signupToastDismissed, setSignupToastDismissed] = useState(false);
  const [finalToastDismissed, setFinalToastDismissed] = useState(false);
  const [hasShownFirstToast, setHasShownFirstToast] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const sectionRefs = useRef<Array<HTMLElement | null>>([]);
  const rootRef = useRef<HTMLDivElement>(null);
  const followRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);

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

  const goTo = useCallback((i: number) => {
    sectionRefs.current[i]?.scrollIntoView({
      block: "start",
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "auto"
        : "smooth",
    });
  }, []);

  useEffect(() => {
    let active = true;
    const supabase = createClient();

    const loadSavedReflections = async () => {
      const savedChapterKeys = await getSavedRadarReflectionChapterKeys(fieldSlug);
      if (!active || savedChapterKeys.size === 0) return;

      const savedCardIds = cards
        .filter((card) => savedChapterKeys.has(cardChapterKey(card)))
        .map((card) => card.id);
      setSubmitted((prev) => new Set([...prev, ...savedCardIds]));
      setHasGuestReflection(true);
      setHasShownFirstToast(true);
    };

    void loadSavedReflections();

    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!active) return;
      setShowSignupPrompt(!user || isAnonymousUser(user));
      void syncPendingRadarReflections().then(loadSavedReflections);
    })();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setShowSignupPrompt(!session?.user || isAnonymousUser(session.user));
      void syncPendingRadarReflections().then(loadSavedReflections);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [fieldSlug, field.id, cards]);

  // Record a field view once per field mount (not when cards/auth state churn).
  useEffect(() => {
    if (!fieldSlug || !field.id) return;
    void recordRadarFieldView(fieldSlug, field.id);
  }, [fieldSlug, field.id]);

  useEffect(
    () => () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    },
    []
  );

  useEffect(() => {
    const root = scrollRef.current;
    if (!root) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (!visible) return;
        const index = Number((visible.target as HTMLElement).dataset.radarIndex);
        if (Number.isInteger(index)) setCurrent(index);
      },
      { root, threshold: [0.25, 0.5, 0.75] }
    );
    sectionRefs.current.forEach((section) => section && observer.observe(section));
    return () => observer.disconnect();
  }, [cards.length, initialSkills.length]);

  const accent = readableAccent(field.color || "#3b82f6");
  const progressItems = [
    ...cards.map((card, i) => ({
      key: card.id,
      label: cardLabel(card),
      scrollIndex: i,
    })),
    ...(initialSkills.length > 0
      ? [{ key: "skills", label: "ทักษะและการเริ่มลงมือ", scrollIndex: cards.length }]
      : []),
  ];
  const totalSlides = Math.max(progressItems.length, 1);
  const displayCurrent = Math.min(current + 1, totalSlides);
  const keepRadarHref = `/radar/keep?next=${encodeURIComponent(`/radar/${fieldSlug}`)}`;
  const isFinalSlide = current >= totalSlides - 1;
  const shouldShowSignupToast =
    showSignupPrompt &&
    hasGuestReflection &&
    signupToastVisible &&
    !signupToastDismissed;

  const handleReflect = useCallback(
    async (
      card: RadarCard,
      chapterKey: string,
      payload: { rating?: number; tags?: string[]; text?: string }
    ) => {
      await submitRadarReflection({
        fieldSlug,
        chapterKey,
        wantToTry: payload.rating ?? null,
        tags: payload.tags,
        responseText: payload.text,
      });
      setSubmitted((prev) => new Set(prev).add(card.id));
      if (showSignupPrompt) {
        setHasGuestReflection(true);
        if (!hasShownFirstToast) {
          setSignupToastVisible(true);
          setHasShownFirstToast(true);
          setSignupToastDismissed(false);
        }
      }
      const idx = cards.findIndex((c) => c.id === card.id);
      const nextIdx = idx + 1;
      const slideCount = cards.length;
      if (nextIdx < slideCount) {
        setTimeout(() => {
          goTo(nextIdx);
        }, 400);
      }
    },
    [fieldSlug, cards, showSignupPrompt, hasShownFirstToast, goTo]
  );

  useEffect(() => {
    if (!signupToastVisible || !hasShownFirstToast || isFinalSlide) return;

    const timer = window.setTimeout(() => {
      setSignupToastVisible(false);
    }, 6500);

    return () => window.clearTimeout(timer);
  }, [signupToastVisible, hasShownFirstToast, isFinalSlide]);

  useEffect(() => {
    if (
      !showSignupPrompt ||
      !hasGuestReflection ||
      !isFinalSlide ||
      finalToastDismissed
    ) {
      return;
    }

    setSignupToastDismissed(false);
    setSignupToastVisible(true);
  }, [showSignupPrompt, hasGuestReflection, isFinalSlide, finalToastDismissed]);

  const dismissSignupToast = useCallback(() => {
    setSignupToastVisible(false);
    setSignupToastDismissed(true);
    if (isFinalSlide) {
      setFinalToastDismissed(true);
    }
  }, [isFinalSlide]);

  return (
    <div
      ref={rootRef}
      onMouseMove={handlePointer}
      className="fixed inset-0 z-[100] h-[100dvh] overflow-hidden bg-neutral-950"
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="radar-glow-a absolute top-0 left-1/2 w-[720px] h-[420px] rounded-full blur-[140px]"
          style={{
            background: accent,
            filter: `blur(140px) saturate(${1 + Math.min(current, 12) * 0.06})`,
          }}
        />
        <div
          className="radar-glow-b absolute bottom-[-10%] left-[-5%] w-[480px] h-[480px] rounded-full blur-[150px]"
          style={{ background: accent }}
        />
        <div
          className="radar-glow-c absolute top-[35%] right-[-8%] w-[420px] h-[420px] rounded-full blur-[150px]"
          style={{ background: accent }}
        />
        <div
          ref={followRef}
          className="radar-glow-follow absolute top-1/2 left-1/2 -ml-[200px] -mt-[200px] w-[400px] h-[400px] rounded-full blur-[120px] opacity-[0.14]"
          style={{ background: accent }}
        />
      </div>

      <div className="absolute top-0 inset-x-0 z-30 px-4 pt-4">
        <div className="flex items-center gap-3 max-w-xl mx-auto">
          <button
            onClick={() => router.push("/radar")}
            className="shrink-0 rounded-full border border-white/10 bg-white/5 p-2 text-white/80 hover:bg-white/10 transition-colors"
            aria-label="Back to Radar"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div className="flex-1 flex gap-1">
            {progressItems.map((item, i) => (
              <button
                key={item.key}
                onClick={() => goTo(item.scrollIndex)}
                aria-label={`Go to: ${item.label}`}
                aria-current={i === current ? "step" : undefined}
                className="group relative min-h-12 flex-1 flex items-center"
              >
                <span
                  className={`h-1 w-full rounded-full transition-all duration-300 group-hover:h-1.5 ${
                    i === current ? "radar-dot-active" : ""
                  }`}
                  style={{
                    background: i <= current ? accent : "rgba(255,255,255,0.12)",
                    ["--dot-color" as string]: accent,
                  }}
                />
                <span className="pointer-events-none absolute left-1/2 -translate-x-1/2 top-full mt-2 whitespace-nowrap rounded-md border border-white/10 bg-neutral-900/95 px-2 py-1 text-[11px] text-white/90 opacity-0 translate-y-1 transition-all duration-150 group-hover:opacity-100 group-hover:translate-y-0 z-40 shadow-lg">
                  <span className="text-white/40 tabular-nums mr-1.5">
                    {i + 1}
                  </span>
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
      </div>

      {shouldShowSignupToast && (
        <div className="absolute bottom-5 left-1/2 z-30 w-[calc(100%-2rem)] max-w-xl -translate-x-1/2">
          <div className="relative flex flex-col gap-3 rounded-xl border border-white/10 bg-neutral-950/85 p-4 pr-12 shadow-2xl backdrop-blur md:flex-row md:items-center md:justify-between">
            <button
              onClick={dismissSignupToast}
              className="absolute right-3 top-3 rounded-full p-1 text-white/50 transition-colors hover:bg-white/10 hover:text-white"
              aria-label="Hide signup prompt"
            >
              <X className="h-4 w-4" />
            </button>
            <div>
              <p className="text-sm font-semibold text-white">
                Keep your Career Radar
              </p>
              <p className="mt-1 text-xs leading-relaxed text-neutral-400">
                {isFinalSlide
                  ? "You reached the end. Save this radar so it can turn into next steps."
                  : "Saved here. Create an account later if you want this to follow you."}
              </p>
            </div>
            <Button
              asChild
              className="shrink-0 font-semibold text-white"
              style={{ background: accent }}
            >
              <a href={keepRadarHref}>
                See why <ArrowRight className="ml-1 h-4 w-4" />
              </a>
            </Button>
          </div>
        </div>
      )}

      <div
        ref={scrollRef}
        className="radar-deck"
      >
        {cards.length > 0 ? (
          <>
            {cards.map((card, i) => {
              const content = pickContent(card);
              const chapterKey = cardChapterKey(card);
              const sourceRefs = (content.source_refs as number[] | undefined) ?? [];
              return (
                <RadarCardSection
                  key={card.id}
                  isFirst={i === 0}
                  hasMore={cards.length > 1}
                  accent={accent}
                  sourceRefs={sourceRefs}
                  fieldSources={fieldSources}
                  sectionRef={(element) => {
                    sectionRefs.current[i] = element;
                  }}
                  index={i}
                >
                  <RadarCardView
                    kind={card.kind}
                    content={content}
                    accent={accent}
                    squadUrl={field.squad_url}
                    fieldSources={fieldSources}
                    reflectionSubmitted={submitted.has(card.id)}
                    showSignupPrompt={false}
                    onReflect={(payload) =>
                      handleReflect(card, chapterKey, payload)
                    }
                    onIntent={(pathSlug) => {
                      if (!fieldSlug || !field.id) return;
                      void recordRadarPathIntent({
                        fieldSlug,
                        fieldId: field.id,
                        pathSlug,
                        buttonLabel:
                          (content.button as string | undefined) || undefined,
                      });
                    }}
                  />
                </RadarCardSection>
              );
            })}
            {initialSkills.length > 0 && (
              <section
                ref={(element) => {
                  sectionRefs.current[cards.length] = element;
                }}
                data-radar-index={cards.length}
                className="radar-card-section in-view px-6 py-24"
              >
                <RadarSkillExperience skills={initialSkills} accent={accent} />
              </section>
            )}
          </>
        ) : (
          <section data-radar-index={0} className="radar-card-section px-6 py-20">
            <div className="min-h-[calc(100dvh-10rem)] flex flex-col">
              <div className="my-auto text-center">
                <p className="text-neutral-400">No content yet for this field.</p>
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

function RadarCardSection({
  children,
  isFirst,
  hasMore,
  accent,
  sourceRefs = [],
  fieldSources = [],
  sectionRef,
  index,
}: {
  children: React.ReactNode;
  isFirst: boolean;
  hasMore: boolean;
  accent: string;
  sourceRefs?: number[];
  fieldSources?: FieldSource[];
  sectionRef: (element: HTMLElement | null) => void;
  index: number;
}) {
  const ref = useRef<HTMLElement>(null);
  const [hasScrolled, setHasScrolled] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // First card starts visible
    if (isFirst) {
      el.classList.add("in-view");
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add("in-view");
          observer.unobserve(el);
        }
      },
      { threshold: 0.3 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [isFirst]);

  // Hide scroll cue after first scroll
  useEffect(() => {
    if (!isFirst || !hasMore) return;
    const handler = () => {
      setHasScrolled(true);
      window.removeEventListener("scroll", handler, true);
    };
    window.addEventListener("scroll", handler, true);
    return () => window.removeEventListener("scroll", handler, true);
  }, [isFirst, hasMore]);

  return (
    <section
      ref={(element) => {
        ref.current = element;
        sectionRef(element);
      }}
      data-radar-index={index}
      className="radar-card-section px-6 py-20"
    >
      <div className="min-h-[calc(100dvh-10rem)] flex flex-col">
        <div className="my-auto">
          {children}
        </div>
        {sourceRefs.length > 0 && fieldSources.length > 0 && (
          <div className="shrink-0 pb-2 max-w-xl mx-auto w-full">
            <SourceRefs refs={sourceRefs} sources={fieldSources} />
          </div>
        )}
        {isFirst && hasMore && !hasScrolled && (
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
            <span className="text-[11px] uppercase tracking-[0.2em] text-white/30 font-medium">
              เลื่อนขึ้น
            </span>
            <div
              className="radar-scroll-cue"
              style={{ color: accent }}
            />
          </div>
        )}
      </div>
    </section>
  );
}
