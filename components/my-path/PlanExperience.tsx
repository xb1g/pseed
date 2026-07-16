"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowDown,
  ArrowRight,
  CheckCircle2,
  CircleAlert,
  Compass,
  LogIn,
  Sparkles,
} from "lucide-react";

import { CareerComparisonSheet } from "./CareerComparisonSheet";
import { CareerPreviewCard } from "./CareerPreviewCard";
import { ContextualQuestion } from "./ContextualQuestion";
import { DirectionSection } from "./DirectionSection";
import { PathHome, type MyPathEvidence } from "./PathHome";
import { RecommendationLanes } from "./RecommendationLanes";
import {
  applyJourneyEvent,
  createAnonymousDraft,
  getContextualQuestion,
  MAX_ACTIVE_SAVED_PATHS,
} from "@/lib/my-path/journey";
import {
  buildDirectionHypothesis,
  buildRecommendationLanes,
  selectNextStep,
} from "@/lib/my-path/recommendations";
import { planningRegistry } from "@/lib/my-path/registry";
import type { CareerPreview } from "@/lib/my-path/radar-content";
import {
  clearMyPathDraft,
  loadMyPathDraft,
  saveMyPathDraft,
} from "@/lib/my-path/storage";
import type { JourneyEvent, MyPathDraft, PlanEntry } from "@/lib/my-path/types";

interface PlanExperienceProps {
  entry: PlanEntry;
  careers: CareerPreview[];
  isSignedIn: boolean;
  initialDraft: MyPathDraft | null;
  initialEvidence?: MyPathEvidence[];
  hasPersistedPath?: boolean;
  resumeRequested: boolean;
}

const LOGIN_HREF = `/login?next=${encodeURIComponent("/plan?resume=1")}`;

