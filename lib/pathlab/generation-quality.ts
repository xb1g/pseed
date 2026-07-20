import type {
  PathLabGeneratorAssessmentDraft,
  PathLabGeneratorDraft,
  PathLabGeneratorRequest,
  PathLabQualityIssue,
  PathLabQualityResult,
} from "@/types/pathlab-generator";

function pushIssue(
  issues: PathLabQualityIssue[],
  level: "error" | "warning",
  code: string,
  message: string,
  field?: string,
) {
  issues.push({ level, code, message, field });
}

function validateAssessment(
  assessment: PathLabGeneratorAssessmentDraft,
  nodeKey: string,
  issues: PathLabQualityIssue[],
) {
  const field = `nodes.${nodeKey}.assessment`;

  if (assessment.type === "none") {
    return;
  }

  if (assessment.type === "quiz") {
    const questions = assessment.quiz_questions || [];
    if (questions.length === 0) {
      pushIssue(
        issues,
        "error",
        "ASSESSMENT_QUIZ_NO_QUESTIONS",
        "Quiz assessment must include at least one question",
        field,
      );
      return;
    }

    for (const [questionIndex, question] of questions.entries()) {
      if (question.options.length < 2) {
        pushIssue(
          issues,
          "error",
          "ASSESSMENT_QUIZ_OPTIONS",
          "Quiz question must include at least two options",
          `${field}.quiz_questions.${questionIndex}`,
        );
      }

      const correctExists = question.options.some(
        (option) => option.option === question.correct_option,
      );
      if (!correctExists) {
        pushIssue(
          issues,
          "error",
          "ASSESSMENT_QUIZ_CORRECT_OPTION",
          "Quiz question correct option must match one of the provided options",
          `${field}.quiz_questions.${questionIndex}`,
        );
      }
    }
  }

  if (assessment.type === "checklist") {
    const items = assessment.checklist_items || [];
    if (items.length === 0) {
      pushIssue(
        issues,
        "error",
        "ASSESSMENT_CHECKLIST_EMPTY",
        "Checklist assessment must include at least one checklist item",
        field,
      );
    }
  }

  if (assessment.type === "text_answer" || assessment.type === "file_upload") {
    if (!assessment.prompt || !assessment.prompt.trim()) {
      pushIssue(
        issues,
        "error",
        "ASSESSMENT_PROMPT_REQUIRED",
        `${assessment.type} assessment requires a prompt`,
        field,
      );
    }
  }
}

function hasCycle(adjacency: Map<string, string[]>): boolean {
  const visited = new Set<string>();
  const inStack = new Set<string>();

  const visit = (node: string): boolean => {
    if (inStack.has(node)) return true;
    if (visited.has(node)) return false;

    visited.add(node);
    inStack.add(node);

    for (const neighbor of adjacency.get(node) || []) {
      if (visit(neighbor)) return true;
    }

    inStack.delete(node);
    return false;
  };

  for (const node of adjacency.keys()) {
    if (visit(node)) return true;
  }

  return false;
}

/**
 * Returns `true` when `text` contains at least one career-specific indicator:
 * proper nouns (capitalized mid-sentence words), tool / technology names
 * (PascalCase, camelCase, kebab-case, or dotted like `Node.js`), or domain
 * jargon (ALL_CAPS abbreviations, slash-separated terms like `CI/CD`).
 *
 * This is intentionally a loose heuristic — it should catch blatantly generic
 * days without false-flagging normal prose.
 */
