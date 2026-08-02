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
  PROGRAMME_WEEKS,
  SCHOLARSHIP_SEATS,
  SHIPPED_BAR,
  TOTAL_SEATS,
  WEEKLY_PRICE_THB,
} from "@/lib/projectseed/offer";

export const metadata: Metadata = {
  title: "ProjectSeed — ทำโปรเจกต์จริง ก่อนยื่นพอร์ต TCAS รอบ 1",
  description:
    "ค่ายที่ไม่ได้ขายใบเกียรติบัตร — 16 สัปดาห์ของพี่เลี้ยงและโครงสร้างที่ไม่ปล่อยให้น้องเลิกกลางทาง ปลายทางคือโปรเจกต์ที่ทำเอง มีคนใช้จริง 2,990฿ รับ 20 ที่นั่ง",
};

export default function ProjectSeedPage() {
  return (
    // lang="th" is set here rather than inherited: the root layout declares
    // lang="en" for the app as a whole, and every word on this page is Thai.
    // Without it a screen reader reads Thai with an English voice.
    <div lang="th" className="dawn-theme relative min-h-screen overflow-hidden">
      <DawnScene />

      <main
        className="relative z-10 mx-auto flex w-full max-w-2xl flex-col gap-14 px-4 pb-32 pt-12 sm:px-6 sm:py-16 md:pb-16"
        // Tailwind's `sans` stack puts a Latin face first, which has no Thai
        // glyphs and drops this page onto a fallback. Thai copy is pinned to
        // Bai Jamjuree per the design system.
        style={{ fontFamily: "var(--font-bai-jamjuree), sans-serif" }}
      >
        <Hero />
        <FactStrip />
        <TheWindow />
        <YourProject />
        <WhyPay />
        <HowItRuns />
        <WhatYouGet />
        <WhoItIsFor />
        <ForParents />
        <PriceCard />
        <StraightTalk />
        <Safety />
        <CallToAction />
      </main>

      <StickyCallToAction />
    </div>
  );
}

/**
 * Gold (`#fed95c`) carries one job on this page: the single most important
 * statement. That is the guarantee, and it appears exactly once, in the hero
 * keynote. Nothing else on the page may claim it.
 */
function Hero() {
  return (
    <header className="flex flex-col gap-6">
      <div className="flex items-center gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-300/30 bg-amber-400/10 px-3.5 py-1 text-xs font-semibold text-amber-200">
          <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
          ProjectSeed · รุ่นที่ 1
        </span>
      </div>

      <div className="flex flex-col gap-3">
        <h1 className="text-3xl font-bold leading-tight text-white sm:text-5xl sm:leading-[1.15]">
          ทำโปรเจกต์จริง
          <br />
          <span className="bg-gradient-to-r from-blue-300 via-indigo-200 to-amber-200 bg-clip-text text-transparent">
            ก่อนยื่นพอร์ต TCAS รอบ 1
          </span>
        </h1>

        <p className="text-lg leading-relaxed text-slate-300">
          เราไม่ได้ขายใบเกียรติบัตร สิ่งที่น้องได้คือ {PROGRAMME_WEEKS} สัปดาห์ของคนที่จะไม่ปล่อยให้น้องเลิกกลางทาง — พี่เลี้ยงที่อ่านความคืบหน้าทุกสัปดาห์ โครงสร้างที่ย้อนกลับจากวันยื่นพอร์ต และเกณฑ์ที่ชัดว่าอะไรถึงเรียกว่าเสร็จ ปลายทางคือโปรเจกต์ที่น้องทำเอง มีคนใช้จริง และเล่าได้ทุกขั้นว่าทำมายังไง
        </p>
      </div>

      {/* Hero Visual Artwork */}
      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-slate-950/60 shadow-2xl backdrop-blur-md">
        <div className="relative aspect-[16/9] w-full overflow-hidden">
          <Image
            src="/images/projectseed/hero.jpg"
            alt="นักเรียนมัธยมลงมือสร้างโปรเจกต์จริงพร้อม visual dashboard"
            fill
            sizes="(max-width: 768px) 100vw, 672px"
            className="object-cover transition-transform duration-700 hover:scale-105"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-transparent" />
        </div>
        <div className="absolute bottom-0 inset-x-0 p-4 sm:p-5 flex flex-wrap items-center justify-between gap-3 bg-slate-950/80 backdrop-blur-md border-t border-white/10">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-300">
            <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            โปรเจกต์มีผู้ใช้จริง
          </span>
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-300">
            <svg className="w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            ศิษย์เก่าเป็นพี่เลี้ยง
          </span>
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-300">
            <svg className="w-4 h-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            การันตีผลงานเสร็จ
          </span>
        </div>
      </div>

      {/* The single warm accent on this page. The guarantee and the refusal to
          over-promise are the same sentence, and that pairing is the offer. */}
      <div className="dawn-keynote">
        <p className="text-[15px] leading-relaxed text-slate-200">
          <span className="font-semibold text-amber-200">
            เรารับประกันว่าโปรเจกต์จะเสร็จ — ไม่รับประกันว่าจะติด
          </span>
          <br />
          คณะกรรมการคัดเลือกไม่ได้อยู่ในมือเรา ใครบอกว่ารับประกันที่นั่งให้ได้ คนนั้นโกหก
          <br />
          แต่โปรเจกต์ที่นักเรียนทำเอง เป็นเรื่องจริงไม่ว่าใครจะอ่านหรือไม่อ่าน
        </p>
      </div>
    </header>
  );
}