function eventId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return `event-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function PlanExperience({
  entry,
  careers,
  isSignedIn,
  initialDraft,
  initialEvidence = [],
  hasPersistedPath = false,
  resumeRequested,
}: PlanExperienceProps) {
  const [draft, setDraft] = useState<MyPathDraft | null>(initialDraft);
  const [activeSlug, setActiveSlug] = useState<string | null>(null);
  const [revealedSlugs, setRevealedSlugs] = useState<string[]>(() =>
    Array.from(
      new Set([...entry.initialSlugs, ...Object.keys(initialDraft?.possibilities ?? {})])
    )
  );
  const [comparisonSlugs, setComparisonSlugs] = useState<string[]>([]);
  const [comparisonOpen, setComparisonOpen] = useState(false);
  const [removalSlug, setRemovalSlug] = useState<string | null>(null);
  const [persisted, setPersisted] = useState(hasPersistedPath);
  const [showPathHome, setShowPathHome] = useState(hasPersistedPath);
  const [importStatus, setImportStatus] = useState<
    "idle" | "saving" | "saved" | "error"
  >(hasPersistedPath ? "saved" : "idle");
  const [signInNotice, setSignInNotice] = useState(false);
  const lastSyncedAt = useRef<string | null>(initialDraft?.updatedAt ?? null);

  useEffect(() => {
    if (initialDraft) return;
    const stored = loadMyPathDraft(window.localStorage);
    const base = stored ?? createAnonymousDraft(entry.key, eventId());
    const isFirstEntry = !base.events.some((event) => event.type === "entry_viewed");
    const next = isFirstEntry
      ? applyJourneyEvent(base, {
          id: eventId(),
          type: "entry_viewed",
          occurredAt: new Date().toISOString(),
          metadata: { entry: entry.key },
        })
      : base;
    setDraft(next);
    setRevealedSlugs((current) =>
      Array.from(new Set([...current, ...Object.keys(next.possibilities)]))
    );
    if (isFirstEntry) {
      void fetch("/api/my-path/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: next.draftId,
          eventType: "reel_entry_viewed",
          metadata: { entry: entry.key },
        }),
      }).catch(() => undefined);
    }
  }, [entry.key, initialDraft]);

  useEffect(() => {
    if (!draft) return;
    saveMyPathDraft(window.localStorage, draft);
  }, [draft]);

  useEffect(() => {
    if (!draft || !persisted || draft.updatedAt === lastSyncedAt.current) return;
    const timer = window.setTimeout(async () => {
      try {
        const response = await fetch("/api/my-path", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ operation: "sync", draft }),
        });
        if (response.ok) lastSyncedAt.current = draft.updatedAt;
      } catch {
        // The local draft remains the source of continuity until a later sync.
      }
    }, 700);
    return () => window.clearTimeout(timer);
  }, [draft, persisted]);

  useEffect(() => {
    if (!activeSlug || !draft) return;
    const timer = window.setTimeout(() => {
      if (draft.possibilities[activeSlug]?.meaningfulOpen) return;
      recordEvent({ type: "career_meaningful_open", careerSlug: activeSlug });
    }, 8000);
    return () => window.clearTimeout(timer);
    // The timer intentionally restarts only when the open career changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSlug]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const item of entries) {
          if (item.isIntersecting) item.target.classList.add("in-view");
        }
      },
      { threshold: 0.35 }
    );
    const elements = document.querySelectorAll(".dawn-card, .ei-button-dawn");
    elements.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, [draft, careers.length]);

  const visibleCareers = useMemo(
    () =>
      careers.filter((career) => {
        const state = draft?.possibilities[career.slug]?.state;
        return (
          revealedSlugs.includes(career.slug) &&
          state !== "dismissed" &&
          state !== "removed"
        );
      }),
    [careers, draft, revealedSlugs]
  );
  const savedCount = draft
    ? Object.values(draft.possibilities).filter((item) => item.state === "saved")
        .length
    : 0;
  const question = draft ? getContextualQuestion(draft) : null;
  const direction = draft
    ? buildDirectionHypothesis(draft, planningRegistry)
    : null;
  const lanes = draft
    ? buildRecommendationLanes(
        draft,
        planningRegistry,
        careers.map((career) => career.slug)
      )
    : [];
  const nextStep = draft ? selectNextStep(draft, planningRegistry) : null;
  const comparisonCareers =
    comparisonSlugs.length === 2
      ? (comparisonSlugs
          .map((slug) => careers.find((career) => career.slug === slug))
          .filter(Boolean) as [CareerPreview, CareerPreview])
      : null;
  const editorialCareers = entry.comparison
    ? (entry.comparison
        .map((slug) => careers.find((career) => career.slug === slug))
        .filter(Boolean) as CareerPreview[])
    : [];

  function recordEvent(
    input: Omit<JourneyEvent, "id" | "occurredAt">,
    analyticsType?: string
  ) {
    const event: JourneyEvent = {
      ...input,
      id: eventId(),
      occurredAt: new Date().toISOString(),
    };
    setDraft((current) => (current ? applyJourneyEvent(current, event) : current));
    if (draft && analyticsType) {
      void fetch("/api/my-path/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: draft.draftId,
          eventType: analyticsType,
          careerSlug: input.careerSlug,
          metadata: { entry: draft.entryKey },
        }),
      }).catch(() => undefined);
    }
  }

  function trackAnalytics(
    analyticsType: string,
    careerSlug?: string,
    metadata: Record<string, string | number | boolean | null> = {}
  ) {
    if (!draft) return;
    void fetch("/api/my-path/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId: draft.draftId,
        eventType: analyticsType,
        careerSlug,
        metadata: { entry: draft.entryKey, ...metadata },
      }),
    }).catch(() => undefined);
  }

  function handleOpen(slug: string) {
    setRevealedSlugs((current) =>
      current.includes(slug) ? current : [...current, slug]
    );
    setActiveSlug(slug);
    recordEvent(
      { type: "career_opened", careerSlug: slug },
      "career_preview_opened"
    );
    window.setTimeout(() => {
      document.getElementById(`career-${slug}`)?.scrollIntoView({
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "auto"
          : "smooth",
        block: "center",
      });
    }, 0);
  }

  function handleSave(slug: string) {
    const saved = draft?.possibilities[slug]?.state === "saved";
    if (saved) {
      setRemovalSlug(slug);
      recordEvent({ type: "career_removed", careerSlug: slug }, "career_removed");
      return;
    }
    recordEvent({ type: "career_saved", careerSlug: slug }, "career_saved");
  }

  function handleCompare(slug: string) {
    setComparisonSlugs((current) => {
      if (current.includes(slug)) return current.filter((item) => item !== slug);
      if (current.length >= 2) return current;
      const next = [...current, slug];
      if (next.length === 2) {
        const pair = next as [string, string];
        recordEvent(
          { type: "career_compared", comparisonSlugs: pair },
          "career_compared"
        );
        window.setTimeout(() => setComparisonOpen(true), 0);
      }
      return next;
    });
  }

  function openEditorialComparison() {
    if (!entry.comparison || editorialCareers.length !== 2) return;
    setRevealedSlugs((current) =>
      Array.from(new Set([...current, ...entry.comparison!]))
    );
    setComparisonSlugs([...entry.comparison]);
    recordEvent(
      { type: "career_compared", comparisonSlugs: entry.comparison },
      "career_compared"
    );
    setComparisonOpen(true);
  }

  function saveComparisonQuestion(questionText: string, slugs: [string, string]) {
    if (!isSignedIn) {
      setComparisonOpen(false);
      setSignInNotice(true);
      return;
    }
    recordEvent(
      { type: "question_saved", comparisonSlugs: slugs, reason: questionText },
      "question_saved"
    );
    setComparisonOpen(false);
  }

  async function createPath() {
    if (!draft) return;
    setImportStatus("saving");
    try {
      const response = await fetch("/api/my-path", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ operation: persisted ? "sync" : "import", draft }),
      });
      if (!response.ok) throw new Error("save failed");
      lastSyncedAt.current = draft.updatedAt;
      setPersisted(true);
      setShowPathHome(true);
      setImportStatus("saved");
      clearMyPathDraft(window.localStorage);
      window.setTimeout(() => {
        document.getElementById("my-path-home")?.scrollIntoView({
          behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
            ? "auto"
            : "smooth",
        });
      }, 0);
    } catch {
      setImportStatus("error");
    }
  }

  function completeStep() {
    if (!nextStep) return;
    recordEvent(
      {
        type: "step_completed",
        stepId: nextStep.id,
        careerSlug: nextStep.careerSlugs[0],
      },
      "next_step_completed"
    );
  }

  if (!draft) {
    return (
      <main className="dawn-theme min-h-screen bg-slate-950 text-slate-100">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <div className="ei-skeleton h-9 max-w-2xl" />
          <div className="ei-skeleton mt-5 h-5 max-w-xl" />
        </div>
      </main>
    );
  }

  return (
    <main className="dawn-theme relative min-h-screen overflow-hidden bg-[linear-gradient(180deg,#020617_0%,#0f172a_28%,#1e1b4b_58%,#172554_82%,#0f2942_100%)] font-bai-jamjuree text-slate-100">
      <a
        href="#possibilities"
        className="fixed left-3 top-3 z-[70] -translate-y-20 rounded-lg bg-amber-100 px-3 py-2 text-sm font-semibold text-slate-950 focus:translate-y-0"
      >
        ข้ามไปดูเส้นทาง
      </a>
      <DawnAtmosphere />

      <div className="relative z-10">
        <header className="mx-auto max-w-6xl px-4 pb-14 pt-12 sm:px-6 sm:pb-20 sm:pt-20">
          <div className="max-w-4xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-indigo-200/15 bg-indigo-100/[0.06] px-3 py-1.5 text-xs font-semibold text-indigo-100/80">
              <Compass className="h-3.5 w-3.5" aria-hidden="true" /> My Path · สำรวจได้ก่อน ยังไม่ต้องสมัคร
            </div>
            <h1 className="font-kodchasan text-3xl font-semibold leading-[1.35] tracking-tight text-slate-50 sm:text-5xl sm:leading-[1.25]">
              {entry.title}
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-slate-300 sm:text-lg">
              {entry.subtitle}
            </p>
            <p className="mt-3 text-sm leading-6 text-slate-500">{entry.reassurance}</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="#possibilities" className="ei-button-dawn min-h-12 justify-center">
                <span>ลองดูเส้นทางที่เป็นไปได้</span>
                <ArrowDown className="h-4 w-4" aria-hidden="true" />
              </Link>
              <Link
                href="/radar"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-white/10 px-5 text-sm font-semibold text-slate-300 hover:bg-white/[0.05] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200"
              >
                สำรวจทั้งหมดใน Radar <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </header>

        <div className="mx-auto max-w-6xl space-y-20 px-4 pb-28 sm:px-6">
          {isSignedIn && resumeRequested && !persisted && draft.events.length > 0 && (
            <section className="rounded-2xl border border-sky-200/20 bg-sky-100/[0.06] p-5" aria-live="polite">
              <div className="flex items-start gap-3">
                <Sparkles className="mt-1 h-5 w-5 text-sky-200" aria-hidden="true" />
                <div>
                  <h2 className="font-kodchasan text-lg font-semibold text-slate-50">
                    เจอเส้นทางที่สำรวจไว้แล้ว
                  </h2>
                  <p className="mt-1 text-sm leading-6 text-slate-300">
                    ตรวจแล้วมี {savedCount} เส้นทางที่บันทึกไว้ พร้อมนำเข้า My Path โดยไม่สร้างซ้ำ
                  </p>
                  <button
                    type="button"
                    onClick={createPath}
                    disabled={importStatus === "saving"}
                    className="ei-button-dawn mt-4 min-h-12 justify-center"
                  >
                    <span>{importStatus === "saving" ? "กำลังนำเข้า…" : "ยืนยันและสร้าง My Path"}</span>
                  </button>
                </div>
              </div>
            </section>
          )}

          {editorialCareers.length === 2 && (
            <section className="border-y border-white/10 py-6" aria-label="คู่เปรียบเทียบแนะนำ">
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.13em] text-indigo-200/65">
                    เหมือนว่าอยู่สาย Tech แต่ชีวิตการทำงานต่างกัน
                  </p>
                  <p className="mt-2 font-kodchasan text-lg font-semibold text-slate-100">
                    {editorialCareers[0].titleTh} <span className="text-slate-600">vs.</span>{" "}
                    {editorialCareers[1].titleTh}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={openEditorialComparison}
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-indigo-200/20 bg-indigo-200/[0.06] px-5 text-sm font-semibold text-indigo-100 hover:bg-indigo-200/[0.1] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200"
                >
                  ดูสิ่งที่ต้องเลือกแลก <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            </section>
          )}

          <section id="possibilities" aria-labelledby="possibilities-heading" className="scroll-mt-8">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
              <div className="max-w-2xl">
                <p className="text-xs font-semibold uppercase tracking-[0.15em] text-indigo-200/70">
                  เริ่มจากความอยากรู้
                </p>
                <h2 id="possibilities-heading" className="mt-2 font-kodchasan text-2xl font-semibold text-slate-50 sm:text-3xl">
                  เปิดดูได้เลย ก่อนอธิบายว่าตัวเองเป็นคนแบบไหน
                </h2>
              </div>
              <p className="text-sm text-slate-500">บันทึกไว้สำรวจพร้อมกันได้สูงสุด 3 เส้นทาง</p>
            </div>

            <div className="mt-8 grid gap-4 md:grid-cols-2">
              {visibleCareers.map((career) => {
                const state = draft.possibilities[career.slug]?.state;
                return (
                  <div key={career.slug} id={`career-${career.slug}`}>
                    <CareerPreviewCard
                      career={career}
                      expanded={activeSlug === career.slug}
                      saved={state === "saved"}
                      selectedForComparison={comparisonSlugs.includes(career.slug)}
                      comparisonDisabled={comparisonSlugs.length >= 2}
                      saveDisabled={savedCount >= MAX_ACTIVE_SAVED_PATHS}
                      onOpen={() => handleOpen(career.slug)}
                      onSave={() => handleSave(career.slug)}
                      onDismiss={() =>
                        recordEvent(
                          { type: "career_dismissed", careerSlug: career.slug },
                          "career_dismissed"
                        )
                      }
                      onCompare={() => handleCompare(career.slug)}
                      onOpenRadar={() =>
                        recordEvent(
                          { type: "radar_profile_opened", careerSlug: career.slug },
                          "radar_profile_opened"
                        )
                      }
                    />
                  </div>
                );
              })}
            </div>

            {visibleCareers.length === 0 && (
              <div className="mt-8 border-y border-white/10 py-8 text-center">
                <p className="text-slate-300">เส้นทางชุดนี้ยังไม่ดึงดูดคุณ ซึ่งก็เป็นหลักฐานที่มีประโยชน์</p>
                <Link href="/radar" className="mt-3 inline-flex min-h-11 items-center text-sm font-semibold text-indigo-200 hover:text-indigo-100">
                  เปิด Radar เพื่อดูเส้นทางอื่น <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </div>
            )}
          </section>

          {question && (
            <ContextualQuestion
              question={question}
              onAnswer={(answerId) =>
                recordEvent(
                  { type: "question_answered", questionId: question.id, answerId },
                  "micro_question_answered"
                )
              }
              onSkip={() =>
                recordEvent(
                  { type: "question_skipped", questionId: question.id },
                  "micro_question_skipped"
                )
              }
            />
          )}

          {removalSlug && (
            <section className="border-y border-white/10 py-6">
              <h3 className="font-kodchasan text-lg font-semibold text-slate-50">
                อะไรทำให้เส้นทางนี้ไม่น่าสนใจเหมือนเดิม?
              </h3>
              <div className="mt-3 flex flex-wrap gap-2">
                {["งานจริงไม่ดึงดูด", "วิถีชีวิตไม่ใช่", "กังวลเรื่องความมั่นคง", "ยังตอบไม่ได้"].map((reason) => (
                  <button
                    key={reason}
                    type="button"
                    onClick={() => {
                      recordEvent(
                        {
                          type: "career_removed",
                          careerSlug: removalSlug,
                          reason,
                        },
                        "career_removed"
                      );
                      setRemovalSlug(null);
                    }}
                    className="min-h-11 rounded-full border border-white/10 px-3 text-sm text-slate-300 hover:bg-white/[0.05]"
                  >
                    {reason}
                  </button>
                ))}
              </div>
            </section>
          )}

          {direction && (
            <DirectionSection
              direction={direction}
              onEdit={(statement) =>
                recordEvent({ type: "direction_edited", reason: statement })
              }
              onReject={() =>
                recordEvent({ type: "direction_rejected", reason: direction.statement })
              }
            />
          )}

          <RecommendationLanes lanes={lanes} careers={careers} onOpen={handleOpen} />

          {signInNotice && (
            <section className="rounded-2xl border border-amber-200/15 bg-amber-100/[0.05] p-5" role="status">
              <div className="flex items-start gap-3">
                <LogIn className="mt-1 h-5 w-5 text-amber-100" aria-hidden="true" />
                <div>
                  <p className="font-semibold text-slate-100">บันทึกคำถามนี้ต่อได้หลังเข้าสู่ระบบ</p>
                  <p className="mt-1 text-sm text-slate-400">สิ่งที่สำรวจไว้ในเครื่องนี้จะกลับมาครบหลังเข้าสู่ระบบ</p>
                  <Link href={LOGIN_HREF} className="mt-3 inline-flex min-h-11 items-center font-semibold text-amber-100 hover:text-amber-50">
                    เข้าสู่ระบบและกลับมาที่ My Path <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </div>
              </div>
            </section>
          )}

          {savedCount > 0 && !showPathHome && (
            <section className="text-center">
              <p className="mx-auto max-w-xl text-sm leading-6 text-slate-400">
                คุณมีสัญญาณมากพอสำหรับหนึ่งก้าวต่อไปแล้ว ยังแก้หรือเปลี่ยนเส้นทางได้เสมอ
              </p>
              {!isSignedIn ? (
                <Link href={LOGIN_HREF} className="ei-button-dawn mt-5 min-h-12 justify-center" aria-label="สร้าง My Path ของฉัน">
                  <span>สร้าง My Path ของฉัน</span>
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={createPath}
                  disabled={importStatus === "saving"}
                  className="ei-button-dawn mt-5 min-h-12 justify-center"
                >
                  <span>{importStatus === "saving" ? "กำลังสร้าง…" : "สร้าง My Path ของฉัน"}</span>
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </button>
              )}
              {importStatus === "error" && (
                <p className="mt-3 inline-flex items-center gap-2 text-sm text-rose-200" role="alert">
                  <CircleAlert className="h-4 w-4" /> ยังบันทึกไม่ได้ ลองอีกครั้งโดยที่ข้อมูลในเครื่องยังอยู่ครบ
                </p>
              )}
            </section>
          )}

          {showPathHome && direction && nextStep && (
            <>
              {importStatus === "saved" && resumeRequested && (
                <p className="flex items-center justify-center gap-2 text-sm text-emerald-200" role="status">
                  <CheckCircle2 className="h-4 w-4" aria-hidden="true" /> นำเส้นทางเดิมเข้า My Path แล้ว
                </p>
              )}
              <PathHome
                draft={draft}
                careers={careers}
                direction={direction}
                nextStep={nextStep}
                evidence={initialEvidence}
                returning={hasPersistedPath}
                onStartStep={() => {
                  recordEvent(
                    {
                      type: "step_started",
                      stepId: nextStep.id,
                      careerSlug: nextStep.careerSlugs[0],
                    },
                    "next_step_started"
                  );
                  if (nextStep.kind === "pathlab") {
                    trackAnalytics(
                      "pathlab_handoff_clicked",
                      nextStep.careerSlugs[0]
                    );
                  }
                }}
                onCompleteStep={completeStep}
                onReplaceStep={() =>
                  recordEvent({ type: "step_not_useful", stepId: nextStep.id, reason: "replace" })
                }
                onStepNotUseful={() =>
                  recordEvent({ type: "step_not_useful", stepId: nextStep.id, reason: "not-useful" })
                }
              />
            </>
          )}
        </div>
      </div>

      <CareerComparisonSheet
        careers={comparisonCareers}
        open={comparisonOpen}
        onOpenChange={setComparisonOpen}
        onSaveQuestion={saveComparisonQuestion}
      />
    </main>
  );
}

function DawnAtmosphere() {
  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden="true">
      <div className="absolute -left-32 top-24 h-[32rem] w-[32rem] rounded-full bg-blue-500/10 blur-[110px]" />
      <div className="absolute -right-36 top-[28rem] h-[30rem] w-[30rem] rounded-full bg-violet-400/10 blur-[120px]" />
      <div className="absolute inset-x-0 top-[34rem] h-[26rem] bg-[radial-gradient(ellipse_at_center,rgba(254,217,92,0.10),transparent_66%)]" />
      <div className="absolute inset-0 opacity-[0.055] [background-image:radial-gradient(circle,rgba(226,232,240,0.85)_1px,transparent_1px)] [background-size:26px_26px]" />
    </div>
  );
}
