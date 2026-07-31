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

interface HubDashboardProps {
  hub: PseedHubState;
  steps: PseedStep[];
}

/**
 * The hub reads as a dashboard, not a wizard.
 *
 * A numbered checklist is honest for the first ten minutes and wrong for every
 * week after: someone who has already joined, picked, and set their hours is
 * returning to find out what the room is doing, and a "step 1 of 4" frame tells
 * them the product is a form. What is unfinished still surfaces — as one line
 * near the bottom, not as the spine of the page.
 */
export function HubDashboard({ hub, steps }: HubDashboardProps) {
  const { participant, pick, mySlots, heatmap, roster, cohortTags } = hub;

  const heat = buildHeatmapLookup(heatmap);
  const bySlot = groupRosterBySlot(roster);
  const roomSlots = quorumSlots(heatmap);

  // Slots the participant declared that also reached quorum: the hours they
  // will not be sitting alone in. This is the number that says whether their
  // schedule is working, which no other view answers.
  const myGoodSlots = mySlots
    .map((slot) => ({
      slot,
      count: heat.count(slot.day, slot.hour),
    }))
    .filter(({ count }) => hasQuorum(count))
    .sort((a, b) => b.count - a.count);

  const projectTitle = pick?.custom_title?.trim() || null;
  const remaining = steps.filter((step) => !step.done);

  return (
    <div className="flex flex-col gap-8">
      <section className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold leading-tight text-white sm:text-3xl">
          {participant.display_name
            ? `สวัสดี ${participant.display_name}`
            : "ยินดีต้อนรับเข้าห้อง"}
        </h1>
        <p className="text-base leading-relaxed text-slate-300">
          {roomSlots.length > 0
            ? `มี ${roomSlots.length} ช่วงในสัปดาห์นี้ที่ห้องมีคนถึง ${PSEED_QUORUM} คนขึ้นไป`
            : "ห้องยังไม่ก่อตัว — เลือกเวลาให้ตรงกับคนอื่นคือวิธีที่มันเริ่ม"}
        </p>
      </section>

      <div className="grid gap-3 sm:grid-cols-3">
        <StatTile
          label="คนในรุ่น"
          value={String(hub.participantCount)}
          hint={`${countLinked(hub)} คนเชื่อม Discord แล้ว`}
        />
        <StatTile
          label="ชั่วโมงของคุณ"
          value={String(mySlots.length)}
          hint={
            mySlots.length === 0
              ? "ยังไม่ได้เลือกเวลา"
              : `${myGoodSlots.length} ช่วงที่มีคนอยู่ด้วย`
          }
          href="/projectseed/hub/schedule"
        />
        <StatTile
          label="โปรเจกต์"
          value={pick?.status === "submitted" ? "ส่งแล้ว" : projectTitle ? "ร่าง" : "—"}
          hint={projectTitle ?? "ยังไม่ได้เลือก"}
          href="/projectseed/hub/project"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ProjectCard
          title={projectTitle}
          tags={pick?.tags ?? []}
          submitted={pick?.status === "submitted"}
        />
        <RoomCard slots={roomSlots} bySlot={bySlot} />
      </div>

      <MyHoursCard
        totalSlots={mySlots.length}
        goodSlots={myGoodSlots.map(({ slot, count }) => ({
          label: describeSlot({
            day_of_week: slot.day,
            hour_of_day: slot.hour,
            participant_count: count,
            includes_me: true,
          }),
          count,
        }))}
      />

      {cohortTags.length > 0 ? <TopicsCard tags={cohortTags} /> : null}

      {remaining.length > 0 ? <RemainingSetup steps={remaining} /> : null}
    </div>
  );
}

function countLinked(hub: PseedHubState): number {
  // The roster only contains people who declared hours, so this counts the
  // participant themselves plus anyone visible there — an undercount by design
  // rather than a second query for a number shown as context.
  const linked = new Set<string>();
  if (hub.participant.discord_user_id) linked.add(hub.participant.id);
  for (const entry of hub.roster) linked.add(entry.participant_id);
  return linked.size;
}

function StatTile({
  label,
  value,
  hint,
  href,
}: {
  label: string;
  value: string;
  hint: string;
  href?: string;
}) {
  const body = (
    <>
      <span className="text-xs font-semibold uppercase tracking-[0.14em] text-blue-300/70">
        {label}
      </span>
      <span className="text-2xl font-bold text-white">{value}</span>
      <span className="text-xs text-slate-400">{hint}</span>
    </>
  );

  const className = "ei-card flex flex-col gap-1 p-4";

  return href ? (
    <Link href={href} className={`${className} transition-transform hover:-translate-y-0.5`}>
      {body}
    </Link>
  ) : (
    <div className={className}>{body}</div>
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
          ดูทั้งหมด
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

function MyHoursCard({
  totalSlots,
  goodSlots,
}: {
  totalSlots: number;
  goodSlots: { label: string; count: number }[];
}) {
  return (
    <section className="ei-card flex flex-col gap-3 p-5">
      <div className="flex items-start justify-between gap-3">
        <h2 className="text-lg font-bold text-white">เวลาของคุณ</h2>
        <Link
          href="/projectseed/hub/schedule"
          className="shrink-0 text-xs font-semibold text-blue-200 underline underline-offset-4"
        >
          {totalSlots > 0 ? "แก้ไข" : "เลือกเวลา"}
        </Link>
      </div>

      {totalSlots === 0 ? (
        <p className="text-sm leading-relaxed text-slate-300">
          ยังไม่ได้บอกว่าว่างตอนไหน — นี่คือสิ่งเดียวที่ทำให้เจอคนอื่นได้
        </p>
      ) : goodSlots.length === 0 ? (
        <p className="text-sm leading-relaxed text-slate-300">
          เลือกไว้ {totalSlots} ชั่วโมง แต่ยังไม่มีช่วงไหนที่คนอื่นอยู่ด้วยถึง{" "}
          {PSEED_QUORUM} คน ลองย้ายมาทับกับช่วงที่ห้องเปิด
        </p>
      ) : (
        <>
          <p className="text-sm text-slate-300">
            {goodSlots.length} จาก {totalSlots} ชั่วโมงของคุณมีคนอยู่ด้วย
          </p>
          <ul className="flex flex-col gap-1">
            {goodSlots.slice(0, 3).map((slot) => (
              <li key={slot.label} className="text-sm text-slate-300">
                {slot.label}{" "}
                <span className="text-amber-200/80">· {slot.count} คน</span>
              </li>
            ))}
          </ul>
        </>
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
      <h2 className="text-sm font-semibold text-white">ห้องนี้กำลังทำอะไรอยู่</h2>
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

function RemainingSetup({ steps }: { steps: PseedStep[] }) {
  return (
    <section className="flex flex-col gap-2 border-t border-white/8 pt-5">
      <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
        ยังไม่เสร็จ
      </h2>
      <ul className="flex flex-wrap gap-2">
        {steps.map((step) => (
          <li key={step.id}>
            <Link
              href={step.href}
              className="inline-flex items-center gap-2 rounded-full border border-white/12 px-3 py-1.5 text-sm text-slate-200 transition-colors hover:border-white/30 hover:text-white"
            >
              {step.label}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
