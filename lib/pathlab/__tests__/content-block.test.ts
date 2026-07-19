import {
  aiChatObjective,
  normalizeContentBlock,
  resolveAIChatConfig,
} from "../content-block";

describe("normalizeContentBlock", () => {
  it("unwraps a JSON body so raw JSON never reaches the student", () => {
    const result = normalizeContentBlock({
      content_title: "Development Tools Setup",
      content_body:
        '{"body": "Before we start building, you need the right tools.", "title": "Set Up Your Development Environment"}',
    });

    expect(result.body).toBe(
      "Before we start building, you need the right tools.",
    );
    expect(result.body).not.toContain("{");
  });

  it("prefers the column title over the JSON title", () => {
    const result = normalizeContentBlock({
      content_title: "Development Tools Setup",
      content_body: '{"body": "x", "title": "Set Up Your Environment"}',
    });

    expect(result.title).toBe("Development Tools Setup");
  });

  it("falls back to the JSON title when the column has none", () => {
    const result = normalizeContentBlock({
      content_title: null,
      content_body: '{"body": "x", "title": "Set Up Your Environment"}',
    });

    expect(result.title).toBe("Set Up Your Environment");
  });

  it("uses description when the JSON carries no body", () => {
    const result = normalizeContentBlock({
      content_title: "Day 1 Reflection",
      content_body:
        '{"title": "Reflect on Your First Day", "description": "Take a moment to reflect."}',
    });

    expect(result.body).toBeNull();
    expect(result.description).toBe("Take a moment to reflect.");
  });

  it("extracts the link and description from a resource row", () => {
    const result = normalizeContentBlock({
      content_title: "Download Cursor (AI Code Editor)",
      content_body: "\n\nLink: https://cursor.com",
      metadata: { description: "The AI-first code editor." },
    });

    expect(result.link).toBe("https://cursor.com");
    expect(result.description).toBe("The AI-first code editor.");
    expect(result.body).toBeNull();
  });

  it("passes plain prose through untouched", () => {
    const result = normalizeContentBlock({
      content_title: "Intro",
      content_body: "Real developers use real tools.",
    });

    expect(result.body).toBe("Real developers use real tools.");
  });

  it("treats an unparseable brace-leading body as prose, not JSON", () => {
    const result = normalizeContentBlock({
      content_body: "{not valid json but still worth showing",
    });

    expect(result.body).toBe("{not valid json but still worth showing");
  });

  it("prefers content_url over a URL embedded in the body", () => {
    const result = normalizeContentBlock({
      content_url: "https://example.com/canonical",
      content_body: "Link: https://example.com/inline",
    });

    expect(result.link).toBe("https://example.com/canonical");
  });

  it("handles an entirely empty row", () => {
    const result = normalizeContentBlock({});

    expect(result).toEqual({
      title: null,
      body: null,
      description: null,
      link: null,
    });
  });

  it("ignores a JSON array body", () => {
    const result = normalizeContentBlock({ content_body: '["a","b"]' });

    expect(result.body).toBe('["a","b"]');
  });
});

describe("aiChatObjective", () => {
  it("uses the description rather than the raw JSON descriptor", () => {
    const objective = aiChatObjective({
      content_body:
        '{"title": "AI UI Generation", "description": "Use AI to generate UI components"}',
      metadata: { suggested_prompt: "Create a landing page" },
    });

    expect(objective).toBe("Use AI to generate UI components");
    expect(objective).not.toContain("{");
  });

  it("falls back to the suggested prompt when nothing else is present", () => {
    const objective = aiChatObjective({
      content_body: null,
      metadata: { suggested_prompt: "Create a landing page" },
    });

    expect(objective).toBe("Create a landing page");
  });

  it("falls back to the activity instructions last", () => {
    const objective = aiChatObjective({}, "Do the thing");

    expect(objective).toBe("Do the thing");
  });

  it("returns an empty string when there is nothing to say", () => {
    expect(aiChatObjective({})).toBe("");
  });
});

describe("resolveAIChatConfig", () => {
  // The five metadata shapes actually present in production
  it.each([
    ["suggested_prompt", { suggested_prompt: "Create a landing page" }],
    ["suggested_prompts", { context: "Refine", suggested_prompts: ["A", "B"] }],
    ["prompt_suggestions", { context: "Debug", prompt_suggestions: ["A"] }],
    ["prompt", { prompt: "Analyse career fit" }],
    ["context only", { context: "Polish your project" }],
  ])("always produces a usable config for %s", (_label, metadata) => {
    const config = resolveAIChatConfig({ metadata });

    expect(config.systemPrompt.length).toBeGreaterThan(0);
    expect(config.objective.length).toBeGreaterThan(0);
  });

  it("prefers an explicit system_prompt when authored", () => {
    const config = resolveAIChatConfig({
      metadata: { system_prompt: "You are a strict reviewer.", objective: "Ship" },
    });

    expect(config.systemPrompt).toBe("You are a strict reviewer.");
    expect(config.objective).toBe("Ship");
  });

  it("folds context and objective into a derived system prompt", () => {
    const config = resolveAIChatConfig({
      metadata: { context: "Building a portfolio site" },
    });

    expect(config.systemPrompt).toContain("Building a portfolio site");
    expect(config.systemPrompt).toContain("Goal:");
  });

  it("derives the objective from a JSON body description", () => {
    const config = resolveAIChatConfig({
      content_body:
        '{"title": "AI UI Generation", "description": "Use AI to generate UI components"}',
      metadata: { suggested_prompt: "Create a landing page" },
    });

    expect(config.objective).toBe("Use AI to generate UI components");
    expect(config.objective).not.toContain("{");
  });

  it("collects suggestions from every known key shape", () => {
    const config = resolveAIChatConfig({
      metadata: {
        suggested_prompt: "one",
        suggested_prompts: ["two", "three"],
        prompt_suggestions: ["four"],
        prompt: "five",
      },
    });

    expect(config.suggestions).toEqual(["one", "two", "three", "four", "five"]);
  });

  it("falls back to activity instructions, then title", () => {
    expect(
      resolveAIChatConfig({}, { instructions: "Build a prototype" }).objective,
    ).toBe("Build a prototype");

    expect(resolveAIChatConfig({}, { title: "First Prototype" }).objective).toBe(
      "First Prototype",
    );
  });

  it("never returns an empty objective, even with nothing to work from", () => {
    const config = resolveAIChatConfig({});

    expect(config.objective.length).toBeGreaterThan(0);
    expect(config.suggestions).toEqual([]);
  });
});
