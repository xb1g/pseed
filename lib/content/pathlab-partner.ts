/**
 * Copy for the /pathlab/partner expert invitation page.
 *
 * Same rules as pathlab-page.ts: copy lives here so Thai text can be edited
 * without touching layout. The page rides on the cream .pathlab-page canvas,
 * so it shares .pathlab-nav, .pathlab-note, .pathlab-hero__cta and
 * .talent-marquee with /pathlab; margin-note copy itself stays in the NOTES
 * block of pathlab-page.ts.
 *
 * The page is a universal expert invitation, not a single-field pitch: any
 * professional, teacher, or practitioner should understand the offer in ten
 * seconds and find a contribution mode that fits what they already have.
 */

import type { ContributionMode } from "@/types/expert-interview";

/** Interview entry point for this page. Source tracking is always attached;
 *  a contribution mode is added when the expert picked one on the page. */
export function partnerInterviewHref(mode?: ContributionMode): string {
  const params = new URLSearchParams({ source: "partner" });
  if (mode) params.set("mode", mode);
  return `/expert-interview?${params.toString()}`;
}

/** In-page anchors for the sticky top bar. */
export const PARTNER_NAV_LINKS = [
  { href: "#partner-modes", label: "วิธีร่วม" },
  { href: "#partner-proof", label: "ตัวอย่าง" },
  { href: "#partner-exchange", label: "แลกเปลี่ยน" },
  { href: "#partner-start", label: "เริ่มเลย" },
] as const;

/** Scrolling strip under the nav, same construction as /pathlab. */
export const PARTNER_MARQUEE = [
  "เปลี่ยนประสบการณ์จริงให้เป็น PathLab",
  "ชื่อและเสียงของคุณอยู่กับผลงาน",
  "คุณอนุมัติก่อนเผยแพร่เสมอ",
  "ทีมเราจัดการระบบให้ทั้งหมด",
  "จากหน้างานจริงสู่มือนักเรียน",
] as const;

export const PARTNER_HERO = {
  eyebrow: "PassionSeed Expert Invitation · ทุกสาขาอาชีพ",
  titleLead: "ความรู้ของคุณ",
  /** The terracotta accent span inside the title. */
  titleAccent: "ไม่ควรอยู่แค่ในห้องเรียน",
  titleTail: "",
  /* Split into parts so the strong phrase stays real markup, not HTML in a
     string. */
  subtitleLead: "เราช่วยเปลี่ยนประสบการณ์จริงของคุณให้กลายเป็น",
  subtitleStrong: "PathLab ที่คนลงมือทำได้",
  subtitleTail:
    "ไม่ว่าจะเป็นคอร์สที่คุณสอน งานที่คุณทำจริง หรือเคสที่มีแค่คุณเท่านั้นที่เล่าได้ เราช่วยเรียบเรียง สร้างระบบ และเผยแพร่โดยยังมีชื่อและเสียงของคุณอยู่กับผลงาน",
  ctas: {
    primary: { label: "เริ่มแบ่งปันสิ่งที่คุณรู้", href: "/expert-interview?source=partner" },
    secondary: { label: "ดูตัวอย่าง PathLab", href: "#partner-proof" },
  },
} as const;

/** The four reassurances a busy expert scans for, straight under the hero.
 *  Deliberately honest: no revenue terms until the actual model exists. */
export const PARTNER_METRICS = [
  { value: "10-15 นาที", label: "เริ่มจากการคุยสั้นๆ หรือส่งของเพียงชิ้นเดียว" },
  { value: "คุณอนุมัติก่อนเสมอ", label: "ไม่มี PathLab ไหนเผยแพร่โดยไม่ผ่านคุณ" },
  { value: "ชื่อของคุณ", label: "ติดอยู่กับผลงานทุกชิ้นที่คุณร่วมสร้าง" },
  { value: "เราทำระบบให้", label: "โครงสร้าง การเขียน อินเทอร์แอกชัน และ QA" },
] as const;

export const PARTNER_GOAL = {
  heading: "ทำไมเราถึงชวนผู้เชี่ยวชาญมาสร้าง PathLab?",
  bodyLead:
    "ในทุกสาขา นักเรียนมักเรียนทฤษฎีผ่านการท่องจำ แต่แทบไม่เคยเห็นว่า",
  bodyStrong: "คนที่ทำงานจริงต้องคิดและตัดสินใจอย่างไร",
  bodyTail:
    "หลายคนเรียนจบมาแล้วพบว่าไม่ชอบงานสายนี้ หรือคนที่อาจจะเก่งกลับถอดใจไปก่อน เพราะมองไม่เห็นภาพงานจริง",
  missionLabel: "Mission ของเรา:",
  missionBody:
    "เปลี่ยนประสบการณ์จริงของผู้เชี่ยวชาญแต่ละสาขาให้เป็น PathLab ที่นักเรียนได้สวมบทบาท ลงมือทำ และตัดสินใจกับโจทย์จริง เพื่อค้นหาว่าเส้นทางนี้เหมาะกับตัวเองหรือไม่",
} as const;

