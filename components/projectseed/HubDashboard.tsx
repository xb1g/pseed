import Link from "next/link";

import type {
  PseedHeatmapCell,
  PseedHubState,
  PseedSlotRosterEntry,
  PseedStep,
} from "@/types/projectseed";
import {
  SLOT_QUALITY_LABEL,
  buildHeatmapLookup,
  describeSlot,
  groupRosterBySlot,
  isOptimal,
  isWorthJoining,
  rankedSlots,
  slotKey,
  slotQuality,
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
 * The audience grew up on character screens: a name and rank at the top, a row
 * of numbers, a shelf of badges. That layout is legible before a word of it is
 * read, and it reframes the product honestly — what you get out of this is a
 * record of what you did, not a completed form.
 *
 * Two rules hold it together. Every number is measured, and the ones that
 * cannot be measured yet are shown as zero and marked, never substituted with
 * something easier to count. And the page is built from ink on a dark ground —
 * hairlines, type weight, and a single warm accent — rather than from stacked
 * cards. Cards on a blue field give every element the same visual weight, which
 * is the opposite of what a stat screen is for.
 */
export function HubDashboard({ hub, steps }: HubDashboardProps) {
  const { participant, pick, mySlots, heatmap, roster, cohortTags, stats } = hub;

  const heat = buildHeatmapLookup(heatmap);
  const bySlot = groupRosterBySlot(roster);
  const roomSlots = rankedSlots(heatmap);
  const badges = buildBadges(hub);

  const sharedSlots = mySlots.filter((slot) =>
    isWorthJoining(heat.count(slot.day, slot.hour))
  );
  const optimalSlots = mySlots.filter((slot) =>
    isOptimal(heat.count(slot.day, slot.hour))
  );

  const projectTitle = pick?.custom_title?.trim() || null;
  const remaining = steps.filter((step) => !step.done);
  const earned = badges.filter((b) => b.earned).length;

  return (
    <div className="flex flex-col gap-10">
      <PlayerCard
        name={participant.display_name}
        discordUsername={participant.discord_username}
        role={participant.role}
        cohortName={hub.cohort.name}
        earnedBadges={earned}
        totalBadges={badges.length}
      />

      <StatStrip
        recordedSeconds={stats.recorded_seconds}
        sessionCount={stats.session_count}
        keptSlots={stats.kept_slot_count}
        plannedSlots={mySlots.length}
        sharedSlots={sharedSlots.length}
        optimalSlots={optimalSlots.length}
      />

      {remaining.length > 0 ? <Quests steps={remaining} /> : null}

      <BadgeShelf badges={badges} />

      <div className="grid gap-x-10 gap-y-8 lg:grid-cols-2">
        <ProjectPanel
          title={projectTitle}
          tags={pick?.tags ?? []}
          submitted={pick?.status === "submitted"}
        />
        <RoomPanel slots={roomSlots} bySlot={bySlot} />
      </div>

      {cohortTags.length > 0 ? <TopicsRow tags={cohortTags} /> : null}
    </div>
  );
}

/** Section heading — small caps and one hairline. No card, no blue. */
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="flex items-center gap-3 text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500">
      {children}
      <span aria-hidden="true" className="h-px flex-1 bg-white/8" />
    </h2>
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
    <section className="flex flex-wrap items-center gap-x-5 gap-y-4 border-b border-white/10 pb-7">
      {/*
        Warm, not blue. The page sits on a blue-violet sky, so an accent drawn
        from the same family dissolves into it — and the avatar and the badge
        meter are the two things that must not.
      */}
      <span
        aria-hidden="true"
        className="flex h-[4.5rem] w-[4.5rem] shrink-0 items-center justify-center rounded-full bg-slate-950 text-3xl font-black text-amber-200 ring-2 ring-amber-300/50 shadow-[0_0_28px_rgba(252,211,77,0.18)]"
      >
        {initial}
      </span>

      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <h1 className="truncate text-3xl font-black leading-none tracking-tight text-white sm:text-4xl">
          {display}
        </h1>
        <p className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-slate-400">
          <span className="font-bold uppercase tracking-[0.16em] text-amber-300">
            {role}
          </span>
          <span aria-hidden="true" className="text-slate-700">
            /
          </span>
          <span>{cohortName}</span>
          {discordUsername ? (
            <>
              <span aria-hidden="true" className="text-slate-700">
                /
              </span>
              <span className="font-mono text-slate-500">@{discordUsername}</span>
            </>
          ) : null}
        </p>
      </div>

      <div className="flex shrink-0 flex-col items-end gap-2">
        <span className="text-2xl font-black leading-none tabular-nums text-white">
          {earnedBadges}
          <span className="text-base font-bold text-slate-600">/{totalBadges}</span>
        </span>
        <span className="h-[3px] w-28 overflow-hidden rounded-full bg-white/10">
          <span
            className="block h-full rounded-full bg-amber-300"
            style={{ width: `${pct}%` }}
          />
        </span>
        <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">
          ตราสะสม
        </span>
      </div>
    </section>
  );
}

