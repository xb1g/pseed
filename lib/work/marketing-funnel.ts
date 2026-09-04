export type FunnelStage = "tofu" | "mofu" | "bofu";
export type ContentChannel = "instagram" | "facebook" | "both";
export type FunnelOffer = "techseed" | "shift" | "both";
import type { WorkItem } from "./work-items";

export type ContentStatus = "idea" | "draft" | "ready" | "published";

export interface FunnelStageDefinition {
  id: FunnelStage;
  label: string;
  shortLabel: string;
  share: number;
  question: string;
  job: string;
  action: string;
  metric: string;
}

export interface ContentIdea {
  id: string;
  stage: FunnelStage;
  title: string;
  hook: string;
  format: string;
  channel: ContentChannel;
  offer: FunnelOffer;
  cta: string;
  status: ContentStatus;
  owner: string;
  dueOn: string | null;
}

export const FUNNEL_STAGES: FunnelStageDefinition[] = [
  {
    id: "tofu",
    label: "Top of funnel",
    shortLabel: "TOFU",
    share: 55,
    question: "พอร์ตเราพอไหม และกำลังเสียเวลาอยู่หรือเปล่า?",
    job: "สร้างแรงสะดุดจากความจริงที่เด็กเจออยู่แล้ว",
    action: "Comment PORT",
    metric: "Non-follower reach",
  },
  {
    id: "mofu",
    label: "Middle of funnel",
    shortLabel: "MOFU",
    share: 30,
    question: "แล้วงานที่มีน้ำหนักจริง หน้าตาเป็นอย่างไร?",
    job: "ทำให้วิธีคิดและคุณภาพการดูแลของ PassionSeed มองเห็นได้",
    action: "Get checklist / submit work",
    metric: "Qualified conversations",
  },
  {
    id: "bofu",
    label: "Bottom of funnel",
    shortLabel: "BOFU",
    share: 15,
    question: "โปรแกรมไหนเหมาะกับเรา และจะอธิบายกับผู้ปกครองอย่างไร?",
    job: "ลดความเสี่ยงเรื่องผลลัพธ์ เวลา ราคา และความปลอดภัย",
    action: "Apply / send parent pack",
    metric: "Paid ÷ asked",
  },
];

