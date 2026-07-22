"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";

import { StepGoal } from "./StepGoal";
import { StepHook } from "./StepHook";
import { StepInterests } from "./StepInterests";
import { StepMission } from "./StepMission";
import { PayLaterSheet } from "./PayLaterSheet";
import { WizardProgress } from "./WizardProgress";
import type { TrialShareInfo } from "@/components/trials/TrialShareActions";
import {
  applyJourneyEvent,
  createAnonymousDraft,
  getGoalTimeline,
  getLockedGoal,
  getSavedPossibilities,
  GOAL_TIMELINE_QUESTION_ID,
  LOCKED_GOAL_QUESTION_ID,
  MAX_ACTIVE_SAVED_PATHS,
} from "@/lib/my-path/journey";
import { buildMissionPlan, type MissionGoal } from "@/lib/my-path/mission-plan";
import {
  matchSeedsToInterests,
  type SeedPathlab,
} from "@/lib/my-path/pathlab-match";
import type { CareerPreview } from "@/lib/my-path/radar-content";
import { planningRegistry } from "@/lib/my-path/registry";
import {
  clearRadarInterests,
  readRadarInterests,
} from "@/lib/my-path/radar-interest";
import {
  clearMyPathDraft,
  loadMyPathDraft,
  saveMyPathDraft,
} from "@/lib/my-path/storage";
import type { JourneyEvent, MyPathDraft } from "@/lib/my-path/types";

interface PlanWizardProps {
  careers: CareerPreview[];
  /** Unused while the PathLab pick step is hidden — kept for its return. */
  seeds?: SeedPathlab[];
  isSignedIn: boolean;
  initialDraft: MyPathDraft | null;
  hasPersistedPath?: boolean;
}

const LOGIN_HREF = `/login?next=${encodeURIComponent("/plan?resume=1")}`;
// เริ่ม · จุดไฟ · เป้าหมาย · แผน — the PathLab pick step is hidden for now
// because the path is customised in the consultation instead.
const TOTAL_STEPS = 4;
const WIZARD_STEP_STORAGE_KEY = "passionseed_my_path_wizard_step_v1";

