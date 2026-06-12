import type {
  FeedbackVersion,
  HackathonFeedbackInput,
} from "@/lib/hackathon/feedback";

type Option<T extends string> = {
  id: T;
  label: string;
};

export const takeawayOptions: Option<
  HackathonFeedbackInput["top_takeaways"][number]
>[] = [
  { id: "new_skills", label: "ทักษะใหม่" },
  { id: "project_experience", label: "ประสบการณ์ทำโปรเจกต์จริง" },
  { id: "social_understanding", label: "เข้าใจปัญหาสังคมมากขึ้น" },
  { id: "mentor", label: "คำแนะนำจาก Mentor" },
  { id: "community", label: "เพื่อนและ Community" },
  { id: "confidence", label: "ความมั่นใจในตัวเอง" },
  { id: "future_direction", label: "เห็นเส้นทางอนาคตชัดขึ้น" },
  { id: "other", label: "อื่น ๆ" },
];

export const socialChangeOptions: Option<
  HackathonFeedbackInput["social_change_confidence"]
>[] = [
  { id: "much_more", label: "มากขึ้นมาก" },
  { id: "more", label: "มากขึ้น" },
  { id: "same", label: "เท่าเดิม" },
  { id: "less", label: "น้อยลง" },
];

export const mentorHelpOptions: Option<
  NonNullable<HackathonFeedbackInput["mentor_help_area"]>
>[] = [
  { id: "technical", label: "ด้านเทคนิค" },
  { id: "project_development", label: "พัฒนาโปรเจกต์" },
  { id: "social_impact", label: "สร้าง Social Impact" },
  { id: "teamwork", label: "การทำงานเป็นทีม" },
  { id: "pitching", label: "การ Pitch" },
  { id: "career", label: "คำแนะนำด้านอาชีพ" },
  { id: "other", label: "อื่น ๆ" },
];

export const projectStageOptions: Option<
  HackathonFeedbackInput["project_stage"]
>[] = [
  { id: "idea", label: "ยังเป็นไอเดีย" },
  { id: "prototype", label: "มี Prototype" },
  { id: "mvp", label: "มี MVP ที่ใช้งานได้" },
  { id: "real_world_test", label: "กำลังทดลองกับผู้ใช้จริง" },
  { id: "continuing", label: "พัฒนาต่อหลังจบโครงการแล้ว" },
];

export const interestOptions: Option<
  HackathonFeedbackInput["project_continuation_interest"]
>[] = [
  { id: "yes", label: "ใช่ อยากไปต่อ" },
  { id: "maybe", label: "อาจจะ ถ้ามีตัวช่วย" },
  { id: "no", label: "ยังไม่ใช่ตอนนี้" },
];

export const mentorshipInterestOptions: Option<
  HackathonFeedbackInput["ongoing_mentorship_interest"]
>[] = [
  { id: "yes", label: "สนใจ" },
  { id: "maybe", label: "อาจจะ" },
  { id: "no", label: "ยังไม่สนใจ" },
];

export const futureEventOptions: Option<
  HackathonFeedbackInput["future_event_interest"]
>[] = [
  { id: "definitely", label: "แน่นอน" },
  { id: "maybe", label: "อาจจะ" },
  { id: "no", label: "ยังไม่สนใจ" },
];

export const learningIssueOptions: Option<
  HackathonFeedbackInput["learning_content_issues"][number]
>[] = [
  { id: "hard_to_understand", label: "บางส่วนเข้าใจยาก" },
  { id: "too_long", label: "เนื้อหายาวเกินไป" },
  { id: "more_examples", label: "อยากได้ตัวอย่างเพิ่ม" },
  { id: "unclear_steps", label: "ขั้นตอนยังไม่ชัด" },
  { id: "app_difficult", label: "ใช้งานในแอปยาก" },
  { id: "already_good", label: "ดีและใช้งานง่ายอยู่แล้ว" },
];

export const contactTopicOptions: Option<
  HackathonFeedbackInput["contact_topics"][number]
>[] = [
  { id: "continue_project", label: "พัฒนาโปรเจกต์ต่อ" },
  { id: "mentorship", label: "Mentorship" },
  { id: "future_direction", label: "วางแผนการเรียนหรืออาชีพ" },
  { id: "future_opportunities", label: "โอกาสในอนาคต" },
  { id: "other", label: "เรื่องอื่น ๆ" },
];

export type FollowUpOpportunityContent = {
  id: HackathonFeedbackInput["follow_up_interests"][number];
  title: string;
  outcome: string;
  benefit: string;
};

const productTrialOpportunity: FollowUpOpportunityContent = {
  id: "future_path",
  title: "ทดลองใช้ PassionSeed เวอร์ชันใหม่",
  outcome:
    "แพลตฟอร์มช่วยค้นหาตัวเองและวางแผนอนาคต ผ่าน Community, Career Intelligence, การลงมือทำ และ Mentorship",
  benefit: "ทดลองก่อนเปิดจริง · ใช้ฟรี · Feedback ของคุณช่วยออกแบบผลิตภัณฑ์",
};

const futurePathOpportunities: FollowUpOpportunityContent[] = [
  productTrialOpportunity,
  {
    id: "mentor_future",
    title: "คุยกับ Mentor เรื่องอนาคต",
    outcome:
      "คุยแบบมีเป้าหมายเรื่องจุดแข็ง สายเรียน และอาชีพที่น่าลองสำรวจต่อ",
    benefit: "บทสนทนา 1:1 + คำถามช่วยคิด",
  },
  {
    id: "youth_opportunities",
    title: "รับโอกาสสำหรับเยาวชน",
    outcome:
      "รู้ก่อนเมื่อมีค่าย Hackathon โปรเจกต์ หรือกิจกรรมที่ตรงกับความสนใจของคุณ",
    benefit: "คัดโอกาสที่เกี่ยวข้อง ไม่ส่งสแปม",
  },
];

const projectGrowthOpportunities: FollowUpOpportunityContent[] = [
  productTrialOpportunity,
  {
    id: "project_launch",
    title: "ลงมือพัฒนาโปรเจกต์นี้ต่อ",
    outcome:
      "สำหรับทีมที่อยากทำ Prototype หรือ MVP ต่อ และทดลองกับผู้ใช้จริงอย่างเป็นระบบ",
    benefit: "ลงมือทำเป็น Sprint + เป้าหมายรายสัปดาห์",
  },
  {
    id: "mentor_match",
    title: "ขอคำปรึกษาเฉพาะเรื่อง",
    outcome:
      "นำคำถามหรือจุดที่ติดอยู่มาคุยกับผู้เชี่ยวชาญ เช่น Product, Tech, Impact, Pitch หรือ Career",
    benefit: "Expert clinic 1:1 ครั้งเดียว · ไม่ต้องเข้าโปรแกรมต่อ",
  },
  {
    id: "future_opportunities",
    title: "รับข่าวกิจกรรมและโอกาสใหม่",
    outcome:
      "รู้เมื่อมี Hackathon, Showcase, Internship หรือกิจกรรม PassionSeed ที่เหมาะกับคุณ",
    benefit: "ไม่ผูกกับโปรเจกต์นี้ · เลือกเข้าร่วมภายหลัง",
  },
];

export function getFollowUpOpportunities(
  version: FeedbackVersion
): FollowUpOpportunityContent[] {
  return version === "future_path"
    ? futurePathOpportunities
    : projectGrowthOpportunities;
}
