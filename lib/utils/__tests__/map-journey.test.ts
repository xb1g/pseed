import { buildJourneyDays } from "../map-journey";

const node = (
  id: string,
  overrides: Partial<Parameters<typeof buildJourneyDays>[0][number]> = {}
) => ({
  id,
  title: `Node ${id}`,
  sprite_url: null,
  difficulty: 1,
  node_type: "learning",
  ...overrides,
});

describe("buildJourneyDays", () => {
  test("returns an empty journey for a map with no nodes", () => {
    expect(buildJourneyDays([], [])).toEqual([]);
  });

  test("a linear path becomes one stop per day, in order", () => {
    const days = buildJourneyDays(
      [node("a"), node("b"), node("c")],
      [
        { source: "a", destination: "b" },
        { source: "b", destination: "c" },
      ]
    );

    expect(days.map((d) => d.day)).toEqual([1, 2, 3]);
    expect(days[0].stops.map((s) => s.id)).toEqual(["a"]);
    expect(days[1].stops.map((s) => s.id)).toEqual(["b"]);
    expect(days[2].stops.map((s) => s.id)).toEqual(["c"]);
  });

  test("branches share a day; a diamond reconverges on the later day", () => {
    // a -> b, a -> c, b -> d, c -> d
    const days = buildJourneyDays(
      [node("a"), node("b"), node("c"), node("d")],
      [
        { source: "a", destination: "b" },
        { source: "a", destination: "c" },
        { source: "b", destination: "d" },
        { source: "c", destination: "d" },
      ]
    );

    expect(days).toHaveLength(3);
    expect(days[1].stops.map((s) => s.id).sort()).toEqual(["b", "c"]);
    expect(days[2].stops.map((s) => s.id)).toEqual(["d"]);
  });

  test("a node waits for its longest prerequisite chain", () => {
    // a -> c directly, but also a -> b -> c: c lands on day 3, not day 2.
    const days = buildJourneyDays(
      [node("a"), node("b"), node("c")],
      [
        { source: "a", destination: "c" },
        { source: "a", destination: "b" },
        { source: "b", destination: "c" },
      ]
    );

    expect(days).toHaveLength(3);
    expect(days[2].stops.map((s) => s.id)).toEqual(["c"]);
  });

  test("text and comment nodes are excluded; end nodes are kept", () => {
    const days = buildJourneyDays(
      [
        node("a"),
        node("note", { node_type: "text" }),
        node("memo", { node_type: "comment" }),
        node("z", { node_type: "end" }),
      ],
      [
        { source: "a", destination: "note" },
        { source: "note", destination: "z" },
        { source: "a", destination: "z" },
      ]
    );

    const ids = days.flatMap((d) => d.stops.map((s) => s.id));
    expect(ids).not.toContain("note");
    expect(ids).not.toContain("memo");
    expect(ids).toContain("a");
    expect(ids).toContain("z");
  });

  test("edges to excluded annotation nodes do not block layering", () => {
    // a -> note(text) -> b: with note removed, b has no real predecessors and
    // becomes a day-1 start alongside a.
    const days = buildJourneyDays(
      [node("a"), node("note", { node_type: "text" }), node("b")],
      [
        { source: "a", destination: "note" },
        { source: "note", destination: "b" },
      ]
    );

    expect(days).toHaveLength(1);
    expect(days[0].stops.map((s) => s.id).sort()).toEqual(["a", "b"]);
  });

  test("nodes without any paths are chunked into difficulty-ordered days", () => {
    const days = buildJourneyDays(
      [
        node("hard", { difficulty: 5 }),
        node("easy", { difficulty: 1 }),
        node("mid", { difficulty: 3 }),
        node("mid2", { difficulty: 3 }),
      ],
      []
    );

    expect(days).toHaveLength(2); // 3 per improvised day
    expect(days[0].stops[0].id).toBe("easy"); // easiest first
    expect(days[1].stops).toHaveLength(1);
  });

  test("a cycle does not hang and its nodes are still surfaced", () => {
    // a -> b -> a, plus c -> a
    const days = buildJourneyDays(
      [node("a"), node("b"), node("c")],
      [
        { source: "a", destination: "b" },
        { source: "b", destination: "a" },
        { source: "c", destination: "a" },
      ]
    );

    const ids = days.flatMap((d) => d.stops.map((s) => s.id)).sort();
    expect(ids).toEqual(["a", "b", "c"]);
    expect(days[0].stops.map((s) => s.id)).toEqual(["c"]); // only true start
  });

  test("missing sprite/difficulty fall back to safe defaults", () => {
    const days = buildJourneyDays(
      [{ id: "a", title: "Bare" }], // no sprite_url, difficulty, node_type
      []
    );

    expect(days[0].stops[0]).toMatchObject({
      sprite_url: null,
      difficulty: 1,
      node_type: null,
    });
  });
});
