"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Building2,
  Check,
  ChevronRight,
  GraduationCap,
  Loader2,
  RotateCcw,
  Search,
  X,
} from "lucide-react";

import type { CollectedData } from "@/types/onboarding";

interface Props {
  data: CollectedData;
  language: "en" | "th";
  onChange: (updates: Partial<CollectedData>) => void;
  onContinue: () => void;
  onSkip: () => void;
  hideHeader?: boolean;
}

interface UniversityResult {
  universityId: string;
  universityName: string;
  universityNameEn: string | null;
}

interface ProgramResult {
  programId: string;
  programName: string;
  programNameEn: string | null;
  facultyName: string | null;
  universityId: string;
}

const COPY = {
  en: {
    eyebrow: "TCAS target",
    title: "If you already know the school or program, add it here",
    body: "This helps us tailor the next steps around a real target. You can still continue without locking it in now.",
    universityLabel: "1. Select University",
    universityPlaceholder: "Search universities (e.g. Chula, Kasetsart)",
    universityEmpty: "No universities found matching your search.",
    universityChange: "Change",
    programLabel: "2. Select Program (Optional)",
    programPlaceholder: "Search programs or faculties",
    programEmpty: "No matching programs found for this university.",
    programClear: "Clear program",
    picked: "Selected Target",
    skip: "Skip for now",
    continue: "Continue",
    selectUniversityFirstTitle: "Pick a university first",
    selectUniversityFirst: "Select a university on the left to browse programs.",
    searching: "Searching...",
  },
  th: {
    eyebrow: "เป้าหมาย TCAS",
    title: "ถ้าคุณพอรู้แล้วว่าอยากไปที่ไหน เลือกมหาวิทยาลัยหรือสาขาไว้ได้เลย",
    body: "เราจะใช้ข้อมูลนี้ช่วยจัดคำแนะนำให้ตรงกับเป้าหมายมากขึ้น แต่ถ้ายังไม่อยากฟันธงตอนนี้ก็ข้ามก่อนได้",
    universityLabel: "1. เลือกมหาวิทยาลัย",
    universityPlaceholder: "ค้นหามหาวิทยาลัย (เช่น จุฬาฯ, มก., มธ.)",
    universityEmpty: "ไม่พบมหาวิทยาลัยที่ตรงกับคำค้น",
    universityChange: "เปลี่ยน",
    programLabel: "2. เลือกสาขา / คณะ (ไม่บังคับ)",
    programPlaceholder: "ค้นหาสาขาหรือคณะ",
    programEmpty: "ยังไม่พบสาขาที่ตรงคำค้นในมหาวิทยาลัยนี้",
    programClear: "ล้างสาขาที่เลือก",
    picked: "เป้าหมายที่เลือกไว้",
    skip: "ข้ามไปก่อน",
    continue: "ไปต่อ",
    selectUniversityFirstTitle: "เลือกมหาวิทยาลัยก่อน",
    selectUniversityFirst: "เลือกมหาวิทยาลัยทางซ้าย เพื่อดูคณะและสาขาที่เปิดรับ",
    searching: "กำลังค้นหา...",
  },
} as const;

