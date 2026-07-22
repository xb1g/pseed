"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Node } from "@xyflow/react";
import { toast } from "sonner";
import { ActivityViewPanel, type ActivityRow } from "./ActivityViewPanel";
import { ContextPhase } from "./ContextPhase";
import { PlayerShell } from "./player/PlayerShell";
import { PlayerHeader } from "./player/PlayerHeader";
import { PlayerActionBar } from "./player/PlayerActionBar";
import { ActivityRail } from "./player/ActivityRail";
import { ReflectionForm, type DailyReflectionDraft } from "./ReflectionForm";
import { DecisionGate, type PathDecision } from "./DecisionGate";
import { ExitReflection } from "./ExitReflection";
import { EndReflection } from "./EndReflection";
import { TrendSummary } from "./TrendSummary";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

type PathDaySummary = {
  day_number: number;
  title: string | null;
  context_text: string;
  reflection_prompts: string[];
  activity_ids: string[];
  activities: Array<{
    id: string;
    title: string;
  }>;
};

type PathLabExperienceProps = {
  enrollment: any;
  seed: any;
  path: any;
  day: any;
  dayActivities: ActivityRow[];
  initialProgressMap: Record<string, any>;
  pathDaySummaries: PathDaySummary[];
  availableDayNumbers: number[];
  currentDayNumber: number;
  reflections: any[];
  exitReflection: any | null;
  endReflection: any | null;
};

type Phase =
  | "context"
  | "action"
  | "reflection"
  | "decision"
  | "exit"
  | "end_reflection";

const STEPS = [
  { id: "context", label: "Intro", description: "Context" },
  { id: "action", label: "Do", description: "Action" },
  { id: "reflection", label: "Reflect", description: "Your thoughts" },
  { id: "decision", label: "Next", description: "Intentional step" },
];

