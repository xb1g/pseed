/**
 * One-off backfill: pulls all historical comments across every IG post via
 * Graph API and stores them, since the webhook only sees comments posted
 * after subscription. Run: pnpm backfill:ig-comments
 */
import { listInstagramMedia, getMediaComments } from "../lib/meta/graph";
import { upsertComment, applyCommentClassification } from "../lib/supabase/ig-comments";
import { classifyConversationText } from "../lib/meta/classify";
import { sleep, withRetry } from "./lib/rate-limit-retry";

const IG_USER_ID = process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID;
if (!IG_USER_ID) {
  console.error("Missing INSTAGRAM_BUSINESS_ACCOUNT_ID env var");
  process.exit(1);
}

async function main() {
  const media = await listInstagramMedia(IG_USER_ID!);
  console.log(`Found ${media.length} media items.`);

  let total = 0;
  for (const item of media) {
    const comments = await withRetry(() => getMediaComments(item.id));
    await sleep(300); // pace requests so we don't re-trigger the rate limit
    for (const comment of comments) {
      if (!comment.text) continue; // sticker/media-only replies have no text

      try {
        const stored = await upsertComment({
          igCommentId: comment.id,
          mediaId: item.id,
          parentCommentId: comment.parent_id ?? null,
          username: comment.from?.username ?? comment.username ?? null,
          igUserId: comment.from?.id ?? null,
          text: comment.text,
          commentedAt: comment.timestamp,
        });

        const classification = classifyConversationText([stored.text]);
        await applyCommentClassification(stored.id, classification);
        total += 1;
      } catch (error) {
        console.error(`  skipped comment ${comment.id}:`, error instanceof Error ? error.message : error);
      }
    }
    console.log(`  media ${item.id}: ${comments.length} comments`);
  }

  console.log(`Backfilled ${total} comments.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