function hasCareerSpecificIndicators(text: string): boolean {
  // PascalCase / camelCase identifiers (at least one internal uppercase)
  // e.g. PostgreSQL, camelCase, GraphQL
  if (/[a-z][A-Z]|[A-Z][a-z]+[A-Z]/.test(text)) return true;

  // Dotted tool names like Node.js, D3.js, ASP.NET
  if (/[A-Za-z]+\.[a-z]{1,4}\b/.test(text)) return true;

  // kebab-case multi-word identifiers (tool/framework names)
  // e.g. vue-router, react-dom, scikit-learn
  if (/[a-z]+-[a-z]+-?[a-z]*/.test(text)) return true;

  // ALL_CAPS abbreviations (3+ letters), e.g. SQL, API, HTML, CI/CD
  if (/\b[A-Z]{3,}\b/.test(text)) return true;

  // Slash-separated domain terms like CI/CD, B2B/B2C
  if (/\b[A-Za-z0-9]+\/[A-Za-z0-9]+\b/.test(text)) return true;

  // Proper nouns: capitalized words that are NOT sentence-initial.
  // We split into sentences and check for mid-sentence capitalized words.
  const sentences = text.split(/[.!?]\s+/);
  for (const sentence of sentences) {
    const words = sentence.trim().split(/\s+/);
    // Skip the first word of each sentence, check the rest
    for (let i = 1; i < words.length; i++) {
      const word = words[i].replace(/[^A-Za-z]/g, "");
      if (word.length >= 2 && /^[A-Z][a-z]/.test(word)) return true;
    }
  }

  return false;
}

/**
 * §4.1 Swap test: for each day, collect all its text and check for at least one
 * career-specific indicator. A day with zero indicators is blatantly generic.
 */
function checkEditorialSwapTest(
  draft: PathLabGeneratorDraft,
  issues: PathLabQualityIssue[],
): void {
  const nodesByKey = new Map(draft.nodes.map((n) => [n.key, n]));

  for (const day of draft.days) {
    const textParts: string[] = [];

    // Day-level text
    if (day.context_text) textParts.push(day.context_text);
    for (const prompt of day.reflection_prompts) {
      textParts.push(prompt);
    }

    // Node-level text for this day's assigned nodes
    for (const nodeKey of day.node_keys) {
      const node = nodesByKey.get(nodeKey);
      if (!node) continue;

      if (node.instructions) textParts.push(node.instructions);
      for (const content of node.content) {
        if (content.body) textParts.push(content.body);
      }
    }

    const combinedText = textParts.join(" ");
    if (combinedText.trim().length > 0 && !hasCareerSpecificIndicators(combinedText)) {
      pushIssue(
        issues,
        "warning",
        "EDITORIAL_SWAP_TEST",
        `Day ${day.day_number} contains no career-specific indicators and may be too generic (§4.1 swap test)`,
        `days.${day.day_number}`,
      );
    }
  }
}

/**
 * §4.2 Honesty tax: when mundane-but-required items are provided, at least one
 * must appear somewhere in the node content. If none do, the PathLab is hiding
 * the boring parts of the career.
 */
function checkEditorialHonestyTax(
  draft: PathLabGeneratorDraft,
  request: Pick<PathLabGeneratorRequest, "expertContext"> | undefined,
  issues: PathLabQualityIssue[],
): void {
  const mundaneItems = request?.expertContext?.careerTruths?.mundaneButRequired;
  if (!mundaneItems || mundaneItems.length === 0) return;

  // Build a single corpus from all node text
  const allNodeText = draft.nodes
    .flatMap((node) => [
      node.instructions,
      ...node.content.map((c) => c.body ?? ""),
    ])
    .join(" ")
    .toLowerCase();

  const anyMundaneReferenced = mundaneItems.some((item) =>
    allNodeText.includes(item.toLowerCase()),
  );

  if (!anyMundaneReferenced) {
    pushIssue(
      issues,
      "warning",
      "EDITORIAL_HONESTY_TAX",
      "No mundane-but-required items from the expert context appear in any node — the PathLab may hide the boring parts of the career (§4.2 honesty tax)",
      "nodes",
    );
  }
}

