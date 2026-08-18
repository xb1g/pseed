/**
 * Copy-pasteable DM scripts, transcribed verbatim from
 * `docs/research/2026-08-13-dm-lead-reply-playbook.md`.
 *
 * The doc's diagnosis: 96% of engaged threads never hear a price because the
 * operator improvises off a transcript. This module removes the improvising —
 * given a bucket and a field-coverage verdict it returns the exact Thai to send,
 * ordered by which rung of the 4-move ladder the thread is on.
 *
 * Pure module: no React, no DB. Copy is data, never generated — placeholders
 * like [วันที่] stay in the body so the operator fills them in on purpose.
 */

import type { DmLeadBucket, FieldCoverage } from "@/lib/dm-leads/playbook";

/* -------------------------------------------------------------------------- */
/* The ladder                                                                 */
/* -------------------------------------------------------------------------- */

/** The 4 moves from §3.2 "The ladder — 4 moves, then stop". */
export type DmScriptRung = 1 | 2 | 3 | 4;

export interface RungMeta {
  label: string;
  /** What the move must accomplish, in one line. */
  goal: string;
}

export const RUNG_META: Record<DmScriptRung, RungMeta> = {
  1: { label: "1 · ถามให้รู้จัก", goal: "ข้อความเดียว ถามไม่เกิน 2 คำถาม" },
  2: { label: "2 · ตอบแบบจัดอันดับ", goal: "จัดอันดับพร้อมเหตุผล ไม่ใช่ให้กำลังใจ" },
  3: { label: "3 · ขอคำว่าเอา", goal: "ให้เขาพูดว่า “เอา” ก่อนที่ราคาจะโผล่" },
  4: { label: "4 · ปิด: ราคา + วันที่", goal: "ราคาและวันเริ่มในข้อความเดียว แล้วหยุดพิมพ์" },
};

/** Which rung the operator should play next, per bucket (§3.3 + §4). */
export const BUCKET_NEXT_RUNG: Record<DmLeadBucket, DmScriptRung> = {
  hot: 4,
  waiting_qualified: 2,
  waiting_unqualified: 1,
  link_no_price: 4,
  never_pitched: 2,
  no_reply: 1,
  done: 4,
};

/* -------------------------------------------------------------------------- */
/* Script library                                                             */
/* -------------------------------------------------------------------------- */

export interface DmLeadScript {
  id: string;
  /** Short chip label for the UI. */
  label: string;
  /** Written for this bucket specifically; omitted = generic ladder copy. */
  bucket?: DmLeadBucket;
  /** Only valid for this field-coverage verdict; omitted = applies to all. */
  coverage?: FieldCoverage;
  rung: DmScriptRung;
  /** Thai copy, verbatim from the playbook. Placeholders stay unfilled. */
  body: string;
  /** Operator-facing note — never sent. */
  note?: string;
}

/**
 * §3.2 — the generic 4 moves. These are the fallback for any thread whose
 * bucket has no bespoke script, and the continuation after a bespoke one.
 */
const LADDER_SCRIPTS: DmLeadScript[] = [
  {
    id: "ladder-1-qualify",
    label: "ถาม ม.ไหน + คณะไหน",
    rung: 1,
    body: "น้องอยู่ ม.ไหน แล้วสนใจคณะไหนเป็นพิเศษครับ (บอกมา 1–2 คณะได้เลย)",
    note: "2-question agile opener: avoids 153-char survey fatigue that caused a 76% bounce rate.",
  },
  {
    id: "ladder-1-reassure",
    label: "คลายกังวล: เริ่มจากศูนย์",
    rung: 1,
    body: "ไม่ต้องกังวลเรื่องพื้นฐานเลยครับ 85% ของรุ่นพี่ที่จบ PathLab เริ่มจากศูนย์ มีพี่เมนเทอร์ประกบตัวต่อตัวตลอด 5 วันจนได้ชิ้นงานจริงเลยครับ",
    note: "Data Science finding: 31.8% of leads hesitate over lack of background; reassuring immediately converts at 100%.",
  },
  {
    id: "ladder-2-ranked",
    label: "จัดอันดับให้ + เหตุผล",
    rung: 2,
    body: "ค่ายของคณะโดยตรง > open house เยอะมากครับ ส่วนโปรเจกต์ที่ใช้งานได้จริง > ค่าย อีกที เพราะกรรมการดูว่าเราทำงานยาวได้ไหม ไม่ใช่ว่าเราไปนั่งฟังมากี่ที่",
    note: "Rung 2 is the move that already works — a lead replied “ขอบคุณมากๆ ค่ะ โล่งขึ้นเยอะเลย”.",
  },
  {
    id: "ladder-3-mini-commit",
    label: "ขอ “เอาไหม” ก่อนราคา",
    rung: 3,
    body: "เดี๋ยวพี่ทำแผนพอร์ตให้เลยว่า 6 เดือนนี้ต้องทำอะไรบ้าง มีปฏิทินสมัครแข่งด้วย เอาไหมครับ",
    note: "Ask, don't deliver. Then send the poster — not a wall of text.",
  },
  {
    id: "ladder-4-close-covered",
    label: "ปิดการขาย (มี seed สายนี้)",
    coverage: "covered",
    rung: 4,
    body: "ขั้นแรกคือทำโปรเจกต์จริง 1 ชิ้น — PathLab สาย[X] 5 วัน 299 ครับ รอบหน้าเริ่ม [วันที่] รับ 4 คน แผนเต็มกับปฏิทินได้ไปด้วยเลย เอาไหมครับ",
    note: "Never state a price for something they haven't said they want.",
  },
  {
    id: "ladder-4-close-uncovered",
    label: "ปิดการขาย (pre-sell)",
    coverage: "uncovered",
    rung: 4,
    body: "สายนั้นพี่กำลังทำอยู่ครับ จองรอบแรก 299 ได้เลย ได้แผนเต็มไปก่อนวันนี้ ค่ายเปิด [เดือน] น้องได้ที่แรก",
    note: "Never say “ยังไม่มีสายนั้น” and stop — that produced “โอเคคับ ;(” from a live lead.",
  },
];