/* ── Contribution modes ── */

export interface PartnerMode {
  id: ContributionMode;
  /** The selector tab label, phrased as the expert's own voice. */
  label: string;
  /** Panel rows: what the expert contributes. */
  bring: string;
  /** Panel rows: how much effort is needed. */
  effort: string;
  /** Panel rows: what PassionSeed creates. */
  create: string;
  /** Panel rows: what the expert gets back. */
  receive: string;
  /** The next action, deep-linked with this mode attached. */
  ctaLabel: string;
}

export const PARTNER_MODES = {
  kicker: "เลือกวิธีที่ตรงกับคุณ",
  heading: "คุณมีอะไรอยากแบ่งปัน?",
  tablistLabel: "เลือกรูปแบบการแบ่งปัน",
  rows: {
    bring: "คุณนำมา",
    effort: "ใช้แรงเท่าไหร่",
    create: "เราสร้างให้",
    receive: "คุณได้รับ",
  },
  modes: [
    {
      id: "course",
      label: "ฉันมีคอร์สหรือหลักสูตรอยู่แล้ว",
      bring: "หลักสูตร สไลด์ แบบฝึกหัด หรือวิดีโอที่คุณใช้สอนอยู่แล้ว",
      effort: "น้อยมาก ส่งไฟล์ที่มีอยู่ แล้วคุยกับเราอีก 1-2 ครั้ง",
      create:
        "PathLab แบบลงมือทำจากเนื้อหาของคุณ พร้อมแบบประเมินและ feedback ให้นักเรียน",
      receive:
        "คอร์สเวอร์ชัน interactive ที่มีชื่อคุณกำกับ พร้อมข้อมูลว่านักเรียนทำอะไรได้จริง",
      ctaLabel: "เริ่มจากคอร์สของคุณ",
    },
    {
      id: "work",
      label: "ฉันมีประสบการณ์จากงานจริง",
      bring: "เรื่องเล่าหน้างาน วิธีตัดสินใจ และข้อผิดพลาดที่คนใหม่มักเจอ",
      effort: "คุยกับ AI ของเรา 10-15 นาที ตอบจากประสบการณ์ตรง ไม่ต้องเตรียมตัว",
      create:
        "สถานการณ์จำลองที่ให้นักเรียนสวมบทบาทและตัดสินใจกับโจทย์จริงของคุณ",
      receive:
        "เครดิตผู้เชี่ยวชาญบน PathLab และโปรไฟล์สาธารณะที่แชร์ต่อได้",
      ctaLabel: "เล่าประสบการณ์ของคุณ",
    },
    {
      id: "case",
      label: "ฉันมีเคสหรือวิธีทำงานที่อยากแบ่งปัน",
      bring: "เคสเดียวที่คุณภูมิใจ หรือวิธีทำงานที่มีแค่คุณเท่านั้นที่รู้",
      effort: "เล่าเคสเดียวให้เราฟัง หรือส่งเอกสารที่มีอยู่แล้ว",
      create:
        "Micro PathLab จากเคสนั้น ให้คนอื่นได้ลองแก้โจทย์เดียวกับที่คุณเคยเจอ",
      receive:
        "เคสของคุณกลายเป็นบทเรียนที่คนใช้จริง พร้อมชื่อและเครดิตของคุณ",
      ctaLabel: "แบ่งปันเคสของคุณ",
    },
    {
      id: "other",
      label: "อื่นๆ",
      bring: "อะไรก็ได้ที่คุณรู้ลึกกว่าคนส่วนใหญ่ เครื่องมือ เทคนิค หรือมุมมองเฉพาะตัว",
      effort: "เริ่มจากคุยสั้นๆ แล้วเราจะช่วยกันหารูปแบบที่เหมาะกับเนื้อหาของคุณ",
      create: "รูปแบบที่เหมาะกับเนื้อหาของคุณโดยเฉพาะ ไม่บังคับเข้าเทมเพลต",
      receive: "ช่องทางเผยแพร่ความรู้ที่มีชื่อคุณกำกับ และทีมที่ดูแลให้ตลอด",
      ctaLabel: "คุยกับเราก่อน",
    },
  ] as PartnerMode[],
} as const;

/* ── Proof: the transformation, shown across fields ── */

export interface PartnerProofExample {
  field: string;
  /** Raw expert insight, in the expert's voice. */
  insight: string;
  /** The real task students get to do. */
  task: string;
}

