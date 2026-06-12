import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  Clock3,
  MessageSquareHeart,
} from "lucide-react";

type FeedbackInvitationCardProps = {
  status: "loading" | "pending" | "complete";
};

const FEEDBACK_TOPICS = ["กิจกรรม", "เนื้อหาในแอป", "โอกาสต่อยอด"];

export function FeedbackInvitationCard({
  status,
}: FeedbackInvitationCardProps) {
  if (status === "loading") {
    return (
      <div
        aria-label="กำลังตรวจสอบสถานะฟีดแบ็ก"
        className="rounded-[24px] border border-white/10 bg-slate-950/45 p-5 text-left backdrop-blur-xl"
      >
        <div className="ei-skeleton h-5 w-28" />
        <div className="ei-skeleton mt-4 h-8 w-4/5" />
        <div className="ei-skeleton mt-3 h-12 w-full" />
      </div>
    );
  }

  if (status === "complete") {
    return (
      <section className="rounded-[24px] border border-emerald-300/20 bg-emerald-950/35 p-5 text-left shadow-[0_20px_60px_rgba(2,6,23,0.28)] backdrop-blur-xl">
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-emerald-300/20 bg-emerald-300/10 text-emerald-200">
            <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="font-[family-name:var(--font-kodchasan)] text-lg font-semibold text-white">
              ขอบคุณสำหรับฟีดแบ็ก
            </h2>
            <p className="mt-1 font-[family-name:var(--font-bai-jamjuree)] text-sm leading-6 text-emerald-100/70">
              คำตอบถูกบันทึกแล้ว และจะถูกใช้ปรับกิจกรรม เนื้อหา
              และโอกาสต่อไป
            </p>
            <Link
              href="/hackathon/feedback"
              className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-xl px-1 font-[family-name:var(--font-bai-jamjuree)] text-sm font-semibold text-emerald-200 transition-colors hover:text-white"
            >
              ดูหรือแก้ไขคำตอบ
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="relative overflow-hidden rounded-[28px] border border-indigo-300/25 bg-gradient-to-br from-indigo-950/85 via-slate-950/90 to-blue-950/85 p-5 text-left shadow-[0_24px_80px_rgba(30,27,75,0.42)] backdrop-blur-xl sm:p-6">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-12 -top-16 h-48 w-48 rounded-full bg-indigo-400/20 blur-3xl"
      />
      <div className="relative">
        <div className="flex flex-wrap items-center gap-2 font-[family-name:var(--font-bai-jamjuree)] text-xs font-semibold">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200/25 bg-amber-200/10 px-3 py-1.5 text-amber-100">
            <Clock3 className="h-3.5 w-3.5" aria-hidden="true" />
            ใช้เวลา 3–5 นาที
          </span>
          <span className="text-indigo-200">ช่วยปั้นรุ่นต่อไป</span>
        </div>

        <div className="mt-5 flex items-start gap-3">
          <span className="hidden h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-indigo-300/20 bg-indigo-300/10 text-indigo-200 sm:flex">
            <MessageSquareHeart className="h-6 w-6" aria-hidden="true" />
          </span>
          <div>
            <h2 className="font-[family-name:var(--font-kodchasan)] text-2xl font-semibold leading-tight text-white">
              ประสบการณ์ของคุณ ควรเปลี่ยนอะไรต่อ?
            </h2>
            <p className="mt-2 max-w-md font-[family-name:var(--font-bai-jamjuree)] text-sm leading-6 text-slate-300">
              บอกเราตรง ๆ ว่าอะไรเวิร์ก อะไรควรปรับ
              และโอกาสแบบไหนที่จะช่วยคุณได้จริง
            </p>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {FEEDBACK_TOPICS.map((topic) => (
            <span
              key={topic}
              className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5 font-[family-name:var(--font-bai-jamjuree)] text-xs text-slate-200"
            >
              {topic}
            </span>
          ))}
        </div>

        <Link
          href="/hackathon/feedback"
          className="ei-button-dawn mt-5 min-h-12 w-full text-base sm:w-auto"
        >
          <span>แชร์ฟีดแบ็ก 3–5 นาที</span>
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
        <p className="mt-3 font-[family-name:var(--font-bai-jamjuree)] text-xs leading-5 text-slate-400">
          ส่วนใหญ่เป็นตัวเลือก และไม่ต้องกรอกข้อมูลส่วนตัวซ้ำ
        </p>
      </div>
    </section>
  );
}
