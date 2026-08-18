import {
  FALLBACK_SPRITE,
  toTrailStops,
  trailPathD,
  type JourneyPreview,
  type TrailStop,
} from "@/components/pathlab/journey-map-utils";

const preview: JourneyPreview = {
  map: { id: "map-1", title: "Map", description: null },
  nodes: [
    {
      id: "a",
      title: "Alpha",
      nodeType: "learning",
      spriteUrl: "/sprites/a.png",
      position: { x: 10, y: 20 },
      snippet: "first",
    },
    {
      id: "b",
      title: "Beta",
      nodeType: "end",
      spriteUrl: null,
      position: null,
      snippet: null,
    },
    {
      id: "c",
      title: "Gamma",
      nodeType: "learning",
      spriteUrl: null,
      position: null,
      snippet: null,
    },
    {
      id: "d",
      title: "Delta",
      nodeType: "learning",
      spriteUrl: "/sprites/d.png",
      position: null,
      snippet: "fourth",
    },
  ],
  edges: [
    { id: "e1", source: "a", target: "b" },
    { id: "e2", source: "b", target: "c" },
  ],
};

describe("toTrailStops", () => {
  it("cycles xPct 18, 50, 82 and restarts at 50 on the 4th node", () => {
    const stops = toTrailStops(preview);
    expect(stops.map((s) => s.xPct)).toEqual([18, 50, 82, 50]);
  });

  it("assigns consecutive 0-based rows", () => {
    const stops = toTrailStops(preview);
    expect(stops.map((s) => s.row)).toEqual([0, 1, 2, 3]);
  });

  it("falls back to the crystal sprite when spriteUrl is null", () => {
    const stops = toTrailStops(preview);
    expect(stops[1].spriteUrl).toBe(FALLBACK_SPRITE);
    expect(stops[0].spriteUrl).toBe("/sprites/a.png");
  });

  it("passes snippet through untouched", () => {
    const stops = toTrailStops(preview);
    expect(stops.map((s) => s.snippet)).toEqual([
      "first",
      null,
      null,
      "fourth",
    ]);
  });
});

describe("trailPathD", () => {
  it("returns an empty path for zero or one stop", () => {
    expect(trailPathD([])).toBe("");
    const single: TrailStop[] = [
      {
        id: "a",
        title: "Alpha",
        spriteUrl: "/sprites/a.png",
        snippet: null,
        xPct: 18,
        row: 0,
      },
    ];
    expect(trailPathD(single)).toBe("");
  });

  it("walks from the first stop centre to the next row with a weaved curve", () => {
    const stops = toTrailStops(preview).slice(0, 2);
    const d = trailPathD(stops);
    // starts at first stop (xPct 18, row 0 → y = 0*12 + 6 = 6)
    expect(d.startsWith("M 18 6")).toBe(true);
    // curves via a midpoint (x = (18+50)/2 = 34, y = (6+18)/2 = 12)
    expect(d).toContain("Q 18 12 34 12");
    // ends at the second stop (xPct 50, row 1 → y = 18)
    expect(d).toContain("Q 50 12 50 18");
    expect(d.endsWith("50 18")).toBe(true);
    // no straight L segments remain — connector is fully curved
    expect(d).not.toMatch(/\sL\s/);
  });
});
