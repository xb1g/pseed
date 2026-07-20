"use client";

import { Briefcase, Check, Compass, GraduationCap, Trophy } from "lucide-react";

import { MISSION_GOAL_OPTIONS, type MissionGoal } from "@/lib/my-path/mission-plan";

const GOAL_ICONS: Record<MissionGoal, typeof GraduationCap> = {
  university: GraduationCap,
  job: Briefcase,
  scholarship: Trophy,
  exploring: Compass,
};

const TIMELINE_OPTIONS = [2, 3, 4];

interface StepGoalProps {
  goal: MissionGoal | null;
  timelineMonths: number;
  onSelectGoal: (goal: MissionGoal) => void;
  onSelectTimeline: (months: number) => void;
}

export function StepGoal({
  goal,
  timelineMonths,
  onSelectGoal,
  onSelectTimeline,
}: StepGoalProps) {
  return (
    <section aria-labelledby="goal-heading">
      <p className="text-xs font-semibold uppercase tracking-[0.15em] text-indigo-200/70">
        ขั้นที่ 3 · ล็อกเป้า
      </p>
      <h2
        id="goal-heading"
        className="mt-2 font-kodchasan text-2xl font-semibold text-slate-50 sm:text-3xl"
      >
        ล็อกเป้าหมายของคุณ
      </h2>
      <p className="mt-3 max-w-xl text-sm leading-6 text-slate-400">
        เป้าที่ชัดทำให้ทุกเดือนมีพลัง — เหมือน startup ที่รู้ว่าต้องชนะอะไร
        เปลี่ยนใจภายหลังได้เสมอ แต่ตอนนี้เลือกอันเดียวให้คม
      </p>

      <div className="mt-6 grid gap-3" role="radiogroup" aria-label="เป้าหมาย">
        {MISSION_GOAL_OPTIONS.map((option) => {
          const Icon = GOAL_ICONS[option.id];
          const selected = goal === option.id;
          return (
            <button
              key={option.id}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onSelectGoal(option.id)}
              className={`flex items-start gap-3 rounded-2xl border p-4 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200 ${
                selected
                  ? "border-amber-200/60 bg-amber-200/[0.08]"
                  : "border-white/10 bg-white/[0.03] hover:bg-white/[0.05]"
              }`}
            >
              <span
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                  selected ? "bg-amber-200/15 text-amber-100" : "bg-white/[0.06] text-slate-300"
                }`}
              >
                <Icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <span className="flex-1">
                <span className="block font-kodchasan text-base font-semibold text-slate-50">
                  {option.title}
                </span>
                <span className="mt-0.5 block text-sm leading-6 text-slate-400">
                  {option.detail}
                </span>
              </span>
              <span
                className={`mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                  selected ? "border-amber-200/70 bg-amber-200/20 text-amber-100" : "border-white/15 text-transparent"
                }`}
                aria-hidden="true"
              >
                <Check className="h-3 w-3" />
              </span>
            </button>
          );
        })}
      </div>

      <div className="mt-8">
        <p className="text-sm font-semibold text-slate-200">อยากเห็นผลในกี่เดือน?</p>
        <div className="mt-3 flex gap-2.5" role="radiogroup" aria-label="ไทม์ไลน์">
          {TIMELINE_OPTIONS.map((months) => {
            const selected = timelineMonths === months;
            return (
              <button
                key={months}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => onSelectTimeline(months)}
                className={`min-h-12 flex-1 rounded-xl border text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200 ${
                  selected
                    ? "border-amber-200/60 bg-amber-200/15 text-amber-100"
                    : "border-white/10 bg-white/[0.04] text-slate-300 hover:bg-white/[0.07]"
                }`}
              >
                {months} เดือน
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
