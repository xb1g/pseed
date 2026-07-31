"use client";

import { useMemo, useState } from "react";

import type {
  PseedHeatmapCell,
  PseedSlotRosterEntry,
  PseedTagCount,
} from "@/types/projectseed";
import {
  PSEED_DAYS,
  PSEED_FULL,
  PSEED_HOURS,
  PSEED_QUORUM,
  buildHeatmapLookup,
  describeSlot,
  formatHour,
  formatSlotRange,
  groupRosterBySlot,
  hasQuorum,
  heatLevel,
  quorumSlots,
  slotKey,
  slotTopics,
} from "@/lib/projectseed/schedule";

/**
 * Colour carries one message: is this slot worth joining. The jump to amber at
 * quorum is the only step that matters, so it is the only step that changes hue
 * rather than intensity.
 */
const HEAT_STYLES: Record<0 | 1 | 2 | 3 | 4, string> = {
  0: "bg-white/[0.03]",
  1: "bg-blue-500/15",
  2: "bg-blue-500/35",
  3: "bg-amber-400/60",
  4: "bg-amber-300/90",
};

interface HeatmapGridProps {
  cells: PseedHeatmapCell[];
  roster: PseedSlotRosterEntry[];
  participantCount: number;
  cohortTags?: PseedTagCount[];
}

