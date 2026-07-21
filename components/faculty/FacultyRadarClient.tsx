"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { CSSProperties } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import type { FacultyTcasSummaries } from "@/lib/tcas/faculty-gallery";

type FacultyCard = {
  slug: string;
  title: string;
  titleTh: string;
  faculty: string;
  tags: string[];
  accent: string;
  gradient: string;
  summary: string;
  open: boolean;
};

const FACULTIES: FacultyCard[] = [
  {
    slug: "cs",
    title: "Computer Science",
    titleTh: "วิทยาการคอมพิวเตอร์",
    faculty: "Science / Computing",
    tags: ["Code", "Math", "Projects"],
    accent: "#37f2b2",
    gradient:
      "radial-gradient(circle at 78% 12%, #9aff82 0%, transparent 34%), radial-gradient(circle at 18% 28%, #37d8ff 0%, transparent 38%), linear-gradient(160deg, #071418 0%, #15342c 56%, #06100e 100%)",
    summary: "เหมาะกับคนที่อยากเข้าใจระบบ ซอฟต์แวร์ ข้อมูล และ AI ตั้งแต่ฐานคิด ไม่ใช่แค่ใช้เครื่องมือ",
    open: true,
  },
  {
    slug: "engineering",
    title: "Engineering",
    titleTh: "วิศวกรรมศาสตร์",
    faculty: "Engineering",
    tags: ["Physics", "Systems", "Lab"],
    accent: "#ffb84d",
    gradient:
      "radial-gradient(circle at 80% 8%, #ffe47a 0%, transparent 38%), linear-gradient(180deg, #3a2411 0%, #c66b18 62%, #0f0d0b 100%)",
    summary: "โลกของการแก้ปัญหาเชิงระบบ เครื่องมือ วัสดุ พลังงาน และการออกแบบให้ของจริงทำงานได้",
    open: false,
  },
  {
    slug: "medicine",
    title: "Medicine",
    titleTh: "แพทยศาสตร์",
    faculty: "Health Science",
    tags: ["Biology", "People", "Duty"],
    accent: "#ff6f91",
    gradient:
      "radial-gradient(circle at 82% 12%, #ffd6e0 0%, transparent 36%), linear-gradient(180deg, #481522 0%, #d83b67 58%, #170a0e 100%)",
    summary: "หนักทั้งเนื้อหา เวลา ความรับผิดชอบ และการทำงานกับคนจริงที่มีความเสี่ยงจริง",
    open: false,
  },
  {
    slug: "business",
    title: "Business",
    titleTh: "บริหารธุรกิจ",
    faculty: "Business",
    tags: ["Market", "People", "Numbers"],
    accent: "#facc15",
    gradient:
      "radial-gradient(circle at 20% 14%, #fff0a8 0%, transparent 34%), linear-gradient(145deg, #2f2610 0%, #9f7b10 56%, #151108 100%)",
    summary: "เรียนการตัดสินใจขององค์กร ลูกค้า เงิน กลยุทธ์ และการเล่าเรื่องให้คนเชื่อ",
    open: false,
  },
  {
    slug: "architecture",
    title: "Architecture",
    titleTh: "สถาปัตยกรรมศาสตร์",
    faculty: "Design + Built Environment",
    tags: ["Studio", "Space", "Critique"],
    accent: "#a78bfa",
    gradient:
      "radial-gradient(circle at 78% 18%, #d9ccff 0%, transparent 38%), linear-gradient(150deg, #21143f 0%, #6041a6 54%, #0e0918 100%)",
    summary: "อยู่กับสตูดิโอ งานยาว การรับ critique และการเปลี่ยนไอเดียให้กลายเป็นพื้นที่จริง",
    open: false,
  },
];

const FILTERS = ["ทั้งหมด", "STEM", "Health", "Business", "Design"] as const;

function matchesFilter(card: FacultyCard, filter: string) {
  if (filter === "ทั้งหมด") return true;
  const haystack = `${card.title} ${card.titleTh} ${card.faculty} ${card.tags.join(" ")}`.toLowerCase();
  if (filter === "STEM") return /science|computing|engineering|code|math|physics/.test(haystack);
  if (filter === "Health") return /health|medicine|biology|แพทย/.test(haystack);
  if (filter === "Business") return /business|market|บริหาร/.test(haystack);
  if (filter === "Design") return /design|architecture|studio|สถาปัต/.test(haystack);
  return true;
}

