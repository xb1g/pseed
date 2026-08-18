import {
  computeEngagementIndex,
  computePropensityScore,
  classifyLeadCohort,
  scoreLead,
  COHORT_META,
} from "../scoring";
import { EMPTY_SIGNALS } from "../playbook";

describe("lib/dm-leads/scoring", () => {
  const now = new Date("2026-08-18T12:00:00Z");

  describe("computeEngagementIndex", () => {
    it("returns 0 for zero activity and unknown profile", () => {
      const result = computeEngagementIndex({
        lastMessageAt: "2025-01-01T00:00:00Z", // very old
        inboundTurns: 0,
        inboundCharCount: 0,
        isGradeKnown: false,
        hasHandsOn: false,
        interestsCount: 0,
        stage: "unknown",
        now,
      });

      expect(result.engagementIndex).toBeLessThan(10);
      expect(result.frequencyScore).toBe(0);
      expect(result.messageDepthScore).toBe(0);
      expect(result.intentScore).toBe(0);
    });

    it("returns high index for recent, multi-turn, hands-on student", () => {
      const result = computeEngagementIndex({
        lastMessageAt: "2026-08-18T11:00:00Z", // 1 hour ago
        inboundTurns: 10,
        outboundTurns: 10,
        inboundCharCount: 450,
        activitiesSummaryLength: 300,
        isGradeKnown: true,
        hasHandsOn: true,
        interestsCount: 2,
        stage: "building",
        signals: { ...EMPTY_SIGNALS, priceMentioned: true },
        now,
      });

      expect(result.engagementIndex).toBeGreaterThan(80);
      expect(result.recencyScore).toBeCloseTo(1.0, 1);
      expect(result.frequencyScore).toBeGreaterThan(0.8);
      expect(result.intentScore).toBe(1.0);
    });

    it("respects the 21-day half-life decay on recency", () => {
      const fresh = computeEngagementIndex({
        lastMessageAt: "2026-08-18T12:00:00Z",
        inboundTurns: 1,
        inboundCharCount: 50,
        isGradeKnown: true,
        hasHandsOn: false,
        interestsCount: 1,
        stage: "exploring",
        now,
      });

      const halfLifePassed = computeEngagementIndex({
        lastMessageAt: "2026-07-28T12:00:00Z", // 21 days earlier
        inboundTurns: 1,
        inboundCharCount: 50,
        isGradeKnown: true,
        hasHandsOn: false,
        interestsCount: 1,
        stage: "exploring",
        now,
      });

      expect(fresh.recencyScore).toBe(1.0);
      expect(halfLifePassed.recencyScore).toBeCloseTo(0.37, 1); // e^-1 ~= 0.368
      expect(fresh.engagementIndex).toBeGreaterThan(halfLifePassed.engagementIndex);
    });
  });

  describe("computePropensityScore", () => {
    it("returns 1.0 for pay-ready leads", () => {
      const score = computePropensityScore({
        hasHandsOn: false,
        inboundTurns: 1,
        inboundCharCount: 20,
        isGradeKnown: false,
        interestsCount: 0,
        stage: "unknown",
        engagementIndex: 20,
        payReady: true,
      });
      expect(score).toBe(1.0);
    });

    it("gives high propensity for hands-on experience and building stage", () => {
      const score = computePropensityScore({
        hasHandsOn: true,
        inboundTurns: 5,
        inboundCharCount: 250,
        isGradeKnown: true,
        interestsCount: 2,
        stage: "building",
        engagementIndex: 85,
        signals: { ...EMPTY_SIGNALS, priceMentioned: true },
      });
      expect(score).toBeGreaterThan(0.9);
    });

    it("gives low propensity for cold lead with zero turns", () => {
      const score = computePropensityScore({
        hasHandsOn: false,
        inboundTurns: 0,
        inboundCharCount: 0,
        isGradeKnown: false,
        interestsCount: 0,
        stage: "unknown",
        engagementIndex: 15,
      });
      expect(score).toBeLessThan(0.1);
    });
  });

  describe("classifyLeadCohort", () => {
    it("classifies STEM builder correctly", () => {
      const cohort = classifyLeadCohort({
        interests: ["วิศวกรรมคอมพิวเตอร์", "AI"],
        hasHandsOn: true,
        engagementIndex: 80,
      });
      expect(cohort).toBe("hyper_engaged_builder");
      expect(COHORT_META[cohort].label).toContain("Tech & STEM Builder");
    });

    it("classifies Med/Health seeker correctly", () => {
      const cohort = classifyLeadCohort({
        interests: ["แพทยศาสตร์", "เภสัช"],
        hasHandsOn: false,
        engagementIndex: 70,
      });
      expect(cohort).toBe("med_health_seeker");
      expect(COHORT_META[cohort].label).toContain("Med & Health Seeker");
    });

    it("classifies Business aspirant correctly", () => {
      const cohort = classifyLeadCohort({
        interests: ["บริหารธุรกิจ", "BBA"],
        hasHandsOn: false,
        engagementIndex: 65,
      });
      expect(cohort).toBe("business_law_aspirant");
    });

    it("classifies Price-Ready inquirer when price mentioned", () => {
      const cohort = classifyLeadCohort({
        interests: [],
        hasHandsOn: false,
        engagementIndex: 40,
        signals: { ...EMPTY_SIGNALS, priceMentioned: true },
      });
      expect(cohort).toBe("high_conversion_inquirer");
    });

    it("classifies low engagement leads as casual browser", () => {
      const cohort = classifyLeadCohort({
        interests: [],
        hasHandsOn: false,
        engagementIndex: 15,
      });
      expect(cohort).toBe("casual_browser");
    });
  });

  describe("scoreLead full wrapper", () => {
    it("produces full PropensityScoreResult with tiers", () => {
      const lead = {
        grade_level: "ม.5",
        interests: ["วิศวกรรมคอมพิวเตอร์"],
        activities_summary: "ทำโครงงาน AI เขียนโปรแกรม Python",
        has_hands_on_experience: true,
        stage: "building" as const,
        pathlab_pay_ready: false,
        last_message_at: "2026-08-18T10:00:00Z",
      };

      const result = scoreLead(lead, {
        inboundTurns: 8,
        inboundCharCount: 300,
        now,
      });

      expect(result.tier).toBe("high_value");
      expect(result.propensityScore).toBeGreaterThan(0.85);
      expect(result.cohort).toBe("hyper_engaged_builder");
      expect(result.engagementIndex).toBeGreaterThan(70);
      expect(result.components.intentScore).toBeGreaterThan(0.7);
    });
  });
});
