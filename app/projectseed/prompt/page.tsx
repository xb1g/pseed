import type { Metadata } from "next";

import { DawnScene } from "@/components/projectseed/dawn-scene";
import { PromptCopy } from "@/components/projectseed/prompt-copy";
import {
  buildProjectDiscoveryGreeting,
  buildProjectDiscoverySystemPrompt,
  MENTAL_HEALTH_HOTLINE_TH,
  SAMARITANS_TH,
  type GradeLevel,
} from "@/lib/ai/project-discovery-prompts";

export const metadata: Metadata = {
  title: "พรอมป์หาโปรเจกต์ของตัวเอง | ProjectSeed",
  description:
    "พรอมป์ฟรีสำหรับคุยกับ AI เพื่อหาโปรเจกต์ที่เธออยากทำจริง ๆ — AI จะถาม ไม่ใช่คิดให้ ใช้กับ ChatGPT, Claude หรือ Gemini ก็ได้",
};

const GRADES: GradeLevel[] = ["M4", "M5", "M6"];

/**
 * Prompts are built at render time rather than fetched, so the page works with
 * no auth, no API route, and no client-side AI dependency. The student takes
 * the text to whatever assistant they already use.
 */
function buildPrompts(): Record<GradeLevel, string> {
  return GRADES.reduce(
    (acc, gradeLevel) => {
      acc[gradeLevel] = buildProjectDiscoverySystemPrompt({ gradeLevel });
      return acc;
    },
    {} as Record<GradeLevel, string>
  );
}

export default function ProjectSeedPromptPage() {
  const prompts = buildPrompts();
  const greeting = buildProjectDiscoveryGreeting({});

  return (
    <div className="dawn-theme relative min-h-screen overflow-hidden">
      <DawnScene />

      <main className="relative z-10 mx-auto flex w-full max-w-2xl flex-col px-4 py-12 sm:px-6 sm:py-16">
        <Hero />
        <div className="mt-10">
          <PromptCopy prompts={prompts} greeting={greeting} />
        </div>
        <SafetyNotice />
      </main>
    </div>
  );
}

function Hero() {
  return (
    <header className="flex flex-col gap-5">
      <p className="dawn-eyebrow">ProjectSeed</p>

      <h1 className="text-3xl font-bold leading-tight text-white sm:text-4xl">
        หาโปรเจกต์ที่เธออยากทำจริง ๆ
      </h1>

      <hr className="dawn-rule" />

      <p className="text-lg leading-relaxed text-slate-300">
        พรอมป์ฟรี เอาไปคุยกับ AI ตัวไหนก็ได้ มันจะถามเธอไปเรื่อย ๆ
        จนกว่าเธอจะเจอโปรเจกต์ที่เป็นของเธอเอง
      </p>

      {/* The refusal is the product, so it gets the page's single warm accent.
          Everything else on this page stays cool and interactive-blue. */}
      <div className="dawn-keynote">
        <p className="text-[15px] leading-relaxed text-slate-200">
          <span className="font-semibold text-amber-200">AI จะไม่คิดโปรเจกต์ให้</span> — ตั้งใจให้เป็นแบบนั้น
          <br />
          โปรเจกต์ที่คนอื่นคิดให้ มันไม่ใช่ของเธอ แล้วคนอ่านพอร์ตเขาดูออก
          <br />
          หน้าที่ AI คือถามให้เธอคิดออกเอง
        </p>
      </div>

      <ul className="dawn-list flex flex-col gap-1.5 text-[15px] text-slate-400">
        <li>ใช้เวลาประมาณ 20 นาที</li>
        <li>ไม่ต้องสมัคร ไม่ต้องกรอกอะไร ฟรี</li>
        <li>จบแล้วได้โปรเจกต์ 1 อัน + สิ่งที่ต้องทำภายในสัปดาห์นี้ 1 อย่าง</li>
      </ul>
    </header>
  );
}

/**
 * A conversation about "why you" reliably surfaces family pressure and exam
 * anxiety in some fraction of students. The prompt handles escalation in-chat;
 * this puts the same numbers where a student can see them without starting.
 */
function SafetyNotice() {
  return (
    <footer className="mt-12 flex flex-col gap-4 border-t border-white/10 pt-6">
      <div>
        <h2 className="dawn-eyebrow mb-3">ก่อนเริ่ม อ่านสองข้อนี้</h2>
        <ul className="dawn-list flex flex-col gap-2 text-sm leading-relaxed text-slate-400">
          <li>
            <span className="text-slate-300">อย่าใส่ข้อมูลส่วนตัว</span> — ชื่อจริง เลขบัตรประชาชน
            เบอร์โทร ที่อยู่ ทั้งของเธอและของคนอื่น ใช้ชื่อเล่นก็พอ
          </li>
          <li>
            <span className="text-slate-300">เวลาไปคุยกับคนที่เจอปัญหา</span> — คุยในที่สาธารณะ
            ที่โรงเรียน หรือที่บ้านโดยมีผู้ใหญ่อยู่ด้วย ไม่ต้องไปเจอคนที่ไม่รู้จัก
          </li>
        </ul>
      </div>

      <div className="rounded-xl border border-white/10 bg-slate-950/40 p-4">
        <p className="text-sm leading-relaxed text-slate-400">
          ถ้าระหว่างคุยแล้วรู้สึกหนักเกินไป ไม่ว่าเรื่องเรียนหรือเรื่องที่บ้าน
          — คุยกับผู้ใหญ่ที่ไว้ใจ ครูแนะแนว หรือโทร{" "}
          <span className="font-semibold text-slate-200">
            กรมสุขภาพจิต {MENTAL_HEALTH_HOTLINE_TH}
          </span>{" "}
          (24 ชม.) หรือ Samaritans {SAMARITANS_TH} · ฉุกเฉิน โทร 1669
        </p>
      </div>

      {/* Section 5A requires that a student using an AI tool alone can reach the
          policy that says what ProjectSeed is and is not responsible for. */}
      <p className="text-sm leading-relaxed text-slate-400">
        เราไม่ได้เป็นเจ้าของ AI ที่เธอใช้ และมองไม่เห็นบทสนทนาของเธอ —{" "}
        <a
          href="/projectseed/safeguarding"
          className="text-blue-300 underline underline-offset-4 hover:text-blue-200"
        >
          อ่านนโยบายคุ้มครองเด็กของ ProjectSeed
        </a>
      </p>
    </footer>
  );
}
