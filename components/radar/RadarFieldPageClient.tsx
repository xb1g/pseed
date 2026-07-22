"use client";

import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  getSavedRadarReflectionChapterKeys,
  submitRadarReflection,
  syncPendingRadarReflections,
  recordRadarFieldView,
  recordRadarMyPathIntent,
  recordRadarPathIntent,
  routeRadarCardIntent,
  syncPendingRadarMyPathEvents,
} from "@/lib/supabase/radar";
import { RadarCardView, SourceRefs } from "@/components/radar/RadarCards";
import { getCareerCardVisual } from "@/components/radar/RadarPageClient";
import {
  RadarSkillExperience,
  type RadarSkillSummary,
} from "@/components/radar/RadarSkillExperience";
import type { Database } from "@/lib/supabase/database.types";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Compass,
  Heart,
  X,
} from "lucide-react";
import {
  readRadarInterests,
  toggleRadarInterest,
} from "@/lib/my-path/radar-interest";
import { createClient } from "@/utils/supabase/client";
import { isAnonymousUser } from "@/lib/supabase/auth";

type RadarField = Database["public"]["Tables"]["radar_fields"]["Row"];
type RadarCard = Database["public"]["Tables"]["radar_cards"]["Row"];
const HIDDEN_RADAR_CARD_KINDS = new Set(["jobs", "growthCompare", "list"]);

function pickContent(card: RadarCard): Record<string, unknown> {
  const th = card.content_th as Record<string, unknown> | null;
  const en = card.content_en as Record<string, unknown> | null;
  return th ?? en ?? {};
}