export function FacultyRadarClient({
  tcasSummaries,
}: {
  tcasSummaries: FacultyTcasSummaries;
}) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("ทั้งหมด");

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return FACULTIES.filter((card) => {
      const haystack = `${card.title} ${card.titleTh} ${card.faculty} ${card.tags.join(" ")} ${card.summary}`.toLowerCase();
      return matchesFilter(card, filter) && (!q || haystack.includes(q));
    });
  }, [filter, query]);

  return (
    <div className="faculty-radar-page min-h-screen">
      <section className="faculty-radar-hero">
        <div className="relative z-10 mx-auto max-w-7xl px-4 pb-10 pt-16 sm:px-6 md:pt-20 lg:px-8">
          <div className="mb-6 flex flex-wrap gap-2">
            <Link href="/radar" className="faculty-radar-mode">
              Career Radar
            </Link>
            <Link href="/faculty-radar" className="faculty-radar-mode faculty-radar-mode--active">
              Faculty Gallery
            </Link>
          </div>
          <h1 className="font-radar-title text-5xl font-normal leading-none tracking-normal text-white sm:text-6xl md:text-7xl lg:text-8xl">
            Faculty Gallery
          </h1>
          <p className="mt-4 max-w-3xl font-radar-body text-lg font-medium leading-relaxed text-white/85 sm:text-xl md:text-2xl">
            เลือกคณะจากสิ่งที่จะต้องเจอจริงข้างใน: วิชาที่หนัก งานที่ทำ วิธีสอบ
            เพื่อนร่วมทาง และสัญญาณว่าเราเหมาะกับสภาพแวดล้อมแบบนั้นไหม
          </p>
        </div>
      </section>

      <section className="faculty-radar-filter border-b border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:px-6 lg:px-8">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search faculties..."
              className="border-white/[0.12] bg-white/[0.06] pl-10 text-white placeholder:text-white/40 focus:border-emerald-300/50 focus:ring-emerald-300/20"
            />
          </div>
          <div className="flex min-w-0 gap-2 overflow-x-auto py-1">
            {FILTERS.map((item) => (
              <button
                key={item}
                onClick={() => setFilter(item)}
                aria-pressed={filter === item}
                className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition ${
                  filter === item
                    ? "border border-emerald-200/[0.36] bg-emerald-200/[0.16] text-emerald-50"
                    : "border border-white/10 bg-white/5 text-white/[0.62] hover:bg-white/10 hover:text-white"
                }`}
              >
                {item}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="faculty-radar-stage">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-4 px-4 pb-10 pt-8 sm:grid-cols-2 sm:px-6 lg:grid-cols-3 lg:px-8">
          {visible.map((card) => (
            <FacultyTile key={card.slug} card={card} tcasSummary={tcasSummaries[card.slug]} />
          ))}
        </div>
      </section>
    </div>
  );
}

function FacultyTile({
  card,
  tcasSummary,
}: {
  card: FacultyCard;
  tcasSummary?: FacultyTcasSummaries[string];
}) {
  const content = (
    <article
      className={`faculty-tile ${card.open ? "faculty-tile--open" : "faculty-tile--locked"}`}
      style={{ "--faculty-accent": card.accent, background: card.gradient } as CSSProperties}
    >
      <div className="faculty-tile__visual" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
      <div className="faculty-tile__content">
        <p>{card.faculty}</p>
        <h2>{card.title}</h2>
        <h3>{card.titleTh}</h3>
        <p className="faculty-tile__summary">{card.summary}</p>
        {tcasSummary && tcasSummary.programCount > 0 && (
          <div className="faculty-tile__tcas">
            <div>
              <span>TCAS programs</span>
              <strong>{tcasSummary.programCount.toLocaleString("th-TH")}</strong>
            </div>
            {tcasSummary.samplePrograms.length > 0 && (
              <p title={tcasSummary.samplePrograms.join(" · ")}>
                เช่น {tcasSummary.samplePrograms.join(" · ")}
              </p>
            )}
          </div>
        )}
        <div className="faculty-tile__tags">
          {card.tags.map((tag) => (
            <span key={tag}>{tag}</span>
          ))}
        </div>
      </div>
      {!card.open && <span className="faculty-tile__soon">Coming next</span>}
    </article>
  );

  if (!card.open) return content;

  return (
    <Link href={`/faculty-radar/${card.slug}`} className="block focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/60">
      {content}
    </Link>
  );
}
