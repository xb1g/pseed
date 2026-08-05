"use client";

import { useActionState, useEffect, useRef } from "react";
import {
  submitProjectBrief,
  submitTalentProfile,
  type TalentFormState,
} from "@/app/talent/actions";

const INITIAL_STATE: TalentFormState = { ok: false, error: null };

const inputClass =
  "w-full rounded-lg border border-[#524746]/25 bg-[#524746]/[0.07] px-4 py-3 text-base text-[#524746] placeholder:text-[#524746]/40 transition-colors focus:border-[#C43E1D]/60 focus:bg-white/60 focus:outline-none";

function SubmitButton({ pending, solid }: { pending: boolean; solid?: boolean }) {
  if (solid) {
    return (
      <button
        type="submit"
        disabled={pending}
        className="rounded-full bg-[#C43E1D] px-12 py-3.5 font-radar-title text-2xl text-[#FDF3E6] shadow-[0_12px_32px_rgba(196,62,29,0.35)] transition-all duration-200 hover:-translate-y-0.5 hover:brightness-110 disabled:opacity-40 sm:text-3xl"
      >
        {pending ? "submitting…" : "submit"}
      </button>
    );
  }

  return (
    <button
      type="submit"
      disabled={pending}
      className="font-radar-title text-3xl text-[#C43E1D] transition-opacity hover:opacity-70 disabled:opacity-40 sm:text-4xl"
    >
      {pending ? "submitting…" : "submit"}
    </button>
  );
}

function FormMessage({ state }: { state: TalentFormState }) {
  if (state.ok) {
    return <p className="text-sm font-medium text-[#C43E1D]">ส่งเรียบร้อยแล้ว ขอบคุณครับ</p>;
  }
  if (state.error) {
    return <p className="text-sm font-medium text-[#C43E1D]">{state.error}</p>;
  }
  return null;
}

export function TalentProfileForm() {
  const [state, formAction, pending] = useActionState(submitTalentProfile, INITIAL_STATE);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state]);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="flex flex-col gap-4 rounded-2xl border border-[#524746]/15 bg-[#524746]/[0.04] p-6 sm:p-8"
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <input
          name="full_name"
          required
          placeholder="Full name *"
          className={inputClass}
          maxLength={120}
        />
        <input
          name="nickname"
          required
          placeholder="Nickname *"
          className={inputClass}
          maxLength={60}
        />
        <input
          name="age"
          type="number"
          min={10}
          max={100}
          placeholder="Age"
          className={inputClass}
        />
        <input name="school" placeholder="School" className={inputClass} maxLength={120} />
        <input name="line_id" placeholder="LINE ID" className={inputClass} maxLength={60} />
        <select name="track" required defaultValue="" className={inputClass}>
          <option value="" disabled>
            Track *
          </option>
          <option value="dev">/Software-Developer</option>
          <option value="video">/Video-Editor</option>
          <option value="strategy">/Business-Strategy</option>
          <option value="design">/Design</option>
        </select>
      </div>
      <input
        name="tools"
        placeholder="Tools you use (comma separated — e.g. Figma, Premiere, Python)"
        className={inputClass}
      />
      <textarea
        name="portfolio_links"
        rows={2}
        placeholder="Portfolio links (one per line — GitHub, Behance, TikTok…)"
        className={inputClass}
      />
      <div className="mt-2 flex flex-col items-center gap-3">
        <SubmitButton pending={pending} />
        <FormMessage state={state} />
      </div>
    </form>
  );
}

export function ProjectBriefForm() {
  const [state, formAction, pending] = useActionState(submitProjectBrief, INITIAL_STATE);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="flex flex-col items-center gap-4">
      <input
        name="contact"
        required
        placeholder="Your contact (LINE ID or email)"
        className={inputClass}
        maxLength={120}
      />
      <textarea
        name="brief"
        required
        rows={4}
        placeholder="Tell us about your project — what do you need built, edited, or designed?"
        className={inputClass}
        maxLength={2000}
      />
      <div className="mt-2 flex flex-col items-center gap-3">
        <SubmitButton pending={pending} solid />
        <FormMessage state={state} />
      </div>
    </form>
  );
}
