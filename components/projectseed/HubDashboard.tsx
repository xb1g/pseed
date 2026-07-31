import Link from "next/link";

import type {
  PseedHeatmapCell,
  PseedHubState,
  PseedSlotRosterEntry,
  PseedStep,
} from "@/types/projectseed";
import {
  PSEED_QUORUM,
  buildHeatmapLookup,
  describeSlot,
  groupRosterBySlot,
  hasQuorum,
  quorumSlots,
  slotKey,
  slotTopics,
} from "@/lib/projectseed/schedule";
import { buildBadges, formatRecordedTime } from "@/lib/projectseed/badges";

interface HubDashboardProps {
  hub: PseedHubState;
  steps: PseedStep[];
}

/**
 * A player profile, not a form.
 *
 * The audience grew up on character screens: a card with your name and rank, a
 * block of stats, a row of badges, a short quest list. That layout is legible
 * to them before they read a word of it, and it reframes the product honestly —
 * what you get out of this is a record of what you did, not a completed form.
 *
 * The discipline that keeps it from being a lie: every number here is measured,
 * and the ones that cannot be measured yet are shown as zero and marked, never
 * substituted with something easier to count.
 */
export function HubDashboard({ hub, steps }: HubDashboardProps) {
  const { participant, pick, mySlots, heatmap, roster, cohortTags, stats } = hub;

  const heat = buildHeatmapLookup(heatmap);
  const bySlot = groupRosterBySlot(roster);
  const roomSlots = quorumSlots(heatmap);
  const badges = buildBadges(hub);

  const sharedSlots = mySlots.filter((slot) =>
    hasQuorum(heat.count(slot.day, slot.hour))
  );

  const projectTitle = pick?.custom_title?.trim() || null;
  const remaining = steps.filter((step) => !step.done);
  const earned = badges.filter((b) => b.earned).length;

  return (
    <div className="flex flex-col gap-8">
      <PlayerCard
        name={participant.display_name}
        discordUsername={participant.discord_username}
        role={participant.role}
        cohortName={hub.cohort.name}
        earnedBadges={earned}
        totalBadges={badges.length}
      />

      <StatBlock
        recordedSeconds={stats.recorded_seconds}
        sessionCount={stats.session_count}
        keptSlots={stats.kept_slot_count}
        plannedSlots={mySlots.length}
        sharedSlots={sharedSlots.length}
      />

      {remaining.length > 0 ? <Quests steps={remaining} /> : null}

      <Badges badges={badges} />

      <div className="grid gap-4 lg:grid-cols-2">
        <ProjectCard
          title={projectTitle}
          tags={pick?.tags ?? []}
          submitted={pick?.status === "submitted"}
        />
        <RoomCard slots={roomSlots} bySlot={bySlot} />
      </div>

      {cohortTags.length > 0 ? <TopicsCard tags={cohortTags} /> : null}
    </div>
  );
}

function PlayerCard({
  name,
  discordUsername,
  role,
  cohortName,
  earnedBadges,
  totalBadges,
}: {
  name: string | null;
  discordUsername: string | null;
  role: string;
  cohortName: string;
  earnedBadges: number;
  totalBadges: number;
}) {
  const display = name ?? discordUsername ?? "ผู้เล่นใหม่";
  const initial = display.trim().charAt(0).toUpperCase() || "?";
  const pct = Math.round((earnedBadges / totalBadges) * 100);

  return (
    <section className="ei-card ei-card--lit flex flex-wrap items-center gap-5 p-6">
      <span
        aria-hidden="true"
        className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500/40 to-indigo-600/30 text-2xl font-black text-white ring-1 ring-white/20"
      >
        {initial}
      </span>

      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <h1 className="truncate text-2xl font-bold text-white">{display}</h1>
        <p className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
          <span className="rounded-full bg-amber-400/15 px-2 py-0.5 font-semibold uppercase tracking-wider text-amber-200">
            {role}
          </span>
          <span>{cohortName}</span>
          {discordUsername ? (
            <span className="font-mono text-slate-500">@{discordUsername}</span>
          ) : null}
        </p>
      </div>

      <div className="flex shrink-0 flex-col items-end gap-1.5">
        <span className="text-xs font-semibold uppercase tracking-[0.14em] text-blue-300/70">
          ตราสะสม
        </span>
        <span className="text-lg font-bold text-white">
          {earnedBadges}
          <span className="text-sm font-normal text-slate-500">/{totalBadges}</span>
        </span>
        <span className="h-1.5 w-24 overflow-hidden rounded-full bg-white/10">
          <span
            className="block h-full rounded-full bg-gradient-to-r from-blue-400 to-amber-300"
            style={{ width: `${pct}%` }}
          />
        </span>
      </div>
    </section>
  );
}

