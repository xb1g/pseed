"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Check, Plus, Radar, X } from "lucide-react";

import type { CareerPreview } from "@/lib/my-path/radar-content";

interface StepInterestsProps {
  careers: CareerPreview[];
  savedSlugs: string[];
  maxSelections: number;
  onToggle: (slug: string) => void;
  customInterest: string;
  onCustomInterestChange: (value: string) => void;
  onCustomInterestCommit?: (value?: string) => void;
}

export function StepInterests({
  careers,
  savedSlugs,
  maxSelections,
  onToggle,
  customInterest,
  onCustomInterestChange,
  onCustomInterestCommit,
}: StepInterestsProps) {
  const isFull = savedSlugs.length >= maxSelections;
  const [isWritingCustom, setIsWritingCustom] = useState(false);
  const hasCustomInterest = customInterest.trim().length > 0;

  function finishWriting() {
    onCustomInterestCommit?.();
    setIsWritingCustom(false);
  }

  return (
    <section aria-labelledby="interests-heading">
      <p className="text-xs font-semibold uppercase tracking-[0.15em] text-indigo-200/70">
        ขั้นที่ 1 · สำรวจ
      </p>
      <h2
        id="interests-heading"
        className="mt-2 font-kodchasan text-2xl font-semibold text-slate-50 sm:text-3xl"
      >
        อะไรจุดไฟในตัวคุณ
      </h2>
      <p className="mt-3 max-w-xl text-sm leading-6 text-slate-400">
        เลือกได้หลายอัน (สูงสุด {maxSelections}) หรือเขียนเองก็ได้ —
        ยังไม่ต้องรู้ว่าอันไหน &quot;ใช่&quot; ถ้ายังไม่แน่ใจ เปิด Radar
        ไปอ่านให้ลึกก่อน กด &quot;สนใจเส้นทางนี้&quot; ที่นั่นได้เลย
        แล้วกลับมาที่แผนนี้ ตัวเลือกจะติดกลับมาให้เอง
      </p>

      <div className="mt-6 flex flex-wrap gap-2.5" role="group" aria-label="เลือกสิ่งที่สนใจ">
        {careers.map((career) => {
          const selected = savedSlugs.includes(career.slug);
          const disabled = !selected && isFull;
          return (
            <button
              key={career.slug}
              type="button"
              onClick={() => onToggle(career.slug)}
              disabled={disabled}
              aria-pressed={selected}
              className={`inline-flex min-h-12 items-center gap-2 rounded-full border px-4 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200 ${
                selected
                  ? "border-amber-200/60 bg-amber-200/15 text-amber-100"
                  : disabled
                    ? "cursor-not-allowed border-white/5 bg-white/[0.02] text-slate-600"
                    : "border-white/10 bg-white/[0.04] text-slate-200 hover:bg-white/[0.08]"
              }`}
            >
              <span aria-hidden="true">{career.emoji}</span>
              {career.titleTh}
              {selected && <Check className="h-4 w-4" aria-hidden="true" />}
            </button>
          );
        })}

        {/* Write-in chip: "+ เขียนเอง" expands into an inline input; once
            written it sits in the row as a selected chip. */}
        {isWritingCustom ? (
          <input
            autoFocus
            value={customInterest}
            onChange={(event) => onCustomInterestChange(event.target.value)}
            onBlur={finishWriting}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                finishWriting();
              }
            }}
            maxLength={80}
            placeholder="พิมพ์สิ่งที่จุดไฟคุณ…"
            aria-label="เขียนสิ่งที่จุดไฟในตัวคุณเอง"
            className="min-h-12 w-56 rounded-full border border-amber-200/60 bg-amber-200/15 px-4 text-sm font-semibold text-amber-100 placeholder:text-amber-100/40 focus:outline-none focus:ring-2 focus:ring-amber-200"
          />
        ) : hasCustomInterest ? (
          <span className="inline-flex min-h-12 items-center gap-1 rounded-full border border-amber-200/60 bg-amber-200/15 pl-4 pr-1.5 text-sm font-semibold text-amber-100">
            <button
              type="button"
              onClick={() => setIsWritingCustom(true)}
              aria-pressed="true"
              title="แก้ไข"
              className="inline-flex min-h-12 items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200"
            >
              <Check className="h-4 w-4" aria-hidden="true" />
              {customInterest}
            </button>
            <button
              type="button"
              onClick={() => {
                onCustomInterestChange("");
                onCustomInterestCommit?.("");
              }}
              aria-label="ลบสิ่งที่เขียนเอง"
              className="flex h-9 w-9 items-center justify-center rounded-full text-amber-100/70 transition-colors hover:bg-white/10 hover:text-amber-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </span>
        ) : (
          <button
            type="button"
            onClick={() => setIsWritingCustom(true)}
            className="inline-flex min-h-12 items-center gap-2 rounded-full border border-dashed border-white/20 bg-transparent px-4 text-sm font-semibold text-slate-400 transition-colors hover:border-amber-200/50 hover:text-amber-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            เขียนเอง
          </button>
        )}
      </div>

      <Link
        href="/radar?from=plan"
        className="dawn-card group mt-6 flex w-full items-center gap-4 border border-white/10 bg-white/[0.04] p-4"
      >
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-indigo-500/15 text-indigo-200">
          <Radar className="h-6 w-6" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1 text-left">
          <p className="font-kodchasan text-base font-semibold text-slate-50">
            เปิด Radar สำรวจทุกเส้นทาง
          </p>
          <p className="mt-0.5 text-sm text-slate-400">
            อ่านให้ลึกทีละสาย แล้วกด &quot;สนใจ&quot; หรือ &quot;ดูทางอื่นต่อ&quot; — กลับมาที่แผนได้ทุกเมื่อ
          </p>
        </div>
        <ArrowRight
          className="h-5 w-5 shrink-0 text-indigo-200 transition-transform group-hover:translate-x-1"
          aria-hidden="true"
        />
      </Link>
    </section>
  );
}
