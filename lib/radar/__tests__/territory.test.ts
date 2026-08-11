import {
  isTerritoryIndex,
  isTerritoryMember,
  readTerritoryCopy,
  territoryKeyOf,
} from "../territory";

jest.mock("server-only", () => ({}));
jest.mock("next/cache", () => ({
  unstable_cache: (callback: (...args: never[]) => unknown) => callback,
}));

describe("readTerritoryCopy", () => {
  it("normalizes valid territory metadata", () => {
    expect(
      readTerritoryCopy({
        territory: {
          collection: "  business  ",
          is_index: true,
          reveal_th: "  เปิดโลกงานธุรกิจ  ",
          fantasy_th: "  ภาพฝัน  ",
          reality_th: " ",
          sits_th: null,
          is_composite: false,
        },
      })
    ).toEqual({
      collection: "business",
      is_index: true,
      reveal_th: "เปิดโลกงานธุรกิจ",
      fantasy_th: "ภาพฝัน",
      reality_th: null,
      sits_th: null,
      is_composite: false,
    });
  });

  it.each([
    undefined,
    null,
    {},
    { territory: null },
    { territory: "business" },
    { territory: {} },
    { territory: { reveal_th: "   " } },
  ])("rejects malformed territory metadata: %p", (research) => {
    expect(readTerritoryCopy(research)).toBeNull();
  });
});

describe("territory visibility predicates", () => {
  const territoryResearch = (overrides: Record<string, unknown> = {}) => ({
    territory: {
      collection: "business-how-money-works",
      reveal_th: "งานที่ทำให้ธุรกิจเดินได้",
      ...overrides,
    },
  });

  it("returns the normalized collection key only for valid territory copy", () => {
    expect(territoryKeyOf(territoryResearch())).toBe(
      "business-how-money-works"
    );
    expect(
      territoryKeyOf(territoryResearch({ collection: "  business  " }))
    ).toBe("business");
    expect(territoryKeyOf(territoryResearch({ collection: " " }))).toBeNull();
    expect(territoryKeyOf({ territory: { collection: "business" } })).toBeNull();
  });

  it("keeps all nine non-index professions off the public grid", () => {
    const professionSlugs = [
      "category-manager",
      "pricing-analyst",
      "demand-planner",
      "trade-marketer",
      "growth-marketer",
      "partnerships-bd",
      "retention-specialist",
      "brand-strategist",
      "startup-founder",
    ];

    const visibleLeaks = professionSlugs.filter((slug) =>
      !isTerritoryMember(
        territoryResearch(
          slug === "startup-founder" ? { is_composite: true } : {}
        )
      )
    );

    expect(visibleLeaks).toEqual([]);
  });

  it("does not classify the territory index or malformed copy as a member", () => {
    expect(isTerritoryMember(territoryResearch({ is_index: true }))).toBe(
      false
    );
    expect(isTerritoryMember({ territory: { collection: "business" } })).toBe(
      false
    );
  });

  it("classifies only valid copy with an explicit index flag as the index", () => {
    expect(isTerritoryIndex(territoryResearch({ is_index: true }))).toBe(true);
    expect(isTerritoryIndex(territoryResearch())).toBe(false);
    expect(
      isTerritoryIndex({
        territory: {
          collection: "business-how-money-works",
          is_index: true,
        },
      })
    ).toBe(false);
  });
});
