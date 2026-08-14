"use client";

import { useState, type ComponentType } from "react";
import type { LucideProps } from "lucide-react";
import {
  AlertTriangle,
  CheckCircle2,
  CircleDashed,
  Compass,
  FileText,
  HelpCircle,
  Landmark,
  Lightbulb,
  Map,
  Search,
  Target,
  Users,
} from "lucide-react";

import { BackButton } from "../components/back-button";
import { TcasTargetPicker } from "../components/tcas-target-picker";
import { deriveOutputs } from "@/lib/onboarding/derive";
import type {
  CollectedData,
  OnboardingStep,
  TargetClarity,
} from "@/types/onboarding";

interface Props {
  data: CollectedData;
  advance: (step: OnboardingStep, updates: Partial<CollectedData>) => void;
  goBack: () => void | Promise<void>;
}

type WizardStep =
  | "stage"
  | "target_clarity"
  | "tcas_target"
  | "primary_blocker"
  | "confidence"
  | "commitment_signal";

type Icon = ComponentType<LucideProps>;

type Option = {
  value: string;
  en: string;
  th: string;
  hintEn?: string;
  hintTh?: string;
  icon: Icon;
};

const QUESTIONS: Record<
  WizardStep,
  { en: string; th: string; subEn?: string; subTh?: string }
> = {
  stage: {
    en: "Where are you with your next step?",
    th: "ตอนนี้คุณอยู่ขั้นไหนของเส้นทางต่อ?",
    subEn: "Study or career — pick the stage that fits most.",
    subTh: "เรียนต่อหรืออาชีพ — เลือกขั้นที่ใกล้คุณที่สุด",
  },
  target_clarity: {
    en: "How clear is your direction?",
    th: "เป้าหมายของคุณชัดแค่ไหน?",
    subEn: "No wrong answer — this just sets the pace.",
    subTh: "ไม่มีคำตอบผิด แค่ช่วยปรับจังหวะให้เหมาะกับคุณ",
  },
  tcas_target: {
    en: "Choose your target TCAS goal",
    th: "เลือกเป้าหมาย TCAS ในใจ",
    subEn: "If you have a university or program in mind, select them below (or skip for now).",
    subTh: "ถ้าพอรู้แล้วว่าอยากไปที่ไหน เลือกมหาวิทยาลัยหรือสาขาไว้ได้เลย หรือจะข้ามไปก่อนก็ได้",
  },
  primary_blocker: {
    en: "What's the biggest friction right now?",
    th: "ตอนนี้อะไรคืออุปสรรคใหญ่ที่สุด?",
  },
  confidence: {
    en: "How sure do you feel about your path?",
    th: "คุณมั่นใจกับทิศทางแค่ไหน?",
    subEn: "Includes how clear the future feels — one answer covers both.",
    subTh: "รวมถึงว่าภาพอนาคตในใจชัดแค่ไหน — ตอบครั้งเดียวพอ",
  },
  commitment_signal: {
    en: "How far have you already acted?",
    th: "คุณเริ่มลงมือไปถึงไหนแล้ว?",
  },
};