/**
 * The stat block leads with recorded hours even while that number is zero.
 *
 * Declared hours are the easy number and the misleading one — a week of
 * promises nobody kept looks identical to a week that worked. Putting the
 * measured number first, at zero, states which one counts.
 */
function StatBlock({
  recordedSeconds,
  sessionCount,
  keptSlots,
  plannedSlots,
  sharedSlots,
}: {
  recordedSeconds: number;
  sessionCount: number;
  keptSlots: number;
  plannedSlots: number;
  sharedSlots: number;
}) {
  const awaitingBot = recordedSeconds === 0 && sessionCount === 0;

  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-300/70">
        สถิติ
      </h2>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat
          label="ชั่วโมงในห้อง"
          value={formatRecordedTime(recordedSeconds)}
          hint={awaitingBot ? "เริ่มนับเมื่อบอทออนไลน์" : `${sessionCount} ครั้ง`}
          dim={awaitingBot}
        />
        <Stat
          label="ตรงตามที่จอง"
          value={String(keptSlots)}
          hint={awaitingBot ? "รอบอทดิสคอร์ด" : `จาก ${plannedSlots} ช่วง`}
          dim={awaitingBot}
        />
        <Stat
          label="เวลาที่จองไว้"
          value={String(plannedSlots)}
          hint="ชั่วโมงต่อสัปดาห์"
          href="/projectseed/hub/schedule"
        />
        <Stat
          label="มีคนอยู่ด้วย"
          value={String(sharedSlots)}
          hint={`ช่วงที่ถึง ${PSEED_QUORUM} คน`}
          href="/projectseed/hub/schedule"
        />
      </div>

      {awaitingBot ? (
        <p className="text-xs leading-relaxed text-slate-500">
          ชั่วโมงจริงจะถูกบันทึกอัตโนมัติเมื่อคุณเข้าห้องเสียงใน Discord
          ตอนนี้ยังไม่มีบอทคอยนับ ตัวเลขจึงเป็น 0 จริง ๆ ไม่ใช่ประมาณการ
        </p>
      ) : null}
    </section>
  );
}

function Stat({
  label,
  value,
  hint,
  href,
  dim,
}: {
  label: string;
  value: string;
  hint: string;
  href?: string;
  dim?: boolean;
}) {
  const body = (
    <>
      <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
        {label}
      </span>
      <span
        className={`text-3xl font-black tabular-nums ${
          dim ? "text-slate-500" : "text-white"
        }`}
      >
        {value}
      </span>
      <span className="text-[11px] text-slate-500">{hint}</span>
    </>
  );

  const className = "ei-card flex flex-col gap-0.5 p-4";

  return href ? (
    <Link
      href={href}
      className={`${className} transition-transform hover:-translate-y-0.5`}
    >
      {body}
    </Link>
  ) : (
    <div className={className}>{body}</div>
  );
}