/**
 * Facts, not cards. Three numbers a parent scans in two seconds before they
 * decide whether to read the rest — a hairline-divided strip rather than three
 * more bordered boxes on a page that already has plenty.
 */
function FactStrip() {
  const facts = [
    { value: formatThb(PRICE_THB), label: "จ่ายครั้งเดียว" },
    { value: `${TOTAL_SEATS} คน`, label: `รวมทุน ${SCHOLARSHIP_SEATS} ที่` },
    { value: `${PROGRAMME_WEEKS} สัปดาห์`, label: "จบก่อนวันยื่น" },
  ];

  return (
    <section aria-label="สรุปตัวเลข" className="flex flex-col gap-3">
      <div className="grid grid-cols-3 rounded-2xl bg-slate-950/60 ring-1 ring-white/10 backdrop-blur-md sm:divide-x sm:divide-white/10 shadow-xl">
        {facts.map((fact) => (
          <div key={fact.label} className="flex flex-col gap-1 px-3 py-4 text-center">
            <span className="text-xl font-bold text-white sm:text-2xl">{fact.value}</span>
            <span className="text-[11px] leading-snug text-slate-400 sm:text-xs">
              {fact.label}
            </span>
          </div>
        ))}
      </div>
      <p className="text-center text-[13px] leading-snug text-slate-400">
        เท่ากับสัปดาห์ละ ≈{formatThb(WEEKLY_PRICE_THB)} — ถูกกว่าค่าติวหนึ่งชั่วโมง
        สำหรับคนที่ดูแลน้องตลอด {PROGRAMME_WEEKS} สัปดาห์
      </p>
    </section>
  );
}

/** Eyebrow plus a hairline that fills the remaining width. Breaks up a long
 *  column of identically-framed sections without inventing a new surface. */
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <h2 className="dawn-eyebrow whitespace-nowrap">{children}</h2>
      <span aria-hidden className="h-px flex-1 bg-white/[0.08]" />
    </div>
  );
}

function TheWindow() {
  return (
    <section className="flex flex-col gap-4">
      <SectionLabel>ทำไมต้องรอบพอร์ต</SectionLabel>
      <p className="text-[15px] leading-relaxed text-slate-300">
        ตลอดการศึกษาไทย มีอยู่ช่องเดียวที่ระบบยอมให้นักเรียนส่ง
        <span className="text-white font-semibold"> สิ่งที่ตัวเองสร้าง</span> แทนคะแนนสอบ — คือพอร์ตใน TCAS รอบ 1
      </p>
      <p className="text-[15px] leading-relaxed text-slate-300">
        แต่ช่องนั้นกำลังถูกถมด้วยโปรเจกต์ที่ซื้อมา จ้างทำ หรือปั้นให้ดูดีในสามวัน
        ครอบครัวที่จ่ายไหวก็ได้พอร์ตที่ดูดีกว่า ทั้งที่เด็กไม่ได้ทำอะไรเลย
      </p>
      <p className="text-[15px] leading-relaxed text-slate-300">
        <span className="text-white font-semibold">เราอยู่ตรงช่องนั้น และไม่ยอมให้มันเป็นแบบนั้น</span>{" "}
        นักเรียนลงมือทำเอง เราคอยถามคำถามที่ยาก และไม่ทำงานแทน
      </p>
    </section>
  );
}

