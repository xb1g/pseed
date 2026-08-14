"use client";

import React from "react";
import Link from "next/link";
import {
  Sparkles,
  CheckCircle2,
  Calendar,
  ArrowRight,
  ShieldCheck,
  Compass,
  MessageCircle,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DawnScene } from "@/components/projectseed/dawn-scene";
import type { StudentPlan } from "@/types/student-plan";

interface StudentPlanPageViewProps {
  plan: StudentPlan;
}

const displayFont = "var(--font-kodchasan), var(--font-bai-jamjuree), sans-serif";

export function StudentPlanPageView({ plan }: StudentPlanPageViewProps) {
  const readiness = plan.readiness_score ?? 3;
  const totalSlots = 8;
  const activeSlots = Math.min(Math.max(readiness, 1), totalSlots);

  return (
    <main className="dawn-theme relative min-h-screen overflow-hidden text-slate-100 selection:bg-amber-200/30 selection:text-amber-100">
      <DawnScene />

      <div className="relative z-10 mx-auto max-w-3xl px-4 py-12 md:py-16">
        {/* Brand Bar */}
        <div className="flex items-center justify-between pb-6 mb-10">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="h-3 w-3 rounded-full bg-[#fed95c] shadow-[0_0_12px_rgba(254,217,92,0.8)]" />
            <span
              className="font-bold tracking-tight text-white"
              style={{ fontFamily: displayFont }}
            >
              PassionSeed
            </span>
            <span className="ei-badge ei-badge--dawn ml-2">แผนเตรียมพอร์ตรายบุคคล</span>
          </Link>
        </div>

        {/* Hero Header */}
        <div className="space-y-5">
          <span className="dawn-eyebrow inline-flex items-center gap-2">
            <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
            แผนที่นำทางสู่ TCAS รอบ Portfolio
          </span>

          <h1
            className="text-3xl font-bold tracking-tight text-white md:text-[2.75rem] md:leading-[1.2]"
            style={{ fontFamily: displayFont }}
          >
            แผนเตรียมพอร์ตสาย{plan.target_field}
          </h1>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-slate-400">
            <span className="font-semibold text-slate-100">{plan.student_name}</span>
            <Badge
              variant="outline"
              className="border-blue-400/35 bg-blue-500/10 text-blue-300"
            >
              {plan.grade_level}
            </Badge>
            <span className="text-slate-500">
              อัปเดต{" "}
              {new Date(plan.created_at).toLocaleDateString("th-TH", {
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
            </span>
          </div>

          <hr className="dawn-rule w-3/4" />
        </div>

        {/* Readiness Meter Card */}
        <section className="ei-card mt-10 p-6">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <h2
                className="text-base font-semibold text-white"
                style={{ fontFamily: displayFont }}
              >
                ระดับความพร้อมของ Portfolio ปัจจุบัน
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                ประเมินจากผลงานและเป้าหมายของสาย {plan.target_field}
              </p>
              <p className="mt-1 text-[11px] text-slate-500">
                พี่ประเมินให้จากสิ่งที่น้องเล่าไว้ในแชท
              </p>
            </div>
            <span className="font-mono text-lg font-bold text-blue-300 shrink-0">
              {activeSlots}/{totalSlots}
            </span>
          </div>

          <div className="flex items-center gap-1.5 mb-4">
            {Array.from({ length: totalSlots }).map((_, idx) => (
              <div
                key={idx}
                className={`h-2.5 flex-1 rounded transition-all ${
                  idx < activeSlots
                    ? "bg-gradient-to-r from-blue-500 to-indigo-400 shadow-[0_0_10px_rgba(59,130,246,0.35)]"
                    : "bg-white/[0.07]"
                }`}
              />
            ))}
          </div>

          <p className="text-sm text-slate-300 leading-relaxed rounded-lg border border-white/[0.06] bg-black/30 p-4">
            💡 <b className="text-slate-100">คำแนะนำหลัก:</b>{" "}
            {plan.custom_advice ||
              "เน้นสร้างโปรเจกต์เชิงลึก 1 ชิ้นที่มีผลลัพธ์จับต้องได้ เพื่อใช้เป็นจุดเด่นหลักในพอร์ตและตอบคำถามสัมภาษณ์"}
          </p>
        </section>

        {/* 3 Ranked Priorities */}
        <section className="mt-14 space-y-5">
          <div>
            <span className="dawn-eyebrow inline-flex items-center gap-2">
              <Compass className="h-3.5 w-3.5" aria-hidden="true" />
              เรียงตามน้ำหนักคะแนนกรรมการ
            </span>
            <h2
              className="mt-2 text-2xl font-bold text-white"
              style={{ fontFamily: displayFont }}
            >
              3 สิ่งที่ต้องโฟกัส
            </h2>
          </div>

          <div className="grid gap-4">
            {plan.ranked_priorities.map((priority) => (
              <article key={priority.rank} className="ei-card p-5 md:p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-blue-400/40 bg-blue-500/10 font-mono text-sm font-bold text-blue-300">
                      {priority.rank}
                    </span>
                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3
                          className="text-base font-semibold text-white md:text-lg"
                          style={{ fontFamily: displayFont }}
                        >
                          {priority.title}
                        </h3>
                        {priority.tag && (
                          <Badge
                            variant="outline"
                            className="border-white/10 text-slate-400 text-[10px]"
                          >
                            {priority.tag}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm leading-relaxed text-slate-300">
                        {priority.description}
                      </p>
                    </div>
                  </div>
                  <span
                    aria-label={`น้ำหนัก ${priority.stars} จาก 5`}
                    className="shrink-0 font-mono text-sm text-[#fed95c] [text-shadow:0_0_10px_rgba(254,217,92,0.35)]"
                  >
                    {"★".repeat(priority.stars)}
                    <span className="text-white/10 [text-shadow:none]">
                      {"☆".repeat(Math.max(0, 5 - priority.stars))}
                    </span>
                  </span>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* 6-Month Real Timeline */}
        <section className="mt-14 space-y-5">
          <div>
            <span className="dawn-eyebrow inline-flex items-center gap-2">
              <Calendar className="h-3.5 w-3.5" aria-hidden="true" />
              กำหนดการจริงที่ตรงสาย
            </span>
            <h2
              className="mt-2 text-2xl font-bold text-white"
              style={{ fontFamily: displayFont }}
            >
              ปฏิทิน 6 เดือน & รายการแข่งขัน
            </h2>
          </div>

          <div className="ei-card p-6 divide-y divide-white/[0.06]">
            {plan.timeline.map((item, idx) => (
              <div
                key={idx}
                className="flex flex-col justify-between gap-3 py-4 first:pt-0 last:pb-0 md:flex-row md:items-center"
              >
                <div className="flex items-start gap-3">
                  <span className="shrink-0 rounded-md border border-blue-400/30 bg-blue-500/10 px-2 py-1 text-xs font-semibold text-blue-300">
                    {item.month}
                  </span>
                  <div>
                    <div className="text-sm font-semibold text-slate-100">
                      {item.title}
                    </div>
                    {item.notes && (
                      <p className="mt-1 text-xs leading-relaxed text-slate-400">
                        {item.notes}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex shrink-0 items-center justify-between gap-4 md:justify-end">
                  <span className="font-mono text-xs text-blue-300">
                    {item.deadline}
                  </span>
                  {item.url && (
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-slate-400 transition-colors hover:text-blue-300"
                    >
                      ลิงก์ <ExternalLink className="h-3 w-3" aria-hidden="true" />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Step 1 — the one gold keynote of the page */}
        <section className="mt-14">
          <div className="dawn-keynote space-y-6 p-6 md:p-8">
            <div className="flex flex-col justify-between gap-5 border-b border-white/[0.07] pb-6 md:flex-row md:items-center">
              <div>
                <span className="dawn-eyebrow">ขั้นแรกของน้อง · Step 1</span>
                <h3
                  className="mt-2 text-2xl font-bold text-white md:text-3xl"
                  style={{ fontFamily: displayFont }}
                >
                  {plan.step_one_action.title}
                </h3>
                <p
                  className="mt-1.5 text-sm text-slate-300"
                  style={{ fontFamily: displayFont }}
                >
                  {plan.step_one_action.subtitle ||
                    "ทำโปรเจกต์จริง 5 วัน เพื่อค้นหาว่าสายนี้ใช่สำหรับน้องไหม"}
                </p>
              </div>
              <div className="shrink-0 md:text-right">
                <div className="text-xs text-slate-400">ค่าเข้าร่วมโครงการ</div>
                <div
                  className="text-4xl font-bold text-[#fed95c] [text-shadow:0_0_24px_rgba(254,217,92,0.35)]"
                  style={{ fontFamily: displayFont }}
                >
                  {plan.step_one_action.price}฿
                </div>
                <div className="mt-1 text-[11px] text-slate-400">
                  (รวมเกียรติบัตร + เมนเทอร์ตรวจงาน)
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                สิ่งที่จะได้รับจากโปรเจกต์นี้
              </div>
              <ul className="dawn-list grid grid-cols-1 gap-2.5 text-sm text-slate-200 md:grid-cols-2">
                {plan.step_one_action.keyDeliverables.map((item, idx) => (
                  <li key={idx} className="flex items-center gap-2.5">
                    <CheckCircle2
                      className="h-4 w-4 shrink-0 text-[#fed95c]"
                      aria-hidden="true"
                    />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="pt-1">
              <Link
                href="https://instagram.com/passionseed_official"
                target="_blank"
                className="block"
              >
                <Button className="ei-button-dawn w-full py-6 text-base">
                  <MessageCircle className="mr-2 h-4 w-4" aria-hidden="true" />
                  ทัก DM เพื่อรับสิทธิ์รอบแรก ({plan.step_one_action.price}฿)
                  <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Parent Proof Section */}
        <section className="ei-card mt-10 p-6 space-y-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-200">
            <ShieldCheck className="h-4 w-4 text-emerald-400" aria-hidden="true" />
            <span>ข้อมูลสำหรับผู้ปกครอง (Parent Proof)</span>
          </div>
          <p className="text-xs leading-relaxed text-slate-400">
            {plan.parent_notes ||
              "โครงการนี้มุ่งเน้นการพัฒนาทักษะเฉพาะทางที่สอดคล้องกับเกณฑ์การรับเข้ามหาวิทยาลัยในระบบ TCAS รอบที่ 1 โดยเด็กๆ จะได้สร้างผลงานจริงที่มีชิ้นงานเป็นรูปธรรม พร้อมหน้าเว็บยืนยันผลงานและเกียรติบัตรรับรอง เพื่อให้มั่นใจว่าทุกชั่วโมงที่ลงทุนไปจะเกิดประโยชน์สูงสุดในการยื่นสมัคร"}
          </p>
        </section>

        {/* Footer */}
        <footer className="mt-14 text-center font-mono text-xs text-slate-500">
          <p>© {new Date().getFullYear()} PassionSeed · แผนที่นำทางสู่อนาคตเด็กไทย</p>
        </footer>
      </div>
    </main>
  );
}
