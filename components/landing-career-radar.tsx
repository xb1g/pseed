"use client";

import { ArrowRight, Radar, TrendingUp, Briefcase, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useLanguage } from "@/lib/i18n/language-context";

const content = {
  en: {
    eyebrow: "Career Radar",
    title: "Explore careers before you commit.",
    subtitle:
      "Swipe through real career fields — see what each path actually looks like, how it scores on survival and growth, and which ones match your energy.",
    highlights: [
      {
        icon: Briefcase,
        title: "Real fields, real signals",
        description:
          "From AI Engineer to Therapist — each radar card breaks down a career with honest market signals.",
      },
      {
        icon: TrendingUp,
        title: "Survival score & outlook",
        description:
          "See demand, salary trajectory, and automation risk at a glance so you can choose with confidence.",
      },
      {
        icon: Sparkles,
        title: "Find your direction",
        description:
          "Save fields that spark your curiosity, then dive deeper into PathLabs and mentor conversations.",
      },
    ],
    cta: "Open Career Radar",
  },
  th: {
    eyebrow: "Career Radar",
    title: "สำรวจอาชีพก่อนตัดสินใจ",
    subtitle:
      "เลื่อนดูสายอาชีพต่างๆ ว่าแต่ละสายเป็นอย่างไร คะแนนความมั่นคงและการเติบโตเป็นแบบไหน และสายไหนตรงกับตัวคุณ",
    highlights: [
      {
        icon: Briefcase,
        title: "สายงานจริง สัญญาณจริง",
        description:
          "ตั้งแต่ AI Engineer ไปจนถึงนักจิตบำบัด — การ์ดแต่ละใบสรุปสายงานพร้อมข้อมูลตลาดที่เข้าใจง่าย",
      },
      {
        icon: TrendingUp,
        title: "คะแนนความมั่นคง & แนวโน้ม",
        description:
          "ดูความต้องการ แนวโน้มรายได้ และความเสี่ยงจาก AI ได้ในคราวเดียว เพื่อตัดสินใจอย่างมั่นใจ",
      },
      {
        icon: Sparkles,
        title: "ค้นหาทิศทางของตัวเอง",
        description:
          "บันทึกสายงานที่จุดประกายความสนใจ แล้วลงลึกผ่าน PathLab หรือปรึกษาพี่ในวงการ",
      },
    ],
    cta: "เปิด Career Radar",
  },
};

export function LandingCareerRadar() {
  const { language } = useLanguage();
  const t = content[language];

  return (
    <section className="py-24 bg-gradient-to-b from-[#0d0d0d] via-[#0a0a0f] to-[#0d0d0d] relative overflow-hidden border-t border-white/[0.03]">
      {/* Ambient radar glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[600px] bg-blue-950/15 rounded-full blur-[130px]" />
        <div className="absolute top-1/3 right-1/4 w-[400px] h-[400px] bg-purple-950/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-1/4 left-1/4 w-[300px] h-[300px] bg-orange-950/8 rounded-full blur-[90px]" />
      </div>

      {/* Top atmospheric fade */}
      <div className="absolute inset-x-0 -top-24 h-24 bg-gradient-to-b from-transparent to-[#0d0d0d] pointer-events-none" />

      <div className="container px-4 md:px-6 relative z-10 max-w-5xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left: copy */}
          <motion.div
            whileInView={{ opacity: 1, y: 0 }}
            initial={false}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <span className="inline-flex items-center rounded-full border border-blue-500/20 bg-blue-500/10 px-4 py-1.5 text-xs font-medium text-blue-400 tracking-widest uppercase mb-6">
              {t.eyebrow}
            </span>

            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-[1.05]">
              {t.title}
            </h2>

            <p className="text-lg md:text-xl text-gray-400 max-w-xl mb-10 leading-relaxed font-medium">
              {t.subtitle}
            </p>

            <Link
              href="/radar"
              className="ei-button-dusk inline-flex font-[family-name:var(--font-bai-jamjuree)]"
              style={{
                fontSize: "1.125rem",
                padding: "1rem 2.5rem",
                borderRadius: "14px",
              }}
            >
              {t.cta}
              <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5" />
            </Link>
          </motion.div>

          {/* Right: highlights */}
          <div className="space-y-4">
            {t.highlights.map((highlight, index) => (
              <motion.div
                key={index}
                whileInView={{ opacity: 1, y: 0 }}
                initial={false}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="ei-card group p-6 border border-white/[0.05] bg-white/[0.02] hover:border-blue-500/20 transition-colors duration-300"
              >
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 shrink-0 group-hover:scale-105 transition-transform duration-300">
                    <highlight.icon className="h-5 w-5 text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white mb-1">
                      {highlight.title}
                    </h3>
                    <p className="text-sm md:text-base text-gray-400 leading-relaxed">
                      {highlight.description}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
