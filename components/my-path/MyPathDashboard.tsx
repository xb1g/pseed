"use client";

import Link from "next/link";
import {
  ArrowRight,
  BookOpenCheck,
  CheckCircle2,
  ClipboardList,
  Compass,
  FileCheck2,
  Lightbulb,
  PencilLine,
  Radar,
  Route,
} from "lucide-react";
import { useEffect, useState } from "react";

import type {
  MyPathDashboardModel,
  MyPathPathlabSummary,
} from "@/lib/my-path/dashboard";

interface MyPathDashboardProps {
  model: MyPathDashboardModel;
}

const GOAL_LABELS: Record<string, string> = {
  university: "เตรียมเข้ามหาวิทยาลัย",
  job: "เตรียมเริ่มงาน",
  scholarship: "เตรียมสมัครทุน",
  exploring: "ค้นหาทิศทางที่ใช่",
};

const PATHLAB_STATUS_LABELS: Record<MyPathPathlabSummary["status"], string> = {
  selected: "เลือกไว้แล้ว",
  active: "กำลังทำ",
  paused: "พักไว้",
  quit: "เก็บเป็นสัญญาณแล้ว",
  explored: "ทดลองจบแล้ว",
};

function useTouchInView(): void {
  useEffect(() => {
    if (
      typeof window === "undefined" ||
      !("IntersectionObserver" in window) ||
      !window.matchMedia("(hover: none)").matches
    ) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          entry.target.classList.toggle("in-view", entry.isIntersecting);
        }
      },
      { threshold: 0.45 }
    );
    const elements = document.querySelectorAll(
      "[data-my-path-reveal], .ei-button-dawn"
    );
    elements.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, []);
}

function NextActionHero({ model }: MyPathDashboardProps) {
  const isPaymentRecovery = model.nextAction.kind === "restore-pathlab-access";

  return (
    <section
      aria-labelledby="my-path-next-action"
      className="ei-card my-path-next-action overflow-hidden px-5 py-6 sm:px-8 sm:py-9 lg:px-10 lg:py-10"
      data-my-path-reveal
    >
      <div className="max-w-3xl">
        <p className="mb-3 flex items-center gap-2 font-bai-jamjuree text-sm font-semibold text-blue-200">
          <Compass aria-hidden="true" className="h-4 w-4" />
          ก้าวถัดไปของวันนี้
        </p>
        <h1
          id="my-path-next-action"
          className="font-kodchasan text-3xl font-bold leading-tight text-white sm:text-4xl lg:text-5xl"
        >
          {model.nextAction.title}
        </h1>
        <p className="mt-4 max-w-2xl font-bai-jamjuree text-base leading-7 text-slate-300 sm:text-lg">
          {model.nextAction.detail}
        </p>
        <div className="mt-7 flex flex-col items-start gap-3 sm:flex-row sm:items-center">
          <Link
            href={model.nextAction.href}
            className="ei-button-dawn min-h-12 w-full justify-center px-6 sm:w-auto"
          >
            <span>{model.nextAction.title}</span>
            <ArrowRight aria-hidden="true" className="h-5 w-5" />
          </Link>
          {isPaymentRecovery ? (
            <p className="font-bai-jamjuree text-sm leading-6 text-slate-300">
              แผนและสิ่งที่ทำไว้ยังอยู่ครบ
            </p>
          ) : null}
        </div>
      </div>
    </section>
  );
}

function SectionHeading({
  id,
  eyebrow,
  title,
  icon: Icon,
}: {
  id: string;
  eyebrow: string;
  title: string;
  icon: typeof Route;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-blue-300/20 bg-blue-400/10 text-blue-200">
        <Icon aria-hidden="true" className="h-5 w-5" />
      </span>
      <div>
        <p className="font-bai-jamjuree text-xs font-semibold uppercase tracking-[0.14em] text-blue-200/80">
          {eyebrow}
        </p>
        <h2
          id={id}
          className="mt-1 font-kodchasan text-xl font-bold text-white sm:text-2xl"
        >
          {title}
        </h2>
      </div>
    </div>
  );
}

function PlanSummary({ model }: MyPathDashboardProps) {
  if (!model.plan) return null;
  const goal = model.plan.goal
    ? GOAL_LABELS[model.plan.goal] ?? model.plan.goal
    : "กำหนดทิศทางของฉัน";

  return (
    <section aria-labelledby="my-path-plan-heading" className="my-path-section">
      <SectionHeading
        id="my-path-plan-heading"
        eyebrow="Plan"
        title="แผน 2–4 เดือนของฉัน"
        icon={Route}
      />
      <div className="mt-5 grid gap-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
        <div>
          <p className="font-bai-jamjuree text-sm text-slate-400">
            เป้าหมาย · {goal} · {model.plan.timelineMonths} เดือน
          </p>
          <p className="mt-2 max-w-2xl font-kodchasan text-lg font-semibold leading-8 text-slate-100">
            {model.plan.headline}
          </p>
        </div>
        <Link href="/plan?resume=1" className="my-path-text-link">
          <PencilLine aria-hidden="true" className="h-4 w-4" />
          แก้ไขแผน
        </Link>
      </div>
    </section>
  );
}

