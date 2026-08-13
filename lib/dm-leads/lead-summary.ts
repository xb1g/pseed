import type { DmConversation, DmLeadStage } from "@/types/dm-leads";

/**
 * Turns a classified DM conversation into a one-glance "what does this
 * customer need" summary for the admin inbox: a headline, the concrete
 * needs, a suggested next action, and a reply priority.
 */

export type LeadPriority = "hot" | "reply" | "normal";

export interface LeadSummary {
  /** e.g. "ม.5 · สนใจแพทยศาสตร์ · กำลังสำรวจ" */
  headline: string;
  /** Concrete needs derived from intent tags, most urgent first. */
  needs: string[];
  /** What the admin should do next. */
  suggestedAction: string;
  priority: LeadPriority;
}

const STAGE_HEADLINE: Record<DmLeadStage, string> = {
  unknown: "ยังไม่ทราบข้อมูล",
  exploring: "กำลังสำรวจ",
  building: "ลงมือทำแล้ว",
  job_seeking: "กำลังหางาน",
};

export function summarizeLeadNeeds(c: DmConversation): LeadSummary {
  const headlineParts: string[] = [];
  if (c.grade_level) headlineParts.push(c.grade_level);
  if (c.interests.length > 0) headlineParts.push(`สนใจ${c.interests[0]}`);
  headlineParts.push(STAGE_HEADLINE[c.stage]);

  const needs: string[] = [];
  if (c.pathlab_pay_ready) needs.push("ถามเรื่องสมัคร/ราคา — ตอบไวที่สุด");
  if (c.wants_pathlab) needs.push("อยากลองทำโปรเจกต์จริง (PathLab)");
  if (c.wants_community) needs.push("อยากได้เพื่อนร่วมทีม / เมนเทอร์ (Community)");
  if (c.wants_talent) needs.push("อยากหางาน / ฝึกงาน (Talent)");
  if (c.has_hands_on_experience) needs.push("มีผลงานหรือประสบการณ์อยู่แล้ว");
  if (!c.grade_level) needs.push("ยังไม่ทราบชั้นปี — ควรถาม");
  if (c.interests.length === 0) needs.push("ยังไม่ทราบสายที่สนใจ — ควรถาม");

  const suggestedAction = suggestAction(c);
  const priority: LeadPriority = c.pathlab_pay_ready
    ? "hot"
    : c.last_message_direction === "inbound"
      ? "reply"
      : "normal";

  return { headline: headlineParts.join(" · "), needs, suggestedAction, priority };
}

function suggestAction(c: DmConversation): string {
  if (c.pathlab_pay_ready) return "ส่งรายละเอียดการสมัครให้ทันที ก่อน lead เย็น";
  if (!c.grade_level || c.interests.length === 0)
    return "ถามข้อมูลที่ขาด (ชั้นปี / สายที่สนใจ) ก่อนแนะนำ";
  switch (c.stage) {
    case "exploring":
      return "ส่งลิงก์ PathLab พร้อมคำแนะนำตามสายที่สนใจ";
    case "building":
      return "ชวนเข้า Community เพื่อต่อยอดโปรเจกต์ที่ทำอยู่";
    case "job_seeking":
      return "แนะนำ Talent platform และวิธีทำพอร์ตให้โดดเด่น";
    default:
      return "ทักทายและถามว่าสนใจเรื่องอะไร";
  }
}
