"use client";

import { BookmarkPlus } from "lucide-react";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import type { CareerPreview } from "@/lib/my-path/radar-content";

const ROWS: Array<{
  label: string;
  read: (career: CareerPreview) => string;
}> = [
  { label: "งานในแต่ละวัน", read: (career) => career.dailyWork },
  { label: "สไตล์การทำงาน", read: (career) => career.enjoySignal },
  { label: "เส้นทางเริ่มต้น", read: (career) => career.entryRoute },
  { label: "ตลาดและการเติบโต", read: (career) => career.marketSignal },
  { label: "AI ช่วยหรือเปลี่ยนอะไร", read: (career) => career.aiSignal },
  { label: "สิ่งที่ควรทดลองก่อน", read: (career) => career.tradeoff },
];

export function CareerComparisonSheet({
  careers,
  open,
  onOpenChange,
  onSaveQuestion,
}: {
  careers: [CareerPreview, CareerPreview] | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaveQuestion: (question: string, slugs: [string, string]) => void;
}) {
  if (!careers) return null;
  const question = `คุณชอบสร้างคำตอบด้วยตัวเองแบบ ${careers[0].titleTh} หรือชอบแก้ปัญหาผ่านวิธีของ ${careers[1].titleTh}?`;
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="max-h-[92dvh] overflow-y-auto border-white/10 bg-slate-950 px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] text-slate-100 sm:px-8"
      >
        <div className="mx-auto max-w-5xl">
          <SheetHeader className="pr-10 text-left">
            <SheetTitle className="font-kodchasan text-2xl text-slate-50">
              เปรียบเทียบเพื่อเห็นสิ่งที่ต้องเลือกแลก
            </SheetTitle>
            <SheetDescription className="text-slate-400">
              ไม่มีคะแนนว่าอันไหนดีกว่า มีแค่ความจริงคนละแบบที่ควรตรวจสอบต่อ
            </SheetDescription>
          </SheetHeader>

          <div className="mt-7 overflow-hidden rounded-2xl border border-white/10">
            <div className="grid grid-cols-[7rem_1fr_1fr] bg-white/[0.04] sm:grid-cols-[12rem_1fr_1fr]">
              <div className="p-3 sm:p-4" />
              {careers.map((career) => (
                <h3
                  key={career.slug}
                  className="border-l border-white/10 p-3 font-kodchasan text-sm font-semibold text-slate-100 sm:p-4 sm:text-base"
                >
                  {career.titleTh}
                </h3>
              ))}
            </div>
            {ROWS.map((row) => (
              <div
                key={row.label}
                className="grid grid-cols-[7rem_1fr_1fr] border-t border-white/10 sm:grid-cols-[12rem_1fr_1fr]"
              >
                <p className="p-3 text-xs font-semibold text-slate-500 sm:p-4 sm:text-sm">
                  {row.label}
                </p>
                {careers.map((career) => (
                  <p
                    key={career.slug}
                    className="border-l border-white/10 p-3 text-xs leading-5 text-slate-300 sm:p-4 sm:text-sm sm:leading-6"
                  >
                    {row.read(career)}
                  </p>
                ))}
              </div>
            ))}
          </div>

          <div className="mt-7 rounded-2xl border border-amber-200/15 bg-amber-100/[0.05] p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-amber-100/65">
              คำถามที่ควรหาคำตอบต่อ
            </p>
            <p className="mt-2 text-base font-medium leading-7 text-amber-50">
              {question}
            </p>
            <button
              type="button"
              onClick={() =>
                onSaveQuestion(question, [careers[0].slug, careers[1].slug])
              }
              className="mt-4 inline-flex min-h-12 items-center gap-2 rounded-xl border border-amber-100/20 px-4 text-sm font-semibold text-amber-50 hover:bg-amber-100/[0.07] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200"
            >
              <BookmarkPlus className="h-4 w-4" aria-hidden="true" />
              บันทึกคำถามไว้ใน My Path
            </button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
