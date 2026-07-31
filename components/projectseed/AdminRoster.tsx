import type { PseedAdminRosterRow } from "@/lib/projectseed/admin";
import { summarizeRoster } from "@/lib/projectseed/admin";

interface AdminRosterProps {
  cohortName: string;
  rows: PseedAdminRosterRow[];
}

/**
 * The delivery view.
 *
 * Deliberately not a prettier version of the participant profile: the question
 * a batch runner asks is "who is stuck", and the answer is always a comparison
 * across people. So it is a table, and the columns that flag trouble — nobody
 * linked, no project, hours nobody shares — are styled to be findable by
 * scanning rather than by reading.
 */
export function AdminRoster({ cohortName, rows }: AdminRosterProps) {
  const totals = summarizeRoster(rows);

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-2 border-b border-white/10 pb-6">
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-amber-300">
          แอดมิน
        </p>
        <h1 className="text-3xl font-black tracking-tight text-white">
          {cohortName}
        </h1>
        <p className="text-sm text-slate-400">
          {totals.participants} คนในรุ่นนี้
        </p>
      </header>

      <section className="grid grid-cols-2 gap-y-6 rounded-2xl bg-slate-950/50 p-5 ring-1 ring-white/8 sm:grid-cols-4 sm:divide-x sm:divide-white/8">
        <Tally label="เชื่อม Discord" value={totals.linked} of={totals.participants} />
        <Tally label="มีโปรเจกต์" value={totals.withProject} of={totals.participants} />
        <Tally label="ส่งคำอธิบาย" value={totals.submitted} of={totals.participants} />
        <Tally label="เลือกเวลาแล้ว" value={totals.scheduled} of={totals.participants} />
      </section>

      {totals.alwaysAlone > 0 ? (
        <p className="rounded-xl bg-rose-500/10 px-4 py-3 text-sm text-rose-200 ring-1 ring-rose-400/30">
          {totals.alwaysAlone} คนเลือกเวลาไว้แต่ไม่มีชั่วโมงไหนที่ทับกับใครเลย —
          คนกลุ่มนี้จะนั่งทำคนเดียวจนกว่าจะมีคนย้ายมาทับ
        </p>
      ) : null}

      {rows.length === 0 ? (
        <p className="text-sm text-slate-400">ยังไม่มีใครเข้าร่วม</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-white/10 text-left">
                <Th>ชื่อ</Th>
                <Th>Discord</Th>
                <Th>โปรเจกต์</Th>
                <Th align="right">จอง</Th>
                <Th align="right">ทับกับคนอื่น</Th>
                <Th align="right">ชั่วโมงจริง</Th>
                <Th align="right">ตรงตามจอง</Th>
                <Th>แจ้งเตือน</Th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <RosterRow key={row.participant_id} row={row} />
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="text-xs leading-relaxed text-slate-500">
        “ชั่วโมงจริง” และ “ตรงตามจอง” มาจากบอทดิสคอร์ด — ถ้าบอทยังไม่รัน ทั้งสองคอลัมน์จะเป็น 0
        ซึ่งเป็นศูนย์จริง ไม่ใช่ค่าที่ยังไม่ได้โหลด
      </p>
    </div>
  );
}

function Tally({
  label,
  value,
  of,
}: {
  label: string;
  value: number;
  of: number;
}) {
  const complete = of > 0 && value === of;

  return (
    <div className="flex flex-col gap-1.5 px-1 sm:px-5">
      <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">
        {label}
      </span>
      <span
        className={`text-4xl font-black leading-none tabular-nums ${
          complete ? "text-emerald-300" : "text-white"
        }`}
      >
        {value}
        <span className="text-base font-bold text-slate-600">/{of}</span>
      </span>
    </div>
  );
}

function Th({
  children,
  align = "left",
}: {
  children: React.ReactNode;
  align?: "left" | "right";
}) {
  return (
    <th
      scope="col"
      className={`whitespace-nowrap px-3 py-2 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500 ${
        align === "right" ? "text-right" : "text-left"
      }`}
    >
      {children}
    </th>
  );
}

function RosterRow({ row }: { row: PseedAdminRosterRow }) {
  const hours = Math.floor(row.recorded_seconds / 3600);
  const alone = row.planned_slots > 0 && row.shared_slots === 0;

  return (
    <tr className="border-b border-white/6 align-top">
      <td className="px-3 py-3">
        <span className="font-bold text-white">
          {row.display_name ?? "ไม่ระบุชื่อ"}
        </span>
        <span className="block text-[11px] uppercase tracking-wider text-slate-600">
          {row.role}
        </span>
      </td>

      <td className="px-3 py-3">
        {row.discord_user_id ? (
          <span className="font-mono text-xs text-slate-300">
            @{row.discord_username ?? row.discord_user_id}
          </span>
        ) : (
          <span className="text-xs font-semibold text-amber-300">ยังไม่เชื่อม</span>
        )}
      </td>

      <td className="max-w-[16rem] px-3 py-3">
        {row.project_title ? (
          <>
            <span className="text-white">{row.project_title}</span>
            <span className="block text-[11px] text-slate-500">
              {row.brief_status === "submitted" ? "ส่งแล้ว" : "ฉบับร่าง"}
            </span>
            {row.tags.length > 0 ? (
              <span className="mt-0.5 block font-mono text-[11px] text-blue-200/70">
                {row.tags.map((t) => `#${t}`).join(" ")}
              </span>
            ) : null}
          </>
        ) : (
          <span className="text-xs font-semibold text-amber-300">ยังไม่เลือก</span>
        )}
      </td>

      <td className="px-3 py-3 text-right font-mono tabular-nums text-slate-300">
        {row.planned_slots}
      </td>

      <td
        className={`px-3 py-3 text-right font-mono tabular-nums ${
          alone ? "font-bold text-rose-300" : "text-slate-300"
        }`}
      >
        {row.shared_slots}
      </td>

      <td
        className={`px-3 py-3 text-right font-mono tabular-nums ${
          hours > 0 ? "text-amber-200" : "text-slate-600"
        }`}
      >
        {hours}
      </td>

      <td className="px-3 py-3 text-right font-mono tabular-nums text-slate-400">
        {row.kept_slot_count}
      </td>

      <td className="whitespace-nowrap px-3 py-3 text-[11px] text-slate-500">
        {[row.notify_channel ? "ห้อง" : null, row.notify_dm ? "DM" : null]
          .filter(Boolean)
          .join(" · ") || "ปิด"}
      </td>
    </tr>
  );
}
