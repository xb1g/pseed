"use client";

import { useState } from "react";

import {
  PSEED_MAX_TAGS,
  normalizeTag,
  normalizeTags,
} from "@/lib/projectseed/tags";

interface TagInputProps {
  value: string[];
  onChange: (tags: string[]) => void;
  /** Tags already in use across the cohort, most common first. */
  suggestions?: { tag: string; participant_count: number }[];
  disabled?: boolean;
}

/**
 * Up to five free-text tags on a project.
 *
 * Free text rather than a fixed vocabulary because the point is discovery
 * between people, and a curated list can only contain what we thought of in
 * advance — the tag that matters is the specific one two people share
 * (`godot`, `ป.ตรี`, `arduino`), not the category we would have offered.
 *
 * Cohort tags are shown as suggestions, which is the only nudge toward
 * convergence: you see `react` already has three people before you type
 * `reactjs`.
 */
export function TagInput({
  value,
  onChange,
  suggestions = [],
  disabled,
}: TagInputProps) {
  const [draft, setDraft] = useState("");
  const atLimit = value.length >= PSEED_MAX_TAGS;

  function addTag(raw: string) {
    const tag = normalizeTag(raw);
    if (!tag || atLimit || value.includes(tag)) {
      setDraft("");
      return;
    }
    onChange(normalizeTags([...value, tag]));
    setDraft("");
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    // Enter and comma both commit. Enter would otherwise submit the form, and
    // comma is what people type by reflex when listing things.
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault();
      addTag(draft);
      return;
    }

    // Backspace on an empty field removes the last tag — standard for this
    // control, and the only way to correct a typo without reaching for a mouse.
    if (event.key === "Backspace" && !draft && value.length > 0) {
      onChange(value.slice(0, -1));
    }
  }

  const unusedSuggestions = suggestions
    .filter((s) => !value.includes(s.tag))
    .slice(0, 8);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        {value.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/15 py-1 pl-3 pr-1.5 text-sm text-blue-100"
          >
            {tag}
            <button
              type="button"
              onClick={() => onChange(value.filter((t) => t !== tag))}
              className="flex h-5 w-5 items-center justify-center rounded-full text-blue-200/70 transition-colors hover:bg-blue-500/25 hover:text-white"
              aria-label={`ลบแท็ก ${tag}`}
              disabled={disabled}
            >
              ×
            </button>
          </span>
        ))}

        <input
          className="ei-input min-w-[10rem] flex-1 rounded-xl px-4 py-2 text-sm text-white"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => addTag(draft)}
          placeholder={
            atLimit ? `ครบ ${PSEED_MAX_TAGS} แท็กแล้ว` : "พิมพ์แล้วกด Enter"
          }
          disabled={disabled || atLimit}
          autoComplete="off"
        />
      </div>

      <p className="text-xs text-slate-400">
        {value.length}/{PSEED_MAX_TAGS} — คำอะไรก็ได้ที่จะทำให้คนที่ทำเรื่องเดียวกันเจอคุณ
      </p>

      {unusedSuggestions.length > 0 && !atLimit ? (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-slate-500">ในห้องนี้มี:</span>
          {unusedSuggestions.map((s) => (
            <button
              key={s.tag}
              type="button"
              onClick={() => addTag(s.tag)}
              className="rounded-full border border-white/12 px-2.5 py-0.5 text-xs text-slate-300 transition-colors hover:border-blue-400/50 hover:text-white"
              disabled={disabled}
            >
              {s.tag}
              <span className="ml-1 text-slate-500">{s.participant_count}</span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