function RadarShortlist({ model }: MyPathDashboardProps) {
  return (
    <section
      aria-labelledby="my-path-radar-heading"
      className="my-path-section"
    >
      <SectionHeading
        id="my-path-radar-heading"
        eyebrow="Radar"
        title="ทิศที่กำลังอยากรู้จัก"
        icon={Radar}
      />
      <div className="mt-5">
        {model.radarDirections.length ? (
          <ul className="divide-y divide-white/10 border-y border-white/10">
            {model.radarDirections.map((direction, index) => (
              <li key={direction.slug}>
                <Link
                  href={direction.href}
                  className="group flex min-h-14 items-center justify-between gap-4 py-3 font-bai-jamjuree text-slate-100 outline-none transition-colors duration-150 hover:text-blue-200 focus-visible:rounded-lg focus-visible:ring-2 focus-visible:ring-yellow-200/70"
                >
                  <span className="flex min-w-0 items-center gap-3">
                    <span className="font-space-mono text-xs text-slate-500">
                      0{index + 1}
                    </span>
                    <span className="truncate font-semibold">
                      {direction.title}
                    </span>
                  </span>
                  <span className="flex items-center gap-2 text-sm text-slate-400 group-hover:text-blue-200">
                    เปิด Radar
                    <ArrowRight aria-hidden="true" className="h-4 w-4" />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <div className="mt-1 flex flex-col gap-3 border-y border-white/10 py-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="font-bai-jamjuree text-sm leading-6 text-slate-400">
              บันทึกทิศที่สนใจจาก Radar แล้วมันจะมาอยู่ใน My Path ตรงนี้
            </p>
            <Link href="/radar" className="my-path-text-link shrink-0">
              สำรวจ Radar
              <ArrowRight aria-hidden="true" className="h-4 w-4" />
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}

function PathlabExperiments({ model }: MyPathDashboardProps) {
  return (
    <section
      aria-labelledby="my-path-pathlabs-heading"
      className="my-path-section"
    >
      <SectionHeading
        id="my-path-pathlabs-heading"
        eyebrow="PathLab"
        title="การทดลองทำงานจริง"
        icon={BookOpenCheck}
      />
      <div className="mt-5">
        {model.pathlabs.length ? (
          <div className="divide-y divide-white/10 border-y border-white/10">
            {model.pathlabs.map((pathlab) => (
              <article
                key={`${pathlab.seedId}-${pathlab.enrollmentId ?? "selected"}`}
                aria-label={pathlab.title}
                className="grid gap-4 py-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center"
              >
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-kodchasan text-lg font-semibold text-white">
                      {pathlab.title}
                    </h3>
                    <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 font-bai-jamjuree text-xs text-slate-300">
                      {PATHLAB_STATUS_LABELS[pathlab.status]}
                    </span>
                  </div>
                  <p className="mt-2 font-bai-jamjuree text-sm leading-6 text-slate-400">
                    {pathlab.currentDay
                      ? `วันที่ ${pathlab.currentDay} · ทำสำเร็จ ${pathlab.completedActivities} กิจกรรม`
                      : "พร้อมเปลี่ยนความสนใจให้เป็นหลักฐานจากงานจริง"}
                  </p>
                  {pathlab.trial ? (
                    <>
                      <p className="mt-2 font-bai-jamjuree text-xs text-slate-400">
                        สถานะการเข้าถึง:{" "}
                        <span className="text-slate-200">
                          {pathlab.trial.label}
                        </span>
                        {pathlab.trial.status === "expired" ? (
                          <>
                            {" · "}
                            <Link
                              href={pathlab.trial.payHref}
                              className="inline-flex min-h-12 items-center py-3 text-blue-200 underline decoration-blue-300/40 underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-200/70"
                            >
                              เปิดการทดลองต่อ
                            </Link>
                          </>
                        ) : null}
                      </p>
                      <ParentUpdateContact payHref={pathlab.trial.payHref} />
                    </>
                  ) : null}
                </div>
                <Link
                  href={pathlab.href}
                  className="my-path-text-link shrink-0"
                >
                  ดูการทดลอง
                  <ArrowRight aria-hidden="true" className="h-4 w-4" />
                </Link>
              </article>
            ))}
          </div>
        ) : (
          <p className="border-y border-white/10 py-5 font-bai-jamjuree text-sm leading-6 text-slate-400">
            เมื่อเลือก PathLab การทดลองจะเรียงต่อจาก Radar
            และติดตามความคืบหน้าให้ที่นี่
          </p>
        )}
      </div>
    </section>
  );
}

function ParentUpdateContact({ payHref }: { payHref: string }) {
  const token = payHref.match(/^\/pay\/([0-9a-f]{32})$/)?.[1] ?? null;
  const [maskedEmail, setMaskedEmail] = useState<string | null>(null);
  const [revoking, setRevoking] = useState(false);
  const [revoked, setRevoked] = useState(false);

  useEffect(() => {
    if (!token) return;
    let active = true;
    void fetch(`/api/trials/${token}/parent-updates`)
      .then(async (response) => (response.ok ? response.json() : null))
      .then((payload) => {
        if (
          active &&
          payload?.verified &&
          typeof payload.maskedEmail === "string"
        ) {
          setMaskedEmail(payload.maskedEmail);
        }
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [token]);

  async function revoke() {
    if (!token || revoking) return;
    setRevoking(true);
    try {
      const response = await fetch(`/api/trials/${token}/parent-updates`, {
        method: "DELETE",
      });
      if (!response.ok) return;
      setMaskedEmail(null);
      setRevoked(true);
    } finally {
      setRevoking(false);
    }
  }

  if (revoked) {
    return (
      <p className="mt-2 text-xs text-emerald-200" role="status">
        หยุดส่งอัปเดตแล้ว
      </p>
    );
  }
  if (!maskedEmail) return null;

  return (
    <div className="mt-2 flex flex-col items-start gap-1 sm:flex-row sm:items-center sm:gap-3">
      <p className="text-xs text-slate-400">
        อัปเดตผู้ปกครอง: <span className="text-slate-200">{maskedEmail}</span>
      </p>
      <button
        type="button"
        onClick={revoke}
        disabled={revoking}
        className="inline-flex min-h-12 items-center rounded-lg px-2 text-xs font-semibold text-rose-200 underline decoration-rose-200/40 underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-200/70 disabled:opacity-50"
      >
        {revoking ? "กำลังหยุดส่ง…" : "หยุดส่งอัปเดตให้ผู้ปกครอง"}
      </button>
    </div>
  );
}

function EvidenceSection({ model }: MyPathDashboardProps) {
  return (
    <section
      aria-labelledby="my-path-evidence-heading"
      className="my-path-section"
    >
      <SectionHeading
        id="my-path-evidence-heading"
        eyebrow="Evidence"
        title="หลักฐานที่ได้จากการลงมือทำ"
        icon={FileCheck2}
      />
      <div className="mt-5">
        {model.evidence.length ? (
          <ul className="divide-y divide-white/10 border-y border-white/10">
            {model.evidence.map((item) => (
              <li key={item.id} className="py-5">
                <Link
                  href={item.href}
                  className="group grid min-h-12 gap-1 font-bai-jamjuree outline-none focus-visible:rounded-lg focus-visible:ring-2 focus-visible:ring-yellow-200/70"
                >
                  <span className="flex items-center gap-2 font-semibold text-slate-100 group-hover:text-blue-200">
                    <CheckCircle2
                      aria-hidden="true"
                      className="h-4 w-4 text-emerald-300"
                    />
                    {item.label}
                  </span>
                  <span className="pl-6 text-sm leading-6 text-slate-400">
                    {item.detail}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="border-y border-white/10 py-5 font-bai-jamjuree text-sm leading-6 text-slate-400">
            หลักฐานจะเกิดจากสิ่งที่ทำจริง ไม่ต้องเดาว่าตัวเองเหมาะกับอะไร
          </p>
        )}
      </div>
    </section>
  );
}

function SupportingJourneyLinks() {
  return (
    <nav
      aria-labelledby="my-path-supporting-heading"
      className="my-path-supporting-links"
    >
      <div>
        <p className="font-bai-jamjuree text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
          เมื่ออยากมองภาพกว้าง
        </p>
        <h2
          id="my-path-supporting-heading"
          className="mt-1 font-kodchasan text-lg font-semibold text-slate-100"
        >
          ทบทวนเส้นทางและความคิดของฉัน
        </h2>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        <Link href="/me/journey" className="my-path-support-link">
          <Route aria-hidden="true" className="h-5 w-5" />
          <span>
            <strong>เปิด Journey Map</strong>
            <small>ดูภาพรวมสิ่งที่เคยสำรวจ</small>
          </span>
        </Link>
        <Link href="/me/reflection" className="my-path-support-link">
          <Lightbulb aria-hidden="true" className="h-5 w-5" />
          <span>
            <strong>เขียน Reflection</strong>
            <small>บันทึกสิ่งที่เรียนรู้จากวันนี้</small>
          </span>
        </Link>
      </div>
    </nav>
  );
}

export function MyPathDashboard({ model }: MyPathDashboardProps) {
  useTouchInView();

  return (
    <div className="dawn-theme my-path-dashboard font-bai-jamjuree">
      <NextActionHero model={model} />
      <div className="my-path-core-loop" data-my-path-reveal>
        <div
          className="my-path-journey-marker"
          aria-label="Plan ไป Radar ไป PathLab ไป Evidence"
        >
          <ClipboardList aria-hidden="true" className="h-4 w-4" />
          <span>Plan</span>
          <span aria-hidden="true">→</span>
          <span>Radar</span>
          <span aria-hidden="true">→</span>
          <span>PathLab</span>
          <span aria-hidden="true">→</span>
          <span>Evidence</span>
        </div>
        <PlanSummary model={model} />
        <RadarShortlist model={model} />
        <PathlabExperiments model={model} />
        <EvidenceSection model={model} />
      </div>
      <SupportingJourneyLinks />
    </div>
  );
}
