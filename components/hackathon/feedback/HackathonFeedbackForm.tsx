"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Clock3,
  Send,
  Sparkles,
} from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { FeedbackChoice } from "./FeedbackChoice";
import { FeedbackRating } from "./FeedbackRating";
import { FeedbackSection } from "./FeedbackSection";
import { FollowUpOpportunity } from "./FollowUpOpportunity";
import {
  contactTopicOptions,
  futureEventOptions,
  getFollowUpOpportunities,
  interestOptions,
  learningIssueOptions,
  mentorHelpOptions,
  mentorshipInterestOptions,
  projectStageOptions,
  socialChangeOptions,
  takeawayOptions,
} from "./feedback-options";
import {
  getFeedbackVersion,
  hackathonFeedbackSchema,
  type HackathonFeedbackInput,
} from "@/lib/hackathon/feedback";

type FeedbackDraft = {
  overall_rating: number;
  top_takeaways: string[];
  other_takeaway: string;
  social_change_confidence: string;
  had_mentorship: boolean | null;
  mentorship_rating: number;
  mentor_help_area: string;
  other_mentor_help: string;
  project_stage: string;
  project_continuation_interest: string;
  ongoing_mentorship_interest: string;
  future_event_interest: string;
  improvement_suggestions: string;
  learning_content_rating: number;
  learning_content_issues: string[];
  learning_content_feedback: string;
  future_path_uncertain: boolean | null;
  follow_up_interests: string[];
  wants_contact: boolean;
  contact_name: string;
  contact_topics: string[];
  other_contact_topic: string;
};

type StoredFeedback = Partial<HackathonFeedbackInput> & {
  can_make_social_change?: boolean | null;
  would_do_again?: boolean | null;
  wants_call?: boolean;
  wants_product_beta?: boolean;
  wants_continue_mentorship?: boolean;
};

type HackathonFeedbackFormProps = {
  participantName: string;
  participantGrade: string;
  initialFeedback?: StoredFeedback | null;
  alreadySubmitted: boolean;
  isSubmitting: boolean;
  onSubmit: (feedback: HackathonFeedbackInput) => Promise<void>;
};

const SECTION_COUNT = 3;

function createInitialDraft(
  participantName: string,
  version: ReturnType<typeof getFeedbackVersion>,
  stored?: StoredFeedback | null
): FeedbackDraft {
  const legacyFollowUps = [
    stored?.wants_product_beta && "future_path",
    stored?.wants_continue_mentorship && "mentor_match",
  ].filter(Boolean) as string[];

  return {
    overall_rating: stored?.overall_rating ?? 0,
    top_takeaways: stored?.top_takeaways ?? [],
    other_takeaway: stored?.other_takeaway ?? "",
    social_change_confidence:
      stored?.social_change_confidence ??
      (stored?.can_make_social_change === true
        ? "more"
        : stored?.can_make_social_change === false
          ? "same"
          : ""),
    had_mentorship:
      stored?.had_mentorship ??
      (stored?.mentorship_rating ? true : null),
    mentorship_rating: stored?.mentorship_rating ?? 0,
    mentor_help_area: stored?.mentor_help_area ?? "",
    other_mentor_help: stored?.other_mentor_help ?? "",
    project_stage: stored?.project_stage ?? "",
    project_continuation_interest:
      stored?.project_continuation_interest ?? "",
    ongoing_mentorship_interest: stored?.ongoing_mentorship_interest ?? "",
    future_event_interest:
      stored?.future_event_interest ??
      (stored?.would_do_again === true
        ? "definitely"
        : stored?.would_do_again === false
          ? "no"
          : ""),
    improvement_suggestions: stored?.improvement_suggestions ?? "",
    learning_content_rating: stored?.learning_content_rating ?? 0,
    learning_content_issues: stored?.learning_content_issues ?? [],
    learning_content_feedback: stored?.learning_content_feedback ?? "",
    future_path_uncertain:
      version === "future_path"
        ? (stored?.future_path_uncertain ?? null)
        : null,
    follow_up_interests: stored?.follow_up_interests ?? legacyFollowUps,
    wants_contact: stored?.wants_contact ?? stored?.wants_call ?? false,
    contact_name:
      stored?.contact_name ??
      (stored?.wants_call ? participantName : ""),
    contact_topics:
      stored?.contact_topics ??
      (stored?.wants_call ? ["other"] : []),
    other_contact_topic: stored?.other_contact_topic ?? "",
  };
}

