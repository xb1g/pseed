import { z } from "zod";

const slugKeySchema = z
  .string()
  .min(2)
  .max(64)
  .regex(/^[a-zA-Z0-9_-]+$/, "must be a slug-like key");

const contentSchema = z
  .object({
    content_type: z.enum([
      "text",
      "video",
      "canva_slide",
      "image",
      "pdf",
      "resource_link",
    ]),
    content_title: z.string().max(140).optional().nullable(),
    content_body: z.string().max(12_000).optional().nullable(),
    content_url: z.string().url().max(2_000).optional().nullable(),
  })
  .refine(
    (content) => Boolean(content.content_body?.trim() || content.content_url),
    { message: "content_body or content_url is required" },
  );

const quizQuestionSchema = z.object({
  question_text: z.string().min(5).max(500),
  options: z
    .array(
      z.object({
        option: z.string().min(1).max(8),
        text: z.string().min(1).max(300),
      }),
    )
    .min(2)
    .max(6),
  correct_option: z.string().min(1).max(8),
});

const commonAssessmentFields = {
  isGraded: z.boolean().default(false),
  pointsPossible: z.number().int().min(0).max(500).default(0),
};

const assessmentSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("quiz"),
    prompt: z.string().max(2_000).optional().nullable(),
    quiz_questions: z.array(quizQuestionSchema).min(1).max(10),
    ...commonAssessmentFields,
  }),
  z.object({
    type: z.enum(["text_answer", "file_upload", "image_upload"]),
    prompt: z.string().min(1).max(2_000),
    ...commonAssessmentFields,
  }),
  z.object({
    type: z.literal("checklist"),
    prompt: z.string().max(2_000).optional().nullable(),
    checklist_items: z.array(z.string().min(1).max(300)).min(1).max(20),
    ...commonAssessmentFields,
  }),
]);

const nodeSchema = z.object({
  key: slugKeySchema,
  title: z.string().min(2).max(140),
  instructions: z.string().min(8).max(5_000),
  node_type: z.enum(["learning", "text", "comment", "end"]).default("learning"),
  position: z.object({
    x: z.number().finite().min(-10_000).max(10_000),
    y: z.number().finite().min(-10_000).max(10_000),
  }),
  difficulty: z.number().int().min(1).max(10).default(1),
  content: z.array(contentSchema).min(1).max(8),
  assessment: assessmentSchema.optional().nullable(),
});

const connectionSchema = z.object({
  from: slugKeySchema,
  to: slugKeySchema,
});

export const microPathLabMapImportSchema = z
  .object({
    map: z.object({
      title: z.string().min(3).max(140),
      description: z.string().min(20).max(6_000),
      difficulty: z.number().int().min(1).max(10).default(1),
      estimatedMinutes: z.number().int().min(5).max(45),
      visibility: z.enum(["public", "private"]).default("public"),
      metadata: z.record(z.unknown()).optional().default({}),
    }),
    nodes: z.array(nodeSchema).min(2).max(8),
    connections: z.array(connectionSchema).min(1).max(20),
  })
  .superRefine((payload, context) => {
    const keys = payload.nodes.map((node) => node.key);
    const keySet = new Set(keys);

    if (keySet.size !== keys.length) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["nodes"],
        message: "node keys must be unique",
      });
    }

    const adjacency = new Map(keys.map((key) => [key, [] as string[]]));
    const edgeSet = new Set<string>();
    for (const [index, connection] of payload.connections.entries()) {
      if (!keySet.has(connection.from) || !keySet.has(connection.to)) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["connections", index],
          message: "connection references an unknown node key",
        });
        continue;
      }

      if (connection.from === connection.to) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["connections", index],
          message: "connection cannot point to itself",
        });
        continue;
      }

      const edgeKey = `${connection.from}->${connection.to}`;
      if (edgeSet.has(edgeKey)) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["connections", index],
          message: "connection is duplicated",
        });
      }
      edgeSet.add(edgeKey);
      adjacency.get(connection.from)?.push(connection.to);
    }

    const visited = new Set<string>();
    const stack = new Set<string>();
    const hasCycleFrom = (key: string): boolean => {
      if (stack.has(key)) return true;
      if (visited.has(key)) return false;
      visited.add(key);
      stack.add(key);
      for (const destination of adjacency.get(key) || []) {
        if (hasCycleFrom(destination)) return true;
      }
      stack.delete(key);
      return false;
    };

    if (keys.some(hasCycleFrom)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["connections"],
        message: "node graph must be acyclic",
      });
    }

    const reachable = new Set<string>();
    const queue = keys.length ? [keys[0]] : [];
    while (queue.length) {
      const key = queue.shift();
      if (!key || reachable.has(key)) continue;
      reachable.add(key);
      queue.push(...(adjacency.get(key) || []));
    }
    const unreachable = keys.filter((key) => !reachable.has(key));
    if (unreachable.length) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["connections"],
        message: `nodes must be reachable from ${keys[0]}: ${unreachable.join(", ")}`,
      });
    }

    payload.nodes.forEach((node, nodeIndex) => {
      if (node.assessment?.type !== "quiz") return;
      node.assessment.quiz_questions.forEach((question, questionIndex) => {
        const options = question.options.map((option) => option.option);
        if (new Set(options).size !== options.length) {
          context.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["nodes", nodeIndex, "assessment", "quiz_questions", questionIndex, "options"],
            message: "quiz option keys must be unique",
          });
        }
        if (!options.includes(question.correct_option)) {
          context.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["nodes", nodeIndex, "assessment", "quiz_questions", questionIndex, "correct_option"],
            message: "correct_option must match one of the option keys",
          });
        }
      });
    });

    const hasStudentOutput = payload.nodes.some((node) =>
      node.assessment && node.assessment.type !== "quiz",
    );
    if (!hasStudentOutput) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["nodes"],
        message: "at least one node must capture a non-quiz student output",
      });
    }

    const finalNode = payload.nodes[payload.nodes.length - 1];
    const finalText = [
      finalNode.instructions,
      ...finalNode.content.flatMap((content) => [
        content.content_title,
        content.content_body,
      ]),
      finalNode.assessment?.prompt,
      ...(finalNode.assessment?.type === "checklist"
        ? finalNode.assessment.checklist_items
        : []),
    ]
      .filter(Boolean)
      .join(" ");

    if (!/continue\s*\/\s*pause\s*\/\s*quit/i.test(finalText)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["nodes", payload.nodes.length - 1],
        message: "final node must explicitly ask for Continue / Pause / Quit",
      });
    }
  });

export type MicroPathLabMapImport = z.infer<typeof microPathLabMapImportSchema>;

export function buildAssessmentMetadata(
  assessment: NonNullable<MicroPathLabMapImport["nodes"][number]["assessment"]>,
): Record<string, unknown> | null {
  if (assessment.type === "checklist") {
    return {
      ...(assessment.prompt ? { prompt: assessment.prompt } : {}),
      checklist_items: assessment.checklist_items,
    };
  }

  return assessment.prompt ? { prompt: assessment.prompt } : null;
}
