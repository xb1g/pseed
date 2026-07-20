import { validatePathLabDraft } from "../generation-quality";
import type {
  PathLabGeneratorDayDraft,
  PathLabGeneratorDraft,
  PathLabGeneratorNodeDraft,
  PathLabGeneratorRequest,
} from "@/types/pathlab-generator";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Creates a minimal valid node with the given key and text content. */
function makeNode(
  key: string,
  overrides: Partial<Pick<PathLabGeneratorNodeDraft, "instructions" | "content">> = {},
): PathLabGeneratorNodeDraft {
  return {
    key,
    title: `Node ${key}`,
    instructions: overrides.instructions ?? "Complete the activity.",
    difficulty: "beginner",
    content: overrides.content ?? [{ type: "text", body: "Read this material." }],
    assessment: { type: "none" },
  };
}

/** Creates a minimal valid day. */
function makeDay(
  dayNumber: number,
  nodeKeys: string[],
  overrides: Partial<Pick<PathLabGeneratorDayDraft, "context_text" | "reflection_prompts">> = {},
): PathLabGeneratorDayDraft {
  return {
    day_number: dayNumber,
    context_text: overrides.context_text ?? "Today you will explore general concepts.",
    reflection_prompts: overrides.reflection_prompts ?? ["What did you learn?"],
    node_keys: nodeKeys,
  };
}

/**
 * Builds a structurally valid 5-day draft with one node per day and a linear
 * DAG (node_1 → node_2 → … → node_5). By default all text is deliberately
 * generic (no career-specific indicators) so editorial checks fire.
 */
function buildMinimalDraft(
  overrides?: Partial<{
    days: PathLabGeneratorDayDraft[];
    nodes: PathLabGeneratorNodeDraft[];
  }>,
): PathLabGeneratorDraft {
  const defaultNodes = Array.from({ length: 5 }, (_, i) => makeNode(`node_${i + 1}`));
  const defaultDays = Array.from({ length: 5 }, (_, i) =>
    makeDay(i + 1, [`node_${i + 1}`]),
  );

  const nodes = overrides?.nodes ?? defaultNodes;
  const days = overrides?.days ?? defaultDays;

  // Linear DAG edges from the node list
  const edges = nodes.slice(0, -1).map((n, i) => ({
    source_key: n.key,
    destination_key: nodes[i + 1].key,
  }));

  return {
    seed: {
      title: "Test PathLab",
      slogan: "A test path",
      description: "A test description",
      category_name: "Testing",
    },
    path: { total_days: days.length },
    days,
    nodes,
    edges,
  };
}

// ---------------------------------------------------------------------------
// EDITORIAL_SWAP_TEST (§4.1)
// ---------------------------------------------------------------------------

