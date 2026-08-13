import {
  contextFromConversation,
  getQuickReplies,
  type QuickReplyContext,
} from "@/lib/dm-leads/quick-replies";
import { summarizeLeadNeeds } from "@/lib/dm-leads/lead-summary";
import type { DmConversation } from "@/types/dm-leads";

function baseContext(overrides: Partial<QuickReplyContext> = {}): QuickReplyContext {
  return {
    stage: "exploring",
    gradeLevel: null,
    interests: [],
    displayName: null,
    username: null,
    wantsPathlab: false,
    pathlabPayReady: false,
    wantsCommunity: false,
    wantsTalent: false,
    hasHandsOnExperience: false,
    ...overrides,
  };
}

function baseConversation(overrides: Partial<DmConversation> = {}): DmConversation {
  return {
    id: "c1",
    platform: "instagram",
    platform_thread_id: "t1",
    platform_user_id: "u1",
    username: null,
    display_name: null,
    grade_level: null,
    interests: [],
    activities_summary: null,
    stage: "exploring",
    recommended_product: null,
    has_hands_on_experience: false,
    wants_pathlab: false,
    pathlab_pay_ready: false,
    wants_community: false,
    wants_talent: false,
    classified_at: null,
    last_message_at: new Date().toISOString(),
    last_message_direction: "inbound",
    starred: false,
    admin_tags: [],
    follow_up_at: null,
    lead_status: "new",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}

describe("getQuickReplies", () => {
  it("composes year + path + stage into the guide reply", () => {
    const replies = getQuickReplies(
      baseContext({
        stage: "exploring",
        gradeLevel: "ม.5",
        interests: ["แพทยศาสตร์"],
        displayName: "น้องมายด์",
      })
    );

    const guide = replies.find((r) => r.id === "guide");
    expect(guide).toBeDefined();
    expect(guide!.body).toContain("น้องมายด์");
    expect(guide!.body).toContain("สายสุขภาพ"); // path tip
    expect(guide!.body).toContain("TCAS"); // ม.5 year line
    expect(guide!.body).toContain("pathlab"); // exploring → PathLab CTA
  });

  it("puts the pay-ready CTA first for hot leads", () => {
    const replies = getQuickReplies(
      baseContext({ stage: "exploring", pathlabPayReady: true, wantsPathlab: true })
    );
    expect(replies[0].id).toBe("cta-pay");
    expect(replies[0].body).toContain("การสมัคร");
  });

  it("recommends Community for building stage and Talent for job seeking", () => {
    const building = getQuickReplies(baseContext({ stage: "building" }));
    expect(building.find((r) => r.id === "guide")!.body).toContain("Community");

    const jobSeeking = getQuickReplies(baseContext({ stage: "job_seeking" }));
    expect(jobSeeking.find((r) => r.id === "guide")!.body).toContain("Talent");
  });

  it("falls back to a qualifier when the stage is unknown", () => {
    const replies = getQuickReplies(baseContext({ stage: "unknown" }));
    expect(replies.find((r) => r.id === "guide")).toBeUndefined();
    expect(replies.some((r) => r.tone === "qualify")).toBe(true);
  });

  it("asks for the grade first when it is missing", () => {
    const replies = getQuickReplies(baseContext({ stage: "exploring", gradeLevel: null }));
    const qualify = replies.find((r) => r.id === "qualify");
    expect(qualify!.body).toContain("ชั้นไหน");
  });

  it("never returns more than 4 suggestions", () => {
    const replies = getQuickReplies(
      baseContext({
        stage: "building",
        gradeLevel: "ม.6",
        interests: ["วิศวกรรมคอมพิวเตอร์"],
        pathlabPayReady: true,
        wantsPathlab: true,
        wantsCommunity: true,
        wantsTalent: true,
      })
    );
    expect(replies.length).toBeLessThanOrEqual(4);
  });
});

describe("summarizeLeadNeeds", () => {
  it("builds a headline from grade, first interest, and stage", () => {
    const summary = summarizeLeadNeeds(
      baseConversation({ grade_level: "ม.4", interests: ["นิติศาสตร์"], stage: "exploring" })
    );
    expect(summary.headline).toBe("ม.4 · สนใจนิติศาสตร์ · กำลังสำรวจ");
  });

  it("marks pay-ready leads as hot with an urgent action", () => {
    const summary = summarizeLeadNeeds(baseConversation({ pathlab_pay_ready: true }));
    expect(summary.priority).toBe("hot");
    expect(summary.suggestedAction).toContain("ส่งรายละเอียดการสมัคร");
  });

  it("flags missing grade and interests as gaps to ask about", () => {
    const summary = summarizeLeadNeeds(baseConversation({}));
    expect(summary.needs).toContain("ยังไม่ทราบชั้นปี — ควรถาม");
    expect(summary.needs).toContain("ยังไม่ทราบสายที่สนใจ — ควรถาม");
  });

  it("marks inbound-awaiting conversations as reply priority", () => {
    const summary = summarizeLeadNeeds(
      baseConversation({ last_message_direction: "inbound" })
    );
    expect(summary.priority).toBe("reply");
  });
});

describe("contextFromConversation", () => {
  it("maps a conversation row into a quick-reply context", () => {
    const ctx = contextFromConversation(
      baseConversation({ grade_level: "ปี 1", wants_pathlab: true })
    );
    expect(ctx.gradeLevel).toBe("ปี 1");
    expect(ctx.wantsPathlab).toBe(true);
  });
});