export function TcasTargetPicker({
  data,
  language,
  onChange,
  onContinue,
  onSkip,
  hideHeader = false,
}: Props) {
  const copy = COPY[language];
  const [universityQuery, setUniversityQuery] = useState(
    data.target_university_name ?? ""
  );
  const [programQuery, setProgramQuery] = useState(
    data.target_program_name ?? ""
  );
  const [isChangingUniversity, setIsChangingUniversity] = useState(
    !data.target_university_id
  );
  const [universities, setUniversities] = useState<UniversityResult[]>([]);
  const [programs, setPrograms] = useState<ProgramResult[]>([]);
  const [isLoadingUniversities, setIsLoadingUniversities] = useState(false);
  const [isLoadingPrograms, setIsLoadingPrograms] = useState(false);

  useEffect(() => {
    if (!data.target_university_id) {
      setIsChangingUniversity(true);
    }
  }, [data.target_university_id]);

  useEffect(() => {
    let isCancelled = false;
    const timer = window.setTimeout(async () => {
      setIsLoadingUniversities(true);
      try {
        const response = await fetch(
          `/api/onboarding/tcas?kind=universities&q=${encodeURIComponent(
            universityQuery
          )}`
        );
        if (!response.ok) {
          throw new Error("University search failed");
        }

        const json = (await response.json()) as { items?: UniversityResult[] };
        if (!isCancelled) {
          setUniversities(json.items ?? []);
        }
      } catch {
        if (!isCancelled) {
          setUniversities([]);
        }
      } finally {
        if (!isCancelled) {
          setIsLoadingUniversities(false);
        }
      }
    }, 200);

    return () => {
      isCancelled = true;
      window.clearTimeout(timer);
    };
  }, [universityQuery]);

  useEffect(() => {
    if (!data.target_university_id) {
      setPrograms([]);
      setIsLoadingPrograms(false);
      return;
    }

    let isCancelled = false;
    const timer = window.setTimeout(async () => {
      setIsLoadingPrograms(true);
      try {
        const response = await fetch(
          `/api/onboarding/tcas?kind=programs&universityId=${encodeURIComponent(
            data.target_university_id ?? ""
          )}&q=${encodeURIComponent(programQuery)}`
        );
        if (!response.ok) {
          throw new Error("Program search failed");
        }

        const json = (await response.json()) as { items?: ProgramResult[] };
        if (!isCancelled) {
          setPrograms(json.items ?? []);
        }
      } catch {
        if (!isCancelled) {
          setPrograms([]);
        }
      } finally {
        if (!isCancelled) {
          setIsLoadingPrograms(false);
        }
      }
    }, 200);

    return () => {
      isCancelled = true;
      window.clearTimeout(timer);
    };
  }, [data.target_university_id, programQuery]);

  const selectedSummary = useMemo(() => {
    if (!data.target_university_name) {
      return null;
    }

    if (!data.target_program_name) {
      return data.target_university_name;
    }

    return `${data.target_university_name} • ${data.target_program_name}`;
  }, [data.target_program_name, data.target_university_name]);

  const handleUniversitySelect = (item: UniversityResult) => {
    const uniName =
      language === "th"
        ? item.universityName
        : item.universityNameEn ?? item.universityName;

    onChange({
      target_university_id: item.universityId,
      target_university_name: uniName,
      target_program_id: undefined,
      target_program_name: undefined,
    });
    setUniversityQuery(uniName);
    setProgramQuery("");
    setIsChangingUniversity(false);
  };

  const handleProgramSelect = (item: ProgramResult) => {
    const programName =
      language === "th"
        ? item.programName
        : item.programNameEn ?? item.programName;
    const fullProgramLabel = item.facultyName
      ? `${programName} (${item.facultyName})`
      : programName;

    onChange({
      target_program_id: item.programId,
      target_program_name: fullProgramLabel,
    });
  };

  const handleClearProgram = () => {
    onChange({
      target_program_id: undefined,
      target_program_name: undefined,
    });
    setProgramQuery("");
  };

  return (
    <div className="flex flex-col gap-4 sm:gap-5">
      {!hideHeader && (
        <div className="space-y-1.5">
          <p className="text-xs uppercase tracking-[0.22em] dawn-eyebrow">
            {copy.eyebrow}
          </p>
          <h3 className="text-lg font-semibold leading-tight text-white sm:text-xl">
            {copy.title}
          </h3>
          <p className="text-xs leading-5 text-white/60 sm:text-sm">{copy.body}</p>
        </div>
      )}

      {/* 2-Column Responsive Layout */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-5">
        {/* Column 1: University */}
        <div className="flex flex-col gap-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-[0.14em] text-white/70">
              {copy.universityLabel}
            </span>
            {data.target_university_id && !isChangingUniversity && (
              <button
                type="button"
                onClick={() => {
                  setIsChangingUniversity(true);
                  setUniversityQuery("");
                }}
                className="inline-flex items-center gap-1 text-xs font-medium text-blue-400 hover:text-blue-300 transition"
              >
                <RotateCcw className="h-3 w-3" />
                {copy.universityChange}
              </button>
            )}
          </div>

          {data.target_university_id && !isChangingUniversity ? (
            <div className="ei-card flex items-center justify-between gap-3 rounded-2xl border border-blue-400/35 bg-blue-500/10 p-3.5">
              <div className="flex items-center gap-3 min-w-0">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-400/20 text-blue-300">
                  <Building2 className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-white">
                    {data.target_university_name}
                  </p>
                  <p className="text-xs text-blue-200/60">
                    {language === "th" ? "เลือกแล้ว" : "Selected"}
                  </p>
                </div>
              </div>
              <Check className="h-4 w-4 shrink-0 text-blue-400" />
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40 pointer-events-none" />
                <input
                  type="text"
                  value={universityQuery}
                  onChange={(event) => setUniversityQuery(event.target.value)}
                  placeholder={copy.universityPlaceholder}
                  autoFocus={isChangingUniversity}
                  className="w-full rounded-xl border border-white/10 bg-white/[0.04] pl-9.5 pr-8 py-2.5 text-sm text-white placeholder:text-white/35 outline-none transition focus:border-blue-400/50 focus:bg-white/[0.07]"
                />
                {universityQuery ? (
                  <button
                    type="button"
                    onClick={() => setUniversityQuery("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-white/40 hover:text-white"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                ) : null}
              </div>

              <div className="flex max-h-52 flex-col gap-1.5 overflow-y-auto pr-1">
                {isLoadingUniversities && (
                  <div className="flex items-center justify-center gap-2 py-4 text-xs text-white/45">
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-400" />
                    {copy.searching}
                  </div>
                )}

                {!isLoadingUniversities &&
                  universities.map((item) => {
                    const selected =
                      data.target_university_id === item.universityId;
                    const uniDisplayName =
                      language === "th"
                        ? item.universityName
                        : item.universityNameEn ?? item.universityName;

                    return (
                      <button
                        key={item.universityId}
                        type="button"
                        onClick={() => handleUniversitySelect(item)}
                        className={`group flex items-center justify-between rounded-xl border px-3 py-2.5 text-left transition ${
                          selected
                            ? "border-blue-400/40 bg-blue-500/15"
                            : "border-white/10 bg-white/[0.03] hover:border-blue-400/30 hover:bg-white/[0.07]"
                        }`}
                      >
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-white group-hover:text-blue-200">
                            {uniDisplayName}
                          </p>
                          {language === "en" &&
                          item.universityNameEn &&
                          item.universityNameEn !== item.universityName ? (
                            <p className="truncate text-xs text-white/40">
                              {item.universityName}
                            </p>
                          ) : null}
                        </div>
                        <ChevronRight className="h-3.5 w-3.5 shrink-0 text-white/30 group-hover:text-white/70" />
                      </button>
                    );
                  })}

                {!isLoadingUniversities && universities.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-white/10 bg-white/[0.02] p-3 text-center text-xs text-white/50">
                    {copy.universityEmpty}
                  </p>
                ) : null}
              </div>
            </div>
          )}
        </div>

        {/* Column 2: Program */}
        <div className="flex flex-col gap-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-[0.14em] text-white/70">
              {copy.programLabel}
            </span>
            {data.target_program_id && (
              <button
                type="button"
                onClick={handleClearProgram}
                className="text-xs text-white/45 hover:text-white/80 transition"
              >
                {copy.programClear}
              </button>
            )}
          </div>

          {!data.target_university_id ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-6 text-center">
              <span className="mb-2 flex h-9 w-9 items-center justify-center rounded-xl bg-white/[0.04] text-white/40">
                <GraduationCap className="h-4 w-4" />
              </span>
              <p className="text-xs font-medium text-white/70">
                {copy.selectUniversityFirstTitle}
              </p>
              <p className="mt-1 text-[11px] leading-relaxed text-white/40 max-w-[220px]">
                {copy.selectUniversityFirst}
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40 pointer-events-none" />
                <input
                  type="text"
                  value={programQuery}
                  onChange={(event) => setProgramQuery(event.target.value)}
                  placeholder={copy.programPlaceholder}
                  className="w-full rounded-xl border border-white/10 bg-white/[0.04] pl-9.5 pr-8 py-2.5 text-sm text-white placeholder:text-white/35 outline-none transition focus:border-blue-400/50 focus:bg-white/[0.07]"
                />
                {programQuery ? (
                  <button
                    type="button"
                    onClick={() => setProgramQuery("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-white/40 hover:text-white"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                ) : null}
              </div>

              <div className="flex max-h-52 flex-col gap-1.5 overflow-y-auto pr-1">
                {isLoadingPrograms && (
                  <div className="flex items-center justify-center gap-2 py-4 text-xs text-white/45">
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-400" />
                    {copy.searching}
                  </div>
                )}

                {!isLoadingPrograms &&
                  programs.map((item) => {
                    const selected = data.target_program_id === item.programId;
                    const programName =
                      language === "th"
                        ? item.programName
                        : item.programNameEn ?? item.programName;

                    return (
                      <button
                        key={item.programId}
                        type="button"
                        onClick={() => handleProgramSelect(item)}
                        className={`group flex items-center justify-between rounded-xl border px-3 py-2.5 text-left transition ${
                          selected
                            ? "border-blue-400/40 bg-blue-500/15"
                            : "border-white/10 bg-white/[0.03] hover:border-blue-400/30 hover:bg-white/[0.07]"
                        }`}
                      >
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-white group-hover:text-blue-200">
                            {programName}
                          </p>
                          {item.facultyName ? (
                            <p className="truncate text-xs text-white/45">
                              {item.facultyName}
                            </p>
                          ) : null}
                        </div>
                        {selected ? (
                          <Check className="h-4 w-4 shrink-0 text-blue-400" />
                        ) : (
                          <ChevronRight className="h-3.5 w-3.5 shrink-0 text-white/20 group-hover:text-white/60" />
                        )}
                      </button>
                    );
                  })}

                {!isLoadingPrograms && programs.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-white/10 bg-white/[0.02] p-3 text-center text-xs text-white/50">
                    {copy.programEmpty}
                  </p>
                ) : null}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Selected Target Badge */}
      {selectedSummary && (
        <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-2.5">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-amber-400/15 text-amber-300">
            <GraduationCap className="h-3.5 w-3.5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="dawn-eyebrow text-[10px] uppercase tracking-[0.16em]">
              {copy.picked}
            </p>
            <p className="truncate text-xs font-medium text-white/90 sm:text-sm">
              {selectedSummary}
            </p>
          </div>
        </div>
      )}

      {/* Action Footer */}
      <div className="flex items-center justify-between gap-3 pt-1">
        <button
          type="button"
          onClick={onSkip}
          className="rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-xs font-medium text-white/60 hover:bg-white/[0.07] hover:text-white transition"
        >
          {copy.skip}
        </button>
        <button
          type="button"
          onClick={onContinue}
          className="ei-button-dawn inline-flex items-center gap-1.5 justify-center px-5 py-2 text-sm font-semibold"
        >
          <span>{copy.continue}</span>
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