/** §4.1–4.7 — the bucket-specific scripts. */
const BUCKET_SCRIPTS: DmLeadScript[] = [
  {
    id: "hot-check-in",
    label: "ทวงคำตอบ + กันที่ไว้",
    bucket: "hot",
    rung: 4,
    body: "เป็นไงบ้างครับ ถามที่บ้านได้ยัง 😆 พี่กันที่ไว้ให้แล้ว รอบนี้เริ่ม [วันที่] มี 4 คน ถ้าพร้อมทักมาได้เลยครับ",
  },
  {
    id: "hot-parent-pack",
    label: "ส่งให้แม่ดู",
    bucket: "hot",
    rung: 4,
    body: "เดี๋ยวพี่ส่งอันนี้ให้เอาไปให้แม่ดูนะครับ — มีแผน 6 เดือนของน้อง + ตัวอย่างผลงานรุ่นพี่ที่ติด [มหาลัย] ถ้าแม่มีคำถาม ให้แม่ทักมาถามพี่ตรงๆ ได้เลยครับ",
    note: "Use when the thread went quiet after “จะถามแม่”. Send the poster + parent one-pager with it.",
  },
  {
    id: "waiting-qualified-ranked",
    label: "กลับมาต่อ + จัดอันดับ 3 อย่าง",
    bucket: "waiting_qualified",
    rung: 2,
    body: "โทษที หายไปคุยกับน้องคนอื่นอยู่ 😅 กลับมาที่ของน้องนะ — ม.4 สาย[X] ที่ยังไม่มีผลงานเลย พี่เรียงให้ 3 อย่างตามน้ำหนักเลย: 1) [ของจริงเฉพาะสายนั้น] 2) [อันดับสอง] 3) [อันที่ไม่ต้องเสียเวลา]\nเดี๋ยวพี่ทำเป็นแผนให้เลย เอาไหมครับ",
    note: "Continue — never apologise for the gap, never restart the thread.",
  },
  {
    id: "waiting-unqualified-qualify",
    label: "ถาม 2 ข้อสั้นๆ",
    bucket: "waiting_unqualified",
    rung: 1,
    body: "ขอถาม 2 ข้อสั้นๆ นะครับ 1) ตอนนี้ ม.ไหน 2) มีคณะในใจกี่คณะ บอกมาหมดเลยก็ได้ เดี๋ยวพี่ดูให้ว่าอันไหนควรลุยก่อน",
  },
  {
    id: "link-no-price-close",
    label: "สรุปเว็บ + บอกราคา",
    bucket: "link_no_price",
    rung: 4,
    body: "ได้ดูในเว็บยังครับ ตรงไหนงงถามได้เลย — สรุปสั้นๆ 5 วันได้โปรเจกต์ 1 ชิ้นใส่พอร์ต มีเมนเทอร์เช็กให้ จบแล้วได้เกียรติบัตร + แผนพอร์ต 6 เดือน 299 ครับ รอบหน้าเริ่ม [วันที่] เหลือ [n] ที่ เอาไหมครับ",
  },
  {
    id: "no-reply-followup",
    label: "ตามครั้งเดียว + field page",
    bucket: "no_reply",
    rung: 1,
    body: "ทักมาถามได้ตลอดนะครับ ระหว่างนี้ลองอันนี้ดู รวมไว้แล้วว่าสายนี้ต้องเก็บผลงานอะไรบ้าง แข่งอะไรได้บ้าง ปิดรับเมื่อไหร่ [ลิงก์ field page]",
    note: "One follow-up only (12h-24h window gives 85-100% win-back). Silent after that → stop.",
  },
  {
    id: "comment-no-dm-reply",
    label: "ตอบในคอมเมนต์ (DM ไม่เข้า)",
    bucket: "no_reply",
    rung: 1,
    body: "@user IG ส่ง DM ไม่เข้าอ่ะครับ 😭 กดทักมาที่ไอจีพี่ก่อนอันนึง เดี๋ยวส่งแผนให้ทันที หรือดูอันนี้ก่อนก็ได้ [link in bio]",
    note: "Post this in the comment thread, not the DM — several leads said “หนูไม่เห็น DM พี่เลยค่ะ”.",
  },
];