function cardLabel(card: RadarCard): string {
  if (card.kind === "cta") return "Next Step";
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

function normalizedCardText(card: RadarCard): string {
  const content = pickContent(card);
  return [
    card.kind,
    content.eyebrow,
    content.title,
    content.presentation,
    content.chapterKey,
  ]
    .filter((value): value is string => typeof value === "string")
    .join(" ")
    .toLocaleLowerCase();
}

function isExploreCard(card: RadarCard): boolean {
  if (card.kind !== "text") return false;
  const content = pickContent(card);
  const presentation = String(content.presentation ?? "").toLowerCase();
  return !presentation.includes("skill") && !presentation.includes("start");
}

function isStartCard(card: RadarCard): boolean {
  if (card.kind !== "text") return false;
  const presentation = String(
    (pickContent(card).presentation as string | undefined) ?? ""
  ).toLowerCase();
  return presentation.includes("start");
}

function radarCardDisplayOrder(card: RadarCard): number {
  const text = normalizedCardText(card);

  if (card.kind === "hook") return 10;
  if (card.kind === "salaryProgression") return 20;
  if (card.kind === "aiImpact") return 30;
  if (card.kind === "marketThailand") return 40;
  if (card.kind === "careerSurvival") return 50;
  if (card.kind === "fantasyReality") return 60;
  if (card.kind === "dayInLife") return 70;
  if (card.kind === "risks") return 80;
  if (card.kind === "entryRoutes") return 90;
  if (
    text.includes("skills") ||
    text.includes("skill") ||
    text.includes("ต้องเก่งอะไร") ||
    text.includes("ทักษะ")
  ) {
    return 100;
  }
  if (
    card.kind === "cta" ||
    card.kind === "reflection" ||
    text.includes("ทางนี้ใช่เธอจริงไหม")
  ) {
    return 110;
  }
  if (card.kind === "sources") return 10000;

  return 1000;
}

function sortRadarCardsForStory(cards: RadarCard[]) {
  return cards
    .map((card, index) => ({ card, index }))
    .sort((a, b) => {
      const orderDiff = radarCardDisplayOrder(a.card) - radarCardDisplayOrder(b.card);
      if (orderDiff !== 0) return orderDiff;

      const positionDiff = (a.card.position ?? 0) - (b.card.position ?? 0);
      if (positionDiff !== 0) return positionDiff;

      return a.index - b.index;
    })
    .map(({ card }) => card);
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

/**
 * The "Start" and "Next Step" endings ship students into stock PathLabs. When
 * the plan wizard sent them here, the plan decision bar replaces both.
 */
function isPlanReplacedCta(card: RadarCard): boolean {
  if (card.kind === "cta") return true;
  return isStartCard(card);
}

export function RadarFieldPageClient({
  initialField,
  initialCards,
  fieldSources = [],
  initialSkills = [],
  fromPlan = false,
}: {
  initialField: RadarField;
  initialCards: RadarCard[];
  fieldSources?: FieldSource[];
  initialSkills?: RadarSkillSummary[];
  /**
   * Arrived from the My Path wizard. The generic "Start / Next Step" CTAs are
   * the wrong ending there — the student owes the plan a decision instead.
   */
  fromPlan?: boolean;
}) {
  const router = useRouter();
  const field = initialField;
  const fieldSlug = field.slug ?? "";
  const cards = useMemo(
    () =>
      sortRadarCardsForStory(
        initialCards.filter((card) => {
          if (HIDDEN_RADAR_CARD_KINDS.has(card.kind)) return false;
          if (isExploreCard(card)) return false;
          if (
            card.kind === "text" &&
            (card.content_th as Record<string, string>)?.title === "ทางนี้คืออะไร"
          ) {
            return false;
          }
          if (isStartCard(card)) return false;
          if (fromPlan && isPlanReplacedCta(card)) return false;
          return true;
        })
      ),
    [initialCards, fromPlan]
  );
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
  const blackoutRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);
  const isSafariRef = useRef(false);
  const [isSafari, setIsSafari] = useState(false);
  const fieldOpenRecordedRef = useRef(false);
  const touchSectionGuardRef = useRef<{
    sectionIndex: number;
    startY: number;
    direction: "up" | "down" | null;
    minScrollTop: number;
    maxScrollTop: number;
    lockUp: boolean;
    lockDown: boolean;
  } | null>(null);

  const handlePointer = useCallback((e: React.MouseEvent) => {
    if (isSafariRef.current) return;
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

  // Detect Safari via state (not a manual classList mutation) so the
  // radar-field-page--safari class survives React className rewrites —
  // e.g. when the AI Impact slide toggles radar-field-page--ai.
  useEffect(() => {
    const safari =
      navigator.vendor.includes("Apple") &&
      !/(CriOS|FxiOS|EdgiOS|OPiOS)/.test(navigator.userAgent);
    isSafariRef.current = safari;
    setIsSafari(safari);
  }, []);

  const goTo = useCallback((i: number) => {
    touchSectionGuardRef.current = null;
    sectionRefs.current[i]?.scrollIntoView({
      block: "start",
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "auto"
        : "smooth",
    });
  }, []);

  const handleDeckTouchStart = useCallback(
    (event: React.TouchEvent<HTMLDivElement>) => {
      const deck = scrollRef.current;
      if (!deck) {
        touchSectionGuardRef.current = null;
        return;
      }
      // On mobile, let the browser handle scrolling natively — no snap guard
      if (window.matchMedia("(max-width: 640px)").matches) {
        touchSectionGuardRef.current = null;
        return;
      }

      const sectionIndex = sectionRefs.current.findIndex(
        (candidate) =>
          !!candidate &&
          deck.scrollTop >= candidate.offsetTop - 2 &&
          deck.scrollTop < candidate.offsetTop + candidate.offsetHeight - 2
      );
      const activeSectionIndex = sectionIndex >= 0 ? sectionIndex : current;
      const section = sectionRefs.current[activeSectionIndex];
      if (!section) {
        touchSectionGuardRef.current = null;
        return;
      }

      const minScrollTop = section.offsetTop;
      const maxScrollTop = Math.max(
        minScrollTop,
        section.offsetTop + section.offsetHeight - deck.clientHeight
      );
      touchSectionGuardRef.current = {
        sectionIndex: activeSectionIndex,
        startY: event.touches[0]?.clientY ?? 0,
        direction: null,
        minScrollTop,
        maxScrollTop,
        lockUp: deck.scrollTop > minScrollTop + 2,
        lockDown: deck.scrollTop < maxScrollTop - 2,
      };
    },
    [current]
  );

  const handleDeckTouchMove = useCallback((event: React.TouchEvent<HTMLDivElement>) => {
    const guard = touchSectionGuardRef.current;
    if (!guard || guard.direction) return;
    const distance = guard.startY - (event.touches[0]?.clientY ?? guard.startY);
    if (Math.abs(distance) < 4) return;
    guard.direction = distance > 0 ? "down" : "up";
  }, []);

  const handleDeckScroll = useCallback(() => {
    const deck = scrollRef.current;
    const guard = touchSectionGuardRef.current;
    if (!deck || !guard?.direction) return;

    // On mobile, tall sections have scroll-snap disabled via CSS.
    // Skip JS clamping too so the browser's native inertia works smoothly.
    const section = sectionRefs.current[guard.sectionIndex];
    if (section?.classList.contains("radar-card-section--tall")) return;

    if (
      guard.direction === "down" &&
      guard.lockDown &&
      deck.scrollTop > guard.maxScrollTop
    ) {
      deck.scrollTop = guard.maxScrollTop;
    } else if (
      guard.direction === "up" &&
      guard.lockUp &&
      deck.scrollTop < guard.minScrollTop
    ) {
      deck.scrollTop = guard.minScrollTop;
    }
  }, []);

  const handleDeckTouchEnd = useCallback(() => {
    const deck = scrollRef.current;
    const guard = touchSectionGuardRef.current;
    if (!deck || !guard?.direction) return;

    const canAdvance = guard.direction === "down" && !guard.lockDown;
    const canReturn = guard.direction === "up" && !guard.lockUp;
    if (!canAdvance && !canReturn) return;

    const targetIndex = canAdvance
      ? guard.sectionIndex + 1
      : Math.max(0, guard.sectionIndex - 1);
    const target = sectionRefs.current[targetIndex];
    if (!target) return;

    const targetScrollTop = target.offsetTop;
    deck.scrollTo({ top: targetScrollTop, behavior: "auto" });
    touchSectionGuardRef.current = {
      sectionIndex: targetIndex,
      startY: 0,
      direction: guard.direction,
      minScrollTop: targetScrollTop,
      maxScrollTop: targetScrollTop,
      lockUp: true,
      lockDown: true,
    };
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
      void syncPendingRadarMyPathEvents();
    })();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setShowSignupPrompt(!session?.user || isAnonymousUser(session.user));
      void syncPendingRadarReflections().then(loadSavedReflections);
      void syncPendingRadarMyPathEvents();
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
    if (!fieldOpenRecordedRef.current) {
      fieldOpenRecordedRef.current = true;
      recordRadarMyPathIntent({ careerSlug: fieldSlug, intent: "opened" });
    }
  }, [fieldSlug, field.id]);

  useEffect(
    () => () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    },
    []
  );

  // Tag sections taller than the viewport so CSS can disable scroll-snap on them
  // This prevents Chrome mobile from snapping past tall content
  useEffect(() => {
    const deck = scrollRef.current;
    if (!deck) return;
    const markTall = () => {
      const vh = deck.clientHeight;
      sectionRefs.current.forEach((section) => {
        if (!section) return;
        section.classList.toggle(
          "radar-card-section--tall",
          section.scrollHeight > vh + 20
        );
      });
    };
    markTall();
    const ro = new ResizeObserver(markTall);
    ro.observe(deck);
    sectionRefs.current.forEach((s) => s && ro.observe(s));
    return () => ro.disconnect();
  }, [cards.length, initialSkills.length]);

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

  // Gradually fade in/out blackout overlay around AI impact section
  useEffect(() => {
    const deck = scrollRef.current;
    const blackout = blackoutRef.current;
    if (!deck || !blackout) return;
    const aiIndex = cards.findIndex((c) => c.kind === "aiImpact");
    if (aiIndex < 0) return;

    let raf = 0;
    let lastOpacity = "0";
    const update = () => {
      raf = 0;
      const section = sectionRefs.current[aiIndex];
      if (!section) return;
      const sectionTop = section.offsetTop;
      const sectionBottom = sectionTop + section.offsetHeight;
      const vh = deck.clientHeight;
      const scroll = deck.scrollTop;

      const fadeInStart = sectionTop - vh;
      const fadeInEnd = sectionTop;
      const fadeOutStart = sectionBottom - vh;
      const fadeOutEnd = sectionBottom;

      let progress: number;
      if (scroll <= fadeInStart) {
        progress = 0;
      } else if (scroll < fadeInEnd) {
        progress = (scroll - fadeInStart) / (fadeInEnd - fadeInStart);
      } else if (scroll <= fadeOutStart) {
        progress = 1;
      } else if (scroll < fadeOutEnd) {
        progress = 1 - (scroll - fadeOutStart) / (fadeOutEnd - fadeOutStart);
      } else {
        progress = 0;
      }

      // Round to 2 decimals to avoid unnecessary style writes
      const val = String(Math.round(Math.min(1, Math.max(0, progress)) * 100) / 100);
      if (val !== lastOpacity) {
        lastOpacity = val;
        blackout.style.opacity = val;
      }
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    deck.addEventListener("scroll", onScroll, { passive: true });
    update();
    return () => {
      deck.removeEventListener("scroll", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [cards]);

  const accent = readableAccent(field.color || "#3b82f6");
  const visual = getCareerCardVisual(field);
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
  // The plan decision bar owns the bottom of the screen in the wizard flow.
  const shouldShowSignupToast =
    !fromPlan &&
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
      className={`radar-field-page ${isSafari ? "radar-field-page--safari" : ""} fixed inset-0 isolate z-[100] h-[100dvh] overflow-hidden bg-neutral-950`}
      style={{
        background: visual.background,
        ...visual.dotStyle,
      }}
    >
      <div className="radar-atmosphere pointer-events-none absolute inset-0 z-0 overflow-hidden">
        <span
          className="radar-career-card__grain radar-detail-grain"
          aria-hidden="true"
        />
        <div
          className="radar-atmosphere-shade absolute inset-0 bg-[linear-gradient(180deg,rgba(3,7,18,0.58)_0%,rgba(3,7,18,0.82)_48%,rgba(3,7,18,0.94)_100%)]"
          aria-hidden="true"
        />
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
        <div ref={blackoutRef} className="radar-detail-blackout" aria-hidden="true" />
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

      {fromPlan && (
        <PlanDecisionBar
          fieldSlug={fieldSlug}
          fieldTitle={field.name_th || field.name_en || "เส้นทางนี้"}
          accent={accent}
        />
      )}

      <div
        ref={scrollRef}
        className="radar-deck relative z-10"
        style={fromPlan ? { paddingBottom: "8.5rem" } : undefined}
        onTouchStart={handleDeckTouchStart}
        onTouchMove={handleDeckTouchMove}
        onTouchEnd={handleDeckTouchEnd}
        onScroll={handleDeckScroll}
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
                  figure={visual.figure}
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
                    fieldNameTh={field.name_th ?? undefined}
                    fieldNameEn={field.name_en ?? undefined}
                    squadUrl={field.squad_url}
                    fieldSources={fieldSources}
                    reflectionSubmitted={submitted.has(card.id)}
                    showSignupPrompt={false}
                    onReflect={(payload) =>
                      handleReflect(card, chapterKey, payload)
                    }
                    onIntent={(pathSlug, buttonLabel, scope) => {
                      if (!fieldSlug || !field.id) return;
                      routeRadarCardIntent({
                        scope,
                        buttonLabel,
                        recordAnalytics() {
                          void recordRadarPathIntent({
                            fieldSlug,
                            fieldId: field.id,
                            pathSlug,
                            buttonLabel:
                              buttonLabel ||
                              (content.button as string | undefined) ||
                              undefined,
                          });
                        },
                        recordCanonical(intent) {
                          recordRadarMyPathIntent({
                            careerSlug: fieldSlug,
                            intent,
                          });
                        },
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
                className="radar-card-section in-view px-6 py-20"
              >
                <RadarViewportFit>
                  <RadarSkillExperience skills={initialSkills} accent={accent} />
                </RadarViewportFit>
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

/**
 * Sticky decision bar shown only when the student came from the plan wizard.
 * Marking interest is a toggle, not an exit — they can flag several fields and
 * keep exploring before returning to the plan.
 */
function PlanDecisionBar({
  fieldSlug,
  fieldTitle,
  accent,
}: {
  fieldSlug: string;
  fieldTitle: string;
  accent: string;
}) {
  const router = useRouter();
  const [interests, setInterests] = useState<string[]>([]);

  useEffect(() => {
    setInterests(readRadarInterests(window.localStorage));
  }, []);

  const isInterested = interests.includes(fieldSlug);

  return (
    <div className="absolute bottom-0 inset-x-0 z-30 border-t border-white/10 bg-neutral-950/85 backdrop-blur-md">
      <div className="mx-auto w-full max-w-xl px-4 py-3">
        <p className="text-center text-[11px] text-white/45">
          {isInterested
            ? `เก็บ “${fieldTitle}” เข้าแผนของคุณแล้ว — สำรวจต่อได้อีก`
            : "อ่านจบแล้วคิดว่าไง? เลือกได้หลายเส้นทาง"}
        </p>
        <div className="mt-2.5 flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setInterests(toggleRadarInterest(window.localStorage, fieldSlug));
            }}
            aria-pressed={isInterested}
            className={`inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xl border px-4 text-sm font-semibold transition-colors ${
              isInterested
                ? "border-transparent text-neutral-950"
                : "border-white/15 bg-white/5 text-white hover:bg-white/10"
            }`}
            style={isInterested ? { background: accent } : undefined}
          >
            {isInterested ? (
              <Check className="h-4 w-4" />
            ) : (
              <Heart className="h-4 w-4" />
            )}
            {isInterested ? "สนใจแล้ว" : "สนใจเส้นทางนี้"}
          </button>
          <button
            type="button"
            onClick={() => router.push("/radar?from=plan")}
            className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 text-sm font-semibold text-white transition-colors hover:bg-white/10"
          >
            <Compass className="h-4 w-4" />
            สำรวจเส้นทางอื่น
          </button>
        </div>
        {interests.length > 0 && (
          <button
            type="button"
            onClick={() => router.push("/plan")}
            className="mt-2 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl text-sm font-semibold text-white/70 transition-colors hover:bg-white/[0.06] hover:text-white"
          >
            กลับไปทำแผนต่อ ({interests.length} เส้นทาง)
            <ArrowRight className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}

function RadarViewportFit({ children }: { children: React.ReactNode }) {
  return (
    <div className="radar-viewport-fit">
      <div className="radar-viewport-fit__content">
        {children}
      </div>
    </div>
  );
}

function RadarCardSection({
  children,
  isFirst,
  hasMore,
  accent,
  figure,
  sourceRefs = [],
  fieldSources = [],
  sectionRef,
  index,
}: {
  children: React.ReactNode;
  isFirst: boolean;
  hasMore: boolean;
  accent: string;
  figure?: string;
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
      className={`radar-card-section px-6 py-20 ${
        isFirst ? "radar-card-section--first" : ""
      } ${index === 1 ? "radar-card-section--after-first" : ""}`}
    >
      {isFirst && figure && (
        <div
          className="pointer-events-none absolute inset-0 overflow-hidden"
          aria-hidden="true"
        >
          <div className="radar-detail-figure-bg">
            <Image
              src={figure}
              alt=""
              fill
              sizes="100vw"
              className="object-contain object-center"
              draggable={false}
              priority
            />
          </div>
        </div>
      )}
      <div className="radar-card-viewport relative z-10 min-h-[calc(100dvh-10rem)]">
        <RadarViewportFit>
          {children}
          {sourceRefs.length > 0 && fieldSources.length > 0 && (
            <div className="radar-section-sources mt-2 max-w-xl mx-auto w-full">
              <SourceRefs refs={sourceRefs} sources={fieldSources} />
            </div>
          )}
        </RadarViewportFit>
        {isFirst && hasMore && !hasScrolled && (
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
            <span className="text-[11px] uppercase tracking-[0.2em] text-white/30 font-medium">
              ปัดขึ้น
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
