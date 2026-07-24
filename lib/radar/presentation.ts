const ENTRY_ROUTE_LABELS: Record<string, string> = {
  direct: "หลักสูตรตรงสาย",
  related: "หลักสูตรต่อยอดได้",
  alternative: "สร้างทักษะเอง",
};

const OUTLOOK_LABELS: Record<string, string> = {
  growing: "ตลาดกำลังรับเพิ่ม",
  shifting: "งานยังมี แต่เนื้องานกำลังเปลี่ยน",
  exposed: "ตำแหน่งเริ่มต้นได้รับผลกระทบสูง",
};

export function getEntryRouteLabel(tier: string): string {
  return ENTRY_ROUTE_LABELS[tier] ?? ENTRY_ROUTE_LABELS.related;
}

export function getAiImpactLabel(score: number): string {
  if (score <= 3) return "ได้รับผลกระทบน้อย";
  if (score <= 6) return "งานบางส่วนกำลังเปลี่ยน";
  return "ได้รับผลกระทบสูง";
}

/**
 * Verdict for the 0–100 job-access score on the Competition card. Rendered to
 * students, so it stays in Thai like every other label in this module.
 */
export function getJobAccessLabel(score: number): string {
  if (score >= 75) return "หางานง่าย";
  if (score >= 60) return "หางานค่อนข้างง่าย";
  if (score >= 45) return "หางานปานกลาง";
  return "หางานยาก";
}

export function getOutlookLabel(tier?: string | null): string {
  if (!tier) return "ข้อมูลยังไม่พอสรุป";
  return OUTLOOK_LABELS[tier] ?? "ข้อมูลยังไม่พอสรุป";
}

export function interpretRadarMetric(
  key: string,
  value: number,
  max: number
): string {
  if (key.startsWith("salary_")) {
    return "เปรียบเทียบกับค่ากลางและประสบการณ์ที่ระบุ";
  }

  const ratio = max > 0 ? value / max : 0;
  if (key === "saturation_level") {
    if (ratio >= 0.7) return "การแข่งขันค่อนข้างสูง";
    if (ratio >= 0.4) return "การแข่งขันปานกลาง";
    return "การแข่งขันค่อนข้างต่ำ";
  }
  if (key === "progression_difficulty") {
    if (ratio >= 0.7) return "การเติบโตค่อนข้างยาก";
    if (ratio >= 0.4) return "การเติบโตมีเงื่อนไข";
    return "เส้นทางเติบโตค่อนข้างชัด";
  }
  if (ratio >= 0.7) return "โอกาสค่อนข้างดี";
  if (ratio >= 0.4) return "ใกล้ค่ากลาง";
  return "ต่ำกว่าค่ากลาง";
}

export type RadarListItem = { title: string; description: string };

export function parseRadarListItems(body?: string | string[]): RadarListItem[] {
  const lines = Array.isArray(body) ? body : body?.split("\n") ?? [];

  return lines
    .map((line) => line.trim().replace(/^[•\-–—\d.)\s]+/, "").trim())
    .filter(Boolean)
    .map((line) => {
      const separator = line.match(/\s*(?::|—|–)\s*/);
      if (!separator?.index) return { title: line, description: "" };
      return {
        title: line.slice(0, separator.index).trim(),
        description: line.slice(separator.index + separator[0].length).trim(),
      };
    });
}
