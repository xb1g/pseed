"use client";

import { motion, useInView } from "framer-motion";
import { useRef, useEffect, useState } from "react";
import { useLanguage } from "@/lib/i18n/language-context";
import { Quote, GraduationCap, CheckCircle2, Users, Target, School } from "lucide-react";
import {
  NOTES,
  REVIEWS,
  type AlumniReview,
} from "@/lib/content/pathlab-page";

/**
 * The quotes are the real alumni reviews from /pathlab (REVIEWS is the
 * single source of truth). They stay Thai in both language modes on
 * purpose: a verbatim quote stops being verbatim once translated, and the
 * IG handles are the receipt. Only the section chrome is translated.
 */

/** Card tints cycle through the landing palette. */
const CARD_COLORS = [
  "from-purple-500/20 to-purple-500/5",
  "from-blue-500/20 to-blue-500/5",
  "from-orange-500/20 to-orange-500/5",
  "from-emerald-500/20 to-emerald-500/5",
  "from-rose-500/20 to-rose-500/5",
  "from-amber-500/20 to-amber-500/5",
] as const;

/** First letter of the IG handle, for the avatar disc. */
function avatarLetter(handle: string): string {
  const match = handle.match(/[a-z0-9]/i);
  return match ? match[0].toUpperCase() : "★";
}

// Stats counter animation hook
function useCountUp(end: number, duration: number = 2, start: number = 0) {
  const [count, setCount] = useState(start);
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  useEffect(() => {
    if (!isInView) return;

    let startTime: number;
    let animationFrame: number;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / (duration * 1000), 1);
      const easeOut = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(start + (end - start) * easeOut));

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [isInView, end, duration, start]);

  return { count, ref };
}

const content = {
  en: {
    eyebrow: "Real Students, Real Results",
    title: "Join 20+ students who found their path.",
    subtitle: "Every direction report tells a story of self-discovery.",
    note: "Every quote written by the alumni themselves, unpaid and unprompted.",
    stats: {
      students: { value: 20, suffix: "+", label: "Students discovered their path" },
      paths: { value: 15, suffix: "+", label: "Career paths explored" },
      schools: { value: 5, suffix: "+", label: "Partner universities" },
    },
    badge: "Verified alumnus",
  },
  th: {
    eyebrow: "เสียงจากนักเรียนตัวจริง",
    title: "ร่วมกับนักเรียนกว่า 20 คนที่เจอทางที่ใช่",
    subtitle: "ทุกรีพอร์ตคือก้าวสำคัญของการค้นหาตัวเอง",
    note: NOTES.reviews,
    stats: {
      students: { value: 20, suffix: "+", label: "น้องๆ ที่เราได้ดูแล" },
      paths: { value: 15, suffix: "+", label: "สายอาชีพที่ได้สำรวจ" },
      schools: { value: 5, suffix: "+", label: "มหาวิทยาลัยชั้นนำ" },
    },
    badge: "รุ่นพี่ตัวจริง",
  },
};

function StatCard({
  value,
  suffix,
  label,
  icon: Icon,
  delay,
}: {
  value: number;
  suffix: string;
  label: string;
  icon: React.ElementType;
  delay: number;
}) {
  const { count, ref } = useCountUp(value, 2);

  return (
    <motion.div
      whileInView={{ opacity: 1, y: 0 }}
      initial={false}
      transition={{ duration: 0.6, delay }}
      viewport={{ once: true }}
      className="ei-card flex items-center gap-4 p-6 border border-white/[0.05] bg-white/[0.02]"
    >
      <div className="p-3 rounded-xl bg-white/5 border border-white/10">
        <Icon className="h-6 w-6 text-amber-400" />
      </div>
      <div>
        <div className="text-3xl font-bold text-white">
          <span ref={ref}>{count}</span>
          {suffix}
        </div>
        <div className="text-sm text-gray-400 font-medium">{label}</div>
      </div>
    </motion.div>
  );
}

