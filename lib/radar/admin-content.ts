import { z } from "zod";

const requiredText = z.string().trim().min(1).max(500);
const optionalText = z.string().trim().max(2_000).optional();
const stableId = z.string().trim().min(1).max(80).regex(/^[a-z0-9][a-z0-9-]*$/);

export const bilingualTextSchema = z.object({
  th: requiredText,
  en: requiredText,
});

const bilingualParagraphsSchema = z.object({
  th: z.array(requiredText).min(1).max(20),
  en: z.array(requiredText).min(1).max(20),
});

const fieldMetadataSchema = z.object({
  slug: stableId,
  name: bilingualTextSchema,
  tagline: bilingualTextSchema,
  emoji: z.string().trim().min(1).max(16),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
});

const metricSchema = z.object({
  key: stableId,
  value: requiredText,
  unit: requiredText,
  label: bilingualTextSchema,
  explanation: bilingualTextSchema,
  interpretation: bilingualTextSchema,
  geography: requiredText,
  observedAt: z.string().date(),
  confidence: z.enum(["low", "medium", "high"]),
  sourceUrl: z.string().url(),
});

const cardSchema = z.object({
  id: stableId,
  kind: z.enum(["text", "metric", "story", "reflection", "recommendation"]),
  position: z.number().int().min(0),
  title: bilingualTextSchema,
  body: bilingualParagraphsSchema,
  hidden: z.boolean(),
});

const skillSchema = z.object({
  id: stableId,
  name: bilingualTextSchema,
  description: bilingualTextSchema,
  level: z.enum(["foundation", "working", "advanced"]),
});

const recommendationSchema = z
  .object({
    id: stableId,
    type: z.enum(["youtube", "resource", "course", "pathlab", "project", "community"]),
    title: bilingualTextSchema,
    description: bilingualTextSchema,
    url: z.string().url(),
    intentCta: bilingualTextSchema,
    duration: z.string().trim().max(40).optional(),
    cost: z.string().trim().max(40).optional(),
    note: optionalText,
  })
  .superRefine((recommendation, context) => {
    if (recommendation.type !== "youtube") return;

    const hostname = new URL(recommendation.url).hostname.toLowerCase();
    if (
      hostname !== "youtube.com" &&
      hostname !== "www.youtube.com" &&
      hostname !== "youtu.be"
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["url"],
        message: "YouTube recommendations must use a youtube.com or youtu.be URL",
      });
    }
  });

function addUniqueIdIssue(
  items: Array<{ id?: string; key?: string }>,
  path: string,
  context: z.RefinementCtx
) {
  const seen = new Set<string>();
  items.forEach((item, index) => {
    const value = item.id ?? item.key;
    if (!value || !seen.has(value)) {
      if (value) seen.add(value);
      return;
    }
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: [path, index, item.id ? "id" : "key"],
      message: "Stable identifiers must be unique",
    });
  });
}

export const radarContentDraftSchema = z
  .object({
    field: fieldMetadataSchema,
    tags: z.array(requiredText).max(20),
    metrics: z.array(metricSchema).max(20),
    cards: z.array(cardSchema).max(40),
    skills: z.array(skillSchema).max(30),
    startRecommendations: z.array(recommendationSchema).max(20),
  })
  .superRefine((draft, context) => {
    addUniqueIdIssue(draft.metrics, "metrics", context);
    addUniqueIdIssue(draft.cards, "cards", context);
    addUniqueIdIssue(draft.skills, "skills", context);
    addUniqueIdIssue(draft.startRecommendations, "startRecommendations", context);
  });

export type RadarContentDraft = z.infer<typeof radarContentDraftSchema>;
