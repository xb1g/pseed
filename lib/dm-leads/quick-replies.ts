import type { DmConversation, DmLeadStage } from "@/types/dm-leads";

/**
 * Quick-reply engine for the DM leads inbox.
 *
 * Composes Thai-language reply suggestions from three axes:
 *   year  — grade_level (ม.3–ม.6, ปี 1) drives the urgency line
 *   path  — primary interest clustered into a field group drives the advice
 *   stage — exploring / building / job_seeking drives the goal of the reply
 *
 * Intent tags (pay-ready, wants community, …) decide which CTA to close with
 * and which suggestion to put first. Everything is pure and unit-tested.
 */

export type QuickReplyTone = "guide" | "qualify" | "cta";

export interface QuickReply {
  id: string;
  /** Short chip label shown in the UI. */
  label: string;
  tone: QuickReplyTone;
  body: string;
}

export interface QuickReplyContext {
  stage: DmLeadStage;
  gradeLevel: string | null;
  interests: string[];
  displayName?: string | null;
  username?: string | null;
  wantsPathlab: boolean;
  pathlabPayReady: boolean;
  wantsCommunity: boolean;
  wantsTalent: boolean;
  hasHandsOnExperience: boolean;
}

/**
 * Takes only the columns it reads, so it accepts both a full `dm_conversations`
 * row and the narrowed row the inbox list selects.
 */
export function contextFromConversation(
  c: Pick<
    DmConversation,
    | "stage"
    | "grade_level"
    | "interests"
    | "display_name"
    | "username"
    | "wants_pathlab"
    | "pathlab_pay_ready"
    | "wants_community"
    | "wants_talent"
    | "has_hands_on_experience"
  >
): QuickReplyContext {
  return {
    stage: c.stage,
    gradeLevel: c.grade_level,
    interests: c.interests,
    displayName: c.display_name,
    username: c.username,
    wantsPathlab: c.wants_pathlab,
    pathlabPayReady: c.pathlab_pay_ready,
    wantsCommunity: c.wants_community,
    wantsTalent: c.wants_talent,
    hasHandsOnExperience: c.has_hands_on_experience,
  };
}

// ---------------------------------------------------------------------------
// Path axis — cluster the classifier's Thai interest labels into field groups
// ---------------------------------------------------------------------------

type PathClusterId =
  | "health"
  | "eng_tech"
  | "business"
  | "comms_arts"
  | "law"
  | "arch"
  | "tourism"
  | "psych";

interface PathCluster {
  id: PathClusterId;
  /** Display name used inside reply copy. */
  label: string;
  /** Interest labels (from lib/meta/classify.ts INTEREST_KEYWORDS). */
  interests: string[];
  /** One-line, path-specific advice. */
  tip: string;
}