function WhyPay() {
  return (
    <section className="flex flex-col gap-4">
      <SectionLabel>แล้วทำไมต้องจ่าย</SectionLabel>
      <p className="text-[15px] leading-relaxed text-slate-300">
        คอมมูนิตี้สายสร้างมีให้เข้าฟรีทุกวันนี้ — Discord สาย dev กลุ่มนักเรียนทำโปรเจกต์ เยอะจนเลือกไม่ถูก
        และเราจะไม่บอกว่าของฟรีไม่ดี มันดีมาก ถ้าน้องเป็นคนที่ทำต่อได้เอง
      </p>
      <p className="text-[15px] leading-relaxed text-slate-300">
        แต่ของฟรีไม่มีใครรับผิดชอบว่าน้องจะทำเสร็จ ไม่มีใครอ่านความคืบหน้าของน้องทุกสัปดาห์
        ไม่มีใครทักมาถามตอนที่น้องหายไปสามอาทิตย์
        คนส่วนใหญ่เลิกกลางทางไม่ใช่เพราะทำไม่ได้ แต่เพราะไม่มีใครรอดูว่าจะทำหรือเปล่า
      </p>

      <div className="grid grid-cols-1 gap-3">
        <div className="ei-card ei-card--static p-5 rounded-2xl">
          <h3 className="mb-3 text-base font-semibold text-slate-400">
            คอมมูนิตี้ฟรี — ใช้ได้ผล ถ้าน้องทำต่อได้เอง
          </h3>
          <ul className="dawn-list flex flex-col gap-2 text-[15px] leading-relaxed text-slate-300">
            <li>เข้าได้ทันที ไม่ต้องจ่าย ไม่ต้องรอ</li>
            <li>มีคนสายเดียวกันให้คุยเยอะมาก ตอบกันไว</li>
            <li>ไม่มีใครตามว่าโปรเจกต์ถึงไหนแล้ว</li>
            <li>ไม่มีเส้นตาย จะหยุดเมื่อไหร่ก็ได้ ไม่มีใครว่า</li>
            <li>ถ้าน้องมีวินัยในตัวเองอยู่แล้ว เราแนะนำให้ใช้ของฟรีเลย ไม่ต้องจ่ายเรา</li>
          </ul>
        </div>
        <div className="ei-card ei-card--static p-5 rounded-2xl ring-1 ring-white/15">
          <h3 className="mb-1 text-base font-semibold text-white">
            ProjectSeed — ระบบที่ไม่ปล่อยให้น้องเลิก
          </h3>
          <p className="mb-3 text-[13px] text-slate-400">นี่คือสิ่งที่ {formatThb(PRICE_THB)} ซื้อ</p>
          <ul className="dawn-list flex flex-col gap-2 text-[15px] leading-relaxed text-slate-300">
            <li>
              <span className="text-white font-semibold">พี่เลี้ยงที่อ่านจริง</span> — อ่านโพสต์ความคืบหน้าของน้องทุกสัปดาห์
              ไม่ใช่แค่เลื่อนผ่าน และทักมาถามตอนที่น้องหายไป
            </li>
            <li>
              <span className="text-white font-semibold">โครงสร้างที่ย้อนกลับจากเส้นตาย</span> — ตาราง {PROGRAMME_WEEKS} สัปดาห์
              นับถอยหลังจากวันยื่นพอร์ตของน้องเอง ทุกสัปดาห์มีของที่ต้องส่ง
            </li>
            <li>
              <span className="text-white font-semibold">เกณฑ์ที่ชัดว่าอะไรคือ “เสร็จ”</span> — ไม่ใช่ทำไปเรื่อย ๆ
              แล้วหวังว่าจะดูดี
            </li>
            <li>
              <span className="text-white font-semibold">การันตีว่าโปรเจกต์จะเสร็จ</span> — คนที่หายไปจะถูกตาม
              ไม่ใช่ปล่อยให้จางหาย
            </li>
            <li>
              <span className="text-white font-semibold">จ่ายครั้งเดียว ไม่มีตัวเสริม</span> — ไม่มีใครได้พี่เลี้ยงดีกว่าคนอื่นเพราะจ่ายมากกว่า
            </li>
          </ul>
        </div>
      </div>

      <p className="text-[15px] leading-relaxed text-slate-300">
        <span className="text-white font-semibold">{formatThb(PRICE_THB)}</span> เท่ากับสัปดาห์ละประมาณ{" "}
        <span className="text-white font-semibold">{formatThb(WEEKLY_PRICE_THB)}</span> — ถูกกว่าค่าติวหนึ่งชั่วโมง
        แต่ได้คนดูแลสี่เดือนเต็ม
      </p>
      <p className="text-[15px] leading-relaxed text-slate-300">
        ถ้าน้องทำต่อได้เองโดยไม่ต้องมีใครตาม คอมมูนิตี้ฟรีคือคำตอบที่ถูก และเราอยากให้น้องใช้มัน
        แต่ถ้าสิ่งที่ขาดไม่ใช่ความรู้ ไม่ใช่ไอเดีย แต่คือคนที่จะไม่ยอมให้น้องเลิก — นั่นคือสิ่งที่เงินก้อนนี้ซื้อ
      </p>
    </section>
  );
}

/**
 * The bar, stated to the student before they talk themselves out of the idea
 * they already have. Small self-chosen projects are the ones that get finished;
 * a project the student is defending beats a project we approved. This section
 * exists because the opposite instinct — waiting for an idea grand enough to
 * count — is the single most common reason a student never starts.
 */
