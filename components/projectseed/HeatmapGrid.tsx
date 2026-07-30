import type { PseedHeatmapCell } from "@/types/projectseed";
import {
  PSEED_DAYS,
  PSEED_HOURS,
  buildHeatmapLookup,
  describeSlot,
  formatHour,
  heatLevel,
} from "@/lib/projectseed/schedule";

/**
 * Five discrete steps instead of an opacity ramp. With ~20 participants the
 * counts are single digits, and a continuous scale renders 2 and 3 as the same
 * colour — which is exactly the comparison someone picking a time is making.
 */
const HEAT_STYLES: Record<0 | 1 | 2 | 3 | 4, string> = {
  0: "bg-white/[0.03]",
  1: "bg-blue-500/20",
  2: "bg-blue-500/40",
  3: "bg-indigo-400/60",
  4: "bg-amber-300/80",
};

interface HeatmapGridProps {
  cells: PseedHeatmapCell[];
  participantCount: number;
}

export function HeatmapGrid({ cells, participantCount }: HeatmapGridProps) {
  const heat = buildHeatmapLookup(cells);
  const peaks = heat.peaks.slice(0, 3);

  return (
    <section className="flex flex-col gap-5" aria-labelledby="heatmap-heading">
      <header className="flex flex-col gap-2">
        <h2 id="heatmap-heading" className="text-xl font-bold text-white">
          เวลาของทั้งห้อง
        </h2>
        <p className="text-sm leading-relaxed text-slate-300">
          ยิ่งสว่าง ยิ่งมีคนอยู่เยอะ — เลือกช่องสว่างแล้วคุณจะไม่ได้นั่งทำคนเดียว
          ({participantCount} คนในรุ่นนี้)
        </p>
      </header>

      {cells.length === 0 ? (
        <p className="ei-card p-6 text-sm text-slate-300">
          ยังไม่มีใครเลือกเวลาเลย คุณเป็นคนแรกได้
        </p>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[420px] border-separate border-spacing-1">
              <caption className="sr-only">
                จำนวนคนที่ว่างในแต่ละช่วงเวลาของสัปดาห์
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
                      const count = heat.count(day.index, hour);
                      const level = heatLevel(count, heat.max);
                      return (
                        <td key={day.index} className="p-0">
                          <div
                            className={`h-6 rounded-md ${HEAT_STYLES[level]} ${
                              heat.mine(day.index, hour)
                                ? "ring-1 ring-inset ring-white/70"
                                : ""
                            }`}
                            title={`${day.long} ${formatHour(hour)} — ${count} คน`}
                          >
                            <span className="sr-only">
                              {day.long} {formatHour(hour)}: {count} คน
                            </span>
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Legend max={heat.max} />

          {peaks.length > 0 ? (
            <div className="ei-card flex flex-col gap-2 p-5">
              <h3 className="text-sm font-semibold text-white">
                ช่วงที่ห้องแน่นที่สุด
              </h3>
              <ul className="flex flex-col gap-1">
                {peaks.map((cell) => (
                  <li
                    key={`${cell.day_of_week}-${cell.hour_of_day}`}
                    className="text-sm text-slate-300"
                  >
                    {describeSlot(cell)}{" "}
                    <span className="text-blue-200">
                      · {cell.participant_count} คน
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </>
      )}
    </section>
  );
}

function Legend({ max }: { max: number }) {
  return (
    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
      <span>ว่างน้อย</span>
      <span className="flex gap-1">
        {([0, 1, 2, 3, 4] as const).map((level) => (
          <span key={level} className={`h-4 w-6 rounded ${HEAT_STYLES[level]}`} />
        ))}
      </span>
      <span>ว่างมาก (สูงสุด {max} คน)</span>
      <span className="flex items-center gap-1.5">
        <span className="h-4 w-6 rounded bg-white/[0.03] ring-1 ring-inset ring-white/70" />
        เวลาของคุณ
      </span>
    </div>
  );
}
