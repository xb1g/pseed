"use client";

import React from "react";
import {
  Briefcase,
  CalendarCheck,
  CheckCircle2,
  Compass,
  MessageCircle,
  Rocket,
  ShieldCheck,
  Sparkles,
  Users,
  Target,
  Clock,
  FolderKanban,
  ArrowRight,
} from "lucide-react";
import { TALENT_SIGNUP_FORM_URL } from "@/components/talent/TalentJoinCard";
import type { ReadinessLevel } from "./ReadinessStep";

export interface SelectedCareerInfo {
  titleTh?: string;
  title?: string;
  slug?: string;
  name?: string;
}

export interface SelectedSeedInfo {
  title?: string;
  name?: string;
  id?: string;
}

export interface PlanSummaryStepProps {
  readiness?: ReadinessLevel | null;
  selectedCareer?: SelectedCareerInfo | string | null;
  selectedSeed?: SelectedSeedInfo | string | null;
  timeline?: string | null;
  onBook?: () => void;
}

function getCareerTitle(career?: SelectedCareerInfo | string | null): string {
  if (!career) return "ยังไม่ได้เลือก";
  if (typeof career === "string") return career;
  return career.titleTh || career.title || career.name || "ยังไม่ได้เลือก";
}

function getSeedTitle(seed?: SelectedSeedInfo | string | null): string {
  if (!seed) return "ยังไม่ได้เลือก";
  if (typeof seed === "string") return seed;
  return seed.title || seed.name || "ยังไม่ได้เลือก";
}

const CALENDLY_URL = "https://calendly.com/seedpassion/30min";

function buildLineOaDeepLink({ careerTitle }: { careerTitle: string }) {
  const message = `สวัสดีครับ/ค่ะ! ได้ลองค้นหาทิศทางบน PassionSeed อยากปรึกษาพี่ๆ เพิ่มเติมครับ:\n🎯 สายงาน: ${careerTitle}\nอยากสอบถามเกี่ยวกับ Career Exploration ครับ`;

  return `https://line.me/R/oaMessage/@passionseed/?${encodeURIComponent(message)}`;
}

const PROJECTSEED_FEATURES = [
  {
    title: "Shipped TCAS portfolio project",
    subtitle: "ผลงาน TCAS Round 1 ส่งได้จริง",
    desc: "สร้างโปรเจกต์เด่นที่ใช้งานได้จริง พร้อมยื่นพอร์ต TCAS รอบ 1",
  },
  {
    title: "Real user interviews guarantee",
    subtitle: "การันตีสัมภาษณ์ผู้ใช้จริง",
    desc: "สัมภาษณ์และทดสอบผู้ใช้งานจริง ได้ Data & Feedback ชัดเจน",
  },
  {
    title: "Alumni mentors (TechSeed/BizSeed builders)",
    subtitle: "เมนทอร์รุ่นพี่จาก TechSeed / BizSeed",
    desc: "คำแนะนำ 1-on-1 จากรุ่นพี่ที่มีประสบการณ์สร้างโปรเจกต์จริง",
  },
  {
    title: "Community access",
    subtitle: "เข้าถึงคอมมูนิตี้ผู้สร้าง",
    desc: "ร่วมเครือข่ายเพื่อนๆ นักสร้างสรรค์ แลกเปลี่ยนไอเดียและช่วยเหลือกัน",
  },
];

