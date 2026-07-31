import type { HubLoad } from "@/lib/projectseed/hub";
import { buildSteps, nextStep } from "@/lib/projectseed/steps";

/**
 * Compact ProjectSeed status for My Path (`/me`).
 *
 * The hub already owns the full flow; this shape is only enough to decide the
 * card copy and the one link that should leave My Path for `/projectseed/*`.
 */
export type ProjectSeedMeSummary =
  | {
      kind: "closed";
      title: string;
      detail: string;
      href: string;
      cta: string;
    }
  | {
      kind: "join";
      cohortName: string;
      title: string;
      detail: string;
      href: string;
      cta: string;
    }
  | {
      kind: "active";
      cohortName: string;
      title: string;
      detail: string;
      href: string;
      cta: string;
      doneCount: number;
      totalCount: number;
      complete: boolean;
    };

export function buildProjectSeedMeSummary(
  load: HubLoad
): ProjectSeedMeSummary {
  if (load.state === "anonymous" || load.state === "no-cohort") {
    return {
      kind: "closed",
      title: "ทำโปรเจกต์จริงก่อนยื่นพอร์ต",
      detail:
        "ProjectSeed — โปรเจกต์ของตัวเอง มีผู้ใช้จริง มีพี่เลี้ยงศิษย์เก่า",
      href: "/projectseed",
      cta: "ดู ProjectSeed",
    };
  }

  if (load.state === "not-joined") {
    return {
      kind: "join",
      cohortName: load.cohort.name,
      title: load.cohort.name,
      detail: "เลือกโปรเจกต์ อธิบายมัน แล้วบอกเวลาที่เข้าห้องเสียงได้",
      href: "/projectseed/hub",
      cta: "เข้าห้อง",
    };
  }

  const steps = buildSteps(load.hub);
  const next = nextStep(steps);
  const doneCount = steps.filter((step) => step.done).length;

  return {
    kind: "active",
    cohortName: load.hub.cohort.name,
    title: load.hub.cohort.name,
    detail: next
      ? `ก้าวถัดไป: ${next.label} — ${next.hint}`
      : "ครบแล้วทุกข้อ เหลืออย่างเดียวคือลงมือทำ",
    href: next?.href ?? "/projectseed/hub",
    cta: next ? next.label : "เปิดห้อง",
    doneCount,
    totalCount: steps.length,
    complete: !next,
  };
}