export const CONTENT_IDEAS: ContentIdea[] = [
  {
    id: "10000000-0000-4000-8000-000000000001",
    stage: "tofu",
    title: "Portfolio Tier List: วิศวะ",
    hook: "โครงงานส่งครู เว็บ Clone และค่ายมีใบเซอร์ อะไรหนักกว่ากัน?",
    format: "Reel · 35 sec",
    channel: "instagram",
    offer: "both",
    cta: "Comment PORT",
    status: "ready",
    owner: "Content",
    dueOn: null,
  },
  {
    id: "10000000-0000-4000-8000-000000000002",
    stage: "tofu",
    title: "กรรมการถามต่อ",
    hook: "ถ้าบอกว่าทำแอป แต่ตอบ 3 คำถามนี้ไม่ได้ งานยังไม่ใช่ proof of work",
    format: "Reel · role play",
    channel: "instagram",
    offer: "shift",
    cta: "Save + share",
    status: "idea",
    owner: "Content",
    dueOn: null,
  },
  {
    id: "10000000-0000-4000-8000-000000000003",
    stage: "tofu",
    title: "ก่อนจ่ายค่าค่ายให้ลูก",
    hook: "ผู้ปกครองควรเช็ก 5 อย่าง ก่อนจ่ายค่าค่ายเพื่อใส่ Portfolio",
    format: "Long post",
    channel: "facebook",
    offer: "both",
    cta: "Save checklist",
    status: "draft",
    owner: "Content",
    dueOn: null,
  },
  {
    id: "10000000-0000-4000-8000-000000000004",
    stage: "tofu",
    title: "4 Project Red Flags",
    hook: "ทุกอย่างสำเร็จตั้งแต่ครั้งแรก อาจทำให้กรรมการเชื่อน้อยลง",
    format: "Carousel · 6 slides",
    channel: "both",
    offer: "shift",
    cta: "Comment PORT",
    status: "idea",
    owner: "Content",
    dueOn: null,
  },
  {
    id: "10000000-0000-4000-8000-000000000005",
    stage: "mofu",
    title: "หนึ่งไอเดีย สามระดับ",
    hook: "เปลี่ยนงานส่งครู ให้กลายเป็น prototype ที่มี user data ได้อย่างไร",
    format: "Carousel · teardown",
    channel: "both",
    offer: "shift",
    cta: "Get rubric",
    status: "ready",
    owner: "Content",
    dueOn: null,
  },
  {
    id: "10000000-0000-4000-8000-000000000006",
    stage: "mofu",
    title: "SHIFT build diary",
    hook: "Day 3 ไม่มีใครใช้ของที่เราสร้าง แล้วทีมทำอะไรต่อ?",
    format: "Reel series · 4 parts",
    channel: "instagram",
    offer: "shift",
    cta: "Follow the build",
    status: "draft",
    owner: "Content",
    dueOn: null,
  },
  {
    id: "10000000-0000-4000-8000-000000000007",
    stage: "mofu",
    title: "TechSeed alumni trail",
    hook: "ก่อนเข้า สิ่งที่ลอง สิ่งที่สร้าง และสิ่งที่น้องกลับไปทำต่อเอง",
    format: "Case study",
    channel: "both",
    offer: "techseed",
    cta: "See student work",
    status: "idea",
    owner: "Content",
    dueOn: null,
  },
  {
    id: "10000000-0000-4000-8000-000000000008",
    stage: "mofu",
    title: "Mentor ไม่ได้ทำแทน",
    hook: "หนึ่งคำถามจาก Mentor ที่ทำให้น้องตัดฟีเจอร์ออก 80%",
    format: "Screen + voiceover",
    channel: "instagram",
    offer: "both",
    cta: "Submit an idea",
    status: "idea",
    owner: "Content",
    dueOn: null,
  },
  {
    id: "10000000-0000-4000-8000-000000000009",
    stage: "bofu",
    title: "TechSeed หรือ SHIFT",
    hook: "เลือกจากจุดที่น้องอยู่ตอนนี้ ไม่ใช่จากโปรแกรมที่แพงกว่า",
    format: "Carousel · chooser",
    channel: "both",
    offer: "both",
    cta: "Take the 30-sec fit check",
    status: "ready",
    owner: "Growth",
    dueOn: null,
  },
  {
    id: "10000000-0000-4000-8000-000000000010",
    stage: "bofu",
    title: "เริ่ม Tech จากศูนย์ได้ไหม",
    hook: "ถ้ายังเลือก AI, Cybersecurity หรือ Software ไม่ได้ TechSeed เริ่มตรงนี้",
    format: "FAQ Reel",
    channel: "instagram",
    offer: "techseed",
    cta: "Apply TechSeed",
    status: "draft",
    owner: "Growth",
    dueOn: null,
  },
  {
    id: "10000000-0000-4000-8000-000000000011",
    stage: "bofu",
    title: "ถ้าโปรเจกต์พังล่ะ?",
    hook: "SHIFT ไม่รับประกันว่าไอเดียจะเวิร์ก แต่รับประกันว่าจะมีหลักฐานให้ตัดสินใจต่อ",
    format: "Founder video",
    channel: "both",
    offer: "shift",
    cta: "Apply SHIFT",
    status: "idea",
    owner: "Founder",
    dueOn: null,
  },
  {
    id: "10000000-0000-4000-8000-000000000012",
    stage: "bofu",
    title: "Forward to parent",
    hook: "หนึ่งหน้าที่บอกผู้ปกครองว่าได้อะไร ใช้เวลาเท่าไร และดูแลกันอย่างไร",
    format: "Shareable one-pager",
    channel: "facebook",
    offer: "both",
    cta: "Send parent pack",
    status: "draft",
    owner: "Growth",
    dueOn: null,
  },
];

const FALLBACK_TIMESTAMP = "2026-09-04T00:00:00.000Z";

export const CONTENT_WORK_ITEMS: WorkItem[] = CONTENT_IDEAS.map((idea, index) => ({
  id: idea.id,
  area: "marketing",
  kind: "content",
  title: idea.title,
  description: idea.hook,
  status: idea.status,
  funnelStage: idea.stage,
  channel: idea.channel,
  offer: idea.offer,
  ownerName: idea.owner,
  dueOn: idea.dueOn,
  position: (index + 1) * 10,
  details: { format: idea.format, cta: idea.cta },
  createdBy: null,
  createdAt: FALLBACK_TIMESTAMP,
  updatedAt: FALLBACK_TIMESTAMP,
}));

export function workItemToContentIdea(item: WorkItem): ContentIdea {
  return {
    id: item.id,
    stage: item.funnelStage ?? "tofu",
    title: item.title,
    hook: item.description,
    format: item.details.format ?? "Unassigned format",
    channel: item.channel ?? "both",
    offer: item.offer ?? "both",
    cta: item.details.cta ?? "Choose CTA",
    status: item.status === "published" ? "published" : item.status as ContentStatus,
    owner: item.ownerName,
    dueOn: item.dueOn ?? null,
  };
}

export function filterContentIdeas(
  ideas: ContentIdea[],
  stage: FunnelStage | "all",
  channel: ContentChannel | "all",
  offer: FunnelOffer | "all"
) {
  return ideas.filter((idea) => {
    const stageMatches = stage === "all" || idea.stage === stage;
    const channelMatches =
      channel === "all" || idea.channel === channel || idea.channel === "both";
    const offerMatches =
      offer === "all" || idea.offer === offer || idea.offer === "both";

    return stageMatches && channelMatches && offerMatches;
  });
}

export function getStageMix(ideas: ContentIdea[]) {
  return FUNNEL_STAGES.map((stage) => ({
    stage: stage.id,
    count: ideas.filter((idea) => idea.stage === stage.id).length,
  }));
}
