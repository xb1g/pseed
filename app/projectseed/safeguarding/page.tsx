import { readFile } from "node:fs/promises";
import path from "node:path";

import type { Metadata } from "next";

import { DawnScene } from "@/components/projectseed/dawn-scene";
import { markdownToSafeHtml } from "@/lib/security/sanitize-html";
import {
  MENTAL_HEALTH_HOTLINE_TH,
  SAMARITANS_TH,
} from "@/lib/ai/project-discovery-prompts";

export const metadata: Metadata = {
  title: "นโยบายคุ้มครองเด็ก (Safeguarding) | ProjectSeed",
  description:
    "นโยบายคุ้มครองความปลอดภัยของนักเรียนใน ProjectSeed — ห้ามพี่เลี้ยงทักแชทส่วนตัวกับนักเรียนที่อายุต่ำกว่า 18 ปี และวิธีแจ้งเหตุ",
};

const POLICY_PATH = path.join(
  process.cwd(),
  "docs",
  "project",
  "PROJECTSEED-SAFEGUARDING.md"
);

/**
 * GFM task lists render as <input type="checkbox">, which the shared sanitizer
 * strips — leaving the section 11 launch gate looking like an ordinary list
 * with no indication of what is done. Swapping in glyphs preserves the meaning
 * without widening a security allowlist used by other surfaces.
 */
function preserveTaskBoxes(markdown: string): string {
  return markdown
    .replace(/^(\s*[-*]\s+)\[ \]\s+/gm, "$1☐ ")
    .replace(/^(\s*[-*]\s+)\[[xX]\]\s+/gm, "$1☑ ");
}

/**
 * The markdown file is the single source of record. Rendering it directly means
 * the published policy cannot drift from the one the team edits — a real risk
 * for a document that gets sent to parents as evidence of what we promised.
 */
async function loadPolicyHtml(): Promise<string> {
  const markdown = await readFile(POLICY_PATH, "utf8");
  return markdownToSafeHtml(preserveTaskBoxes(markdown));
}

export default async function SafeguardingPage() {
  const policyHtml = await loadPolicyHtml();

  return (
    <div className="dawn-theme relative min-h-screen overflow-hidden">
      <DawnScene />

      <main className="relative z-10 mx-auto flex w-full max-w-3xl flex-col px-4 py-12 sm:px-6 sm:py-16">
        <Hero />
        <ThaiSummary />
        <PolicyBody html={policyHtml} />
      </main>
    </div>
  );
}

function Hero() {
  return (
    <header className="flex flex-col gap-5">
      <p className="dawn-eyebrow">ProjectSeed</p>

      <h1 className="text-3xl font-bold leading-tight text-white sm:text-4xl">
        นโยบายคุ้มครองเด็ก
      </h1>

      <hr className="dawn-rule" />

      <p className="text-lg leading-relaxed text-slate-300">
        กติกาที่พี่เลี้ยงทุกคนต้องทำตาม เพื่อให้นักเรียนปลอดภัย —
        เปิดให้อ่านได้ทุกคน ไม่ต้องล็อกอิน
      </p>
    </header>
  );
}

/**
 * The full policy below is English. Thai parents and students are the people it
 * most needs to reach, so the parts they must act on are surfaced first, in
 * Thai, above the source text. This is a summary, not the reviewed translation
 * that section 11 requires before batch 1 — that is still outstanding.
 */
