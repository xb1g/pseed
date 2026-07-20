"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Check, FlaskConical, Sparkles } from "lucide-react";

import type { SeedPathlab } from "@/lib/my-path/pathlab-match";

interface StepPathlabsProps {
  seeds: SeedPathlab[];
  selectedIds: string[];
  matchedIds: string[];
  onToggle: (seed: SeedPathlab) => void;
  onOpenSeed: (seed: SeedPathlab) => void;
}

type TabId = "matched" | "all" | string;

function safeId(name: string) {
  return name.replace(/\s+/g, "-");
}

export function StepPathlabs({
  seeds,
  selectedIds,
  matchedIds,
  onToggle,
  onOpenSeed,
}: StepPathlabsProps) {
  const [activeTab, setActiveTab] = useState<TabId>(
    matchedIds.length > 0 ? "matched" : "all"
  );

  const categories = useMemo(
    () =>
      Array.from(
        new Set(
          seeds
            .map((seed) => seed.categoryName)
            .filter((name): name is string => Boolean(name))
        )
      ).sort(),
    [seeds]
  );

  const matchedSeeds = useMemo(
    () => seeds.filter((seed) => matchedIds.includes(seed.id)),
    [seeds, matchedIds]
  );

  const visibleSeeds = useMemo(() => {
    if (activeTab === "matched") return matchedSeeds;
    if (activeTab === "all") return seeds;
    return seeds.filter((seed) => seed.categoryName === activeTab);
  }, [activeTab, matchedSeeds, seeds]);

  const selectedCount = selectedIds.length;

  if (seeds.length === 0) {
    return (
      <section aria-labelledby="pathlabs-heading">
        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-indigo-200/70">
          ขั้นที่ 2 · ทดลอง
        </p>
        <h2
          id="pathlabs-heading"
          className="mt-2 font-kodchasan text-2xl font-semibold text-slate-50 sm:text-3xl"
        >
          ลองทำจริงใน PathLab
        </h2>
        <p className="mt-3 max-w-xl text-sm leading-6 text-slate-400">
          PathLab คือสนามทดลอง — ลงมือทำงานจริงไม่กี่วัน แล้วคุณจะรู้ว่าอะไรที่ชอบ
          และอะไรที่ถนัด ด้วยหลักฐาน ไม่ใช่ความรู้สึก
        </p>
        <div className="mt-8 border-y border-white/10 py-8 text-center">
          <p className="text-slate-300">PathLab กำลังเตรียมเปิดเร็วๆ นี้</p>
          <Link
            href="/seeds"
            className="mt-3 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-indigo-200 hover:text-indigo-100"
          >
            ดูกิจกรรมทั้งหมดใน Seeds <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section aria-labelledby="pathlabs-heading">
      <p className="text-xs font-semibold uppercase tracking-[0.15em] text-indigo-200/70">
        ขั้นที่ 2 · ทดลอง
      </p>
      <h2
        id="pathlabs-heading"
        className="mt-2 font-kodchasan text-2xl font-semibold text-slate-50 sm:text-3xl"
      >
        ลองทำจริงใน PathLab
      </h2>
      <p className="mt-3 max-w-xl text-sm leading-6 text-slate-400">
        PathLab คือสนามทดลอง — ลงมือทำงานจริงไม่กี่วัน แล้วคุณจะรู้ว่าอะไรที่ชอบ
        และอะไรที่ถนัด ด้วยหลักฐาน ไม่ใช่ความรู้สึก รีบก็ลองหลายอันพร้อมกันได้
        แต่สัญญากับตัวเองว่าจะเลือกอันที่ทำให้จบ
      </p>

      <div className="mt-6 flex flex-wrap gap-2" role="tablist" aria-label="กรอง PathLab">
        {matchedIds.length > 0 && (
          <TabButton
            id="matched"
            active={activeTab === "matched"}
            onClick={() => setActiveTab("matched")}
            icon={<Sparkles className="h-3.5 w-3.5" aria-hidden="true" />}
          >
            เหมาะกับคุณ
          </TabButton>
        )}
        <TabButton
          id="all"
          active={activeTab === "all"}
          onClick={() => setActiveTab("all")}
        >
          ทั้งหมด
        </TabButton>
        {categories.map((category) => (
          <TabButton
            key={category}
            id={category}
            active={activeTab === category}
            onClick={() => setActiveTab(category)}
          >
            {category}
          </TabButton>
        ))}
      </div>

      {activeTab === "matched" && matchedSeeds.length === 0 && (
        <p className="mt-6 text-sm text-slate-500">
          ยังไม่มี PathLab ที่ตรงกับสิ่งที่คุณเลือก ลองดูในทั้งหมด
        </p>
      )}

      <div className="mt-5 grid gap-3"
        id={`tabpanel-${safeId(activeTab)}`}
        role="tabpanel"
        aria-labelledby={`tab-${safeId(activeTab)}`}
      >
        {visibleSeeds.map((seed) => (
          <SeedCard
            key={seed.id}
            seed={seed}
            selected={selectedIds.includes(seed.id)}
            matched={matchedIds.includes(seed.id)}
            onToggle={() => onToggle(seed)}
            onOpenSeed={() => onOpenSeed(seed)}
          />
        ))}
      </div>

      {selectedCount > 1 && (
        <p className="mt-4 text-sm leading-6 text-amber-100/80">
          เลือกไว้ {selectedCount} อัน — เริ่มพร้อมกันได้ แต่อย่าลืมกติกา:
          ต้องมีอย่างน้อย 1 อันที่ทำจนจบ
        </p>
      )}
    </section>
  );
}

interface TabButtonProps {
  id: string;
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  icon?: React.ReactNode;
}

function TabButton({ id, active, onClick, children, icon }: TabButtonProps) {
  const buttonId = `tab-${safeId(id)}`;
  const panelId = `tabpanel-${safeId(id)}`;
  return (
    <button
      type="button"
      id={buttonId}
      role="tab"
      aria-selected={active}
      aria-controls={panelId}
      onClick={onClick}
      className={`inline-flex min-h-10 items-center gap-1.5 rounded-full border px-3.5 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200 ${
        active
          ? "border-amber-200/50 bg-amber-200/15 text-amber-100"
          : "border-white/10 bg-white/[0.04] text-slate-300 hover:bg-white/[0.08]"
      }`}
    >
      {icon}
      {children}
    </button>
  );
}

interface SeedCardProps {
  seed: SeedPathlab;
  selected: boolean;
  matched: boolean;
  onToggle: () => void;
  onOpenSeed: () => void;
}

function SeedCard({ seed, selected, matched, onToggle, onOpenSeed }: SeedCardProps) {
  return (
    <article
      className={`dawn-card flex flex-col overflow-hidden border p-3 sm:flex-row sm:items-start sm:gap-4 ${
        selected
          ? "border-amber-200/50 bg-amber-200/[0.07]"
          : "border-white/10 bg-white/[0.03]"
      }`}
    >
      <div className="relative aspect-[16/9] w-full shrink-0 overflow-hidden rounded-xl sm:aspect-square sm:w-28">
        {seed.coverImageUrl ? (
          <img
            src={seed.coverImageUrl}
            alt={`${seed.title} preview`}
            className="absolute inset-0 h-full w-full object-cover"
            loading="lazy"
            decoding="async"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-indigo-500/20 to-violet-500/20 text-indigo-200">
            <FlaskConical className="h-8 w-8" aria-hidden="true" />
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1 pt-2 sm:pt-1">
        <div className="flex flex-wrap items-center gap-2">
          {seed.categoryName && (
            <span className="rounded-full border border-white/10 bg-white/[0.05] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
              {seed.categoryName}
            </span>
          )}
          {seed.totalDays && (
            <span className="inline-flex items-center gap-1 text-[11px] text-slate-500">
              <FlaskConical className="h-3 w-3" aria-hidden="true" />
              {seed.totalDays} วัน
            </span>
          )}
          {matched && (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-200/10 px-2 py-0.5 text-[10px] font-semibold text-amber-100">
              <Sparkles className="h-3 w-3" aria-hidden="true" />
              ตรงกับสิ่งที่จุดไฟคุณ
            </span>
          )}
        </div>

        <h3 className="mt-2 font-kodchasan text-base font-semibold text-slate-50">
          {seed.title}
        </h3>

        {seed.description && (
          <p className="mt-1 line-clamp-2 text-sm leading-6 text-slate-400">
            {seed.description}
          </p>
        )}

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onToggle}
            aria-pressed={selected}
            className={`inline-flex min-h-10 items-center gap-2 rounded-xl border px-4 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200 ${
              selected
                ? "border-amber-200/60 bg-amber-200/15 text-amber-100"
                : "border-white/10 bg-white/[0.05] text-slate-200 hover:bg-white/[0.09]"
            }`}
          >
            {selected ? (
              <>
                <Check className="h-4 w-4" aria-hidden="true" /> เลือกแล้ว
              </>
            ) : (
              "เลือกอันนี้"
            )}
          </button>
          <Link
            href={`/seeds/${seed.id}`}
            onClick={onOpenSeed}
            className="inline-flex min-h-10 items-center gap-1.5 rounded-xl px-3 text-sm font-semibold text-indigo-200 hover:text-indigo-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200"
          >
            ดูรายละเอียด <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </article>
  );
}
