import {
  buildAssessmentMetadata,
  microPathLabMapImportSchema,
} from "../micro-pathlab-import";

function validPayload() {
  return {
    map: {
      title: "The Wet Stage Call",
      description: "A ten-minute entertainment-law simulation for high-school learners.",
      difficulty: 1,
      estimatedMinutes: 10,
      visibility: "public",
      metadata: { tags: ["law", "english"] },
    },
    nodes: [
      {
        key: "choose_clause",
        title: "Choose the clause",
        instructions: "Compare Clause A and Clause B, then choose the stronger basis.",
        node_type: "learning",
        position: { x: 100, y: 100 },
        difficulty: 1,
        content: [{ content_type: "text", content_body: "Clause A and Clause B." }],
        assessment: {
          type: "quiz",
          isGraded: false,
          pointsPossible: 0,
          quiz_questions: [
            {
              question_text: "Which clause supports suspension?",
              options: [
                { option: "A", text: "Clause A" },
                { option: "B", text: "Clause B" },
              ],
              correct_option: "B",
            },
          ],
        },
      },
      {
        key: "decide_fit",
        title: "Decide your fit",
        instructions: "Choose Continue / Pause / Quit and explain your felt response.",
        node_type: "end",
        position: { x: 380, y: 100 },
        difficulty: 1,
        content: [{ content_type: "text", content_body: "Every decision is valid." }],
        assessment: {
          type: "text_answer",
          prompt: "Choose one option and give one reason.",
          isGraded: false,
          pointsPossible: 0,
        },
      },
    ],
    connections: [{ from: "choose_clause", to: "decide_fit" }],
  };
}

describe("microPathLabMapImportSchema", () => {
  it("accepts a standalone map payload for app/map/[id]", () => {
    const result = microPathLabMapImportSchema.safeParse(validPayload());
    expect(result.success).toBe(true);
  });

  it("rejects seed/path payloads and disconnected nodes", () => {
    const payload = validPayload();
    payload.nodes.push({
      ...payload.nodes[1],
      key: "orphan",
      title: "Orphan node",
      position: { x: 660, y: 100 },
    });

    const result = microPathLabMapImportSchema.safeParse(payload);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((issue) => issue.message.includes("reachable"))).toBe(true);
    }
  });

  it("rejects a final node without the explicit fit decision", () => {
    const payload = validPayload();
    payload.nodes[1].instructions = "Write one sentence about the activity.";

    const result = microPathLabMapImportSchema.safeParse(payload);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((issue) => issue.message.includes("Continue / Pause / Quit"))).toBe(true);
    }
  });

  it("stores checklist items under the key read by MapViewer", () => {
    expect(
      buildAssessmentMetadata({
        type: "checklist",
        prompt: "Check your work",
        checklist_items: ["Used the clause wording"],
        isGraded: false,
        pointsPossible: 0,
      }),
    ).toEqual({
      prompt: "Check your work",
      checklist_items: ["Used the clause wording"],
    });
  });
});