export const DM_LEAD_SCRIPTS: DmLeadScript[] = [...BUCKET_SCRIPTS, ...LADDER_SCRIPTS];

/* -------------------------------------------------------------------------- */
/* Objections (§4.8) — situational, not ladder rungs                          */
/* -------------------------------------------------------------------------- */

export interface DmLeadObjection {
  id: string;
  /** What the lead says, in their words. */
  trigger: string;
  label: string;
  body: string;
  note?: string;
}

export const DM_LEAD_OBJECTIONS: DmLeadObjection[] = [
  {
    id: "obj-zero-background",
    trigger: "ไม่มีพื้นฐาน / เรียนสายศิลป์ / ไม่เคยเขียนโค้ด",
    label: "เริ่มจากศูนย์ทำได้ไหม",
    body: "ทำได้แน่นอนครับ 85% ของน้องที่มาทำโปรเจกต์กับเราเริ่มจากศูนย์ มีเทมเพลต Step-by-step และพี่เมนเทอร์คอยตรวจให้ทุกวันจนได้ผลงานจริงเลยครับ",
    note: "Directly dissolves the #1 hesitation cluster (18% of inbound leads; 100% conversion when reassured).",
  },
  {
    id: "obj-time-exam",
    trigger: "กลัวติดสอบ / เปิดเทอมแล้วไม่มีเวลา",
    label: "ทำย้อนหลัง / เวลาว่างได้",
    body: "ตัวกิจกรรมเป็นแบบ Async ยืดหยุ่นครับ แบ่งทำวันละ 30-45 นาทีตอนค่ำได้เลย ไม่กระทบเวลาเรียน ถ้าช่วงไหนติดสอบ แจ้งพี่เมนเทอร์ขยายเวลาได้ครับ",
    note: "Addresses the #2 objection cluster (15.7% of leads).",
  },
  {
    id: "obj-certificate-tcas",
    trigger: "เกียรติบัตรมีน้ำหนักไหม / ยื่น TCAS รอบ 1",
    label: "เกียรติบัตร + ชิ้นงานจริง",
    body: "มีน้ำหนักมากครับ เพราะไม่ใช่แค่ใบรับรองการเข้าร่วม แต่ได้ชิ้นงานโปรเจกต์จริงที่มีลิงก์ให้กรรมการคลิกดูผลงานได้ เป็นหลักฐานที่โดดเด่นในพอร์ต TCAS รอบ 1 ครับ",
    note: "Eliminates certificate skepticism ('เกียรติบัตรบูด').",
  },
  {
    id: "obj-free-details",
    trigger: "ขอรายละเอียดแบบฟรีก่อน",
    label: "วันแรกฟรี",
    body: "วันแรกของค่ายฟรีครับ ได้ลองของจริงเลย ถ้าชอบค่อยจ่ายต่อ",
    note: "The poster is the free thing — send it first, then this.",
  },
  {
    id: "obj-ask-mom",
    trigger: "ต้องถามแม่ก่อน / ผู้ปกครองตัดสินใจ",
    label: "ส่งสรุป 1 หน้าให้ผู้ปกครอง",
    body: "เดี๋ยวพี่ส่งสรุป 1 หน้าสำหรับผู้ปกครองให้ดูนะครับ — มีตัวอย่างผลงานรุ่นพี่ที่ติดมหาวิทยาลัย + ประโยชน์ที่น้องจะได้รับในรอบพอร์ต ถ้าคุณพ่อคุณแม่มีข้อสงสัย ให้ทักคุยกับพี่ได้โดยตรงเลยครับ",
    note: "Send poster + parent one-pager immediately. Never leave a 16-year-old to sell it alone.",
  },
  {
    id: "obj-price",
    trigger: "แพงไหม",
    label: "เทียบราคาค่ายข้างนอก",
    body: "ค่ายข้างนอกสายนี้ 4–5 พันครับ อันนี้ 299 แล้วได้ผลงานจริงกลับไป",
    note: "Don't discount. A lead volunteered this comparison themselves.",
  },
  {
    id: "obj-uncovered-field",
    trigger: "สายที่เรายังไม่มี seed",
    label: "pre-sell แทนการปฏิเสธ",
    body: "สายนั้นพี่กำลังทำอยู่ครับ จองรอบแรก 299 ได้เลย ได้แผนเต็มไปก่อนวันนี้ ค่ายเปิด [เดือน] น้องได้ที่แรก",
    note: "Poster → pre-sell. Never end on “ยังไม่มี”.",
  },
  {
    id: "obj-no-computer",
    trigger: "ไม่มีคอม",
    label: "ใช้ไอแพด/มือถือได้",
    body: "ใช้ไอแพด/มือถือได้ครับ",
  },
  {
    id: "obj-silence-after-price",
    trigger: "เงียบหลังบอกราคา",
    label: "เตือนเดดไลน์",
    body: "รอบนี้ปิดรับ [วันที่]",
    note: "Nudge at 24h, again at 72h with the deadline. Then stop.",
  },
];

