"use client";

import { useCallback, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { saveAvailability } from "@/actions/projectseed";
import {
  PSEED_DAYS,
  PSEED_HOURS,
  PSEED_TIMEZONE,
  formatHour,
  keysToSlots,
  slotKey,
  slotsToKeys,
} from "@/lib/projectseed/schedule";
import type { PseedSlot } from "@/types/projectseed";

interface AvailabilityPickerProps {
  initialSlots: PseedSlot[];
}

/**
 * Weekly availability grid with drag-to-paint.
 *
 * Pointer events rather than mouse events so one code path covers trackpad and
 * touch; the grid sets `touch-action: none` so a drag paints cells instead of
 * scrolling the page. The paint mode is decided by the first cell you touch —
 * starting on a filled cell erases, starting on an empty one fills — which is
 * the behaviour every calendar app has trained people to expect.
 */
export function AvailabilityPicker({ initialSlots }: AvailabilityPickerProps) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(() =>
    slotsToKeys(initialSlots)
  );
  const [dirty, setDirty] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [saving, startSave] = useTransition();

  // Held in a ref, not state: the paint mode changes on every pointerdown and
  // is read during pointerenter. Re-rendering on it would fight the drag.
  const paintMode = useRef<"add" | "remove" | null>(null);

  const applyCell = useCallback((key: string) => {
    const mode = paintMode.current;
    if (!mode) return;

    setSelected((prev) => {
      const has = prev.has(key);
      if (mode === "add" ? has : !has) return prev;

      const next = new Set(prev);
      if (mode === "add") next.add(key);
      else next.delete(key);
      return next;
    });
    setDirty(true);
    setNotice(null);
  }, []);

  function startPaint(key: string) {
    paintMode.current = selected.has(key) ? "remove" : "add";
    applyCell(key);
  }

  function endPaint() {
    paintMode.current = null;
  }

  function handleSave() {
    setError(null);
    setNotice(null);

    startSave(async () => {
      const result = await saveAvailability(keysToSlots(selected));
      if (result.ok) {
        setDirty(false);
        setNotice("บันทึกเวลาแล้ว");
        router.refresh();
      } else {
        setError(result.error ?? "บันทึกไม่สำเร็จ");
      }
    });
  }

  function handleClear() {
    setSelected(new Set());
    setDirty(true);
    setNotice(null);
  }

  return (
    <section className="flex flex-col gap-5" aria-labelledby="picker-heading">
      <header className="flex flex-col gap-2">
        <h2 id="picker-heading" className="text-xl font-bold text-white">
          เวลาของคุณ
        </h2>
        <p className="text-sm leading-relaxed text-slate-300">
          ลากเพื่อเลือกชั่วโมงที่คุณเข้าห้องเสียงได้ในสัปดาห์ปกติ — เวลา
          {PSEED_TIMEZONE.replace("Asia/", " ")} ({selected.size} ชั่วโมง)
        </p>
      </header>

      <div
        className="overflow-x-auto"
        onPointerUp={endPaint}
        onPointerLeave={endPaint}
        onPointerCancel={endPaint}
      >
        <table
          className="w-full min-w-[420px] border-separate border-spacing-1 select-none"
          style={{ touchAction: "none" }}
        >
          <caption className="sr-only">
            เลือกชั่วโมงที่ว่างในแต่ละวันของสัปดาห์
          </caption>
          <thead>
            <tr>
              <th scope="col" className="w-12" />
              {PSEED_DAYS.map((day) => (
                <th
                  key={day.index}
                  scope="col"
                  className="pb-1 text-xs font-semibold text-slate-400"
                >
                  {day.short}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {PSEED_HOURS.map((hour) => (
              <tr key={hour}>
                <th
                  scope="row"
                  className="pr-2 text-right font-mono text-[10px] font-normal text-slate-500"
                >
                  {formatHour(hour)}
                </th>
                {PSEED_DAYS.map((day) => {
                  const key = slotKey(day.index, hour);
                  const on = selected.has(key);
                  return (
                    <td key={day.index} className="p-0">
                      <button
                        type="button"
                        aria-pressed={on}
                        aria-label={`${day.long} ${formatHour(hour)}`}
                        className={`h-7 w-full rounded-md transition-colors ${
                          on
                            ? "bg-blue-500/70 hover:bg-blue-400/80"
                            : "bg-white/[0.04] hover:bg-white/10"
                        }`}
                        onPointerDown={(event) => {
                          // Keeps the pointer stream on this element so
                          // pointerenter still fires on the cells we cross.
                          event.currentTarget.releasePointerCapture?.(
                            event.pointerId
                          );
                          startPaint(key);
                        }}
                        onPointerEnter={() => applyCell(key)}
                        onClick={(event) => event.preventDefault()}
                      />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {error ? (
        <p role="alert" className="text-sm text-rose-300">
          {error}
        </p>
      ) : null}
      {notice ? <p className="text-sm text-emerald-300">{notice}</p> : null}

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={handleSave}
          className="ei-button-dawn"
          disabled={saving || !dirty}
        >
          <span>{saving ? "กำลังบันทึก…" : "บันทึกเวลา"}</span>
        </button>

        <button
          type="button"
          onClick={handleClear}
          className="rounded-xl border border-white/15 px-5 py-3 text-sm font-semibold text-slate-200 transition-colors hover:border-white/30 disabled:opacity-50"
          disabled={saving || selected.size === 0}
        >
          ล้างทั้งหมด
        </button>
      </div>
    </section>
  );
}
