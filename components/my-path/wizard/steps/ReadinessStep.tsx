"use client";

import { Briefcase, Check, Compass, Rocket } from "lucide-react";

export type ReadinessLevel = "exploration" | "hands_on" | "talent";

export interface ReadinessStepProps {
  value?: ReadinessLevel | null;
  onChange?: (value: ReadinessLevel) => void;
  onSelect?: (value: ReadinessLevel) => void;
}

export interface ReadinessOption {
  id: ReadinessLevel;
  title: string;
  description: string;
  icon: typeof Compass;
  badge?: string;
}

const READINESS_OPTIONS: ReadinessOption[] = [
  {
    id: "exploration",
    title: "ค้นหาทิศทางก่อน",
    description: "ยังไม่แน่ใจ อยากลองค้นหาสำรวจสายอาชีพก่อน",
    icon: Compass,
  },
  {
    id: "hands_on",
    title: "เริ่มทำโปรเจคลงลึก",
    description:
      "มีเป้าหมายชัดเจน อยากทำโปรเจกต์จริงลงลึก พร้อมส่งพอร์ต TCAS",
    icon: Rocket,
    badge: "ปรึกษาฟรี",
  },
  {
    id: "talent",
    title: "รับงานจริงจากพาร์ตเนอร์",
    description:
      "สมัครเป็น Talent สร้างโปรไฟล์ รับงานฟรีแลนซ์/งานจริงจากพาร์ตเนอร์ในอุตสาหกรรม",
    icon: Briefcase,
    badge: "Talent",
  },
];

export function ReadinessStep({
  value,
  onChange,
  onSelect,
}: ReadinessStepProps) {
  const handleSelect = (selectedId: ReadinessLevel) => {
    onChange?.(selectedId);
    if (onSelect && onSelect !== onChange) {
      onSelect(selectedId);
    }
  };

  return (
    <section
      aria-labelledby="readiness-heading"
      className="dawn-theme flex flex-col items-start w-full font-bai-jamjuree"
    >
      <p className="text-xs font-semibold uppercase tracking-[0.15em] text-indigo-200/70">
        การประเมินตนเอง · Readiness Check
      </p>
      <h2
        id="readiness-heading"
        className="mt-2 font-kodchasan text-2xl font-semibold text-slate-50 sm:text-3xl"
      >
        ตอนนี้คุณอยู่ในช่วงไหนของการเรียนรู้?
      </h2>
      <p className="mt-3 max-w-xl text-sm leading-6 text-slate-400">
        เลือกสถานะที่ตรงกับความพร้อมและเป้าหมายของคุณในปัจจุบัน
        เพื่อปรับเส้นทางเรียนรู้ให้เหมาะสมที่สุด
      </p>

      <div
        className="mt-6 grid w-full gap-4 sm:grid-cols-2 lg:grid-cols-3"
        role="radiogroup"
        aria-label="ตอนนี้คุณอยู่ในช่วงไหนของการเรียนรู้?"
      >
        {READINESS_OPTIONS.map((option) => {
          const Icon = option.icon;
          const selected = value === option.id;

          return (
            <button
              key={option.id}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => handleSelect(option.id)}
              className={`ei-card group relative flex flex-col justify-between rounded-2xl border p-5 text-left transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200 ${
                selected
                  ? "ei-card--lit border-amber-200/60 bg-amber-200/[0.08]"
                  : "border-white/10 bg-white/[0.03] hover:bg-white/[0.06]"
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-colors ${
                      selected
                        ? "bg-amber-200/20 text-amber-100"
                        : "bg-white/[0.06] text-slate-300 group-hover:bg-white/[0.1] group-hover:text-slate-100"
                    }`}
                  >
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </span>

                  {option.badge && (
                    <span className="rounded-full border border-amber-300/30 bg-amber-400/10 px-2.5 py-0.5 text-xs font-medium text-amber-200">
                      {option.badge}
                    </span>
                  )}
                </div>

                <h3 className="mt-4 font-kodchasan text-lg font-semibold text-slate-50">
                  {option.title}
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-400">
                  {option.description}
                </p>
              </div>

              <div className="mt-6 flex items-center justify-end">
                <span
                  className={`flex h-6 w-6 items-center justify-center rounded-full border transition-all ${
                    selected
                      ? "border-amber-200/70 bg-amber-200/20 text-amber-100"
                      : "border-white/15 text-transparent group-hover:border-white/30"
                  }`}
                  aria-hidden="true"
                >
                  <Check className="h-3.5 w-3.5" />
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
