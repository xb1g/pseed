import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  Instagram,
  MessageCircle,
} from "lucide-react";

import { DawnScene } from "@/components/projectseed/dawn-scene";
import { InViewAnimator } from "@/components/ui/in-view-animator";
import { CONTACT, JOURNEY, NOTES, PROOF } from "@/lib/content/pathlab-page";

export const metadata: Metadata = {
  title: "PathLab สำหรับผู้ปกครอง | Passion Seed",
  description:
    "สรุป PathLab สำหรับผู้ปกครอง: เด็กจะได้ทำอะไร ราคา 299 บาท และ Passion Seed ดูแลการเรียนรู้อย่างไร",
};

const PATHLAB_PROOF = [
  "โจทย์ออกแบบร่วมกับผู้เชี่ยวชาญที่ทำงานในสายนั้นจริง",
  "เรียนแบบ Learn + Do ลงมือสร้างและทดสอบทุกวัน",
  "จบรอบพร้อมชิ้นงานและเรื่องเล่าจากสิ่งที่ลงมือทำเอง",
] as const;

export default function PathlabForParentsPage() {
  return (
    <div lang="th" className="dawn-theme relative min-h-screen overflow-hidden text-white">
      <DawnScene />
      <InViewAnimator selector=".ei-card, .ei-button-dusk" />

      <header className="relative z-20 mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-5 sm:px-8">
        <Link
          href="/"
          className="font-kodchasan text-base font-bold tracking-tight text-white transition-colors hover:text-amber-200"
        >
          Passion Seed
        </Link>
        <Link
          href="/pathlab"
          className="min-h-11 rounded-full border border-white/15 bg-white/5 px-4 py-2.5 font-bai-jamjuree text-sm font-semibold text-slate-200 transition-colors hover:border-blue-300/40 hover:text-white"
        >
          ดูหน้า PathLab
        </Link>
      </header>

      <main className="relative z-10">
        <Hero />
        <WhatIsPathlab />
        <Credibility />
        <PriceAndContact />
      </main>

      <footer className="relative z-10 mx-auto flex w-full max-w-6xl items-center justify-between gap-4 border-t border-white/10 px-5 py-8 font-bai-jamjuree text-xs text-slate-400 sm:px-8">
        <span>PathLab by Passion Seed</span>
        <Link href="/pathlab" className="transition-colors hover:text-white">
          รายละเอียด PathLab ทั้งหมด
        </Link>
      </footer>
    </div>
  );
}

function Hero() {
  return (
    <section className="mx-auto grid min-h-[calc(100svh-5.25rem)] w-full max-w-6xl items-center gap-12 px-5 pb-20 pt-10 sm:px-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(28rem,1.1fr)] lg:gap-16 lg:py-20">
      <div className="max-w-xl">
        <p className="dawn-eyebrow">PATHLAB · สำหรับผู้ปกครอง</p>
        <h1 className="mt-5 font-kodchasan text-4xl font-bold leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl">
          ให้ลูกได้ลองทำงานจริง ก่อนเลือกเส้นทางจริง
        </h1>
        <div className="dawn-rule mt-7" aria-hidden="true" />
        <p className="mt-7 max-w-lg font-bai-jamjuree text-base leading-8 text-slate-300 sm:text-lg">
          PathLab คือประสบการณ์ทำโปรเจกต์ระยะสั้น เด็กจะได้เรียนรู้พื้นฐานของสายที่สนใจ
          แล้วลงมือสร้างชิ้นงานทีละขั้น พร้อม mentor ช่วยดูแลตลอดทาง
        </p>
        <div className="mt-9 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
          <a
            href={CONTACT.href}
            target="_blank"
            rel="noopener noreferrer"
            className="ei-button-dusk min-h-12 w-full justify-center sm:w-auto"
          >
            <Instagram aria-hidden="true" className="h-5 w-5" />
            <span>คุยกับทีม PathLab</span>
          </a>
          <a
            href="#pathlab-parent-details"
            className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-6 font-bai-jamjuree text-sm font-semibold text-slate-200 transition-colors hover:border-blue-300/40 hover:text-white sm:w-auto"
          >
            อ่านสรุป 2 นาที
            <ArrowRight aria-hidden="true" className="h-4 w-4" />
          </a>
        </div>
      </div>

      <figure className="relative overflow-hidden rounded-[1.75rem] border border-blue-200/20 bg-slate-950/60 p-2 shadow-2xl shadow-blue-950/30 backdrop-blur-xl">
        <div className="relative aspect-[1.5/1] overflow-hidden rounded-[1.35rem]">
          <Image
            src={JOURNEY.src}
            alt={JOURNEY.alt}
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 560px"
            className="object-cover"
          />
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-blue-950/10"
          />
          <figcaption className="absolute inset-x-0 bottom-0 p-5 font-bai-jamjuree text-sm leading-6 text-slate-200 sm:p-6">
            เด็กเดินตาม Learning Journey วันต่อวัน เห็นทั้งโจทย์ สิ่งที่ต้องทำ
            และชิ้นงานที่ได้กลับไป
          </figcaption>
        </div>
      </figure>
    </section>
  );
}

