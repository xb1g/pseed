/**
 * The batch-sweep rewrite: same Qwen endpoint as `personalize.ts`, stricter
 * brief.
 *
 * `personalize.ts` rewrites one message an operator is about to read. This
 * rewrites dozens that an operator will skim, so the failure mode is different:
 * nobody catches a message that is merely *slightly* off, and slightly-off at
 * batch size is what makes an account read as automated.
 *
 * The rules below are reverse-engineered from this inbox's own evidence rather
 * than from taste. What worked: "โทษที หายไปคุยกับน้องคนอื่นอยู่ 😅" (continues
 * the thread, one emoji, admits the gap) and "ค่ายของคณะโดยตรง > open house
 * เยอะมากครับ" (ranked, reasoned, typed the way a person texts). What produced
 * "โอเคคับ ;(" and "ขอบคุณค่ะ💗" dead-ends: a greeting on every message, stacked
 * clauses, and a bare link.
 *
 * `validateHumanized` is not decoration. The model will sometimes ignore the
 * brief, and at batch size a deterministic reject-and-fall-back is the only
 * thing standing between a bad rewrite and 90 sends.
 */

import { completeQwenChat } from "@/lib/dm-leads/qwen-client";
import {
  buildLeadFacts,
  sanitizePersonalizedMessage,
  type PersonalizeLead,
} from "@/lib/dm-leads/personalize";
import { applyVariant, type CampaignVariant } from "@/lib/dm-leads/campaign";

/** Recent thread turns, oldest first, so the model can continue rather than restart. */
export interface ThreadTurn {
  direction: "inbound" | "outbound";
  body: string | null;
}

export interface HumanizeRequest {
  template: string;
  lead: PersonalizeLead;
  variant: CampaignVariant;
  /** Last few turns. More than ~6 buys nothing and costs latency per draft. */
  recentTurns: ThreadTurn[];
}

const MAX_TURNS = 6;
const MAX_SENTENCES = 4;
const MAX_EMOJI = 1;
const MAX_LENGTH = 420;

/**
 * Extended-pictographic covers the emoji these threads actually use (😆 🙏 🌱
 * 💗). Text-presentation symbols and Thai punctuation are deliberately outside
 * it, so "ครับ/ค่ะ" and "..." never count against the budget.
 */
const EMOJI_PATTERN = /\p{Extended_Pictographic}/gu;

/**
 * A greeting is fine on first contact and reads as a script mid-thread.
 *
 * The Thai alternatives are matched as bare prefixes: `\b` is defined against
 * ASCII `\w`, so it never fires between two Thai characters and would silently
 * disable every Thai branch here. Only the Latin ones can take a boundary.
 */
const GREETING_PATTERN = /^\s*(?:สวัสดี|หวัดดี|ดีครับ|ดีค่ะ|ฮัลโหล|(?:hello|hi|hey)\b)/i;

/** Brochure voice: explaining our own product in a parenthetical. */
const BROCHURE_PATTERN = /\((?=[^)]*(?:โปรแกรม|แพลตฟอร์ม|คอร์ส|บริการ|platform|program))[^)]*\)/i;

const SYSTEM_PROMPT = `คุณคือพี่บุญ (PassionSeed) กำลังพิมพ์ตอบน้องใน IG DM ที่คุยกันค้างไว้

งาน: เขียนข้อความถัดไปในบทสนทนานี้ ตามจุดประสงค์ของเทมเพลต แต่ให้เป็นภาษาคนจริงที่กำลังคุยต่อ

กฎเหล็ก (ผิดข้อเดียวคือใช้ไม่ได้):
1. ห้ามทักทายขึ้นต้น ห้ามขึ้นด้วย "สวัสดีครับ" หรือเรียกชื่อขึ้นต้น เพราะเราคุยกันอยู่แล้ว ให้ต่อบทสนทนาเลย
2. อีโมจิได้มากสุด 1 ตัว ในทั้งข้อความ ไม่ใส่เลยก็ได้ ห้ามใส่ท้ายทุกประโยค
3. ยาวมากสุด 4 ประโยค พิมพ์บนมือถือแล้วไม่ต้องเลื่อน
4. ต้องอ้างถึงสิ่งที่น้องพิมพ์มาจริงอย่างน้อย 1 อย่าง (สายที่สนใจ ชั้นปี กิจกรรมที่เคยทำ หรือคำที่น้องเพิ่งพูด) ห้ามเขียนแบบที่ส่งให้ใครก็ได้
5. ถ้าให้ความเห็น ต้องจัดอันดับและบอกเหตุผล เช่น "A > B เพราะ..." ห้ามให้กำลังใจลอยๆ ห้ามชมว่า "เยี่ยมมาก" "เก่งจัง"
6. ห้ามอธิบายสินค้าตัวเองในวงเล็บ ห้ามน้ำเสียงโฆษณา
7. ห้ามแต่งวันที่ เดดไลน์ จำนวนที่นั่ง ราคา หรือลิงก์ที่ไม่มีในเทมเพลต ช่อง [วันที่] [เดือน] [n] [X] ต้องคงรูป [..] ไว้
8. ห้ามลดราคา ห้ามขาย Community ห้ามลงท้ายว่า "ยังไม่มีสายนั้น"

น้ำเสียง: พี่ชายที่รู้จริงและตรงไปตรงมา ไม่ตื๊อ ไม่ประจบ ใช้ครับ พิมพ์แบบแชท ไม่ใช่แบบอีเมล

ส่งกลับมาเฉพาะตัวข้อความ ไม่มีคำอธิบาย ไม่มีเครื่องหมายคำพูดครอบ`;

