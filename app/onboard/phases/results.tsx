"use client";

import { PhaseShell } from "../components/phase-shell";
import type { CollectedData, OnboardingStep } from "@/types/onboarding";

interface Props {
  data: CollectedData;
  advance: (step: OnboardingStep, updates: Partial<CollectedData>) => void;
  goBack: () => void | Promise<void>;
}

function getDirectionCopy(data: CollectedData, isEn: boolean): string {
  if (data.career_direction === "clear_goal") {
    return isEn
      ? "You already have a fairly clear picture of where you want to go."
      : "คุณมีภาพอนาคตที่ค่อนข้างชัดแล้ว";
  }
  if (data.career_direction === "some_ideas") {
    return isEn
      ? "You have some ideas forming — not locked, but not blank either."
      : "คุณมีแนวทางพอสมควร ยังไม่ล็อก แต่ก็ไม่เริ่มจากศูนย์";
  }
  return isEn
    ? "You're still discovering what future feels right."
    : "คุณยังอยู่ในช่วงค้นหาว่าอนาคตแบบไหนที่รู้สึกใช่";
}

function getSituationCopy(data: CollectedData, isEn: boolean): string {
  if (data.stage === "urgent") {
    return isEn
      ? "Time is tight — decisions are coming soon."
      : "เวลากระชั้น คุณใกล้ต้องตัดสินใจแล้ว";
  }
  if (data.stage === "applying_soon") {
    return isEn
      ? "You're getting ready to apply."
      : "คุณกำลังเตรียมตัวสำหรับการสมัคร";
  }
  if (data.stage === "choosing") {
    return isEn
      ? "You're comparing options and narrowing the field."
      : "คุณกำลังเทียบตัวเลือกและค่อย ๆ บีบวงลง";
  }
  return isEn
    ? "You're exploring — gathering signal before committing."
    : "คุณยังอยู่ในโหมดสำรวจ เก็บสัญญาณก่อนล็อกทาง";
}

function getTargetCopy(data: CollectedData, isEn: boolean): string | null {
  if (!data.target_university_name) return null;
  return isEn
    ? `You're leaning toward ${data.target_university_name}`
    : `ตอนนี้คุณกำลังเอนเอียงไปทาง ${data.target_university_name}`;
}

export function ResultsPhase({ data, advance, goBack }: Props) {
  const isEn = (data.language || "th") === "en";
  const targetCopy = getTargetCopy(data, isEn);

  return (
    <PhaseShell
      eyebrow={isEn ? "Your Snapshot" : "ภาพรวมของคุณ"}
      title={
        isEn
          ? "Here's what we know about you"
          : "นี่คือสิ่งที่เรารู้เกี่ยวกับคุณ"
      }
      backLabel={isEn ? "Back" : "ย้อนกลับ"}
      onBack={() => {
        void goBack();
      }}
      footer={
        <button
          type="button"
          onClick={() => advance("account", {})}
          className="ei-button-dawn min-h-12 w-full justify-center py-3.5 text-base font-semibold sm:min-h-0 sm:py-3 sm:text-sm"
        >
          {isEn ? "Continue →" : "ไปต่อ →"}
        </button>
      }
    >
      <div className="flex flex-col gap-2.5">
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-blue-200/90">
            {isEn ? "Your Direction" : "ทิศทางของคุณ"}
          </p>
          <p className="text-sm leading-6 text-white/90">
            {getDirectionCopy(data, isEn)}
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/40">
            {isEn ? "Your Situation" : "สถานการณ์ของคุณ"}
          </p>
          <p className="text-sm leading-6 text-white/90">
            {getSituationCopy(data, isEn)}
          </p>
        </div>

        {targetCopy ? (
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/40">
              {isEn ? "Your Target" : "เป้าหมายที่เล็งไว้"}
            </p>
            <p className="text-sm leading-6 text-white/90">{targetCopy}</p>
          </div>
        ) : null}
      </div>
    </PhaseShell>
  );
}