function WhatIsPathlab() {
  return (
    <section
      id="pathlab-parent-details"
      aria-labelledby="pathlab-parent-what"
      className="mx-auto grid w-full max-w-6xl gap-10 px-5 py-20 sm:px-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-start lg:py-28"
    >
      <div>
        <p className="dawn-eyebrow">PATHLAB คืออะไร</p>
        <h2
          id="pathlab-parent-what"
          className="mt-4 font-kodchasan text-3xl font-bold leading-tight text-white sm:text-4xl"
        >
          ไม่ใช่คอร์สดูคลิป แต่เป็นพื้นที่ให้ลองทำจริง
        </h2>
        <p className="mt-5 font-bai-jamjuree text-base leading-8 text-slate-300">
          ในแต่ละวัน เด็กจะเรียนเนื้อหาที่จำเป็นเท่าที่ใช้กับโจทย์ แล้วลงมือทำต่อทันที
          จึงได้เห็นทั้งความสนุก ความยาก และวิธีทำงานของสายนั้นก่อนตัดสินใจเรียนต่อ
        </p>
        <p className="mt-6">
          <span className="pathlab-note">{NOTES.parentsWhat}</span>
        </p>
      </div>

      <div className="ei-card ei-card--static p-6 sm:p-8">
        <ol className="divide-y divide-white/10">
          {[
            ["01", "เลือกสายที่อยากลอง", "เริ่มจากความสนใจของเด็ก ไม่ต้องมีพื้นฐานมาก่อน"],
            ["02", "ทำโจทย์จริงทีละวัน", "เรียนเรื่องที่จำเป็น แล้วใช้กับชิ้นงานในวันเดียวกัน"],
            ["03", "สะท้อนผลและเล่าชิ้นงาน", "มองเห็นว่าชอบอะไร ติดตรงไหน และอยากไปต่อหรือไม่"],
          ].map(([number, title, detail]) => (
            <li key={number} className="grid gap-3 py-5 first:pt-0 last:pb-0 sm:grid-cols-[3rem_1fr]">
              <span className="font-space-mono text-sm text-amber-200">{number}</span>
              <div>
                <h3 className="font-kodchasan text-lg font-bold text-white">{title}</h3>
                <p className="mt-1 font-bai-jamjuree text-sm leading-7 text-slate-300">
                  {detail}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function Credibility() {
  return (
    <section
      aria-labelledby="pathlab-parent-proof"
      className="mx-auto w-full max-w-6xl px-5 py-20 sm:px-8 lg:py-28"
    >
      <div className="grid gap-10 lg:grid-cols-[0.75fr_1.25fr] lg:items-end">
        <div>
          <p className="dawn-eyebrow">ความน่าเชื่อถือ</p>
          <p className="mt-4 font-kodchasan text-6xl font-bold text-amber-200 sm:text-7xl">
            {PROOF.figure}
          </p>
          <h2
            id="pathlab-parent-proof"
            className="mt-3 font-kodchasan text-2xl font-bold leading-snug text-white sm:text-3xl"
          >
            นักเรียนนำ Project ไปต่อยอดเป็น Port
          </h2>
          <p className="mt-4 font-bai-jamjuree text-sm leading-7 text-slate-300">
            {PROOF.sub}
          </p>
        </div>

        <ul className="divide-y divide-white/10 border-y border-white/10">
          {PATHLAB_PROOF.map((item) => (
            <li key={item} className="flex gap-4 py-5 font-bai-jamjuree text-base leading-7 text-slate-200">
              <CheckCircle2 aria-hidden="true" className="mt-1 h-5 w-5 shrink-0 text-blue-300" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>
      <p className="mt-8 text-center lg:text-left">
        <span className="pathlab-note pathlab-note--tilt-r-sm">
          {NOTES.parentsProof}
        </span>
      </p>
    </section>
  );
}

function PriceAndContact() {
  return (
    <section
      aria-labelledby="pathlab-parent-price"
      className="mx-auto w-full max-w-4xl px-5 py-20 sm:px-8 lg:py-28"
    >
      <div className="ei-card ei-card--static overflow-hidden p-7 text-center sm:p-10">
        <p className="dawn-eyebrow">ราคา PathLab แบบเดี่ยว</p>
        <h2
          id="pathlab-parent-price"
          className="mt-4 font-kodchasan text-5xl font-bold text-amber-200 sm:text-6xl"
        >
          299 บาท
        </h2>
        <p className="mx-auto mt-5 max-w-xl font-bai-jamjuree text-base leading-8 text-slate-300">
          ต่อคน สำหรับรอบ 4-5 วัน มาคนเดียวได้ ทีมจะช่วยจัดกลุ่มและเวลาที่ตรงกัน
          รายละเอียดการเริ่มรอบยืนยันผ่านแชทกับทีม PathLab
        </p>
        <p className="mt-6">
          <span className="pathlab-note pathlab-note--tilt-l-sm">
            {NOTES.parentsPrice}
          </span>
        </p>

        <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
          <a
            href={CONTACT.href}
            target="_blank"
            rel="noopener noreferrer"
            className="ei-button-dusk min-h-12 justify-center"
          >
            <Instagram aria-hidden="true" className="h-5 w-5" />
            <span>ทัก Instagram</span>
          </a>
          <a
            href={CONTACT.lineHref}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-emerald-300/30 bg-emerald-400/10 px-8 font-bai-jamjuree text-sm font-semibold text-emerald-100 transition-colors hover:border-emerald-200/60 hover:bg-emerald-400/15"
          >
            <MessageCircle aria-hidden="true" className="h-5 w-5" />
            <span>ทัก {CONTACT.lineLabel}</span>
          </a>
        </div>
      </div>
    </section>
  );
}
