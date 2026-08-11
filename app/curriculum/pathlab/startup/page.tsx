import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PathLabIntentRecorder } from "@/components/radar/PathLabIntentRecorder";
import { DELIVERABLE_ONE, SHIPPED_BAR } from "@/lib/projectseed/offer";

/**
 * Startup PathLab — the trial stage of radar -> pathlab -> projectseed -> talent.
 *
 * Backward-designed from ProjectSeed's Deliverable #1 (a one-page problem
 * statement plus three real conversations). Day 1 of this lab *is* that
 * deliverable, so a student who finishes here arrives at ProjectSeed already
 * past its first checkpoint instead of starting from zero.
 *
 * Deliberately not a sales page: `IS_OPEN_FOR_SALE` is false and safeguarding
 * §11 forbids offering a seat, so the only onward action here is a link to
 * /projectseed, which owns that conversation and every number in it.
 */

const TERRITORY_HREF = "/radar/territory/business-how-money-works";

export const metadata: Metadata = {
  title: "Startup PathLab — ลองทำแปดงานที่ทำให้ธุรกิจมีเงินเข้า",
  description:
    "ห้าวัน ลองทำงานจริงของคนที่ทำให้ธุรกิจเดินได้ แล้วเลือกว่าจะเริ่มจากอันไหน",
};

type Day = {
  n: number;
  skill: string;
  skillSlug: string;
  roles: string[];
  doing: string;
  handIn: string;
};

const DAYS: Day[] = [
  {
    n: 1,
    skill: "อ่านว่าคนอยากได้อะไร",
    skillSlug: "demand-judgment",
    roles: ["ผู้จัดการหมวดสินค้า", "คนกันลูกค้าหาย"],
    doing:
      "ไปคุยกับคนสามคนที่เจอปัญหาเดียวกัน จดคำพูดเขาแบบคำต่อคำ ห้ามสรุปเป็นภาษาตัวเอง เพราะพอสรุปแล้วคุณจะได้ยินแต่สิ่งที่อยากได้ยิน",
    handIn: "บันทึกคำพูดสามคน และปัญหาหนึ่งข้อที่เขียนได้ในหนึ่งหน้า",
  },
  {
    n: 2,
    skill: "คิดเป็นตัวเลข",
    skillSlug: "quantitative-reasoning",
    roles: ["นักวิเคราะห์ราคา", "นักวางแผนอุปสงค์"],
    doing:
      "ตั้งราคาสามแบบ แล้วกลับไปถามคนเดิมว่าอันไหนที่เขาจ่ายจริง ไม่ใช่อันไหนที่เขาชอบ จากนั้นหาว่าต้องมีคนซื้อกี่คนถึงจะไม่ขาดทุน",
    handIn: "ราคาหนึ่งตัว พร้อมเหตุผลที่เป็นตัวเลข ไม่ใช่ความรู้สึก",
  },
  {
    n: 3,
    skill: "ทดลองแล้ววัดผล",
    skillSlug: "experimentation",
    roles: ["โกรทมาร์เก็ตเตอร์"],
    doing:
      "ทำสองเวอร์ชั่นของโพสต์หรือหน้าเดียว ปล่อยจริงทั้งคู่ วัดว่าอันไหนคนสนใจมากกว่า แล้วปิดตัวที่แพ้ทิ้ง รวมถึงตัวที่คุณภูมิใจกว่า",
    handIn: "ตัวเลขจริงสองชุด และชื่อเวอร์ชั่นที่ตัดทิ้ง",
  },
  {
    n: 4,
    skill: "เล่าให้คนเชื่อ",
    skillSlug: "storytelling",
    roles: ["นักวางกลยุทธ์แบรนด์", "พาร์ตเนอร์ชิป / BD"],
    doing:
      "เขียนประโยคเดียวที่บอกว่าคุณทำอะไรให้ใคร แล้วให้คนที่ไม่รู้เรื่องอ่าน ถ้าเขาต้องถามต่อว่าแปลว่าอะไร แปลว่ายังไม่ผ่าน เขียนใหม่",
    handIn: "ประโยคเดียวที่ผ่านคนแปลกหน้าสามคนโดยไม่ต้องอธิบายเพิ่ม",
  },
  {
    n: 5,
    skill: "การต่อรอง",
    skillSlug: "negotiation",
    roles: ["เทรดมาร์เก็ตติ้ง", "พาร์ตเนอร์ชิป / BD"],
    doing:
      "ขอสิ่งหนึ่งจากคนจริงหนึ่งคน จะเป็นพื้นที่ ราคา เวลา หรือความช่วยเหลือก็ได้ แล้วรับคำตอบ ไม่ว่าจะได้หรือไม่ได้ การถูกปฏิเสธหนึ่งครั้งคือผลงานที่ผ่านแล้ว",
    handIn: "คำขอหนึ่งครั้ง และคำตอบที่ได้จริง",
  },
];