export const PARTNER_PROOF = {
  kicker: "จากประสบการณ์จริง สู่ PathLab",
  heading: "ความรู้ของคุณกลายเป็นแบบนี้",
  /** The transformation every contribution goes through. */
  flow: [
    "ความรู้ดิบจากผู้เชี่ยวชาญ",
    "โจทย์จากงานจริง",
    "ผลงานที่นักเรียนทำจริง",
    "PathLab พร้อมชื่อคุณ",
  ],
  insightLabel: "จากประสบการณ์จริง",
  taskLabel: "นักเรียนได้ลอง",
  examples: [
    {
      field: "วิศวกรรมไฟฟ้า",
      insight: "หน้างานจริงไม่ได้คำนวณจากสูตรอย่างเดียว ต้องเผื่อโหลดและความปลอดภัย",
      task: "เลือกเบรกเกอร์และเดินสายไฟให้ร้านกาแฟจริง พร้อมเขียนเหตุผล",
    },
    {
      field: "แพทยศาสตร์",
      insight: "การ triage คือการตัดสินใจทั้งที่ข้อมูลไม่เคยครบ",
      task: "จัดลำดับผู้ป่วยห้องฉุกเฉินจากอาการที่เล่ามาไม่ครบถ้วน",
    },
    {
      field: "ออกแบบ UX",
      insight: "งานออกแบบส่วนใหญ่คือการป้องกันการตัดสินใจ ไม่ใช่แค่วาดหน้าจอ",
      task: "รีวิวหน้าจอจริงและเขียนเหตุผลว่าอะไรต้องเปลี่ยน ทำไม",
    },
    {
      field: "ธุรกิจ",
      insight: "ตั้งราคาผิดนิดเดียว กำไรหายทั้งร้าน",
      task: "ตั้งราคาเมนูให้ร้านอาหารจริง พร้อมตัวเลขต้นทุนที่ต้องเจอจริง",
    },
    {
      field: "ซอฟต์แวร์",
      insight: "ระบบล่มตอนดึกไม่ได้แก้ด้วยตำรา แต่ด้วยการไล่ log",
      task: "ไล่หาสาเหตุระบบล่มจาก log จริง แล้วเลือกวิธีแก้ที่ปลอดภัยสุด",
    },
    {
      field: "สื่อและคอนเทนต์",
      insight: "พาดหัวหนึ่งบรรทัดตัดสินว่าคนจะอ่านหรือเลื่อนผ่าน",
      task: "เขียนพาดหัวข่าวจริงหลายเวอร์ชัน แล้วทดสอบว่าเวอร์ชันไหนได้ผล",
    },
  ] as PartnerProofExample[],
} as const;

/* ── The exchange ── */

export interface PartnerExchangeCard {
  title: string;
  body: string;
}

/** "แลกกันอย่างตรงไปตรงมา" — icons pair by index in PartnerExchange. */
export const PARTNER_EXCHANGE = {
  heading: "แลกกันอย่างตรงไปตรงมา",
  cards: [
    {
      title: "คุณนำมา",
      body: "ประสบการณ์ เคสจริง เครื่องมือ และข้อจำกัดของงานจริง สิ่งที่อ่านจากตำราไม่ได้",
    },
    {
      title: "เราจัดการ",
      body: "โครงสร้างการเรียน การเขียน อินเทอร์แอกชัน แบบประเมิน และการทดสอบคุณภาพทั้งหมด",
    },
    {
      title: "คุณควบคุม",
      body: "เครดิต การแก้ไข การอนุมัติก่อนเผยแพร่ และสิทธิ์ถอนเนื้อหาเมื่อไหร่ก็ได้",
    },
    {
      title: "คุณได้รับ",
      body: "โปรไฟล์ผู้เชี่ยวชาญ เครดิตบนผลงาน ข้อมูลผลการเรียนของนักเรียน และค่าตอบแทนหรือส่วนแบ่งรายได้ตามที่ตกลงร่วมกัน",
    },
  ] as PartnerExchangeCard[],
};

/* ── Closing: start the real flow ── */

export const PARTNER_CONTACT = {
  heading: "เริ่มแบ่งปันสิ่งที่คุณรู้",
  body: "ไม่ต้องสมัครสมาชิก ไม่ต้องเตรียมตัว เริ่มจากเล่าสิ่งที่คุณรู้ให้เราฟัง แล้วเราจะสร้างร่าง PathLab ให้คุณรีวิวก่อนเสมอ",
  /** What happens next, matching the post-submit copy in the interview flow. */
  steps: [
    "คุณเล่าหรือส่งสิ่งที่มี",
    "เราสร้างร่าง PathLab",
    "คุณรีวิว แก้ไข และอนุมัติ",
    "เผยแพร่พร้อมชื่อคุณ",
  ],
  primaryLabel: "เริ่มแบ่งปันสิ่งที่คุณรู้",
  lineLabel: "หรือทักคุยกับทีมงานก่อน",
  lineHref: "https://line.me/ti/p/~@passionseed",
  small: "คุณอนุมัติทุกอย่างก่อนเผยแพร่ และถอนเนื้อหาได้ทุกเมื่อ",
} as const;
