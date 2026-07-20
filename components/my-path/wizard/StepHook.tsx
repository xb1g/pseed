"use client";

import { Compass, Flame, HandHeart, MessagesSquare, Trophy, Users, FolderKanban } from "lucide-react";

const PROMISES = [
  { icon: FolderKanban, label: "โปรเจคชูโรงใส่พอร์ต" },
  { icon: Trophy, label: "งานแข่งใส่พอร์ต" },
  { icon: HandHeart, label: "งานเพื่อสังคม" },
  { icon: MessagesSquare, label: "เทคนิคสอบสัมภาษณ์" },
  { icon: Users, label: "community and mentor" },
];

export function StepHook() {
  return (
    <section aria-labelledby="hook-heading" className="flex flex-col items-start">
      <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-indigo-200/15 bg-indigo-100/[0.06] px-3 py-1.5 text-xs font-semibold text-indigo-100/80">
        <Compass className="h-3.5 w-3.5" aria-hidden="true" />
        My Path · สำรวจได้ก่อน ยังไม่ต้องสมัคร
      </div>
      <h1
        id="hook-heading"
        className="font-kodchasan text-3xl font-semibold leading-[1.3] tracking-tight text-slate-50 sm:text-5xl sm:leading-[1.25]"
      >
        เข้ามหาวิทยาลัย
        <br />
        ในไทม์ไลน์<span className="text-amber-200">ของคุณ</span>
      </h1>
      <p className="mt-5 max-w-xl text-base leading-7 text-slate-300 sm:text-lg">
        ไม่ต้องรอจบ ม.6 แล้วค่อยมาเริ่มคิด ใน 2–4 เดือนคุณสร้างหลักฐานที่
        มหาวิทยาลัยอยากเห็นได้จริง — ถ้ารู้ว่าต้องสร้างอะไร และอะไรไม่ควรเสียเวลา
      </p>

      <div className="mt-8 grid w-full grid-cols-1 gap-2.5 min-[420px]:grid-cols-2">
        {PROMISES.map(({ icon: Icon, label }) => (
          <div
            key={label}
            className="dawn-card flex items-center gap-3 border border-white/10 bg-white/[0.04] px-4 py-3"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-200/10 text-amber-100">
              <Icon className="h-4.5 w-4.5" aria-hidden="true" />
            </span>
            <span className="text-sm font-semibold text-slate-100">{label}</span>
          </div>
        ))}
      </div>

      <p className="mt-8 flex items-start gap-2 text-sm leading-6 text-slate-500">
        <Flame className="mt-0.5 h-4 w-4 shrink-0 text-amber-200/70" aria-hidden="true" />
        และถึงเส้นทางมหาวิทยาลัยจะเปลี่ยนไป สิ่งที่คุณสร้างตรงนี้จะยังเป็นของคุณเสมอ —
        นี่คือการออกแบบชีวิต ไม่ใช่แค่สอบเข้า
      </p>
    </section>
  );
}
