import { resolvePlanEntry } from "./entries";
import type {
  ContextualQuestion,
  JourneyEvent,
  MyPathDraft,
  PossibilitySignal,
} from "./types";

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
export const MAX_ACTIVE_SAVED_PATHS = 3;

function timestampPlusDays(timestamp: string, milliseconds: number): string {
  return new Date(new Date(timestamp).getTime() + milliseconds).toISOString();
}

export function createAnonymousDraft(
  entryKey?: string | null,
  draftId = crypto.randomUUID(),
  now = new Date().toISOString()
): MyPathDraft {
  const entry = resolvePlanEntry(entryKey);
  return {
    version: 1,
    draftId,
    entryKey: entry.key,
    createdAt: now,
    updatedAt: now,
    expiresAt: timestampPlusDays(now, THIRTY_DAYS_MS),
    rejectedDirections: [],
    possibilities: {},
    answers: {},
    skippedQuestions: [],
    savedQuestions: [],
    events: [],
  };
}

function possibilityFromEvent(event: JourneyEvent): PossibilitySignal {
  return {
    slug: event.careerSlug!,
    state: "explored",
    openedCount: 0,
    meaningfulOpen: false,
    radarOpened: false,
    compared: false,
    updatedAt: event.occurredAt,
  };
}

function savedCount(draft: MyPathDraft): number {
  return Object.values(draft.possibilities).filter((item) => item.state === "saved")
    .length;
}

export function applyJourneyEvent(
  draft: MyPathDraft,
  event: JourneyEvent
): MyPathDraft {
  if (draft.events.some((existing) => existing.id === event.id)) return draft;

  const next: MyPathDraft = {
    ...draft,
    updatedAt: event.occurredAt,
    expiresAt: timestampPlusDays(event.occurredAt, THIRTY_DAYS_MS),
    possibilities: { ...draft.possibilities },
    answers: { ...draft.answers },
    skippedQuestions: [...draft.skippedQuestions],
    savedQuestions: [...draft.savedQuestions],
    rejectedDirections: [...draft.rejectedDirections],
    events: [...draft.events, event],
  };

  if (event.questionId && event.type === "question_answered" && event.answerId) {
    next.answers[event.questionId] = event.answerId;
  }
  if (event.questionId && event.type === "question_skipped") {
    next.skippedQuestions = Array.from(
      new Set([...next.skippedQuestions, event.questionId])
    );
  }
  if (event.type === "direction_rejected" && event.reason) {
    next.rejectedDirections.push(event.reason);
  }
  if (event.type === "direction_edited" && event.reason) {
    next.directionOverride = event.reason.slice(0, 280);
  }
  if (
    event.type === "question_saved" &&
    event.reason &&
    event.comparisonSlugs &&
    !next.savedQuestions.some((question) => question.id === event.id)
  ) {
    next.savedQuestions.push({
      id: event.id,
      text: event.reason.slice(0, 280),
      careerSlugs: [...event.comparisonSlugs],
      status: "open",
    });
  }
  if (event.type === "step_completed" && event.stepId?.startsWith("question:")) {
    const questionId = event.stepId.slice("question:".length);
    next.savedQuestions = next.savedQuestions.map((question) =>
      question.id === questionId ? { ...question, status: "answered" } : question
    );
  }

  const affectedSlugs = event.comparisonSlugs ??
    (event.careerSlug ? [event.careerSlug] : []);
  for (const slug of affectedSlugs) {
    const current = next.possibilities[slug] ??
      possibilityFromEvent({ ...event, careerSlug: slug });
    const updated = { ...current, updatedAt: event.occurredAt };

    switch (event.type) {
      case "career_opened":
        updated.state = current.state === "saved" ? "saved" : "explored";
        updated.openedCount += 1;
        break;
      case "career_meaningful_open":
        updated.state = current.state === "saved" ? "saved" : "explored";
        updated.meaningfulOpen = true;
        updated.openedCount = Math.max(1, updated.openedCount);
        break;
      case "radar_profile_opened":
        updated.radarOpened = true;
        break;
      case "career_compared":
        updated.compared = true;
        break;
      case "career_saved":
        if (current.state !== "saved" && savedCount(next) >= MAX_ACTIVE_SAVED_PATHS) {
          break;
        }
        updated.state = "saved";
        updated.savedAt = event.occurredAt;
        break;
      case "career_dismissed":
        updated.state = "dismissed";
        break;
      case "career_removed":
        updated.state = "removed";
        updated.removedReason = event.reason;
        break;
    }
    next.possibilities[slug] = updated;
  }

  return next;
}

const CAREER_ATTRACTION: ContextualQuestion = {
  id: "career-attraction",
  prompt: "อะไรทำให้เส้นทางนี้น่าสนใจสำหรับคุณ?",
  options: [
    { id: "work", label: "งานที่ได้ทำ", facet: "creativity" },
    { id: "lifestyle", label: "วิธีใช้ชีวิต", facet: "flexibility" },
    { id: "income", label: "รายได้และโอกาส", facet: "income" },
    { id: "create", label: "ได้สร้างสิ่งใหม่", facet: "innovation" },
    { id: "help", label: "ได้ช่วยคน", facet: "helping" },
    { id: "truth", label: "แค่อยากรู้ความจริง" },
  ],
};

const PAIR_PRIORITY: ContextualQuestion = {
  id: "pair-priority",
  prompt: "ถ้าต้องเปรียบเทียบ ตอนนี้อะไรสำคัญกว่า?",
  options: [
    { id: "freedom", label: "อิสระในการเลือกวิธีทำงาน", facet: "autonomy" },
    { id: "stability", label: "ความมั่นคงและทางเติบโต", facet: "stability" },
    { id: "creativity", label: "พื้นที่ให้สร้างสรรค์", facet: "creativity" },
  ],
};

export const ACTION_READINESS: ContextualQuestion = {
  id: "action-readiness",
  prompt: "ตอนนี้อยากไปต่อแค่ไหน?",
  options: [
    { id: "read", label: "อ่านเพิ่มก่อน" },
    { id: "short", label: "ลองทำอะไรสั้นๆ" },
    { id: "pathlab", label: "อยากทดลองจริงผ่าน PathLab" },
  ],
};

export function getContextualQuestion(
  draft: MyPathDraft
): ContextualQuestion | null {
  const isUnanswered = (id: string) =>
    !draft.answers[id] && !draft.skippedQuestions.includes(id);
  if (savedCount(draft) >= 2 && isUnanswered(PAIR_PRIORITY.id)) {
    return PAIR_PRIORITY;
  }
  if (
    Object.values(draft.possibilities).some((item) => item.openedCount > 0) &&
    isUnanswered(CAREER_ATTRACTION.id)
  ) {
    return CAREER_ATTRACTION;
  }
  if (
    getSavedPossibilities(draft).some((item) => item.meaningfulOpen) &&
    isUnanswered(ACTION_READINESS.id)
  ) {
    return ACTION_READINESS;
  }
  return null;
}

export function getSavedPossibilities(draft: MyPathDraft): PossibilitySignal[] {
  return Object.values(draft.possibilities)
    .filter((item) => item.state === "saved")
    .sort((a, b) => (a.savedAt ?? "").localeCompare(b.savedAt ?? ""));
}