describe("EDITORIAL_SWAP_TEST", () => {
  it("warns when a day is entirely generic with no career-specific indicators", () => {
    const draft = buildMinimalDraft();
    const result = validatePathLabDraft(draft);

    const swapWarnings = result.warnings.filter((w) => w.code === "EDITORIAL_SWAP_TEST");
    expect(swapWarnings.length).toBeGreaterThan(0);
  });

  it("does NOT warn for a day containing tool names like Figma or PostgreSQL", () => {
    const specificNode = makeNode("node_1", {
      instructions: "Open Figma and create a wireframe for the checkout flow.",
      content: [{ type: "text", body: "Use PostgreSQL to query the user table." }],
    });

    const draft = buildMinimalDraft({
      nodes: [
        specificNode,
        ...Array.from({ length: 4 }, (_, i) =>
          makeNode(`node_${i + 2}`, {
            instructions: `Use React and TypeScript to build component ${i + 2}.`,
          }),
        ),
      ],
    });

    const result = validatePathLabDraft(draft);

    const swapWarnings = result.warnings.filter((w) => w.code === "EDITORIAL_SWAP_TEST");
    expect(swapWarnings).toHaveLength(0);
  });

  it("detects PascalCase identifiers as career-specific", () => {
    const node = makeNode("node_1", {
      instructions: "Configure the GraphQL schema for the endpoint.",
    });

    const draft = buildMinimalDraft({
      days: [makeDay(1, ["node_1"]), ...Array.from({ length: 4 }, (_, i) =>
        makeDay(i + 2, [`node_${i + 2}`], {
          context_text: "Today you will explore React components.",
        }),
      )],
      nodes: [
        node,
        ...Array.from({ length: 4 }, (_, i) =>
          makeNode(`node_${i + 2}`, {
            instructions: "Use NextJS to build the interface.",
          }),
        ),
      ],
    });

    const result = validatePathLabDraft(draft);
    const day1Warnings = result.warnings.filter(
      (w) => w.code === "EDITORIAL_SWAP_TEST" && w.field === "days.1",
    );
    expect(day1Warnings).toHaveLength(0);
  });

  it("detects ALL_CAPS abbreviations as career-specific", () => {
    const node = makeNode("node_1", {
      instructions: "Write SQL queries to extract the monthly report data.",
    });
    const day = makeDay(1, ["node_1"]);

    const draft = buildMinimalDraft({
      days: [day, ...Array.from({ length: 4 }, (_, i) =>
        makeDay(i + 2, [`node_${i + 2}`]),
      )],
      nodes: [node, ...Array.from({ length: 4 }, (_, i) => makeNode(`node_${i + 2}`))],
    });

    const result = validatePathLabDraft(draft);
    const day1Warnings = result.warnings.filter(
      (w) => w.code === "EDITORIAL_SWAP_TEST" && w.field === "days.1",
    );
    expect(day1Warnings).toHaveLength(0);
  });

  it("detects proper nouns mid-sentence as career-specific", () => {
    const day = makeDay(1, ["node_1"], {
      context_text: "Today you will prepare a brief for Deloitte's consulting team.",
    });
    const draft = buildMinimalDraft({
      days: [day, ...Array.from({ length: 4 }, (_, i) =>
        makeDay(i + 2, [`node_${i + 2}`]),
      )],
    });

    const result = validatePathLabDraft(draft);
    const day1Warnings = result.warnings.filter(
      (w) => w.code === "EDITORIAL_SWAP_TEST" && w.field === "days.1",
    );
    expect(day1Warnings).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// EDITORIAL_HONESTY_TAX (§4.2)
// ---------------------------------------------------------------------------

describe("EDITORIAL_HONESTY_TAX", () => {
  const requestWithMundane: Pick<PathLabGeneratorRequest, "expertContext"> = {
    expertContext: {
      identity: {
        name: "Jane Doe",
        title: "Senior Engineer",
        company: "Acme",
        field: "Software",
        role: "Backend",
      },
      careerTruths: {
        mundaneButRequired: ["writing documentation", "code review"],
      },
    },
  };

  it("warns when no mundane items appear anywhere in the nodes", () => {
    const draft = buildMinimalDraft();
    const result = validatePathLabDraft(draft, requestWithMundane);

    const honestyWarnings = result.warnings.filter(
      (w) => w.code === "EDITORIAL_HONESTY_TAX",
    );
    expect(honestyWarnings).toHaveLength(1);
  });

  it("does NOT warn when at least one mundane item appears in node content", () => {
    const nodeWithMundane = makeNode("node_3", {
      content: [
        {
          type: "text",
          body: "Spend the next hour writing documentation for the API endpoints you built yesterday.",
        },
      ],
    });

    const nodes = Array.from({ length: 5 }, (_, i) =>
      i === 2 ? nodeWithMundane : makeNode(`node_${i + 1}`),
    );
    const draft = buildMinimalDraft({ nodes });

    const result = validatePathLabDraft(draft, requestWithMundane);

    const honestyWarnings = result.warnings.filter(
      (w) => w.code === "EDITORIAL_HONESTY_TAX",
    );
    expect(honestyWarnings).toHaveLength(0);
  });

  it("matches mundane items case-insensitively", () => {
    const nodeWithMundane = makeNode("node_1", {
      instructions: "Your task: Writing Documentation for the module.",
    });
    const nodes = [nodeWithMundane, ...Array.from({ length: 4 }, (_, i) => makeNode(`node_${i + 2}`))];
    const draft = buildMinimalDraft({ nodes });

    const result = validatePathLabDraft(draft, requestWithMundane);

    const honestyWarnings = result.warnings.filter(
      (w) => w.code === "EDITORIAL_HONESTY_TAX",
    );
    expect(honestyWarnings).toHaveLength(0);
  });

  it("does NOT warn when mundaneButRequired is empty", () => {
    const request: Pick<PathLabGeneratorRequest, "expertContext"> = {
      expertContext: {
        identity: {
          name: "Jane",
          title: "Eng",
          company: "X",
          field: "SW",
          role: "BE",
        },
        careerTruths: { mundaneButRequired: [] },
      },
    };
    const draft = buildMinimalDraft();
    const result = validatePathLabDraft(draft, request);

    const honestyWarnings = result.warnings.filter(
      (w) => w.code === "EDITORIAL_HONESTY_TAX",
    );
    expect(honestyWarnings).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// Backward compatibility
// ---------------------------------------------------------------------------

describe("editorial checks backward compatibility", () => {
  it("skips honesty tax when no request is passed", () => {
    const draft = buildMinimalDraft();
    const result = validatePathLabDraft(draft);

    const honestyWarnings = result.warnings.filter(
      (w) => w.code === "EDITORIAL_HONESTY_TAX",
    );
    expect(honestyWarnings).toHaveLength(0);
  });

  it("does not break existing structural validation", () => {
    const draft = buildMinimalDraft();

    // Break the structure: wrong day count
    draft.path.total_days = 10;

    const result = validatePathLabDraft(draft);

    expect(result.valid).toBe(false);
    const dayCountError = result.errors.find((e) => e.code === "DAY_COUNT_MISMATCH");
    expect(dayCountError).toBeDefined();
  });

  it("reports structural errors alongside editorial warnings", () => {
    // Add a self-loop edge to trigger a structural error
    const draft = buildMinimalDraft();
    draft.edges.push({ source_key: "node_1", destination_key: "node_1" });

    const result = validatePathLabDraft(draft);

    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.code === "EDGE_SELF_LOOP")).toBe(true);
    // Swap test warnings should still fire for generic content
    expect(result.warnings.some((w) => w.code === "EDITORIAL_SWAP_TEST")).toBe(true);
  });
});
