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
    // Pre-fill name from hackathon session and check if feedback already submitted
    fetch("/api/hackathon/me")
      .then((r) => r.json())
      .then((data) => {
        if (data.participant?.name) {
          setParticipantName(data.participant.name);
        }
        if (data.participant?.grade_level) {
          setParticipantGrade(data.participant.grade_level);
        }
        return fetch("/api/hackathon/feedback");
      })
      .then((r) => r.json())
      .then((data) => {
        if (data.data) {
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
      .catch(() => {});
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

  const handleChange = (
    e: React.ChangeEvent<HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleRatingClick = (rating: number) => {
    setForm((prev) => ({ ...prev, mentorship_rating: rating }));
  };

  const handleBooleanToggle = (field: "can_make_social_change" | "would_do_again") => {
    setForm((prev) => ({ ...prev, [field]: prev[field] === true ? false : true }));
  };

  const handleCheckboxToggle = (field: "wants_call" | "wants_product_beta" | "wants_continue_mentorship") => {
    setForm((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (form.mentorship_rating === 0) {
      showToast("Please rate the mentorship");
      return;
    }
    if (form.can_make_social_change === null) {
      showToast("Please answer: Do you feel like you can make a change in society?");
      return;
    }
    if (form.would_do_again === null) {
      showToast("Please answer: Would you want to do something like this again?");
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
        showToast(result.error || "Failed to submit feedback");
        return;
      }

      showToast("Feedback submitted successfully!", "success");
      setAlreadySubmitted(true);
      setTimeout(() => {
        router.push("/hackathon/dashboard");
      }, 2000);
    } catch (error) {
      console.error("Submit error:", error);
      showToast("Failed to submit. Please try again.");
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

  const isHighSchool = participantGrade.includes("ม.") || ["ม.4", "ม.5", "ม.6", "ปวช."].includes(participantGrade);
  const gradeNote = isHighSchool ? " (สำหรับนักเรียน ม.4-ม.6)" : "";

  return (
    <div className="dawn-theme relative min-h-screen w-full overflow-hidden bg-[#020617] text-slate-200 font-[family-name:var(--font-mitr)] flex items-center justify-center py-12 sm:py-24 px-4 sm:px-6">
      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <div className={`ei-toast ei-toast--${toast.type} in-view`}>
            {React.createElement(toastIcons[toast.type], { className: "w-5 h-5" })}
            <span className="flex-1 text-sm font-medium leading-snug">{toast.message}</span>
            <button onClick={() => setToast(null)} className="ei-toast-close" aria-label="Close">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </AnimatePresence>

      {/* Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute inset-0"
          style={{ background: "linear-gradient(to bottom, #020617 0%, #0f172a 28%, #1e1b4b 58%, #312e81 82%, #1e3a5f 100%)" }}
        />
        <div className="absolute rounded-full blur-[80px] opacity-40 pointer-events-none" style={{ width: "35vw", height: "35vw", left: "-5%", top: "15%", background: "radial-gradient(circle, rgba(59, 130, 246, 0.3) 0%, transparent 70%)" }} />
        <div className="absolute rounded-full blur-[80px] opacity-35 pointer-events-none" style={{ width: "40vw", height: "40vw", right: "-5%", top: "-10%", background: "radial-gradient(circle, rgba(168, 85, 247, 0.3) 0%, transparent 70%)" }} />
        <div className="absolute rounded-full blur-[80px] opacity-30 pointer-events-none" style={{ width: "45vw", height: "35vw", left: "15%", bottom: "10%", background: "radial-gradient(ellipse, rgba(99, 102, 241, 0.25) 0%, transparent 70%)" }} />
        <div className="absolute bottom-0 left-0 right-0 h-80 pointer-events-none opacity-50" style={{ background: "radial-gradient(ellipse 75% 100% at 50% 100%, rgba(254, 217, 92, 0.2) 0%, transparent 100%)", filter: "blur(40px)" }} />
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
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-medium tracking-tight text-white leading-tight">
            Share Your <br className="hidden sm:block" />
            <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Experience
            </span>
          </h1>
          <p className="text-base sm:text-lg text-slate-300 max-w-lg font-medium leading-relaxed">
            Your feedback helps us make The Next Decade Hackathon even better for future participants.
          </p>
          {alreadySubmitted && (
            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl px-4 py-3 text-emerald-300 text-sm font-medium">
              <CheckCircle className="w-4 h-4 inline mr-2" />
              You have already submitted feedback. You can update it below.
            </div>
          )}
        </div>

        {/* Right side: form card */}
        <div className="w-full lg:w-1/2 max-w-xl mx-auto lg:mx-0 mt-8 lg:mt-0">
          <div className="ei-card">
            <div className="p-5 sm:p-8 md:p-10 space-y-6">
              <div className="space-y-1.5">
                <h2 className="text-2xl font-medium text-white tracking-tight">Hackathon Feedback</h2>
                <p className="text-sm text-slate-400 font-medium">
                  {participantName ? `Hello, ${participantName}! ` : ""}Tell us what you thought.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* What did you get out of this event? */}
                <div className="space-y-1.5">
                  <Label htmlFor="event_takeaways" className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                    What did you get out of this 3-month event?
                  </Label>
                  <Textarea
                    id="event_takeaways"
                    name="event_takeaways"
                    rows={3}
                    placeholder="Skills, connections, insights, anything..."
                    value={form.event_takeaways}
                    onChange={handleChange}
                    className="ei-input resize-none py-3"
                  />
                </div>

                {/* Mentorship rating */}
                <div className="space-y-2">
                  <Label className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                    How good was the mentorship?
                  </Label>
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => handleRatingClick(star)}
                        className="p-1 transition-transform hover:scale-110"
                        aria-label={`Rate ${star} stars`}
                      >
                        <Star
                          className={`w-6 h-6 ${
                            star <= form.mentorship_rating
                              ? "text-yellow-400 fill-yellow-400"
                              : "text-slate-600"
                          }`}
                        />
                      </button>
                    ))}
                    <span className="ml-2 text-sm text-slate-400">
                      {form.mentorship_rating > 0 ? `${form.mentorship_rating}/5` : "Tap to rate"}
                    </span>
                  </div>
                </div>

                {/* Can make social change */}
                <div className="space-y-2">
                  <Label className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                    Do you feel like you can actually make a change in society in the future?
                  </Label>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => handleBooleanToggle("can_make_social_change")}
                      className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-medium transition-all border ${
                        form.can_make_social_change === true
                          ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-300"
                          : "bg-white/5 border-white/10 text-slate-400 hover:bg-white/10"
                      }`}
                    >
                      Yes
                    </button>
                    <button
                      type="button"
                      onClick={() => handleBooleanToggle("can_make_social_change")}
                      className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-medium transition-all border ${
                        form.can_make_social_change === false
                          ? "bg-red-500/20 border-red-500/50 text-red-300"
                          : "bg-white/5 border-white/10 text-slate-400 hover:bg-white/10"
                      }`}
                    >
                      No
                    </button>
                  </div>
                </div>

                {/* Would do again */}
                <div className="space-y-2">
                  <Label className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                    Would you want to do something like this again?
                  </Label>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => handleBooleanToggle("would_do_again")}
                      className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-medium transition-all border ${
                        form.would_do_again === true
                          ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-300"
                          : "bg-white/5 border-white/10 text-slate-400 hover:bg-white/10"
                      }`}
                    >
                      Yes
                    </button>
                    <button
                      type="button"
                      onClick={() => handleBooleanToggle("would_do_again")}
                      className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-medium transition-all border ${
                        form.would_do_again === false
                          ? "bg-red-500/20 border-red-500/50 text-red-300"
                          : "bg-white/5 border-white/10 text-slate-400 hover:bg-white/10"
                      }`}
                    >
                      No
                    </button>
                  </div>
                </div>

                {/* How can we make it better? */}
                <div className="space-y-1.5">
                  <Label htmlFor="improvement_suggestions" className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                    How can we make it better?
                  </Label>
                  <Textarea
                    id="improvement_suggestions"
                    name="improvement_suggestions"
                    rows={3}
                    placeholder="Be honest — we want to improve..."
                    value={form.improvement_suggestions}
                    onChange={handleChange}
                    className="ei-input resize-none py-3"
                  />
                </div>

                {/* Divider */}
                <div className="border-t border-white/10 pt-4">
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-3">
                    Follow-up Opportunities
                  </p>

                  {/* Want a call */}
                  <label className="flex items-start gap-3 p-3 rounded-xl bg-white/5 border border-white/10 cursor-pointer hover:bg-white/10 transition-colors mb-3">
                    <input
                      type="checkbox"
                      checked={form.wants_call}
                      onChange={() => handleCheckboxToggle("wants_call")}
                      className="mt-0.5 w-4 h-4 accent-blue-500"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 text-sm text-white font-medium">
                        <Phone className="w-4 h-4 text-blue-400" />
                        Want a call from us
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        We will use the phone number on your profile to reach out.
                      </p>
                    </div>
                  </label>

                  {/* Test new product */}
                  <label className="flex items-start gap-3 p-3 rounded-xl bg-white/5 border border-white/10 cursor-pointer hover:bg-white/10 transition-colors mb-3">
                    <input
                      type="checkbox"
                      checked={form.wants_product_beta}
                      onChange={() => handleCheckboxToggle("wants_product_beta")}
                      className="mt-0.5 w-4 h-4 accent-purple-500"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 text-sm text-white font-medium">
                        <FlaskConical className="w-4 h-4 text-purple-400" />
                        Test out our new product{gradeNote}
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        A future planning tool with community, job market intelligence, practical experience, hands-on working, and mentorship.
                      </p>
                    </div>
                  </label>

                  {/* Continue mentorship */}
                  <label className="flex items-start gap-3 p-3 rounded-xl bg-white/5 border border-white/10 cursor-pointer hover:bg-white/10 transition-colors">
                    <input
                      type="checkbox"
                      checked={form.wants_continue_mentorship}
                      onChange={() => handleCheckboxToggle("wants_continue_mentorship")}
                      className="mt-0.5 w-4 h-4 accent-pink-500"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 text-sm text-white font-medium">
                        <HeartHandshake className="w-4 h-4 text-pink-400" />
                        Continue developing your project with PassionSeed mentorship
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Keep building with guidance from our team using your existing login.
                      </p>
                    </div>
                  </label>
                </div>

                <div className="pt-2">
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="ei-button-dawn w-full h-12 md:h-14 text-base md:text-lg"
                  >
                    {isSubmitting ? (
                      <span className="flex items-center gap-2">
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Submitting...
                      </span>
                    ) : (
                      <>
                        <span>{alreadySubmitted ? "Update Feedback" : "Submit Feedback"}</span>
                        <Send className="w-4 h-4" />
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