export function validatePathLabDraft(
  draft: PathLabGeneratorDraft,
  request?: Pick<PathLabGeneratorRequest, "expertContext">,
): PathLabQualityResult {
  const issues: PathLabQualityIssue[] = [];

  const expectedTotalDays = draft.path.total_days;
  const days = [...draft.days].sort((a, b) => a.day_number - b.day_number);
  const nodesByKey = new Map(draft.nodes.map((node) => [node.key, node]));

  if (days.length !== expectedTotalDays) {
    pushIssue(
      issues,
      "error",
      "DAY_COUNT_MISMATCH",
      `Expected ${expectedTotalDays} days but got ${days.length}`,
      "path.total_days",
    );
  }

  for (let i = 0; i < days.length; i += 1) {
    const expectedDayNumber = i + 1;
    if (days[i].day_number !== expectedDayNumber) {
      pushIssue(
        issues,
        "error",
        "DAY_NUMBER_SEQUENCE",
        `Day numbers must be continuous from 1..N (found ${days[i].day_number} at index ${i})`,
        `days.${i}.day_number`,
      );
    }

    if (!days[i].reflection_prompts.length) {
      pushIssue(
        issues,
        "error",
        "DAY_REFLECTION_REQUIRED",
        `Day ${days[i].day_number} must include at least one reflection prompt`,
        `days.${i}.reflection_prompts`,
      );
    }

    if (!days[i].node_keys.length) {
      pushIssue(
        issues,
        "error",
        "DAY_NODE_REQUIRED",
        `Day ${days[i].day_number} must include at least one node`,
        `days.${i}.node_keys`,
      );
    }

    if (days[i].node_keys.length > 8) {
      pushIssue(
        issues,
        "warning",
        "DAY_NODE_OVERLOAD",
        `Day ${days[i].day_number} has ${days[i].node_keys.length} nodes; pacing may be too heavy`,
        `days.${i}.node_keys`,
      );
    }
  }

  const referencedNodeKeys = new Set<string>();
  for (const [dayIndex, day] of days.entries()) {
    for (const key of day.node_keys) {
      referencedNodeKeys.add(key);
      if (!nodesByKey.has(key)) {
        pushIssue(
          issues,
          "error",
          "DAY_NODE_KEY_NOT_FOUND",
          `Day ${day.day_number} references unknown node key: ${key}`,
          `days.${dayIndex}.node_keys`,
        );
      }
    }
  }

  for (const node of draft.nodes) {
    if (!referencedNodeKeys.has(node.key)) {
      pushIssue(
        issues,
        "error",
        "NODE_ORPHAN",
        `Node ${node.key} is never assigned to a day`,
        `nodes.${node.key}`,
      );
    }

    validateAssessment(node.assessment, node.key, issues);
  }

  const adjacency = new Map<string, string[]>();
  for (const node of draft.nodes) {
    adjacency.set(node.key, []);
  }

  for (const [edgeIndex, edge] of draft.edges.entries()) {
    if (!nodesByKey.has(edge.source_key) || !nodesByKey.has(edge.destination_key)) {
      pushIssue(
        issues,
        "error",
        "EDGE_NODE_KEY_NOT_FOUND",
        `Edge ${edge.source_key} -> ${edge.destination_key} references unknown node key`,
        `edges.${edgeIndex}`,
      );
      continue;
    }

    if (edge.source_key === edge.destination_key) {
      pushIssue(
        issues,
        "error",
        "EDGE_SELF_LOOP",
        `Edge ${edge.source_key} cannot point to itself`,
        `edges.${edgeIndex}`,
      );
      continue;
    }

    adjacency.get(edge.source_key)?.push(edge.destination_key);
  }

  if (hasCycle(adjacency)) {
    pushIssue(
      issues,
      "error",
      "GRAPH_CYCLE_DETECTED",
      "Node graph must be acyclic (DAG)",
      "edges",
    );
  }

  const assessedNodes = draft.nodes.filter((node) => node.assessment.type !== "none").length;
  if (assessedNodes === 0) {
    pushIssue(
      issues,
      "warning",
      "ASSESSMENT_NONE",
      "No assessments were generated; consider adding at least a few checks for understanding",
      "nodes",
    );
  }

  // Editorial checks (§4 anti-generic rules)
  checkEditorialSwapTest(draft, issues);
  checkEditorialHonestyTax(draft, request, issues);

  const errors = issues.filter((issue) => issue.level === "error");
  const warnings = issues.filter((issue) => issue.level === "warning");

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    issues,
  };
}
