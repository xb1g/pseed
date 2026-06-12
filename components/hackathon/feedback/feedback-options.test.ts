import { getFollowUpOpportunities } from "./feedback-options";

describe("getFollowUpOpportunities", () => {
  it("offers future-direction outcomes to ม.3-ม.5 participants", () => {
    const opportunities = getFollowUpOpportunities("future_path");

    expect(opportunities.map((item) => item.id)).toContain("future_path");
    expect(opportunities[0].title).toMatch(/ทดลองใช้ PassionSeed/);
    expect(opportunities[0].outcome).toMatch(/Career Intelligence/);
  });

  it("offers product testing plus three non-overlapping next steps to older participants", () => {
    const opportunities = getFollowUpOpportunities("project_growth");

    expect(opportunities.map((item) => item.id)).toEqual([
      "future_path",
      "project_launch",
      "mentor_match",
      "future_opportunities",
    ]);
    expect(opportunities[0].title).toMatch(/ทดลองใช้ PassionSeed/);
    expect(opportunities[1].benefit).toMatch(/Sprint|รายสัปดาห์/);
    expect(opportunities[2].benefit).toMatch(/1:1|ครั้งเดียว/);
    expect(opportunities[3].benefit).toMatch(/ไม่ผูกกับโปรเจกต์/);
  });
});
