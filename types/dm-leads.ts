export type DmPlatform = "instagram" | "facebook";

export type DmLeadStage = "unknown" | "exploring" | "building" | "job_seeking";

export type DmMessageDirection = "inbound" | "outbound";

export type DmMessageSenderType = "lead" | "admin" | "ai_draft";

export interface DmConversation {
  id: string;
  platform: DmPlatform;
  platform_thread_id: string;
  platform_user_id: string;
  username: string | null;
  display_name: string | null;
  grade_level: string | null;
  interests: string[];
  activities_summary: string | null;
  stage: DmLeadStage;
  recommended_product: string | null;
  classified_at: string | null;
  last_message_at: string;
  created_at: string;
  updated_at: string;
}

export interface DmMessage {
  id: string;
  conversation_id: string;
  direction: DmMessageDirection;
  sender_type: DmMessageSenderType;
  body: string;
  platform_message_id: string | null;
  sent_at: string;
  created_at: string;
}

export interface DmConversationWithMessages extends DmConversation {
  dm_messages: DmMessage[];
}

export interface DmLeadClassification {
  gradeLevel: string | null;
  interests: string[];
  activitiesSummary: string;
  stage: DmLeadStage;
  recommendedProduct: string;
}

export interface IgComment {
  id: string;
  ig_comment_id: string;
  media_id: string;
  parent_comment_id: string | null;
  username: string | null;
  ig_user_id: string | null;
  text: string;
  grade_level: string | null;
  stage: DmLeadStage;
  recommended_product: string | null;
  classified_at: string | null;
  replied_at: string | null;
  commented_at: string;
  created_at: string;
  updated_at: string;
}