export function PlanSummaryStep({
  readiness,
  selectedCareer,
  selectedSeed,
  timeline = "3 เดือน",
  onBook,
}: PlanSummaryStepProps) {
  const effectiveReadiness = readiness ?? "hands_on";
  const isHandsOn = effectiveReadiness === "hands_on";
  const isTalent = effectiveReadiness === "talent";
  const careerTitle = getCareerTitle(selectedCareer);
  const seedTitle = getSeedTitle(selectedSeed);
  const timelineText = timeline || "3 เดือน";

  const lineDeepLink = buildLineOaDeepLink({ careerTitle });

  return (
    <section
      aria-labelledby="summary-heading"
      className="dawn-theme flex flex-col items-start w-full font-bai-jamjuree space-y-6"
    >
      {/* Header */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-indigo-200/70">
          สรุปแผนโปรเจกต์ · Project Blueprint Summary
        </p>
        <h2
          id="summary-heading"
          className="mt-2 font-kodchasan text-2xl font-semibold text-slate-50 sm:text-3xl"
        >
          {isTalent
            ? "พร้อมลุยงานจริงกับพาร์ตเนอร์แล้ว!"
            : isHandsOn
              ? "พร้อมลุยสร้างโปรเจกต์ของคุณแล้ว!"
              : "เริ่มต้นค้นหาทิศทางสายอาชีพที่ใช่"}
        </h2>
        <p className="mt-2 text-sm leading-6 text-slate-400">
          {isTalent
            ? "ทบทวนพิมพ์เขียว แล้วสมัครเป็น Talent เพื่อสร้างโปรไฟล์และรับงานจริง"
            : isHandsOn
              ? "ทบทวนพิมพ์เขียวโปรเจกต์ แล้วจองคิวปรึกษาฟรี 30 นาทีกับพี่ๆ เพื่อดูว่า ProjectSeed เหมาะกับคุณไหม"
              : "ทบทวนพิมพ์เขียวโปรเจกต์ และรับคำแนะนำ 1-on-1 จากเมนทอร์พี่ๆ บน LINE OA"}
        </p>
      </div>

      {/* Blueprint Overview Card */}
      <div className="ei-card w-full p-6 rounded-2xl border border-white/10 bg-white/[0.03] space-y-4">
        <h3 className="font-kodchasan text-lg font-semibold text-slate-100 flex items-center gap-2">
          <FolderKanban className="h-5 w-5 text-indigo-400" />
          สรุปรายละเอียดแผนของคุณ
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          <div className="rounded-xl border border-white/5 bg-slate-900/40 p-4">
            <div className="flex items-center gap-2 text-indigo-300 text-xs font-medium mb-1">
              <Target className="h-4 w-4" />
              สายงานเป้าหมาย
            </div>
            <p className="font-kodchasan font-bold text-slate-100 text-base">
              {careerTitle}
            </p>
          </div>

          <div className="rounded-xl border border-white/5 bg-slate-900/40 p-4">
            <div className="flex items-center gap-2 text-amber-300 text-xs font-medium mb-1">
              <Rocket className="h-4 w-4" />
              โปรเจกต์ชูโรง
            </div>
            <p className="font-kodchasan font-bold text-slate-100 text-base">
              {seedTitle}
            </p>
          </div>

          <div className="rounded-xl border border-white/5 bg-slate-900/40 p-4">
            <div className="flex items-center gap-2 text-emerald-300 text-xs font-medium mb-1">
              <Clock className="h-4 w-4" />
              ไทม์ไลน์
            </div>
            <p className="font-kodchasan font-bold text-slate-100 text-base">
              {timelineText}
            </p>
          </div>
        </div>
      </div>

      {/* Main Recommendation / Offer Card */}
      {isTalent ? (
        <div className="ei-card ei-card--lit w-full p-6 sm:p-8 rounded-2xl border border-emerald-400/30 bg-gradient-to-b from-emerald-950/30 via-slate-900/60 to-slate-950 space-y-6 relative overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-emerald-500/20 pb-6">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-300/30 bg-emerald-400/10 px-3 py-1 text-xs font-medium text-emerald-200 mb-2">
                <Sparkles className="h-3.5 w-3.5" />
                งานจริงจากพาร์ตเนอร์ในอุตสาหกรรม
              </div>
              <h3 className="font-kodchasan text-2xl sm:text-3xl font-bold text-slate-50">
                สร้างโปรไฟล์ Talent ของคุณ
              </h3>
              <p className="text-sm text-slate-300 mt-1">
                รับงานฟรีแลนซ์และงานจริงจากพาร์ตเนอร์ พร้อมพี่ๆ คอยซัพพอร์ต
              </p>
            </div>

            <div className="sm:text-right">
              <span className="text-xs uppercase tracking-wider text-slate-400 block">
                สมัครง่าย ไม่มีค่าใช้จ่าย
              </span>
              <span className="font-kodchasan text-3xl sm:text-4xl font-extrabold text-emerald-300">
                สมัครฟรี
              </span>
            </div>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              {
                subtitle: "งานจริงจากพาร์ตเนอร์",
                desc: "รับงานฟรีแลนซ์และงานสั้นจากบริษัทพาร์ตเนอร์จริง",
              },
              {
                subtitle: "โปรไฟล์โชว์ผลงานจริง",
                desc: "สร้างโปรไฟล์ Talent ที่รวมผลงานและทักษะของคุณ",
              },
              {
                subtitle: "พี่ๆ คัดงานให้เหมาะกับคุณ",
                desc: "ทีม PassionSeed ช่วยจับคู่งานและดูแลตลอดการทำงาน",
              },
            ].map((feat, idx) => (
              <div
                key={idx}
                className="flex items-start gap-3 p-3.5 rounded-xl border border-white/5 bg-slate-900/40"
              >
                <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-kodchasan text-sm font-bold text-slate-100">
                    {feat.subtitle}
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5">{feat.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Primary CTA Button */}
          <div className="pt-2 flex flex-col sm:flex-row items-center gap-4 justify-between">
            <p className="text-xs text-slate-400 flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
              สมัครฟรี · พี่ๆ ติดต่อกลับเพื่อช่วยสร้างโปรไฟล์และจับคู่งาน
            </p>

            <a
              href={TALENT_SIGNUP_FORM_URL}
              target="_blank"
              rel="noopener noreferrer"
              onClick={onBook}
              className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-semibold px-6 py-3.5 text-base font-bai-jamjuree transition-all shadow-lg shadow-emerald-400/20 hover:shadow-emerald-400/40 hover:-translate-y-0.5"
            >
              <Briefcase className="h-5 w-5" />
              <span>สมัครเป็น Talent สร้างโปรไฟล์</span>
              <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        </div>
      ) : isHandsOn ? (
        <div className="ei-card ei-card--lit w-full p-6 sm:p-8 rounded-2xl border border-amber-300/30 bg-gradient-to-b from-amber-950/30 via-slate-900/60 to-slate-950 space-y-6 relative overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-amber-500/20 pb-6">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-amber-300/30 bg-amber-400/10 px-3 py-1 text-xs font-medium text-amber-200 mb-2">
                <Sparkles className="h-3.5 w-3.5" />
                ปรึกษาฟรีก่อนตัดสินใจ
              </div>
              <h3 className="font-kodchasan text-2xl sm:text-3xl font-bold text-slate-50">
                ProjectSeed Program
              </h3>
              <p className="text-sm text-slate-300 mt-1">
                โปรแกรมเร่งสปีดผลงาน TCAS Round 1 แบบครบวงจร
              </p>
            </div>

            <div className="sm:text-right">
              <span className="text-xs uppercase tracking-wider text-slate-400 block">
                คุยกับพี่ๆ ก่อน ไม่เสียเงิน
              </span>
              <span className="font-kodchasan text-3xl sm:text-4xl font-extrabold text-amber-300">
                ปรึกษาฟรี
              </span>
            </div>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {PROJECTSEED_FEATURES.map((feat, idx) => (
              <div
                key={idx}
                className="flex items-start gap-3 p-3.5 rounded-xl border border-white/5 bg-slate-900/40"
              >
                <CheckCircle2 className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-kodchasan text-sm font-bold text-slate-100">
                    {feat.subtitle}
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5">{feat.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Primary CTA Button */}
          <div className="pt-2 flex flex-col sm:flex-row items-center gap-4 justify-between">
            <p className="text-xs text-slate-400 flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
              คุยกับพี่ๆ ฟรี 30 นาที · ช่วยประเมินว่า ProjectSeed เหมาะกับคุณไหม
            </p>

            <a
              href={CALENDLY_URL}
              target="_blank"
              rel="noopener noreferrer"
              onClick={onBook}
              className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-semibold px-6 py-3.5 text-base font-bai-jamjuree transition-all shadow-lg shadow-amber-400/20 hover:shadow-amber-400/40 hover:-translate-y-0.5"
            >
              <CalendarCheck className="h-5 w-5" />
              <span>จองคิวปรึกษาฟรี 30 นาที</span>
              <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        </div>
      ) : (
        <div className="ei-card w-full p-6 sm:p-8 rounded-2xl border border-indigo-500/30 bg-gradient-to-b from-indigo-950/30 via-slate-900/60 to-slate-950 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-indigo-500/20 pb-6">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-indigo-300/30 bg-indigo-400/10 px-3 py-1 text-xs font-medium text-indigo-200 mb-2">
                <Compass className="h-3.5 w-3.5" />
                Career Exploration & Radar
              </div>
              <h3 className="font-kodchasan text-2xl sm:text-3xl font-bold text-slate-50">
                ค้นหาทิศทางที่เหมาะกับตัวคุณ
              </h3>
              <p className="text-sm text-slate-300 mt-1">
                สำรวจสายอาชีพ อ่านวิเคราะห์ AI Impact และ Reality Check ฟรี
              </p>
            </div>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center gap-4 justify-between">
            <p className="text-xs text-slate-400 flex items-center gap-1.5">
              <Users className="h-4 w-4 text-indigo-400" />
              ปรึกษาพี่ๆ เมนทอร์ผู้มีประสบการณ์ในสายงานจริงฟรี
            </p>

            <a
              href={lineDeepLink}
              target="_blank"
              rel="noopener noreferrer"
              onClick={onBook}
              className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-[#06C755] hover:bg-[#05b34c] text-slate-950 font-semibold px-6 py-3.5 text-base font-bai-jamjuree transition-all shadow-lg shadow-[#06C755]/20 hover:shadow-[#06C755]/40 hover:-translate-y-0.5"
            >
              <MessageCircle className="h-5 w-5 fill-current" />
              <span>คุยกับพี่ๆ ช่วยค้นหาทิศทางฟรี บน LINE OA</span>
              <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        </div>
      )}
    </section>
  );
}
