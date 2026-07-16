"use client";

import { useState } from "react";
import { Pencil, RotateCcw } from "lucide-react";

import type { DirectionHypothesis } from "@/lib/my-path/types";

export function DirectionSection({
  direction,
  onEdit,
  onReject,
}: {
  direction: DirectionHypothesis;
  onEdit: (statement: string) => void;
  onReject: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(direction.statement);

  if (!direction.enoughSignal) return null;

  return (
    <section
      aria-labelledby="direction-heading"
      className="relative overflow-hidden rounded-3xl border border-amber-200/15 bg-[linear-gradient(145deg,rgba(30,27,75,0.86),rgba(15,23,42,0.9),rgba(30,58,95,0.76))] px-5 py-8 sm:px-8"
    >
      <div className="absolute inset-x-10 bottom-0 h-24 rounded-full bg-amber-200/10 blur-3xl" aria-hidden="true" />
      <div className="relative">
        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-amber-100/70">
          ทิศทางที่กำลังก่อตัว
        </p>
        <h2
          id="direction-heading"
          className="mt-3 max-w-3xl font-kodchasan text-2xl font-semibold leading-relaxed text-slate-50 sm:text-3xl"
        >
          จากสิ่งที่คุณกำลังสำรวจ ตอนนี้คุณอาจกำลังมองหาเส้นทางที่…
        </h2>

        {editing ? (
          <form
            className="mt-5 flex flex-col gap-3 sm:flex-row"
            onSubmit={(event) => {
              event.preventDefault();
              const next = value.trim();
              if (next) onEdit(next);
              setEditing(false);
            }}
          >
            <label htmlFor="direction-statement" className="sr-only">
              แก้ไขทิศทางของฉัน
            </label>
            <input
              id="direction-statement"
              value={value}
              maxLength={280}
              onChange={(event) => setValue(event.target.value)}
              className="ei-input min-h-12 flex-1"
              autoFocus
            />
            <button type="submit" className="ei-button-dawn min-h-12 justify-center">
              <span>บันทึกข้อความ</span>
            </button>
          </form>
        ) : (
          <p className="mt-5 max-w-3xl text-xl font-semibold leading-relaxed text-amber-100">
            {direction.statement}
          </p>
        )}

        <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-400">
          {direction.disclaimer}
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => {
              setValue(direction.statement);
              setEditing(true);
            }}
            className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-white/10 px-3 text-sm font-medium text-slate-200 hover:bg-white/[0.05] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200"
          >
            <Pencil className="h-4 w-4" aria-hidden="true" /> แก้ให้เป็นคำของฉัน
          </button>
          <button
            type="button"
            onClick={onReject}
            className="inline-flex min-h-11 items-center gap-2 rounded-xl px-3 text-sm font-medium text-slate-400 hover:text-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200"
          >
            <RotateCcw className="h-4 w-4" aria-hidden="true" /> ยังไม่ใช่ ลองให้กว้างขึ้น
          </button>
        </div>
      </div>
    </section>
  );
}