function Quests({ steps }: { steps: PseedStep[] }) {
  return (
    <section className="ei-card flex flex-col gap-3 p-5">
      <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-amber-200/80">
        ภารกิจที่ยังเหลือ
      </h2>
      <ul className="flex flex-col gap-2">
        {steps.map((step) => (
          <li key={step.id}>
            <Link
              href={step.href}
              className="flex items-center gap-3 rounded-lg px-2 py-1.5 transition-colors hover:bg-white/5"
            >
              <span
                aria-hidden="true"
                className="h-1.5 w-1.5 shrink-0 rounded-full bg-amber-300"
              />
              <span className="flex min-w-0 flex-col">
                <span className="text-sm font-semibold text-white">
                  {step.label}
                </span>
                <span className="text-xs text-slate-400">{step.hint}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

function Badges({
  badges,
}: {
  badges: ReturnType<typeof buildBadges>;
}) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-300/70">
        ตราสะสม
      </h2>

      <ul className="grid grid-cols-3 gap-2 sm:grid-cols-5">
        {badges.map((badge) => (
          <li
            key={badge.id}
            title={badge.hint}
            className={`flex flex-col items-center gap-1.5 rounded-xl border p-3 text-center ${
              badge.earned
                ? "border-amber-300/30 bg-amber-400/10"
                : "border-white/8 bg-white/[0.02]"
            }`}
          >
            <span
              aria-hidden="true"
              className={`text-2xl ${badge.earned ? "" : "opacity-25 grayscale"}`}
            >
              {badge.icon}
            </span>
            <span
              className={`text-[11px] font-semibold leading-tight ${
                badge.earned ? "text-amber-100" : "text-slate-500"
              }`}
            >
              {badge.label}
            </span>
            {badge.locked && !badge.earned ? (
              <span className="text-[9px] uppercase tracking-wider text-slate-600">
                รอบอท
              </span>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  );
}

function ProjectCard({
  title,
  tags,
  submitted,
}: {
  title: string | null;
  tags: string[];
  submitted: boolean;
}) {
  return (
    <section className="ei-card flex flex-col gap-3 p-5">
      <div className="flex items-start justify-between gap-3">
        <h2 className="text-lg font-bold text-white">โปรเจกต์ของคุณ</h2>
        <Link
          href="/projectseed/hub/project"
          className="shrink-0 text-xs font-semibold text-blue-200 underline underline-offset-4"
        >
          {title ? "แก้ไข" : "เลือกเลย"}
        </Link>
      </div>

      {title ? (
        <>
          <p className="text-base text-white">{title}</p>
          {tags.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-blue-500/12 px-2.5 py-0.5 text-xs text-blue-200"
                >
                  {tag}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-400">
              ยังไม่มีแท็ก — ใส่ไว้แล้วคนที่ทำเรื่องเดียวกันจะเจอคุณ
            </p>
          )}
          <p className="text-xs text-slate-400">
            {submitted ? "ส่งคำอธิบายแล้ว" : "คำอธิบายยังเป็นฉบับร่าง"}
          </p>
        </>
      ) : (
        <p className="text-sm leading-relaxed text-slate-300">
          ยังไม่ได้เลือก เลือกหมวด พิมพ์ชื่อโปรเจกต์ แล้วใส่แท็กสัก 2–3 คำ
        </p>
      )}
    </section>
  );
}

function RoomCard({
  slots,
  bySlot,
}: {
  slots: PseedHeatmapCell[];
  bySlot: Map<string, PseedSlotRosterEntry[]>;
}) {
  return (
    <section className="ei-card flex flex-col gap-3 p-5">
      <div className="flex items-start justify-between gap-3">
        <h2 className="text-lg font-bold text-white">ห้องเปิดตอนไหน</h2>
        <Link
          href="/projectseed/hub/schedule"
          className="shrink-0 text-xs font-semibold text-blue-200 underline underline-offset-4"
        >
          ดูตาราง
        </Link>
      </div>

      {slots.length === 0 ? (
        <p className="text-sm leading-relaxed text-slate-300">
          ยังไม่มีช่วงไหนที่คนถึง {PSEED_QUORUM} คน — เลือกเวลาทับกับคนอื่นแล้วมันจะเริ่มมี
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {slots.slice(0, 3).map((cell) => {
            const key = slotKey(cell.day_of_week, cell.hour_of_day);
            const topics = slotTopics(bySlot.get(key) ?? []).slice(0, 3);

            return (
              <li key={key} className="flex flex-wrap items-baseline gap-x-2">
                <span className="text-sm font-medium text-white">
                  {describeSlot(cell)}
                </span>
                <span className="text-sm text-amber-200/80">
                  {cell.participant_count} คน
                </span>
                {topics.length > 0 ? (
                  <span className="text-xs text-slate-400">
                    · {topics.join(" · ")}
                  </span>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

function TopicsCard({
  tags,
}: {
  tags: { tag: string; participant_count: number }[];
}) {
  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-300/70">
        ห้องนี้กำลังทำอะไรอยู่
      </h2>
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
    </section>
  );
}
