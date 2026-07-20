import { z } from "zod";

const isoTimestamp = z.string().datetime({ offset: true });
const slug = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(80);
const safeId = z.string().min(6).max(128).regex(/^[A-Za-z0-9._:-]+$/);

export const journeyEventTypeSchema = z.enum([
  "entry_viewed",
  "career_opened",
  "career_meaningful_open",
  "radar_profile_opened",
  "career_compared",
  "career_saved",
  "career_dismissed",
  "career_removed",
  "question_answered",
  "question_skipped",
  "direction_edited",
  "direction_rejected",
  "question_saved",
  "step_started",
  "step_completed",
  "step_not_useful",
  "pathlab_selected",
  "pathlab_deselected",
]);

const metadataValueSchema = z.union([
  z.string().max(500),
  z.number().finite(),
  z.boolean(),
  z.null(),
]);

export const journeyEventSchema = z.object({
  id: safeId,
  type: journeyEventTypeSchema,
  occurredAt: isoTimestamp,
  careerSlug: slug.optional(),
  comparisonSlugs: z.tuple([slug, slug]).optional(),
  questionId: z.string().min(1).max(80).optional(),
  answerId: z.string().min(1).max(80).optional(),
  reason: z.string().max(500).optional(),
  stepId: z.string().min(1).max(160).optional(),
  metadata: z.record(metadataValueSchema).optional(),
});

const possibilitySchema = z.object({
  slug,
  state: z.enum(["explored", "saved", "dismissed", "removed"]),
  openedCount: z.number().int().min(0).max(1000),
  meaningfulOpen: z.boolean(),
  radarOpened: z.boolean(),
  compared: z.boolean(),
  savedAt: isoTimestamp.optional(),
  removedReason: z.string().max(200).optional(),
  updatedAt: isoTimestamp,
});

const savedQuestionSchema = z.object({
  id: safeId,
  text: z.string().min(1).max(280),
  careerSlugs: z.array(slug).max(2),
  status: z.enum(["open", "answered"]),
});

export const myPathDraftSchema = z
  .object({
    version: z.literal(1),
    draftId: safeId,
    entryKey: z.string().min(1).max(80),
    createdAt: isoTimestamp,
    updatedAt: isoTimestamp,
    expiresAt: isoTimestamp,
    directionOverride: z.string().max(280).optional(),
    rejectedDirections: z.array(z.string().max(280)).max(20),
    possibilities: z.record(possibilitySchema),
    answers: z.record(z.string().max(80)),
    skippedQuestions: z.array(z.string().max(80)).max(20),
    savedQuestions: z.array(savedQuestionSchema).max(20),
    events: z.array(journeyEventSchema).max(200),
  })
  .superRefine((draft, context) => {
    if (Object.keys(draft.possibilities).length > 30) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "A draft can contain at most 30 possibilities",
        path: ["possibilities"],
      });
    }
    const saved = Object.values(draft.possibilities).filter(
      (item) => item.state === "saved"
    ).length;
    if (saved > 3) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "A path can contain at most three active saved possibilities",
        path: ["possibilities"],
      });
    }
  });

export const myPathMutationSchema = z.object({
  operation: z.enum(["import", "sync"]),
  draft: myPathDraftSchema,
});

const anonymousEventTypes = z.enum([
  "reel_entry_viewed",
  "career_preview_opened",
  "radar_profile_opened",
  "micro_question_answered",
  "micro_question_skipped",
  "career_compared",
  "career_saved",
  "career_dismissed",
  "career_removed",
  "next_step_started",
  "next_step_completed",
  "pathlab_handoff_clicked",
  "wizard_step_viewed",
  "pathlab_selected",
  "pathlab_deselected",
  "goal_locked",
  "mission_plan_viewed",
]);

export const anonymousEventSchema = z
  .object({
    sessionId: safeId.min(8),
    eventType: anonymousEventTypes,
    careerSlug: slug.optional(),
    metadata: z.record(metadataValueSchema).default({}),
  })
  .refine((value) => JSON.stringify(value.metadata).length <= 2048, {
    message: "Analytics metadata is too large",
    path: ["metadata"],
  });

export type MyPathMutationInput = z.infer<typeof myPathMutationSchema>;
export type AnonymousEventInput = z.infer<typeof anonymousEventSchema>;
