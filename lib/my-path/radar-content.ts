import { getRegistryItem } from "./registry";

export interface RadarPreviewField {
  slug: string | null;
  name_th: string | null;
  name_en: string | null;
  tagline_th: string | null;
  emoji: string | null;
  color: string | null;
  squad_url: string | null;
  research: unknown;
}

export interface RadarPreviewCard {
  kind: string;
  content_th: unknown;
}

export interface CareerPreview {
  slug: string;
  titleTh: string;
  titleEn: string;
  tagline: string;
  emoji: string;
  color: string;
  dailyWork: string;
  enjoySignal: string;
  tradeoff: string;
  aiSignal: string;
  entryRoute: string;
  marketSignal: string;
  radarHref: string;
  pathLabHref?: string;
}

function object(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function shorten(value: string, maximum = 220): string {
  if (value.length <= maximum) return value;
  return `${value.slice(0, maximum - 1).trimEnd()}…`;
}

function findCard(
  cards: RadarPreviewCard[],
  ...kinds: string[]
): Record<string, unknown> {
  const card = cards.find((candidate) => kinds.includes(candidate.kind));
  return object(card?.content_th);
}

function dailyWorkFrom(content: Record<string, unknown>): string {
  if (!Array.isArray(content.steps)) return "ดูงานจริงรายวันใน Radar เพื่อสังเกตว่าคุณอยากทำส่วนไหน";
  const steps = content.steps
    .slice(0, 2)
    .map((step) => {
      const value = object(step);
      return [text(value.label), text(value.detail)].filter(Boolean).join(": ");
    })
    .filter(Boolean);
  return shorten(steps.join(" • ")) || "ดูงานจริงรายวันใน Radar เพื่อสังเกตว่าคุณอยากทำส่วนไหน";
}

function aiSignalFrom(content: Record<string, unknown>): string {
  const verdict = text(content.verdict);
  if (verdict) return shorten(verdict);
  const augmented = Array.isArray(content.augmented)
    ? content.augmented.map(text).filter(Boolean).slice(0, 2)
    : [];
  const automated = Array.isArray(content.automated)
    ? content.automated.map(text).filter(Boolean).slice(0, 1)
    : [];
  if (augmented.length || automated.length) {
    return shorten(
      [
        augmented.length ? `AI ช่วย: ${augmented.join(", ")}` : "",
        automated.length ? `ส่วนที่เปลี่ยนเร็ว: ${automated.join(", ")}` : "",
      ]
        .filter(Boolean)
        .join(" • ")
    );
  }
  return "เปิดโปรไฟล์ Radar เพื่อดูว่างานส่วนไหนใช้ AI ช่วย และส่วนไหนยังต้องอาศัยมนุษย์";
}

function entryRouteFrom(content: Record<string, unknown>): string {
  const description = text(content.description);
  if (description) return shorten(description);
  if (Array.isArray(content.faculties)) {
    const names = content.faculties
      .slice(0, 2)
      .map((faculty) => text(object(faculty).name))
      .filter(Boolean);
    if (names.length) return `จุดเริ่มที่พบบ่อย: ${names.join(" หรือ ")}`;
  }
  return "เริ่มจากการอ่านเส้นทางเข้าอาชีพและลองโปรเจกต์เล็กที่ตรวจสอบได้";
}

function marketSignalFrom(research: unknown): string {
  const record = object(research);
  return shorten(
    text(record.reasoning) ||
      text(object(record.thailand_context).local_opportunity) ||
      "ดูหลักฐานตลาดและบริบทประเทศไทยฉบับเต็มใน Radar"
  );
}

export function buildCareerPreview(
  field: RadarPreviewField,
  cards: RadarPreviewCard[]
): CareerPreview {
  const slug = field.slug ?? "";
  const registryItem = getRegistryItem(slug);
  const reality = findCard(cards, "fantasyReality", "risks");
  const risks = Array.isArray(reality.risks)
    ? reality.risks.map(text).filter(Boolean)[0]
    : "";
  const tradeoff = text(reality.reality) || risks;
  const tagline = field.tagline_th || "เปิดดูความจริงของงานก่อนตัดสินใจ";
  return {
    slug,
    titleTh: field.name_th || registryItem?.titleTh || slug,
    titleEn: field.name_en || registryItem?.titleEn || slug,
    tagline,
    emoji: field.emoji || "✦",
    color: /^#[0-9a-f]{6}$/i.test(field.color ?? "") ? field.color! : "#6366f1",
    dailyWork: dailyWorkFrom(findCard(cards, "dayInLife")),
    enjoySignal: shorten(tagline),
    tradeoff: shorten(
      tradeoff || "ทุกเส้นทางมีทั้งส่วนที่น่าสนใจและส่วนที่ต้องยอมรับ ลองดูรายละเอียดก่อนบันทึก"
    ),
    aiSignal: aiSignalFrom(findCard(cards, "aiImpact")),
    entryRoute: entryRouteFrom(findCard(cards, "entryRoutes")),
    marketSignal: marketSignalFrom(field.research),
    radarHref: `/radar/${slug}`,
    pathLabHref: registryItem?.pathLabHref,
  };
}
