/**
 * Backfills DM conversation history from the Graph API — this sees messages
 * sent by ANY tool through the account's inbox (including a third-party
 * automation), not just what our webhook received. Run: pnpm backfill:dm-conversations
 */
import { listInstagramConversations, getConversationMessages } from "../lib/meta/graph";
import { recordBackfilledMessage, applyClassification } from "../lib/supabase/dm-leads";
import { classifyConversationText } from "../lib/meta/classify";
import { sleep, withRetry } from "./lib/rate-limit-retry";

const IG_USER_ID = process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID;
if (!IG_USER_ID) {
  console.error("Missing INSTAGRAM_BUSINESS_ACCOUNT_ID env var");
  process.exit(1);
}

async function main() {
  const conversations = await listInstagramConversations(IG_USER_ID!);
  console.log(`Found ${conversations.length} conversations.`);

  let totalMessages = 0;
  for (const convo of conversations) {
    const participant = convo.participants?.data.find((p) => p.id !== IG_USER_ID);
    if (!participant) {
      console.log(`  ${convo.id}: no non-page participant, skipping`);
      continue;
    }

    try {
      const messages = await withRetry(() => getConversationMessages(convo.id));
      await sleep(300); // pace requests so we don't re-trigger the rate limit

      let conversationId: string | null = null;
      const inboundBodies: string[] = [];
      for (const msg of messages) {
        if (!msg.message) continue; // media-only messages have no text

        const direction = msg.from?.id === IG_USER_ID ? "outbound" : "inbound";
        conversationId = await recordBackfilledMessage({
          platform: "instagram",
          platformThreadId: participant.id,
          platformUserId: participant.id,
          username: participant.username ?? null,
          direction,
          body: msg.message,
          platformMessageId: msg.id,
          sentAt: msg.created_time,
        });
        if (direction === "inbound") inboundBodies.push(msg.message);
        totalMessages += 1;
      }

      if (conversationId && inboundBodies.length > 0) {
        const classification = classifyConversationText(inboundBodies);
        await applyClassification(conversationId, classification);
      }

      console.log(`  ${convo.id} (${participant.username ?? participant.id}): ${messages.length} messages`);
    } catch (error) {
      console.error(`  skipped conversation ${convo.id}:`, error instanceof Error ? error.message : error);
    }
  }

  console.log(`Backfilled ${totalMessages} messages across ${conversations.length} conversations.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
