export type PlanningFacet =
  | "analytical"
  | "autonomy"
  | "creativity"
  | "flexibility"
  | "growth"
  | "helping"
  | "human-contact"
  | "income"
  | "innovation"
  | "stability";

export type PossibilityState =
  | "explored"
  | "saved"
  | "dismissed"
  | "removed";

export type JourneyEventType =
  | "entry_viewed"
  | "career_opened"
  | "career_meaningful_open"
  | "radar_profile_opened"
  | "career_compared"
  | "career_saved"
  | "career_dismissed"
  | "career_removed"
  | "question_answered"
  | "question_skipped"
  | "direction_edited"
  | "direction_rejected"
  | "question_saved"
  | "step_started"
  | "step_completed"
  | "step_not_useful";

export interface JourneyEvent {
  id: string;
  type: JourneyEventType;
  occurredAt: string;
  careerSlug?: string;
  comparisonSlugs?: [string, string];
  questionId?: string;
  answerId?: string;
  reason?: string;
  stepId?: string;
  metadata?: Record<string, string | number | boolean | null>;
}

export interface PossibilitySignal {
  slug: string;
  state: PossibilityState;
  openedCount: number;
  meaningfulOpen: boolean;
  radarOpened: boolean;
  compared: boolean;
  savedAt?: string;
  removedReason?: string;
  updatedAt: string;
}

export interface SavedQuestion {
  id: string;
  text: string;
  careerSlugs: string[];
  status: "open" | "answered";
}

export interface MyPathDraft {
  version: 1;
  draftId: string;
  entryKey: string;
  createdAt: string;
  updatedAt: string;
  expiresAt: string;
  directionOverride?: string;
  rejectedDirections: string[];
  possibilities: Record<string, PossibilitySignal>;
  answers: Record<string, string>;
  skippedQuestions: string[];
  savedQuestions: SavedQuestion[];
  events: JourneyEvent[];
}

export interface PlanningRegistryItem {
  slug: string;
  family: string;
  titleTh: string;
  titleEn: string;
  facets: PlanningFacet[];
  capabilities: string[];
  adjacent: string[];
  contrast: string[];
  reelAffinity: string[];
  pathLabHref?: string;
}

export type PlanningRegistry = Record<string, PlanningRegistryItem>;

export interface ContextualQuestion {
  id: "career-attraction" | "pair-priority" | "action-readiness";
  prompt: string;
  options: Array<{ id: string; label: string; facet?: PlanningFacet }>;
}

export interface DirectionHypothesis {
  statement: string;
  facets: PlanningFacet[];
  disclaimer: string;
  enoughSignal: boolean;
}

export type RecommendationLaneId =
  | "strong-signal"
  | "worth-comparing"
  | "unexpected";

export interface RecommendationLane {
  id: RecommendationLaneId;
  title: string;
  recommendation: {
    slug: string;
    reason: string;
  };
}

export interface NextStep {
  id: string;
  kind:
    | "understand-career"
    | "compare-careers"
    | "answer-question"
    | "radar-reflection"
    | "lightweight-activity"
    | "pathlab"
    | "review-direction";
  title: string;
  detail: string;
  href?: string;
  pathLabHref?: string;
  durationMinutes: number;
  careerSlugs: string[];
}

export interface PlanEntry {
  key: string;
  title: string;
  subtitle: string;
  reassurance: string;
  initialSlugs: string[];
  comparison: [string, string] | null;
}
