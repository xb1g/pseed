import { filterRadarFields, normalizeRadarCollections } from "../filters";

describe("Radar filters", () => {
  const collections = [
    { key: "all", label_th: "ทั้งหมด", label_en: "All" },
    { key: "trending", label_th: "มาแรง", label_en: "Trending" },
  ];

  it("uses the database all label without rendering a duplicate chip", () => {
    expect(normalizeRadarCollections(collections)).toEqual({
      allLabel: "ทั้งหมด",
      filters: [collections[1]],
    });
  });

  it("combines collection and search filters", () => {
    const fields = [
      {
        tags: ["trending"],
        name_th: "วิศวกร AI",
        name_en: "AI Engineer",
        tagline_th: "สร้างระบบ AI",
        tagline_en: "Build AI systems",
      },
      {
        tags: ["creative"],
        name_th: "นักออกแบบ",
        name_en: "Designer",
        tagline_th: "ออกแบบผลิตภัณฑ์",
        tagline_en: "Design products",
      },
    ];

    expect(filterRadarFields(fields, "trending", "engineer")).toEqual([fields[0]]);
    expect(filterRadarFields(fields, null, "ออกแบบ")).toEqual([fields[1]]);
  });
});
