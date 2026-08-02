import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { DawnScene } from "@/components/projectseed/dawn-scene";
import {
  CONTACT,
  DELIVERABLE_ONE,
  formatThb,
  IS_OPEN_FOR_SALE,
  PRICE_THB,
  SCHOLARSHIP_SEATS,
  TOTAL_SEATS,
} from "@/lib/projectseed/offer";

export const metadata: Metadata = {
  title: "ProjectSeed — ข้อมูลสำหรับผู้ปกครอง",
  description:
    "ProjectSeed คืออะไร ลูกต้องทำอะไร ราคาเท่าไหร่ คืนเงินได้ไหม และเรื่องความปลอดภัยของนักเรียน — สรุปหน้าเดียวสำหรับผู้ปกครอง",
};

/**
 * The page a student forwards to a parent.
 *
 * It exists because the ask that actually converts is not "buy this" — it is a
 * 16-year-old working up the nerve to raise it at dinner. That student needs
 * something a parent can read on a phone in two minutes without being sold to.
 * The main landing page is written to the student and is far too long to serve
 * that job.
 *
 * Two hard constraints on everything below, and neither is negotiable:
 *
 *  1. This page must never constitute an OFFER. PROJECTSEED-SAFEGUARDING.md §11
 *     forbids offering, selling, or accepting payment for a batch 1 seat until
 *     the launch gate closes, and a priced document sent to a parent is an
 *     offer regardless of the file format. While IS_OPEN_FOR_SALE is false this
 *     page states the price as information and explicitly says we are not
 *     selling yet.
 *  2. No duration, no dates, no referral figure. The programme length is under
 *     active revision, TCAS Round 1 windows are unverified per university, and
 *     the referral discount has no derived amount. Publishing an unchecked date
 *     to a parent whose child's admission depends on it is the one error on
 *     this page that could cost a family something real.
 */
export default function ParentsPage() {
  return (
    <div lang="th" className="dawn-theme relative min-h-screen overflow-hidden">
      <DawnScene />

      <main
        className="relative z-10 mx-auto flex w-full max-w-2xl flex-col gap-12 px-4 py-10 sm:px-6 sm:py-16"
        style={{ fontFamily: "var(--font-bai-jamjuree), sans-serif" }}
      >
        <Intro />
        <NotSellingYet />
        <WhatItIs />
        <WhatYourChildDoes />
        <Money />
        <Safety />
        <WhoWeAre />
        <TalkToUs />
      </main>
    </div>
  );
}

