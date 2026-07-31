"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { saveNotificationPrefs } from "@/actions/projectseed";
import type { PseedParticipant } from "@/types/projectseed";

const LEAD_OPTIONS = [0, 5, 10, 15, 30];

interface NotificationSettingsProps {
  participant: PseedParticipant;
}

/**
 * Reminder preferences.
 *
 * Channel ping is opt-out and DM is opt-in, in that order on purpose.
 * `docs/project/PROJECTSEED-SAFEGUARDING.md` §3 allows the bot to DM as a
 * broadcast, and states the cost: once students learn ProjectSeed sometimes
 * messages them privately, they lose the clean signal that a private message
 * claiming to be from us is always wrong. So the DM toggle carries that rule as
 * visible copy, not just as a default.
 */
export function NotificationSettings({ participant }: NotificationSettingsProps) {
  const router = useRouter();

  const [notifyChannel, setNotifyChannel] = useState(participant.notify_channel);
  const [notifyDm, setNotifyDm] = useState(participant.notify_dm);
  const [leadMinutes, setLeadMinutes] = useState(participant.notify_lead_minutes);
  const [minPeople, setMinPeople] = useState(participant.notify_min_people);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [saving, startSave] = useTransition();

  const linked = Boolean(participant.discord_user_id);

  function save(next: Partial<{
    notifyChannel: boolean;
    notifyDm: boolean;
    leadMinutes: number;
    minPeople: number;
  }>) {
    setError(null);
    setNotice(null);

    const payload = {
      notifyChannel,
      notifyDm,
      leadMinutes,
      minPeople,
      ...next,
    };

    startSave(async () => {
      const result = await saveNotificationPrefs(payload);
      if (result.ok) {
        setNotice("บันทึกแล้ว");
        router.refresh();
      } else {
        setError(result.error ?? "บันทึกไม่สำเร็จ");
      }
    });
  }

  return (
    <section className="flex flex-col gap-4">
      <h2 className="flex items-center gap-3 text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500">
        การแจ้งเตือน
        <span aria-hidden="true" className="h-px flex-1 bg-white/8" />
      </h2>

      <div className="flex flex-col gap-3">
        <Toggle
          checked={notifyChannel}
          onChange={(value) => {
            setNotifyChannel(value);
            save({ notifyChannel: value });
          }}
          disabled={saving}
          label="เตือนในห้องแชท"
          hint="บอทโพสต์ในช่องของรุ่น ก่อนถึงเวลาที่คุณจองไว้"
        />

        <Toggle
          checked={notifyDm && linked}
          onChange={(value) => {
            setNotifyDm(value);
            save({ notifyDm: value });
          }}
          disabled={saving || !linked}
          label="ส่ง DM หาฉันด้วย"
          hint={
            linked
              ? "บอทส่งข้อความส่วนตัวเตือนอย่างเดียว ไม่คุยโต้ตอบ — ถ้ามีบัญชี ProjectSeed ทักคุยส่วนตัว นั่นไม่ใช่เรา ให้แจ้งทีมงาน"
              : "ต้องเชื่อมบัญชี Discord ก่อน"
          }
        />
      </div>

      <div className="flex flex-wrap gap-6">
        <Choice
          label="เตือนล่วงหน้า"
          value={leadMinutes}
          options={LEAD_OPTIONS}
          format={(v) => (v === 0 ? "ตรงเวลา" : `${v} นาที`)}
          disabled={saving}
          onChange={(value) => {
            setLeadMinutes(value);
            save({ leadMinutes: value });
          }}
        />

        <Choice
          label="เตือนเมื่อมีคนอย่างน้อย"
          value={minPeople}
          options={[1, 2, 3, 5]}
          format={(v) => `${v} คน`}
          disabled={saving}
          onChange={(value) => {
            setMinPeople(value);
            save({ minPeople: value });
          }}
        />
      </div>

      {error ? (
        <p role="alert" className="text-xs text-rose-300">
          {error}
        </p>
      ) : null}
      {notice ? <p className="text-xs text-emerald-300">{notice}</p> : null}
    </section>
  );
}

function Toggle({
  checked,
  onChange,
  disabled,
  label,
  hint,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
  label: string;
  hint: string;
}) {
  return (
    <label
      className={`flex cursor-pointer items-start gap-3 ${
        disabled ? "opacity-50" : ""
      }`}
    >
      <input
        type="checkbox"
        className="mt-1 h-4 w-4 shrink-0 accent-amber-400"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        disabled={disabled}
      />
      <span className="flex flex-col gap-0.5">
        <span className="text-sm font-bold text-white">{label}</span>
        <span className="text-xs leading-relaxed text-slate-500">{hint}</span>
      </span>
    </label>
  );
}

function Choice({
  label,
  value,
  options,
  format,
  onChange,
  disabled,
}: {
  label: string;
  value: number;
  options: number[];
  format: (value: number) => string;
  onChange: (value: number) => void;
  disabled?: boolean;
}) {
  return (
    <fieldset className="flex flex-col gap-2" disabled={disabled}>
      <legend className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">
        {label}
      </legend>
      <div className="flex flex-wrap gap-1.5">
        {options.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => onChange(option)}
            aria-pressed={value === option}
            className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
              value === option
                ? "bg-amber-300/20 text-amber-100 ring-1 ring-amber-300/50"
                : "text-slate-400 ring-1 ring-white/10 hover:text-white"
            }`}
          >
            {format(option)}
          </button>
        ))}
      </div>
    </fieldset>
  );
}
