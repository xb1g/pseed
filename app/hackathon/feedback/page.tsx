"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertCircle,
  CheckCircle,
  Info,
  X,
  Star,
  Phone,
  FlaskConical,
  HeartHandshake,
  Send,
  LogIn,
  ArrowRight,
  MessageSquareHeart,
  Sparkles,
  User,
} from "lucide-react";
import { useRouter } from "next/navigation";

type FeedbackData = {
  event_takeaways: string;
  mentorship_rating: number;
  can_make_social_change: boolean | null;
  would_do_again: boolean | null;
  improvement_suggestions: string;
  wants_call: boolean;
  wants_product_beta: boolean;
  wants_continue_mentorship: boolean;
};

const DEFAULT_FEEDBACK: FeedbackData = {
  event_takeaways: "",
  mentorship_rating: 0,
  can_make_social_change: null,
  would_do_again: null,
  improvement_suggestions: "",
  wants_call: false,
  wants_product_beta: false,
  wants_continue_mentorship: false,
};

export default function HackathonFeedbackPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [alreadySubmitted, setAlreadySubmitted] = useState(false);
  const [participantName, setParticipantName] = useState("");
  const [participantGrade, setParticipantGrade] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const [form, setForm] = useState<FeedbackData>(DEFAULT_FEEDBACK);
  const [toast, setToast] = useState<{
    message: string;
    type: "error" | "success" | "info";
  } | null>(null);

  const showToast = (
    message: string,
    type: "error" | "success" | "info" = "error"
  ) => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 5000);
  };

  useEffect(() => {
    setMounted(true);
    fetch("/api/hackathon/me")
      .then((r) => r.json())
      .then((data) => {
        if (data.participant) {
          setIsLoggedIn(true);
          setParticipantName(data.participant.name || "");
          setParticipantGrade(data.participant.grade_level || "");
          return fetch("/api/hackathon/feedback");
        } else {
          setIsLoggedIn(false);
          return null;
        }
      })
      .then((r) => (r ? r.json() : null))
      .then((data) => {
        if (data?.data) {
          setAlreadySubmitted(true);
          setForm({
            event_takeaways: data.data.event_takeaways || "",
            mentorship_rating: data.data.mentorship_rating || 0,
            can_make_social_change: data.data.can_make_social_change,
            would_do_again: data.data.would_do_again,
            improvement_suggestions: data.data.improvement_suggestions || "",
            wants_call: data.data.wants_call || false,
            wants_product_beta: data.data.wants_product_beta || false,
            wants_continue_mentorship: data.data.wants_continue_mentorship || false,
          });
        }
      })
      .catch(() => {
        setIsLoggedIn(false);
      });
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) entry.target.classList.add("in-view");
        });
      },
      { threshold: 0.5 }
    );
    const elements = document.querySelectorAll(".ei-button-dawn, .ei-card");
    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleRatingClick = (rating: number) => {
    setForm((prev) => ({ ...prev, mentorship_rating: rating }));
  };

  const handleBooleanSelect = (
    field: "can_make_social_change" | "would_do_again",
    value: boolean
  ) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleCheckboxToggle = (
    field: "wants_call" | "wants_product_beta" | "wants_continue_mentorship"
  ) => {
    setForm((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoggedIn) {
      showToast("กรุณาเข้าสู่ระบบก่อนส่งฟีดแบ็ก");
      return;
    }
    if (form.mentorship_rating === 0) {
      showToast("กรุณาให้คะแนนความพึงพอใจในการให้คำปรึกษา");
      return;
    }
    if (form.can_make_social_change === null) {
      showToast("กรุณาตอบคำถาม: คุณรู้สึกว่าสามารถเปลี่ยนแปลงสังคมได้ในอนาคตหรือไม่?");
      return;
    }
    if (form.would_do_again === null) {
      showToast("กรุณาตอบคำถาม: คุณอยากเข้าร่วมกิจกรรมแบบนี้อีกหรือไม่?");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/hackathon/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const result = await response.json();

      if (!response.ok) {
        showToast(result.error || "ส่งฟีดแบ็กไม่สำเร็จ");
        return;
      }

      showToast("ส่งฟีดแบ็กสำเร็จแล้ว! ขอบคุณมาก", "success");
      setAlreadySubmitted(true);
      setTimeout(() => {
        router.push("/hackathon/dashboard");
      }, 2000);
    } catch (error) {
      console.error("Submit error:", error);
      showToast("ส่งไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!mounted) return null;

  const toastIcons = {
    error: AlertCircle,
    success: CheckCircle,
    info: Info,
  };

  const isHighSchool =
    participantGrade.includes("ม.") ||
    ["ม.4", "ม.5", "ม.6", "ปวช."].includes(participantGrade);
  const gradeNote = isHighSchool ? " (สำหรับนักเรียน ม.4-ม.6)" : "";

  // ── Not logged in view ──
  if (isLoggedIn === false) {
    return (
      <div className="dawn-theme relative min-h-screen w-full overflow-hidden bg-[#020617] text-slate-200 font-[family-name:var(--font-mitr)] flex items-center justify-center py-12 sm:py-24 px-4 sm:px-6">
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(to bottom, #020617 0%, #0f172a 28%, #1e1b4b 58%, #312e81 82%, #1e3a5f 100%)",
            }}
          />
          <div
            className="absolute rounded-full blur-[80px] opacity-40 pointer-events-none"
            style={{
              width: "35vw",
              height: "35vw",
              left: "-5%",
              top: "15%",
              background:
                "radial-gradient(circle, rgba(59, 130, 246, 0.3) 0%, transparent 70%)",
            }}
          />
          <div
            className="absolute rounded-full blur-[80px] opacity-35 pointer-events-none"
            style={{
              width: "40vw",
              height: "40vw",
              right: "-5%",
              top: "-10%",
              background:
                "radial-gradient(circle, rgba(168, 85, 247, 0.3) 0%, transparent 70%)",
            }}
          />
          <div
            className="absolute rounded-full blur-[80px] opacity-30 pointer-events-none"
            style={{
              width: "45vw",
              height: "35vw",
              left: "15%",
              bottom: "10%",
              background:
                "radial-gradient(ellipse, rgba(99, 102, 241, 0.25) 0%, transparent 70%)",
            }}
          />
          <div
            className="absolute bottom-0 left-0 right-0 h-80 pointer-events-none opacity-50"
            style={{
              background:
                "radial-gradient(ellipse 75% 100% at 50% 100%, rgba(254, 217, 92, 0.2) 0%, transparent 100%)",
              filter: "blur(40px)",
            }}
          />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative z-10 w-full max-w-md mx-auto"
        >
          <div className="ei-card p-8 sm:p-10 text-center space-y-6">
            <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-blue-400/20 flex items-center justify-center">
              <MessageSquareHeart className="w-8 h-8 text-blue-300" />
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-medium text-white tracking-tight">
                ฟีดแบ็กแฮกกาธอน
              </h1>
              <p className="text-sm text-slate-400 leading-relaxed">
                ช่วยเราปรับปรุง The Next Decade Hackathon ให้ดีขึ้นสำหรับรุ่นต่อไป
              </p>
            </div>
            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <p className="text-sm text-slate-300 leading-relaxed">
                ถ้าคุณเคยเข้าร่วมแฮกกาธอน กรุณา{" "}
                <span className="text-blue-300 font-medium">เข้าสู่ระบบ</span>{" "}
                เพื่อส่งฟีดแบ็ก เราจะได้รู้ว่าคุณคือใครและติดต่อกลับได้ถูกคน
              </p>
            </div>
            <div className="space-y-3">
              <Button
                onClick={() => router.push("/hackathon/login")}
                className="ei-button-dawn w-full h-12 text-base"
              >
                <LogIn className="w-4 h-4 mr-2" />
                เข้าสู่ระบบ
              </Button>
              <Button
                variant="ghost"
                onClick={() => router.push("/hackathon")}
                className="w-full text-slate-400 hover:text-white hover:bg-white/5"
              >
                กลับหน้าแรกแฮกกาธอน
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  // ── Main form view (logged in or loading) ──
  return (
    <div className="dawn-theme relative min-h-screen w-full overflow-hidden bg-[#020617] text-slate-200 font-[family-name:var(--font-mitr)] flex items-center justify-center py-12 sm:py-24 px-4 sm:px-6">
      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <div className={`ei-toast ei-toast--${toast.type} in-view`}>
            {React.createElement(toastIcons[toast.type], { className: "w-5 h-5" })}
            <span className="flex-1 text-sm font-medium leading-snug">
              {toast.message}
            </span>
            <button
              onClick={() => setToast(null)}
              className="ei-toast-close"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </AnimatePresence>

      {/* Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to bottom, #020617 0%, #0f172a 28%, #1e1b4b 58%, #312e81 82%, #1e3a5f 100%)",
          }}
        />
        <div
          className="absolute rounded-full blur-[80px] opacity-40 pointer-events-none"
          style={{
            width: "35vw",
            height: "35vw",
            left: "-5%",
            top: "15%",
            background:
              "radial-gradient(circle, rgba(59, 130, 246, 0.3) 0%, transparent 70%)",
          }}
        />
        <div
          className="absolute rounded-full blur-[80px] opacity-35 pointer-events-none"
          style={{
            width: "40vw",
            height: "40vw",
            right: "-5%",
            top: "-10%",
            background:
              "radial-gradient(circle, rgba(168, 85, 247, 0.3) 0%, transparent 70%)",
          }}
        />
        <div
          className="absolute rounded-full blur-[80px] opacity-30 pointer-events-none"
          style={{
            width: "45vw",
            height: "35vw",
            left: "15%",
            bottom: "10%",
            background:
              "radial-gradient(ellipse, rgba(99, 102, 241, 0.25) 0%, transparent 70%)",
          }}
        />
        <div
          className="absolute bottom-0 left-0 right-0 h-80 pointer-events-none opacity-50"
          style={{
            background:
              "radial-gradient(ellipse 75% 100% at 50% 100%, rgba(254, 217, 92, 0.2) 0%, transparent 100%)",
            filter: "blur(40px)",
          }}
        />
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="relative z-10 w-full max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-16 xl:gap-24"
      >
        {/* Left side: hero text */}
        <div className="w-full lg:w-1/2 flex flex-col items-center lg:items-start text-center lg:text-left space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full bg-blue-500/10 border border-blue-400/20 px-4 py-2">
            <Sparkles className="w-4 h-4 text-blue-300" />
            <span className="text-xs font-medium text-blue-200 tracking-wide">
              The Next Decade Hackathon 2026
            </span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-medium tracking-tight text-white leading-tight">
            แบ่งปัน
            <br className="hidden sm:block" />
            <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              ประสบการณ์
            </span>
            <br className="hidden sm:block" />
            ของคุณ
          </h1>

          <p className="text-base sm:text-lg text-slate-300 max-w-lg font-medium leading-relaxed">
            ความคิดเห็นของคุณช่วยให้เราปรับปรุงแฮกกาธอนให้ดีขึ้นสำหรับผู้เข้าร่วมรุ่นต่อไป
            ใช้เวลาไม่กี่นาที แต่มีความหมายมาก
          </p>

          {participantName && (
            <div className="flex items-center gap-3 rounded-xl bg-white/5 border border-white/10 px-4 py-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500/30 to-purple-500/30 flex items-center justify-center">
                <User className="w-5 h-5 text-blue-300" />
              </div>
              <div>
                <p className="text-sm text-white font-medium">{participantName}</p>
                <p className="text-xs text-slate-400">ผู้เข้าร่วมแฮกกาธอน</p>
              </div>
            </div>
          )}

          {alreadySubmitted && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl px-4 py-3 text-emerald-300 text-sm font-medium flex items-center gap-2"
            >
              <CheckCircle className="w-4 h-4" />
              คุณได้ส่งฟีดแบ็กแล้ว — สามารถอัปเดตคำตอบด้านล่างได้
            </motion.div>
          )}
        </div>

        {/* Right side: form card */}
        <div className="w-full lg:w-1/2 max-w-xl mx-auto lg:mx-0 mt-8 lg:mt-0">
          <div className="ei-card">
            <div className="p-5 sm:p-8 md:p-10 space-y-6">
              <div className="space-y-1.5">
                <h2 className="text-2xl font-medium text-white tracking-tight">
                  ฟีดแบ็กแฮกกาธอน
                </h2>
                <p className="text-sm text-slate-400 font-medium">
                  {participantName
                    ? `สวัสดี ${participantName}! บอกเราหน่อยว่าคุณคิดยังไง`
                    : "บอกเราหน่อยว่าคุณคิดยังไง"}
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Q1: Event takeaways */}
                <div className="space-y-2">
                  <p className="text-sm font-medium text-slate-200">
                    คุณได้อะไรจากกิจกรรม 3 เดือนนี้?
                  </p>
                  <Textarea
                    id="event_takeaways"
                    name="event_takeaways"
                    rows={3}
                    placeholder="ทักษะใหม่ ๆ เพื่อนร่วมทีม หรือประสบการณ์ที่ประทับใจ..."
                    value={form.event_takeaways}
                    onChange={handleChange}
                    className="ei-input resize-none py-3"
                  />
                </div>

                {/* Q2: Mentorship rating */}
                <div className="space-y-2">
                  <p className="text-sm font-medium text-slate-200">
                    การให้คำปรึกษาเป็นอย่างไร?
                  </p>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => handleRatingClick(star)}
                        className="p-1 transition-transform hover:scale-110"
                        aria-label={`ให้คะแนน ${star} ดาว`}
                      >
                        <Star
                          className={`w-7 h-7 transition-colors ${
                            star <= form.mentorship_rating
                              ? "text-yellow-400 fill-yellow-400"
                              : "text-slate-600 hover:text-slate-500"
                          }`}
                        />
                      </button>
                    ))}
                    <span className="ml-2 text-sm text-slate-400 font-medium">
                      {form.mentorship_rating > 0
                        ? `${form.mentorship_rating}/5`
                        : "แตะดาวเพื่อให้คะแนน"}
                    </span>
                  </div>
                </div>

                {/* Q3: Can make social change */}
                <div className="space-y-2">
                  <p className="text-sm font-medium text-slate-200">
                    คุณรู้สึกว่าสามารถเปลี่ยนแปลงสังคมได้ในอนาคตหรือไม่?
                  </p>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => handleBooleanSelect("can_make_social_change", true)}
                      className={`flex-1 py-3 px-4 rounded-xl text-sm font-medium transition-all border ${
                        form.can_make_social_change === true
                          ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-300"
                          : "bg-white/5 border-white/10 text-slate-400 hover:bg-white/10"
                      }`}
                    >
                      <span className="flex items-center justify-center gap-2">
                        <Sparkles className="w-4 h-4" />
                        ใช่ ทำได้
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleBooleanSelect("can_make_social_change", false)}
                      className={`flex-1 py-3 px-4 rounded-xl text-sm font-medium transition-all border ${
                        form.can_make_social_change === false
                          ? "bg-red-500/20 border-red-500/50 text-red-300"
                          : "bg-white/5 border-white/10 text-slate-400 hover:bg-white/10"
                      }`}
                    >
                      <span className="flex items-center justify-center gap-2">
                        <X className="w-4 h-4" />
                        ยังไม่แน่ใจ
                      </span>
                    </button>
                  </div>
                </div>

                {/* Q4: Would do again */}
                <div className="space-y-2">
                  <p className="text-sm font-medium text-slate-200">
                    อยากเข้าร่วมกิจกรรมแบบนี้อีกไหม?
                  </p>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => handleBooleanSelect("would_do_again", true)}
                      className={`flex-1 py-3 px-4 rounded-xl text-sm font-medium transition-all border ${
                        form.would_do_again === true
                          ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-300"
                          : "bg-white/5 border-white/10 text-slate-400 hover:bg-white/10"
                      }`}
                    >
                      <span className="flex items-center justify-center gap-2">
                        <HeartHandshake className="w-4 h-4" />
                        อยากมาก
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleBooleanSelect("would_do_again", false)}
                      className={`flex-1 py-3 px-4 rounded-xl text-sm font-medium transition-all border ${
                        form.would_do_again === false
                          ? "bg-red-500/20 border-red-500/50 text-red-300"
                          : "bg-white/5 border-white/10 text-slate-400 hover:bg-white/10"
                      }`}
                    >
                      <span className="flex items-center justify-center gap-2">
                        <X className="w-4 h-4" />
                        ไม่อยาก
                      </span>
                    </button>
                  </div>
                </div>

                {/* Q5: Improvements */}
                <div className="space-y-2">
                  <p className="text-sm font-medium text-slate-200">
                    เราควรปรับปรุงตรงไหน?
                  </p>
                  <Textarea
                    id="improvement_suggestions"
                    name="improvement_suggestions"
                    rows={3}
                    placeholder="พูดตรง ๆ เลย — เราอยากพัฒนาให้ดีขึ้นจริง ๆ..."
                    value={form.improvement_suggestions}
                    onChange={handleChange}
                    className="ei-input resize-none py-3"
                  />
                </div>

                {/* Follow-up Opportunities */}
                <div className="border-t border-white/10 pt-5 space-y-4">
                  <p className="text-sm font-medium text-slate-200">
                    โอกาสต่อเนื่อง (เลือกได้มากกว่าหนึ่ง)
                  </p>

                  {/* Want a call */}
                  <label className="flex items-start gap-3 p-4 rounded-xl bg-white/5 border border-white/10 cursor-pointer hover:bg-white/10 transition-colors">
                    <input
                      type="checkbox"
                      checked={form.wants_call}
                      onChange={() => handleCheckboxToggle("wants_call")}
                      className="mt-0.5 w-4 h-4 accent-blue-500 rounded"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 text-sm text-white font-medium">
                        <Phone className="w-4 h-4 text-blue-400" />
                        อยากให้เราโทรหา
                      </div>
                      <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                        เราจะใช้เบอร์โทรในโปรไฟล์ของคุณติดต่อกลับ เพื่อคุยต่อเรื่องโอกาสที่น่าสนใจ
                      </p>
                    </div>
                  </label>

                  {/* Test new product */}
                  <label className="flex items-start gap-3 p-4 rounded-xl bg-white/5 border border-white/10 cursor-pointer hover:bg-white/10 transition-colors">
                    <input
                      type="checkbox"
                      checked={form.wants_product_beta}
                      onChange={() => handleCheckboxToggle("wants_product_beta")}
                      className="mt-0.5 w-4 h-4 accent-purple-500 rounded"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 text-sm text-white font-medium">
                        <FlaskConical className="w-4 h-4 text-purple-400" />
                        ทดลองใช้ผลิตภัณฑ์ใหม่{gradeNote}
                      </div>
                      <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                        เครื่องมือวางแผนอนาคต พร้อมชุมชน ข้อมูลตลาดแรงงาน ประสบการณ์จริง และที่ปรึกษา
                      </p>
                    </div>
                  </label>

                  {/* Continue mentorship */}
                  <label className="flex items-start gap-3 p-4 rounded-xl bg-white/5 border border-white/10 cursor-pointer hover:bg-white/10 transition-colors">
                    <input
                      type="checkbox"
                      checked={form.wants_continue_mentorship}
                      onChange={() => handleCheckboxToggle("wants_continue_mentorship")}
                      className="mt-0.5 w-4 h-4 accent-pink-500 rounded"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 text-sm text-white font-medium">
                        <HeartHandshake className="w-4 h-4 text-pink-400" />
                        พัฒนาโปรเจกต์ต่อกับ PassionSeed
                      </div>
                      <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                        สร้างต่อไปด้วยคำแนะนำจากทีมเรา ใช้บัญชีเดิมได้เลย ไม่ต้องสมัครใหม่
                      </p>
                    </div>
                  </label>
                </div>

                {/* Submit */}
                <div className="pt-2">
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="ei-button-dawn w-full h-12 md:h-14 text-base md:text-lg"
                  >
                    {isSubmitting ? (
                      <span className="flex items-center gap-2">
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        กำลังส่ง...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <span>
                          {alreadySubmitted ? "อัปเดตฟีดแบ็ก" : "ส่งฟีดแบ็ก"}
                        </span>
                        <Send className="w-4 h-4" />
                      </span>
                    )}
                  </Button>
                </div>

                {alreadySubmitted && (
                  <p className="text-center text-xs text-slate-500">
                    คุณสามารถกลับมาแก้ไขคำตอบได้ตลอดเวลา
                  </p>
                )}
              </form>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
