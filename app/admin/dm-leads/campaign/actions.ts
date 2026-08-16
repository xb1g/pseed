"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin/requireAdmin";
import {
  buildCampaign,
  getPendingCampaignTarget,
  getCampaignQueue,
  markTargetSent,
  skipTarget,
} from "@/lib/supabase/dm-campaigns";
import { sendCampaignReply } from "@/lib/supabase/dm-leads";
import { consecutiveOutboundTail } from "@/lib/dm-leads/send-gate";

/**
 * Delay between auto-sends.
 *
 * Not a Graph API rate-limit workaround — it is well under Meta's ceiling. It
 * exists because a burst of identical-cadence messages from one account is the
 * pattern automated-behaviour detection looks for, and because it leaves a
 * window in which a human can hit stop.
 */
const AUTO_SEND_DELAY_MS = 3_000;

/** Hard ceiling per invocation, so a runaway queue cannot empty itself unattended. */
const AUTO_SEND_MAX = 25;

export async function buildCampaignAction(name: string) {
  await requireAdmin();
  try {
    const result = await buildCampaign(name.trim() || "sweep");
    revalidatePath("/admin/dm-leads/campaign");
    return { ok: true, result, error: null };
  } catch (error) {
    console.error("buildCampaignAction failed:", error);
    return {
      ok: false,
      result: null,
      error: error instanceof Error ? error.message : "Failed to build campaign",
    };
  }
}

export async function sendCampaignTargetAction(input: {
  targetId: string;
  conversationId: string;
  campaignId: string;
  variant: string;
  body: string;
}) {
  await requireAdmin();
  try {
    const target = await getPendingCampaignTarget(input.targetId, input.campaignId);
    if (!target || target.conversation_id !== input.conversationId) {
      return { ok: false, error: "Campaign target is no longer pending" };
    }

    const { messageId } = await sendCampaignReply(
      target.conversation_id,
      input.body,
      { campaignId: input.campaignId, variant: target.variant }
    );
    await markTargetSent(input.targetId, messageId);
    revalidatePath("/admin/dm-leads/campaign");
    return { ok: true, error: null };
  } catch (error) {
    console.error("sendCampaignTargetAction failed:", error);
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Failed to send",
    };
  }
}

export async function skipCampaignTargetAction(targetId: string, reason: string) {
  await requireAdmin();
  try {
    await skipTarget(targetId, reason);
    revalidatePath("/admin/dm-leads/campaign");
    return { ok: true, error: null };
  } catch (error) {
    console.error("skipCampaignTargetAction failed:", error);
    return { ok: false, error: "Failed to skip" };
  }
}

/**
 * Sends the batch that already cleared the gate.
 *
 * Re-reads the queue from the database rather than trusting a client-supplied
 * list: this is the one path that sends without a human looking at each
 * message, so the set it sends must be the set the server itself gated.
 *
 * Stops at the first failure. A failing send usually means the token expired or
 * a window closed, and both of those make every subsequent send in the batch
 * wrong too.
 */
export async function runAutoSendAction(campaignId: string) {
  await requireAdmin();

  let sent = 0;
  const errors: string[] = [];

  try {
    const queue = await getCampaignQueue(campaignId, "auto");
    const batch = queue.slice(0, AUTO_SEND_MAX);

    for (const target of batch) {
      const body = target.draft_body?.trim();
      if (!body) {
        await skipTarget(target.id, "empty draft");
        continue;
      }

      try {
        const { messageId } = await sendCampaignReply(target.conversation_id, body, {
          campaignId,
          variant: target.variant,
          auto: {
            rung: target.rung,
            bucket: target.bucket,
            consecutiveOutbound: consecutiveOutboundTail(target.recent_turns),
          },
        });
        await markTargetSent(target.id, messageId);
        sent += 1;
      } catch (error) {
        const message = error instanceof Error ? error.message : "send failed";
        errors.push(`${target.username ?? target.conversation_id}: ${message}`);
        break;
      }

      await new Promise((resolve) => setTimeout(resolve, AUTO_SEND_DELAY_MS));
    }

    revalidatePath("/admin/dm-leads/campaign");
    return {
      ok: errors.length === 0,
      sent,
      remaining: Math.max(0, queue.length - sent),
      errors,
      error: null,
    };
  } catch (error) {
    console.error("runAutoSendAction failed:", error);
    return {
      ok: false,
      sent,
      remaining: 0,
      errors,
      error: error instanceof Error ? error.message : "Auto-send failed",
    };
  }
}
