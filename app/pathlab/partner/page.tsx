import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import {
  Zap,
  Cpu,
  Layers,
  Sparkles,
  TrendingUp,
  Clock,
  Coins,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Compass,
  Laptop,
  Flame,
  UserCheck,
  MessageCircle,
} from "lucide-react";
import { ELECTRICAL_ENGINEERING_PATH } from "@/lib/content/electrical-path";

export const metadata: Metadata = {
  title: "Co-create EE PathLab | PassionSeed x Lead Expert",
  description:
    "ชวนวิศวกรไฟฟ้า (Electrical & Hardware Engineer) ร่วมสร้าง Interactive Simulation Course สำหรับเด็กมัธยมและมหาวิทยาลัย",
};

export default function ElectricalEngineeringPartnerPage() {
  const path = ELECTRICAL_ENGINEERING_PATH;

  return (
    <div className="min-h-screen dusk-theme relative overflow-x-hidden text-slate-100">
      {/* Background Ambience */}
      <div className="lobby-backdrop" aria-hidden="true" />
      <div className="lobby-backdrop__grain" aria-hidden="true" />
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 -z-[8] bg-[linear-gradient(180deg,rgba(24,6,32,0.45)_0%,rgba(24,6,32,0.2)_42%,rgba(24,6,32,0.5)_100%)]"
      />

      {/* Navigation Bar */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-[#160624]/75 border-b border-white/10 px-4 py-3 sm:px-8">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <Image
              src="/passionseed-logo.svg"
              alt="PassionSeed"
              width={32}
              height={32}
              priority
            />
            <span className="font-bold tracking-tight text-white text-base">
              PassionSeed
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <a
              href="#contact-cta"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-amber-400/15 text-amber-200 border border-amber-400/30 hover:bg-amber-400/25 transition-all"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Co-create with us</span>
            </a>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="lobby-plate relative z-10 mx-auto w-full max-w-4xl px-5 pt-10 pb-24 sm:pt-16">
        
        {/* HERO SECTION */}
        <section className="text-center lobby-rise">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-amber-400/30 bg-amber-400/10 text-amber-200 text-xs font-medium mb-6">
            <Zap className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
            <span>PathLab Co-Creation Invitation · Electrical Engineering</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight sm:leading-tight text-balance">
            มาร่วมสร้าง <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-amber-200 to-rose-300">EE PathLab</span> เปลี่ยนโลกการเรียนรู้วิศวะไฟฟ้า
          </h1>

          <p className="mt-5 text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed text-pretty">
            เรากำลังมองหา <strong className="text-amber-200 font-semibold">วิศวกรไฟฟ้าหน้างานจริง</strong> มาร่วมเป็น Lead Expert ออกแบบ Interactive Mission จำลองการทำงานจริง ให้เด็กรุ่นใหม่ได้ค้นพบตัวตนก่อนเลือกเรียนหรือเข้าสู่อุตสาหกรรม
          </p>

          {/* Quick Metrics Bar */}
          <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-3xl mx-auto">
            <div className="ei-card p-3.5 text-center">
              <div className="text-amber-400 font-bold text-lg sm:text-xl">15-20 นาที</div>
              <div className="text-[0.75rem] text-slate-400 mt-0.5">Call คุยไอเดียเบื้องต้น</div>
            </div>
            <div className="ei-card p-3.5 text-center">
              <div className="text-amber-400 font-bold text-lg sm:text-xl">Zero Burden</div>
              <div className="text-[0.75rem] text-slate-400 mt-0.5">ทีมงานซัพพอร์ตระบบให้หมด</div>
            </div>
            <div className="ei-card p-3.5 text-center">
              <div className="text-amber-400 font-bold text-lg sm:text-xl">Rev Share</div>
              <div className="text-[0.75rem] text-slate-400 mt-0.5">ส่วนแบ่งรายได้ตามโปรเจกต์</div>
            </div>
            <div className="ei-card p-3.5 text-center">
              <div className="text-amber-400 font-bold text-lg sm:text-xl">Lead Expert</div>
              <div className="text-[0.75rem] text-slate-400 mt-0.5">เครดิตและโปรไฟล์ทางการ</div>
            </div>
          </div>
        </section>

        {/* WHY THIS MATTERS / THE GOAL */}
        <section className="mt-14 lobby-rise" style={{ animationDelay: "100ms" }}>
          <div className="ei-card p-6 sm:p-8">
            <div className="flex items-center gap-2.5 mb-4">
              <Compass className="w-6 h-6 text-amber-400" />
              <h2 className="text-xl sm:text-2xl font-bold text-white">
                เป้าหมายของโปรเจกต์นี้คืออะไร?
              </h2>
            </div>
            <p className="text-slate-300 leading-relaxed text-sm sm:text-base">
              ในระบบการศึกษาปัจจุบัน เด็กส่วนใหญ่เรียนทฤษฎีไฟฟ้าผ่านการท่องจำสมการและสูตรคำนวณ แต่แทบไม่เคยเห็นว่า <strong>"วิศวกรไฟฟ้าหน้างานจริงต้องคิดและตัดสินใจอย่างไร"</strong> เด็กจำนวนมากเรียนจบมาแล้วพบว่าไม่ชอบงานสายนี้ หรือคนที่อาจจะเก่งกลับถอดใจไปก่อนเพราะมองไม่เห็นภาพ
            </p>
            <div className="mt-5 p-4 rounded-xl border border-amber-400/20 bg-amber-400/[0.06] text-amber-100 text-sm leading-relaxed flex items-start gap-3">
              <Flame className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <strong>Mission ของเรา:</strong> สร้าง <em>PathLab Simulation</em> จำลอง Case จริง ปัญหาหน้างานจริง และ Trade-offs ที่วิศวกรต้องเจอ เพื่อให้เด็กได้ลองสวมบทบาทลงมือแก้โจทย์จริงแบบ Interactive
              </div>
            </div>
          </div>
        </section>

        {/* PROPOSED CURRICULUM PREVIEW */}
        <section className="mt-14 lobby-rise" style={{ animationDelay: "150ms" }}>
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="text-xs font-semibold text-amber-300 uppercase tracking-wider">
                ร่างโครงสร้างเนื้อหา (Draft Arc)
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-white mt-1">
                การเดินทาง 5 วันของเด็กใน EE PathLab
              </h2>
            </div>
            <span className="text-xs px-3 py-1 rounded-full bg-white/10 text-slate-300 border border-white/10 hidden sm:inline-block">
              ปรับเปลี่ยนได้ตามความเชี่ยวชาญของคุณ
            </span>
          </div>

          <ol className="space-y-4">
            {path.days.map((day, idx) => (
              <li
                key={day.day}
                className="ei-card p-5 sm:p-6 transition-all hover:border-amber-400/30"
              >
                <div className="flex items-start gap-4">
                  <span
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold tabular-nums ${
                      day.isFinale
                        ? "bg-amber-400 text-[#2a0818] shadow-[0_0_15px_rgba(251,191,36,0.35)]"
                        : "border border-white/20 bg-[#250d3a] text-amber-200"
                    }`}
                  >
                    {day.day}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                      <h3 className="text-base sm:text-lg font-semibold text-white">
                        {day.titleTh}
                      </h3>
                      <span className="text-xs text-amber-300/80 font-mono">
                        {day.titleEn}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-slate-300 leading-relaxed">
                      {day.bodyTh}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {day.skills.map((skill) => (
                        <span
                          key={skill}
                          className="px-2.5 py-0.5 rounded-md text-xs font-medium border border-white/10 bg-white/[0.04] text-slate-300"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </section>

        {/* WHY JOIN US & VALUE PROPOSITION */}
        <section className="mt-14 lobby-rise" style={{ animationDelay: "200ms" }}>
          <h2 className="text-xl sm:text-2xl font-bold text-white mb-6 text-center">
            ทำไมถึงอยากชวนคุณมาร่วม Co-create?
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="ei-card p-6">
              <div className="h-10 w-10 rounded-xl bg-amber-400/10 border border-amber-400/20 flex items-center justify-center text-amber-400 mb-4">
                <Laptop className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white mb-2">
                1. ไม่เสียเวลาเยอะ (We do the heavy lifting)
              </h3>
              <p className="text-sm text-slate-300 leading-relaxed">
                ทีมงาน PassionSeed จัดการเรื่องสถาปัตยกรรมหลักสูตร, กราฟิก, โค้ดอินเตอร์แอคทีฟ และระบบวัดผลให้ทั้งหมด คุณเพียงมาแชร์โจทย์จริง, Real-world case study และช่วยรีวิวความถูกต้อง
              </p>
            </div>

            <div className="ei-card p-6">
              <div className="h-10 w-10 rounded-xl bg-amber-400/10 border border-amber-400/20 flex items-center justify-center text-amber-400 mb-4">
                <Coins className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white mb-2">
                2. Revenue Share & ค่าตอบแทน
              </h3>
              <p className="text-sm text-slate-300 leading-relaxed">
                มีโมเดลส่วนแบ่งรายได้จากผู้เรียนและค่าตอบแทนโปรเจกต์ที่ชัดเจนและเป็นธรรม ยิ่งหลักสูตรมีคุณภาพและมีผู้เรียนต่อเนื่อง คุณก็ได้รับผลตอบแทนระยะยาว
              </p>
            </div>

            <div className="ei-card p-6">
              <div className="h-10 w-10 rounded-xl bg-amber-400/10 border border-amber-400/20 flex items-center justify-center text-amber-400 mb-4">
                <UserCheck className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white mb-2">
                3. Lead Expert Profile & Credibility
              </h3>
              <p className="text-sm text-slate-300 leading-relaxed">
                คุณจะได้รับการโปรโมตในฐานะ Lead Creator ผู้เชี่ยวชาญด้าน Electrical Engineering บนแพลตฟอร์มการศึกษารุ่นใหม่ พร้อม Portfolio หน้าโปรไฟล์ที่ส่งต่อได้
              </p>
            </div>

            <div className="ei-card p-6">
              <div className="h-10 w-10 rounded-xl bg-amber-400/10 border border-amber-400/20 flex items-center justify-center text-amber-400 mb-4">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white mb-2">
                4. อิมแพกต์จริงต่อเด็กและวงการวิศวกรรม
              </h3>
              <p className="text-sm text-slate-300 leading-relaxed">
                สร้างสะพานเชื่อมระหว่างห้องเรียนกับอุตสาหกรรมจริง ช่วยให้เด็กที่กำลังลังเลตัดสินใจได้ถูกต้อง และผลิตวิศวกรรุ่นใหม่ที่มี Mindset ตรงกับความต้องการ
              </p>
            </div>
          </div>
        </section>

        {/* CALL TO ACTION / NEXT STEP */}
        <section
          id="contact-cta"
          className="mt-16 text-center lobby-rise"
          style={{ animationDelay: "250ms" }}
        >
          <div className="ei-card p-8 sm:p-10 relative overflow-hidden">
            <div className="relative z-10 max-w-xl mx-auto">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-amber-400/20 text-amber-300 mb-4">
                <MessageCircle className="w-6 h-6" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
                ชวนคุยสั้นๆ 15-20 นาที สบายๆ
              </h2>
              <p className="mt-3 text-slate-300 text-sm sm:text-base leading-relaxed">
                มาดู Prototype ของระบบ PathLab แลกเปลี่ยนไอเดียโจทย์วิศวะไฟฟ้าสนุกๆ โดยไม่มีข้อผูกมัดใดๆ ทั้งสิ้นครับ
              </p>

              <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
                <a
                  href="https://line.me/ti/p/~@passionseed"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ei-button-dusk w-full sm:w-auto px-6 py-3 justify-center text-sm font-semibold flex items-center gap-2"
                >
                  <span>ทักคุยกับทีมงานทาง LINE</span>
                  <ArrowRight className="w-4 h-4" />
                </a>

                <Link
                  href="/pathlab"
                  className="px-5 py-3 rounded-full border border-white/15 bg-white/5 hover:bg-white/10 text-slate-300 text-sm font-medium transition-all w-full sm:w-auto"
                >
                  ดูภาพรวม PathLab ของเรา
                </Link>
              </div>

              <p className="mt-4 text-xs text-slate-400">
                หรือตอบกลับเพื่อนที่ส่งลิงก์นี้ให้คุณ เพื่อเริ่มนัดเวลาที่สะดวกได้ทันทีครับ
              </p>
            </div>
          </div>
        </section>

      </main>
    </div>
  );
}
