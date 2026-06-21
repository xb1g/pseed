"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  MessageSquareHeart,
  Sparkles,
  X,
} from "lucide-react";
import { HackathonFeedbackForm } from "@/components/hackathon/feedback/HackathonFeedbackForm";
import { FeedbackSuccessState } from "@/components/hackathon/feedback/FeedbackSuccessState";
import {
  getFeedbackParticipant,
  type HackathonFeedbackInput,
} from "@/lib/hackathon/feedback";

type Toast = {
  type: "error";
  message: string;
};

type SubmissionSummary = {
  wantsContact: boolean;
  hasFollowUpInterests: boolean;
};

export default function HackathonFeedbackPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [participantName, setParticipantName] = useState("");
  const [participantGrade, setParticipantGrade] = useState("");
  const [storedFeedback, setStoredFeedback] = useState<Record<string, unknown> | null>(null);
  const [toast, setToast] = useState<Toast | null>(null);
  const [submissionSummary, setSubmissionSummary] = useState<SubmissionSummary | null>(null);

  // Guest fields
  const [nickname, setNickname] = useState("");
  const [teamName, setTeamName] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadFeedback() {
      try {
        const participantResponse = await fetch("/api/hackathon/me");
        if (participantResponse.ok) {
          const participantPayload = await participantResponse.json();
          const feedbackParticipant = getFeedbackParticipant(participantPayload.participant);
          if (feedbackParticipant) {
            if (!cancelled) {
              setIsLoggedIn(true);
              setParticipantName(feedbackParticipant.name);
              setParticipantGrade(feedbackParticipant.grade_level);
            }

            const feedbackResponse = await fetch("/api/hackathon/feedback");
            if (feedbackResponse.ok) {
              const feedbackPayload = await feedbackResponse.json();
              if (!cancelled) setStoredFeedback(feedbackPayload.data || null);
            }
          }
        }
      } catch {
        // Not logged in — that's fine, show guest form
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    loadFeedback();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timeout = window.setTimeout(() => setToast(null), 5000);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  const submitFeedback = async (feedback: HackathonFeedbackInput) => {
    if (!isLoggedIn && !nickname.trim()) {
      setToast({ type: "error", message: "Please enter your nickname" });
      return;
    }

    setIsSubmitting(true);
    try {
      let response: Response;

      if (isLoggedIn) {
        // Authenticated submit
        response = await fetch("/api/hackathon/feedback", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(feedback),
        });
      } else {
        // Public submit
        response = await fetch("/api/hackathon/feedback/public", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            nickname: nickname.trim(),
            team_name: teamName.trim(),
            feedback,
          }),
        });
      }

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to submit feedback");
      }

      setStoredFeedback(result.data);
      setToast(null);
      setSubmissionSummary({
        wantsContact: feedback.wants_contact,
        hasFollowUpInterests: feedback.follow_up_interests.length > 0,
      });
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (error) {
      setToast({
        type: "error",
        message: error instanceof Error ? error.message : "Failed to submit. Please try again.",
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
            role="alert"
            className="fixed left-1/2 top-4 z-50 flex w-[calc(100%-2rem)] max-w-md -translate-x-1/2 items-start gap-3 rounded-xl border border-red-300/25 bg-red-950/90 px-4 py-3 font-[family-name:var(--font-bai-jamjuree)] text-sm text-red-100 shadow-2xl backdrop-blur-xl"
          >
            <X className="mt-0.5 h-5 w-5 shrink-0" />
            <span className="flex-1 leading-6">{toast.message}</span>
            <button
              type="button"
              onClick={() => setToast(null)}
              aria-label="Close"
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
            {submissionSummary
              ? "Thank you for your feedback!"
              : "Help us make the next one even better"}
          </h1>
          <p className="mx-auto mt-3 max-w-xl font-[family-name:var(--font-bai-jamjuree)] text-sm leading-6 text-slate-400 sm:text-base">
            {submissionSummary
              ? "Your response has been recorded."
              : "Share what worked, what could improve, and what you want to see next."}
          </p>
        </header>

        {isLoading ? (
          <LoadingState />
        ) : submissionSummary ? (
          <FeedbackSuccessState
            wantsContact={submissionSummary.wantsContact}
            hasFollowUpInterests={submissionSummary.hasFollowUpInterests}
            onDashboard={() => window.location.href = "/hackathon/dashboard"}
            onEdit={() => {
              setSubmissionSummary(null);
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
          />
        ) : (
          <>
            {/* Nickname + Team name for guests */}
            {!isLoggedIn && (
              <div className="mx-auto mb-6 max-w-2xl rounded-[20px] border border-white/10 bg-slate-950/50 p-5 backdrop-blur-xl sm:p-6">
                <div className="flex items-center gap-2 mb-4">
                  <MessageSquareHeart className="h-5 w-5 text-indigo-300" />
                  <h2 className="font-[family-name:var(--font-bai-jamjuree)] text-sm font-bold text-white/80">
                    Tell us who you are
                  </h2>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block font-[family-name:var(--font-bai-jamjuree)] text-xs font-semibold text-slate-400">
                      Nickname <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={nickname}
                      onChange={(e) => setNickname(e.target.value)}
                      placeholder="Your nickname"
                      maxLength={120}
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 font-[family-name:var(--font-bai-jamjuree)] text-sm text-white placeholder:text-slate-500 outline-none transition-colors focus:border-indigo-400/50 focus:bg-white/[0.07]"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block font-[family-name:var(--font-bai-jamjuree)] text-xs font-semibold text-slate-400">
                      Team name
                    </label>
                    <input
                      type="text"
                      value={teamName}
                      onChange={(e) => setTeamName(e.target.value)}
                      placeholder="Your team name (optional)"
                      maxLength={120}
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 font-[family-name:var(--font-bai-jamjuree)] text-sm text-white placeholder:text-slate-500 outline-none transition-colors focus:border-indigo-400/50 focus:bg-white/[0.07]"
                    />
                  </div>
                </div>
              </div>
            )}

            <HackathonFeedbackForm
              participantName={isLoggedIn ? participantName : nickname || "Participant"}
              participantGrade={isLoggedIn ? participantGrade : ""}
              initialFeedback={storedFeedback}
              alreadySubmitted={Boolean(storedFeedback)}
              isSubmitting={isSubmitting}
              onSubmit={submitFeedback}
            />
          </>
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