interface PayLaterSheetState {
  status: "loading" | "error" | "ready" | "pending" | "paid" | "recovery";
  trial: TrialShareInfo | null;
  enrollmentUrl: string | null;
}
function eventId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID)
    return crypto.randomUUID();
  return `event-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function PlanWizard({
  careers,
  seeds = [],
  isSignedIn,
  initialDraft,
  hasPersistedPath = false,
}: PlanWizardProps) {
  const [draft, setDraft] = useState<MyPathDraft | null>(initialDraft);
  const [step, setStep] = useState(0);
  const [persisted, setPersisted] = useState(hasPersistedPath);
  const [importStatus, setImportStatus] = useState<
    "idle" | "saving" | "saved" | "error"
  >(hasPersistedPath ? "saved" : "idle");
  const [saveError, setSaveError] = useState<
    "auth" | "unavailable" | "generic" | null
  >(null);
  const [payLaterSheet, setPayLaterSheet] =
    useState<PayLaterSheetState | null>(null);
  const lastSyncedAt = useRef<string | null>(initialDraft?.updatedAt ?? null);
  const missionTracked = useRef(false);
  const stepRestored = useRef(false);
  const launchGeneration = useRef(0);
  const launchInFlight = useRef(false);
  const radarInterestsDrained = useRef(false);

  // Restore the furthest step reached so an accidental exit (swipe-back,
  // app switch, tab close) resumes exactly where the student left off.
  useEffect(() => {
    if (!draft || stepRestored.current) return;
    stepRestored.current = true;
    const saved = Number(window.localStorage.getItem(WIZARD_STEP_STORAGE_KEY));
    const initial =
      Number.isInteger(saved) && saved > 0 && saved < TOTAL_STEPS ? saved : 0;
    window.history.replaceState({ wizardStep: initial }, "");
    if (initial !== 0) setStep(initial);
  }, [draft]);

  // Each wizard step is a history entry, so the mobile swipe-back gesture
  // moves back one step instead of leaving the page and losing context.
  useEffect(() => {
    function handlePopState(event: PopStateEvent) {
      const fromState = event.state?.wizardStep;
      const next =
        Number.isInteger(fromState) && fromState >= 0 && fromState < TOTAL_STEPS
          ? (fromState as number)
          : 0;
      setStep(next);
      window.localStorage.setItem(WIZARD_STEP_STORAGE_KEY, String(next));
      trackAnalytics("wizard_step_viewed", undefined, {
        step: next,
        via: "swipe",
      });
    }
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
    // trackAnalytics only reads the current draft.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft]);

  useEffect(() => {
    if (initialDraft) return;
    const stored = loadMyPathDraft(window.localStorage);
    const base = stored ?? createAnonymousDraft(null, eventId());
    const isFirstEntry = !base.events.some(
      (event) => event.type === "entry_viewed"
    );
    const next = isFirstEntry
      ? applyJourneyEvent(base, {
          id: eventId(),
          type: "entry_viewed",
          occurredAt: new Date().toISOString(),
          metadata: { entry: "mission-wizard" },
        })
      : base;
    setDraft(next);
    if (isFirstEntry) {
      void fetch("/api/my-path/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: next.draftId,
          eventType: "reel_entry_viewed",
          metadata: { entry: "mission-wizard" },
        }),
      }).catch(() => undefined);
    }
  }, [initialDraft]);

  // Interests flagged over on Radar arrive as bare slugs. Fold them into the
  // draft as real saves so the wizard shows them pre-selected on return.
  useEffect(() => {
    if (!draft || radarInterestsDrained.current) return;
    radarInterestsDrained.current = true;
    const slugs = readRadarInterests(window.localStorage);
    if (slugs.length === 0) return;
    clearRadarInterests(window.localStorage);
    const known = new Set(careers.map((career) => career.slug));
    for (const slug of slugs) {
      if (!known.has(slug) || draft.possibilities[slug]?.state === "saved") {
        continue;
      }
      recordEvent(
        { type: "career_saved", careerSlug: slug, metadata: { source: "radar" } },
        "career_saved"
      );
    }
    // recordEvent only closes over the current draft setter.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft, careers]);

  useEffect(() => {
    if (!draft) return;
    saveMyPathDraft(window.localStorage, draft);
  }, [draft]);

  useEffect(() => {
    if (!draft || !persisted || draft.updatedAt === lastSyncedAt.current)
      return;
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

  const savedSlugs = useMemo(
    () => (draft ? getSavedPossibilities(draft).map((item) => item.slug) : []),
    [draft]
  );
  const goal = (draft ? getLockedGoal(draft) : null) as MissionGoal | null;
  const timelineMonths = Number(draft ? getGoalTimeline(draft) : null) || 4;
  const firstActionSeed = useMemo(
    () =>
      matchSeedsToInterests(savedSlugs, seeds, planningRegistry)[0] ?? null,
    [savedSlugs, seeds]
  );
  const plan = useMemo(() => {
    const savedTitles = savedSlugs
      .map((slug) => careers.find((career) => career.slug === slug)?.titleTh)
      .filter((title): title is string => Boolean(title));
    // PathLab selection is hidden for now — the plan is shaped in the
    // consultation, so the mission plan is built from interests alone.
    return buildMissionPlan({
      goal,
      timelineMonths,
      pathlabTitles: [],
      careerTitles: savedTitles,
    });
  }, [goal, timelineMonths, savedSlugs, careers]);

  useEffect(() => {
    if (step === TOTAL_STEPS - 1 && !missionTracked.current && draft) {
      missionTracked.current = true;
      trackAnalytics("mission_plan_viewed", undefined, {
        goal: goal ?? "none",
        timeline: timelineMonths,
        interests: savedSlugs.length,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  function recordEvent(
    input: Omit<JourneyEvent, "id" | "occurredAt">,
    analyticsType?: string
  ) {
    const event: JourneyEvent = {
      ...input,
      id: eventId(),
      occurredAt: new Date().toISOString(),
    };
    setDraft((current) =>
      current ? applyJourneyEvent(current, event) : current
    );
    if (draft && analyticsType) {
      trackAnalytics(analyticsType, input.careerSlug, {
        ...(input.metadata ?? {}),
      });
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

  function toggleInterest(slug: string) {
    const saved = draft?.possibilities[slug]?.state === "saved";
    if (saved) {
      recordEvent(
        { type: "career_removed", careerSlug: slug },
        "career_removed"
      );
    } else {
      recordEvent({ type: "career_saved", careerSlug: slug }, "career_saved");
    }
  }

  function selectGoal(nextGoal: MissionGoal) {
    recordEvent(
      {
        type: "question_answered",
        questionId: LOCKED_GOAL_QUESTION_ID,
        answerId: nextGoal,
      },
      "goal_locked"
    );
  }

  function selectTimeline(months: number) {
    recordEvent({
      type: "question_answered",
      questionId: GOAL_TIMELINE_QUESTION_ID,
      answerId: String(months),
    });
  }

  function goTo(nextStep: number) {
    window.history.pushState({ wizardStep: nextStep }, "");
    setStep(nextStep);
    window.localStorage.setItem(WIZARD_STEP_STORAGE_KEY, String(nextStep));
    trackAnalytics("wizard_step_viewed", undefined, { step: nextStep });
    window.scrollTo({ top: 0, behavior: "auto" });
  }

  async function persistPlan(): Promise<boolean> {
    if (!draft) return false;
    setImportStatus("saving");
    setSaveError(null);
    try {
      const response = await fetch("/api/my-path", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          operation: persisted ? "sync" : "import",
          draft,
        }),
      });
      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as {
          error?: string;
        } | null;
        if (payload?.error === "authentication_required") {
          setSaveError("auth");
        } else if (payload?.error === "my_path_unavailable") {
          setSaveError("unavailable");
        } else {
          setSaveError("generic");
        }
        throw new Error("save failed");
      }
      lastSyncedAt.current = draft.updatedAt;
      setPersisted(true);
      setImportStatus("saved");
      clearMyPathDraft(window.localStorage);
      window.localStorage.removeItem(WIZARD_STEP_STORAGE_KEY);
      return true;
    } catch {
      setImportStatus("error");
      setSaveError((current) => current ?? "generic");
      return false;
    }
  }

  async function savePlan() {
    await persistPlan();
  }

  // Launch สำหรับนักเรียนที่ sign in แล้ว: เปิด trial "ทำก่อน จ่ายทีหลัง"
  // (idempotent — POST ซ้ำได้ไม่เป็นไร) แล้วโชว์ sheet ให้ส่งลิงก์ให้ผู้ปกครอง
  async function startTrialLaunch() {
    if (!firstActionSeed || launchInFlight.current) return;
    const generation = launchGeneration.current + 1;
    launchGeneration.current = generation;
    launchInFlight.current = true;
    setPayLaterSheet({ status: "loading", trial: null, enrollmentUrl: null });
    try {
      const saved = await persistPlan();
      if (!saved) throw new Error("durable My Path save failed");
      if (generation !== launchGeneration.current) return;
      const response = await fetch("/api/trials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ seedId: firstActionSeed.id }),
      });
      if (!response.ok) throw new Error("trial create failed");
      const payload = await response.json();
      if (
        typeof payload.payToken !== "string" ||
        typeof payload.payUrl !== "string" ||
        !["active", "pending", "paid", "expired"].includes(payload.status) ||
        typeof payload.paymentDeadline !== "string"
      ) {
        throw new Error("trial confirmation missing");
      }
      if (generation !== launchGeneration.current) return;
      if (payload.status === "expired") {
        setPayLaterSheet({
          status: "recovery",
          trial: {
            payToken: payload.payToken,
            payUrl: payload.payUrl,
            paymentDeadline: payload.paymentDeadline,
          },
          enrollmentUrl: null,
        });
        return;
      }
      if (
        typeof payload.enrollmentId !== "string" ||
        typeof payload.enrollmentUrl !== "string"
      ) {
        throw new Error("trial enrollment confirmation missing");
      }
      setPayLaterSheet({
        status:
          payload.status === "pending"
            ? "pending"
            : payload.status === "paid"
            ? "paid"
            : "ready",
        trial: {
          payToken: payload.payToken,
          payUrl: payload.payUrl,
          paymentDeadline: payload.paymentDeadline,
        },
        enrollmentUrl: payload.enrollmentUrl,
      });
    } catch {
      if (generation === launchGeneration.current) {
        setPayLaterSheet({ status: "error", trial: null, enrollmentUrl: null });
      }
    } finally {
      if (generation === launchGeneration.current) {
        launchInFlight.current = false;
      }
    }
  }

  function closeTrialLaunch() {
    launchGeneration.current += 1;
    launchInFlight.current = false;
    setPayLaterSheet(null);
  }
  if (!draft) {
    return (
      <main className="dawn-theme flex min-h-[100dvh] items-center justify-center bg-slate-950 text-slate-100">
        <div className="w-full max-w-xl px-4">
          <div className="ei-skeleton h-9 max-w-2xl" />
          <div className="ei-skeleton mt-5 h-5 max-w-xl" />
        </div>
      </main>
    );
  }

  const canProceed =
    step === 0 ||
    (step === 1 && savedSlugs.length > 0) ||
    (step === 2 && goal !== null);
  const isLastStep = step === TOTAL_STEPS - 1;

  return (
    <main className="dawn-theme relative flex min-h-[100dvh] flex-col overflow-x-hidden bg-[linear-gradient(180deg,#020617_0%,#0f172a_28%,#1e1b4b_58%,#172554_82%,#0f2942_100%)] font-bai-jamjuree text-slate-100">
      <DawnAtmosphere />

      <div className="relative z-10 flex min-h-[100dvh] flex-col">
        <WizardProgress step={step} totalSteps={TOTAL_STEPS} />

        <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-4 pb-28 pt-8 sm:px-6 sm:pt-12">
          {step === 0 && <StepHook />}
          {step === 1 && (
            <StepInterests
              careers={careers}
              savedSlugs={savedSlugs}
              maxSelections={MAX_ACTIVE_SAVED_PATHS}
              onToggle={toggleInterest}
            />
          )}
          {step === 2 && (
            <StepGoal
              goal={goal}
              timelineMonths={timelineMonths}
              onSelectGoal={selectGoal}
              onSelectTimeline={selectTimeline}
            />
          )}
          {step === 3 && (
            <StepMission
              plan={plan}
              firstAction={
                firstActionSeed
                  ? {
                      href: `/seeds/${firstActionSeed.id}`,
                      title: firstActionSeed.title,
                      seedId: firstActionSeed.id,
                    }
                  : null
              }
              isSignedIn={isSignedIn}
              loginHref={LOGIN_HREF}
              importStatus={importStatus}
              saveError={saveError}
              persisted={persisted}
              onSave={savePlan}
              onLaunch={() =>
                trackAnalytics("pathlab_handoff_clicked", undefined, {
                  seedId: firstActionSeed?.id ?? null,
                  title: firstActionSeed?.title ?? null,
                  source: "mission_launch",
                })
              }
              onLaunchStart={
                isSignedIn && firstActionSeed ? startTrialLaunch : undefined
              }
              onBook={() =>
                trackAnalytics("consult_booking_clicked", undefined, {
                  goal: goal ?? "none",
                  timeline: timelineMonths,
                })
              }
            />
          )}
        </div>

        <nav
          className="fixed inset-x-0 bottom-0 z-20 border-t border-white/10 bg-slate-950/80 backdrop-blur-md"
          aria-label="ขั้นตอนของแผน"
        >
          <div className="mx-auto flex w-full max-w-2xl items-center gap-3 px-4 py-3 sm:px-6">
            {step > 0 ? (
              <button
                type="button"
                onClick={() => goTo(step - 1)}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-white/10 px-4 text-sm font-semibold text-slate-300 hover:bg-white/[0.05] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200"
              >
                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                ย้อนกลับ
              </button>
            ) : (
              <span className="hidden sm:block" aria-hidden="true" />
            )}
            {!isLastStep && (
              <button
                type="button"
                onClick={() => canProceed && goTo(step + 1)}
                disabled={!canProceed}
                className="ei-button-dawn min-h-12 flex-1 justify-center disabled:cursor-not-allowed disabled:opacity-40"
              >
                <span>
                  {step === 0
                    ? "เริ่มออกแบบชีวิต"
                    : step === 1 && savedSlugs.length === 0
                      ? "เลือกอย่างน้อย 1 อันเพื่อไปต่อ"
                      : step === 2 && goal === null
                        ? "เลือกเป้าหมายเพื่อดูแผน"
                        : step === 2
                          ? "ดูแผนของฉัน"
                          : "ถัดไป"}
                </span>
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </button>
            )}
            {isLastStep && (
              <p className="flex-1 text-center text-xs text-slate-500">
                แก้ทุกอย่างได้เสมอ — ย้อนกลับไปปรับได้ทุกขั้น
              </p>
            )}
          </div>
        </nav>
        <PayLaterSheet
          open={payLaterSheet !== null}
          state={payLaterSheet?.status ?? "loading"}
          trial={payLaterSheet?.trial ?? null}
          enrollmentUrl={payLaterSheet?.enrollmentUrl ?? null}
          seedTitle={firstActionSeed?.title ?? "PathLab"}
          onRetry={startTrialLaunch}
          onClose={closeTrialLaunch}
        />
      </div>
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
