import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { classifyConversation } from "./classification.ts";
import {
  listComments,
  listConversations,
  listMedia,
  listMessages,
  type MetaConfig,
  MetaRequestError,
} from "./meta-client.ts";

export interface DirectBackfillConfig extends MetaConfig {
  supabaseUrl: string;
  supabaseServiceRoleKey: string;
  timeBudgetMs?: number;
}

export interface SectionResult {
  completed: number;
  failed: number;
  remaining: number;
  stoppedReason: "done" | "deadline" | "rate_limited";
}

export interface DirectBackfillResult {
  dm: SectionResult;
  comments: SectionResult;
}

type BackfillSource = "instagram_conversation" | "instagram_media";

function clientFor(config: DirectBackfillConfig): SupabaseClient {
  return createClient(config.supabaseUrl, config.supabaseServiceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

async function completedIds(
  client: SupabaseClient,
  source: BackfillSource,
): Promise<Set<string>> {
  const { data, error } = await client
    .from("meta_backfill_state")
    .select("external_id")
    .eq("source", source)
    .eq("status", "completed")
    .limit(10_000);
  if (error) throw new Error("supabase_state_read_failed");
  return new Set((data ?? []).map((row) => row.external_id as string));
}

async function existingParticipantIds(
  client: SupabaseClient,
): Promise<Set<string>> {
  const { data, error } = await client
    .from("dm_conversations")
    .select("platform_user_id")
    .eq("platform", "instagram")
    .not("platform_user_id", "is", null)
    .limit(10_000);
  if (error) throw new Error("supabase_conversation_read_failed");
  return new Set(
    (data ?? []).map((row) => row.platform_user_id as string),
  );
}

async function markState(
  client: SupabaseClient,
  source: BackfillSource,
  externalId: string,
  status: "completed" | "failed",
  errorCode: string | null = null,
): Promise<void> {
  const { error } = await client.from("meta_backfill_state").upsert({
    source,
    external_id: externalId,
    status,
    attempts: 1,
    last_error_code: errorCode,
    processed_at: status === "completed" ? new Date().toISOString() : null,
    updated_at: new Date().toISOString(),
  }, { onConflict: "source,external_id" });
  if (error) throw new Error("supabase_state_write_failed");
}

async function persistConversation(
  client: SupabaseClient,
  config: DirectBackfillConfig,
  graphConversationId: string,
  participant: { id: string; username?: string },
  deadline: number,
): Promise<void> {
  const messages = await listMessages(config, graphConversationId, deadline);
  const textMessages = messages.filter((message) => Boolean(message.message));
  if (textMessages.length === 0) return;

  const last = textMessages.at(-1)!;
  const { data: conversation, error: conversationError } = await client
    .from("dm_conversations")
    .upsert({
      platform: "instagram",
      platform_thread_id: participant.id,
      platform_user_id: participant.id,
      username: participant.username ?? null,
      last_message_at: last.created_time,
      last_message_direction: last.from?.id === config.instagramAccountId
        ? "outbound"
        : "inbound",
    }, { onConflict: "platform,platform_thread_id" })
    .select("id")
    .single();
  if (conversationError || !conversation) {
    throw new Error("supabase_conversation_upsert_failed");
  }

  const rows = textMessages.map((message) => ({
    conversation_id: conversation.id,
    direction: message.from?.id === config.instagramAccountId
      ? "outbound"
      : "inbound",
    sender_type: message.from?.id === config.instagramAccountId
      ? "admin"
      : "lead",
    body: message.message!,
    platform_message_id: message.id,
    message_type: "text",
    sent_at: message.created_time,
  }));
  const { error: messageError } = await client
    .from("dm_messages")
    .upsert(rows, {
      onConflict: "platform_message_id",
      ignoreDuplicates: true,
    });
  if (messageError) throw new Error("supabase_message_upsert_failed");

  const inbound = textMessages
    .filter((message) => message.from?.id !== config.instagramAccountId)
    .map((message) => message.message!);
  if (inbound.length === 0) return;
  const classification = classifyConversation(inbound);
  const { error: classificationError } = await client.from("dm_conversations")
    .update({
      grade_level: classification.gradeLevel,
      interests: classification.interests,
      activities_summary: classification.activitiesSummary,
      stage: classification.stage,
      recommended_product: classification.recommendedProduct,
      has_hands_on_experience: classification.hasHandsOnExperience,
      wants_pathlab: classification.wantsPathlab,
      pathlab_pay_ready: classification.pathlabPayReady,
      wants_community: classification.wantsCommunity,
      wants_talent: classification.wantsTalent,
      classified_at: new Date().toISOString(),
    }).eq("id", conversation.id);
  if (classificationError) {
    throw new Error("supabase_classification_update_failed");
  }
}

async function persistMediaComments(
  client: SupabaseClient,
  config: DirectBackfillConfig,
  mediaId: string,
  deadline: number,
): Promise<void> {
  const comments = await listComments(config, mediaId, deadline);
  for (const comment of comments) {
    if (!comment.text) continue;
    const classification = classifyConversation([comment.text]);
    const { error } = await client.from("ig_comments").upsert({
      ig_comment_id: comment.id,
      media_id: mediaId,
      parent_comment_id: comment.parent_id ?? null,
      username: comment.from?.username ?? comment.username ?? null,
      ig_user_id: comment.from?.id ?? null,
      text: comment.text,
      commented_at: comment.timestamp,
      grade_level: classification.gradeLevel,
      stage: classification.stage,
      recommended_product: classification.recommendedProduct,
      has_hands_on_experience: classification.hasHandsOnExperience,
      wants_pathlab: classification.wantsPathlab,
      pathlab_pay_ready: classification.pathlabPayReady,
      wants_community: classification.wantsCommunity,
      wants_talent: classification.wantsTalent,
      classified_at: new Date().toISOString(),
    }, { onConflict: "ig_comment_id" });
    if (error) throw new Error("supabase_comment_upsert_failed");
  }
}

async function runItems(
  client: SupabaseClient,
  source: BackfillSource,
  ids: string[],
  deadline: number,
  process: (id: string) => Promise<void>,
): Promise<SectionResult> {
  const done = await completedIds(client, source);
  const pending = ids.filter((id) => !done.has(id));
  let completed = 0;
  let failed = 0;
  for (const id of pending) {
    if (Date.now() >= deadline) {
      return {
        completed,
        failed,
        remaining: pending.length - completed - failed,
        stoppedReason: "deadline",
      };
    }
    try {
      await process(id);
      await markState(client, source, id, "completed");
      completed++;
    } catch (error) {
      if (
        error instanceof MetaRequestError && error.code === "batch_deadline"
      ) {
        return {
          completed,
          failed,
          remaining: pending.length - completed - failed,
          stoppedReason: "deadline",
        };
      }
      if (error instanceof MetaRequestError && error.rateLimited) {
        return {
          completed,
          failed,
          remaining: pending.length - completed - failed,
          stoppedReason: "rate_limited",
        };
      }
      const code = error instanceof Error
        ? error.message.slice(0, 80)
        : "unknown_error";
      await markState(client, source, id, "failed", code).catch(() =>
        undefined
      );
      failed++;
    }
  }
  return { completed, failed, remaining: 0, stoppedReason: "done" };
}

export async function runDirectBackfill(
  config: DirectBackfillConfig,
): Promise<DirectBackfillResult> {
  const client = clientFor(config);
  const deadline = Date.now() + (config.timeBudgetMs ?? 8 * 60_000);
  let conversations: Awaited<ReturnType<typeof listConversations>>;
  try {
    conversations = await listConversations(config, deadline);
  } catch (error) {
    if (error instanceof MetaRequestError && error.rateLimited) {
      const rateLimited: SectionResult = {
        completed: 0,
        failed: 0,
        remaining: -1,
        stoppedReason: "rate_limited",
      };
      return { dm: rateLimited, comments: rateLimited };
    }
    throw error;
  }
  const knownParticipants = await existingParticipantIds(client);
  const pendingConversations = conversations.filter((conversation) => {
    const participant = conversation.participants?.data.find((row) =>
      row.id !== config.instagramAccountId
    );
    return participant && !knownParticipants.has(participant.id);
  });
  const conversationById = new Map(
    pendingConversations.map((conversation) => [conversation.id, conversation]),
  );
  const dm = await runItems(
    client,
    "instagram_conversation",
    pendingConversations.map((conversation) => conversation.id),
    deadline,
    async (id) => {
      const conversation = conversationById.get(id)!;
      const participant = conversation.participants?.data.find((row) =>
        row.id !== config.instagramAccountId
      );
      if (!participant) return;
      await persistConversation(client, config, id, participant, deadline);
    },
  );

  if (Date.now() >= deadline || dm.stoppedReason === "rate_limited") {
    return {
      dm,
      comments: {
        completed: 0,
        failed: 0,
        remaining: -1,
        stoppedReason: dm.stoppedReason,
      },
    };
  }

  let media: Awaited<ReturnType<typeof listMedia>>;
  try {
    media = await listMedia(config, deadline);
  } catch (error) {
    if (error instanceof MetaRequestError && error.rateLimited) {
      return {
        dm,
        comments: {
          completed: 0,
          failed: 0,
          remaining: -1,
          stoppedReason: "rate_limited",
        },
      };
    }
    throw error;
  }
  const comments = await runItems(
    client,
    "instagram_media",
    media.map((item) => item.id),
    deadline,
    (id) => persistMediaComments(client, config, id, deadline),
  );
  return { dm, comments };
}