export function HeatmapGrid({
  cells,
  roster,
  participantCount,
  cohortTags = [],
}: HeatmapGridProps) {
  const heat = useMemo(() => buildHeatmapLookup(cells), [cells]);
  const bySlot = useMemo(() => groupRosterBySlot(roster), [roster]);
  const worthJoining = useMemo(() => quorumSlots(cells), [cells]);

  const [openSlot, setOpenSlot] = useState<string | null>(null);
  const openEntries = openSlot ? bySlot.get(openSlot) ?? [] : [];

  return (
    <section className="flex flex-col gap-5" aria-labelledby="heatmap-heading">
      <header className="flex flex-col gap-2">
        <h2 id="heatmap-heading" className="text-xl font-bold text-white">
          เวลาของทั้งห้อง
        </h2>
        <p className="text-sm leading-relaxed text-slate-300">
          ห้องนี้อยู่บนออนไลน์ — {PSEED_QUORUM} คนขึ้นไปถึงจะรู้สึกเหมือนมีห้องจริง
          ช่องสีเหลืองคือช่วงที่ถึงจำนวนนั้นแล้ว กดที่ช่องเพื่อดูว่าใครอยู่และทำอะไร
          ({participantCount} คนในรุ่นนี้)
        </p>
      </header>

      {cells.length === 0 ? (
        <p className="ei-card p-6 text-sm text-slate-300">
          ยังไม่มีใครเลือกเวลาเลย คุณเป็นคนแรกได้
        </p>
      ) : (
        <>
          <WorthJoining slots={worthJoining} bySlot={bySlot} onOpen={setOpenSlot} />

          <div className="overflow-x-auto">
            <table className="w-full min-w-[420px] border-separate border-spacing-1">
              <caption className="sr-only">
                จำนวนคนที่ว่างในแต่ละช่วงเวลาของสัปดาห์ กดที่ช่องเพื่อดูรายชื่อ
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
                      const count = heat.count(day.index, hour);
                      const level = heatLevel(count);
                      const isOpen = openSlot === key;

                      return (
                        <td key={day.index} className="p-0">
                          <button
                            type="button"
                            onClick={() =>
                              setOpenSlot(isOpen || count === 0 ? null : key)
                            }
                            disabled={count === 0}
                            aria-expanded={isOpen}
                            className={`h-7 w-full rounded-md text-[10px] font-semibold tabular-nums transition-colors ${
                              HEAT_STYLES[level]
                            } ${
                              level >= 3 ? "text-amber-950" : "text-slate-300/70"
                            } ${
                              heat.mine(day.index, hour)
                                ? "ring-1 ring-inset ring-white/70"
                                : ""
                            } ${
                              isOpen ? "outline outline-2 outline-white" : ""
                            } ${count > 0 ? "hover:brightness-125" : ""}`}
                            title={`${day.long} ${formatSlotRange(hour)} — ${count} คน`}
                          >
                            {count > 0 ? count : ""}
                            <span className="sr-only">
                              {day.long} {formatHour(hour)}: {count} คน
                            </span>
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Legend />

          {openSlot ? (
            <SlotDetail
              slotKeyValue={openSlot}
              entries={openEntries}
              onClose={() => setOpenSlot(null)}
            />
          ) : null}

          {cohortTags.length > 0 ? <RoomTopics tags={cohortTags} /> : null}
        </>
      )}
    </section>
  );
}

/**
 * The grid answers "when is everyone free" but makes you scan for it. This
 * answers "when should I show up" directly, which is the actual question, and
 * is the only place a slot's topics appear without a click.
 */
function WorthJoining({
  slots,
  bySlot,
  onOpen,
}: {
  slots: PseedHeatmapCell[];
  bySlot: Map<string, PseedSlotRosterEntry[]>;
  onOpen: (key: string) => void;
}) {
  if (slots.length === 0) {
    return (
      <div className="ei-card flex flex-col gap-2 p-5">
        <h3 className="text-sm font-semibold text-white">
          ยังไม่มีช่วงไหนที่มีคนถึง {PSEED_QUORUM} คน
        </h3>
        <p className="text-sm leading-relaxed text-slate-300">
          ห้องยังไม่ก่อตัว ลองเลือกเวลาให้ตรงกับช่องที่มีคนอยู่บ้างแล้ว
          แทนที่จะเลือกช่องว่าง — นั่นคือวิธีที่ห้องเริ่มมีจริง
        </p>
      </div>
    );
  }

  return (
    <div className="ei-card flex flex-col gap-3 p-5">
      <h3 className="text-sm font-semibold text-white">ช่วงที่ควรมา</h3>
      <ul className="flex flex-col gap-2">
        {slots.slice(0, 4).map((cell) => {
          const key = slotKey(cell.day_of_week, cell.hour_of_day);
          const topics = slotTopics(bySlot.get(key) ?? []).slice(0, 4);

          return (
            <li key={key}>
              <button
                type="button"
                onClick={() => onOpen(key)}
                className="flex w-full flex-wrap items-baseline gap-x-2 gap-y-1 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-white/5"
              >
                <span className="text-sm font-medium text-white">
                  {describeSlot(cell)}
                </span>
                <span
                  className={
                    cell.participant_count >= PSEED_FULL
                      ? "text-sm font-semibold text-amber-300"
                      : "text-sm text-amber-200/80"
                  }
                >
                  {cell.participant_count} คน
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

/** Who is in the selected hour, and what each of them is building. */
function SlotDetail({
  slotKeyValue,
  entries,
  onClose,
}: {
  slotKeyValue: string;
  entries: PseedSlotRosterEntry[];
  onClose: () => void;
}) {
  const [day, hour] = slotKeyValue.split(":").map(Number);
  const dayLabel = PSEED_DAYS[day]?.long ?? "?";
  const quorum = hasQuorum(entries.length);

  return (
    <div className="ei-card ei-card--lit flex flex-col gap-4 p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h3 className="text-base font-bold text-white">
            {dayLabel} {formatSlotRange(hour)}
          </h3>
          <p className="text-sm text-slate-300">
            {entries.length} คน
            {quorum ? (
              <span className="text-amber-300"> · ถึงจำนวนแล้ว</span>
            ) : (
              <span className="text-slate-500">
                {" "}
                · อีก {PSEED_QUORUM - entries.length} คนถึงจะครบ
              </span>
            )}
          </p>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="shrink-0 rounded-full px-2 py-1 text-xs text-slate-400 transition-colors hover:bg-white/10 hover:text-white"
          aria-label="ปิด"
        >
          ปิด
        </button>
      </div>

      <ul className="flex flex-col divide-y divide-white/8">
        {entries.map((entry) => (
          <li
            key={entry.participant_id}
            className="flex flex-col gap-1 py-2.5 first:pt-0 last:pb-0"
          >
            <span className="flex flex-wrap items-baseline gap-2">
              <span className="text-sm font-semibold text-white">
                {entry.display_name ?? "ไม่ระบุชื่อ"}
              </span>
              {entry.is_me ? (
                <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-semibold text-slate-200">
                  คุณ
                </span>
              ) : null}
            </span>

            <span className="text-sm text-slate-300">
              {entry.project_title ?? (
                <span className="text-slate-500">ยังไม่ได้เลือกโปรเจกต์</span>
              )}
            </span>

            {entry.tags?.length ? (
              <span className="flex flex-wrap gap-1.5 pt-0.5">
                {entry.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-blue-500/12 px-2 py-0.5 text-xs text-blue-200"
                  >
                    {tag}
                  </span>
                ))}
              </span>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}

/** What the whole room is building — the shortcut to finding your people. */
function RoomTopics({ tags }: { tags: PseedTagCount[] }) {
  return (
    <div className="flex flex-col gap-2">
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

function Legend() {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-400">
      <span className="flex items-center gap-1.5">
        <span className={`h-4 w-6 rounded ${HEAT_STYLES[1]}`} />1 คน
      </span>
      <span className="flex items-center gap-1.5">
        <span className={`h-4 w-6 rounded ${HEAT_STYLES[2]}`} />2 คน
      </span>
      <span className="flex items-center gap-1.5">
        <span className={`h-4 w-6 rounded ${HEAT_STYLES[3]}`} />
        {PSEED_QUORUM}–{PSEED_FULL - 1} คน
      </span>
      <span className="flex items-center gap-1.5">
        <span className={`h-4 w-6 rounded ${HEAT_STYLES[4]}`} />
        {PSEED_FULL}+ คน
      </span>
      <span className="flex items-center gap-1.5">
        <span className="h-4 w-6 rounded bg-white/[0.03] ring-1 ring-inset ring-white/70" />
        เวลาของคุณ
      </span>
    </div>
  );
}