function Question({
  id,
  title,
  hint,
  children,
}: {
  id: string;
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div id={id} tabIndex={-1} className="scroll-mt-28 space-y-3 outline-none">
      <div>
        <h3 className="font-[family-name:var(--font-bai-jamjuree)] text-base font-semibold leading-7 text-slate-100">
          {title}
        </h3>
        {hint && (
          <p className="mt-0.5 font-[family-name:var(--font-bai-jamjuree)] text-xs leading-5 text-slate-500">
            {hint}
          </p>
        )}
      </div>
      {children}
    </div>
  );
}

export function HackathonFeedbackForm({
  participantName,
  participantGrade,
  initialFeedback,
  alreadySubmitted,
  isSubmitting,
  onSubmit,
}: HackathonFeedbackFormProps) {
  const prefersReducedMotion = useReducedMotion();
  const version = getFeedbackVersion(participantGrade);
  const [section, setSection] = useState(0);
  const [error, setError] = useState("");
  const [draft, setDraft] = useState<FeedbackDraft>(() =>
    createInitialDraft(participantName, version, initialFeedback)
  );
  const opportunities = useMemo(
    () => getFollowUpOpportunities(version),
    [version]
  );

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
    const buttons = document.querySelectorAll(".ei-button-dawn");
    buttons.forEach((button) => observer.observe(button));
    return () => observer.disconnect();
  }, []);

  const updateDraft = <K extends keyof FeedbackDraft>(
    field: K,
    value: FeedbackDraft[K]
  ) => {
    setDraft((current) => ({ ...current, [field]: value }));
    setError("");
  };

  const toggleLimited = (
    field:
      | "top_takeaways"
      | "learning_content_issues"
      | "follow_up_interests"
      | "contact_topics",
    value: string,
    limit: number
  ) => {
    const currentValues = draft[field];
    if (currentValues.includes(value)) {
      updateDraft(
        field,
        currentValues.filter((item) => item !== value)
      );
      return;
    }
    if (currentValues.length >= limit) {
      setError(`เลือกได้ไม่เกิน ${limit} ข้อ`);
      return;
    }
    updateDraft(field, [...currentValues, value]);
  };

  const showValidationError = (message: string, targetId: string) => {
    setError(message);
    requestAnimationFrame(() => {
      const target = document.getElementById(targetId);
      target?.scrollIntoView({ behavior: "smooth", block: "center" });
      target?.focus({ preventScroll: true });
    });
    return false;
  };

  const validateSection = (sectionIndex: number) => {
    if (sectionIndex === 0) {
      if (!draft.overall_rating) {
        return showValidationError("กรุณาให้คะแนนโครงการ", "overall-rating");
      }
      if (draft.top_takeaways.length === 0) {
        return showValidationError(
          "เลือกอย่างน้อย 1 สิ่งที่คุณได้รับ",
          "takeaways"
        );
      }
      if (
        draft.top_takeaways.includes("other") &&
        !draft.other_takeaway.trim()
      ) {
        return showValidationError(
          "กรุณาระบุสิ่งที่คุณได้รับ",
          "other-takeaway"
        );
      }
      if (!draft.social_change_confidence) {
        return showValidationError(
          "กรุณาเลือกว่าความมั่นใจของคุณเปลี่ยนไปอย่างไร",
          "social-change"
        );
      }
    }

    if (sectionIndex === 1) {
      if (draft.had_mentorship === null) {
        return showValidationError(
          "กรุณาเลือกว่าคุณได้รับ Mentorship หรือไม่",
          "had-mentorship"
        );
      }
      if (draft.had_mentorship && !draft.mentorship_rating) {
        return showValidationError(
          "กรุณาให้คะแนน Mentorship",
          "mentorship-rating"
        );
      }
      if (draft.had_mentorship && !draft.mentor_help_area) {
        return showValidationError(
          "เลือกสิ่งที่ Mentor ช่วยได้มากที่สุด",
          "mentor-help"
        );
      }
      if (
        draft.had_mentorship &&
        draft.mentor_help_area === "other" &&
        !draft.other_mentor_help.trim()
      ) {
        return showValidationError(
          "กรุณาระบุสิ่งที่ Mentor ช่วย",
          "other-mentor-help"
        );
      }
      if (!draft.project_stage) {
        return showValidationError(
          "กรุณาเลือกสถานะโปรเจกต์ปัจจุบัน",
          "project-stage"
        );
      }
      if (!draft.project_continuation_interest) {
        return showValidationError(
          "กรุณาเลือกว่าทีมอยากพัฒนาโปรเจกต์ต่อหรือไม่",
          "project-continuation"
        );
      }
      if (!draft.learning_content_rating) {
        return showValidationError(
          "กรุณาให้คะแนนเนื้อหาในแอป",
          "learning-rating"
        );
      }
      if (draft.learning_content_issues.length === 0) {
        return showValidationError(
          "เลือกอย่างน้อย 1 ความคิดเห็นเกี่ยวกับเนื้อหา",
          "learning-issues"
        );
      }
    }

    if (sectionIndex === 2) {
      if (!draft.ongoing_mentorship_interest) {
        return showValidationError(
          "กรุณาเลือกความสนใจ Mentorship ต่อเนื่อง",
          "ongoing-mentorship"
        );
      }
      if (!draft.future_event_interest) {
        return showValidationError(
          "กรุณาเลือกความสนใจกิจกรรมในอนาคต",
          "future-event"
        );
      }
      if (
        version === "future_path" &&
        draft.future_path_uncertain === null
      ) {
        return showValidationError(
          "กรุณาตอบคำถามเรื่องเส้นทางในอนาคต",
          "future-path"
        );
      }
      if (draft.wants_contact && !draft.contact_name.trim()) {
        return showValidationError(
          "กรุณากรอกชื่อสำหรับติดต่อกลับ",
          "contact-name"
        );
      }
      if (draft.wants_contact && draft.contact_topics.length === 0) {
        return showValidationError(
          "เลือกอย่างน้อย 1 เรื่องที่อยากพูดคุย",
          "contact-topics"
        );
      }
      if (
        draft.wants_contact &&
        draft.contact_topics.includes("other") &&
        !draft.other_contact_topic.trim()
      ) {
        return showValidationError(
          "กรุณาระบุเรื่องที่อยากพูดคุย",
          "other-contact-topic"
        );
      }
    }

    setError("");
    return true;
  };

  const goNext = () => {
    if (!validateSection(section)) return;
    setSection((current) => Math.min(current + 1, SECTION_COUNT - 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const goBack = () => {
    setError("");
    setSection((current) => Math.max(current - 1, 0));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const submit = async () => {
    if (!validateSection(2)) return;

    const parsed = hackathonFeedbackSchema.safeParse({
      ...draft,
      mentorship_rating: draft.had_mentorship
        ? draft.mentorship_rating
        : null,
      mentor_help_area: draft.had_mentorship
        ? draft.mentor_help_area
        : null,
      other_mentor_help: draft.had_mentorship
        ? draft.other_mentor_help
        : "",
    });
    if (!parsed.success) {
      setError("ยังมีบางคำตอบไม่ครบ กรุณาตรวจสอบอีกครั้ง");
      return;
    }

    await onSubmit(parsed.data);
  };

  const sectionContent = [
    <FeedbackSection
      key="experience"
      eyebrow="ช่วงที่ 1 จาก 3"
      title="ประสบการณ์ที่ได้"
      description="ตอบจากความรู้สึกจริง ไม่มีคำตอบถูกหรือผิด"
    >
      <div className="space-y-8">
        <Question id="overall-rating" title="โดยรวม คุณพอใจกับโครงการแค่ไหน?">
          <FeedbackRating
            label="ความพึงพอใจโดยรวมต่อโครงการ"
            value={draft.overall_rating}
            onChange={(value) => updateDraft("overall_rating", value)}
          />
        </Question>

        <Question
          id="takeaways"
          title="คุณได้รับอะไรจากโครงการนี้มากที่สุด?"
          hint={`เลือกได้สูงสุด 3 ข้อ · เลือกแล้ว ${draft.top_takeaways.length}/3`}
        >
          <div className="grid gap-2 sm:grid-cols-2">
            {takeawayOptions.map((option) => (
              <FeedbackChoice
                key={option.id}
                selected={draft.top_takeaways.includes(option.id)}
                disabled={
                  draft.top_takeaways.length >= 3 &&
                  !draft.top_takeaways.includes(option.id)
                }
                onClick={() => toggleLimited("top_takeaways", option.id, 3)}
              >
                {option.label}
              </FeedbackChoice>
            ))}
          </div>
          {draft.top_takeaways.includes("other") && (
            <input
              id="other-takeaway"
              value={draft.other_takeaway}
              maxLength={300}
              onChange={(event) =>
                updateDraft("other_takeaway", event.target.value)
              }
              placeholder="พิมพ์สิ่งที่คุณได้รับ..."
              className="ei-input mt-3 min-h-12"
            />
          )}
        </Question>

        <Question
          id="social-change"
          title="หลังจบโครงการ คุณรู้สึกว่าสร้างการเปลี่ยนแปลงเชิงบวกต่อสังคมได้มากขึ้นไหม?"
        >
          <div className="grid gap-2 sm:grid-cols-2">
            {socialChangeOptions.map((option) => (
              <FeedbackChoice
                key={option.id}
                selected={draft.social_change_confidence === option.id}
                onClick={() =>
                  updateDraft("social_change_confidence", option.id)
                }
              >
                {option.label}
              </FeedbackChoice>
            ))}
          </div>
        </Question>
      </div>
    </FeedbackSection>,

    <FeedbackSection
      key="learning"
      eyebrow="ช่วงที่ 2 จาก 3"
      title="Mentor, โปรเจกต์ และการเรียนในแอป"
      description="คำตอบส่วนนี้ช่วยให้เราปรับสิ่งที่ผู้เข้าร่วมใช้จริง"
    >
      <div className="space-y-8">
        <Question
          id="had-mentorship"
          title="ระหว่างโครงการ คุณได้พูดคุยหรือรับคำแนะนำจาก Mentor ไหม?"
        >
          <div className="grid gap-2 sm:grid-cols-2">
            <FeedbackChoice
              selected={draft.had_mentorship === true}
              onClick={() => updateDraft("had_mentorship", true)}
            >
              ได้รับคำแนะนำจาก Mentor
            </FeedbackChoice>
            <FeedbackChoice
              selected={draft.had_mentorship === false}
              onClick={() => {
                setDraft((current) => ({
                  ...current,
                  had_mentorship: false,
                  mentorship_rating: 0,
                  mentor_help_area: "",
                  other_mentor_help: "",
                }));
                setError("");
              }}
            >
              ไม่ได้คุย หรือไม่มี Mentorship
            </FeedbackChoice>
          </div>
        </Question>

        {draft.had_mentorship && (
          <>
            <Question
              id="mentorship-rating"
              title="Mentorship ที่ได้รับมีประโยชน์แค่ไหน?"
            >
              <FeedbackRating
                label="ประโยชน์ของ Mentorship"
                value={draft.mentorship_rating}
                onChange={(value) => updateDraft("mentorship_rating", value)}
              />
            </Question>

            <Question
              id="mentor-help"
              title="Mentor ช่วยทีมได้มากที่สุดเรื่องอะไร?"
            >
              <div className="grid gap-2 sm:grid-cols-2">
                {mentorHelpOptions.map((option) => (
                  <FeedbackChoice
                    key={option.id}
                    selected={draft.mentor_help_area === option.id}
                    onClick={() => updateDraft("mentor_help_area", option.id)}
                  >
                    {option.label}
                  </FeedbackChoice>
                ))}
              </div>
              {draft.mentor_help_area === "other" && (
                <input
                  id="other-mentor-help"
                  value={draft.other_mentor_help}
                  maxLength={300}
                  onChange={(event) =>
                    updateDraft("other_mentor_help", event.target.value)
                  }
                  placeholder="Mentor ช่วยเรื่อง..."
                  className="ei-input mt-3 min-h-12"
                />
              )}
            </Question>
          </>
        )}

        <Question id="project-stage" title="ตอนนี้โปรเจกต์ของทีมอยู่ขั้นไหน?">
          <div className="grid gap-2">
            {projectStageOptions.map((option) => (
              <FeedbackChoice
                key={option.id}
                selected={draft.project_stage === option.id}
                onClick={() => updateDraft("project_stage", option.id)}
              >
                {option.label}
              </FeedbackChoice>
            ))}
          </div>
        </Question>

        <Question id="project-continuation" title="ทีมอยากพัฒนาโปรเจกต์ต่อไหม?">
          <div className="grid gap-2 sm:grid-cols-3">
            {interestOptions.map((option) => (
              <FeedbackChoice
                key={option.id}
                selected={
                  draft.project_continuation_interest === option.id
                }
                onClick={() =>
                  updateDraft("project_continuation_interest", option.id)
                }
              >
                {option.label}
              </FeedbackChoice>
            ))}
          </div>
        </Question>

        <div className="rounded-2xl border border-blue-300/15 bg-blue-400/[0.06] p-4 sm:p-5">
          <div className="mb-6 flex items-start gap-3">
            <span className="mt-0.5 rounded-xl bg-blue-300/10 p-2 text-blue-200">
              <Sparkles className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <h3 className="font-[family-name:var(--font-bai-jamjuree)] text-base font-semibold text-white">
                เนื้อหาการเรียนรู้ในแอป
              </h3>
              <p className="mt-1 font-[family-name:var(--font-bai-jamjuree)] text-xs leading-5 text-slate-400">
                หมายถึงกิจกรรม คำอธิบาย ตัวอย่าง และขั้นตอนที่ใช้ทำโปรเจกต์
              </p>
            </div>
          </div>

          <div className="space-y-7">
            <Question id="learning-rating" title="เนื้อหาช่วยให้ทีมทำโปรเจกต์ต่อได้แค่ไหน?">
              <FeedbackRating
                label="ประโยชน์ของเนื้อหาการเรียนรู้ในแอป"
                value={draft.learning_content_rating}
                onChange={(value) =>
                  updateDraft("learning_content_rating", value)
                }
              />
            </Question>

            <Question
              id="learning-issues"
              title="ส่วนไหนควรปรับ?"
              hint={`เลือกได้สูงสุด 3 ข้อ · เลือกแล้ว ${draft.learning_content_issues.length}/3`}
            >
              <div className="grid gap-2 sm:grid-cols-2">
                {learningIssueOptions.map((option) => (
                  <FeedbackChoice
                    key={option.id}
                    selected={draft.learning_content_issues.includes(option.id)}
                    disabled={
                      draft.learning_content_issues.length >= 3 &&
                      !draft.learning_content_issues.includes(option.id)
                    }
                    onClick={() =>
                      toggleLimited("learning_content_issues", option.id, 3)
                    }
                  >
                    {option.label}
                  </FeedbackChoice>
                ))}
              </div>
            </Question>

            <Question
              id="learning-feedback"
              title="มีเนื้อหาหรือฟีเจอร์อะไรที่อยากให้เพิ่มหรือปรับ?"
              hint="ไม่บังคับ · เขียนสั้น ๆ ได้เลย"
            >
              <Textarea
                value={draft.learning_content_feedback}
                maxLength={1000}
                rows={3}
                onChange={(event) =>
                  updateDraft("learning_content_feedback", event.target.value)
                }
                placeholder="เช่น อยากเห็นตัวอย่างงานจริงก่อนเริ่มแต่ละกิจกรรม..."
                className="ei-input min-h-24 resize-none py-3"
              />
            </Question>
          </div>
        </div>
      </div>
    </FeedbackSection>,

    <FeedbackSection
      key="next"
      eyebrow="ช่วงที่ 3 จาก 3"
      title="ก้าวต่อไปของคุณ"
      description="บอกเราว่าอะไรจะช่วยให้สิ่งที่เริ่มไว้ไปต่อได้จริง"
    >
      <div className="space-y-8">
        <Question id="ongoing-mentorship" title="ถ้ามี Mentorship ต่อเนื่อง คุณสนใจไหม?">
          <div className="grid gap-2 sm:grid-cols-3">
            {mentorshipInterestOptions.map((option) => (
              <FeedbackChoice
                key={option.id}
                selected={
                  draft.ongoing_mentorship_interest === option.id
                }
                onClick={() =>
                  updateDraft("ongoing_mentorship_interest", option.id)
                }
              >
                {option.label}
              </FeedbackChoice>
            ))}
          </div>
        </Question>

        <Question id="future-event" title="คุณอยากเข้าร่วมกิจกรรมแบบนี้อีกไหม?">
          <div className="grid gap-2 sm:grid-cols-3">
            {futureEventOptions.map((option) => (
              <FeedbackChoice
                key={option.id}
                selected={draft.future_event_interest === option.id}
                onClick={() =>
                  updateDraft("future_event_interest", option.id)
                }
              >
                {option.label}
              </FeedbackChoice>
            ))}
          </div>
        </Question>

        {version === "future_path" && (
          <Question
            id="future-path"
            title="ตอนนี้คุณยังไม่แน่ใจเรื่องเส้นทางเรียนหรืออาชีพในอนาคตใช่ไหม?"
          >
            <div className="grid gap-2 sm:grid-cols-2">
              <FeedbackChoice
                selected={draft.future_path_uncertain === true}
                onClick={() => updateDraft("future_path_uncertain", true)}
              >
                ใช่ ยังอยากลองค้นหาตัวเอง
              </FeedbackChoice>
              <FeedbackChoice
                selected={draft.future_path_uncertain === false}
                onClick={() => updateDraft("future_path_uncertain", false)}
              >
                ไม่ ตอนนี้มีทิศทางค่อนข้างชัดแล้ว
              </FeedbackChoice>
            </div>
          </Question>
        )}

        <Question
          id="improvement"
          title="ถ้าให้เลือกปรับหนึ่งอย่าง คุณอยากให้เราปรับอะไรที่สุด?"
          hint="ไม่บังคับ · คำตอบตรง ๆ ช่วยเราได้มากที่สุด"
        >
          <Textarea
            value={draft.improvement_suggestions}
            maxLength={1000}
            rows={3}
            onChange={(event) =>
              updateDraft("improvement_suggestions", event.target.value)
            }
            placeholder="เช่น เพิ่มเวลา Mentor, ลดงานบางช่วง, ทำโจทย์ให้ชัดขึ้น..."
            className="ei-input min-h-24 resize-none py-3"
          />
        </Question>

        <div className="space-y-4 border-t border-white/10 pt-7">
          <div>
            <h3 className="font-[family-name:var(--font-kodchasan)] text-xl font-semibold text-white">
              {version === "project_growth"
                ? "หลังจบโครงการ คุณอยากไปต่อแบบไหน?"
                : "มีโอกาสไหนที่ช่วยคุณได้จริง?"}
            </h3>
            <p className="mt-1 font-[family-name:var(--font-bai-jamjuree)] text-sm leading-6 text-slate-400">
              {version === "project_growth"
                ? "แต่ละตัวเลือกให้ความช่วยเหลือคนละแบบ เลือกได้สูงสุด 3 ข้อ หรือข้ามได้"
                : "เลือกได้สูงสุด 3 ข้อ หรือข้ามได้ เราจะใช้เพื่อออกแบบโอกาสต่อไป"}
            </p>
          </div>
          <div className="space-y-3">
            {opportunities.map((opportunity) => (
              <FollowUpOpportunity
                key={opportunity.id}
                {...opportunity}
                selected={draft.follow_up_interests.includes(opportunity.id)}
                onClick={() =>
                  toggleLimited("follow_up_interests", opportunity.id, 3)
                }
              />
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4 sm:p-5">
          <FeedbackChoice
            selected={draft.wants_contact}
            onClick={() => updateDraft("wants_contact", !draft.wants_contact)}
            className="border-0 bg-transparent px-0 py-1 hover:bg-transparent"
          >
            <span className="block">
              <span className="block text-base text-white">
                อยากให้ทีม PassionSeed ติดต่อกลับ
              </span>
              <span className="mt-1 block text-xs font-normal leading-5 text-slate-400">
                เลือกเมื่ออยากคุยต่อจริง ๆ เราจะติดต่อเฉพาะเรื่องที่คุณเลือก
              </span>
            </span>
          </FeedbackChoice>

          <AnimatePresence initial={false}>
            {draft.wants_contact && (
              <motion.div
                initial={
                  prefersReducedMotion
                    ? { opacity: 0 }
                    : { opacity: 0, height: 0, y: -8 }
                }
                animate={{ opacity: 1, height: "auto", y: 0 }}
                exit={
                  prefersReducedMotion
                    ? { opacity: 0 }
                    : { opacity: 0, height: 0, y: -8 }
                }
                className="overflow-hidden"
              >
                <div className="space-y-5 pt-5">
                  <Question id="contact-name" title="ชื่อสำหรับติดต่อกลับ">
                    <input
                      value={draft.contact_name}
                      maxLength={120}
                      onChange={(event) =>
                        updateDraft("contact_name", event.target.value)
                      }
                      placeholder="ชื่อที่อยากให้เราเรียก"
                      className="ei-input min-h-12"
                    />
                  </Question>

                  <Question
                    id="contact-topics"
                    title="อยากคุยเรื่องอะไร?"
                    hint="เลือกได้มากกว่า 1 ข้อ"
                  >
                    <div className="grid gap-2 sm:grid-cols-2">
                      {contactTopicOptions.map((option) => (
                        <FeedbackChoice
                          key={option.id}
                          selected={draft.contact_topics.includes(option.id)}
                          onClick={() =>
                            toggleLimited("contact_topics", option.id, 5)
                          }
                        >
                          {option.label}
                        </FeedbackChoice>
                      ))}
                    </div>
                    {draft.contact_topics.includes("other") && (
                      <input
                        id="other-contact-topic"
                        value={draft.other_contact_topic}
                        maxLength={300}
                        onChange={(event) =>
                          updateDraft(
                            "other_contact_topic",
                            event.target.value
                          )
                        }
                        placeholder="อยากคุยเรื่อง..."
                        className="ei-input mt-3 min-h-12"
                      />
                    )}
                  </Question>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </FeedbackSection>,
  ];

  return (
    <div className="mx-auto w-full max-w-2xl">
      <div className="mb-5 flex items-center justify-between gap-4 px-1 font-[family-name:var(--font-bai-jamjuree)]">
        <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
          <Clock3 className="h-4 w-4 text-indigo-300" aria-hidden="true" />
          ใช้เวลาประมาณ 3–5 นาที
        </div>
        <span className="text-xs font-semibold text-indigo-200">
          {section + 1}/{SECTION_COUNT}
        </span>
      </div>

      <div
        className="mb-6 h-1.5 overflow-hidden rounded-full bg-white/[0.07]"
        aria-label={`ความคืบหน้า ${section + 1} จาก ${SECTION_COUNT}`}
      >
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-blue-400 via-indigo-400 to-violet-400"
          animate={{ width: `${((section + 1) / SECTION_COUNT) * 100}%` }}
          transition={
            prefersReducedMotion
              ? { duration: 0 }
              : { duration: 0.45, ease: [0.05, 0.7, 0.35, 0.99] }
          }
        />
      </div>

      <div className="rounded-[24px] border border-white/10 bg-slate-950/55 p-5 shadow-[0_24px_80px_rgba(2,6,23,0.45)] backdrop-blur-xl sm:p-8">
        {alreadySubmitted && (
          <div className="mb-6 flex items-start gap-3 rounded-xl border border-emerald-300/20 bg-emerald-300/[0.07] p-3 font-[family-name:var(--font-bai-jamjuree)] text-sm leading-6 text-emerald-100">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
            <span>คุณส่งฟีดแบ็กแล้ว และสามารถอัปเดตคำตอบได้</span>
          </div>
        )}

        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={section}
            initial={
              prefersReducedMotion ? { opacity: 0 } : { opacity: 0, x: 18 }
            }
            animate={{ opacity: 1, x: 0 }}
            exit={
              prefersReducedMotion ? { opacity: 0 } : { opacity: 0, x: -12 }
            }
            transition={{ duration: prefersReducedMotion ? 0.1 : 0.24 }}
          >
            {sectionContent[section]}
          </motion.div>
        </AnimatePresence>

        {error && (
          <div
            role="alert"
            className="mt-6 rounded-xl border border-red-300/20 bg-red-400/[0.08] px-4 py-3 font-[family-name:var(--font-bai-jamjuree)] text-sm text-red-200"
          >
            {error}
          </div>
        )}

        <div className="mt-8 flex items-center gap-3 border-t border-white/10 pt-5">
          {section > 0 && (
            <button
              type="button"
              onClick={goBack}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 font-[family-name:var(--font-bai-jamjuree)] text-sm font-semibold text-slate-300 transition-colors hover:bg-white/[0.08] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring-color-dawn)]"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              ย้อนกลับ
            </button>
          )}

          {section < SECTION_COUNT - 1 ? (
            <button
              type="button"
              onClick={goNext}
              className="ei-button-dawn ml-auto min-h-12 flex-1 px-5 text-base sm:flex-none"
            >
              <span>ต่อไป</span>
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </button>
          ) : (
            <button
              type="button"
              disabled={isSubmitting}
              onClick={submit}
              className="ei-button-dawn ml-auto min-h-12 flex-1 px-5 text-base disabled:cursor-not-allowed disabled:opacity-60 sm:flex-none"
            >
              <span>
                {isSubmitting
                  ? "กำลังส่ง..."
                  : alreadySubmitted
                    ? "อัปเดตฟีดแบ็ก"
                    : "ส่งฟีดแบ็ก"}
              </span>
              {!isSubmitting && <Send className="h-4 w-4" aria-hidden="true" />}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
