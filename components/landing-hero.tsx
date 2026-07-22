"use client";

import { ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useLanguage } from "@/lib/i18n/language-context";
import { HeroBackground } from "@/components/hero-background";
import { LandingDemoPaths } from "@/components/landing-demo-paths";

const content = {
  en: {
    eyebrow: "No more career guessing",
    headline: "Try a career before you choose one.",
    subheadline:
      "5-day challenges built by working professionals. Design, code, research, heal — actually do the work.",
    cta: "Start for free",
  },
  th: {
    eyebrow: "เลิกเดาอนาคต",
    headline: "ลองลงมือทำจริง ก่อนเลือกคณะ",
    subheadline:
      "ลองทำโปรเจกต์ 5 วันที่ออกแบบโดยมือโปรในสายงานจริง ฟรีสำหรับนักเรียน",
    cta: "เริ่มต้นฟรี",
  },
};

export function LandingHero() {
  const { language } = useLanguage();
  const t = content[language];

  return (
    <section className="relative w-full min-h-[calc(100vh-var(--landing-header-offset,6.5rem))] flex flex-col items-center justify-center overflow-hidden pt-8 sm:pt-12">
      {/* Animated background with sunrise gradient */}
      <HeroBackground />

      {/* Main content container */}
      <div className="relative z-10 px-6 w-full max-w-7xl mx-auto">
        {/* Mobile: Text first, then demo paths */}
        <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-16">
          {/* Text content */}
          <div className="flex-1 flex flex-col items-center lg:items-start text-center lg:text-left">
            {/* Eyebrow */}
            <motion.span
              animate={{ opacity: 1, y: 0 }}
              initial={false}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="text-sm font-medium text-orange-300 tracking-wide uppercase mb-6"
            >
              {t.eyebrow}
            </motion.span>

            {/* Headline */}
            <motion.h1
              animate={{ opacity: 1, y: 0 }}
              initial={false}
              transition={{
                duration: 0.7,
                delay: 0.05,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white leading-[1.05] tracking-tight max-w-xl drop-shadow-[0_2px_30px_rgba(255,107,74,0.3)]"
            >
              {t.headline.split("\n")[0]}
            </motion.h1>

            {/* Subheadline */}
            <motion.p
              animate={{ opacity: 1, y: 0 }}
              initial={false}
              transition={{
                duration: 0.7,
                delay: 0.15,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="mt-6 text-base sm:text-lg md:text-xl text-amber-100/80 max-w-md font-medium leading-relaxed"
            >
              {t.subheadline}
            </motion.p>

            {/* CTA → plan wizard */}
            <motion.div
              animate={{ opacity: 1, y: 0 }}
              initial={false}
              transition={{
                duration: 0.7,
                delay: 0.25,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="mt-8 w-full sm:w-auto"
            >
              <Link
                href="/plan"
                className="ei-button-dusk w-full sm:w-auto justify-center"
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

            {/* Mobile demo paths - shown below text on mobile */}
            <div className="lg:hidden w-full max-w-sm mt-8">
              <LandingDemoPaths />
            </div>
          </div>

          {/* Desktop demo paths - shown on right side */}
          <div className="hidden lg:block w-80 flex-shrink-0">
            <LandingDemoPaths />
          </div>
        </div>

        {/* Scroll indicator - desktop only */}
      </div>

      <motion.div
        animate={{ opacity: 1 }}
        initial={false}
        transition={{ duration: 1, delay: 1, ease: [0.22, 1, 0.36, 1] }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 hidden lg:block"
      >
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="w-5 h-8 rounded-full border-2 border-amber-400/40 flex items-start justify-center p-1.5"
        >
          <motion.div
            animate={{ y: [0, 12, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="w-1 h-2 bg-amber-400/60 rounded-full"
          />
        </motion.div>
      </motion.div>
    </section>
  );
}