const OPTIONS: Record<WizardStep, Option[]> = {
  stage: [
    {
      value: "exploring",
      en: "Still exploring",
      th: "กำลังสำรวจ",
      hintEn: "Looking around. Nothing locked in yet.",
      hintTh: "ยังดูรอบ ๆ ยังไม่ล็อกอะไร",
      icon: Compass,
    },
    {
      value: "choosing",
      en: "Narrowing it down",
      th: "กำลังเลือก",
      hintEn: "Comparing a few real options.",
      hintTh: "กำลังเทียบตัวเลือกจริง ๆ สองสามทาง",
      icon: Search,
    },
    {
      value: "applying_soon",
      en: "Ready to apply",
      th: "พร้อมสมัคร",
      hintEn: "Applications are coming up soon.",
      hintTh: "ใกล้ถึงช่วงยื่นสมัครแล้ว",
      icon: FileText,
    },
    {
      value: "urgent",
      en: "Need to decide soon",
      th: "ต้องตัดสินใจเร็ว",
      hintEn: "About 3 months or less.",
      hintTh: "เหลือเวลาประมาณ 3 เดือนหรือน้อยกว่า",
      icon: AlertTriangle,
    },
  ],
  target_clarity: [
    {
      value: "none",
      en: "No idea yet",
      th: "ยังไม่รู้เลย",
      hintEn: "Starting from a blank page.",
      hintTh: "เริ่มจากศูนย์เลย",
      icon: HelpCircle,
    },
    {
      value: "field_only",
      en: "I know the field",
      th: "รู้แค่สายงาน",
      hintEn: "Direction yes — school/program not yet.",
      hintTh: "รู้สาย แต่ยังไม่ล็อกคณะ/มหาวิทยาลัย",
      icon: Map,
    },
    {
      value: "specific",
      en: "Specific target",
      th: "มีเป้าหมายชัด",
      hintEn: "School + program in mind.",
      hintTh: "มีมหาวิทยาลัยและหลักสูตรในใจ",
      icon: Target,
    },
  ],
  tcas_target: [],
  primary_blocker: [
    {
      value: "dont_know",
      en: "Don't know what to choose",
      th: "ไม่รู้จะเลือกอะไร",
      icon: HelpCircle,
    },
    {
      value: "low_profile",
      en: "Not confident in my profile",
      th: "ไม่มั่นใจในโปรไฟล์",
      icon: CircleDashed,
    },
    {
      value: "financial",
      en: "Financial concern",
      th: "กังวลเรื่องค่าใช้จ่าย",
      icon: Landmark,
    },
    {
      value: "family_pressure",
      en: "Family pressure",
      th: "แรงกดดันจากครอบครัว",
      icon: Users,
    },
    {
      value: "application_process",
      en: "Confused about applications",
      th: "สับสนเรื่องขั้นตอนสมัคร",
      icon: FileText,
    },
  ],
  confidence: [
    {
      value: "low",
      en: "Still foggy",
      th: "ยังมั่วอยู่",
      hintEn: "Hard to picture what comes next.",
      hintTh: "ยังนึกภาพต่อไปไม่ออก",
      icon: CircleDashed,
    },
    {
      value: "medium",
      en: "Some shape forming",
      th: "เริ่มเห็นเค้าโครง",
      hintEn: "Ideas exist — not locked yet.",
      hintTh: "มีแนวแล้ว แต่ยังไม่ล็อก",
      icon: Lightbulb,
    },
    {
      value: "high",
      en: "Pretty clear",
      th: "ค่อนข้างชัด",
      hintEn: "You can name the direction.",
      hintTh: "พอจะบอกได้ว่าจะไปทางไหน",
      icon: CheckCircle2,
    },
  ],
  commitment_signal: [
    {
      value: "browsing",
      en: "Just browsing",
      th: "แค่เปิดดู",
      icon: Compass,
    },
    {
      value: "researching",
      en: "Actively researching",
      th: "กำลังหาข้อมูล",
      icon: Search,
    },
    {
      value: "preparing",
      en: "Already preparing",
      th: "เตรียมตัวแล้ว",
      icon: CheckCircle2,
    },
  ],
};

type AssessmentFields = Required<
  Pick<
    CollectedData,
    | "stage"
    | "target_clarity"
    | "primary_blocker"
    | "confidence"
    | "commitment_signal"
  >
>;

function careerDirectionFromConfidence(
  confidence: CollectedData["confidence"]
): CollectedData["career_direction"] {
  if (confidence === "high") return "clear_goal";
  if (confidence === "medium") return "some_ideas";
  return "no_idea";
}