function PhaseStepper({
  currentPhase,
  isFinalDay,
}: {
  currentPhase: Phase;
  isFinalDay: boolean;
}) {
  const stepsToShow = isFinalDay
    ? STEPS.map((s) =>
        s.id === "decision"
          ? { ...s, id: "end_reflection", label: "Finish" }
          : s,
      )
    : STEPS;

  const currentIndex = stepsToShow.findIndex((s) => s.id === currentPhase);

  if (currentIndex === -1) return null;

  // A breadcrumb, not a billboard: the old stepper ate 160px of vertical
  // space to say one word. The header already carries progress within the day.
  return (
    <ol className="mb-6 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.14em]">
      {stepsToShow.map((step, idx) => {
        const isActive = step.id === currentPhase;
        const isCompleted = idx < currentIndex;

        return (
          <li key={step.id} className="flex items-center gap-1.5">
            {idx > 0 && (
              <span aria-hidden="true" className="text-neutral-700">
                /
              </span>
            )}
            <span
              aria-current={isActive ? "step" : undefined}
              className={
                isActive
                  ? "text-amber-300"
                  : isCompleted
                    ? "text-neutral-400"
                    : "text-neutral-600"
              }
            >
              {step.label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

// path_activity_progress statuses. "skipped" counts as resolved: the student
// made a deliberate choice and should not be blocked from the day's reflection.
const COMPLETE_STATUSES = new Set(["completed", "skipped"]);


export function PathLabExperience({
  enrollment,
  seed,
  path,
  day,
  dayActivities,
  initialProgressMap,
  pathDaySummaries,
  availableDayNumbers,
  currentDayNumber,
  reflections,
  exitReflection,
  endReflection,
}: PathLabExperienceProps) {
  const router = useRouter();
  const isFinalDay = day?.day_number === path?.total_days;
  const isCurrentDayView = day?.day_number === currentDayNumber;
  const [phase, setPhase] = useState<Phase>(() => {
    if (typeof window !== "undefined") {
      const p = new URLSearchParams(window.location.search).get(
        "phase",
      ) as Phase;
      if (
        p &&
        [
          "context",
          "action",
          "reflection",
          "decision",
          "end_reflection",
        ].includes(p)
      )
        return p;
    }
    return "context";
  });
  const [selectedActivityId, setSelectedActivityId] = useState<string | null>(
    dayActivities[0]?.id || null,
  );

  // Map View State
  const [isMapOpen, setIsMapOpen] = useState(false);
  // Set the moment the last required activity lands, so the action bar can
  // announce itself instead of quietly switching from disabled to enabled
  const [dayJustFinished, setDayJustFinished] = useState(false);
  const workRef = useRef<HTMLElement>(null);
  const [progressMap, setProgressMap] = useState<Record<string, any>>(
    initialProgressMap || {},
  );
  const [submitting, setSubmitting] = useState(false);
  const [restarting, setRestarting] = useState(false);
  const [actionStartTime, setActionStartTime] = useState<number | null>(null);
  const [reflectionDraft, setReflectionDraft] = useState<DailyReflectionDraft>({
    energyLevel: 5,
    confusionLevel: 5,
    interestLevel: 5,
    openResponse: "",
    timeSpentMinutes: null,
  });
  const currentDayIndex = useMemo(
    () =>
      availableDayNumbers.findIndex(
        (dayNumber) => dayNumber === day?.day_number,
      ),
    [availableDayNumbers, day?.day_number],
  );
  const previousRenderedDay = useRef<number | null>(day?.day_number ?? null);
  const previousDayNumber =
    currentDayIndex > 0 ? availableDayNumbers[currentDayIndex - 1] : null;
  const nextDayNumber =
    currentDayIndex >= 0 && currentDayIndex < availableDayNumbers.length - 1
      ? availableDayNumbers[currentDayIndex + 1]
      : null;

  const selectedActivity = useMemo(
    () =>
      dayActivities.find((item) => item.id === selectedActivityId) || null,
    [dayActivities, selectedActivityId],
  );

  const mapViewerDays = useMemo(() => {
    if (pathDaySummaries.length > 0) {
      return [...pathDaySummaries]
        .filter((entry) => Number.isFinite(entry.day_number))
        .sort((a, b) => a.day_number - b.day_number);
    }

    const totalDays = Number(path?.total_days || 0);
    if (!Number.isFinite(totalDays) || totalDays <= 0) {
      return [];
    }

    return Array.from({ length: totalDays }, (_, index) => ({
      day_number: index + 1,
      title: null,
      context_text: "",
      reflection_prompts: [],
      activity_ids: [],
      activities: [],
    }));
  }, [path?.total_days, pathDaySummaries]);

  const upcomingDays = useMemo(
    () => mapViewerDays.filter((entry) => entry.day_number >= currentDayNumber),
    [currentDayNumber, mapViewerDays],
  );

  const dayProgressMap = useMemo(() => {
    return mapViewerDays.reduce<Record<number, { completed: number; total: number }>>(
      (acc, entry) => {
        const activityIds = Array.isArray(entry.activity_ids)
          ? entry.activity_ids
          : [];
        const completed = activityIds.filter((activityId) =>
          COMPLETE_STATUSES.has(progressMap[activityId]?.status),
        ).length;
        acc[entry.day_number] = { completed, total: activityIds.length };
        return acc;
      },
      {},
    );
  }, [mapViewerDays, progressMap]);

  const allActivitiesComplete = useMemo(() => {
    // Only required activities gate the day; optional ones are a fit signal,
    // not an obligation
    const required = dayActivities.filter(
      (activity: any) => activity.is_required !== false,
    );
    if (required.length === 0) return true;
    return required.every((activity) =>
      COMPLETE_STATUSES.has(progressMap[activity.id]?.status),
    );
  }, [dayActivities, progressMap]);

  // When the open activity is finished, move to the next unfinished one.
  // Leaving the student parked on a completed panel makes them hunt for what
  // to do next, which is the moment the day feels like homework.
  function advanceAfterCompletion(nextProgress: Record<string, any>) {
    const isDone = (activity: ActivityRow) =>
      COMPLETE_STATUSES.has(nextProgress[activity.id]?.status);

    const current = dayActivities.find(
      (activity) => activity.id === selectedActivityId,
    );
    if (!current || !isDone(current)) return;

    const nextUp = dayActivities.find((activity) => !isDone(activity));
    if (nextUp) {
      setSelectedActivityId(nextUp.id);
      workRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }

    setDayJustFinished(true);
  }

  async function refreshProgress() {
    try {
      const response = await fetch(
        `/api/pathlab/progress?enrollmentId=${enrollment.id}`,
      );
      const payload = await response.json();
      if (!response.ok || !payload?.success) {
        return;
      }
      const nextProgress = payload.progressMap || {};
      setProgressMap(nextProgress);
      advanceAfterCompletion(nextProgress);
    } catch {
      // no-op
    }
  }

  useEffect(() => {
    const activeDayNumber = day?.day_number ?? null;
    if (previousRenderedDay.current !== activeDayNumber) {
      setPhase("context");
      previousRenderedDay.current = activeDayNumber;
      // Reset reflection draft and time tracking for new day
      setReflectionDraft({
        energyLevel: 5,
        confusionLevel: 5,
        interestLevel: 5,
        openResponse: "",
        timeSpentMinutes: null,
      });
      setActionStartTime(null);
    }
  }, [day?.day_number]);

  useEffect(() => {
    if (!isCurrentDayView && !["context", "action"].includes(phase)) {
      setPhase("context");
    }
  }, [isCurrentDayView, phase]);

  useEffect(() => {
    if (!dayActivities.some((item) => item.id === selectedActivityId)) {
      setSelectedActivityId(dayActivities[0]?.id || null);
    }
  }, [dayActivities, selectedActivityId]);

  // The "day finished" emphasis is a one-shot; drop it once the student acts
  useEffect(() => {
    if (phase !== "action") setDayJustFinished(false);
  }, [phase]);

  // Auto time tracking - start when entering action phase
  useEffect(() => {
    const storageKey = `pathlab_time_${enrollment.id}_day_${day?.day_number}`;

    if (phase === "action" && !actionStartTime) {
      // Check if we have a stored start time (in case of refresh)
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const storedTime = parseInt(stored, 10);
        if (!isNaN(storedTime)) {
          console.log("⏱️ Resumed time tracking from:", new Date(storedTime));
          setActionStartTime(storedTime);
        }
      } else {
        // Start new timer
        const now = Date.now();
        console.log("⏱️ Started time tracking at:", new Date(now));
        setActionStartTime(now);
        localStorage.setItem(storageKey, String(now));
      }
    }

    // When entering reflection phase, calculate elapsed time
    if (phase === "reflection" && actionStartTime) {
      const elapsedMs = Date.now() - actionStartTime;
      const elapsedMinutes = Math.round(elapsedMs / 60000); // Convert to minutes

      console.log("⏱️ Time tracking ended. Elapsed:", elapsedMinutes, "minutes");

      // Auto-fill time if not already set
      if (reflectionDraft.timeSpentMinutes === null) {
        setReflectionDraft((prev) => ({
          ...prev,
          timeSpentMinutes: elapsedMinutes,
        }));
        console.log("✅ Auto-filled time spent:", elapsedMinutes, "minutes");
      }

      // Clear localStorage for this day
      localStorage.removeItem(storageKey);
    }

    // Clean up on day change
    if (phase === "context") {
      setActionStartTime(null);
      localStorage.removeItem(storageKey);
    }
  }, [phase, actionStartTime, day?.day_number, enrollment.id, reflectionDraft.timeSpentMinutes]);

  const navigateToDay = (dayNumber: number) => {
    router.push(`/seeds/pathlab/${enrollment.id}?day=${dayNumber}`);
  };

  const submitDecision = async (
    decision: PathDecision,
    extra?: { exitReflection?: any },
  ) => {
    if (!day) return;
    setSubmitting(true);
    try {
      const response = await fetch("/api/pathlab/reflect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          enrollmentId: enrollment.id,
          dayNumber: day.day_number,
          energyLevel: reflectionDraft.energyLevel,
          confusionLevel: reflectionDraft.confusionLevel,
          interestLevel: reflectionDraft.interestLevel,
          openResponse: reflectionDraft.openResponse,
          timeSpentMinutes: reflectionDraft.timeSpentMinutes,
          extraPromptResponses: reflectionDraft.extraPromptResponses,
          decision,
          exitReflection: extra?.exitReflection,
        }),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error || "Failed to submit reflection");
      }

      if (decision === "continue_now") {
        toast.success("Starting next day");
        router.push(`/seeds/pathlab/${enrollment.id}`);
        router.refresh();
        return;
      }

      if (
        decision === "continue_tomorrow" ||
        decision === "pause" ||
        decision === "quit"
      ) {
        router.push("/seeds?gallery=1&type=pathlab");
      }
    } catch (error: any) {
      toast.error(error?.message || "Failed to submit reflection");
    } finally {
      setSubmitting(false);
    }
  };

  const submitFinalReflection = async (payload: {
    overallInterest: number;
    fitLevel: number;
    surpriseResponse: string;
    wouldExploreDeeper: "yes" | "maybe" | "no";
  }) => {
    if (!day) return;
    setSubmitting(true);
    try {
      const response = await fetch("/api/pathlab/reflect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          enrollmentId: enrollment.id,
          dayNumber: day.day_number,
          energyLevel: reflectionDraft.energyLevel,
          confusionLevel: reflectionDraft.confusionLevel,
          interestLevel: reflectionDraft.interestLevel,
          openResponse: reflectionDraft.openResponse,
          timeSpentMinutes: reflectionDraft.timeSpentMinutes,
          extraPromptResponses: reflectionDraft.extraPromptResponses,
          decision: "final_reflection",
          endReflection: {
            overallInterest: payload.overallInterest,
            fitLevel: payload.fitLevel,
            surpriseResponse: payload.surpriseResponse,
            wouldExploreDeeper: payload.wouldExploreDeeper,
          },
        }),
      });

      const responsePayload = await response.json();
      if (!response.ok) {
        throw new Error(
          responsePayload?.error || "Failed to submit final reflection",
        );
      }

      toast.success("Path marked as explored");
      router.refresh();
    } catch (error: any) {
      toast.error(error?.message || "Failed to submit final reflection");
    } finally {
      setSubmitting(false);
    }
  };

  if (enrollment.status === "quit") {
    return (
      <div className="space-y-4">
        <Card className="border-neutral-800 bg-neutral-900/80">
          <CardHeader>
            <CardTitle className="text-white">Path exited</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-neutral-200">
            <p>You chose to exit this path. That is a valid outcome.</p>
            {exitReflection && (
              <>
                <p>Reason: {exitReflection.reason_category}</p>
                <p>Interest change: {exitReflection.interest_change}</p>
              </>
            )}
            <Button
              onClick={() => router.push("/seeds?gallery=1&type=pathlab")}
              className="mt-2 bg-white text-black hover:bg-neutral-200"
            >
              Back to PathLab
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (enrollment.status === "explored" || endReflection) {
    const handleRestart = async () => {
      console.log("🔄 Starting restart...");
      setRestarting(true);
      try {
        console.log("📤 Sending restart request for seed:", seed.id);
        const response = await fetch("/api/pathlab/enroll", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            seedId: seed.id,
            whyJoined: "Restarting path exploration",
            restart: true,
          }),
        });

        console.log("📥 Response status:", response.status);
        const payload = await response.json();
        console.log("📦 Response payload:", payload);

        if (!response.ok) {
          console.error("❌ Response not OK:", payload);
          throw new Error(payload?.error || "Failed to restart path");
        }

        const enrollmentId = payload?.enrollment?.id;
        console.log("🎫 Enrollment ID:", enrollmentId);

        if (!enrollmentId) {
          console.error("❌ No enrollment ID in response");
          throw new Error("Enrollment was created without id");
        }

        console.log("✅ Restarting complete, redirecting to:", `/seeds/pathlab/${enrollmentId}`);

        // Refresh the page to show Day 1
        router.refresh();
        router.push(`/seeds/pathlab/${enrollmentId}`);
      } catch (error: any) {
        console.error("💥 Restart error:", error);
        toast.error(error?.message || "Failed to restart path");
        setRestarting(false);
      }
    };

    return (
      <div className="space-y-4">
        <Card className="border-neutral-800 bg-neutral-900/80">
          <CardHeader>
            <CardTitle className="text-white">Explored</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-neutral-200">
            <p>You completed this PathLab exploration.</p>
            <p>
              Final interest: {endReflection?.overall_interest ?? "-"} / 10, fit:{" "}
              {endReflection?.fit_level ?? "-"} / 10
            </p>
            <div className="flex gap-2">
              <Button
                onClick={() => router.push("/seeds?gallery=1&type=pathlab")}
                variant="outline"
                className="flex-1 border-neutral-700 text-neutral-300 hover:bg-neutral-800 hover:text-white"
              >
                Back to PathLab
              </Button>
              <Button
                onClick={handleRestart}
                disabled={restarting}
                className="flex-1 bg-white text-black hover:bg-neutral-200"
              >
                {restarting ? "Restarting..." : "Restart Path"}
              </Button>
            </div>
          </CardContent>
        </Card>
        <TrendSummary trend={reflections || []} />
      </div>
    );
  }

  if (!day) {
    return (
      <Card className="border-neutral-800 bg-neutral-900/80">
        <CardContent className="p-6 text-neutral-200">
          This path has no day configuration yet.
        </CardContent>
      </Card>
    );
  }

  const dayActivityTotal = dayActivities.length;
  const dayActivityCompleted = dayActivities.filter((activity) =>
    COMPLETE_STATUSES.has(progressMap[activity.id]?.status),
  ).length;

  const railItems = dayActivities.map((activity) => ({
    id: activity.id,
    title: activity.title,
    isComplete: COMPLETE_STATUSES.has(progressMap[activity.id]?.status),
  }));

  // One action bar, one rule: the primary button is always the next real step.
  let actionBar: ReactNode = null;
  if (phase === "context") {
    actionBar = (
      <PlayerActionBar
        primaryLabel={
          dayActivityTotal > 0 ? "Start today's work" : "Continue"
        }
        onPrimary={() =>
          setPhase(dayActivityTotal > 0 || !isCurrentDayView ? "action" : "reflection")
        }
        secondaryLabel={isCurrentDayView ? "Skip" : undefined}
        onSecondary={
          isCurrentDayView ? () => setPhase("reflection") : undefined
        }
      />
    );
  } else if (phase === "action") {
    if (!isCurrentDayView) {
      actionBar = (
        <PlayerActionBar
          primaryLabel={`Back to day ${currentDayNumber}`}
          onPrimary={() => navigateToDay(currentDayNumber)}
          hint="You're reviewing a day you've already worked through."
        />
      );
    } else if (dayActivityTotal === 0) {
      actionBar = (
        <PlayerActionBar
          primaryLabel="Continue to reflection"
          onPrimary={() => setPhase("reflection")}
          hint="No activities are assigned for this day."
        />
      );
    } else {
      actionBar = (
        <PlayerActionBar
          primaryLabel="Next: Reflection"
          onPrimary={() => setPhase("reflection")}
          primaryDisabled={!allActivitiesComplete}
          emphasis={dayJustFinished}
          hint={
            dayJustFinished
              ? "That's the day's work done — now the part that matters."
              : allActivitiesComplete
                ? undefined
                : `${dayActivityCompleted} of ${dayActivityTotal} done`
          }
          secondaryLabel="Skip"
          onSecondary={() => setPhase("reflection")}
        />
      );
    }
  }

  return (
    <PlayerShell
      header={
        <PlayerHeader
          dayNumber={day.day_number}
          totalDays={path.total_days}
          dayTitle={day.title}
          completed={dayActivityCompleted}
          total={dayActivityTotal}
          onOpenMap={
            mapViewerDays.length > 0 ? () => setIsMapOpen(true) : undefined
          }
          onPreviousDay={
            previousDayNumber
              ? () => navigateToDay(previousDayNumber)
              : undefined
          }
          onNextDay={
            nextDayNumber ? () => navigateToDay(nextDayNumber) : undefined
          }
        />
      }
      actionBar={actionBar}
    >
      {/* Map Modal */}
      <Dialog open={isMapOpen} onOpenChange={setIsMapOpen}>
        <DialogContent className="max-w-2xl border-white/10 bg-[#0e0e10]">
          <DialogTitle className="text-white">What&apos;s coming</DialogTitle>
          <div className="max-h-[70vh] space-y-2 overflow-y-auto pr-1">
            {upcomingDays.length > 0 ? (
              upcomingDays.map((entry) => {
                const isCurrent = entry.day_number === currentDayNumber;
                const progress = dayProgressMap[entry.day_number] || {
                  completed: 0,
                  total: 0,
                };
                const activityLabel =
                  progress.total === 1 ? "1 activity" : `${progress.total} activities`;
                const contextPreview = entry.context_text
                  ? entry.context_text.replace(/\s+/g, " ").trim()
                  : "";
                const activityPreview = entry.activities.slice(0, 4);

                return (
                  <div
                    key={entry.day_number}
                    className="rounded-xl border border-white/10 bg-white/[0.03] p-3.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-amber-300/70">
                        Day {entry.day_number}
                      </p>
                      {isCurrent && (
                        <span className="rounded-full bg-amber-400/15 px-2 py-0.5 text-[11px] font-semibold text-amber-200">
                          Current
                        </span>
                      )}
                    </div>
                    <p className="mt-1.5 text-sm font-semibold text-white">
                      {entry.title?.trim() || "Planned day"}
                    </p>
                    <p className="mt-1 text-xs text-neutral-500">
                      {activityLabel}
                      {progress.total > 0 &&
                        ` · ${progress.completed}/${progress.total} complete`}
                    </p>

                    {contextPreview && (
                      <p className="mt-2 text-xs leading-5 text-neutral-400">
                        {contextPreview.length > 160
                          ? `${contextPreview.slice(0, 160)}…`
                          : contextPreview}
                      </p>
                    )}

                    {activityPreview.length > 0 && (
                      <ul className="mt-2.5 space-y-1">
                        {activityPreview.map((activity) => (
                          <li
                            key={`${entry.day_number}-${activity.id}`}
                            className="flex items-start gap-2 text-xs text-neutral-300"
                          >
                            <span
                              aria-hidden="true"
                              className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-neutral-600"
                            />
                            {activity.title}
                          </li>
                        ))}
                        {entry.activities.length > activityPreview.length && (
                          <li className="text-xs text-neutral-600">
                            +{entry.activities.length - activityPreview.length} more
                          </li>
                        )}
                      </ul>
                    )}
                  </div>
                );
              })
            ) : (
              <p className="rounded-xl border border-white/10 bg-white/[0.03] p-4 text-sm text-neutral-400">
                No upcoming days are available yet.
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {!isCurrentDayView && (
        <div className="mb-5 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
          <p className="text-sm text-neutral-400">
            Review mode — day {currentDayNumber} is your active day.
          </p>
          <button
            type="button"
            onClick={() => navigateToDay(currentDayNumber)}
            className="text-sm font-semibold text-amber-300 transition-colors hover:text-amber-200"
          >
            Go to active day
          </button>
        </div>
      )}

      {isCurrentDayView && (
        <PhaseStepper currentPhase={phase} isFinalDay={isFinalDay} />
      )}

      {phase === "context" && (
        <ContextPhase
          dayNumber={day.day_number}
          dayTitle={day?.title}
          contextText={day.context_text}
        />
      )}

      {phase === "action" && (
        <section ref={workRef} className="scroll-mt-40">
          <ActivityRail
            items={railItems}
            selectedId={selectedActivityId}
            onSelect={setSelectedActivityId}
          />

          {dayActivities.length > 0 ? (
            <div className="overflow-hidden rounded-xl border border-white/10 bg-white/[0.02]">
              {selectedActivity && (
                <ActivityViewPanel
                  key={selectedActivity.id}
                  activity={selectedActivity}
                  enrollmentId={enrollment.id}
                  progressId={progressMap[selectedActivity.id]?.id || null}
                  isComplete={COMPLETE_STATUSES.has(
                    progressMap[selectedActivity.id]?.status,
                  )}
                  onProgressUpdate={refreshProgress}
                />
              )}
            </div>
          ) : (
            <p className="rounded-xl border border-white/10 bg-white/[0.03] p-4 text-sm text-neutral-400">
              No activities are assigned for this day yet.
            </p>
          )}
        </section>
      )}

      {isCurrentDayView && phase === "reflection" && (
        <ReflectionForm
          value={reflectionDraft}
          extraPrompts={
            Array.isArray(day.reflection_prompts) ? day.reflection_prompts : []
          }
          submitting={submitting}
          onChange={setReflectionDraft}
          onSubmit={() => setPhase(isFinalDay ? "end_reflection" : "decision")}
        />
      )}

      {isCurrentDayView && phase === "decision" && (
        <DecisionGate
          submitting={submitting}
          onChoose={(decision) => {
            if (decision === "quit") {
              setPhase("exit");
              return;
            }
            submitDecision(decision);
          }}
        />
      )}

      {isCurrentDayView && phase === "exit" && (
        <ExitReflection
          submitting={submitting}
          onBack={() => setPhase("decision")}
          onSubmit={(payload) =>
            submitDecision("quit", { exitReflection: payload })
          }
        />
      )}

      {isCurrentDayView && phase === "end_reflection" && (
        <div className="space-y-4">
          <TrendSummary
            trend={[
              ...(reflections || []),
              {
                day_number: day.day_number,
                energy_level: reflectionDraft.energyLevel,
                confusion_level: reflectionDraft.confusionLevel,
                interest_level: reflectionDraft.interestLevel,
              },
            ]}
          />
          <EndReflection
            submitting={submitting}
            onSubmit={submitFinalReflection}
          />
        </div>
      )}
    </PlayerShell>
  );
}
