"use client";

import Link from "next/link";
import {
  ArrowUpRight,
  Bookmark,
  Check,
  GitCompareArrows,
  Sparkles,
  X,
} from "lucide-react";

import type { CareerPreview } from "@/lib/my-path/radar-content";

interface CareerPreviewCardProps {
  career: CareerPreview;
  expanded: boolean;
  saved: boolean;
  selectedForComparison: boolean;
  comparisonDisabled: boolean;
  saveDisabled: boolean;
  onOpen: () => void;
  onSave: () => void;
  onDismiss: () => void;
  onCompare: () => void;
  onOpenRadar: () => void;
}

export function CareerPreviewCard({
  career,
  expanded,
  saved,
  selectedForComparison,
  comparisonDisabled,
  saveDisabled,
  onOpen,
  onSave,
  onDismiss,
  onCompare,
  onOpenRadar,
}: CareerPreviewCardProps) {
  return (
    <article
      className="dawn-card overflow-hidden border border-white/10 bg-slate-950/70 shadow-[0_20px_70px_rgba(2,6,23,0.32)]"
      style={{ boxShadow: `0 20px 70px color-mix(in srgb, ${career.color} 12%, transparent)` }}
    >
      <div className="flex min-h-[15rem] flex-col p-5 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <span className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-lg text-amber-100">
              {career.emoji}
            </span>
            <h3 className="font-kodchasan text-xl font-semibold leading-snug text-slate-50">
              {career.titleTh}
            </h3>
            {career.titleEn !== career.titleTh && (
              <p className="mt-1 text-xs font-medium uppercase tracking-[0.12em] text-slate-500">
                {career.titleEn}
              </p>
            )}
          </div>
          {saved && (
            <span className="inline-flex items-center gap-1 rounded-full border border-amber-300/25 bg-amber-200/10 px-2.5 py-1 text-xs font-semibold text-amber-100">
              <Check className="h-3.5 w-3.5" aria-hidden="true" /> บันทึกแล้ว
            </span>
          )}
        </div>

        <p className="mt-4 text-sm leading-6 text-slate-300">{career.tagline}</p>

        {!expanded ? (
          <button
            type="button"
            onClick={onOpen}
            aria-label={`เปิดดู ${career.titleTh}`}
            className="mt-auto inline-flex min-h-12 items-center justify-between rounded-xl border border-indigo-300/20 bg-indigo-300/[0.06] px-4 text-sm font-semibold text-indigo-100 transition-colors hover:bg-indigo-300/[0.11] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
          >
            เปิดดูความจริงของงาน
            <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
          </button>
        ) : (
          <div className="mt-6 space-y-5 border-t border-white/10 pt-5">
            <RealitySignal label="งานที่ได้ทำ" value={career.dailyWork} />
            <RealitySignal label="คนที่อาจสนุกกับงานนี้" value={career.enjoySignal} />
            <RealitySignal label="สิ่งที่ต้องยอมรับ" value={career.tradeoff} />
            <RealitySignal label="งานส่วนไหนกำลังเปลี่ยนเพราะ AI" value={career.aiSignal} />

            <Link
              href={career.radarHref}
              onClick={onOpenRadar}
              className="inline-flex min-h-12 w-full items-center justify-between rounded-xl border border-sky-300/20 bg-sky-300/[0.06] px-4 text-sm font-semibold text-sky-100 transition-colors hover:bg-sky-300/[0.11] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200"
            >
              อ่านโปรไฟล์เต็มใน Radar
              <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        )}

        <div className="mt-4 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={onSave}
            disabled={saveDisabled && !saved}
            aria-label={
              saved ? `นำ ${career.titleTh} ออกจากรายการ` : `บันทึก ${career.titleTh}`
            }
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 text-sm font-semibold text-slate-100 transition-colors hover:bg-white/[0.08] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Bookmark className="h-4 w-4" aria-hidden="true" />
            {saved ? "เก็บไว้แล้ว" : "บันทึก"}
          </button>
          <button
            type="button"
            onClick={onCompare}
            disabled={comparisonDisabled && !selectedForComparison}
            aria-pressed={selectedForComparison}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 text-sm font-semibold text-slate-100 transition-colors hover:bg-white/[0.08] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <GitCompareArrows className="h-4 w-4" aria-hidden="true" />
            {selectedForComparison ? "เลือกแล้ว" : "เทียบ"}
          </button>
        </div>

        {!saved && (
          <button
            type="button"
            onClick={onDismiss}
            className="mt-2 inline-flex min-h-11 items-center justify-center gap-2 rounded-lg text-xs font-medium text-slate-500 transition-colors hover:text-slate-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200"
          >
            <X className="h-3.5 w-3.5" aria-hidden="true" />
            ตอนนี้ยังไม่น่าสนใจ
          </button>
        )}
      </div>
    </article>
  );
}

function RealitySignal({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[1.25rem_1fr] gap-3">
      <Sparkles className="mt-1 h-4 w-4 text-amber-200/80" aria-hidden="true" />
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.1em] text-slate-500">
          {label}
        </p>
        <p className="mt-1 text-sm leading-6 text-slate-200">{value}</p>
      </div>
    </div>
  );
}