const VARIANT_INSTRUCTION: Record<CampaignVariant, string> = {
  ask: "ลงท้ายด้วยคำถามสั้นๆ ที่ขอคำตอบว่าเอาหรือไม่เอา",
  no_ask: "ให้ความเห็นแล้วจบ ห้ามลงท้ายด้วยคำถามขอให้ตัดสินใจ",
};

function renderTurns(turns: ThreadTurn[]): string {
  const recent = turns.filter((t) => t.body?.trim()).slice(-MAX_TURNS);
  if (recent.length === 0) return "(ยังไม่มีข้อความก่อนหน้า)";
  return recent
    .map((t) => `${t.direction === "inbound" ? "น้อง" : "พี่"}: ${t.body!.trim()}`)
    .join("\n");
}

export function buildHumanizeMessages(
  request: HumanizeRequest
): { role: "system" | "user"; content: string }[] {
  const facts = buildLeadFacts(request.lead);
  const user = [
    "บทสนทนาล่าสุด:",
    renderTurns(request.recentTurns),
    "",
    "ข้อมูลน้อง:",
    facts || "ยังไม่รู้ชื่อ ชั้นปี หรือสายที่สนใจ",
    "",
    `จุดประสงค์ของข้อความนี้: ${VARIANT_INSTRUCTION[request.variant]}`,
    "",
    "เทมเพลต:",
    request.template,
  ].join("\n");

  return [
    { role: "system", content: SYSTEM_PROMPT },
    { role: "user", content: user },
  ];
}

export type CringeReason =
  | "greeting"
  | "too_many_emoji"
  | "too_many_sentences"
  | "too_long"
  | "brochure_voice"
  | "empty";

export const CRINGE_LABELS: Record<CringeReason, string> = {
  greeting: "ขึ้นต้นด้วยคำทักทายทั้งที่คุยกันอยู่",
  too_many_emoji: "อีโมจิเกิน 1 ตัว",
  too_many_sentences: "ยาวเกิน 4 ประโยค",
  too_long: "ยาวเกินไป",
  brochure_voice: "น้ำเสียงโฆษณา",
  empty: "ว่าง",
};

/** Thai has no sentence-final period, so count the breaks people actually type. */
function countSentences(body: string): number {
  const parts = body
    .split(/\n+|(?<=[?!？！])\s+|(?<=\S)\s{2,}/u)
    .map((p) => p.trim())
    .filter(Boolean);
  return Math.max(1, parts.length);
}

export function validateHumanized(body: string): CringeReason[] {
  const text = body.trim();
  if (!text) return ["empty"];

  const reasons: CringeReason[] = [];
  if (GREETING_PATTERN.test(text)) reasons.push("greeting");
  if ((text.match(EMOJI_PATTERN) ?? []).length > MAX_EMOJI) {
    reasons.push("too_many_emoji");
  }
  if (countSentences(text) > MAX_SENTENCES) reasons.push("too_many_sentences");
  if (text.length > MAX_LENGTH) reasons.push("too_long");
  if (BROCHURE_PATTERN.test(text)) reasons.push("brochure_voice");
  return reasons;
}

export interface HumanizeResult {
  body: string;
  /** True when the rewrite was rejected and the template was used instead. */
  fellBack: boolean;
  cringe: CringeReason[];
}

/**
 * Rewrites one template for one lead. Never throws: a dead Qwen or a rejected
 * rewrite yields the verbatim playbook copy, which is the same text an operator
 * would have pasted by hand.
 */
export async function humanizeDraft(
  request: HumanizeRequest
): Promise<HumanizeResult> {
  const template = applyVariant(request.template.trim(), request.variant);
  if (!template) return { body: request.template, fellBack: true, cringe: ["empty"] };

  try {
    const raw = await completeQwenChat({
      messages: buildHumanizeMessages({ ...request, template }),
      maxTokens: 320,
      temperature: 0.5,
      timeoutMs: 20_000,
    });

    const cleaned = sanitizePersonalizedMessage(template, raw);
    if (!cleaned) return { body: template, fellBack: true, cringe: ["empty"] };

    const cringe = validateHumanized(cleaned);
    if (cringe.length > 0) return { body: template, fellBack: true, cringe };

    return { body: applyVariant(cleaned, request.variant), fellBack: false, cringe: [] };
  } catch (error) {
    console.warn("[dm-leads.humanize] Qwen rewrite failed, using template", error);
    return { body: template, fellBack: true, cringe: [] };
  }
}
