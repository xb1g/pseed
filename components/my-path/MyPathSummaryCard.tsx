import Link from "next/link";
import {
  ArrowRight,
  CalendarCheck,
  Compass,
  FolderKanban,
  HandHeart,
  MessagesSquare,
  Trophy,
  Users,
} from "lucide-react";

import { CONSULT_PRICE_THB, CONSULT_URL } from "@/lib/my-path/consult";
import type { MissionOutcomeId, MissionPlan } from "@/lib/my-path/mission-plan";

const OUTCOME_ICONS: Record<MissionOutcomeId, typeof FolderKanban> = {
  portfolio: FolderKanban,
  competition: Trophy,
  volunteering: HandHeart,
  interview: MessagesSquare,
  community: Users,
};

export interface MyPathSummary {
  plan: MissionPlan;
  careerTitles: string[];
  goalLabel: string | null;
  updatedAt: string;
}

/**
 * แผนที่บันทึกไว้จาก /plan — ที่เดียวที่นักเรียนกลับมาดูได้หลังปิดหน้าไป
 * ไม่มีแผนก็ยังต้องมีทางเข้า ไม่ใช่ปล่อยว่าง
 */
export function MyPathSummaryCard({ summary }: { summary: MyPathSummary | null }) {
  if (!summary) return <EmptyMyPathCard />;

  const { plan, careerTitles, goalLabel, updatedAt } = summary;

  return (
    <section
      aria-labelledby="my-path-summary-heading"
      className="mb-6 rounded-2xl border border-white/10 bg-white/[0.03] p-4 backdrop-blur-sm sm:p-5"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-blue-200/70">
          My Path · แผนของคุณ
        </p>
        <p className="text-[11px] text-white/40">
          อัปเดตล่าสุด {formatThaiDate(updatedAt)}
        </p>
      </div>

      <h2
        id="my-path-summary-heading"
        className="mt-1.5 font-kodchasan text-lg font-semibold leading-snug text-white sm:text-xl"
      >
        {plan.headline}
      </h2>

      <div className="mt-2 flex flex-wrap gap-1.5">
        {[
          goalLabel,
          `${plan.timelineMonths} เดือน`,
          ...careerTitles,
        ]
          .filter((chip): chip is string => Boolean(chip))
          .map((chip) => (
            <span
              key={chip}
              className="rounded-full border border-white/10 bg-white/[0.05] px-2 py-0.5 text-[10px] font-medium text-white/70"
            >
              {chip}
            </span>
          ))}
      </div>

      <p className="mt-4 text-xs font-semibold text-white/70">
        สิ่งที่คุณจะมีในมือเมื่อครบ {plan.timelineMonths} เดือน
      </p>
      <ul className="mt-2 grid gap-1.5 sm:grid-cols-2">
        {plan.outcomes.map((outcome) => {
          const Icon = OUTCOME_ICONS[outcome.id];
          return (
            <li
              key={outcome.id}
              className="flex items-start gap-2.5 rounded-lg border border-white/[0.08] bg-white/[0.02] px-3 py-2"
            >
              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-blue-400/10 text-blue-200">
                <Icon className="h-3 w-3" aria-hidden="true" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[13px] leading-5 text-white/85">
                  {outcome.title}
                </span>
                <span className="block text-[10px] leading-4 text-blue-200/60">
                  {outcome.landsIn}
                </span>
              </span>
            </li>
          );
        })}
      </ul>

      <div className="mt-4 flex gap-2">
        <a
          href={CONSULT_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-b from-blue-700 via-blue-600 to-blue-500 px-3 text-[13px] font-semibold text-white transition-colors hover:from-blue-600 hover:via-blue-500 hover:to-blue-400"
        >
          <CalendarCheck className="h-4 w-4" aria-hidden="true" />
          นัดคุยกับเรา · {CONSULT_PRICE_THB} บาท
        </a>
        <Link
          href="/plan?resume=1"
          className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-white/15 px-3 text-[13px] font-semibold text-white/80 transition-colors hover:bg-white/[0.06] hover:text-white"
        >
          แก้แผนของฉัน
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>
    </section>
  );
}

function EmptyMyPathCard() {
  return (
    <section className="mb-6 flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4 backdrop-blur-sm sm:flex-row sm:items-center sm:p-5">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-500/15 text-indigo-200">
        <Compass className="h-5 w-5" aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-kodchasan text-base font-semibold text-white">
          ยังไม่มีแผนใน My Path
        </p>
        <p className="mt-0.5 text-[13px] leading-6 text-white/60">
          ใช้เวลา 3 นาที เลือกสิ่งที่จุดไฟและล็อกเป้า แล้วแผนจะมารออยู่ตรงนี้
        </p>
      </div>
      <Link
        href="/plan"
        className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-gradient-to-b from-blue-700 via-blue-600 to-blue-500 px-4 text-[13px] font-semibold text-white transition-colors hover:from-blue-600 hover:via-blue-500 hover:to-blue-400"
      >
        เริ่มออกแบบแผน
        <ArrowRight className="h-4 w-4" aria-hidden="true" />
      </Link>
    </section>
  );
}

function formatThaiDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("th-TH", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
