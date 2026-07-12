import {
  getAiImpactLabel,
  getEntryRouteLabel,
  getOutlookLabel,
  interpretRadarMetric,
  parseRadarListItems,
} from "../presentation";

describe("Radar presentation language", () => {
  it("uses specific, respectful Thai labels", () => {
    expect(getEntryRouteLabel("alternative")).toBe("สร้างทักษะเอง");
    expect(getAiImpactLabel(2)).toBe("ได้รับผลกระทบน้อย");
    expect(getAiImpactLabel(5)).toBe("งานบางส่วนกำลังเปลี่ยน");
    expect(getOutlookLabel("shifting")).toBe("งานยังมี แต่เนื้องานกำลังเปลี่ยน");
  });

  it("explains whether a scored metric is favorable", () => {
    expect(interpretRadarMetric("demand_growth", 8, 10)).toBe("โอกาสค่อนข้างดี");
    expect(interpretRadarMetric("saturation_level", 8, 10)).toBe(
      "การแข่งขันค่อนข้างสูง"
    );
  });

  it("does not invent an interpretation for salaries", () => {
    expect(interpretRadarMetric("salary_floor", 25_000, 1)).toBe(
      "เปรียบเทียบกับค่ากลางและประสบการณ์ที่ระบุ"
    );
  });

  it("turns legacy bullet-heavy content into scannable items", () => {
    expect(
      parseRadarListItems("• Python: ใช้สร้างระบบ\n• การสื่อสาร — อธิบายผลให้ทีม")
    ).toEqual([
      { title: "Python", description: "ใช้สร้างระบบ" },
      { title: "การสื่อสาร", description: "อธิบายผลให้ทีม" },
    ]);
  });
});
