import type { PlanEntry } from "./types";

const GENERIC_ENTRY: PlanEntry = {
  key: "generic",
  title: "What kind of future are you trying to build?",
  subtitle:
    "คุณไม่จำเป็นต้องรู้คำตอบทั้งหมดวันนี้ เริ่มจากสิ่งที่อยากสำรวจก่อนได้",
  reassurance: "ทุกเส้นทางที่เปิดดูคือข้อมูล ไม่ใช่คำตอบถาวร",
  initialSlugs: [
    "fashion-designer",
    "marketing-strategist",
    "data-scientist",
    "medical-technologist",
    "mechanical-engineer",
    "accountant",
  ],
  comparison: null,
};

const PLAN_ENTRIES: Record<string, PlanEntry> = {
  "tech-beyond-software": {
    key: "tech-beyond-software",
    title: "ชอบเทคโนโลยี ไม่ได้แปลว่าต้องเป็น Software Engineer",
    subtitle: "ลองดูว่าสาย Tech แบบไหนเหมาะกับวิธีคิดและชีวิตที่คุณอยากได้",
    reassurance: "ยังไม่ต้องเลือกให้ถูก แค่สังเกตว่าอะไรทำให้คุณอยากรู้ต่อ",
    initialSlugs: [
      "ai-engineer",
      "data-scientist",
      "software-engineer",
      "cybersecurity",
      "devops-sre",
      "qa-engineer",
    ],
    comparison: ["ai-engineer", "cybersecurity"],
  },
};

export function resolvePlanEntry(entry?: string | null): PlanEntry {
  if (!entry) return GENERIC_ENTRY;
  return PLAN_ENTRIES[entry] ?? GENERIC_ENTRY;
}

export function isKnownPlanEntry(entry?: string | null): boolean {
  return Boolean(entry && PLAN_ENTRIES[entry]);
}
