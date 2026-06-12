"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  CheckCircle2,
  LogIn,
  MessageSquareHeart,
  Sparkles,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { HackathonFeedbackForm } from "@/components/hackathon/feedback/HackathonFeedbackForm";
import type { HackathonFeedbackInput } from "@/lib/hackathon/feedback";

type Participant = {
  name: string;
  grade_level: string;
};

type Toast = {
  type: "error" | "success";
  message: string;
};

export default function HackathonFeedbackPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [participant, setParticipant] = useState<Participant | null>(null);
  const [storedFeedback, setStoredFeedback] = useState<Record<
    string,
    unknown
  > | null>(null);
  const [toast, setToast] = useState<Toast | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadFeedback() {
      try {
        const participantResponse = await fetch("/api/hackathon/me");
        if (!participantResponse.ok) {
          if (!cancelled) setParticipant(null);
          return;
        }

        const participantPayload = await participantResponse.json();
        if (!participantPayload.participant) {
          if (!cancelled) setParticipant(null);
          return;
        }

        if (!cancelled) {
          setParticipant({
            name: participantPayload.participant.name || "",
            grade_level: participantPayload.participant.grade_level || "",
          });
        }

        const feedbackResponse = await fetch("/api/hackathon/feedback");
        if (!feedbackResponse.ok) return;
        const feedbackPayload = await feedbackResponse.json();
        if (!cancelled) setStoredFeedback(feedbackPayload.data || null);
      } catch (error) {
        console.error("Failed to load hackathon feedback:", error);
        if (!cancelled) setParticipant(null);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    loadFeedback();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timeout = window.setTimeout(() => setToast(null), 5000);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  const submitFeedback = async (feedback: HackathonFeedbackInput) => {
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/hackathon/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(feedback),
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "ส่งฟีดแบ็กไม่สำเร็จ");
      }

      setStoredFeedback(result.data);
      setToast({
        type: "success",
        message: "ขอบคุณสำหรับฟีดแบ็ก คำตอบของคุณถูกบันทึกแล้ว",
      });
      window.setTimeout(() => router.push("/hackathon/dashboard"), 1400);
    } catch (error) {
      setToast({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "ส่งไม่สำเร็จ กรุณาลองอีกครั้ง",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="dawn-theme relative min-h-screen overflow-hidden bg-[#020617] px-4 py-8 text-slate-200 sm:px-6 sm:py-12">
      <Atmosphere />

      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            role={toast.type === "error" ? "alert" : "status"}
            className={`fixed left-1/2 top-4 z-50 flex w-[calc(100%-2rem)] max-w-md -translate-x-1/2 items-start gap-3 rounded-xl border px-4 py-3 font-[family-name:var(--font-bai-jamjuree)] text-sm shadow-2xl backdrop-blur-xl ${
              toast.type === "success"
                ? "border-emerald-300/25 bg-emerald-950/90 text-emerald-100"
                : "border-red-300/25 bg-red-950/90 text-red-100"
            }`}
          >
            {toast.type === "success" ? (
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
            ) : (
              <X className="mt-0.5 h-5 w-5 shrink-0" />
            )}
            <span className="flex-1 leading-6">{toast.message}</span>
            <button
              type="button"
              onClick={() => setToast(null)}
              aria-label="ปิดข้อความ"
              className="min-h-11 min-w-11 rounded-lg p-2 opacity-70 transition-opacity hover:opacity-100"
            >
              <X className="h-4 w-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative z-10 mx-auto w-full max-w-5xl">
        <header className="mx-auto mb-8 max-w-2xl text-center sm:mb-10">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-indigo-300/20 bg-indigo-300/[0.08] px-3 py-1.5 font-[family-name:var(--font-bai-jamjuree)] text-xs font-semibold text-indigo-200">
            <Sparkles className="h-4 w-4" aria-hidden="true" />
            The Next Decade Hackathon
          </div>
          <h1 className="font-[family-name:var(--font-kodchasan)] text-3xl font-semibold leading-tight text-white sm:text-4xl">
            ช่วยเราทำรุ่นต่อไปให้ดีกว่าเดิม
          </h1>
          <p className="mx-auto mt-3 max-w-xl font-[family-name:var(--font-bai-jamjuree)] text-sm leading-6 text-slate-400 sm:text-base">
            เล่าแบบตรงไปตรงมา ทั้งสิ่งที่เวิร์ก สิ่งที่ควรปรับ
            และสิ่งที่อยากไปต่อหลังจบโครงการ
          </p>
        </header>

        {isLoading ? (
          <LoadingState />
        ) : participant ? (
          <HackathonFeedbackForm
            participantName={participant.name}
            participantGrade={participant.grade_level}
            initialFeedback={storedFeedback}
            alreadySubmitted={Boolean(storedFeedback)}
            isSubmitting={isSubmitting}
            onSubmit={submitFeedback}
          />
        ) : (
          <LoginState onLogin={() => router.push("/hackathon/login")} />
        )}
      </div>
    </div>
  );
}

function Atmosphere() {
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0">
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(to bottom, #020617 0%, #0f172a 28%, #1e1b4b 58%, #312e81 82%, #1e3a5f 100%)",
        }}
      />
      <motion.div
        className="absolute -left-[15%] top-[8%] h-[28rem] w-[28rem] rounded-full bg-blue-500/15 blur-[100px]"
        animate={{ x: [0, 22, 0], y: [0, -12, 0], opacity: [0.55, 0.8, 0.55] }}
        transition={{ duration: 17, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute -right-[15%] top-[3%] h-[30rem] w-[30rem] rounded-full bg-violet-500/15 blur-[110px]"
        animate={{ x: [0, -18, 0], y: [0, 15, 0], opacity: [0.5, 0.72, 0.5] }}
        transition={{ duration: 19, repeat: Infinity, ease: "easeInOut" }}
      />
      <div
        className="absolute inset-x-0 bottom-0 h-[38vh]"
        style={{
          background:
            "radial-gradient(ellipse 75% 100% at 50% 100%, rgba(254,217,92,0.12) 0%, transparent 70%)",
        }}
      />
      <div
        className="absolute inset-0 opacity-[0.035]"
        style={{
          backgroundImage:
            "radial-gradient(rgba(255,255,255,0.8) 0.7px, transparent 0.7px)",
          backgroundSize: "22px 22px",
        }}
      />
    </div>
  );
}

function LoadingState() {
  return (
    <div className="mx-auto max-w-2xl rounded-[24px] border border-white/10 bg-slate-950/50 p-6 backdrop-blur-xl sm:p-8">
      <div className="space-y-4">
        <div className="ei-skeleton h-6 w-32" />
        <div className="ei-skeleton h-10 w-2/3" />
        <div className="ei-skeleton h-16 w-full" />
        <div className="ei-skeleton h-16 w-full" />
      </div>
    </div>
  );
}

function LoginState({ onLogin }: { onLogin: () => void }) {
  return (
    <div className="mx-auto max-w-md rounded-[24px] border border-white/10 bg-slate-950/60 p-6 text-center shadow-[0_24px_80px_rgba(2,6,23,0.5)] backdrop-blur-xl sm:p-8">
      <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-indigo-300/20 bg-indigo-300/10 text-indigo-200">
        <MessageSquareHeart className="h-7 w-7" aria-hidden="true" />
      </span>
      <h2 className="mt-5 font-[family-name:var(--font-kodchasan)] text-2xl font-semibold text-white">
        เข้าสู่ระบบก่อนส่งฟีดแบ็ก
      </h2>
      <p className="mt-2 font-[family-name:var(--font-bai-jamjuree)] text-sm leading-6 text-slate-400">
        เราจะใช้ข้อมูลผู้เข้าร่วมที่มีอยู่แล้ว คุณไม่ต้องกรอกข้อมูลส่วนตัวซ้ำ
      </p>
      <button
        type="button"
        onClick={onLogin}
        className="ei-button-dawn mt-6 min-h-12 w-full text-base"
      >
        <LogIn className="h-4 w-4" aria-hidden="true" />
        <span>เข้าสู่ระบบ</span>
        <ArrowRight className="h-4 w-4" aria-hidden="true" />
      </button>
    </div>
  );
}