const PATH_CLUSTERS: PathCluster[] = [
  {
    id: "health",
    label: "สายสุขภาพ",
    interests: [
      "แพทยศาสตร์",
      "ทันตแพทยศาสตร์",
      "เภสัชศาสตร์",
      "สัตวแพทยศาสตร์",
      "พยาบาลศาสตร์",
      "พาราเมดิก",
      "เทคนิคการแพทย์",
    ],
    tip: "สายสุขภาพคณะดูประสบการณ์จริงกับงานวิจัย/กิจกรรมอาสาเยอะมากครับ ลองทำโปรเจกต์ที่เกี่ยวกับสุขภาพชุมชนจะโดดเด่นสุด",
  },
  {
    id: "eng_tech",
    label: "สายวิศวะ/คอมฯ",
    interests: [
      "วิศวกรรมคอมพิวเตอร์",
      "วิศวกรรมไฟฟ้า",
      "วิศวกรรมศาสตร์",
      "วิทยาการคอมพิวเตอร์",
      "เทคโนโลยี",
    ],
    tip: "สายวิศวะ/คอมฯ ผลงานที่ลงมือทำจริง (โค้ด แอป หุ่นยนต์) สำคัญกว่าเกรดเสียอีกครับ เก็บทุกชิ้นลง GitHub/พอร์ตไว้เลย",
  },
  {
    id: "business",
    label: "สายบริหาร/เศรษฐฯ",
    interests: ["บริหารธุรกิจ", "เศรษฐศาสตร์"],
    tip: "สายบริหาร/เศรษฐฯ ชอบคนที่เคยลองขายของจริง ทำโปรเจกต์ธุรกิจเล็กๆ หรือแข่ง case จะมีเรื่องเล่าเต็มพอร์ตครับ",
  },
  {
    id: "comms_arts",
    label: "สายนิเทศ/ศิลป์ภาษา",
    interests: ["นิเทศศาสตร์", "อักษรศาสตร์", "มนุษยศาสตร์", "ครุศาสตร์"],
    tip: "สายนิเทศ/ศิลป์ภาษา พอร์ตงานเขียน คลิป หรือแคมเปญจริงคือตัวตัดสินครับ เริ่มเก็บผลงานตั้งแต่ตอนนี้",
  },
  {
    id: "law",
    label: "สายนิติฯ",
    interests: ["นิติศาสตร์"],
    tip: "สายนิติฯ งานวิจัย งานเขียนเชิงวิเคราะห์ หรือ debate/MUN จะช่วยให้พอร์ตแข็งแรงมากครับ",
  },
  {
    id: "arch",
    label: "สายสถาปัตย์",
    interests: ["สถาปัตยกรรมศาสตร์"],
    tip: "สายสถาปัตย์ พอร์ตงานออกแบบ/งานวาดคือหัวใจเลยครับ เก็บผลงานทุกชิ้นตั้งแต่ตอนนี้",
  },
  {
    id: "tourism",
    label: "สายท่องเที่ยว/โรงแรม",
    interests: ["การท่องเที่ยวและการโรงแรม"],
    tip: "สายท่องเที่ยว/โรงแรม ประสบการณ์บริการจริงกับโปรเจกต์ท่องเที่ยวชุมชนกำลังเป็นที่ต้องการครับ",
  },
  {
    id: "psych",
    label: "สายจิตวิทยา",
    interests: ["จิตวิทยา"],
    tip: "สายจิตวิทยา งานวิจัยเล็กๆ หรือกิจกรรมอาสาดูแลผู้อื่นจะทำให้พอร์ตแข็งแรงครับ",
  },
];

function findPathCluster(interests: string[]): PathCluster | null {
  for (const interest of interests) {
    const cluster = PATH_CLUSTERS.find((c) => c.interests.includes(interest));
    if (cluster) return cluster;
  }
  return null;
}

// ---------------------------------------------------------------------------
// Year axis — one urgency line per grade level
// ---------------------------------------------------------------------------

const YEAR_LINES: Record<string, string> = {
  "ม.3": "ช่วงนี้เวลาเหลือเยอะเลยครับ ลองทำโปรเจกต์ตั้งแต่ตอนนี้จะได้เปรียบมากตอนยื่น TCAS",
  "ม.4": "ช่วง ม.4 เป็นจังหวะที่ดีที่สุดในการเริ่มสะสมผลงานครับ ก่อนถึง TCAS จะได้มีเรื่องเล่าเต็มพอร์ต",
  "ม.5": "อีกปีเดียวก็ TCAS แล้ว ผลงานที่ทำตอนนี้คือของจริงที่ใส่พอร์ตได้ทันครับ",
  "ม.6": "TCAS ใกล้แล้ว เน้นผลงานที่เห็นผลเร็วและเล่าเรื่องได้ชัดเจนครับ",
  "ปี 1": "ช่วงปี 1 สะสมผลงานกับประสบการณ์จริงไว้ ตอนหาฝึกงานหรือหาทีมจะได้เปรียบมากครับ",
};

// ---------------------------------------------------------------------------
// Stage axis — the goal of the reply
// ---------------------------------------------------------------------------

