"use client";

import { useCallback, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { saveAvailability } from "@/actions/projectseed";
import {
  PSEED_DAYS,
  PSEED_HOURS,
  PSEED_OPTIMAL_MAX,
  PSEED_OPTIMAL_MIN,
  SLOT_QUALITY_LABEL,
  buildHeatmapLookup,
  formatHour,
  formatSlotRange,
  groupRosterBySlot,
  heatLevel,
  keysToSlots,
  rankedSlots,
  slotKey,
  slotQuality,
  slotTopics,
  slotsToKeys,
} from "@/lib/projectseed/schedule";
import type {
  PseedHeatmapCell,
  PseedSlot,
  PseedSlotRosterEntry,
  PseedTagCount,
} from "@/types/projectseed";

/**
 * Colour = how full the hour is. Blue means workable, amber means the 3-to-5
 * band worth steering toward, orange means a crowd — still fine, just no longer
 * the recommendation.
 */
const HEAT_STYLES: Record<0 | 1 | 2 | 3 | 4, string> = {
  0: "bg-white/[0.03]",
  1: "bg-blue-500/20",
  2: "bg-blue-500/45",
  3: "bg-amber-300/90",
  // A crowd is still fine, so it stays warm — but it steps back from the
  // optimal band rather than reading as "even better".
  4: "bg-orange-500/60",
};

interface ScheduleBoardProps {
  initialSlots: PseedSlot[];
  cells: PseedHeatmapCell[];
  roster: PseedSlotRosterEntry[];
  participantCount: number;
  cohortTags?: PseedTagCount[];
}

/**
 * One grid, two jobs: paint your own hours, and read the room's.
 *
 * They were two separate tables — your empty grid above an identical grid of
 * everyone else's — which meant choosing a time required holding two pictures
 * in your head and matching them by eye. That is exactly the work the feature
 * exists to remove. Here the cell you click is the cell that shows who is
 * already in it.
 *
 * Hover (or tap, or keyboard focus) fills a fixed panel below the grid rather
 * than a floating tooltip: the panel cannot be clipped by the scroll container,
 * cannot fight the drag gesture, and works identically on touch, where hover
 * does not exist.
 */
export function ScheduleBoard({
  initialSlots,
  cells,
  roster,
  participantCount,
  cohortTags = [],
}: ScheduleBoardProps) {
  const router = useRouter();

  const [selected, setSelected] = useState<Set<string>>(() =>
    slotsToKeys(initialSlots)
  );
  const [dirty, setDirty] = useState(false);
  const [focusedSlot, setFocusedSlot] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [saving, startSave] = useTransition();

  const heat = useMemo(() => buildHeatmapLookup(cells), [cells]);
  const bySlot = useMemo(() => groupRosterBySlot(roster), [roster]);
  const roomSlots = useMemo(() => rankedSlots(cells), [cells]);

  // Paint mode lives in a ref: it is set on pointerdown and read on
  // pointerenter, and re-rendering on it would fight the drag.
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

  return (
    <section className="flex flex-col gap-5" aria-labelledby="schedule-heading">
      <header className="flex flex-col gap-2">
        <h2 id="schedule-heading" className="text-xl font-bold text-white">
          ตารางเวลา
        </h2>
        <p className="text-sm leading-relaxed text-slate-300">
          ลากเพื่อเลือกชั่วโมงที่คุณเข้าห้องเสียงได้ สีของช่องคือจำนวนคนทั้งห้อง —
          สองคนก็ทำงานด้วยกันได้แล้ว {PSEED_OPTIMAL_MIN}–{PSEED_OPTIMAL_MAX} คนกำลังดี
          ({participantCount} คนในรุ่นนี้)
        </p>
      </header>

      <RoomSummary slots={roomSlots} bySlot={bySlot} onFocus={setFocusedSlot} />

      <div
        className="overflow-x-auto"
        onPointerUp={endPaint}
        onPointerLeave={endPaint}
        onPointerCancel={endPaint}
      >
        <table
          className="w-full min-w-[440px] border-separate border-spacing-1 select-none"
          style={{ touchAction: "none" }}
        >
          <caption className="sr-only">
            ตารางเวลาประจำสัปดาห์ — ลากเพื่อเลือกเวลาของคุณ
            ชี้หรือแตะที่ช่องเพื่อดูว่าใครอยู่และทำอะไร
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
                  const mine = selected.has(key);
                  const count = heat.count(day.index, hour);

                  // The cohort count already includes this participant's saved
                  // slots. Unsaved edits are reflected optimistically so the
                  // colour does not lag a drag by one save.
                  const savedMine = heat.mine(day.index, hour);
                  const liveCount = Math.max(
                    0,
                    count + (mine ? 1 : 0) - (savedMine ? 1 : 0)
                  );

                  return (
                    <td key={day.index} className="p-0">
                      <button
                        type="button"
                        aria-pressed={mine}
                        aria-label={`${day.long} ${formatSlotRange(hour)} — ${liveCount} คน`}
                        className={`h-8 w-full rounded-md text-[10px] font-semibold tabular-nums transition-[filter,box-shadow] ${
                          HEAT_STYLES[heatLevel(liveCount)]
                        } ${
                          heatLevel(liveCount) >= 3
                            ? "text-amber-950"
                            : "text-slate-300/70"
                        } ${
                          mine
                            ? "ring-2 ring-inset ring-white shadow-[0_0_12px_rgba(255,255,255,0.25)]"
                            : ""
                        } ${
                          focusedSlot === key ? "outline outline-2 outline-blue-300" : ""
                        } hover:brightness-125`}
                        onPointerDown={(event) => {
                          event.currentTarget.releasePointerCapture?.(
                            event.pointerId
                          );
                          startPaint(key);
                          setFocusedSlot(key);
                        }}
                        onPointerEnter={() => {
                          applyCell(key);
                          // Only follow the pointer for inspection when not
                          // mid-drag, so painting does not thrash the panel.
                          if (!paintMode.current) setFocusedSlot(key);
                        }}
                        onFocus={() => setFocusedSlot(key)}
                        onClick={(event) => event.preventDefault()}
                      >
                        {liveCount > 0 ? liveCount : ""}
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Legend mine={selected.size} />

      <SlotPanel slotKeyValue={focusedSlot} bySlot={bySlot} />

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
          onClick={() => {
            setSelected(new Set());
            setDirty(true);
            setNotice(null);
          }}
          className="rounded-xl border border-white/15 px-5 py-3 text-sm font-semibold text-slate-200 transition-colors hover:border-white/30 disabled:opacity-50"
          disabled={saving || selected.size === 0}
        >
          ล้างทั้งหมด
        </button>

        {dirty ? (
          <span className="text-xs text-amber-200/80">ยังไม่ได้บันทึก</span>
        ) : null}
      </div>

      {cohortTags.length > 0 ? <RoomTopics tags={cohortTags} /> : null}
    </section>
  );
}

/**
 * The grid holds the answer to "when is everyone free" but makes you scan for
 * it. This states it, and doubles as a way to jump the panel to a slot without
 * hunting for the cell.
 */
function RoomSummary({
  slots,
  bySlot,
  onFocus,
}: {
  slots: PseedHeatmapCell[];
  bySlot: Map<string, PseedSlotRosterEntry[]>;
  onFocus: (key: string) => void;
}) {
  if (slots.length === 0) {
    return (
      <div className="ei-card flex flex-col gap-2 p-5">
        <h3 className="text-sm font-semibold text-white">
          ยังไม่มีใครเลือกเวลาเลย
        </h3>
        <p className="text-sm leading-relaxed text-slate-300">
          เลือกชั่วโมงของคุณก่อน แล้วคนที่มาทีหลังจะเห็นว่ามีคนอยู่ตรงไหน
        </p>
      </div>
    );
  }

  return (
    <div className="ei-card flex flex-col gap-3 p-5">
      <h3 className="text-sm font-semibold text-white">ช่วงที่มีคนอยู่</h3>
      <ul className="flex flex-col gap-1.5">
        {slots.slice(0, 5).map((cell) => {
          const key = slotKey(cell.day_of_week, cell.hour_of_day);
          const topics = slotTopics(bySlot.get(key) ?? []).slice(0, 4);
          const quality = slotQuality(cell.participant_count);

          return (
            <li key={key}>
              <button
                type="button"
                onMouseEnter={() => onFocus(key)}
                onFocus={() => onFocus(key)}
                onClick={() => onFocus(key)}
                className="flex w-full flex-wrap items-baseline gap-x-2 gap-y-1 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-white/5"
              >
                <span className="text-sm font-medium text-white">
                  {PSEED_DAYS[cell.day_of_week]?.long}{" "}
                  {formatSlotRange(cell.hour_of_day)}
                </span>
                <span className="text-sm text-slate-300">
                  {cell.participant_count} คน
                </span>
                <span
                  className={
                    quality === "optimal"
                      ? "rounded-full bg-amber-400/20 px-2 py-0.5 text-[11px] font-semibold text-amber-200"
                      : "text-[11px] text-slate-500"
                  }
                >
                  {SLOT_QUALITY_LABEL[quality]}
                </span>
                {topics.length > 0 ? (
                  <span className="text-xs text-slate-400">
                    · {topics.join(" · ")}
                  </span>
                ) : null}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/**
 * Fixed-height so the page does not jump as the pointer crosses the grid. An
 * empty state occupies the same space as a full one.
 */
function SlotPanel({
  slotKeyValue,
  bySlot,
}: {
  slotKeyValue: string | null;
  bySlot: Map<string, PseedSlotRosterEntry[]>;
}) {
  if (!slotKeyValue) {
    return (
      <div className="ei-card ei-card--static flex min-h-[7.5rem] items-center justify-center p-5">
        <p className="text-sm text-slate-400">
          ชี้หรือแตะที่ช่องในตาราง เพื่อดูว่าใครอยู่ช่วงนั้นและกำลังทำอะไร
        </p>
      </div>
    );
  }

  const [day, hour] = slotKeyValue.split(":").map(Number);
  const entries = bySlot.get(slotKeyValue) ?? [];
  const quality = slotQuality(entries.length);

  return (
    <div className="ei-card ei-card--lit flex min-h-[7.5rem] flex-col gap-3 p-5">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <h3 className="text-base font-bold text-white">
          {PSEED_DAYS[day]?.long} {formatSlotRange(hour)}
        </h3>
        <p className="text-sm text-slate-300">
          {entries.length} คน
          {entries.length === 0 ? null : (
            <span
              className={
                quality === "optimal" ? "text-amber-300" : "text-slate-500"
              }
            >
              {" "}
              · {SLOT_QUALITY_LABEL[quality]}
              {/*
                Only nudge when the gap is genuinely small. Telling someone in a
                one-person slot they need two more reads as a rejection of the
                slot they just looked at; telling a pair they are one away reads
                as an invitation.
              */}
              {quality === "works"
                ? ` · อีก ${PSEED_OPTIMAL_MIN - entries.length} คนจะกำลังดี`
                : ""}
            </span>
          )}
        </p>
      </div>

      {entries.length === 0 ? (
        <p className="text-sm text-slate-400">
          ยังไม่มีใครเลือกช่วงนี้ — เลือกแล้วคุณจะเป็นคนแรก
        </p>
      ) : (
        <ul className="flex flex-col divide-y divide-white/8">
          {entries.map((entry) => (
            <li
              key={entry.participant_id}
              className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 py-2 first:pt-0 last:pb-0"
            >
              <span className="text-sm font-semibold text-white">
                {entry.display_name ?? "ไม่ระบุชื่อ"}
              </span>
              {entry.is_me ? (
                <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-semibold text-slate-200">
                  คุณ
                </span>
              ) : null}
              <span className="text-sm text-slate-300">
                {entry.project_title ?? (
                  <span className="text-slate-500">ยังไม่ได้เลือกโปรเจกต์</span>
                )}
              </span>
              {entry.tags?.length ? (
                <span className="text-xs text-blue-200/80">
                  {entry.tags.map((t) => `#${t}`).join(" ")}
                </span>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function RoomTopics({ tags }: { tags: PseedTagCount[] }) {
  return (
    <div className="flex flex-col gap-2 border-t border-white/8 pt-5">
      <h3 className="text-sm font-semibold text-white">ห้องนี้กำลังทำอะไรอยู่</h3>
      <div className="flex flex-wrap gap-2">
        {tags.slice(0, 16).map((t) => (
          <span
            key={t.tag}
            className="rounded-full border border-white/10 px-2.5 py-1 text-xs text-slate-200"
          >
            {t.tag}
            <span className="ml-1.5 text-slate-500">{t.participant_count}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

function Legend({ mine }: { mine: number }) {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-400">
      <span className="flex items-center gap-1.5">
        <span className={`h-4 w-6 rounded ${HEAT_STYLES[1]}`} />1 คน
      </span>
      <span className="flex items-center gap-1.5">
        <span className={`h-4 w-6 rounded ${HEAT_STYLES[2]}`} />2 คน · ได้อยู่
      </span>
      <span className="flex items-center gap-1.5">
        <span className={`h-4 w-6 rounded ${HEAT_STYLES[3]}`} />
        {PSEED_OPTIMAL_MIN}–{PSEED_OPTIMAL_MAX} คน · กำลังดี
      </span>
      <span className="flex items-center gap-1.5">
        <span className={`h-4 w-6 rounded ${HEAT_STYLES[4]}`} />
        {PSEED_OPTIMAL_MAX + 1}+ คน
      </span>
      <span className="flex items-center gap-1.5">
        <span className="h-4 w-6 rounded bg-white/[0.03] ring-2 ring-inset ring-white" />
        เวลาของคุณ ({mine})
      </span>
    </div>
  );
}
