"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { saveProjectBrief, saveProjectPick } from "@/actions/projectseed";
import type { PseedProjectOption, PseedProjectPick } from "@/types/projectseed";

const CUSTOM = "__custom__";

interface ProjectWorkspaceProps {
  options: PseedProjectOption[];
  pick: PseedProjectPick | null;
}

/**
 * Steps 2 and 3 on one page, saved separately.
 *
 * They are one screen because "which project" and "what is it" are one decision
 * in the participant's head, and two saves because a picked project with an
 * empty brief is a real, useful state — it is what a mentor looks at to know
 * someone is stuck on the explanation rather than on the choice.
 */
export function ProjectWorkspace({ options, pick }: ProjectWorkspaceProps) {
  const router = useRouter();

  const [selected, setSelected] = useState<string>(
    pick?.project_option_id ?? (pick?.custom_title ? CUSTOM : "")
  );
  const [customTitle, setCustomTitle] = useState(pick?.custom_title ?? "");
  const [pickError, setPickError] = useState<string | null>(null);
  const [pickSaved, setPickSaved] = useState(false);
  const [savingPick, startPickSave] = useTransition();

  const hasPick = Boolean(pick?.project_option_id || pick?.custom_title);

  function handleSavePick() {
    setPickError(null);
    setPickSaved(false);

    startPickSave(async () => {
      const result = await saveProjectPick(
        selected === CUSTOM
          ? { customTitle }
          : { projectOptionId: selected || null }
      );

      if (result.ok) {
        setPickSaved(true);
        router.refresh();
      } else {
        setPickError(result.error ?? "บันทึกไม่สำเร็จ");
      }
    });
  }

  return (
    <div className="flex flex-col gap-10">
      <section className="flex flex-col gap-5" aria-labelledby="pick-heading">
        <header className="flex flex-col gap-2">
          <h2 id="pick-heading" className="text-xl font-bold text-white">
            เลือกโปรเจกต์
          </h2>
          <p className="text-sm leading-relaxed text-slate-300">
            เลือกหนึ่งอย่างจากรายการ หรือเสนอของตัวเอง — เปลี่ยนทีหลังได้
          </p>
        </header>

        <div className="grid gap-3 sm:grid-cols-2">
          {options.map((option) => (
            <OptionCard
              key={option.id}
              option={option}
              checked={selected === option.id}
              onSelect={() => setSelected(option.id)}
            />
          ))}

          <CustomOptionCard
            checked={selected === CUSTOM}
            title={customTitle}
            onSelect={() => setSelected(CUSTOM)}
            onTitleChange={setCustomTitle}
          />
        </div>

        {pickError ? (
          <p role="alert" className="text-sm text-rose-300">
            {pickError}
          </p>
        ) : null}

        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={handleSavePick}
            className="ei-button-dawn"
            disabled={savingPick || !selected}
          >
            <span>{savingPick ? "กำลังบันทึก…" : "บันทึกโปรเจกต์"}</span>
          </button>
          {pickSaved ? (
            <span className="text-sm text-emerald-300">บันทึกแล้ว</span>
          ) : null}
        </div>
      </section>

      <BriefForm pick={pick} enabled={hasPick} />
    </div>
  );
}

interface OptionCardProps {
  option: PseedProjectOption;
  checked: boolean;
  onSelect: () => void;
}

function OptionCard({ option, checked, onSelect }: OptionCardProps) {
  return (
    <label
      className={`ei-card flex cursor-pointer flex-col gap-2 p-5 ${
        checked ? "ei-card--lit ring-1 ring-blue-400/60" : ""
      }`}
    >
      <span className="flex items-start gap-3">
        <input
          type="radio"
          name="project-option"
          className="mt-1 h-4 w-4 accent-blue-500"
          checked={checked}
          onChange={onSelect}
        />
        <span className="font-semibold text-white">{option.title}</span>
      </span>

      <span className="text-sm leading-relaxed text-slate-300">
        {option.summary}
      </span>

      {option.detail ? (
        <span className="text-sm leading-relaxed text-slate-400">
          {option.detail}
        </span>
      ) : null}

      {option.tags.length > 0 ? (
        <span className="flex flex-wrap gap-1.5 pt-1">
          {option.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-blue-500/10 px-2 py-0.5 text-xs text-blue-200"
            >
              {tag}
            </span>
          ))}
        </span>
      ) : null}
    </label>
  );
}

interface CustomOptionCardProps {
  checked: boolean;
  title: string;
  onSelect: () => void;
  onTitleChange: (value: string) => void;
}