function TestimonialCard({
  review,
  index,
  badge,
}: {
  review: AlumniReview;
  index: number;
  badge: string;
}) {
  /* Handles arrive as "IG:name"; the @ is the receipt that this is a real
     account, not a persona. */
  const handle = review.ig.replace(/^IG:/, "");

  return (
    <motion.div
      whileInView={{ opacity: 1, y: 0 }}
      initial={false}
      transition={{ duration: 0.6, delay: index * 0.1 + 0.3 }}
      viewport={{ once: true }}
      className={`ei-card group relative p-8 border border-white/[0.06] bg-gradient-to-br ${
        CARD_COLORS[index % CARD_COLORS.length]
      } hover:border-white/[0.12] transition-all duration-500`}
    >
      {/* Quote icon — aligned to card padding, larger, with theme-aware hover */}
      <Quote className="absolute top-8 right-8 h-10 w-10 text-white/[0.08] group-hover:text-white/[0.18] transition-colors duration-500" />

      {/* Badge — theme-matched verification status */}
      <div className="flex items-center gap-2 mb-6">
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/[0.08] border border-emerald-500/[0.18]">
          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
          <span className="text-xs font-semibold text-emerald-400 tracking-wide">{badge}</span>
        </div>
      </div>

      {/* Quote — improved typography with max line length */}
      <p className="text-slate-300 leading-[1.7] mb-8 text-[0.9375rem] max-w-[55ch]">
        &ldquo;{review.quote}&rdquo;
      </p>

      {/* Author — refined spacing and alignment */}
      <div className="flex items-center gap-3.5 pt-4 border-t border-white/[0.04]">
        <div className="w-11 h-11 rounded-full bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold text-sm">
          {avatarLetter(handle)}
        </div>
        <div className="min-w-0">
          <div className="font-semibold text-white text-sm">@{handle}</div>
          {review.by && (
            <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5">
              <GraduationCap className="h-3 w-3 flex-shrink-0" />
              <span className="truncate">{review.by}</span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export function LandingTestimonials({
  studentCount,
}: {
  /** Real onboarded-student count from the DB, via app/page.tsx. */
  studentCount?: number | null;
}) {
  const { language } = useLanguage();
  const t = content[language];

  /* The students stat is live data; the static 20 is only a fallback for
     when the count could not be fetched. */
  const studentsValue =
    studentCount && studentCount > 0 ? studentCount : t.stats.students.value;

  return (
    <section className="py-24 bg-[#0d0d0d] relative overflow-hidden border-t border-white/[0.03]">
      {/* Ambient background glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-purple-950/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-amber-950/10 rounded-full blur-[120px]" />
      </div>

      <div className="container px-4 md:px-6 relative z-10 max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <motion.span
            whileInView={{ opacity: 1, y: 0 }}
            initial={false}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="text-xs font-medium text-amber-400 tracking-widest uppercase mb-4 inline-block"
          >
            {t.eyebrow}
          </motion.span>
          <motion.h2
            whileInView={{ opacity: 1, y: 0 }}
            initial={false}
            transition={{ duration: 0.6, delay: 0.1 }}
            viewport={{ once: true }}
            className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-[1.05]"
          >
            {t.title}
          </motion.h2>
          <motion.p
            whileInView={{ opacity: 1, y: 0 }}
            initial={false}
            transition={{ duration: 0.6, delay: 0.15 }}
            viewport={{ once: true }}
            className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto font-medium leading-relaxed"
          >
            {t.subtitle}
          </motion.p>
          {/* Basecamp-style margin note: the quiet honest thing, highlighted
              and set at a casual angle. Yellow marker pops on the dark band. */}
          <motion.p
            whileInView={{ opacity: 1, y: 0 }}
            initial={false}
            transition={{ duration: 0.6, delay: 0.25 }}
            viewport={{ once: true }}
            className="pathlab-note-row"
          >
            <span className="pathlab-note pathlab-note--tilt-r">{t.note}</span>
          </motion.p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-12">
          <StatCard
            value={studentsValue}
            suffix={t.stats.students.suffix}
            label={t.stats.students.label}
            icon={Users}
            delay={0}
          />
          <StatCard
            value={t.stats.paths.value}
            suffix={t.stats.paths.suffix}
            label={t.stats.paths.label}
            icon={Target}
            delay={0.1}
          />
          <StatCard
            value={t.stats.schools.value}
            suffix={t.stats.schools.suffix}
            label={t.stats.schools.label}
            icon={School}
            delay={0.2}
          />
        </div>

        {/* Testimonials Grid: the real alumni reviews from /pathlab. The mix
            of long stories and two-word punch lines is the wall of love. */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {REVIEWS.map((review, index) => (
            <TestimonialCard
              key={review.ig + index}
              review={review}
              index={index}
              badge={t.badge}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