/**
 * One strip divided by hairlines rather than four cards.
 *
 * Four bordered boxes give four numbers identical weight and turn the most
 * important row on the page into a grid of grey rectangles. Dropping the
 * borders lets type size do the ranking, which is what type size is for.
 *
 * Recorded hours lead even while that number is zero: declared hours are the
 * easy number and the misleading one — a week of promises nobody kept looks
 * identical to a week that worked.
 */
function StatStrip({
  recordedSeconds,
  sessionCount,
  keptSlots,
  plannedSlots,
  sharedSlots,
  optimalSlots,
}: {
  recordedSeconds: number;
  sessionCount: number;
  keptSlots: number;
  plannedSlots: number;
  sharedSlots: number;
  optimalSlots: number;
}) {
  const awaitingBot = recordedSeconds === 0 && sessionCount === 0;

  return (
    <section className="flex flex-col gap-4">
      <SectionLabel>สถิติ</SectionLabel>

      <div className="grid grid-cols-2 gap-y-6 rounded-2xl bg-slate-950/50 p-5 ring-1 ring-white/8 sm:grid-cols-4 sm:divide-x sm:divide-white/8">
        <Stat
          label="ชั่วโมงในห้อง"
          value={formatRecordedTime(recordedSeconds)}
          hint={awaitingBot ? "รอบอทดิสคอร์ด" : `${sessionCount} ครั้ง`}
          dim={awaitingBot}
          accent
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
          hint={
            optimalSlots > 0 ? `${optimalSlots} ช่วงกำลังดี` : "อย่างน้อย 2 คน"
          }
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
  accent,
}: {
  label: string;
  value: string;
  hint: string;
  href?: string;
  dim?: boolean;
  accent?: boolean;
}) {
  const body = (
    <>
      <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">
        {label}
      </span>
      <span
        className={`text-4xl font-black leading-none tabular-nums ${
          dim ? "text-slate-700" : accent ? "text-amber-200" : "text-white"
        }`}
      >
        {value}
      </span>
      <span className="text-[11px] text-slate-500">{hint}</span>
    </>
  );

  return href ? (
    <Link href={href} className="group flex flex-col px-1 sm:px-5">
      <span className="flex flex-col gap-1.5 transition-transform group-hover:-translate-y-0.5">
        {body}
      </span>
    </Link>
  ) : (
    <div className="flex flex-col gap-1.5 px-1 sm:px-5">{body}</div>
  );
}