function ThaiSummary() {
  return (
    <section className="mt-10 flex flex-col gap-5" aria-labelledby="summary-th">
      <h2 id="summary-th" className="text-xl font-bold text-white">
        สรุปสำหรับผู้ปกครองและนักเรียน
      </h2>

      <div className="dawn-keynote">
        <p className="text-[15px] leading-relaxed text-slate-200">
          <span className="font-semibold text-amber-200">
            กติกาข้อที่ห้ามผิดเด็ดขาด: พี่เลี้ยงห้ามทักแชทส่วนตัวกับนักเรียนที่อายุต่ำกว่า 18 ปี
          </span>
          <br />
          การพูดคุยทุกอย่างต้องอยู่ในกลุ่มทางการของ ProjectSeed ที่มีผู้ใหญ่คนที่สองอยู่ด้วย
          <br />
          ถึงนักเรียนจะยินยอมเอง ก็ไม่ถือเป็นข้อยกเว้น
        </p>
      </div>

      <div className="ei-card ei-card--static p-5">
        <h3 className="mb-3 text-base font-semibold text-white">
          สิ่งที่ผู้ปกครองจะได้รับก่อนเริ่ม
        </h3>
        <ul className="dawn-list flex flex-col gap-2 text-[15px] leading-relaxed text-slate-300">
          <li>ชื่อและบทบาทของพี่เลี้ยงที่ดูแลลูกของท่าน</li>
          <li>ช่องทางที่ใช้คุยกัน และรูปแบบการนัดหมาย</li>
          <li>นโยบายฉบับนี้ และกติกาห้ามแชทส่วนตัว</li>
          <li>ชื่อผู้รับผิดชอบด้านความปลอดภัย และอีเมลสำหรับแจ้งเหตุ</li>
          <li>ท่านขอดูบันทึกการพูดคุยที่เกี่ยวกับลูกของท่านได้ทุกเมื่อ</li>
        </ul>
      </div>

      <div className="ei-card ei-card--static p-5">
        <h3 className="mb-3 text-base font-semibold text-white">
          ถ้ามีอะไรไม่ถูกต้อง แจ้งได้เลย
        </h3>
        <p className="mb-3 text-[15px] leading-relaxed text-slate-300">
          นักเรียน ผู้ปกครอง พี่เลี้ยง หรือใครก็ได้ แจ้งมาที่
        </p>
        <p className="mb-3 text-[15px] leading-relaxed text-white">
          บุณยสิทธิ์ ฟาง — ผู้รับผิดชอบด้านความปลอดภัย
          <br />
          <a
            href="mailto:seedpassion@gmail.com"
            className="font-semibold text-blue-300 underline underline-offset-4 hover:text-blue-200"
          >
            seedpassion@gmail.com
          </a>
        </p>
        <p className="text-[15px] leading-relaxed text-slate-300">
          <span className="text-white">นักเรียนไม่มีทางเดือดร้อนจากการแจ้ง</span> —
          ถ้าพี่เลี้ยงทักแชทส่วนตัวมา คนที่ผิดกติกาคือพี่เลี้ยง ไม่ใช่นักเรียน
          <br />
          ถ้ามีอันตรายเฉพาะหน้า โทร <span className="font-semibold text-white">1669</span> ก่อน
          แล้วค่อยแจ้งเรา
        </p>
      </div>

      <div className="rounded-xl border border-white/10 bg-slate-950/40 p-4">
        <p className="text-sm leading-relaxed text-slate-400">
          ถ้ารู้สึกหนักเกินไป ไม่ว่าเรื่องเรียนหรือเรื่องที่บ้าน — คุยกับผู้ใหญ่ที่ไว้ใจ ครูแนะแนว หรือโทร{" "}
          <span className="font-semibold text-slate-200">
            กรมสุขภาพจิต {MENTAL_HEALTH_HOTLINE_TH}
          </span>{" "}
          (24 ชม.) หรือ Samaritans {SAMARITANS_TH}
        </p>
      </div>

      {/* Honesty about the document's own status. A summary is not a translation
          and must not be presented as one. */}
      <p className="text-sm leading-relaxed text-slate-500">
        หมายเหตุ: ส่วนนี้เป็นสรุป ไม่ใช่คำแปลฉบับเต็ม ฉบับจริงเป็นภาษาอังกฤษด้านล่าง
        คำแปลภาษาไทยฉบับสมบูรณ์อยู่ระหว่างจัดทำ และต้องเสร็จก่อนเปิดรับรุ่นที่ 1
      </p>
    </section>
  );
}

function PolicyBody({ html }: { html: string }) {
  return (
    <section className="mt-12 border-t border-white/10 pt-8" aria-labelledby="policy-full">
      <h2 id="policy-full" className="mb-2 text-xl font-bold text-white">
        Full policy (English — source of record)
      </h2>
      <p className="mb-6 text-sm text-slate-400">
        ฉบับเต็มภาษาอังกฤษ ใช้เป็นฉบับอ้างอิงหลัก
      </p>

      <div
        className="safeguarding-prose"
        // Content is a repo-controlled markdown file, not user input, and is
        // sanitized on top of that.
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </section>
  );
}
