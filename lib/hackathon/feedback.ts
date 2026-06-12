import { z } from "zod";

export const feedbackVersions = ["future_path", "project_growth"] as const;
export const takeawayIds = [
  "new_skills",
  "project_experience",
  "social_understanding",
  "mentor",
  "community",
  "confidence",
  "future_direction",
  "other",
] as const;
export const socialChangeIds = [
  "much_more",
  "more",
  "same",
  "less",
] as const;
export const mentorHelpIds = [
  "technical",
  "project_development",
  "social_impact",
  "teamwork",
  "pitching",
  "career",
  "other",
] as const;
export const projectStageIds = [
  "idea",
  "prototype",
  "mvp",
  "real_world_test",
  "continuing",
] as const;
export const interestIds = ["yes", "maybe", "no"] as const;
export const futureEventInterestIds = ["definitely", "maybe", "no"] as const;
export const learningIssueIds = [
  "hard_to_understand",
  "too_long",
  "more_examples",
  "unclear_steps",
  "app_difficult",
  "already_good",
] as const;
export const followUpInterestIds = [
  "future_path",
  "mentor_future",
  "youth_opportunities",
  "project_launch",
  "mentor_match",
  "future_opportunities",
] as const;
export const contactTopicIds = [
  "continue_project",
  "mentorship",
  "future_direction",
  "future_opportunities",
  "other",
] as const;

const ratingSchema = z.number().int().min(1).max(5);

export const hackathonFeedbackSchema = z
  .object({
    overall_rating: ratingSchema,
    top_takeaways: z.array(z.enum(takeawayIds)).min(1).max(3),
    other_takeaway: z.string().trim().max(300),
    social_change_confidence: z.enum(socialChangeIds),
    had_mentorship: z.boolean(),
    mentorship_rating: ratingSchema.nullable(),
    mentor_help_area: z.enum(mentorHelpIds).nullable(),
    other_mentor_help: z.string().trim().max(300),
    project_stage: z.enum(projectStageIds),
    project_continuation_interest: z.enum(interestIds),
    ongoing_mentorship_interest: z.enum(interestIds),
    future_event_interest: z.enum(futureEventInterestIds),
    improvement_suggestions: z.string().trim().max(1000),
    learning_content_rating: ratingSchema,
    learning_content_issues: z.array(z.enum(learningIssueIds)).min(1).max(3),
    learning_content_feedback: z.string().trim().max(1000),
    future_path_uncertain: z.boolean().nullable(),
    follow_up_interests: z.array(z.enum(followUpInterestIds)).max(3),
    wants_contact: z.boolean(),
    contact_name: z.string().trim().max(120),
    contact_topics: z.array(z.enum(contactTopicIds)).max(5),
    other_contact_topic: z.string().trim().max(300),
  })
  .superRefine((data, context) => {
    if (data.top_takeaways.includes("other") && !data.other_takeaway) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["other_takeaway"],
        message: "กรุณาระบุสิ่งที่คุณได้รับ",
      });
    }

    if (
      data.had_mentorship &&
      (!data.mentorship_rating || !data.mentor_help_area)
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["mentorship_rating"],
        message: "กรุณาตอบคำถามเกี่ยวกับ Mentorship",
      });
    }

    if (
      data.had_mentorship &&
      data.mentor_help_area === "other" &&
      !data.other_mentor_help
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["other_mentor_help"],
        message: "กรุณาระบุสิ่งที่ Mentor ช่วย",
      });
    }

    if (!data.wants_contact) return;

    if (!data.contact_name) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["contact_name"],
        message: "กรุณากรอกชื่อสำหรับติดต่อกลับ",
      });
    }

    if (data.contact_topics.length === 0) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["contact_topics"],
        message: "กรุณาเลือกเรื่องที่อยากพูดคุย",
      });
    }

    if (
      data.contact_topics.includes("other") &&
      !data.other_contact_topic
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["other_contact_topic"],
        message: "กรุณาระบุเรื่องที่อยากพูดคุย",
      });
    }
  });