function CustomOptionCard({
  checked,
  title,
  onSelect,
  onTitleChange,
}: CustomOptionCardProps) {
  return (
    <label
      className={`ei-card flex cursor-pointer flex-col gap-3 p-5 ${
        checked ? "ei-card--lit ring-1 ring-blue-400/60" : ""
      }`}
    >
      <span className="flex items-start gap-3">
        <input
          type="radio"
          name="project-option"
          className="mt-1 h-4 w-4 accent-blue-500"
          checked={checked}
          onChange={onSelect}
        />
        <span className="font-semibold text-white">โปรเจกต์ของฉันเอง</span>
      </span>

      <span className="text-sm leading-relaxed text-slate-300">
        มีอะไรอยู่ในหัวอยู่แล้ว เอาอันนั้นมา
      </span>

      <input
        className="ei-input rounded-xl px-4 py-2.5 text-white"
        value={title}
        onChange={(e) => onTitleChange(e.target.value)}
        onFocus={onSelect}
        placeholder="ชื่อโปรเจกต์"
      />
    </label>
  );
}

interface BriefFormProps {
  pick: PseedProjectPick | null;
  enabled: boolean;
}

const BRIEF_FIELDS = [
  {
    key: "whatBuild" as const,
    label: "จะทำอะไร",
    hint: "อธิบายให้คนที่ไม่รู้จักโปรเจกต์นี้เข้าใจใน 2–3 ประโยค",
  },
  {
    key: "whyThis" as const,
    label: "ทำไมต้องเป็นเรื่องนี้",
    hint: "ทำไมคุณถึงสนใจ ไม่ใช่ทำไมมันสำคัญกับโลก",
  },
  {
    key: "whoFor" as const,
    label: "ทำเพื่อใคร",
    hint: "คนจริง ๆ ที่คุณคุยด้วยได้ ไม่ใช่ 'คนทั่วไป'",
  },
  {
    key: "firstStep" as const,
    label: "ก้าวแรกภายในสัปดาห์นี้",
    hint: "เล็กพอที่จะทำเสร็จได้จริง (ไม่บังคับ)",
  },
];

function BriefForm({ pick, enabled }: BriefFormProps) {
  const router = useRouter();
  const [values, setValues] = useState({
    whatBuild: pick?.what_build ?? "",
    whyThis: pick?.why_this ?? "",
    whoFor: pick?.who_for ?? "",
    firstStep: pick?.first_step ?? "",
  });
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [saving, startSave] = useTransition();

  function save(submit: boolean) {
    setError(null);
    setNotice(null);

    startSave(async () => {
      const result = await saveProjectBrief({ ...values, submit });
      if (result.ok) {
        setNotice(submit ? "ส่งแล้ว" : "บันทึกฉบับร่างแล้ว");
        router.refresh();
      } else {
        setError(result.error ?? "บันทึกไม่สำเร็จ");
      }
    });
  }

  return (
    <section
      id="brief"
      className="flex flex-col gap-5 scroll-mt-8"
      aria-labelledby="brief-heading"
    >
      <header className="flex flex-col gap-2">
        <h2 id="brief-heading" className="text-xl font-bold text-white">
          อธิบายโปรเจกต์
        </h2>
        <p className="text-sm leading-relaxed text-slate-300">
          {enabled
            ? "สามคำถามนี้คือสิ่งที่พี่เลี้ยงจะอ่านก่อนคุยกับคุณ"
            : "เลือกโปรเจกต์ด้านบนก่อน แล้วช่องนี้จะเปิด"}
        </p>
      </header>

      <fieldset
        disabled={!enabled || saving}
        className="flex flex-col gap-5 disabled:opacity-50"
      >
        {BRIEF_FIELDS.map((field) => (
          <label key={field.key} className="flex flex-col gap-2">
            <span className="text-sm font-semibold text-white">
              {field.label}
            </span>
            <span className="text-xs text-slate-400">{field.hint}</span>
            <textarea
              className="ei-input min-h-[96px] rounded-xl px-4 py-3 text-white"
              value={values[field.key]}
              onChange={(e) =>
                setValues((prev) => ({ ...prev, [field.key]: e.target.value }))
              }
            />
          </label>
        ))}
      </fieldset>

      {error ? (
        <p role="alert" className="text-sm text-rose-300">
          {error}
        </p>
      ) : null}
      {notice ? <p className="text-sm text-emerald-300">{notice}</p> : null}

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => save(true)}
          className="ei-button-dawn"
          disabled={!enabled || saving}
        >
          <span>{saving ? "กำลังบันทึก…" : "ส่งคำอธิบาย"}</span>
        </button>

        <button
          type="button"
          onClick={() => save(false)}
          className="rounded-xl border border-white/15 px-5 py-3 text-sm font-semibold text-slate-200 transition-colors hover:border-white/30 disabled:opacity-50"
          disabled={!enabled || saving}
        >
          เก็บเป็นฉบับร่าง
        </button>

        {pick?.status === "submitted" ? (
          <span className="text-sm text-emerald-300">ส่งแล้วเมื่อ {formatDate(pick.submitted_at)}</span>
        ) : null}
      </div>
    </section>
  );
}

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("th-TH", {
    day: "numeric",
    month: "short",
  });
}