const STAGE_OPENERS: Record<Exclude<DmLeadStage, "unknown">, string> = {
  exploring:
    "เห็นว่ากำลังสำรวจว่าตัวเองชอบอะไรอยู่เลย 🌱 ไม่ต้องรีบตัดสินใจครับ วิธีที่ดีที่สุดคือลองทำโปรเจกต์เล็กๆ ดูสักอัน",
  building:
    "เยี่ยมเลยครับที่ลงมือทำจริงแล้ว 👏 ผลงานที่มีอยู่เก็บให้เป็นระบบ แล้วต่อยอดให้มันเล่าเรื่องตัวเองได้",
  job_seeking:
    "เข้าใจเลยครับว่าตอนนี้อยากหาประสบการณ์/งานจริง 💼 พอร์ตที่เล่าเรื่องโปรเจกต์ได้ชัดๆ คือตัวเปิดทางที่แรงที่สุด",
};

const PRODUCT_LINKS = {
  pathlab: "PathLab (โปรแกรมลองทำโปรเจกต์จริงแบบสั้น) 👉 https://www.passionseed.org/pathlab",
  community: "Community ของพวกเรา มีเพื่อนร่วมทีมและพี่เมนเทอร์คอยช่วยครับ",
  talent: "Talent platform ของพวกเรา เอาพอร์ตไปต่อยอดหางาน/ฝึกงานได้เลยครับ",
} as const;

// ---------------------------------------------------------------------------
// Composition helpers
// ---------------------------------------------------------------------------

function greeting(ctx: QuickReplyContext): string {
  const name = ctx.displayName ?? ctx.username;
  return name ? `สวัสดีครับน้อง${name} 🙏` : "สวัสดีครับ 🙏";
}

function join(parts: (string | null | undefined)[]): string {
  return parts.filter((p) => p && p.trim().length > 0).join(" ");
}

function guideReply(ctx: QuickReplyContext): QuickReply | null {
  if (ctx.stage === "unknown") return null;
  const cluster = findPathCluster(ctx.interests);
  const yearLine = ctx.gradeLevel ? YEAR_LINES[ctx.gradeLevel] : undefined;
  const product =
    ctx.stage === "building"
      ? PRODUCT_LINKS.community
      : ctx.stage === "job_seeking"
        ? PRODUCT_LINKS.talent
        : PRODUCT_LINKS.pathlab;

  return {
    id: "guide",
    label: "แนะนำตามสาย + ช่วงชั้น",
    tone: "guide",
    body: join([
      greeting(ctx),
      STAGE_OPENERS[ctx.stage],
      cluster?.tip,
      yearLine,
      `ลองดู${product}`,
    ]),
  };
}

function qualifyReply(ctx: QuickReplyContext): QuickReply {
  let question: string;
  if (!ctx.gradeLevel) {
    question = "ตอนนี้อยู่ชั้นไหนแล้วครับ? จะได้แนะนำให้ตรงช่วงเลย 😊";
  } else if (ctx.interests.length === 0) {
    question = "ตอนนี้สนใจสายไหนอยู่ครับ? หรือยังไม่รู้ก็บอกได้เลย เดี๋ยวพี่ช่วยคิดด้วย";
  } else {
    question = "เป้าหมายตอนนี้คืออะไรครับ อยากเข้าคณะนี้ให้ได้ หาทีมทำโปรเจกต์ หรือหาประสบการณ์งาน?";
  }
  return {
    id: "qualify",
    label: "ถามข้อมูลเพิ่ม",
    tone: "qualify",
    body: join([greeting(ctx), "ยินดีช่วยครับ 🙌", question]),
  };
}

