import type { PseedAdminRosterRow } from "@/lib/projectseed/admin";
import { summarizeRoster } from "@/lib/projectseed/admin";
import {
  formatAttendance,
  formatLastSeen,
  getFlags,
  hasRoseFlag,
  needsAttention,
  sortRosterRows,
  type RowFlags,
} from "@/lib/projectseed/roster-utils";

interface AdminRosterProps {
  cohortName: string;
  rows: PseedAdminRosterRow[];
}

/**
 * The delivery view.
 *
 * Deliberately not a prettier version of the participant profile: the question
 * a batch runner asks is "who needs help right now", and it has to be readable
 * from a phone. So trouble is surfaced as explicit per-row flags that sort to
 * the top, the mobile layout is a card list, and the desktop table is a
 * tightened seven columns — with attendance, kept-ratio and last-seen finally
 * earning the place the data layer already fetched for them.
 */
export function AdminRoster({ cohortName, rows }: AdminRosterProps) {
  // force-dynamic page: one timestamp per request, shared by every row.
  const now = new Date();
  const totals = summarizeRoster(rows);
  const sortedRows = sortRosterRows(rows);
  const flaggedCount = rows.filter((row) =>
    needsAttention(getFlags(row))
  ).length;

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
          {flaggedCount > 0 && (
            <span className="text-rose-300">
              {" "}
              · {flaggedCount} คนต้องตามงาน
            </span>
          )}
        </p>
      </header>

      <section className="grid grid-cols-2 gap-y-6 rounded-2xl bg-slate-950/50 p-5 ring-1 ring-white/8 sm:grid-cols-5 sm:divide-x sm:divide-white/8">
        <Tally
          label="เชื่อม Discord"
          value={totals.linked}
          of={totals.participants}
        />
        <Tally
          label="มีโปรเจกต์"
          value={totals.withProject}
          of={totals.participants}
        />
        <Tally
          label="ส่งคำอธิบาย"
          value={totals.submitted}
          of={totals.participants}
        />
        <Tally
          label="เลือกเวลาแล้ว"
          value={totals.scheduled}
          of={totals.participants}
        />
        <Tally
          label="ชั่วโมงจริงรวม"
          value={totals.recordedHours}
          suffix="ชม."
          className="col-span-2 sm:col-span-1"
        />
      </section>

      {totals.alwaysAlone > 0 && (
        <p className="rounded-xl bg-rose-500/10 px-4 py-3 text-sm text-rose-200 ring-1 ring-rose-400/30">
          {totals.alwaysAlone}{" "}
          คนเลือกเวลาไว้แต่ไม่มีชั่วโมงไหนทับกับใครเลย —
          ดูแถวที่ไฮไลต์ไว้ด้านล่าง
        </p>
      )}

      {rows.length === 0 ? (
        <p className="text-sm text-slate-400">ยังไม่มีใครเข้าร่วม</p>
      ) : (
        <>
          {/* Phone: one card per person, flags under the name. */}
          <div className="flex flex-col gap-4 md:hidden">
            {sortedRows.map((row) => (
              <RosterCard key={row.participant_id} row={row} now={now} />
            ))}
          </div>

          {/* Desktop: a tightened table — chips live in the name cell. */}
          <div className="hidden md:block">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-white/10 text-left">
                  <Th>ชื่อ</Th>
                  <Th>Discord</Th>
                  <Th>โปรเจกต์</Th>
                  <Th align="right">เวลาที่เลือก</Th>
                  <Th align="right">ตรงตามจอง</Th>
                  <Th align="right">ชั่วโมงจริง</Th>
                  <Th>เข้าห้องล่าสุด</Th>
                </tr>
              </thead>
              <tbody>
                {sortedRows.map((row) => (
                  <RosterRow key={row.participant_id} row={row} now={now} />
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      <p className="text-xs leading-relaxed text-slate-500">
        ตัวเลข “ชั่วโมงจริง” “ตรงตามจอง” และ “เข้าห้องล่าสุด”
        มาจากบอทดิสคอร์ด — ถ้าบอทยังไม่รัน ค่าทั้งหมดจะเป็นศูนย์
        ซึ่งเป็นศูนย์จริง ไม่ใช่ค่าที่ยังไม่ได้โหลด
      </p>
    </div>
  );
}

/**
 * The RPC failed. This is not the empty roster — saying so plainly matters,
 * because the ready-with-zero-rows state means something different.
 */
export function AdminRosterError({ cohortName }: { cohortName: string }) {
  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-2 border-b border-white/10 pb-6">
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-amber-300">
          แอดมิน
        </p>
        <h1 className="text-3xl font-black tracking-tight text-white">
          {cohortName}
        </h1>
      </header>
      <div className="flex flex-col gap-2 rounded-xl bg-rose-500/10 px-4 py-4 ring-1 ring-rose-400/30">
        <p className="text-sm font-bold text-rose-200">โหลดรายชื่อไม่สำเร็จ</p>
        <p className="text-sm leading-relaxed text-rose-200/80">
          ระบบดึงข้อมูลของรุ่นนี้ไม่ได้ — ไม่ใช่เพราะยังไม่มีใครเข้าร่วม
          ลองรีเฟรชหน้านี้อีกครั้ง ถ้ายังไม่หายให้แจ้งทีมพัฒนา (รายละเอียดอยู่ใน
          server log: [projectseed] roster failed)
        </p>
      </div>
    </div>
  );
}

function Tally({
  label,
  value,
  of,
  suffix,
  className,
}: {
  label: string;
  value: number;
  of?: number;
  suffix?: string;
  className?: string;
}) {
  const complete = of !== undefined && of > 0 && value === of;

  return (
    <div className={`flex flex-col gap-1.5 px-1 sm:px-5 ${className ?? ""}`}>
      <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">
        {label}
      </span>
      <span
        className={`text-4xl font-black leading-none tabular-nums ${
          complete ? "text-emerald-300" : "text-white"
        }`}
      >
        {value}
        {of !== undefined && (
          <span className="text-base font-bold text-slate-600">/{of}</span>
        )}
        {suffix !== undefined && (
          <span className="text-base font-bold text-slate-600"> {suffix}</span>
        )}
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

function FlagChip({ label, tone }: { label: string; tone: "amber" | "rose" }) {
  return (
    <span
      className={`whitespace-nowrap rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ${
        tone === "rose"
          ? "bg-rose-500/10 text-rose-200 ring-rose-400/30"
          : "bg-amber-500/10 text-amber-200 ring-amber-400/25"
      }`}
    >
      {label}
    </span>
  );
}

/** Fixed order: noDiscord, noProject, alone, noShow. */
function FlagChips({ flags }: { flags: RowFlags }) {
  return (
    <>
      {flags.noDiscord && (
        <FlagChip label="ยังไม่เชื่อม Discord" tone="amber" />
      )}
      {flags.noProject && (
        <FlagChip label="ยังไม่เลือกโปรเจกต์" tone="amber" />
      )}
      {flags.alone && <FlagChip label="เวลาไม่ทับใครเลย" tone="rose" />}
      {flags.noShow && (
        <FlagChip label="จองไว้แต่ยังไม่เคยเข้าห้อง" tone="rose" />
      )}
    </>
  );
}

/** kept/planned — 0 kept against a real plan is the amber signal. */
function KeptRatio({ row }: { row: PseedAdminRosterRow }) {
  if (row.planned_slots === 0) {
    return <span className="text-slate-600">—</span>;
  }
  const missed = row.kept_slot_count === 0;
  return (
    <span
      className={
        missed ? "font-semibold text-amber-300" : "text-slate-300"
      }
    >
      {row.kept_slot_count}/{row.planned_slots}
    </span>
  );
}

function PlannedSlots({ row }: { row: PseedAdminRosterRow }) {
  if (row.planned_slots === 0) {
    return <span className="text-slate-600">—</span>;
  }
  return (
    <span className="text-slate-300">
      {row.planned_slots} ชม. · ทับ {row.shared_slots}
    </span>
  );
}

function ActualHours({ row }: { row: PseedAdminRosterRow }) {
  const attendance = formatAttendance(row.recorded_seconds, row.session_count);
  if (attendance === null) {
    return <span className="text-slate-600">—</span>;
  }
  return <span className="text-amber-200">{attendance}</span>;
}

function LastSeen({ row, now }: { row: PseedAdminRosterRow; now: Date }) {
  const lastSeen = formatLastSeen(row.last_seen_at, now);
  if (lastSeen === null) {
    return <span className="text-slate-600">—</span>;
  }
  return <>{lastSeen}</>;
}

function ProjectCell({ row }: { row: PseedAdminRosterRow }) {
  if (!row.project_title) {
    return (
      <span className="text-xs font-semibold text-amber-300">ยังไม่เลือก</span>
    );
  }
  return (
    <>
      <span className="block truncate text-white">{row.project_title}</span>
      <span className="block text-[11px] text-slate-500">
        {row.brief_status === "submitted" ? "ส่งแล้ว" : "ฉบับร่าง"}
      </span>
      {row.tags.length > 0 && (
        <span className="mt-0.5 block truncate font-mono text-[11px] text-blue-200/70">
          {row.tags.map((t) => `#${t}`).join(" ")}
        </span>
      )}
    </>
  );
}

function RosterCard({ row, now }: { row: PseedAdminRosterRow; now: Date }) {
  const flags = getFlags(row);
  const flagged = needsAttention(flags);
  const rose = hasRoseFlag(flags);

  return (
    <div
      className={`flex flex-col gap-3 rounded-2xl bg-slate-950/50 p-5 ring-1 ${
        rose ? "ring-rose-400/40" : "ring-white/10"
      }`}
    >
      <div className="flex flex-col gap-1.5">
        <div className="flex flex-wrap items-baseline gap-x-2">
          <span className="font-bold text-white">
            {row.display_name ?? "ไม่ระบุชื่อ"}
          </span>
          <span className="text-[11px] uppercase tracking-wider text-slate-500">
            {row.role}
          </span>
        </div>
        {flagged && (
          <div className="flex flex-wrap gap-1.5">
            <FlagChips flags={flags} />
          </div>
        )}
      </div>

      {row.project_title ? (
        <div>
          <p className="text-sm text-white">{row.project_title}</p>
          <p className="text-[11px] text-slate-500">
            {row.brief_status === "submitted" ? "ส่งแล้ว" : "ฉบับร่าง"}
          </p>
          {row.tags.length > 0 && (
            <p className="font-mono text-[11px] text-blue-200/70">
              {row.tags.map((t) => `#${t}`).join(" ")}
            </p>
          )}
        </div>
      ) : (
        <p className="text-xs font-semibold text-amber-300">
          ยังไม่เลือกโปรเจกต์
        </p>
      )}

      <dl className="grid grid-cols-2 gap-x-4 gap-y-3 border-t border-white/8 pt-3">
        <div>
          <dt className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">
            Discord
          </dt>
          <dd className="mt-0.5 text-sm">
            {row.discord_user_id ? (
              <span className="font-mono text-xs text-slate-300">
                @{row.discord_username ?? row.discord_user_id}
              </span>
            ) : (
              <span className="text-xs font-semibold text-amber-300">
                ยังไม่เชื่อม
              </span>
            )}
          </dd>
        </div>
        <div>
          <dt className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">
            เข้าห้องล่าสุด
          </dt>
          <dd className="mt-0.5 text-sm">
            <span className="text-slate-300">
              <LastSeen row={row} now={now} />
            </span>
          </dd>
        </div>
        <div>
          <dt className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">
            เวลาที่เลือก
          </dt>
          <dd className="mt-0.5 text-sm tabular-nums">
            <PlannedSlots row={row} />
          </dd>
        </div>
        <div>
          <dt className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">
            ตรงตามจอง
          </dt>
          <dd className="mt-0.5 text-sm tabular-nums">
            <KeptRatio row={row} />
          </dd>
        </div>
        <div>
          <dt className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">
            ชั่วโมงจริง
          </dt>
          <dd className="mt-0.5 text-sm tabular-nums">
            <ActualHours row={row} />
          </dd>
        </div>
      </dl>
    </div>
  );
}

function RosterRow({ row, now }: { row: PseedAdminRosterRow; now: Date }) {
  const flags = getFlags(row);
  const flagged = needsAttention(flags);
  const rose = hasRoseFlag(flags);

  return (
    <tr
      className={`border-b border-white/6 align-top ${
        rose ? "bg-rose-500/[0.06]" : ""
      }`}
    >
      <td className="px-3 py-3">
        <span className="font-bold text-white">
          {row.display_name ?? "ไม่ระบุชื่อ"}
        </span>
        <span className="block text-[11px] uppercase tracking-wider text-slate-600">
          {row.role}
        </span>
        {flagged && (
          <span className="mt-1.5 flex flex-wrap gap-1">
            <FlagChips flags={flags} />
          </span>
        )}
      </td>

      <td className="whitespace-nowrap px-3 py-3">
        {row.discord_user_id ? (
          <span className="font-mono text-xs text-slate-300">
            @{row.discord_username ?? row.discord_user_id}
          </span>
        ) : (
          <span className="text-xs font-semibold text-amber-300">
            ยังไม่เชื่อม
          </span>
        )}
      </td>

      <td className="max-w-[12rem] px-3 py-3">
        <ProjectCell row={row} />
      </td>

      <td className="whitespace-nowrap px-3 py-3 text-right tabular-nums">
        <PlannedSlots row={row} />
      </td>

      <td className="whitespace-nowrap px-3 py-3 text-right tabular-nums">
        <KeptRatio row={row} />
      </td>

      <td className="whitespace-nowrap px-3 py-3 text-right tabular-nums">
        <ActualHours row={row} />
      </td>

      <td className="whitespace-nowrap px-3 py-3 text-sm">
        <span className="text-slate-400">
          <LastSeen row={row} now={now} />
        </span>
      </td>
    </tr>
  );
}
