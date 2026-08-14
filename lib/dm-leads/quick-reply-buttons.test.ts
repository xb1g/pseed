import { classifyConversationText } from "@/lib/meta/classify";
import { GRADE_LEVEL_QUICK_REPLIES, INTEREST_QUICK_REPLIES } from "./quick-reply-buttons";

describe("quick-reply button titles auto-classify", () => {
  // A tapped button arrives as an inbound message whose body is the title —
  // this locks in that every button title actually round-trips through the
  // classifier into the field it's meant to fill, so a future edit to either
  // file that breaks the match fails a test instead of silently no-op-ing.
  it("every grade-level option classifies to its own title", () => {
    for (const option of GRADE_LEVEL_QUICK_REPLIES.options) {
      const result = classifyConversationText([option.title]);
      expect(result.gradeLevel).toBe(option.title);
    }
  });

  it("every interest option's title actually triggers a classified interest", () => {
    // Titles don't have to equal the classifier's canonical label (e.g.
    // tapping "แพทย์" classifies to "แพทยศาสตร์") — the real invariant is
    // that the tap produces a non-empty classification, not a silent no-op.
    for (const option of INTEREST_QUICK_REPLIES.options) {
      const result = classifyConversationText([option.title]);
      expect(result.interests.length).toBeGreaterThan(0);
    }
  });
});