function ctaReplies(ctx: QuickReplyContext): QuickReply[] {
  const replies: QuickReply[] = [];

  if (ctx.pathlabPayReady) {
    replies.push({
      id: "cta-pay",
      label: "พร้อมสมัคร → ส่งรายละเอียด",
      tone: "cta",
      body: join([
        greeting(ctx),
        "ดีใจที่สนใจเลยครับ 🔥 เดี๋ยวพี่ส่งรายละเอียดการสมัครกับขั้นตอนทั้งหมดให้เลยนะครับ",
        "ระหว่างนี้ลองดูรายละเอียดเพิ่มได้ที่ https://www.passionseed.org/pathlab ครับ",
      ]),
    });
  }

  if (ctx.wantsPathlab) {
    replies.push({
      id: "cta-pathlab",
      label: "ส่งลิงก์ PathLab",
      tone: "cta",
      body: join([
        greeting(ctx),
        "ถ้าอยากลองลงมือทำจริง แนะนำเริ่มที่ PathLab เลยครับ เป็นโปรเจกต์สั้นๆ ที่ทำให้เห็นภาพว่าสายนี้ใช่ไหม",
        "👉 https://www.passionseed.org/pathlab",
        "ลองแล้วเป็นยังไงทักมาเล่าให้พี่ฟังหน่อยนะครับ",
      ]),
    });
  }

  if (ctx.wantsCommunity) {
    replies.push({
      id: "cta-community",
      label: "ชวนเข้า Community",
      tone: "cta",
      body: join([
        greeting(ctx),
        "ถ้าอยากมีเพื่อนร่วมทีมหรือพี่เมนเทอร์คอยช่วย ชวนเข้า Community ของพวกเราเลยครับ มีคนที่สนใจเหมือนกันเยอะมาก",
        "เดี๋ยวพี่ส่งลิงก์เชิญให้นะครับ 🙌",
      ]),
    });
  }

  if (ctx.wantsTalent) {
    replies.push({
      id: "cta-talent",
      label: "แนะนำ Talent platform",
      tone: "cta",
      body: join([
        greeting(ctx),
        "สำหรับการหางาน/ฝึกงาน พอร์ตที่เล่าเรื่องโปรเจกต์ได้ชัดคือสิ่งสำคัญที่สุดครับ",
        "ลองดู Talent platform ของพวกเราได้เลย เอาผลงานที่มีขึ้นไปโชว์ได้ทันทีครับ 💼",
      ]),
    });
  }

  return replies;
}

/**
 * Returns 2–4 quick-reply suggestions ordered by usefulness:
 * hot buying intent first, then the composed guide, then a qualifier.
 */
export function getQuickReplies(ctx: QuickReplyContext): QuickReply[] {
  const replies: QuickReply[] = [];

  const ctas = ctaReplies(ctx);
  // Pay-ready leads are hottest — surface that CTA first.
  const payReady = ctas.find((r) => r.id === "cta-pay");
  if (payReady) replies.push(payReady);

  const guide = guideReply(ctx);
  if (guide) replies.push(guide);

  for (const cta of ctas) {
    if (cta.id !== "cta-pay" && replies.length < 4) replies.push(cta);
  }

  if (replies.length < 4) replies.push(qualifyReply(ctx));

  return replies.slice(0, 4);
}

/**
 * Same chips as `getQuickReplies`, with each body rewritten for this lead.
 * Templates stay the fallback if Qwen is unreachable.
 */
export async function getPersonalizedQuickReplies(
  ctx: QuickReplyContext
): Promise<QuickReply[]> {
  const { personalizeMessage } = await import("@/lib/dm-leads/personalize");
  const replies = getQuickReplies(ctx);
  return Promise.all(
    replies.map(async (reply) => ({
      ...reply,
      body: await personalizeMessage({
        template: reply.body,
        lead: {
          displayName: ctx.displayName,
          username: ctx.username,
          gradeLevel: ctx.gradeLevel,
          interests: ctx.interests,
          stage: ctx.stage,
          wantsPathlab: ctx.wantsPathlab,
          pathlabPayReady: ctx.pathlabPayReady,
          wantsCommunity: ctx.wantsCommunity,
          wantsTalent: ctx.wantsTalent,
          hasHandsOnExperience: ctx.hasHandsOnExperience,
        },
        kind: "quick_reply",
      }),
    }))
  );
}