function YourProject() {
  return (
    <section className="flex flex-col gap-4">
      <SectionLabel>โปรเจกต์แบบไหนถึงนับ</SectionLabel>

      <p className="text-[15px] leading-relaxed text-slate-300">
        ไม่ต้องเป็นเรื่องช่วยโลก ไม่ต้องเป็นงานวิจัย และ
        <span className="text-white font-semibold"> ไม่ต้องรอจนกว่าจะเจอ “แพสชันที่ใช่”</span>{" "}
        เรื่องที่น้องรำคาญเองอยู่ทุกวันนั่นแหละ ใช้ได้ดีที่สุด
      </p>

      <div className="ei-card ei-card--static p-5 rounded-2xl">
        <p className="mb-3 text-[15px] leading-relaxed text-slate-300">
          <span className="text-amber-200 font-semibold">ตัวอย่างที่นับเต็ม ๆ</span> — เว็บจัดชั้นหนังสือที่ตัวเองอ่าน, ระบบรับโดเนทสำหรับคนสตรีม,
          บอทช่วยงานห้อง, เกมที่ทำค้างไว้, แอปแก้เรื่องที่โรงเรียนทำหาย
        </p>
        <p className="text-[14px] leading-relaxed text-slate-400">
          เหตุผลง่าย ๆ — โปรเจกต์ที่แก้ปัญหาตัวเอง คือโปรเจกต์ที่ทำจนเสร็จ
          ส่วนโปรเจกต์ที่คิดขึ้นมาเพื่อให้ดูดีในพอร์ต มักจะค้างอยู่ตรงกลาง
        </p>
      </div>

      <div className="ei-card ei-card--static p-5 rounded-2xl">
        <h3 className="mb-3 text-base font-semibold text-white">เราวัดที่สามข้อนี้</h3>
        <ul className="dawn-list flex flex-col gap-2 text-[15px] leading-relaxed text-slate-300">
          {SHIPPED_BAR.map((rule) => (
            <li key={rule}>{rule}</li>
          ))}
        </ul>
        <p className="mt-3 text-[14px] leading-relaxed text-slate-400">
          ไม่มีข้อไหนวัดว่า “แพสชันพอหรือยัง” เพราะเราวัดไม่ได้ และไม่ควรมีใครมาตัดสินแทนน้อง
        </p>
      </div>
    </section>
  );
}

/**
 * The calendar, at the only resolution we can honestly publish. Exact TCAS
 * Round 1 dates vary by university and have not been verified per institution;
 * printing an unchecked date to a parent whose child's admission depends on it
 * is the one error on this page that could actually cost someone something.
 */