function Quests({ steps }: { steps: PseedStep[] }) {
  return (
    <section className="flex flex-col gap-4">
      <SectionLabel>ภารกิจที่ยังเหลือ</SectionLabel>

      <ul className="flex flex-col">
        {steps.map((step) => (
          <li key={step.id} className="border-b border-white/6 last:border-0">
            <Link href={step.href} className="group flex items-center gap-3.5 py-3">
              <span
                aria-hidden="true"
                className="h-2 w-2 shrink-0 rotate-45 bg-amber-300"
              />
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="text-sm font-bold text-white">{step.label}</span>
                <span className="text-xs text-slate-500">{step.hint}</span>
              </span>
              <span
                aria-hidden="true"
                className="shrink-0 text-slate-600 transition-transform group-hover:translate-x-0.5 group-hover:text-amber-200"
              >
                →
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

/**
 * Medallions, not tiles. Round shapes on a page of rectangles are the one place
 * the eye should catch, and an unearned badge is a dark disc rather than an
 * outlined box — visible enough to want, quiet enough to ignore.
 */
function BadgeShelf({ badges }: { badges: ReturnType<typeof buildBadges> }) {
  return (
    <section className="flex flex-col gap-4">
      <SectionLabel>ตราสะสม</SectionLabel>

      <ul className="flex flex-wrap gap-5">
        {badges.map((badge) => (
          <li
            key={badge.id}
            title={badge.hint}
            className="flex w-[4.5rem] flex-col items-center gap-2 text-center"
          >
            <span
              aria-hidden="true"
              className={`flex h-14 w-14 items-center justify-center rounded-full text-2xl ${
                badge.earned
                  ? "bg-amber-300/15 shadow-[0_0_18px_rgba(252,211,77,0.15)] ring-1 ring-amber-300/50"
                  : "bg-slate-950/60 opacity-30 ring-1 ring-white/6 grayscale"
              }`}
            >
              {badge.icon}
            </span>
            <span
              className={`text-[10px] font-bold leading-tight ${
                badge.earned ? "text-amber-100" : "text-slate-600"
              }`}
            >
              {badge.label}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function ProjectPanel({
  title,
  tags,
  submitted,
}: {
  title: string | null;
  tags: string[];
  submitted: boolean;
}) {
  return (
    <section className="flex flex-col gap-3">
      <SectionLabel>โปรเจกต์ของคุณ</SectionLabel>

      {title ? (
        <>
          <p className="text-xl font-bold leading-snug text-white">{title}</p>

          {tags.length > 0 ? (
            <div className="flex flex-wrap gap-x-3 gap-y-1 font-mono text-xs text-blue-200/80">
              {tags.map((tag) => (
                <span key={tag}>#{tag}</span>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-500">
              ยังไม่มีแท็ก — ใส่ไว้แล้วคนที่ทำเรื่องเดียวกันจะเจอคุณ
            </p>
          )}

          <p className="flex items-center gap-2 text-xs">
            <span
              aria-hidden="true"
              className={`h-1.5 w-1.5 rounded-full ${
                submitted ? "bg-emerald-400" : "bg-amber-300"
              }`}
            />
            <span className="text-slate-400">
              {submitted ? "ส่งคำอธิบายแล้ว" : "คำอธิบายยังเป็นฉบับร่าง"}
            </span>
          </p>
        </>
      ) : (
        <p className="text-sm leading-relaxed text-slate-400">
          ยังไม่ได้เลือก เลือกหมวด พิมพ์ชื่อโปรเจกต์ แล้วใส่แท็กสัก 2–3 คำ
        </p>
      )}

      <Link
        href="/projectseed/hub/project"
        className="self-start text-xs font-bold uppercase tracking-[0.12em] text-amber-200 transition-colors hover:text-amber-100"
      >
        {title ? "แก้ไข →" : "เลือกเลย →"}
      </Link>
    </section>
  );
}

function RoomPanel({
  slots,
  bySlot,
}: {
  slots: PseedHeatmapCell[];
  bySlot: Map<string, PseedSlotRosterEntry[]>;
}) {
  return (
    <section className="flex flex-col gap-3">
      <SectionLabel>ห้องเปิดตอนไหน</SectionLabel>

      {slots.length === 0 ? (
        <p className="text-sm leading-relaxed text-slate-400">
          ยังไม่มีใครเลือกเวลาเลย — เลือกของคุณก่อน แล้วคนอื่นจะเห็นว่ามาตรงไหนได้
        </p>
      ) : (
        <ul className="flex flex-col">
          {slots.slice(0, 3).map((cell) => {
            const key = slotKey(cell.day_of_week, cell.hour_of_day);
            const topics = slotTopics(bySlot.get(key) ?? []).slice(0, 3);
            const quality = slotQuality(cell.participant_count);

            return (
              <li
                key={key}
                className="flex flex-wrap items-baseline gap-x-2.5 gap-y-0.5 border-b border-white/6 py-2 last:border-0"
              >
                <span className="text-sm font-bold text-white">
                  {describeSlot(cell)}
                </span>
                <span className="font-mono text-sm tabular-nums text-slate-400">
                  {cell.participant_count}
                </span>
                <span
                  className={
                    quality === "optimal"
                      ? "text-[11px] font-bold text-amber-300"
                      : "text-[11px] text-slate-600"
                  }
                >
                  {SLOT_QUALITY_LABEL[quality]}
                </span>
                {topics.length > 0 ? (
                  <span className="font-mono text-[11px] text-slate-600">
                    {topics.map((t) => `#${t}`).join(" ")}
                  </span>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}

      <Link
        href="/projectseed/hub/schedule"
        className="self-start text-xs font-bold uppercase tracking-[0.12em] text-amber-200 transition-colors hover:text-amber-100"
      >
        ดูตาราง →
      </Link>
    </section>
  );
}

function TopicsRow({
  tags,
}: {
  tags: { tag: string; participant_count: number }[];
}) {
  return (
    <section className="flex flex-col gap-4">
      <SectionLabel>ห้องนี้กำลังทำอะไรอยู่</SectionLabel>

      <div className="flex flex-wrap gap-x-4 gap-y-2">
        {tags.slice(0, 16).map((t) => (
          <span key={t.tag} className="font-mono text-sm text-slate-300">
            #{t.tag}
            <span className="ml-1 text-xs tabular-nums text-slate-600">
              {t.participant_count}
            </span>
          </span>
        ))}
      </div>
    </section>
  );
}