export function AssessmentWizardPhase({ data, advance, goBack }: Props) {
  const [stepIndex, setStepIndex] = useState(0);
  const [answers, setAnswers] = useState<Partial<CollectedData>>({});
  const language = (data.language ?? "th") as "en" | "th";
  const isEnglish = language === "en";
  const wizardSteps = buildWizardSteps(
    answers.target_clarity ?? data.target_clarity
  );

  const currentField = wizardSteps[stepIndex];
  const question = QUESTIONS[currentField];
  const options = OPTIONS[currentField];
  const progress = ((stepIndex + 1) / wizardSteps.length) * 100;

  const handleSelect = (value: string) => {
    const nextAnswers = { ...answers, [currentField]: value };
    if (currentField === "target_clarity" && value !== "specific") {
      delete nextAnswers.target_university_id;
      delete nextAnswers.target_university_name;
      delete nextAnswers.target_program_id;
      delete nextAnswers.target_program_name;
    }
    setAnswers(nextAnswers);

    const nextSteps = buildWizardSteps(
      nextAnswers.target_clarity ?? data.target_clarity
    );
    if (stepIndex < nextSteps.length - 1) {
      setStepIndex((current) => current + 1);
      return;
    }

    const completeAnswers = nextAnswers as AssessmentFields;
    const career_direction = careerDirectionFromConfidence(
      completeAnswers.confidence
    );
    const derived = deriveOutputs({
      ...completeAnswers,
      career_direction,
    });
    void advance("results", {
      ...completeAnswers,
      career_direction,
      ...derived,
    });
  };

  const handleBack = () => {
    if (stepIndex > 0) {
      setStepIndex((current) => current - 1);
      return;
    }

    void goBack();
  };

  return (
    <div
      className={`mx-auto w-full transition-[max-width] duration-300 ${
        currentField === "tcas_target" ? "max-w-2xl sm:max-w-3xl" : "max-w-lg"
      }`}
    >
      <div className="ei-card ei-card--static rounded-[22px] sm:rounded-[28px]">
        <div className="space-y-4 px-4 pb-4 pt-4 sm:space-y-5 sm:px-8 sm:pb-5 sm:pt-7">
          <div className="flex items-center justify-between gap-3">
            <BackButton
              label={isEnglish ? "Back" : "ย้อนกลับ"}
              onClick={handleBack}
            />
            <p className="dawn-eyebrow shrink-0">
              {stepIndex + 1}/{wizardSteps.length}
            </p>
          </div>

          <div
            className="h-1 overflow-hidden rounded-full bg-white/10"
            role="progressbar"
            aria-valuenow={stepIndex + 1}
            aria-valuemin={1}
            aria-valuemax={wizardSteps.length}
          >
            <div
              className="h-full rounded-full bg-blue-400/80 transition-[width] duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="space-y-2">
            <h2 className="text-[1.35rem] font-semibold leading-snug tracking-tight text-white sm:text-[1.65rem]">
              {isEnglish ? question.en : question.th}
            </h2>
            {question.subEn ? (
              <p className="text-sm leading-6 text-white/50">
                {isEnglish ? question.subEn : question.subTh}
              </p>
            ) : null}
          </div>
        </div>

        <div className="px-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:px-8 sm:pb-8">
          {currentField === "tcas_target" ? (
            <TcasTargetPicker
              data={{ ...data, ...answers }}
              language={language}
              hideHeader
              onChange={(updates) => {
                setAnswers((current) => ({ ...current, ...updates }));
              }}
              onContinue={() => {
                setStepIndex((current) => current + 1);
              }}
              onSkip={() => {
                setAnswers((current) => ({
                  ...current,
                  target_university_id: undefined,
                  target_university_name: undefined,
                  target_program_id: undefined,
                  target_program_name: undefined,
                }));
                setStepIndex((current) => current + 1);
              }}
            />
          ) : (
            <div className="flex flex-col gap-2">
              {options.map((option) => {
                const Icon = option.icon;
                const isUrgent = option.value === "urgent";
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleSelect(option.value)}
                    className={[
                      "group flex min-h-[3.5rem] w-full items-start gap-3.5 rounded-2xl border p-3.5 text-left transition-colors active:scale-[0.99] sm:gap-4 sm:p-4",
                      "border-white/10 bg-white/[0.03] hover:border-blue-400/35 hover:bg-blue-500/[0.08]",
                      isUrgent
                        ? "hover:border-amber-400/35 hover:bg-amber-500/[0.06]"
                        : "",
                    ].join(" ")}
                  >
                    <span
                      className={[
                        "mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border sm:h-10 sm:w-10",
                        isUrgent
                          ? "border-amber-400/25 bg-amber-500/10 text-amber-200"
                          : "border-white/10 bg-white/[0.04] text-blue-200/80",
                      ].join(" ")}
                    >
                      <Icon className="h-4 w-4" aria-hidden="true" />
                    </span>
                    <span className="min-w-0 flex-1 space-y-0.5 pt-0.5">
                      <span className="block text-[0.95rem] font-semibold leading-snug text-white">
                        {isEnglish ? option.en : option.th}
                      </span>
                      {option.hintEn ? (
                        <span className="block text-xs leading-5 text-white/45">
                          {isEnglish ? option.hintEn : option.hintTh}
                        </span>
                      ) : null}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function buildWizardSteps(targetClarity?: TargetClarity): WizardStep[] {
  const steps: WizardStep[] = ["stage", "target_clarity"];

  if (targetClarity === "specific") {
    steps.push("tcas_target");
  }

  steps.push("primary_blocker", "confidence", "commitment_signal");

  return steps;
}