function FunnelStrip() {
  const stages = [
    { label: "Radar", sub: "รู้ว่ามีงานอะไรอยู่", href: "/radar", current: false },
    { label: "PathLab", sub: "ลองทำจริงห้าวัน", href: null, current: true },
    { label: "ProjectSeed", sub: "ทำจนเสร็จ 16 สัปดาห์", href: "/projectseed", current: false },
    { label: "Talent", sub: "มีคนจ้างจริง", href: "/talent", current: false },
  ];

  return (
    <ol className="flex flex-wrap items-stretch gap-2 text-sm">
      {stages.map((stage) => {
        const body = (
          <>
            <span className="block font-semibold">{stage.label}</span>
            <span className="mt-0.5 block text-xs text-neutral-500">{stage.sub}</span>
          </>
        );

        return (
          <li key={stage.label} className="flex-1 basis-36">
            {stage.href ? (
              <Link
                href={stage.href}
                className="block h-full rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2 text-neutral-400 transition-colors hover:bg-white/[0.06] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
              >
                {body}
              </Link>
            ) : (
              <div className="h-full rounded-lg border border-amber-400/40 bg-amber-400/10 px-3 py-2 text-amber-100">
                {body}
              </div>
            )}
          </li>
        );
      })}
    </ol>
  );
}

function DayCard({ day }: { day: Day }) {
  return (
    <article className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:p-6">
      <header className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-300">
          วันที่ {day.n}
        </span>
        <h3 className="text-xl font-bold text-white sm:text-2xl">{day.skill}</h3>
      </header>

      <p className="mt-3 text-xs text-neutral-500">
        งานที่ได้ลองเป็น: <span className="text-neutral-300">{day.roles.join(" · ")}</span>
      </p>

      <p className="mt-4 text-base leading-relaxed text-neutral-200">{day.doing}</p>

      <p className="mt-4 border-l-2 border-amber-400/60 pl-3 text-sm leading-relaxed text-neutral-400">
        <span className="font-semibold text-neutral-300">ส่งอะไร:</span> {day.handIn}
      </p>

      <Link
        href={`/radar/skills/${day.skillSlug}`}
        className="mt-4 inline-flex min-h-11 items-center gap-1.5 text-sm text-amber-300 transition-colors hover:text-amber-200"
      >
        ทักษะนี้ไปโผล่ที่งานไหนอีก
        <ArrowRight className="h-4 w-4" />
      </Link>
    </article>
  );
}

