import type { MetaQuickReplyOption } from "@/lib/meta/graph";

/**
 * Built-in Meta quick-reply button sets for the two questions this app most
 * needs answered (see lead-summary.ts: grade level and interest are the
 * fields most often missing). Titles are picked to exactly match
 * lib/meta/classify.ts's GRADE_PATTERNS / INTEREST_KEYWORDS regexes, so a
 * tapped button classifies the lead automatically through the existing
 * inbound-message pipeline — no separate payload-handling code needed.
 */
export interface QuickReplySet {
  id: string;
  label: string;
  /** The message text sent alongside the buttons. */
  prompt: string;
  options: MetaQuickReplyOption[];
}

export const GRADE_LEVEL_QUICK_REPLIES: QuickReplySet = {
  id: "grade_level",
  label: "ถามชั้นปี",
  prompt: "ตอนนี้น้องอยู่ชั้นไหนแล้วครับ? 😊",
  options: [
    { title: "ม.3", payload: "dm_grade:ม.3" },
    { title: "ม.4", payload: "dm_grade:ม.4" },
    { title: "ม.5", payload: "dm_grade:ม.5" },
    { title: "ม.6", payload: "dm_grade:ม.6" },
    { title: "ปี 1", payload: "dm_grade:ปี 1" },
  ],
};

export const INTEREST_QUICK_REPLIES: QuickReplySet = {
  id: "interest",
  label: "ถามสายที่สนใจ",
  prompt: "ตอนนี้น้องสนใจสายไหนอยู่ครับ?",
  options: [
    { title: "วิศวกรรมศาสตร์", payload: "dm_interest:วิศวกรรมศาสตร์" },
    { title: "วิทยาการคอมพิวเตอร์", payload: "dm_interest:วิทยาการคอมพิวเตอร์" },
    { title: "แพทย์", payload: "dm_interest:แพทย์" },
    { title: "บริหารธุรกิจ", payload: "dm_interest:บริหารธุรกิจ" },
    { title: "นิเทศศาสตร์", payload: "dm_interest:นิเทศศาสตร์" },
  ],
};

export const QUICK_REPLY_SETS: QuickReplySet[] = [GRADE_LEVEL_QUICK_REPLIES, INTEREST_QUICK_REPLIES];

/** Personalize only the prompt. Button titles must stay verbatim so they classify. */
export async function personalizeQuickReplySet(
  set: QuickReplySet,
  lead: import("@/lib/dm-leads/personalize").PersonalizeLead
): Promise<QuickReplySet> {
  const { personalizeMessage } = await import("@/lib/dm-leads/personalize");
  return {
    ...set,
    prompt: await personalizeMessage({
      template: set.prompt,
      lead,
      kind: "button_prompt",
    }),
  };
}
