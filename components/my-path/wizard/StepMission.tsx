"use client";

import { useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  CalendarCheck,
  Check,
  CheckCircle2,
  ChevronDown,
  CircleAlert,
  ExternalLink,
  FolderKanban,
  HandHeart,
  Linkedin,
  LogIn,
  MessagesSquare,
  Play,
  Trophy,
  UserRound,
  Users,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { CONSULT_PRICE_THB, CONSULT_URL } from "@/lib/my-path/consult";
import type { MissionOutcomeId, MissionPlan } from "@/lib/my-path/mission-plan";

const OUTCOME_ICONS: Record<MissionOutcomeId, typeof FolderKanban> = {
  portfolio: FolderKanban,
  competition: Trophy,
  volunteering: HandHeart,
  interview: MessagesSquare,
  community: Users,
};

const CONSULT_DELIVERABLES = [
  "แผนรายเดือนที่เขียนจากเวลาจริงและเป้าของคุณ",
  "โปรเจคชูโรงที่เลือกมาให้ตรงกับสายที่คุณสนใจ",
  "คนที่ตอบได้ว่าอะไรควรทำ และอะไรเสียเวลาเปล่า",
];

const FOUNDER = {
  name: "บุณยสิทธิ์ ฟาง (Bunyasit Fang)",
  role: "Founder, PassionSeed",
  photo: "/images/founder-bunyasit.jpg",
  linkedIn: "https://www.linkedin.com/in/bigfang/",
  credentials: ["จุฬาลงกรณ์มหาวิทยาลัย", "ทำงานสาย tech ที่ San Francisco"],
  note: "คนที่นั่งคุยกับคุณคือผมเอง ไม่ใช่ทีมเซลส์",
};

export interface MissionFirstAction {
  href: string;
  title: string;
  seedId: string;
}

interface StepMissionProps {
  plan: MissionPlan;
  firstAction: MissionFirstAction | null;
  isSignedIn: boolean;
  loginHref: string;
  importStatus: "idle" | "saving" | "saved" | "error";
  /** Narrower reason when importStatus is "error" — drives the alert copy. */
  saveError?: "auth" | "unavailable" | "generic" | null;
  persisted: boolean;
  onSave: () => void;
  onLaunch: () => void;
  /** มีเฉพาะตอน sign in แล้ว — เปิด flow "ทำก่อน จ่ายทีหลัง" แทนการ navigate */
  onLaunchStart?: () => void;
  /** ยิง analytics ตอนกดนัดคุย */
  onBook: () => void;
}

function saveErrorMessage(
  saveError: StepMissionProps["saveError"]
): string {
  if (saveError === "auth") {
    return "เซสชันหมดอายุ — เข้าสู่ระบบอีกครั้งแล้วกดบันทึก";
  }
  if (saveError === "unavailable") {
    return "ระบบบันทึกยังไม่พร้อมในสภาพแวดล้อมนี้ — ใช้ production database";
  }
  return "ยังบันทึกไม่ได้ ลองอีกครั้ง — ข้อมูลในเครื่องนี้ยังอยู่ครบ";
}

export function StepMission({
  plan,
  firstAction,
  isSignedIn,
  loginHref,
  importStatus,
  saveError = null,
  persisted,
  onSave,
  onLaunch,
  onLaunchStart,
  onBook,
}: StepMissionProps) {
  const [openMonth, setOpenMonth] = useState(1);

  return (
    <section aria-labelledby="mission-heading">
      <p className="text-xs font-semibold uppercase tracking-[0.15em] text-amber-200/70">
        แผนของคุณพร้อมแล้ว
      </p>
      <h2
        id="mission-heading"
        className="mt-2 font-kodchasan text-2xl font-semibold leading-snug text-slate-50 sm:text-3xl"
      >
        {plan.headline}
      </h2>

      <div className="mt-6 rounded-2xl border border-amber-200/40 bg-gradient-to-br from-amber-200/[0.12] to-indigo-500/[0.08] p-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.13em] text-amber-200/80">
          ก้าวแรก · นัดคุย 1 ชั่วโมง
        </p>
        <p className="mt-2 font-kodchasan text-lg font-semibold leading-snug text-slate-50">
          ไม่มีแผนสำเร็จรูป — เราคุยกับคุณ แล้วเขียนแผนของคุณ
        </p>
        <ul className="mt-3 space-y-1.5">
          {CONSULT_DELIVERABLES.map((item) => (
            <li
              key={item}
              className="flex items-start gap-2 text-sm leading-6 text-slate-300"
            >
              <Check
                className="mt-1 h-3.5 w-3.5 shrink-0 text-amber-200"
                aria-hidden="true"
              />
              {item}
            </li>
          ))}
        </ul>
        <a
          href={CONSULT_URL}
          target="_blank"
          rel="noopener noreferrer"
          onClick={onBook}
          className="ei-button-dawn mt-4 min-h-12 w-full justify-center"
        >
          <CalendarCheck className="h-4 w-4" aria-hidden="true" />
          <span>นัดคุยกับเรา · {CONSULT_PRICE_THB} บาท</span>
        </a>
        <p className="mt-2.5 text-xs leading-5 text-slate-500">
          {CONSULT_PRICE_THB} บาท เพื่อกันคิวให้คนที่ตั้งใจจริง
        </p>
      </div>

      <FounderCard />

      {firstAction && (
        <div className="mt-6 rounded-2xl border border-amber-200/30 bg-gradient-to-br from-indigo-500/[0.1] to-amber-200/[0.06] p-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.13em] text-amber-200/80">
            หรือเริ่มลงมือวันนี้
          </p>
          <p className="mt-2 font-kodchasan text-lg font-semibold text-slate-50">
            {firstAction.title}
          </p>
          <p className="mt-1 text-sm leading-6 text-slate-400">
            ไม่ต้องอ่านทั้งแผนก่อน — แค่ทำวันแรกให้จบ แล้วแผนจะพาคุณไปเอง
          </p>
          {onLaunchStart ? (
            <div className="mt-4">
              {/* Trial price / parent-pay copy hidden for now — restore with PayLaterSheet. */}
              <button
                type="button"
                onClick={() => {
                  onLaunch();
                  onLaunchStart();
                }}
                className="ei-button-dawn min-h-12 w-full justify-center"
              >
                <Play className="h-4 w-4" aria-hidden="true" />
                <span>เริ่มวันแรกก่อนได้ — ยังไม่ต้องจ่ายตอนนี้</span>
              </button>
            </div>
          ) : (
            <Link
              href={firstAction.href}
              onClick={onLaunch}
              className="ei-button-dawn mt-4 min-h-12 w-full justify-center"
            >
              <Play className="h-4 w-4" aria-hidden="true" />
              <span>เริ่ม PathLab วันแรก</span>
            </Link>
          )}
        </div>
      )}

      <div className="mt-8">
        <h3 className="font-kodchasan text-base font-semibold text-slate-50">
          สิ่งที่คุณจะมีในมือเมื่อครบ {plan.timelineMonths} เดือน
        </h3>
        <ul className="mt-3 divide-y divide-white/[0.06] rounded-2xl border border-white/10 bg-white/[0.03]">
          {plan.outcomes.map((outcome) => {
            const Icon = OUTCOME_ICONS[outcome.id];
            return (
              <li
                key={outcome.id}
                className="flex items-center gap-3 px-4 py-3"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-200/10 text-amber-100">
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </span>
                <span className="min-w-0 flex-1 text-sm font-semibold text-slate-100">
                  {outcome.title}
                </span>
                <span className="shrink-0 text-[11px] font-medium text-amber-200/70">
                  {outcome.landsIn}
                </span>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="mt-8">
        <h3 className="font-kodchasan text-base font-semibold text-slate-50">
          แผนรายเดือน — เราวางด้วยกันตอนนัดคุย
        </h3>
        <p className="mt-1.5 text-sm leading-6 text-slate-400">
          ด้านล่างคือโครงตั้งต้น ยังไม่ใช่แผนของคุณ
        </p>
        <div className="mt-3 space-y-2">
          {plan.months.map((month) => {
            const open = openMonth === month.month;
            return (
              <div
                key={month.month}
                className={`overflow-hidden rounded-2xl border ${
                  open
                    ? "border-amber-200/30 bg-white/[0.04]"
                    : "border-white/10 bg-white/[0.02]"
                }`}
              >
                <button
                  type="button"
                  onClick={() => setOpenMonth(open ? 0 : month.month)}
                  aria-expanded={open}
                  className="flex w-full items-center gap-3 px-4 py-3.5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-amber-200"
                >
                  <span
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                      open
                        ? "bg-amber-200/20 text-amber-100"
                        : "bg-white/[0.06] text-slate-400"
                    }`}
                  >
                    {month.month}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold text-slate-100">
                      {month.title}
                    </span>
                    {!open && (
                      <span className="block truncate text-xs text-slate-500">
                        {month.theme}
                      </span>
                    )}
                  </span>
                  <ChevronDown
                    className={`h-4 w-4 shrink-0 text-slate-500 transition-transform ${
                      open ? "rotate-180" : ""
                    }`}
                    aria-hidden="true"
                  />
                </button>
                {open && (
                  <div className="border-t border-white/[0.06] px-4 pb-4 pt-3">
                    <p className="text-sm leading-6 text-slate-400">
                      {month.theme}
                    </p>
                    <ul className="mt-3 space-y-2">
                      {month.milestones.map((milestone) => (
                        <li
                          key={milestone}
                          className="flex items-start gap-2.5 text-sm leading-6 text-slate-300"
                        >
                          <span
                            className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-200/70"
                            aria-hidden="true"
                          />
                          {milestone}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <RedFlagsDisclosure plan={plan} />

      <p className="mt-8 border-l-2 border-amber-200/40 pl-4 text-sm leading-7 text-slate-300">
        {plan.anchorNote}
      </p>

      <div className="mt-8">
        {importStatus === "saved" ? (
          <div>
            <p
              className="flex items-center gap-2 text-sm font-semibold text-emerald-200"
              role="status"
            >
              <CheckCircle2 className="h-4.5 w-4.5" aria-hidden="true" />
              บันทึกแผนนี้เข้า My Path แล้ว — กลับมาดูได้ทุกเมื่อ
            </p>
            <Link
              href="/me#my-path"
              className="ei-button-dawn mt-4 min-h-12 w-full justify-center sm:w-auto"
            >
              <UserRound className="h-4 w-4" aria-hidden="true" />
              <span>ไปดู My Path ของฉัน</span>
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        ) : isSignedIn ? (
          <button
            type="button"
            onClick={onSave}
            disabled={importStatus === "saving"}
            className="ei-button-dawn min-h-12 w-full justify-center sm:w-auto"
          >
            <span>
              {importStatus === "saving"
                ? "กำลังบันทึก…"
                : persisted
                ? "อัปเดตแผนนี้เข้า My Path"
                : "บันทึกแผนนี้เข้า My Path"}
            </span>
          </button>
        ) : (
          <Link
            href={loginHref}
            className="ei-button-dawn min-h-12 w-full justify-center sm:w-auto"
          >
            <LogIn className="h-4 w-4" aria-hidden="true" />
            <span>เข้าสู่ระบบเพื่อบันทึกแผนนี้</span>
          </Link>
        )}
        {importStatus === "error" && (
          <p
            className="mt-3 inline-flex items-center gap-2 text-sm text-rose-200"
            role="alert"
          >
            <CircleAlert className="h-4 w-4" /> {saveErrorMessage(saveError)}
          </p>
        )}
        {!isSignedIn && importStatus !== "saved" && (
          <p className="mt-3 text-xs leading-5 text-slate-500">
            ทุกอย่างที่เลือกไว้ถูกเก็บในเครื่องนี้แล้ว
            และจะกลับมาครบหลังเข้าสู่ระบบ
          </p>
        )}
      </div>
    </section>
  );
}

/** ใครเป็นคนคุย — ความน่าเชื่อถือมาจากคน ไม่ใช่ย่อหน้าโฆษณา */
function FounderCard() {
  return (
    <div className="mt-3 flex items-start gap-3.5 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <Image
        src={FOUNDER.photo}
        alt={`รูปของ ${FOUNDER.name}`}
        width={56}
        height={56}
        className="h-14 w-14 shrink-0 rounded-full border border-white/10 object-cover"
      />
      <div className="min-w-0 flex-1">
        <p className="font-kodchasan text-sm font-semibold text-slate-50">
          {FOUNDER.name}
        </p>
        <p className="text-xs text-slate-500">{FOUNDER.role}</p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {FOUNDER.credentials.map((credential) => (
            <span
              key={credential}
              className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[11px] font-medium text-slate-300"
            >
              {credential}
            </span>
          ))}
        </div>
        <p className="mt-2 text-xs leading-5 text-slate-400">{FOUNDER.note}</p>
        <a
          href={FOUNDER.linkedIn}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 inline-flex min-h-11 items-center gap-1.5 text-xs font-semibold text-indigo-200 hover:text-indigo-100"
        >
          <Linkedin className="h-3.5 w-3.5" aria-hidden="true" />
          ดูโปรไฟล์ LinkedIn
          <ExternalLink className="h-3 w-3" aria-hidden="true" />
        </a>
      </div>
    </div>
  );
}

function RedFlagsDisclosure({ plan }: { plan: MissionPlan }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="mt-8 overflow-hidden rounded-2xl border border-rose-200/15 bg-rose-100/[0.04]">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
        className="flex w-full items-center gap-3 px-4 py-3.5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-amber-200"
      >
        <AlertTriangle
          className="h-4 w-4 shrink-0 text-rose-200/80"
          aria-hidden="true"
        />
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold text-rose-100">
            {plan.redFlags.length} กับดักที่ทำให้แผนพัง
          </span>
          <span className="block text-xs text-slate-500">
            ไม่ต้องอ่านตอนนี้ — เก็บไว้อ่านตอนที่รู้สึกอยากเลิก
          </span>
        </span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-slate-500 transition-transform ${
            open ? "rotate-180" : ""
          }`}
          aria-hidden="true"
        />
      </button>
      {open && (
        <ul className="space-y-4 border-t border-rose-200/10 px-4 pb-4 pt-3">
          {plan.redFlags.map((flag) => (
            <li key={flag.title}>
              <p className="text-sm font-semibold text-rose-100/90">
                ✗ {flag.title}
              </p>
              <p className="mt-1 text-sm leading-6 text-slate-400">
                {flag.detail}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
