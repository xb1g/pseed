import type { PseedHubState, PseedStep } from "@/types/projectseed";

/**
 * The four things a participant has to do before the room works for them.
 *
 * Order matters and is deliberate: Discord first, because the community is the
 * product and everything downstream (voice sessions, the phase-2 bot) keys off
 * the linked account. The brief comes after the pick because you cannot explain
 * a project you have not chosen.
 */
export function buildSteps(hub: PseedHubState): PseedStep[] {
  const { participant, pick } = hub;

  const hasProject = Boolean(pick?.project_option_id || pick?.custom_title);
  const briefDone = Boolean(
    pick &&
      pick.status === "submitted" &&
      pick.what_build?.trim() &&
      pick.why_this?.trim() &&
      pick.who_for?.trim()
  );

  return [
    {
      id: "discord",
      label: "เชื่อม Discord",
      hint: "ห้องอยู่บน Discord — ต่อบัญชีก่อน แล้วที่เหลือจะตามมา",
      href: "/projectseed/hub",
      done: Boolean(participant.discord_user_id),
    },
    {
      id: "project",
      label: "เลือกโปรเจกต์",
      hint: "เลือกจากรายการ หรือเสนอของตัวเอง",
      href: "/projectseed/hub/project",
      done: hasProject,
    },
    {
      id: "brief",
      label: "อธิบายโปรเจกต์",
      hint: "ทำอะไร ทำไม เพื่อใคร — สามคำถาม",
      href: "/projectseed/hub/project#brief",
      done: briefDone,
    },
    {
      id: "schedule",
      label: "เลือกเวลา",
      hint: "ชั่วโมงที่คุณเข้าห้องเสียงได้ในหนึ่งสัปดาห์",
      href: "/projectseed/hub/schedule",
      done: hub.mySlots.length > 0,
    },
  ];
}

export function nextStep(steps: PseedStep[]): PseedStep | null {
  return steps.find((step) => !step.done) ?? null;
}
