import { z } from "zod";

export const workAreaSchema = z.enum(["marketing", "product", "program", "research"]);
export const workKindSchema = z.enum(["content", "bet", "task", "experiment", "evidence"]);
export const workStatusSchema = z.enum([
  "idea",
  "draft",
  "ready",
  "published",
  "decide",
  "validate",
  "build",
  "learn",
  "done",
  "archived",
]);
export const funnelStageSchema = z.enum(["tofu", "mofu", "bofu"]);
export const contentChannelSchema = z.enum(["instagram", "facebook", "both"]);
export const funnelOfferSchema = z.enum(["techseed", "shift", "both"]);

const optionalDateSchema = z
  .union([z.string().regex(/^\d{4}-\d{2}-\d{2}$/), z.null()])
  .optional();

const workItemBaseSchema = z.object({
    area: workAreaSchema,
    kind: workKindSchema,
    title: z.string().trim().min(1).max(160),
    description: z.string().trim().max(1200).default(""),
    status: workStatusSchema,
    funnelStage: funnelStageSchema.nullable().optional(),
    channel: contentChannelSchema.nullable().optional(),
    offer: funnelOfferSchema.nullable().optional(),
    ownerName: z.string().trim().min(1).max(80).default("Unassigned"),
    dueOn: optionalDateSchema,
    position: z.number().int().min(0).max(1_000_000).default(0),
    details: z.record(z.string(), z.string().max(1200)).default({}),
  });

export const workItemInputSchema = workItemBaseSchema.superRefine((value, context) => {
    if (value.area === "marketing") {
      if (value.kind !== "content") {
        context.addIssue({ code: "custom", path: ["kind"], message: "Marketing items must be content." });
      }
      if (!value.funnelStage || !value.channel || !value.offer) {
        context.addIssue({ code: "custom", path: ["funnelStage"], message: "Marketing content needs a funnel stage, channel, and offer." });
      }
      if (!["idea", "draft", "ready", "published", "archived"].includes(value.status)) {
        context.addIssue({ code: "custom", path: ["status"], message: "Invalid marketing status." });
      }
    }

    if (value.area === "product") {
      if (value.kind !== "bet") {
        context.addIssue({ code: "custom", path: ["kind"], message: "Product items must be bets." });
      }
      if (!["decide", "validate", "build", "learn", "done", "archived"].includes(value.status)) {
        context.addIssue({ code: "custom", path: ["status"], message: "Invalid product status." });
      }
    }
  });

export const workItemPatchSchema = workItemBaseSchema
  .omit({ area: true, kind: true })
  .partial()
  .extend({ id: z.string().uuid() });

export type WorkArea = z.infer<typeof workAreaSchema>;
export type WorkKind = z.infer<typeof workKindSchema>;
export type WorkStatus = z.infer<typeof workStatusSchema>;
export type WorkItemInput = z.infer<typeof workItemInputSchema>;
export type WorkItemPatch = z.infer<typeof workItemPatchSchema>;

export interface WorkItem extends WorkItemInput {
  id: string;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export type WorkPersistenceState = "loading" | "connected" | "setup-required" | "error";

export function isWorkspaceTableMissing(error: { code?: string; message?: string } | null) {
  return error?.code === "42P01" || Boolean(error?.message?.includes("work_items"));
}