export type FeedbackVersion = (typeof feedbackVersions)[number];
export type HackathonFeedbackInput = z.infer<typeof hackathonFeedbackSchema>;

type FeedbackParticipantSource = {
  id?: string;
  name?: string | null;
  grade_level?: string | null;
  is_admin?: boolean;
};

export function getFeedbackParticipant(
  participant: FeedbackParticipantSource | null | undefined
) {
  if (!participant?.id || participant.is_admin) return null;

  return {
    name: participant.name ?? "",
    grade_level: participant.grade_level ?? "",
  };
}

export function getFeedbackVersion(gradeLevel: string): FeedbackVersion {
  const normalizedGrade = gradeLevel.trim().replace(/\s+/g, "");
  return /^ม\.[3-5]$/.test(normalizedGrade)
    ? "future_path"
    : "project_growth";
}

export function buildFeedbackRecord(
  feedback: HackathonFeedbackInput,
  participant: { id: string; grade_level: string }
) {
  const feedbackVersion = getFeedbackVersion(participant.grade_level);
  const allowedFollowUps =
    feedbackVersion === "future_path"
      ? new Set(["future_path", "mentor_future", "youth_opportunities"])
      : new Set([
          "future_path",
          "project_launch",
          "mentor_match",
          "future_opportunities",
        ]);
  const followUpInterests = feedback.follow_up_interests.filter((interest) =>
    allowedFollowUps.has(interest)
  );

  return {
    participant_id: participant.id,
    feedback_version: feedbackVersion,
    overall_rating: feedback.overall_rating,
    top_takeaways: feedback.top_takeaways,
    other_takeaway: feedback.top_takeaways.includes("other")
      ? feedback.other_takeaway
      : null,
    social_change_confidence: feedback.social_change_confidence,
    had_mentorship: feedback.had_mentorship,
    mentorship_rating: feedback.had_mentorship
      ? feedback.mentorship_rating
      : null,
    mentor_help_area: feedback.had_mentorship
      ? feedback.mentor_help_area
      : null,
    other_mentor_help:
      feedback.had_mentorship && feedback.mentor_help_area === "other"
        ? feedback.other_mentor_help
        : null,
    project_stage: feedback.project_stage,
    project_continuation_interest: feedback.project_continuation_interest,
    ongoing_mentorship_interest: feedback.ongoing_mentorship_interest,
    future_event_interest: feedback.future_event_interest,
    improvement_suggestions: feedback.improvement_suggestions || null,
    learning_content_rating: feedback.learning_content_rating,
    learning_content_issues: feedback.learning_content_issues,
    learning_content_feedback: feedback.learning_content_feedback || null,
    future_path_uncertain:
      feedbackVersion === "future_path"
        ? feedback.future_path_uncertain
        : null,
    follow_up_interests: followUpInterests,
    wants_contact: feedback.wants_contact,
    contact_name: feedback.wants_contact ? feedback.contact_name : null,
    contact_topics: feedback.wants_contact ? feedback.contact_topics : [],
    other_contact_topic:
      feedback.wants_contact && feedback.contact_topics.includes("other")
        ? feedback.other_contact_topic
        : null,
    can_make_social_change: ["much_more", "more"].includes(
      feedback.social_change_confidence
    ),
    would_do_again:
      feedback.future_event_interest === "maybe"
        ? null
        : feedback.future_event_interest === "definitely",
    wants_call: feedback.wants_contact,
    wants_product_beta: followUpInterests.includes("future_path"),
    wants_continue_mentorship:
      feedback.ongoing_mentorship_interest === "yes" ||
      followUpInterests.some((interest) =>
        ["mentor_future", "mentor_match"].includes(interest)
      ),
    updated_at: new Date().toISOString(),
  };
}
