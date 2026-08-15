// Type-only import: erased at build time, so this does not create a runtime
// cycle with `lib/dm-leads/playbook.ts` (which imports `DmConversation` here).
import type { DmLeadBucket, FieldCoverage } from "@/lib/dm-leads/playbook";

export type DmPlatform = "instagram" | "facebook";

export type DmLeadStage = "unknown" | "exploring" | "building" | "job_seeking";

/** Admin-managed pipeline status — distinct from the auto-classified stage. */
export type DmLeadStatus =
  | "new"
  | "contacted"
  | "qualified"
  | "converted"
  | "lost"
  | "spam";

export type DmMessageDirection = "inbound" | "outbound";

export type DmMessageSenderType = "lead" | "admin" | "ai_draft";

export type DmMessageType = "text" | "attachment" | "quick_reply" | "postback" | "system";

export type DmMessageSendStatus = "pending" | "sent" | "delivered" | "read" | "failed";

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
  has_hands_on_experience: boolean;
  wants_pathlab: boolean;
  pathlab_pay_ready: boolean;
  wants_community: boolean;
  wants_talent: boolean;
  classified_at: string | null;
  last_message_at: string;
  last_message_direction: DmMessageDirection | null;
  starred: boolean;
  admin_tags: string[];
  follow_up_at: string | null;
  lead_status: DmLeadStatus;
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
  message_type: DmMessageType;
  metadata: Record<string, unknown>;
  send_status: DmMessageSendStatus | null;
  delivered_at: string | null;
  read_at: string | null;
  sent_at: string;
  created_at: string;
  dm_message_attachments?: DmMessageAttachment[];
  dm_message_reactions?: DmMessageReaction[];
}

export interface DmMessageAttachment {
  id: string;
  message_id: string;
  attachment_type: string;
  position: number;
  source_url: string | null;
  title: string | null;
  payload: Record<string, unknown>;
  created_at: string;
}

export interface DmMessageReaction {
  id: string;
  message_id: string | null;
  target_platform_message_id: string;
  actor_platform_user_id: string;
  reaction: string | null;
  reacted_at: string;
  created_at: string;
  updated_at: string;
}

export interface DmConversationWithMessages extends DmConversation {
  dm_messages: DmMessage[];
}

/**
 * A conversation with its playbook classification already applied, so the UI
 * never has to reclassify (and never disagrees with the bucket counts).
 * Structurally a `DmConversation`, so it can be passed anywhere one is expected.
 */
export interface DmConversationWithBucket extends DmConversation {
  /** Derived from dm_messages, not stored on dm_conversations. */
  last_inbound_message_at: string | null;
  bucket: DmLeadBucket;
  coverage: FieldCoverage;
}

export interface DmLeadClassification {
  gradeLevel: string | null;
  interests: string[];
  activitiesSummary: string;
  stage: DmLeadStage;
  recommendedProduct: string;
  hasHandsOnExperience: boolean;
  wantsPathlab: boolean;
  pathlabPayReady: boolean;
  wantsCommunity: boolean;
  wantsTalent: boolean;
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
  has_hands_on_experience: boolean;
  wants_pathlab: boolean;
  pathlab_pay_ready: boolean;
  wants_community: boolean;
  wants_talent: boolean;
  classified_at: string | null;
  replied_at: string | null;
  commented_at: string;
  created_at: string;
  updated_at: string;
}