export default function StartupPathLabCurriculum() {
  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#020617_0%,#0f172a_46%,#111827_100%)] text-white">
      <PathLabIntentRecorder
        fieldSlug="startup-founder"
        pathSlug="startup"
        buttonLabel="startup-pathlab-curriculum"
      />

      <div className="mx-auto w-full max-w-2xl px-5 pb-24 pt-10 sm:pt-16">
        <Link
          href={TERRITORY_HREF}
          className="inline-flex min-h-11 items-center text-sm text-neutral-500 transition-colors hover:text-neutral-300"
        >
          ← ธุรกิจทำเงินยังไง
        </Link>

        <header className="mt-4">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-300">
            Startup PathLab
          </p>
          <h1 className="mt-3 text-4xl font-bold leading-tight sm:text-5xl">
            ห้าวัน ลองทำแปดงานนั้นจริง
          </h1>
          <p className="mt-4 text-base leading-relaxed text-neutral-400 sm:text-lg">
            ไม่ใช่คลาสเรียนว่าธุรกิจคืออะไร แต่ละวันคุณได้ลงมือทำงานจริงของคนที่ทำให้ธุรกิจเดินได้
            แบบเล็กๆ วันละอย่าง จบห้าวันคุณจะรู้ว่าอยากเริ่มจากงานไหน
            เพราะได้ลองมาแล้ว ไม่ใช่เพราะอ่านเจอ
          </p>
        </header>

        <section className="mt-8">
          <FunnelStrip />
        </section>

        <section className="mt-12 space-y-4">
          {DAYS.map((day) => (
            <DayCard key={day.n} day={day} />
          ))}
        </section>

        <section className="mt-12 rounded-2xl border border-rose-400/30 bg-rose-500/[0.07] p-5 sm:p-7">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-rose-300">
            แล้ว &ldquo;ผู้ก่อตั้ง&rdquo; อยู่ตรงไหน
          </p>
          <h2 className="mt-3 text-2xl font-bold sm:text-3xl">
            ห้าวันที่ผ่านมา คุณเพิ่งทำครบทั้งแปดงาน แบบห่วยๆ
          </h2>
          <p className="mt-4 text-base leading-relaxed text-neutral-300">
            นั่นแหละคือคำตอบ ผู้ก่อตั้งไม่ใช่ตำแหน่งที่สมัครได้
            มันคือสภาพที่ไม่มีใครทำแปดงานนี้แทนคุณ
            คนที่ทำได้ดีไม่ได้เก่งทั้งแปดอย่าง แค่รู้ว่าตัวเองห่วยตรงไหน แล้วหาคนมาเติม
          </p>
        </section>

        <section className="mt-12">
          <h2 className="text-2xl font-bold">จบแล้วไปไหนต่อ</h2>
          <p className="mt-3 text-base leading-relaxed text-neutral-400">
            สิ่งที่คุณส่งในวันที่ 1 คือด่านแรกของ ProjectSeed พอดี
            เท่ากับเข้าไปแล้วไม่ต้องเริ่มจากศูนย์
          </p>

          <div className="mt-5 rounded-xl border border-white/10 bg-white/[0.03] p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-500">
              ด่านแรกของ ProjectSeed (ภายในวันที่ {DELIVERABLE_ONE.dueDayOfProgramme})
            </p>
            <ul className="mt-3 space-y-2">
              {DELIVERABLE_ONE.parts.map((part) => (
                <li key={part} className="flex gap-2 text-sm leading-relaxed text-neutral-300">
                  <span className="text-amber-300" aria-hidden>
                    ✓
                  </span>
                  {part}
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.03] p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-500">
              เกณฑ์ว่า &ldquo;ทำเสร็จ&rdquo; แปลว่าอะไร
            </p>
            <ul className="mt-3 space-y-2">
              {SHIPPED_BAR.map((bar) => (
                <li key={bar} className="flex gap-2 text-sm leading-relaxed text-neutral-300">
                  <span className="text-amber-300" aria-hidden>
                    ✓
                  </span>
                  {bar}
                </li>
              ))}
            </ul>
          </div>

          <Link
            href="/projectseed"
            className="mt-6 inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-white px-6 text-sm font-semibold text-neutral-950 transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
          >
            ดู ProjectSeed
            <ArrowRight className="h-4 w-4" />
          </Link>
        </section>
      </div>
    </main>
  );
}