function HowItRuns() {
  const steps = [
    {
      marker: "สัปดาห์ 1",
      title: "งานชิ้นแรก",
      body: `${DELIVERABLE_ONE.parts[0]} และ${DELIVERABLE_ONE.parts[1]} — ส่งภายในวันที่ ${DELIVERABLE_ONE.dueDayOfProgramme} จุดนี้คือเส้นคืนเงินด้วย`,
    },
    {
      marker: "สัปดาห์ 2–5",
      title: "เลือกปัญหาให้แคบลง",
      body: "คุยกับผู้ใช้เพิ่ม ตัดสิ่งที่ไม่จำเป็นออก จนเหลือสิ่งเดียวที่ทำเสร็จได้จริงในเวลาที่มี",
    },
    {
      marker: "สัปดาห์ 6–13",
      title: "ลงมือสร้าง",
      body: "ทำ ปล่อยให้คนใช้ แก้ ทำซ้ำ โพสต์ความคืบหน้าในฟอรัมทุกสัปดาห์ พี่เลี้ยงเห็นและช่วยตรงจุดที่ติด",
    },
    {
      marker: "สัปดาห์ 14–16",
      title: "เขียนให้กรรมการอ่านรู้เรื่อง",
      body: "เรียบเรียงว่าทำอะไร ทำไม เจออะไรระหว่างทาง ซ้อมตอบคำถามที่กรรมการน่าจะถาม",
    },
  ];

  return (
    <section className="flex flex-col gap-5">
      <SectionLabel>{PROGRAMME_WEEKS} สัปดาห์ เดินยังไง</SectionLabel>

      <p className="text-[15px] leading-relaxed text-slate-400">
        ตารางนับถอยหลังจากวันยื่นพอร์ตของน้องเอง ไม่ใช่คอร์สที่เรียนไปเรื่อย ๆ
        วันยื่นแต่ละมหาลัยไม่เท่ากัน เราจะเช็กของน้องตอนคุยกันก่อนเริ่ม
      </p>

      {/* Timeline Visual Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-slate-950 shadow-xl">
        <div className="relative aspect-[16/9] w-full overflow-hidden">
          <Image
            src="/images/projectseed/timeline-flow.jpg"
            alt="แผนผังเส้นทาง 16 สัปดาห์ของ ProjectSeed"
            fill
            sizes="(max-width: 768px) 100vw, 672px"
            className="object-cover opacity-90"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />
        </div>
      </div>

      <ol className="ei-card ei-card--static divide-y divide-white/[0.08] p-0 rounded-2xl">
        {steps.map((step) => (
          <li key={step.marker} className="flex flex-col gap-1 px-5 py-4">
            <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-blue-300 font-semibold">
              {step.marker}
            </span>
            <h3 className="text-base font-semibold text-white">{step.title}</h3>
            <p className="text-[15px] leading-relaxed text-slate-300">{step.body}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}

function WhatYouGet() {
  const items = [
    {
      title: "พี่เลี้ยงที่เพิ่งผ่าน TCAS มาเอง",
      body: "ศิษย์เก่าที่กลับมาสอน ไม่ใช่เพราะเราจ้าง แต่เพราะเขาอยากกลับมา เขาอ่านโพสต์ความคืบหน้าของน้องทุกสัปดาห์ ทักมาถามตอนที่น้องเงียบ และเขาเพิ่งเจอสิ่งที่น้องกำลังกลัวอยู่",
    },
    {
      title: `ตาราง ${PROGRAMME_WEEKS} สัปดาห์ ย้อนกลับจากวันยื่นพอร์ต`,
      body: "ไม่ใช่คอร์สที่เรียนไปเรื่อย ๆ คลาสกลุ่ม หลักสูตร และของที่ต้องส่งทุกสัปดาห์ ถูกวางให้จบพอดีก่อนวันยื่น — โครงสร้างคือสิ่งที่ทำให้คนทำเสร็จ ไม่ใช่แรงใจล้วน ๆ",
    },
    {
      title: "โปรเจกต์ที่มีคนใช้จริง",
      body: "ไม่ใช่แบบสอบถาม ไม่ใช่โปสเตอร์รณรงค์ — ต้องมีคนจริงที่นักเรียนไปคุยด้วยได้ และต้องมีบันทึกว่าเขาว่ายังไง",
    },
    {
      title: "คอมมูนิตี้ที่การลงมือทำเป็นเรื่องปกติ",
      body: "ห้องที่มีคนกำลังสร้างอะไรอยู่ทุกวัน โพสต์ความคืบหน้าในฟอรัม ถามได้ ตอบกัน คอมมูนิตี้คือเสาหลักหนึ่งของระบบ ไม่ใช่สิ่งเดียวที่น้องได้ — ของที่ต่างจากกลุ่มฟรีคือมีคนรับผิดชอบว่าน้องจะได้ใช้มันจริง",
    },
    {
      title: "Radar และ Passion Map",
      body: "เครื่องมือสำรวจเส้นทางอาชีพ ใช้ตอนยังไม่รู้ว่าอยากทำอะไร",
    },
  ];

  return (
    <section className="flex flex-col gap-4">
      <SectionLabel>ได้อะไรบ้าง</SectionLabel>
      <div className="flex flex-col gap-3">
        {items.map((item) => (
          <div key={item.title} className="ei-card ei-card--static p-5 rounded-2xl">
            <h3 className="mb-1.5 text-base font-semibold text-white">{item.title}</h3>
            <p className="text-[15px] leading-relaxed text-slate-300">{item.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function WhoItIsFor() {
  return (
    <section className="flex flex-col gap-4">
      <SectionLabel>เหมาะกับใคร</SectionLabel>

      <div className="ei-card ei-card--static p-5 rounded-2xl border border-emerald-500/20">
        <h3 className="mb-3 text-base font-semibold text-emerald-200 flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-300 text-xs">✓</span>
          ใช่
        </h3>
        <ul className="dawn-list flex flex-col gap-2 text-[15px] leading-relaxed text-slate-300">
          <li>
            <span className="text-white font-semibold">ม.6</span> ที่ต้องยื่นพอร์ตรอบ 1
            และอยากได้โปรเจกต์ที่ตอบคำถามกรรมการได้จริง
          </li>
          <li>
            <span className="text-white font-semibold">ม.4 – ม.5</span> ที่อยากเริ่มก่อน
            มีเวลาทำให้ลึกกว่าเดิม
          </li>
          <li>คนที่ยอมลงมือทำเอง แม้ตอนแรกจะยังไม่รู้ว่าจะทำอะไร</li>
        </ul>
      </div>

      <div className="ei-card ei-card--static p-5 rounded-2xl border border-rose-500/20">
        <h3 className="mb-3 text-base font-semibold text-rose-200 flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-rose-500/20 text-rose-300 text-xs">✕</span>
          ไม่ใช่
        </h3>
        <ul className="dawn-list flex flex-col gap-2 text-[15px] leading-relaxed text-slate-300">
          <li>คนที่อยากได้โปรเจกต์สำเร็จรูป หรืออยากให้คนอื่นทำให้</li>
          <li>ผู้ปกครองที่อยากซื้อผลลัพธ์ให้ลูก โดยที่ลูกยังไม่อยากทำ</li>
          <li>คนที่ต้องการการรับประกันว่าจะสอบติด — เราไม่มีให้</li>
        </ul>
      </div>
    </section>
  );
}

/**
 * The page has two readers with different fears and only one of them pays. The
 * student fears being handed another obligation; the parent fears wasted money
 * and a missed deadline. Every section above this one is written to the
 * student. This one is written to the person holding the phone.
 */
function ForParents() {
  const answers = [
    {
      question: "จ่ายแล้วลูกไม่ทำ จะเป็นยังไง",
      body: `คืนเงินเต็มจำนวน ไม่ถามอะไรเลย ตราบใดที่ยังไม่ส่งงานชิ้นแรก (ภายในสัปดาห์แรก) เราออกแบบให้เส้นคืนเงินอยู่ตรงนั้นพอดี เพราะถ้าลูกไม่อยากทำจริง ๆ มันจะรู้ตั้งแต่สัปดาห์แรก ไม่ใช่เดือนที่สาม`,
    },
    {
      question: "ต่างจากที่รับทำพอร์ตยังไง",
      body: "ที่รับทำพอร์ตขายผลลัพธ์ เราขายกระบวนการ ถ้าลูกไม่ลงมือ จะไม่มีอะไรเกิดขึ้นเลย และเราจะบอกตรง ๆ ไม่ใช่ทำให้แทนเพื่อให้ส่งทัน",
    },
    {
      question: "กรรมการจะรู้ได้ยังไงว่าลูกทำเอง",
      body: "เพราะลูกตอบคำถามได้ นั่นคือทั้งหมด เด็กที่ทำเองจะเล่าได้ว่าตอนไหนพัง แก้ยังไง คุยกับใครมาบ้าง เด็กที่จ้างทำจะตอบไม่ได้ และกรรมการถามเป็น",
    },
    {
      question: "ลูกยังไม่รู้ว่าอยากทำอะไรเลย",
      body: "ปกติมาก และไม่ใช่ปัญหา เราเริ่มจากเรื่องที่ลูกรำคาญอยู่แล้วในชีวิตประจำวัน ไม่ได้เริ่มจากคำถามว่าแพสชันคืออะไร",
    },
    {
      question: "ปลอดภัยไหม ลูกยังไม่บรรลุนิติภาวะ",
      body: "เรามีนโยบายคุ้มครองเด็กเป็นลายลักษณ์อักษร เปิดอ่านได้ทั้งฉบับ ห้ามพี่เลี้ยงแชทส่วนตัวกับนักเรียนเด็ดขาด ทุกห้องมีผู้ใหญ่คนที่สอง และผู้ปกครองขอดูได้ทุกเมื่อ",
    },
  ];

  return (
    <section className="flex flex-col gap-5">
      <SectionLabel>ถึงผู้ปกครอง</SectionLabel>

      <p className="text-[15px] leading-relaxed text-slate-300">
        คนที่จ่ายคือผู้ปกครอง คนที่ต้องลงมือทำคือนักเรียน
        เราเลยเขียนส่วนนี้แยกไว้ ตอบคำถามที่ถูกถามบ่อยที่สุดห้าข้อ
      </p>

      {/* Visual Banner linking to Parent Page */}
      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-slate-950 p-5 shadow-xl">
        <div className="flex flex-col sm:flex-row gap-4 items-center">
          <div className="relative aspect-[16/9] w-full sm:w-48 shrink-0 overflow-hidden rounded-xl">
            <Image
              src="/images/projectseed/parents-hero.jpg"
              alt="สรุปหน้าเดียวสำหรับผู้ปกครอง"
              fill
              sizes="(max-width: 640px) 100vw, 192px"
              className="object-cover"
            />
          </div>
          <div className="flex flex-col gap-2">
            <h3 className="text-base font-bold text-white">หน้านี้สรุปสองนาทีสำหรับผู้ปกครอง</h3>
            <p className="text-xs leading-relaxed text-slate-300">
              เขียนถึงผู้ปกครองโดยตรง ไม่ขายของ ตอบเรื่องเงิน คืนเงิน และความปลอดภัยครบในหน้าเดียว
            </p>
            <Link
              href="/projectseed/parents"
              className="inline-flex items-center gap-1 text-sm font-semibold text-blue-300 underline underline-offset-4 hover:text-blue-200 mt-1"
            >
              ส่งหน้านี้ให้ผู้ปกครองอ่าน — สรุปหน้าเดียว →
            </Link>
          </div>
        </div>
      </div>

      <div className="ei-card ei-card--static divide-y divide-white/[0.08] p-0 rounded-2xl">
        {answers.map((item) => (
          <div key={item.question} className="px-5 py-4">
            <h3 className="mb-1.5 text-base font-semibold text-white">{item.question}</h3>
            <p className="text-[15px] leading-relaxed text-slate-300">{item.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function PriceCard() {
  return (
    <section className="flex flex-col gap-5">
      <SectionLabel>ราคาและเงื่อนไข</SectionLabel>

      <div className="ei-card ei-card--static overflow-hidden p-0 rounded-2xl border border-white/10">
        <div className="relative aspect-[21/9] w-full overflow-hidden bg-slate-950">
          <Image
            src="/images/projectseed/money-guarantee.jpg"
            alt="การันตีคืนเงินและราคา 2990 บาท"
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
          <ul className="dawn-list flex flex-col gap-3 text-[15px] leading-relaxed text-slate-300">
            <li>
              <span className="text-white font-semibold">
                คิดเป็นสัปดาห์ละ ≈{formatThb(WEEKLY_PRICE_THB)}
              </span>{" "}
              — ถูกกว่าค่าติวหนึ่งชั่วโมง แต่ได้พี่เลี้ยง โครงสร้าง และการันตีผลงานเสร็จ ตลอด {PROGRAMME_WEEKS} สัปดาห์
            </li>
            <li>
              <span className="text-white font-semibold">ราคาเดียว ไม่มีตัวเสริม</span> — เราตัดแพ็กเกจพี่เลี้ยงแบบจ่ายเพิ่มออก
              เพราะมันจะทำให้คนจ่ายไหวได้โปรเจกต์ดีกว่า ซึ่งคือระบบที่เราตั้งใจต่อต้าน
            </li>
            <li className="bg-emerald-950/20 p-3 rounded-xl border border-emerald-500/20">
              <span className="text-emerald-200 font-semibold">คืนเงิน 100%</span> จนกว่านักเรียนจะส่งงานชิ้นแรก คือ
              {DELIVERABLE_ONE.parts[0]} และ{DELIVERABLE_ONE.parts[1]} ภายในวันที่{" "}
              {DELIVERABLE_ONE.dueDayOfProgramme} หลังจากนั้นไม่คืน
              เพราะหลังจุดนั้นพี่เลี้ยงลงเวลาไปแล้ว
            </li>
            <li>
              <span className="text-white font-semibold">ทุน {SCHOLARSHIP_SEATS} ที่นั่ง</span> ทุกรุ่น
              สำหรับคนที่จ่ายไม่ไหว ทักมาคุยได้เลย ไม่ต้องเขินอาย
            </li>
            <li>
              <span className="text-white font-semibold">ชวนรุ่นน้อง ม.4 – ม.5 ได้ส่วนลด</span> — ชวนเพื่อน ม.6 ไม่ได้
              เพราะรอบพอร์ตพวกเธอแย่งที่นั่งกันเอง เราจะไม่ให้ใครต้องเลือกระหว่างส่วนลดกับเพื่อน
              <span className="text-slate-400"> (ส่วนลดกี่บาท จะประกาศตอนเปิดรับ)</span>
            </li>
            <li>
              <span className="text-white font-semibold">รับ {TOTAL_SEATS} คน</span> เพราะเท่านี้คือจำนวนที่เราดูแลไหวจริง ๆ
            </li>
            <li>จ่ายผ่าน PromptPay โอนตรง ยังไม่มีระบบตัดบัตร</li>
          </ul>
        </div>
      </div>
    </section>
  );
}

/**
 * The honest section. The programme's entire claim is that it is not the
 * credential factory it competes with — which is only credible if the page
 * says the unflattering things too. Nothing here may be softened, and no
 * outcome claim may be added until real outcome data exists (the working rules
 * in PROJECTSEED-STRATEGY.md forbid substantiating impact from conversational
 * outreach).
 */
function StraightTalk() {
  const points = [
    {
      title: "นี่คือรุ่นที่ 1",
      body: "ยังไม่มีใครจบจากรุ่นนี้ เพราะยังไม่เคยมีรุ่นนี้ ถ้าอยากได้ของที่พิสูจน์แล้ว รุ่นนี้ยังไม่ใช่",
    },
    {
      title: "ราคานี้เป็นราคาทดลอง",
      body: "รุ่นต่อไปอาจไม่เท่านี้ เราจะไม่สัญญาว่าราคาจะคงเดิม เพราะเรายังไม่รู้ว่าดูแลหนึ่งคนใช้เวลาเท่าไหร่จริง ๆ",
    },
    {
      title: "เราไม่มีสถิติผลลัพธ์มาโชว์",
      body: "18 เดือน 4 โปรดักต์ นักเรียนราว 1,300 คน — แล้วเราไม่เคยเก็บข้อมูลผลลัพธ์เลย นั่นคือความผิดพลาดของเราเอง รุ่นนี้เราจะเริ่มเก็บ",
    },
    {
      title: "เรายังไม่เปิดขาย",
      body: "เพราะงานด้านความปลอดภัยเด็กยังไม่เสร็จครบทุกข้อ และเราเขียนกติกาไว้เองว่าห้ามรับเงินก่อนถึงตรงนั้น เราจะไม่ลัดข้อนี้ แม้จะแปลว่าขายช้าลง",
    },
    {
      title: "เราไม่รับประกันการเข้ามหาลัย",
      body: "และจะไม่มีวันรับประกัน ระบบคัดเลือกไม่ได้อยู่ในมือเรา",
    },
  ];

  return (
    <section className="flex flex-col gap-4">
      <SectionLabel>พูดกันตรง ๆ ก่อนจ่าย</SectionLabel>
      <p className="text-[15px] leading-relaxed text-slate-400">
        ถ้าเราอยากขายอย่างเดียว เราคงไม่เขียนส่วนนี้
      </p>
      <div className="ei-card ei-card--static p-5 rounded-2xl">
        <ul className="flex flex-col gap-4">
          {points.map((point) => (
            <li key={point.title}>
              <p className="mb-1 text-[15px] font-semibold text-amber-200/90">{point.title}</p>
              <p className="text-[15px] leading-relaxed text-slate-300">{point.body}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function Safety() {
  return (
    <section className="flex flex-col gap-5">
      <SectionLabel>ความปลอดภัยของนักเรียน</SectionLabel>

      <div className="ei-card ei-card--static overflow-hidden p-0 rounded-2xl border border-white/10">
        <div className="grid grid-cols-1 md:grid-cols-12 items-center bg-slate-950/60">
          <div className="relative aspect-video md:aspect-square md:col-span-5 w-full overflow-hidden">
            <Image
              src="/images/projectseed/safeguarding-badge.jpg"
              alt="นโยบายความปลอดภัยของนักเรียน"
              fill
              sizes="(max-width: 768px) 100vw, 280px"
              className="object-cover"
            />
          </div>

          <div className="p-6 md:col-span-7 flex flex-col gap-3">
            <p className="text-[15px] leading-relaxed text-slate-300">
              พี่เลี้ยงเป็นรุ่นพี่วัยมหาลัย และนักเรียนส่วนใหญ่ยังไม่บรรลุนิติภาวะ
              เราจึงมีนโยบายคุ้มครองเด็กเป็นลายลักษณ์อักษร และเปิดให้อ่านได้ทุกคน
            </p>
            <p className="text-[15px] leading-relaxed text-slate-300">
              <span className="text-white font-semibold">
                กติกาที่ห้ามผิดเด็ดขาด: พี่เลี้ยงห้ามทักแชทส่วนตัวกับนักเรียนที่อายุต่ำกว่า 18 ปี
              </span>{" "}
              ทุกอย่างอยู่ในกลุ่มที่มีผู้ใหญ่คนที่สองอยู่ด้วย ผู้ปกครองขอดูได้ทุกเมื่อ
            </p>
            <Link
              href="/projectseed/safeguarding"
              className="text-[15px] text-blue-300 underline underline-offset-4 hover:text-blue-200 font-medium"
            >
              อ่านนโยบายคุ้มครองเด็กฉบับเต็ม →
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}


/**
 * The primary action is a 20-minute call, not a payment — and not only because
 * safeguarding §11 forbids selling a seat while the launch gate is open. Every
 * booking batch 1 has received came through this link, and until now it was
 * reachable only from /link. The page that describes the offer did not contain
 * the one action that has ever converted.
 */
function CallToAction() {
  return (
    <section className="flex flex-col gap-4">
      <hr className="dawn-rule" />

      <h2 className="text-2xl font-bold text-white">คุยกันก่อน 20 นาที</h2>

      <p className="text-[15px] leading-relaxed text-slate-300">
        {IS_OPEN_FOR_SALE
          ? "จองเวลาคุยได้เลย เราจะดูด้วยกันว่าเหมาะกับน้องคนนี้ไหม แล้วค่อยส่งรายละเอียดการชำระเงินให้"
          : "ตอนนี้เรายังไม่เปิดขายที่นั่ง — กำลังปิดงานด้านความปลอดภัยเด็กให้ครบก่อน แต่คุยกันได้เลย เราจะบอกตรง ๆ ว่าเหมาะกับน้องคนนี้ไหม และแจ้งทันทีที่เปิดรับ"}
      </p>

      <a
        href={CONTACT.bookingUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="ei-button-dawn min-h-[48px] w-full text-center sm:w-fit"
      >
        จองเวลาคุย 20 นาที
      </a>

      <div className="ei-card ei-card--static flex flex-col items-start gap-4 p-5 sm:flex-row sm:items-center">
        <Image
          src={CONTACT.lineQrUrl}
          alt="QR code สำหรับเพิ่มเพื่อน LINE ของ PassionSeed"
          width={132}
          height={132}
          unoptimized
          className="rounded-lg bg-white p-2"
        />
        <div className="flex flex-col gap-3">
          <p className="text-[15px] leading-relaxed text-slate-300">
            หรือสแกน QR คุยทาง LINE — ผู้ปกครองถามได้ นักเรียนถามได้
          </p>
          <Link
            href={CONTACT.discordPath}
            className="text-[15px] text-blue-300 underline underline-offset-4 hover:text-blue-200"
          >
            เข้าคอมมูนิตี้ Discord →
          </Link>
        </div>
      </div>

      {/* No-commitment entry point. Costs nothing, needs no account, and is the
          honest way to find out whether the student actually wants this. */}
      <div className="rounded-xl border border-amber-200/20 bg-slate-950/40 p-5">
        <p className="mb-2 text-[15px] leading-relaxed text-slate-300">
          <span className="font-semibold text-amber-200">ยังไม่พร้อมจ่าย? เริ่มฟรีได้เลย</span>
          <br />
          เอาพรอมป์ของเราไปคุยกับ AI 20 นาที แล้วจะได้โปรเจกต์ 1 อัน
          กับสิ่งที่ต้องทำในสัปดาห์นี้ 1 อย่าง ไม่ต้องสมัคร ไม่ต้องจ่าย
        </p>
        <Link
          href="/projectseed/prompt"
          className="text-[15px] text-blue-300 underline underline-offset-4 hover:text-blue-200"
        >
          ไปที่พรอมป์หาโปรเจกต์ →
        </Link>
      </div>
    </section>
  );
}

/**
 * Mobile-only, one instance, `md:hidden` — the pattern the design system
 * mandates for detail pages. This page is long and its readers are on phones;
 * without it the only way to act is to scroll to the bottom.
 */
function StickyCallToAction() {
  return (
    <div className="fixed inset-x-0 bottom-0 z-20 border-t border-white/10 bg-slate-950/90 px-4 py-3 backdrop-blur md:hidden">
      <a
        href={CONTACT.bookingUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="ei-button-dawn flex min-h-[48px] w-full items-center justify-center !py-3"
      >
        จองเวลาคุย 20 นาที
      </a>
    </div>
  );
}
