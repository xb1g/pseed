import {
  planSlices,
  parseWebtoonBody,
  serializeWebtoonBody,
  WebtoonSliceError,
  PANEL_MAX_HEIGHT,
} from "../webtoon-slice";

describe("planSlices", () => {
  it("returns a single slice for an image shorter than the max", () => {
    expect(planSlices(800, 2000)).toEqual([{ y: 0, height: 800 }]);
  });

  it("splits evenly when the height is an exact multiple", () => {
    expect(planSlices(6000, 2000)).toEqual([
      { y: 0, height: 2000 },
      { y: 2000, height: 2000 },
      { y: 4000, height: 2000 },
    ]);
  });

  it("gives the remainder to the final slice", () => {
    expect(planSlices(5000, 2000)).toEqual([
      { y: 0, height: 2000 },
      { y: 2000, height: 2000 },
      { y: 4000, height: 1000 },
    ]);
  });

  it("tiles the strip exactly, with no gap and no overlap", () => {
    const total = 20_137;
    const slices = planSlices(total, PANEL_MAX_HEIGHT);

    expect(slices[0].y).toBe(0);
    slices.forEach((slice, i) => {
      if (i > 0) {
        const prev = slices[i - 1];
        expect(slice.y).toBe(prev.y + prev.height);
      }
      expect(slice.height).toBeGreaterThan(0);
      expect(slice.height).toBeLessThanOrEqual(PANEL_MAX_HEIGHT);
    });

    const last = slices[slices.length - 1];
    expect(last.y + last.height).toBe(total);
    expect(slices.reduce((sum, s) => sum + s.height, 0)).toBe(total);
  });

  it("handles a strip one pixel over the boundary", () => {
    expect(planSlices(2001, 2000)).toEqual([
      { y: 0, height: 2000 },
      { y: 2000, height: 1 },
    ]);
  });

  it("rejects non-positive dimensions", () => {
    expect(() => planSlices(0, 2000)).toThrow(WebtoonSliceError);
    expect(() => planSlices(-5, 2000)).toThrow(WebtoonSliceError);
    expect(() => planSlices(NaN, 2000)).toThrow(WebtoonSliceError);
    expect(() => planSlices(1000, 0)).toThrow(WebtoonSliceError);
  });
});

describe("parseWebtoonBody", () => {
  const panel = { url: "https://cdn.example/p1.webp", w: 1080, h: 2000 };

  it("returns an empty list for null, undefined, or blank input", () => {
    expect(parseWebtoonBody(null).panels).toEqual([]);
    expect(parseWebtoonBody(undefined).panels).toEqual([]);
    expect(parseWebtoonBody("   ").panels).toEqual([]);
  });

  it("degrades to an empty list on malformed JSON rather than throwing", () => {
    expect(parseWebtoonBody("{not json").panels).toEqual([]);
  });

  it("degrades to an empty list when panels is not an array", () => {
    expect(parseWebtoonBody('{"panels":"nope"}').panels).toEqual([]);
    expect(parseWebtoonBody('{"other":1}').panels).toEqual([]);
  });

  it("reads a well-formed panel list", () => {
    expect(parseWebtoonBody(JSON.stringify({ panels: [panel] })).panels).toEqual([
      panel,
    ]);
  });

  it("drops panels missing a url or with non-numeric dimensions", () => {
    const body = JSON.stringify({
      panels: [
        panel,
        { url: "", w: 1080, h: 2000 },
        { w: 1080, h: 2000 },
        { url: "https://cdn.example/p2.webp", w: "wide", h: 2000 },
        null,
      ],
    });
    expect(parseWebtoonBody(body).panels).toEqual([panel]);
  });

  it("round-trips through serializeWebtoonBody", () => {
    const panels = [panel, { url: "https://cdn.example/p2.webp", w: 1080, h: 900 }];
    expect(parseWebtoonBody(serializeWebtoonBody(panels)).panels).toEqual(panels);
  });

  it("serializes an empty list to a parseable body", () => {
    expect(parseWebtoonBody(serializeWebtoonBody([])).panels).toEqual([]);
  });
});