function Intro() {
  return (
    <header className="flex flex-col gap-6">
      <div className="flex items-center gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-300/30 bg-amber-400/10 px-3 py-1 text-xs font-semibold text-amber-200">
          <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
          ProjectSeed · สำหรับผู้ปกครอง
        </span>
      </div>

      <div className="flex flex-col gap-3">
        <h1 className="text-3xl font-bold leading-tight text-white sm:text-4xl">
          ลูกของคุณน่าจะส่งหน้านี้มาให้
        </h1>
        <p className="text-[15px] leading-relaxed text-slate-300 sm:text-base">
          หน้านี้ยาวประมาณสองนาที เขียนถึงผู้ปกครองโดยตรง ไม่ใช่หน้าขายของ
          เราพยายามตอบให้ครบว่านี่คืออะไร ลูกต้องทำอะไร เสียเงินเท่าไหร่
          และเรื่องความปลอดภัยเราจัดการยังไง
        </p>
      </div>

      {/* Visual Hero Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-slate-950/60 shadow-2xl backdrop-blur-md">
        <div className="relative aspect-[16/9] w-full overflow-hidden">
          <Image
            src="/images/projectseed/parents-hero.jpg"
            alt="ผู้ปกครองและนักเรียนร่วมกันดูโปรเจกต์ของลูก"
            fill
            sizes="(max-width: 768px) 100vw, 672px"
            className="object-cover transition-transform duration-700 hover:scale-105"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
        </div>
        <div className="absolute bottom-0 inset-x-0 p-4 sm:p-6 flex flex-wrap items-center justify-between gap-3 bg-slate-950/80 backdrop-blur-md border-t border-white/10">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-xs font-semibold text-slate-200">อ่านจบใน 2 นาที</span>
          </div>
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            <span className="text-xs font-semibold text-slate-200">นโยบายคุ้มครองเด็ก 100%</span>
          </div>
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-xs font-semibold text-slate-200">การันตีคืนเงินตามเงื่อนไข</span>
          </div>
        </div>
      </div>
    </header>
  );
}

/**
 * First substantive block on the page, deliberately. A parent's first question
 * about anything their child brings home is "is someone trying to take my
 * money." Answering "not yet, and here is why not" before the price appears is
 * both the honest sequence and by some distance the most persuasive thing on
 * this page.
 */
function NotSellingYet() {
  if (IS_OPEN_FOR_SALE) return null;

  return (
    <section className="relative overflow-hidden rounded-2xl border border-amber-400/30 bg-gradient-to-r from-amber-950/40 via-amber-900/20 to-slate-950/60 p-6 shadow-xl backdrop-blur-md">
      <div className="absolute top-0 right-0 -mr-6 -mt-6 h-24 w-24 rounded-full bg-amber-500/10 blur-2xl pointer-events-none" />
      <div className="flex gap-4 items-start">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-400/20 text-amber-300 border border-amber-400/40">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <div className="flex flex-col gap-2">
          <h3 className="text-base font-bold text-amber-200">
            ตอนนี้เรายังไม่เปิดรับสมัคร และยังไม่รับเงิน
          </h3>
          <p className="text-[15px] leading-relaxed text-slate-200">
            เราเขียนกติกาคุ้มครองเด็กไว้เองว่า ห้ามเสนอขายหรือรับเงินจนกว่างานด้านความปลอดภัยจะเสร็จครบทุกข้อ
            ตอนนี้ยังไม่ครบ เราเลยยังไม่ขาย
            <br />
            <span className="text-slate-300 mt-1 block">
              หน้านี้คือข้อมูล ไม่ใช่การเสนอขาย ถ้าเปิดรับเมื่อไหร่เราจะแจ้งอีกที
            </span>
          </p>
        </div>
      </div>
    </section>
  );
}

function WhatItIs() {
  return (
    <section className="flex flex-col gap-5">
      <div className="flex items-center gap-3">
        <h2 className="dawn-eyebrow whitespace-nowrap">นี่คืออะไร</h2>
        <span aria-hidden className="h-px flex-1 bg-white/[0.08]" />
      </div>

      <p className="text-[15px] leading-relaxed text-slate-200 text-lg">
        โปรแกรมที่ช่วยให้นักเรียนทำโปรเจกต์ของตัวเองจนเสร็จ
        เพื่อใช้ยื่นพอร์ตโฟลิโอใน TCAS รอบ 1
      </p>

      {/* Visual Cards Grid: What we DON'T do vs What we GUARANTEE */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="ei-card border-rose-500/20 bg-rose-950/10 p-5 rounded-2xl">
          <div className="flex items-center gap-2 mb-3">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-500/20 text-rose-300 text-sm font-bold">✕</span>
            <h3 className="text-base font-semibold text-rose-200">สิ่งที่เราไม่ทำ</h3>
          </div>
          <p className="text-[14px] leading-relaxed text-slate-300">
            เราไม่ทำโปรเจกต์ให้ ไม่ขายโปรเจกต์สำเร็จรูป และไม่รับประกันว่าลูกจะสอบติด
            คณะกรรมการคัดเลือกไม่ได้อยู่ในมือเรา ใครบอกว่ารับประกันที่นั่งได้ คนนั้นไม่ได้พูดความจริง
          </p>
        </div>

        <div className="ei-card border-emerald-500/20 bg-emerald-950/10 p-5 rounded-2xl">
          <div className="flex items-center gap-2 mb-3">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-300 text-sm font-bold">✓</span>
            <h3 className="text-base font-semibold text-emerald-200">สิ่งที่เรารับประกัน</h3>
          </div>
          <p className="text-[14px] leading-relaxed text-slate-300">
            ถ้าลูกลงมือทำ ลูกจะได้โปรเจกต์ที่ทำเสร็จจริง มีคนใช้จริง
            และตอบคำถามกรรมการได้ว่าทำมายังไง เพราะเขาทำเอง
          </p>
        </div>
      </div>
    </section>
  );
}

function WhatYourChildDoes() {
  const steps = [
    { num: "01", title: "เลือกปัญหาที่อยากแก้", body: "ไม่ต้องเป็นเรื่องใหญ่ เรื่องที่รำคาญอยู่ทุกวันใช้ได้ดีที่สุด" },
    { num: "02", title: "สัมภาษณ์คนเจอปัญหาจริง", body: "ไปคุยกับคนที่เจอปัญหานั้นจริง ๆ แล้วจดว่าเขาพูดว่าอะไร" },
    { num: "03", title: "ลงมือสร้าง & ปล่อยผู้ใช้", body: "ลงมือสร้าง ปล่อยให้คนใช้ แล้วแก้ตามที่เจอ" },
    { num: "04", title: "รายงานความคืบหน้า", body: "โพสต์ความคืบหน้าให้พี่เลี้ยงเห็นทุกสัปดาห์" },
    { num: "05", title: "เตรียมยื่นพอร์ต & ซ้อมสัมภาษณ์", body: "เขียนสรุปให้กรรมการอ่านรู้เรื่อง และซ้อมตอบคำถาม" },
  ];

  return (
    <section className="flex flex-col gap-5">
      <div className="flex items-center gap-3">
        <h2 className="dawn-eyebrow whitespace-nowrap">ลูกต้องทำอะไรบ้าง</h2>
        <span aria-hidden className="h-px flex-1 bg-white/[0.08]" />
      </div>

      <div className="ei-card ei-card--static p-6 rounded-2xl">
        <div className="flex flex-col gap-4">
          {steps.map((step, idx) => (
            <div key={step.num} className="flex gap-4 items-start">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-blue-500/20 font-mono text-xs font-bold text-blue-300 border border-blue-400/30">
                {step.num}
              </span>
              <div className="flex flex-col gap-0.5 pt-0.5">
                <h3 className="text-[15px] font-semibold text-white">{step.title}</h3>
                <p className="text-[14px] leading-relaxed text-slate-300">{step.body}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-amber-200/20 bg-slate-950/40 p-4 flex gap-3 items-center">
        <svg className="w-5 h-5 text-amber-300 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p className="text-[14px] leading-relaxed text-slate-300">
          ถ้าลูกไม่ลงมือ จะไม่มีอะไรเกิดขึ้นเลย และเราจะบอกตรง ๆ
          ไม่ใช่ทำแทนให้เพื่อให้ส่งทัน — จุดนี้คือความต่างทั้งหมดระหว่างเรากับที่รับทำพอร์ต
        </p>
      </div>
    </section>
  );
}

function Money() {
  return (
    <section className="flex flex-col gap-5">
      <div className="flex items-center gap-3">
        <h2 className="dawn-eyebrow whitespace-nowrap">เรื่องเงิน</h2>
        <span aria-hidden className="h-px flex-1 bg-white/[0.08]" />
      </div>

      <div className="ei-card ei-card--static overflow-hidden p-0 rounded-2xl border border-white/10">
        <div className="relative aspect-[21/9] w-full overflow-hidden bg-slate-950">
          <Image
            src="/images/projectseed/money-guarantee.jpg"
            alt="การันตีคืนเงิน 100% และราคาโปร่งใส"
            fill
            sizes="(max-width: 768px) 100vw, 672px"
            className="object-cover opacity-90"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
          <div className="absolute bottom-4 left-6 flex items-baseline gap-2">
            <span className="text-4xl font-extrabold text-white drop-shadow-md sm:text-5xl">
              {formatThb(PRICE_THB)}
            </span>
            <span className="text-sm font-medium text-slate-300">จ่ายครั้งเดียว ไม่มีค่าใช้จ่ายซ่อน</span>
          </div>
        </div>

        <div className="p-6">
          <ul className="dawn-list flex flex-col gap-3.5 text-[15px] leading-relaxed text-slate-300">
            <li className="bg-emerald-950/20 p-3 rounded-xl border border-emerald-500/20">
              <span className="font-semibold text-emerald-200">คืนเงิน 100% ไม่ถามอะไรเลย</span> — ตราบใดที่ลูกยังไม่ส่งงานชิ้นแรก
              งานชิ้นแรกคือ {DELIVERABLE_ONE.parts[0]} และ{DELIVERABLE_ONE.parts[1]}{" "}
              ส่งภายในวันที่ {DELIVERABLE_ONE.dueDayOfProgramme} หลังจากนั้นไม่คืน
            </li>
            <li>
              เราวางเส้นคืนเงินไว้ตรงนั้นเพราะ{" "}
              <span className="text-white font-medium">ถ้าลูกไม่อยากทำจริง ๆ จะรู้ตั้งแต่สัปดาห์แรก</span>{" "}
              ไม่ใช่เดือนที่สาม ผู้ปกครองไม่ควรต้องเสี่ยงกับเรื่องที่รู้ผลเร็วขนาดนี้
            </li>
            <li className="flex items-center gap-2">
              <span className="inline-flex rounded-md bg-amber-400/20 px-2 py-0.5 text-xs font-semibold text-amber-200 border border-amber-400/30">
                ทุนเรียนฟรี
              </span>
              <span>
                <span className="text-white font-medium">ทุน {SCHOLARSHIP_SEATS} ที่นั่ง</span> ทุกรุ่น
                สำหรับครอบครัวที่จ่ายไม่ไหว ทักมาคุยได้ ไม่ต้องเกรงใจ
              </span>
            </li>
            <li>
              <span className="text-white font-medium">รับรุ่นละ {TOTAL_SEATS} คน</span> เพราะเท่านี้คือจำนวนที่ดูแลไหวจริง
            </li>
            <li>
              <span className="text-white font-medium">ราคานี้เป็นราคารุ่นแรก</span> เราไม่สัญญาว่ารุ่นต่อไปจะเท่านี้
              เพราะยังไม่รู้ว่าดูแลนักเรียนหนึ่งคนใช้เวลาเท่าไหร่จริง
            </li>
          </ul>
        </div>
      </div>
    </section>
  );
}

function Safety() {
  return (
    <section className="flex flex-col gap-5">
      <div className="flex items-center gap-3">
        <h2 className="dawn-eyebrow whitespace-nowrap">ความปลอดภัยของลูก</h2>
        <span aria-hidden className="h-px flex-1 bg-white/[0.08]" />
      </div>

      <div className="ei-card ei-card--static overflow-hidden p-0 rounded-2xl border border-white/10">
        <div className="grid grid-cols-1 md:grid-cols-12 items-center bg-slate-950/60">
          <div className="relative aspect-video md:aspect-square md:col-span-5 w-full overflow-hidden">
            <Image
              src="/images/projectseed/safeguarding-badge.jpg"
              alt="ตราสัญลักษณ์ความปลอดภัยและ safeguarding"
              fill
              sizes="(max-width: 768px) 100vw, 280px"
              className="object-cover"
            />
          </div>

          <div className="p-6 md:col-span-7 flex flex-col gap-3">
            <p className="text-[15px] leading-relaxed text-slate-200">
              พี่เลี้ยงของเราเป็นรุ่นพี่วัยมหาวิทยาลัย และนักเรียนส่วนใหญ่ยังไม่บรรลุนิติภาวะ
              เราจึงมีนโยบายคุ้มครองเด็กเป็นลายลักษณ์อักษร เปิดให้อ่านได้ทั้งฉบับ
            </p>

            <ul className="dawn-list flex flex-col gap-2.5 text-[14px] leading-relaxed text-slate-300">
              <li>
                <span className="text-white font-semibold">พี่เลี้ยงห้ามแชทส่วนตัวกับนักเรียนอายุต่ำกว่า 18 ปี</span>{" "}
                ทุกการคุยอยู่ในกลุ่มที่มีผู้ใหญ่คนที่สองอยู่ด้วย
              </li>
              <li>ผู้ปกครองขอดูห้องที่ลูกอยู่ได้ทุกเมื่อ ไม่ต้องแจ้งล่วงหน้า</li>
              <li>พี่เลี้ยงทุกคนต้องผ่านการตรวจสอบประวัติและอบรมก่อนได้รับมอบหมายนักเรียน</li>
              <li>มีช่องทางแจ้งเหตุโดยตรง แยกจากบัญชีทั่วไปของผู้ก่อตั้ง</li>
            </ul>
          </div>
        </div>

        <div className="p-5 border-t border-white/10 bg-slate-950/80">
          <p className="mb-3 text-[14px] leading-relaxed text-slate-400">
            เรื่องที่ต้องบอกตรง ๆ — กติกาห้ามแชทส่วนตัวเป็นกติกาที่เรา
            <span className="text-slate-200 font-medium"> บังคับทางเทคนิคไม่ได้</span> Discord เปิดให้ทักส่วนตัวได้
            เราจึงใช้วิธีตรวจสอบและลงโทษแทน และเราจะสอนทั้งนักเรียนและพี่เลี้ยงให้ปิดการรับข้อความส่วนตัวตั้งแต่วันแรก
          </p>

          <Link
            href="/projectseed/safeguarding"
            className="inline-flex items-center gap-1.5 text-[15px] font-semibold text-blue-300 underline underline-offset-4 hover:text-blue-200"
          >
            อ่านนโยบายคุ้มครองเด็กฉบับเต็ม →
          </Link>
        </div>
      </div>
    </section>
  );
}

function WhoWeAre() {
  return (
    <section className="flex flex-col gap-5">
      <div className="flex items-center gap-3">
        <h2 className="dawn-eyebrow whitespace-nowrap">เราเป็นใคร</h2>
        <span aria-hidden className="h-px flex-1 bg-white/[0.08]" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="ei-card p-4 text-center rounded-2xl flex flex-col items-center justify-center">
          <span className="text-3xl font-extrabold text-white">1,300+</span>
          <span className="text-xs text-slate-400">นักเรียนที่เคยผ่านโปรแกรม</span>
        </div>
        <div className="ei-card p-4 text-center rounded-2xl flex flex-col items-center justify-center">
          <span className="text-3xl font-extrabold text-amber-300">18 เดือน</span>
          <span className="text-xs text-slate-400">ประสบการณ์ทำงานกับเด็กมัธยม</span>
        </div>
      </div>

      <div className="ei-card ei-card--static p-6 rounded-2xl flex flex-col gap-3">
        <p className="text-[15px] leading-relaxed text-slate-300">
          PassionSeed ทำงานกับนักเรียนมัธยมมาประมาณ 18 เดือน ผ่านค่ายและโปรแกรมหลายรูปแบบ
          นักเรียนรวมราว 1,300 คน มีศิษย์เก่าหลายคนกลับมาช่วยสอนเองโดยที่เราไม่ได้จ้าง
        </p>

        <p className="text-[15px] leading-relaxed text-slate-300">
          <span className="text-white font-semibold">สิ่งที่เรายังไม่มี</span> — เราไม่เคยเก็บข้อมูลผลลัพธ์อย่างเป็นระบบ
          เราจึงไม่มีสถิติมาโชว์ว่าเด็กที่ผ่านเราไปติดที่ไหนบ้าง นั่นคือความผิดพลาดของเราเอง
          และ ProjectSeed รุ่นนี้เป็นรุ่นแรกที่เราจะเริ่มเก็บ
        </p>

        <p className="text-[15px] leading-relaxed text-amber-200/90 font-medium">
          แปลว่า <span className="text-white underline underline-offset-4">รุ่นนี้คือรุ่นแรก ยังไม่มีใครจบจากรุ่นนี้</span>{" "}
          ถ้าคุณกำลังมองหาโปรแกรมที่พิสูจน์ตัวเองมาแล้ว รุ่นนี้ยังไม่ใช่ และเราคิดว่าคุณควรรู้ก่อนตัดสินใจ
        </p>
      </div>
    </section>
  );
}

function TalkToUs() {
  return (
    <section className="flex flex-col gap-5 pt-4">
      <hr className="dawn-rule" />

      <div className="flex flex-col gap-2">
        <h2 className="text-2xl font-bold text-white">อยากคุยกับเราโดยตรง</h2>
        <p className="text-[15px] leading-relaxed text-slate-300">
          คุยกับผู้ปกครองเราถือเป็นเรื่องปกติ ไม่ใช่ขั้นตอนพิเศษ
          ถามอะไรก็ได้ รวมถึงคำถามที่ตอบแล้วเราเสียลูกค้า
        </p>
      </div>

      <div className="ei-card border-blue-500/20 bg-blue-950/20 p-6 rounded-2xl flex flex-col gap-4">
        <a
          href={CONTACT.bookingUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="ei-button-dawn min-h-[52px] w-full text-center text-base sm:w-fit font-bold shadow-lg shadow-blue-600/30"
        >
          จองเวลาคุย 20 นาที (ไม่มีค่าใช้จ่าย)
        </a>

        <div className="flex flex-col gap-2 pt-2 border-t border-white/10">
          <p className="text-[15px] leading-relaxed text-slate-400">
            หรือทักทาง LINE ก็ได้ —{" "}
            <Link
              href="/projectseed"
              className="text-blue-300 underline underline-offset-4 hover:text-blue-200 font-medium"
            >
              ดูรายละเอียดฉบับเต็มที่เขียนถึงนักเรียน →
            </Link>
          </p>
        </div>
      </div>
    </section>
  );
}