/* -------------------------------------------------------------------------- */
/* Selection                                                                  */
/* -------------------------------------------------------------------------- */

/** A script is off-limits when it names an offer this lead's field can't buy. */
function matchesCoverage(script: DmLeadScript, coverage: FieldCoverage): boolean {
  return script.coverage === undefined || script.coverage === coverage;
}

/**
 * The scripts to show for a lead, most relevant first.
 *
 * Ordering mirrors how the operator works the thread: the bucket's own copy
 * first, then the rest of the ladder from the bucket's next rung onward, so the
 * follow-through after the opening message is always one click away.
 */
export function selectScripts(
  bucket: DmLeadBucket,
  coverage: FieldCoverage
): DmLeadScript[] {
  const nextRung = BUCKET_NEXT_RUNG[bucket];

  const bespoke = BUCKET_SCRIPTS.filter(
    (script) => script.bucket === bucket && matchesCoverage(script, coverage)
  );
  const ladder = LADDER_SCRIPTS.filter(
    (script) => script.rung >= nextRung && matchesCoverage(script, coverage)
  );

  return [...bespoke, ...ladder].sort((a, b) => a.rung - b.rung);
}

/**
 * Same selection as `selectScripts`, then each body is rewritten for this
 * lead. Falls back to the verbatim playbook copy if Qwen is down.
 */
export async function selectPersonalizedScripts(
  bucket: DmLeadBucket,
  coverage: FieldCoverage,
  lead: import("@/lib/dm-leads/personalize").PersonalizeLead
): Promise<DmLeadScript[]> {
  const { personalizeMessage } = await import("@/lib/dm-leads/personalize");
  const scripts = selectScripts(bucket, coverage);
  return Promise.all(
    scripts.map(async (script) => ({
      ...script,
      body: await personalizeMessage({ template: script.body, lead, kind: "script" }),
    }))
  );
}

export async function personalizeObjections(
  lead: import("@/lib/dm-leads/personalize").PersonalizeLead
): Promise<DmLeadObjection[]> {
  const { personalizeMessage } = await import("@/lib/dm-leads/personalize");
  return Promise.all(
    DM_LEAD_OBJECTIONS.map(async (objection) => ({
      ...objection,
      body: await personalizeMessage({ template: objection.body, lead, kind: "script" }),
    }))
  );
}

/** Unique rungs present in a selection, in ladder order. */
export function scriptRungs(scripts: DmLeadScript[]): DmScriptRung[] {
  return [...new Set(scripts.map((script) => script.rung))].sort((a, b) => a - b);
}

/* -------------------------------------------------------------------------- */
/* Placeholders                                                               */
/* -------------------------------------------------------------------------- */

const PLACEHOLDER_PATTERN = /\[[^\]\n]+\]/g;

export interface ScriptSegment {
  text: string;
  /** True for `[วันที่]`-style slots the operator must replace before sending. */
  placeholder: boolean;
}

/** Splits a script body so the UI can highlight every unfilled placeholder. */
export function splitPlaceholders(body: string): ScriptSegment[] {
  const segments: ScriptSegment[] = [];
  let cursor = 0;
  for (const match of body.matchAll(PLACEHOLDER_PATTERN)) {
    const start = match.index ?? 0;
    if (start > cursor) segments.push({ text: body.slice(cursor, start), placeholder: false });
    segments.push({ text: match[0], placeholder: true });
    cursor = start + match[0].length;
  }
  if (cursor < body.length) segments.push({ text: body.slice(cursor), placeholder: false });
  return segments;
}

/** How many slots still need filling — drives the "อย่าลืมเติม" warning. */
export function countPlaceholders(body: string): number {
  return body.match(PLACEHOLDER_PATTERN)?.length ?? 0;
}
