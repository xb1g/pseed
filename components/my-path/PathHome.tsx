"use client";

import Link from "next/link";
import { ArrowRight, CheckCircle2, Compass, RefreshCw } from "lucide-react";

import { getRegistryItem } from "@/lib/my-path/registry";
import type { CareerPreview } from "@/lib/my-path/radar-content";
import type {
  DirectionHypothesis,
  JourneyEvent,
  MyPathDraft,
  NextStep,
} from "@/lib/my-path/types";

export interface MyPathEvidence {
  id: string;
  careerSlug: string;
  label: string;
  detail: string;
  createdAt: string;
}

export function PathHome({
  draft,
  careers,
  direction,
  nextStep,
  evidence,
  returning,
  onStartStep,
  onCompleteStep,
  onReplaceStep,
  onStepNotUseful,
}: {
  draft: MyPathDraft;
  careers: CareerPreview[];
  direction: DirectionHypothesis;
  nextStep: NextStep;
  evidence: MyPathEvidence[];
  returning: boolean;
  onStartStep: () => void;
  onCompleteStep: () => void;
  onReplaceStep: () => void;
  onStepNotUseful: () => void;
}) {
  const saved = careers.filter(
    (career) => draft.possibilities[career.slug]?.state === "saved"
  );
  const openQuestions = draft.savedQuestions.filter(
    (question) => question.status === "open"
  );
  const changes = draft.events
    .filter((event) =>
      ["career_saved", "career_removed", "question_answered", "step_completed"].includes(
        event.type
      )
    )
    .slice(-5)
    .reverse();
  const capabilities = Array.from(
    new Set(
      saved.flatMap(
        (career) => getRegistryItem(career.slug)?.capabilities ?? []
      )
    )
  ).slice(0, 4);

  return (
    <section id="my-path-home" className="space-y-12" aria-labelledby="path-home-heading">
      <div className="max-w-3xl">
        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-amber-100/70">
          My Path
        </p>
        <h2
          id="path-home-heading"
          className="mt-3 font-kodchasan text-3xl font-semibold leading-tight text-slate-50 sm:text-4xl"
        >
          {returning ? "เส้นทางของคุณยังไม่ต้องชัดทั้งหมด" : "เริ่มจากก้าวที่เล็กพอจะทำได้จริง"}
        </h2>
        <p className="mt-3 max-w-2xl text-base leading-7 text-slate-400">
          ตอนนี้คุณกำลังสำรวจ {saved.length} เส้นทาง และมี {openQuestions.length} คำถามที่ควรหาคำตอบต่อ
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
        <section className="rounded-3xl border border-amber-200/15 bg-amber-100/[0.05] p-6 sm:p-8">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.13em] text-amber-100/70">
            <Compass className="h-4 w-4" aria-hidden="true" /> ก้าวต่อไปของคุณ
          </div>
          <h3 className="mt-4 font-kodchasan text-2xl font-semibold text-slate-50">
            {nextStep.title}
          </h3>
          <p className="mt-3 max-w-xl text-sm leading-6 text-slate-300">
            {nextStep.detail}
          </p>
          <p className="mt-3 text-xs font-semibold text-slate-500">
            ใช้เวลาประมาณ {nextStep.durationMinutes} นาที
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            {nextStep.href ? (
              <Link
                href={nextStep.href}
                onClick={onStartStep}
                className="ei-button-dawn min-h-12 justify-center"
              >
                <span>เริ่มก้าวนี้</span>
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            ) : (
              <button
                type="button"
                onClick={onStartStep}
                className="ei-button-dawn min-h-12 justify-center"
              >
                <span>เริ่มก้าวนี้</span>
              </button>
            )}
            <button
              type="button"
              onClick={onCompleteStep}
              className="inline-flex min-h-12 items-center gap-2 rounded-xl border border-emerald-200/20 px-4 text-sm font-semibold text-emerald-100 hover:bg-emerald-100/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200"
            >
              <CheckCircle2 className="h-4 w-4" aria-hidden="true" /> ทำเสร็จแล้ว
            </button>
          </div>
          <div className="mt-3 flex flex-wrap gap-4 text-xs">
            <button type="button" onClick={onReplaceStep} className="min-h-11 text-slate-500 hover:text-slate-300">
              เปลี่ยนก้าวนี้
            </button>
            <button type="button" onClick={onStepNotUseful} className="min-h-11 text-slate-500 hover:text-slate-300">
              ก้าวนี้ไม่ช่วยเท่าไร
            </button>
          </div>
        </section>

        <section className="border-t border-white/10 pt-6 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0">
          <p className="text-xs font-semibold uppercase tracking-[0.13em] text-indigo-200/65">
            ทิศทางตอนนี้
          </p>
          <p className="mt-3 text-lg font-semibold leading-8 text-slate-100">
            {direction.statement}
          </p>
          <p className="mt-3 text-xs leading-5 text-slate-500">{direction.disclaimer}</p>
        </section>
      </div>

      <section>
        <h3 className="font-kodchasan text-xl font-semibold text-slate-50">
          เส้นทางที่กำลังสำรวจ
        </h3>
        <div className="mt-4 flex flex-wrap gap-3">
          {saved.map((career) => (
            <Link
              key={career.slug}
              href={career.radarHref}
              className="inline-flex min-h-12 items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 text-sm font-semibold text-slate-200 hover:bg-white/[0.08] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200"
            >
              {career.emoji} {career.titleTh}
            </Link>
          ))}
        </div>
      </section>

      {openQuestions.length > 0 && (
        <section>
          <h3 className="font-kodchasan text-xl font-semibold text-slate-50">
            คำถามที่อยากหาคำตอบ
          </h3>
          <ul className="mt-4 divide-y divide-white/10 border-y border-white/10">
            {openQuestions.map((question) => (
              <li key={question.id} className="py-4 text-sm leading-6 text-slate-300">
                {question.text}
              </li>
            ))}
          </ul>
        </section>
      )}

      {capabilities.length > 0 && (
        <section>
          <h3 className="font-kodchasan text-xl font-semibold text-slate-50">
            สิ่งที่พกข้ามเส้นทางได้
          </h3>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
            ต่อให้เปลี่ยนใจ สิ่งเหล่านี้ยังใช้ต่อได้ในหลายอาชีพ
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {capabilities.map((capability) => (
              <span key={capability} className="rounded-full bg-indigo-200/[0.07] px-3 py-1.5 text-xs font-medium text-indigo-100">
                {capability.replaceAll("-", " ")}
              </span>
            ))}
          </div>
        </section>
      )}

      {evidence.length > 0 && (
        <section>
          <h3 className="font-kodchasan text-xl font-semibold text-slate-50">
            หลักฐานที่มีอยู่แล้ว
          </h3>
          <ul className="mt-4 space-y-3">
            {evidence.map((item) => (
              <li key={item.id} className="rounded-2xl border border-white/10 px-4 py-3">
                <p className="text-xs font-semibold text-indigo-200/70">{item.label}</p>
                <p className="mt-1 text-sm leading-6 text-slate-300">{item.detail}</p>
              </li>
            ))}
          </ul>
        </section>
      )}

      {changes.length > 0 && (
        <section>
          <div className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4 text-slate-500" aria-hidden="true" />
            <h3 className="font-kodchasan text-xl font-semibold text-slate-50">
              What changed?
            </h3>
          </div>
          <ul className="mt-4 divide-y divide-white/10 border-y border-white/10">
            {changes.map((event) => (
              <li key={event.id} className="py-3 text-sm text-slate-400">
                {eventLabel(event, careers)}
              </li>
            ))}
          </ul>
        </section>
      )}
    </section>
  );
}

function eventLabel(event: JourneyEvent, careers: CareerPreview[]): string {
  const career = careers.find((item) => item.slug === event.careerSlug);
  const title = career?.titleTh ?? event.careerSlug ?? "เส้นทางของคุณ";
  switch (event.type) {
    case "career_saved":
      return `เพิ่ม ${title}`;
    case "career_removed":
      return `นำ ${title} ออกจากเส้นทางที่กำลังสำรวจ แต่เก็บเหตุผลไว้ในประวัติแล้ว`;
    case "question_answered":
      return `ตอบคำถามเรื่อง ${event.answerId ?? "สิ่งที่สำคัญ"}`;
    case "step_completed":
      return `ทำก้าว ${event.stepId ?? "ล่าสุด"} เสร็จแล้ว`;
    default:
      return "มีหลักฐานใหม่ในเส้นทางของคุณ";
  }
}
